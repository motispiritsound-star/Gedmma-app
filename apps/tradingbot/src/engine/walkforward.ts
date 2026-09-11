import type { RiskLimits } from '../risk/risk.js';
import type { StrategyFactory } from '../strategy/types.js';
import type { Candle, CostModel, EquityPoint, Interval } from '../types.js';
import { runBacktest } from './backtest.js';
import { computeMetrics, type Metrics } from './metrics.js';

export interface WalkForwardOptions {
  candles: readonly Candle[];
  factory: StrategyFactory<never>;
  interval: Interval;
  startingCash: number;
  /** How many train/test pairs to cut the history into. */
  folds: number;
  /** Fraction of each fold used for choosing parameters. The rest is the test. */
  trainFraction: number;
  /**
   * Bars dropped from the end of each training window, so training and testing do
   * not overlap through the strategy's own lookback. Defaults to the longest
   * warm-up in the grid; see `makeFolds`.
   */
  embargoBars?: number;
  costs?: CostModel;
  limits?: RiskLimits;
}

export interface FoldRange {
  index: number;
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
}

/**
 * Cut a series into consecutive train/test pairs, with a gap between them.
 *
 * The folds do not overlap and the test window always follows its own training
 * window, which is the only arrangement that answers the question a backtest is
 * asked. Shuffling bars or using plain k-fold cross-validation here — as people do
 * when they treat a price series like a pile of independent rows — trains on the
 * future and is worth nothing.
 *
 * `embargoBars` is the part that was missing, and the field treats it as standard:
 * purging and embargoing, from López de Prado. Even with train strictly before
 * test, the two are not independent. A strategy with a hundred-bar lookback,
 * evaluated on the first test bar, is reading ninety-nine bars that were in the
 * training set — and serial correlation carries the rest. Dropping the last
 * `embargoBars` of each training window opens a gap that neither side sees, which
 * costs training data and buys an out-of-sample number that is actually out of
 * sample. Set it to the strategy's lookback; `runWalkForward` does that by default.
 */
export function makeFolds(
  length: number,
  folds: number,
  trainFraction: number,
  embargoBars = 0,
): FoldRange[] {
  if (folds < 1) throw new Error('Need at least one fold');
  if (trainFraction <= 0 || trainFraction >= 1) throw new Error('trainFraction must be in (0, 1)');
  if (embargoBars < 0 || !Number.isFinite(embargoBars)) {
    throw new Error(`embargoBars must be a non-negative number, got ${embargoBars}`);
  }
  const foldSize = Math.floor(length / folds);
  if (foldSize < 50) {
    throw new Error(
      `${length} bars across ${folds} folds is ${foldSize} bars per fold — ` +
        `too few to choose parameters from. Use more history or fewer folds.`,
    );
  }

  const out: FoldRange[] = [];
  for (let f = 0; f < folds; f += 1) {
    const start = f * foldSize;
    const end = f === folds - 1 ? length : start + foldSize;
    const splitAt = start + Math.floor((end - start) * trainFraction);
    const trainEnd = splitAt - Math.floor(embargoBars);
    if (trainEnd - start < 30 || end - splitAt < 10) continue;
    out.push({ index: f, trainStart: start, trainEnd, testStart: splitAt, testEnd: end });
  }
  if (out.length === 0) {
    throw new Error(
      `No fold survived an embargo of ${embargoBars} bars: every training window ` +
        `shrank below the 30-bar floor. Use more history, fewer folds, or a strategy ` +
        `with a shorter lookback.`,
    );
  }
  return out;
}

export interface Fold {
  index: number;
  trainFrom: number;
  trainTo: number;
  testFrom: number;
  testTo: number;
  /** The parameters that won in-sample, as JSON, so a report can print them. */
  chosen: string;
  strategyName: string;
  inSampleReturn: number;
  outOfSampleReturn: number;
  outOfSampleTrades: number;
}

export interface WalkForwardResult {
  folds: Fold[];
  /** Bars withheld between each train and test window. */
  embargoBars: number;
  /** The out-of-sample equity curve, stitched across folds. */
  curve: EquityPoint[];
  metrics: Metrics;
  /** How often the winning parameters changed between folds. */
  parameterChanges: number;
}

/**
 * Choose parameters on one stretch of history, then measure on the next.
 *
 * This is the most useful thing in the repository, and the least fun to look at.
 * A plain backtest lets you try parameters until the curve is pretty, then
 * reports the curve — which tells you nothing, because you chose the parameters
 * *after* seeing the data. A walk-forward chooses them before, fold by fold, and
 * reports only what happened next. The out-of-sample number it prints is almost
 * always dramatically worse than the in-sample one, and the gap between them is
 * the size of the self-deception.
 *
 * If the out-of-sample result here is not good, nothing downstream will fix it.
 */
export function runWalkForward(options: WalkForwardOptions): WalkForwardResult {
  const { candles, factory, interval, startingCash, folds, trainFraction } = options;

  // The longest warm-up in the grid is the window through which training leaks,
  // so that is the default embargo rather than an arbitrary constant.
  const embargoBars =
    options.embargoBars ??
    Math.max(0, ...factory.grid.map((params) => factory.create(params).warmupBars));
  const ranges = makeFolds(candles.length, folds, trainFraction, embargoBars);

  const results: Fold[] = [];
  const curve: EquityPoint[] = [];
  let equity = startingCash;
  let benchmark = startingCash;

  for (const range of ranges) {
    const f = range.index;
    const train = candles.slice(range.trainStart, range.trainEnd);
    const test = candles.slice(range.testStart, range.testEnd);

    let best: { params: never; metrics: Metrics; name: string } | null = null;
    for (const params of factory.grid) {
      const strategy = factory.create(params);
      const trial = runBacktest({
        candles: train,
        strategy,
        interval,
        startingCash,
        costs: options.costs,
        limits: options.limits,
      });
      // Sharpe, not return: the highest-returning parameter set in-sample is
      // usually the one that got lucky once. Trades below a floor are rejected
      // outright, because a two-trade Sharpe is not a measurement.
      const score = trial.metrics.trades >= 5 ? trial.metrics.sharpe : -Infinity;
      const bestScore = best ? (best.metrics.trades >= 5 ? best.metrics.sharpe : -Infinity) : -Infinity;
      if (best === null || score > bestScore) {
        best = { params, metrics: trial.metrics, name: strategy.name };
      }
    }
    if (!best) continue;

    // Each fold starts with the equity the previous one ended on, but with a
    // fresh risk manager: the drawdown high-water mark resets at the fold
    // boundary. That models re-tuning and redeploying a strategy every few
    // months, which is what a walk-forward describes. It also means the kill
    // switch here is more forgiving than it would be on a bot left running, so
    // read the per-fold drawdowns rather than only the stitched one.
    const oos = runBacktest({
      candles: test,
      strategy: factory.create(best.params),
      interval,
      startingCash: equity,
      costs: options.costs,
      limits: options.limits,
    });

    // The out-of-sample segments are chained: fold n starts with whatever fold
    // n-1 ended with, so the stitched curve compounds the way an account would.
    const firstBench = test[0]?.close ?? 1;
    for (const point of oos.curve) {
      curve.push({
        ...point,
        benchmark: benchmark * (point.price / firstBench),
      });
    }
    equity = oos.metrics.endEquity;
    benchmark = benchmark * ((test[test.length - 1]?.close ?? firstBench) / firstBench);

    results.push({
      index: f,
      trainFrom: train[0]?.openTime ?? 0,
      trainTo: train[train.length - 1]?.openTime ?? 0,
      testFrom: test[0]?.openTime ?? 0,
      testTo: test[test.length - 1]?.openTime ?? 0,
      chosen: JSON.stringify(best.params),
      strategyName: best.name,
      inSampleReturn: best.metrics.totalReturn,
      outOfSampleReturn: oos.metrics.totalReturn,
      outOfSampleTrades: oos.metrics.trades,
    });
  }

  const trades = results.reduce((sum, f) => sum + f.outOfSampleTrades, 0);
  const metrics = computeMetrics(
    curve,
    // Round trips are not stitched across folds, so the trade-level statistics
    // are reported from the fold summaries instead of recomputed here.
    [],
    interval,
    0,
    0,
  );

  let parameterChanges = 0;
  for (let i = 1; i < results.length; i += 1) {
    if (results[i]?.chosen !== results[i - 1]?.chosen) parameterChanges += 1;
  }

  return { folds: results, embargoBars, curve, metrics: { ...metrics, trades }, parameterChanges };
}

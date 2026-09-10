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
  costs?: CostModel;
  limits?: RiskLimits;
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

  if (folds < 1) throw new Error('Need at least one fold');
  if (trainFraction <= 0 || trainFraction >= 1) throw new Error('trainFraction must be in (0, 1)');
  const foldSize = Math.floor(candles.length / folds);
  if (foldSize < 50) {
    throw new Error(
      `${candles.length} candles across ${folds} folds is ${foldSize} bars per fold — ` +
        `too few to choose parameters from. Use more history or fewer folds.`,
    );
  }

  const results: Fold[] = [];
  const curve: EquityPoint[] = [];
  let equity = startingCash;
  let benchmark = startingCash;

  for (let f = 0; f < folds; f += 1) {
    const start = f * foldSize;
    const end = f === folds - 1 ? candles.length : start + foldSize;
    const splitAt = start + Math.floor((end - start) * trainFraction);
    const train = candles.slice(start, splitAt);
    const test = candles.slice(splitAt, end);
    if (train.length < 30 || test.length < 10) continue;

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

  return { folds: results, curve, metrics: { ...metrics, trades }, parameterChanges };
}

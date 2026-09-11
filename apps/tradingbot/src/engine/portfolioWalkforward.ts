import type { PortfolioStrategyFactory } from '../strategy/types.js';
import type { Candle, CostModel, EquityPoint, Interval } from '../types.js';
import { computeMetrics, type Metrics } from './metrics.js';
import {
  runPortfolioBacktest,
  type PortfolioLimits,
} from './portfolio.js';
import { makeFolds } from './walkforward.js';

export interface PortfolioWalkForwardOptions {
  universe: ReadonlyMap<string, readonly Candle[]>;
  factory: PortfolioStrategyFactory<never>;
  interval: Interval;
  startingCash: number;
  folds: number;
  trainFraction: number;
  /** See `makeFolds`. Defaults to the longest warm-up in the grid. */
  embargoBars?: number;
  costs?: CostModel;
  limits?: PortfolioLimits;
}

export interface PortfolioFold {
  index: number;
  testFrom: number;
  testTo: number;
  chosen: string;
  inSampleReturn: number;
  outOfSampleReturn: number;
  outOfSampleSharpe: number;
  outOfSampleFills: number;
}

export interface PortfolioWalkForwardResult {
  folds: PortfolioFold[];
  embargoBars: number;
  curve: EquityPoint[];
  metrics: Metrics;
  parameterChanges: number;
  symbols: string[];
}

/**
 * The same discipline as the single-asset walk-forward, applied to a universe.
 *
 * Worth running even when the single-asset results were discouraging, because a
 * cross-sectional strategy can only be evaluated this way: its parameters
 * (lookback, how many to hold, how often to rebalance) interact with the
 * universe, and choosing them on the whole history would fit the strategy to
 * which coins happened to lead in which year.
 */
export function runPortfolioWalkForward(
  options: PortfolioWalkForwardOptions,
): PortfolioWalkForwardResult {
  const { universe, factory, interval, startingCash, folds, trainFraction } = options;

  const symbols = [...universe.keys()];
  const length = Math.min(...symbols.map((s) => universe.get(s)?.length ?? 0));
  const embargoBars =
    options.embargoBars ??
    Math.max(0, ...factory.grid.map((params) => factory.create(params).warmupBars));
  const ranges = makeFolds(length, folds, trainFraction, embargoBars);

  const slice = (from: number, to: number): Map<string, readonly Candle[]> =>
    new Map(symbols.map((s) => [s, (universe.get(s) as readonly Candle[]).slice(from, to)]));

  const results: PortfolioFold[] = [];
  const curve: EquityPoint[] = [];
  let equity = startingCash;
  let benchmark = startingCash;

  for (const range of ranges) {
    const train = slice(range.trainStart, range.trainEnd);
    const test = slice(range.testStart, range.testEnd);

    let best: { params: never; sharpe: number; totalReturn: number } | null = null;
    for (const params of factory.grid) {
      const trial = runPortfolioBacktest({
        universe: train,
        strategy: factory.create(params),
        interval,
        startingCash,
        costs: options.costs,
        limits: options.limits,
      });
      const score = trial.metrics.trades >= 5 ? trial.metrics.sharpe : -Infinity;
      if (best === null || score > best.sharpe) {
        best = { params, sharpe: score, totalReturn: trial.metrics.totalReturn };
      }
    }
    if (!best) continue;

    const oos = runPortfolioBacktest({
      universe: test,
      strategy: factory.create(best.params),
      interval,
      startingCash: equity,
      costs: options.costs,
      limits: options.limits,
    });

    const firstBench = oos.curve[0]?.benchmark ?? 1;
    const lastBench = oos.curve[oos.curve.length - 1]?.benchmark ?? firstBench;
    for (const point of oos.curve) {
      curve.push({
        ...point,
        benchmark: firstBench > 0 ? benchmark * (point.benchmark / firstBench) : benchmark,
      });
    }
    equity = oos.metrics.endEquity;
    benchmark = firstBench > 0 ? benchmark * (lastBench / firstBench) : benchmark;

    results.push({
      index: range.index,
      testFrom: oos.curve[0]?.time ?? 0,
      testTo: oos.curve[oos.curve.length - 1]?.time ?? 0,
      chosen: JSON.stringify(best.params),
      inSampleReturn: best.totalReturn,
      outOfSampleReturn: oos.metrics.totalReturn,
      outOfSampleSharpe: oos.metrics.sharpe,
      outOfSampleFills: oos.fills.length,
    });
  }

  let parameterChanges = 0;
  for (let i = 1; i < results.length; i += 1) {
    if (results[i]?.chosen !== results[i - 1]?.chosen) parameterChanges += 1;
  }

  const fills = results.reduce((sum, fold) => sum + fold.outOfSampleFills, 0);

  return {
    folds: results,
    embargoBars,
    curve,
    // Round trips are not stitched across folds, so the fill count stands in for
    // the trade count and the trade-level statistics are left unreported rather
    // than computed from an empty list.
    metrics: { ...computeMetrics(curve, [], interval, 0, 0), trades: fills },
    parameterChanges,
    symbols,
  };
}

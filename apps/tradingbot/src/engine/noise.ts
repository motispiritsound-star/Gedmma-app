import { randomWalk } from '../data/synthetic.js';
import type { RiskLimits } from '../risk/risk.js';
import type { Strategy } from '../strategy/types.js';
import type { CostModel, Interval } from '../types.js';
import { runBacktest } from './backtest.js';

export interface NoiseTestOptions {
  makeStrategy: () => Strategy;
  interval: Interval;
  bars: number;
  runs: number;
  startingCash: number;
  seed?: number;
  costs?: CostModel;
  limits?: RiskLimits;
}

export interface NoiseTestResult {
  runs: number;
  /** Sharpe ratios from series that contain no edge, sorted ascending. */
  sharpes: number[];
  returns: number[];
  median: number;
  /** The 95th percentile: a real result should clear this to mean anything. */
  p95: number;
  best: number;
  worst: number;
}

/**
 * Run the strategy over many price series that have no edge in them, and see
 * what it "earns" anyway.
 *
 * Every one of these series is a random walk: by construction there is nothing
 * to predict. Whatever Sharpe ratios come back are therefore pure noise — and
 * they will not be zero. Some runs will look good enough to post a screenshot
 * of. The 95th percentile of this distribution is the bar a real backtest has to
 * clear before the word "edge" is warranted, and most strategies never clear it.
 *
 * This is the same reason the viral screenshots are worthless as evidence: out of
 * a million people running bots, a few thousand will have a spectacular first
 * week from luck alone, and those are precisely the ones who post.
 */
export function runNoiseTest(options: NoiseTestOptions): NoiseTestResult {
  const { makeStrategy, interval, bars, runs, startingCash } = options;
  const baseSeed = options.seed ?? 1;
  const sharpes: number[] = [];
  const rets: number[] = [];

  for (let i = 0; i < runs; i += 1) {
    const candles = randomWalk(bars, interval, baseSeed + i * 7919);
    const result = runBacktest({
      candles,
      strategy: makeStrategy(),
      interval,
      startingCash,
      costs: options.costs,
      limits: options.limits,
    });
    sharpes.push(result.metrics.sharpe);
    rets.push(result.metrics.totalReturn);
  }

  sharpes.sort((a, b) => a - b);
  rets.sort((a, b) => a - b);

  return {
    runs,
    sharpes,
    returns: rets,
    median: percentile(sharpes, 0.5),
    p95: percentile(sharpes, 0.95),
    best: sharpes[sharpes.length - 1] ?? 0,
    worst: sharpes[0] ?? 0,
  };
}

/** Linear-interpolated percentile of an already-sorted series. */
export function percentile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const low = sorted[lower] as number;
  if (lower === upper) return low;
  const high = sorted[upper] as number;
  return low + (high - low) * (position - lower);
}

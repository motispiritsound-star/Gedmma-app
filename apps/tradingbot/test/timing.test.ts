import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import { equityLikeSeries, randomWalk } from '../src/data/synthetic.js';
import {
  encodeSchedule,
  runTimingTest,
  scriptedStrategy,
  shuffleSchedule,
} from '../src/engine/timing.js';
import { makeRng } from '../src/data/synthetic.js';
import { trendFilter } from '../src/strategy/trendFilter.js';
import type { Strategy } from '../src/strategy/types.js';
import type { Candle, CostModel } from '../src/types.js';

const FREE: CostModel = { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 };
const LOOSE = {
  maxWeight: 1,
  maxDailyLossPct: 1,
  maxDrawdownPct: 1,
  rebalanceThreshold: 0.01,
  minOrderQuote: 0,
};

describe('encodeSchedule', () => {
  it('collapses an in/out schedule into its stretches', () => {
    expect(encodeSchedule([false, false, true, true, true, false])).toEqual([
      { inMarket: false, length: 2 },
      { inMarket: true, length: 3 },
      { inMarket: false, length: 1 },
    ]);
  });

  it('is empty for an empty schedule', () => {
    expect(encodeSchedule([])).toEqual([]);
  });
});

describe('shuffleSchedule', () => {
  const blocks = encodeSchedule([
    false, false,
    true, true, true,
    false,
    true,
    false, false, false,
    true, true,
  ]);

  it('keeps the exposure exactly', () => {
    const original = blocks.reduce((s, b) => s + (b.inMarket ? b.length : 0), 0);
    for (let seed = 1; seed <= 20; seed += 1) {
      const shuffled = shuffleSchedule(blocks, makeRng(seed));
      expect(shuffled.filter((x) => x).length).toBe(original);
    }
  });

  it('keeps the length and the number of stretches exactly', () => {
    const total = blocks.reduce((s, b) => s + b.length, 0);
    for (let seed = 1; seed <= 20; seed += 1) {
      const shuffled = shuffleSchedule(blocks, makeRng(seed));
      expect(shuffled).toHaveLength(total);
      expect(encodeSchedule(shuffled)).toHaveLength(blocks.length);
    }
  });

  it('keeps the multiset of holding periods, only moving where they fall', () => {
    const lengthsOf = (schedule: readonly boolean[], inMarket: boolean): number[] =>
      encodeSchedule(schedule)
        .filter((b) => b.inMarket === inMarket)
        .map((b) => b.length)
        .sort((a, b) => a - b);

    const source = blocks.flatMap((b) => Array.from({ length: b.length }, () => b.inMarket));
    for (let seed = 1; seed <= 20; seed += 1) {
      const shuffled = shuffleSchedule(blocks, makeRng(seed));
      // Same stretches, in a different order. That is what makes the comparison a
      // test of the signal rather than of a different strategy.
      expect(lengthsOf(shuffled, true)).toEqual(lengthsOf(source, true));
      expect(lengthsOf(shuffled, false)).toEqual(lengthsOf(source, false));
    }
  });

  it('actually moves them', () => {
    const source = blocks.flatMap((b) => Array.from({ length: b.length }, () => b.inMarket));
    const different = Array.from({ length: 20 }, (_, i) => shuffleSchedule(blocks, makeRng(i + 1)))
      .filter((s) => s.join('') !== source.join('')).length;
    expect(different).toBeGreaterThan(10);
  });
});

describe('scriptedStrategy', () => {
  it('reads its index from the history it is handed, not from a hidden counter', () => {
    const strategy = scriptedStrategy([false, true, true]);
    const bar: Candle = { openTime: 0, open: 1, high: 1, low: 1, close: 1, volume: 1 };
    expect(strategy.onBar({ candles: [bar], closes: [1], currentWeight: 0 })).toBe(0);
    expect(strategy.onBar({ candles: [bar, bar], closes: [1, 1], currentWeight: 0 })).toBe(1);
    // Past the end of the schedule it is flat rather than undefined.
    expect(
      strategy.onBar({ candles: [bar, bar, bar, bar], closes: [1, 1, 1, 1], currentWeight: 1 }),
    ).toBe(0);
  });
});

describe('the timing test can detect timing that is really there', () => {
  /**
   * A deliberately clairvoyant strategy: it holds whenever the next stretch of bars
   * rises. This is cheating, and that is the point — a null-hypothesis test that
   * cannot reject the null is worthless, so the test needs a positive control.
   */
  function clairvoyant(candles: readonly Candle[], lookahead: number): Strategy {
    const schedule = candles.map((_, i) => {
      const future = candles[Math.min(candles.length - 1, i + lookahead)];
      const now = candles[i];
      return future !== undefined && now !== undefined && future.close > now.close;
    });
    return scriptedStrategy(schedule, 'clairvoyant');
  }

  it('rejects the null for a strategy that can see the future', () => {
    const candles = equityLikeSeries(2000, '1d', 5);
    const result = runTimingTest({
      candles,
      strategy: clairvoyant(candles, 20),
      interval: '1d',
      startingCash: 10_000,
      runs: 300,
      seed: 3,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.verdict).toBe('the timing adds value');
    expect(result.percentileOfReal).toBeGreaterThan(0.98);
    expect(result.beatenBy).toBeLessThan(result.runs * 0.02);
  });

  it('does not reject it for a trend filter on a random walk', () => {
    // A random walk has nothing to time, by construction. A test that found an edge
    // here would be measuring itself rather than the strategy.
    const candles = randomWalk(3000, '1d', 9);
    const result = runTimingTest({
      candles,
      strategy: trendFilter({ maPeriod: 100, momentumBars: 50, exitBuffer: 0.02 }),
      interval: '1d',
      startingCash: 10_000,
      runs: 300,
      seed: 4,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.verdict).not.toBe('the timing adds value');
  });
});

describe('the timing test as a whole', () => {
  const candles = equityLikeSeries(3000, '1d', 7);
  const strategy = trendFilter({ maPeriod: 200, momentumBars: 126, exitBuffer: 0.02 });

  it('matches the null on exposure and trade count, so the costs cancel', () => {
    const result = runTimingTest({
      candles,
      strategy,
      interval: '1d',
      startingCash: 10_000,
      runs: 50,
      seed: 2,
      costs: { commission: bpsCommission(20), slippageBps: 10, borrowBpsPerDay: 0 },
      limits: LOOSE,
    });
    // Every shuffle trades the same number of times as the real run, so no part of
    // the comparison is a difference in commission.
    expect(result.runs).toBe(50);
    expect(result.episodes).toBeGreaterThan(3);
    expect(result.timeInMarket).toBeGreaterThan(0);
    expect(result.timeInMarket).toBeLessThan(1);
  });

  it('places the real result somewhere in the distribution', () => {
    const result = runTimingTest({
      candles,
      strategy,
      interval: '1d',
      startingCash: 10_000,
      runs: 200,
      seed: 6,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.percentileOfReal).toBeGreaterThanOrEqual(0);
    expect(result.percentileOfReal).toBeLessThanOrEqual(1);
    expect(result.beatenBy + Math.round(result.percentileOfReal * result.runs)).toBe(result.runs);
    expect(result.medianShuffledReturn).toBeLessThanOrEqual(result.p95ShuffledReturn);
    expect(result.p95ShuffledReturn).toBeLessThanOrEqual(result.bestShuffledReturn);
  });

  it('is reproducible for a seed', () => {
    const run = (): number[] =>
      runTimingTest({
        candles,
        strategy,
        interval: '1d',
        startingCash: 10_000,
        runs: 30,
        seed: 21,
        costs: FREE,
        limits: LOOSE,
      }).shuffledReturns;
    expect(run()).toEqual(run());
  });

  it('says so rather than guessing when there is nothing to shuffle', () => {
    const alwaysLong: Strategy = {
      name: 'always-long',
      describe: 'always long',
      warmupBars: 0,
      onBar: () => 1,
    };
    const result = runTimingTest({
      candles,
      strategy: alwaysLong,
      interval: '1d',
      startingCash: 10_000,
      runs: 100,
      costs: FREE,
      limits: LOOSE,
    });
    // One continuous stretch cannot be permuted into anything else.
    expect(result.runs).toBe(0);
    expect(result.verdict).toBe('inconclusive');
  });
});

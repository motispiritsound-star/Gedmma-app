import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import { meanRevertingSeries, randomWalk, trendingSeries } from '../src/data/synthetic.js';
import { runBacktest } from '../src/engine/backtest.js';
import { percentile, runNoiseTest } from '../src/engine/noise.js';
import { assessSignificance } from '../src/engine/significance.js';
import { runWalkForward } from '../src/engine/walkforward.js';
import { buildStrategy, factoryByName, strategyNames } from '../src/strategy/registry.js';
import { donchian } from '../src/strategy/donchian.js';
import { emaCross } from '../src/strategy/emaCross.js';
import { meanReversion } from '../src/strategy/meanReversion.js';
import type { CostModel } from '../src/types.js';

const FREE: CostModel = { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 };
const LOOSE = {
  maxWeight: 1,
  maxDailyLossPct: 1,
  maxDrawdownPct: 1,
  rebalanceThreshold: 0.05,
  minOrderQuote: 0,
};

describe('the strategies refuse settings that make no sense', () => {
  it('will not build an EMA cross whose fast line is the slow one', () => {
    expect(() => emaCross({ fast: 20, slow: 20 })).toThrow(/fast < slow/);
  });

  it('will not build a mean reversion that can never exit', () => {
    expect(() =>
      meanReversion({ lookback: 20, entryZ: 1, exitZ: 1, allowShort: false }),
    ).toThrow(/exitZ < entryZ/);
  });
});

describe('strategy behaviour', () => {
  it('holds a Donchian long until the exit band breaks, rather than flipping each bar', () => {
    const strategy = donchian({ entryBars: 5, exitBars: 3 });
    const rising = Array.from({ length: 20 }, (_, i) => ({
      openTime: i * 86_400_000,
      open: 100 + i,
      high: 100 + i,
      low: 100 + i,
      close: 100 + i,
      volume: 1,
    }));
    const closes = rising.map((c) => c.close);
    expect(strategy.onBar({ candles: rising, closes, currentWeight: 0 })).toBe(1);
    expect(strategy.onBar({ candles: rising, closes, currentWeight: 1 })).toBe(1);
  });

  it('keeps a mean-reversion long open between the entry and exit bands', () => {
    const strategy = meanReversion({ lookback: 10, entryZ: 2, exitZ: 0.5, allowShort: false });
    // A dip far below the mean, then a partial recovery that is past the entry
    // band but not yet at the exit band: the position should stay open.
    const closes = [...Array.from({ length: 10 }, () => 100), 90, 97];
    const candles = closes.map((close, i) => ({
      openTime: i * 86_400_000,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1,
    }));
    const held = strategy.onBar({ candles, closes, currentWeight: 1 });
    expect(held).toBe(1);
  });

  it('stays flat during its own warm-up', () => {
    const result = runBacktest({
      candles: trendingSeries(300, '1d', 21),
      strategy: emaCross({ fast: 50, slow: 200 }),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    const firstTrade = result.fills[0];
    expect(firstTrade).toBeDefined();
    expect(result.curve.slice(0, 200).every((p) => p.weight === 0)).toBe(true);
  });
});

describe('the registry', () => {
  it('builds every strategy it advertises', () => {
    for (const name of strategyNames()) {
      const strategy = buildStrategy(name);
      expect(strategy.name.length).toBeGreaterThan(0);
      expect(strategy.describe.length).toBeGreaterThan(0);
    }
  });

  it('builds every parameter set in every grid', () => {
    for (const name of strategyNames().filter((n) => n !== 'buy-and-hold')) {
      const factory = factoryByName(name);
      expect(factory).toBeDefined();
      for (let i = 0; i < (factory?.grid.length ?? 0); i += 1) {
        expect(() => buildStrategy(name, i)).not.toThrow();
      }
    }
  });

  it('says what it knows when asked for something it does not', () => {
    expect(() => buildStrategy('get-rich-quick')).toThrow(/Known: /);
    expect(() => buildStrategy('ema-cross', 99)).toThrow(/parameter sets/);
  });
});

describe('walk-forward', () => {
  it('chooses parameters in-sample and reports only what happened after', () => {
    const factory = factoryByName('mean-reversion');
    expect(factory).toBeDefined();
    const result = runWalkForward({
      candles: meanRevertingSeries(3000, '1d', 42),
      factory: factory as never,
      interval: '1d',
      startingCash: 1000,
      folds: 5,
      trainFraction: 0.7,
      costs: FREE,
      limits: LOOSE,
    });

    expect(result.folds.length).toBeGreaterThan(2);
    for (const fold of result.folds) {
      // The test window must begin after the training window ends.
      expect(fold.testFrom).toBeGreaterThan(fold.trainTo);
      expect(fold.chosen).toMatch(/lookback/);
    }
    // The stitched curve covers the test windows only, never the training ones.
    expect(result.curve.length).toBeLessThan(3000);
  });

  it('compounds each fold onto the last, the way an account would', () => {
    const factory = factoryByName('ema-cross');
    const result = runWalkForward({
      candles: trendingSeries(2000, '1d', 31),
      factory: factory as never,
      interval: '1d',
      startingCash: 1000,
      folds: 4,
      trainFraction: 0.6,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.curve[0]?.equity).toBeCloseTo(1000, 6);
    expect(result.metrics.endEquity).toBeCloseTo(
      result.curve[result.curve.length - 1]?.equity as number,
      6,
    );
  });

  it('refuses to split history too thin to choose parameters from', () => {
    expect(() =>
      runWalkForward({
        candles: trendingSeries(200, '1d', 1),
        factory: factoryByName('ema-cross') as never,
        interval: '1d',
        startingCash: 1000,
        folds: 10,
        trainFraction: 0.7,
      }),
    ).toThrow(/too few/);
  });
});

describe('the noise benchmark', () => {
  it('produces a spread of results from data with no edge in it', () => {
    const result = runNoiseTest({
      makeStrategy: () => emaCross({ fast: 8, slow: 21 }),
      interval: '1d',
      bars: 400,
      runs: 40,
      startingCash: 1000,
      seed: 3,
      costs: FREE,
      limits: LOOSE,
    });

    expect(result.sharpes).toHaveLength(40);
    // This is the whole point: random walks hand out good-looking Sharpe ratios.
    // If the best of forty runs were not clearly positive, the test would be
    // asserting something false about how easy a backtest is to fool.
    expect(result.best).toBeGreaterThan(0.5);
    expect(result.worst).toBeLessThan(0);
    expect(result.p95).toBeGreaterThan(result.median);
  });

  it('is reproducible for a given seed', () => {
    const run = () =>
      runNoiseTest({
        makeStrategy: () => emaCross({ fast: 8, slow: 21 }),
        interval: '1d',
        bars: 300,
        runs: 10,
        startingCash: 1000,
        seed: 17,
        costs: FREE,
      });
    expect(run().sharpes).toEqual(run().sharpes);
  });
});

describe('percentile', () => {
  it('interpolates between neighbours', () => {
    expect(percentile([0, 10], 0.5)).toBeCloseTo(5, 10);
    expect(percentile([0, 1, 2, 3, 4], 0.95)).toBeCloseTo(3.8, 10);
  });

  it('is zero for an empty series rather than NaN', () => {
    expect(percentile([], 0.5)).toBe(0);
  });
});

describe('assessSignificance', () => {
  it('runs every configuration in the grid and ranks them', () => {
    const factory = factoryByName('mean-reversion');
    const result = assessSignificance({
      candles: meanRevertingSeries(2000, '1d', 42),
      factory: factory as never,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.trials).toHaveLength((factory?.grid.length ?? 0));
    // Sorted best first, so the winner is the head of the list.
    for (let i = 1; i < result.trials.length; i += 1) {
      expect(result.trials[i - 1]?.sharpe).toBeGreaterThanOrEqual(
        result.trials[i]?.sharpe as number,
      );
    }
    expect(result.winner).toBe(result.trials[0]?.name);
    expect(result.deflated.trials).toBe(result.trials.length);
  });

  it('finds a real edge significant on a series built to contain one', () => {
    const result = assessSignificance({
      candles: meanRevertingSeries(3000, '1d', 8),
      factory: factoryByName('mean-reversion') as never,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.deflated.probability).toBeGreaterThan(0.9);
  });

  it('does not find an edge on a random walk', () => {
    const result = assessSignificance({
      candles: randomWalk(2000, '1d', 5),
      factory: factoryByName('ema-cross') as never,
      interval: '1d',
      startingCash: 1000,
      costs: { commission: bpsCommission(10), slippageBps: 5, borrowBpsPerDay: 5 },
      limits: LOOSE,
    });
    // A random walk has nothing in it. Whatever the best of four configurations
    // scored, it must not come back as evidence.
    expect(result.deflated.verdict).not.toBe('significant');
  });
});

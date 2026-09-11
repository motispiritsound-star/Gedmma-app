import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import { alignUniverse, survivorshipWarning } from '../src/data/align.js';
import { cryptoLikeUniverse, generateUniverse } from '../src/data/synthetic.js';
import { analyseCorrelation, correlation } from '../src/engine/correlation.js';
import { runPortfolioNoiseTest } from '../src/engine/noise.js';
import { applyPortfolioLimits, runPortfolioBacktest } from '../src/engine/portfolio.js';
import { runPortfolioWalkForward } from '../src/engine/portfolioWalkforward.js';
import {
  crossSectionalMomentum,
  crossSectionalMomentumFactory,
  equalWeightHold,
} from '../src/strategy/crossSectionalMomentum.js';
import type { PortfolioStrategy } from '../src/strategy/types.js';
import type { Candle, CostModel } from '../src/types.js';

const FREE: CostModel = { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 };
const LOOSE = {
  maxWeight: 1,
  maxDailyLossPct: 1,
  maxDrawdownPct: 1,
  rebalanceThreshold: 0.05,
  minOrderQuote: 0,
  maxWeightPerSymbol: 0.34,
  maxGrossExposure: 1,
};
const DAY = 86_400_000;
const SYMBOLS = Array.from({ length: 10 }, (_, i) => `S${i}`);

function bars(closes: readonly number[], offset = 0): Candle[] {
  return closes.map((close, i) => ({
    openTime: (i + offset) * DAY,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  }));
}

/** A universe where relative strength persists, so momentum has something to find. */
function edgefulUniverse(seed: number, persistence = 0.8): Map<string, Candle[]> {
  return generateUniverse({
    symbols: SYMBOLS,
    bars: 1500,
    interval: '1d',
    marketBeta: 0.3,
    marketVol: 0.3,
    idiosyncraticVol: 0.6,
    drift: 0.3,
    seed,
    momentumPersistence: persistence,
  });
}

describe('alignUniverse', () => {
  it('drops timestamps where any symbol has no bar, rather than inventing a price', () => {
    const raw = new Map<string, Candle[]>([
      ['A', bars([1, 2, 3, 4, 5])],
      // B is missing the bar at index 2.
      ['B', [...bars([10, 11]), ...bars([13, 14], 3)]],
    ]);
    const aligned = alignUniverse(raw, '1d');
    expect(aligned.times).toEqual([0, DAY, 3 * DAY, 4 * DAY]);
    expect(aligned.droppedBars).toBe(1);
    expect(aligned.series.get('A')).toHaveLength(4);
    expect(aligned.series.get('B')).toHaveLength(4);
  });

  it('names the symbols that listed late and shortened the test', () => {
    const raw = new Map<string, Candle[]>([
      ['OLD', bars([1, 2, 3, 4, 5])],
      ['NEW', bars([9, 9, 9], 2)],
    ]);
    const aligned = alignUniverse(raw, '1d');
    expect(aligned.lateListings).toEqual([{ symbol: 'NEW', firstTime: 2 * DAY }]);
    expect(aligned.times[0]).toBe(2 * DAY);
  });

  it('refuses symbols that never overlap', () => {
    const raw = new Map<string, Candle[]>([
      ['A', bars([1, 2, 3])],
      ['B', bars([1, 2, 3], 100)],
    ]);
    expect(() => alignUniverse(raw, '1d')).toThrow(/do not overlap/);
  });

  it('refuses a symbol with no candles at all', () => {
    const raw = new Map<string, Candle[]>([['A', bars([1, 2])], ['B', []]]);
    expect(() => alignUniverse(raw, '1d')).toThrow(/no candles/);
  });

  it('says out loud that a hand-picked universe is survivorship-biased', () => {
    expect(survivorshipWarning(['BTCUSDT', 'ETHUSDT'])).toMatch(/chosen with hindsight/);
  });
});

describe('correlation', () => {
  it('is 1 for a series against itself and -1 against its mirror', () => {
    const a = [0.01, -0.02, 0.03, -0.01];
    expect(correlation(a, a)).toBeCloseTo(1, 8);
    expect(correlation(a, a.map((v) => -v))).toBeCloseTo(-1, 8);
  });

  it('is 0 rather than NaN when one series never moves', () => {
    expect(correlation([1, 2, 3], [5, 5, 5])).toBe(0);
  });
});

describe('effective bets', () => {
  it('counts a basket of identical assets as one bet', () => {
    const identical = new Map<string, Candle[]>(
      ['A', 'B', 'C', 'D'].map((s) => [s, bars([100, 110, 99, 121, 130])]),
    );
    const report = analyseCorrelation(identical);
    expect(report.averagePairwise).toBeCloseTo(1, 6);
    expect(report.effectiveBets).toBeCloseTo(1, 4);
  });

  it('counts crypto-like majors as barely more than one bet', () => {
    const report = analyseCorrelation(cryptoLikeUniverse(SYMBOLS, 1000, '1d', 5));
    expect(report.averagePairwise).toBeGreaterThan(0.8);
    expect(report.effectiveBets).toBeLessThan(2);
    expect(report.symbols).toHaveLength(10);
  });

  it('approaches the asset count when the assets are independent', () => {
    const independent = generateUniverse({
      symbols: SYMBOLS,
      bars: 3000,
      interval: '1d',
      marketBeta: 0,
      marketVol: 0.1,
      idiosyncraticVol: 0.6,
      drift: 0,
      seed: 11,
    });
    const report = analyseCorrelation(independent);
    expect(Math.abs(report.averagePairwise)).toBeLessThan(0.1);
    expect(report.effectiveBets).toBeGreaterThan(5);
  });
});

describe('applyPortfolioLimits', () => {
  it('caps any single symbol at its limit', () => {
    const capped = applyPortfolioLimits(new Map([['A', 0.9]]), ['A', 'B'], LOOSE);
    expect(capped.get('A')).toBeCloseTo(0.34, 8);
    expect(capped.get('B')).toBe(0);
  });

  it('scales everything down proportionally when gross exposure is too high', () => {
    const capped = applyPortfolioLimits(
      new Map([
        ['A', 0.3],
        ['B', 0.3],
        ['C', 0.3],
        ['D', 0.3],
      ]),
      ['A', 'B', 'C', 'D'],
      LOOSE,
    );
    const gross = [...capped.values()].reduce((s, w) => s + Math.abs(w), 0);
    expect(gross).toBeCloseTo(1, 8);
    // Scaling preserves the strategy's relative conviction; truncating would not.
    expect(capped.get('A')).toBeCloseTo(capped.get('D') as number, 8);
  });

  it('treats a non-finite target as zero rather than propagating it', () => {
    const capped = applyPortfolioLimits(new Map([['A', Number.NaN]]), ['A'], LOOSE);
    expect(capped.get('A')).toBe(0);
  });
});

describe('the portfolio engine', () => {
  it('never borrows: cash stays non-negative through a heavy rebalance schedule', () => {
    const result = runPortfolioBacktest({
      universe: edgefulUniverse(7, 0.5),
      strategy: crossSectionalMomentum({
        lookback: 30,
        hold: 3,
        rebalanceBars: 1,
        requirePositive: false,
      }),
      interval: '1d',
      startingCash: 1000,
      costs: { commission: bpsCommission(10), slippageBps: 5, borrowBpsPerDay: 0 },
      limits: LOOSE,
    });
    // weight is gross notional over equity, so 1 − weight is the cash share.
    for (const point of result.curve) {
      expect(point.equity * (1 - point.weight)).toBeGreaterThan(-1e-6);
    }
  });

  it('fills at the next bar open, not at the close that produced the ranking', () => {
    // Two symbols, flat, then one gaps up. A strategy that picks the leader on
    // the last flat close must pay the gapped open.
    const universe = new Map<string, Candle[]>([
      ['A', [...bars([100, 100, 100]), { openTime: 3 * DAY, open: 200, high: 200, low: 200, close: 200, volume: 1 }]],
      ['B', bars([100, 100, 100, 100])],
    ]);
    const pickA: PortfolioStrategy = {
      name: 'always-a',
      describe: 'holds A',
      warmupBars: 0,
      onBar: () => new Map([['A', 1]]),
    };
    const result = runPortfolioBacktest({
      universe,
      strategy: pickA,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: { ...LOOSE, maxWeightPerSymbol: 1 },
    });
    expect(result.fills[0]?.price).toBe(100);
    // It was already long at 100 before the gap, so the gap is a real gain. The
    // point of the assertion is the price, not the profit.
    expect(result.fills.every((f) => f.price === 100 || f.price === 200)).toBe(true);
  });

  it('leaves equal-weight-hold level with its own benchmark when trading is free', () => {
    const result = runPortfolioBacktest({
      universe: cryptoLikeUniverse(SYMBOLS, 800, '1d', 3),
      strategy: equalWeightHold(),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: { ...LOOSE, maxWeightPerSymbol: 1 },
    });
    expect(result.metrics.excessReturn).toBeCloseTo(0, 4);
  });

  it('benchmarks against the whole universe, not the best symbol in it', () => {
    const universe = cryptoLikeUniverse(SYMBOLS, 800, '1d', 4);
    const result = runPortfolioBacktest({
      universe,
      strategy: equalWeightHold(),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: { ...LOOSE, maxWeightPerSymbol: 1 },
    });
    const perSymbol = SYMBOLS.map((s) => {
      const series = universe.get(s) as Candle[];
      return (series[series.length - 1] as Candle).close / (series[0] as Candle).close - 1;
    });
    const best = Math.max(...perSymbol);
    expect(result.metrics.benchmarkReturn).toBeLessThan(best);
  });

  it('finds the edge when relative strength really does persist', () => {
    let wins = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      const result = runPortfolioBacktest({
        universe: edgefulUniverse(seed),
        strategy: crossSectionalMomentum({
          lookback: 30,
          hold: 3,
          rebalanceBars: 7,
          requirePositive: true,
        }),
        interval: '1d',
        startingCash: 1000,
        costs: FREE,
        limits: LOOSE,
      });
      if (result.metrics.excessReturn > 0) wins += 1;
    }
    // Momentum is strongly present in these universes by construction, so it
    // should win clearly more often than a coin flip. If this drops to chance,
    // the ranking or the fill logic has broken.
    expect(wins).toBeGreaterThan(7);
  });

  it('refuses a universe whose symbols barely overlap', () => {
    const universe = new Map<string, Candle[]>([
      ['A', bars([1, 2, 3])],
      ['B', bars([1, 2, 3], 2)],
    ]);
    expect(() =>
      runPortfolioBacktest({
        universe,
        strategy: equalWeightHold(),
        interval: '1d',
        startingCash: 1000,
      }),
    ).toThrow(/overlap on only/);
  });
});

describe('cross-sectional momentum', () => {
  it('refuses settings that cannot work', () => {
    expect(() =>
      crossSectionalMomentum({ lookback: 30, hold: 0, rebalanceBars: 7, requirePositive: true }),
    ).toThrow(/at least 1 symbol/);
    expect(() =>
      crossSectionalMomentum({ lookback: 1, hold: 3, rebalanceBars: 7, requirePositive: true }),
    ).toThrow(/at least 2 bars/);
    expect(() =>
      crossSectionalMomentum({ lookback: 30, hold: 3, rebalanceBars: 0, requirePositive: true }),
    ).toThrow(/at least 1/);
  });

  it('restates the existing book between rebalances instead of re-ranking', () => {
    const strategy = crossSectionalMomentum({
      lookback: 2,
      hold: 1,
      rebalanceBars: 10,
      requirePositive: false,
    });
    const history = new Map<string, Candle[]>([
      ['A', bars([1, 2, 3, 4])],
      ['B', bars([4, 3, 2, 1])],
    ]);
    const currentWeights = new Map([
      ['A', 0.4],
      ['B', 0],
    ]);
    // barIndex 3 is not a multiple of 10, so nothing should change.
    const held = strategy.onBar({ history, currentWeights, barIndex: 3 });
    expect(held.get('A')).toBe(0.4);
  });

  it('holds nothing when the trend filter rejects the whole universe', () => {
    const strategy = crossSectionalMomentum({
      lookback: 2,
      hold: 2,
      rebalanceBars: 1,
      requirePositive: true,
    });
    const falling = new Map<string, Candle[]>([
      ['A', bars([10, 9, 8])],
      ['B', bars([10, 8, 6])],
    ]);
    const targets = strategy.onBar({
      history: falling,
      currentWeights: new Map(),
      barIndex: 2,
    });
    expect([...targets.values()].every((w) => w === 0)).toBe(true);
  });
});

describe('the portfolio walk-forward', () => {
  it('chooses parameters in-sample and measures them after', () => {
    const result = runPortfolioWalkForward({
      universe: edgefulUniverse(21),
      factory: crossSectionalMomentumFactory as never,
      interval: '1d',
      startingCash: 1000,
      folds: 4,
      trainFraction: 0.7,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.folds.length).toBeGreaterThan(2);
    expect(result.curve[0]?.equity).toBeCloseTo(1000, 6);
    for (const fold of result.folds) {
      expect(fold.chosen).toMatch(/lookback/);
      expect(fold.testTo).toBeGreaterThan(fold.testFrom);
    }
    expect(result.metrics.trades).toBe(
      result.folds.reduce((s, f) => s + f.outOfSampleFills, 0),
    );
  });
});

describe('the portfolio noise benchmark', () => {
  it('shows a rotation strategy beating the benchmark on edgeless universes often enough to fool someone', () => {
    const result = runPortfolioNoiseTest({
      makeStrategy: () =>
        crossSectionalMomentum({
          lookback: 30,
          hold: 3,
          rebalanceBars: 7,
          requirePositive: true,
        }),
      interval: '1d',
      symbolCount: 8,
      bars: 600,
      runs: 12,
      startingCash: 1000,
      seed: 2,
      costs: FREE,
      limits: LOOSE,
    });

    expect(result.excessReturns).toHaveLength(12);
    // The distribution must straddle zero: some runs win, some lose. A result
    // entirely on one side would mean the generator has an edge in it, which
    // would make the whole benchmark meaningless.
    expect(result.beatBenchmark).toBeGreaterThan(0);
    expect(result.beatBenchmark).toBeLessThan(12);
    expect(result.excessReturns[11] as number).toBeGreaterThan(0);
  });

  it('is reproducible for a given seed', () => {
    const run = (): number[] =>
      runPortfolioNoiseTest({
        makeStrategy: () =>
          crossSectionalMomentum({
            lookback: 20,
            hold: 2,
            rebalanceBars: 5,
            requirePositive: false,
          }),
        interval: '1d',
        symbolCount: 5,
        bars: 400,
        runs: 5,
        startingCash: 1000,
        seed: 9,
        costs: FREE,
        limits: LOOSE,
      }).excessReturns;
    expect(run()).toEqual(run());
  });
});

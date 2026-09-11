import { describe, expect, it } from 'vitest';
import { bootstrapDrawdowns, minimumTrackRecordLength } from '../src/engine/robustness.js';
import { formatDuration, formatRatio, renderTrackRecord } from '../src/report.js';
import { makeFolds, runWalkForward } from '../src/engine/walkforward.js';
import { meanRevertingSeries } from '../src/data/synthetic.js';
import { bpsCommission } from '../src/costs/commission.js';
import { factoryByName } from '../src/strategy/registry.js';
import type { Trade } from '../src/types.js';

/** A return series with a roughly known per-bar Sharpe. */
function series(length: number, perBarSharpe: number, seed = 3): number[] {
  let a = seed;
  const rnd = (): number => {
    a = (a * 1103515245 + 12345) % 2147483648;
    return a / 2147483648;
  };
  return Array.from({ length }, () => 0.01 * (rnd() + rnd() - 1) + perBarSharpe * 0.01);
}

describe('minimumTrackRecordLength', () => {
  it('needs four times as long when the edge is halved', () => {
    const returns = series(2000, 0.05);
    const strong = minimumTrackRecordLength({ returns, sharpeAnnual: 2, interval: '1d' });
    const weak = minimumTrackRecordLength({ returns, sharpeAnnual: 1, interval: '1d' });
    // Required length goes with the inverse square of the Sharpe ratio. This is the
    // property that makes the figure worth printing: a respectable-looking edge can
    // still need years of daily bars to distinguish from zero.
    expect(weak.bars / strong.bars).toBeGreaterThan(3.5);
    expect(weak.bars / strong.bars).toBeLessThan(4.5);
  });

  it('converts to a span a human can plan around', () => {
    const result = minimumTrackRecordLength({
      returns: series(2000, 0.05),
      sharpeAnnual: 1,
      interval: '1d',
    });
    expect(result.days).toBeCloseTo(result.bars, 6);
  });

  it('needs the same calendar time whatever the bar size', () => {
    const returns = series(2000, 0.05);
    const daily = minimumTrackRecordLength({ returns, sharpeAnnual: 1, interval: '1d' });
    const hourly = minimumTrackRecordLength({ returns, sharpeAnnual: 1, interval: '1h' });

    // Hourly needs 24x the bars, each covering a 24th of the time, so the wait in
    // days is the same. This is not a coincidence and it is worth knowing: moving
    // to a finer interval does not get you to statistical significance faster. An
    // annualised Sharpe ratio is a claim about a year, and sampling the same year
    // more often does not produce more independent evidence about it.
    expect(hourly.bars / daily.bars).toBeCloseTo(24, 0);
    expect(hourly.days / daily.days).toBeCloseTo(1, 1);
  });

  it('says no length suffices when there is no edge', () => {
    const negative = minimumTrackRecordLength({
      returns: series(500, -0.05),
      sharpeAnnual: -0.5,
      interval: '1d',
    });
    expect(negative.hopeless).toBe(true);
    expect(negative.bars).toBe(Infinity);

    const flat = minimumTrackRecordLength({ returns: series(500, 0), sharpeAnnual: 0, interval: '1d' });
    expect(flat.hopeless).toBe(true);
  });

  it('refuses a series too short to measure', () => {
    const result = minimumTrackRecordLength({ returns: [0.01], sharpeAnnual: 2, interval: '1d' });
    expect(result.hopeless).toBe(true);
  });

  it('demands more evidence at higher confidence', () => {
    const returns = series(2000, 0.05);
    const ninety = minimumTrackRecordLength({ returns, sharpeAnnual: 1, interval: '1d', confidence: 0.9 });
    const ninetyNine = minimumTrackRecordLength({ returns, sharpeAnnual: 1, interval: '1d', confidence: 0.99 });
    expect(ninetyNine.bars).toBeGreaterThan(ninety.bars);
  });
});

describe('bootstrapDrawdowns', () => {
  function trade(returnPct: number): Trade {
    return {
      openTime: 0,
      closeTime: 1,
      side: 'long',
      entryPrice: 100,
      exitPrice: 100 * (1 + returnPct),
      qty: 1,
      pnl: returnPct * 100,
      returnPct,
      bars: 1,
    };
  }

  const mixed = [0.1, -0.05, 0.08, -0.06, 0.12, -0.04, 0.05, -0.09, 0.07, -0.03].map(trade);

  it('produces drawdowns worse than the one history dealt', () => {
    const result = bootstrapDrawdowns({ trades: mixed, startingEquity: 1000, runs: 500, seed: 1 });
    expect(result.runs).toBe(500);
    expect(result.p95).toBeGreaterThan(result.median);
    expect(result.worst).toBeGreaterThanOrEqual(result.p95);
    // The point of the exercise: the unlucky orderings are considerably worse than
    // the median, and the backtest reported one sample.
    expect(result.worst).toBeGreaterThan(result.median);
  });

  it('orders its percentiles', () => {
    const result = bootstrapDrawdowns({ trades: mixed, startingEquity: 1000, runs: 300, seed: 2 });
    expect(result.median).toBeLessThanOrEqual(result.p75);
    expect(result.p75).toBeLessThanOrEqual(result.p95);
  });

  it('reports how often the same trades lose money in a different order', () => {
    const losing = [0.02, -0.1, 0.01, -0.12, 0.03, -0.08].map(trade);
    const result = bootstrapDrawdowns({ trades: losing, startingEquity: 1000, runs: 300, seed: 4 });
    expect(result.losingShare).toBeGreaterThan(0.5);
    expect(result.medianReturn).toBeLessThan(0);
  });

  it('is reproducible for a seed', () => {
    const run = (): number[] =>
      bootstrapDrawdowns({ trades: mixed, startingEquity: 1000, runs: 100, seed: 9 }).drawdowns;
    expect(run()).toEqual(run());
  });

  it('returns nothing measurable from fewer than two trades', () => {
    const result = bootstrapDrawdowns({ trades: [trade(0.1)], startingEquity: 1000 });
    expect(result.runs).toBe(0);
    expect(result.p95).toBe(0);
  });

  it('stops at zero rather than going negative on a ruinous sequence', () => {
    const ruinous = [-0.99, -0.99, -0.99, -0.99, -0.99].map(trade);
    const result = bootstrapDrawdowns({ trades: ruinous, startingEquity: 1000, runs: 50, seed: 5 });
    expect(result.worst).toBeLessThanOrEqual(1);
    expect(result.worstReturn).toBeGreaterThanOrEqual(-1);
  });
});

describe('the embargo between training and testing', () => {
  it('opens a gap that neither window sees', () => {
    const folds = makeFolds(1000, 4, 0.7, 30);
    for (const fold of folds) {
      expect(fold.testStart - fold.trainEnd).toBe(30);
      expect(fold.trainEnd).toBeLessThan(fold.testStart);
    }
  });

  it('leaves no gap when the embargo is zero', () => {
    for (const fold of makeFolds(1000, 4, 0.7)) {
      expect(fold.testStart).toBe(fold.trainEnd);
    }
  });

  it('refuses an embargo that would starve every training window', () => {
    expect(() => makeFolds(400, 4, 0.7, 80)).toThrow(/No fold survived an embargo/);
  });

  it('rejects a nonsensical embargo', () => {
    expect(() => makeFolds(1000, 4, 0.7, -1)).toThrow(/non-negative/);
  });

  it('defaults to the longest warm-up in the grid, because that is what leaks', () => {
    const factory = factoryByName('mean-reversion');
    const longest = Math.max(
      ...(factory?.grid ?? []).map((params) => factory?.create(params).warmupBars ?? 0),
    );
    const result = runWalkForward({
      candles: meanRevertingSeries(4000, '1d', 12),
      factory: factory as never,
      interval: '1d',
      startingCash: 1000,
      folds: 4,
      trainFraction: 0.7,
      costs: { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 },
    });
    expect(result.embargoBars).toBe(longest);
    expect(longest).toBeGreaterThan(0);
    for (const fold of result.folds) {
      expect(fold.testFrom).toBeGreaterThan(fold.trainTo);
    }
  });

  it('can be overridden', () => {
    const result = runWalkForward({
      candles: meanRevertingSeries(4000, '1d', 12),
      factory: factoryByName('mean-reversion') as never,
      interval: '1d',
      startingCash: 1000,
      folds: 4,
      trainFraction: 0.7,
      embargoBars: 0,
      costs: { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 },
    });
    expect(result.embargoBars).toBe(0);
  });
});

describe('the report lines these numbers end up on', () => {
  const curve = Array.from({ length: 400 }, (_, i) => ({
    time: i * 86_400_000,
    equity: 1000 * 1.001 ** i,
    benchmark: 1000,
    weight: 1,
    price: 100,
  }));

  it('spells a duration the way a human would', () => {
    expect(formatDuration(45)).toBe('45 days');
    expect(formatDuration(200)).toMatch(/months/);
    expect(formatDuration(900)).toMatch(/years/);
    expect(formatDuration(Infinity)).toMatch(/longer than any plan/);
  });

  it('prints a requirement for a curve that rose', () => {
    const rendered = renderTrackRecord(curve, 1.5, '1d');
    expect(rendered).toMatch(/Track record needed/);
    expect(rendered).toMatch(/bars/);
  });

  it('says there is nothing to forward-test when the edge is negative', () => {
    expect(renderTrackRecord(curve, -0.5, '1d')).toMatch(/nothing here to forward-test/);
  });

  it('spells the unbounded ratios rather than printing Infinity', () => {
    expect(formatRatio(Infinity)).toBe('∞');
    expect(formatRatio(-Infinity)).toBe('-∞');
    expect(formatRatio(Number.NaN)).toBe('-');
    expect(formatRatio(1.234)).toBe('1.23');
  });
});

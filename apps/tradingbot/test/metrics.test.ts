import { describe, expect, it } from 'vitest';
import { caveats, computeMetrics, maxDrawdownOf } from '../src/engine/metrics.js';
import type { EquityPoint, Trade } from '../src/types.js';

const DAY = 86_400_000;

function curveFrom(equities: readonly number[], prices?: readonly number[]): EquityPoint[] {
  return equities.map((equity, i) => ({
    time: i * DAY,
    equity,
    benchmark: prices?.[i] ?? equity,
    weight: 1,
    price: prices?.[i] ?? equity,
  }));
}

describe('maxDrawdownOf', () => {
  it('is zero for a series that only rises', () => {
    expect(maxDrawdownOf([1, 2, 3, 4])).toBe(0);
  });

  it('measures from the peak, not the start', () => {
    expect(maxDrawdownOf([100, 200, 100, 300])).toBeCloseTo(0.5, 10);
  });

  it('keeps the deepest fall when there are several', () => {
    expect(maxDrawdownOf([100, 90, 100, 60, 100])).toBeCloseTo(0.4, 10);
  });
});

describe('computeMetrics', () => {
  it('reports the total return over the curve', () => {
    const m = computeMetrics(curveFrom([1000, 1100, 1200]), [], '1d', 0, 0);
    expect(m.totalReturn).toBeCloseTo(0.2, 10);
  });

  it('annualises a daily curve by bar count', () => {
    // 366 points is 365 returns, so exactly one year of daily bars.
    const doubled = Array.from({ length: 366 }, (_, i) => 1000 * 2 ** (i / 365));
    const m = computeMetrics(curveFrom(doubled), [], '1d', 0, 0);
    expect(m.cagr).toBeCloseTo(1, 2);
  });

  it('gives a flat curve a Sharpe of zero rather than a division by zero', () => {
    const m = computeMetrics(curveFrom([1000, 1000, 1000, 1000]), [], '1d', 0, 0);
    expect(m.sharpe).toBe(0);
    expect(m.sortino).toBe(0);
    expect(Number.isFinite(m.cagr)).toBe(true);
  });

  it('rates a strategy that never loses above one that does, on Sortino', () => {
    const steady = computeMetrics(curveFrom([100, 101, 102, 103, 104]), [], '1d', 0, 0);
    const choppy = computeMetrics(curveFrom([100, 104, 99, 106, 104]), [], '1d', 0, 0);
    // No losing bar means no downside deviation, so the ratio is unbounded. The
    // point of the assertion is the ordering, which a zero would have inverted.
    expect(steady.sortino).toBe(Infinity);
    expect(steady.sortino).toBeGreaterThan(choppy.sortino);
    expect(choppy.sortino).toBeGreaterThan(0);
  });

  it('ranks a curve that only falls below one that only rises', () => {
    const falling = computeMetrics(curveFrom([104, 103, 102, 101, 100]), [], '1d', 0, 0);
    expect(falling.sortino).toBeLessThan(0);
  });

  it('separates the strategy from the asset it traded', () => {
    const m = computeMetrics(curveFrom([1000, 1010, 1020], [1000, 1500, 2000]), [], '1d', 0, 0);
    expect(m.totalReturn).toBeCloseTo(0.02, 10);
    expect(m.benchmarkReturn).toBeCloseTo(1, 10);
    expect(m.excessReturn).toBeCloseTo(-0.98, 10);
  });

  it('computes win rate and profit factor over round trips', () => {
    const trades: Trade[] = [
      { openTime: 0, closeTime: DAY, side: 'long', entryPrice: 1, exitPrice: 2, qty: 1, pnl: 100, returnPct: 1, bars: 1 },
      { openTime: DAY, closeTime: 2 * DAY, side: 'long', entryPrice: 1, exitPrice: 1, qty: 1, pnl: -50, returnPct: -0.5, bars: 1 },
    ];
    const m = computeMetrics(curveFrom([1000, 1100, 1050]), trades, '1d', 0, 0);
    expect(m.winRate).toBeCloseTo(0.5, 10);
    expect(m.profitFactor).toBeCloseTo(2, 10);
  });

  it('survives a curve too short to measure', () => {
    const m = computeMetrics(curveFrom([1000]), [], '1d', 0, 0);
    expect(m.totalReturn).toBe(0);
    expect(m.startEquity).toBe(1000);
  });
});

describe('caveats', () => {
  it('flags a result with too few trades to mean anything', () => {
    const m = computeMetrics(curveFrom([1000, 1500]), [], '1d', 0, 0);
    expect(caveats(m).join(' ')).toMatch(/round trips/);
  });

  it('says plainly when buy-and-hold won', () => {
    const m = computeMetrics(curveFrom([1000, 1010], [1000, 3000]), [], '1d', 0, 0);
    expect(caveats(m).join(' ')).toMatch(/did not beat holding/);
  });

  it('flags fees that exceed the entire profit', () => {
    const m = computeMetrics(curveFrom([1000, 1010]), [], '1d', 500, 0);
    expect(caveats(m).join(' ')).toMatch(/paying the exchange/);
  });
});

import { describe, expect, it } from 'vitest';
import { atr, ema, mean, rsi, returns, sma, stdev, stdevAll, zscore } from '../src/indicators/index.js';

describe('sma', () => {
  it('averages the last n values and ignores the rest', () => {
    expect(sma([1, 2, 3, 100, 200, 300], 3)).toBe(200);
  });

  it('returns null before there is enough history', () => {
    expect(sma([1, 2], 3)).toBeNull();
  });
});

describe('ema', () => {
  it('equals the value itself on a flat series', () => {
    expect(ema(Array.from({ length: 50 }, () => 7), 10)).toBeCloseTo(7, 10);
  });

  it('tracks a rising series above its simple average', () => {
    const rising = Array.from({ length: 40 }, (_, i) => i + 1);
    const fast = ema(rising, 5) as number;
    expect(fast).toBeGreaterThan(sma(rising, 5) as number);
  });

  it('is unchanged by history far beyond the window cap', () => {
    const period = 10;
    const tail = Array.from({ length: period * 12 }, (_, i) => 100 + Math.sin(i));
    const withPrefix = [...Array.from({ length: 500 }, () => 1), ...tail];
    // The cap drops the prefix, and at this distance the prefix's weight is
    // smaller than any price increment the bot could trade on.
    expect(ema(withPrefix, period) as number).toBeCloseTo(ema(tail, period) as number, 6);
  });
});

describe('stdev and zscore', () => {
  it('is zero on a flat window, so the z-score is undefined rather than infinite', () => {
    expect(stdev([5, 5, 5, 5], 4)).toBe(0);
    expect(zscore([5, 5, 5, 5], 4)).toBeNull();
  });

  it('reports how many deviations the last value sits from the mean', () => {
    const values = [10, 12, 14, 16, 18];
    const z = zscore(values, 5) as number;
    expect(z).toBeGreaterThan(1);
    expect(z).toBeLessThan(2);
  });
});

describe('rsi', () => {
  it('is 100 when every change is a gain', () => {
    expect(rsi([1, 2, 3, 4, 5, 6], 5)).toBe(100);
  });

  it('is 0 when every change is a loss', () => {
    expect(rsi([6, 5, 4, 3, 2, 1], 5)).toBe(0);
  });
});

describe('atr', () => {
  it('counts the gap between bars, not only the bar range', () => {
    const highs = [10, 20, 30];
    const lows = [9, 19, 29];
    const closes = [9.5, 19.5, 29.5];
    // Each bar spans 1 but gaps ~10 from the previous close, so true range is
    // driven by the gap.
    expect(atr(highs, lows, closes, 2) as number).toBeGreaterThan(9);
  });
});

describe('returns, mean, stdevAll', () => {
  it('produces one fewer return than prices', () => {
    expect(returns([100, 110, 121])).toHaveLength(2);
    expect(returns([100, 110, 121])[1]).toBeCloseTo(0.1, 10);
  });

  it('handles degenerate input without throwing', () => {
    expect(mean([])).toBe(0);
    expect(stdevAll([1])).toBe(0);
  });
});

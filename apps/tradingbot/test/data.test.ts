import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseKlines } from '../src/data/binance.js';
import {
  auditSeries,
  cachePath,
  cleanSeries,
  readCandles,
  readCandlesIfPresent,
  sliceByTime,
  writeCandles,
} from '../src/data/store.js';
import { makeRng, randomWalk, trendingSeries } from '../src/data/synthetic.js';
import type { Candle } from '../src/types.js';

const DAY = 86_400_000;

function bar(i: number, close: number): Candle {
  return { openTime: i * DAY, open: close, high: close, low: close, close, volume: 1 };
}

describe('parseKlines', () => {
  it('reads the fields Binance actually sends', () => {
    const candles = parseKlines([
      [1609459200000, '29000.1', '29500.0', '28800.5', '29300.2', '1234.5', 1609545599999, '0', 0, '0', '0', '0'],
    ]);
    expect(candles[0]).toEqual({
      openTime: 1609459200000,
      open: 29000.1,
      high: 29500,
      low: 28800.5,
      close: 29300.2,
      volume: 1234.5,
    });
  });

  it('refuses a row with a non-numeric price instead of silently making it NaN', () => {
    expect(() => parseKlines([[1, 'oops', '2', '3', '4', '5']])).toThrow(/bad open/);
  });

  it('refuses a payload that is not an array of rows', () => {
    expect(() => parseKlines({ error: 'rate limited' })).toThrow(/array of klines/);
    expect(() => parseKlines([[1, '2']])).toThrow(/at least 6 fields/);
  });
});

describe('the CSV cache', () => {
  it('survives a round trip unchanged', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bot-store-'));
    const path = cachePath(dir, 'btcusdt', '1h');
    expect(path).toMatch(/BTCUSDT-1h\.csv$/);

    const candles = trendingSeries(50, '1h', 1);
    writeCandles(path, candles);
    const read = readCandles(path);
    expect(read).toHaveLength(candles.length);
    expect(read[10]?.close).toBeCloseTo(candles[10]?.close as number, 8);
  });

  it('returns null for a file that is not there, rather than throwing', () => {
    expect(readCandlesIfPresent(join(tmpdir(), 'definitely-not-here.csv'))).toBeNull();
  });

  it('names the line when a row is corrupt', () => {
    const dir = mkdtempSync(join(tmpdir(), 'bot-store-'));
    const path = join(dir, 'broken.csv');
    writeFileSync(path, 'openTime,open,high,low,close,volume\n1,2,3,4,five,6\n', 'utf8');
    expect(() => readCandles(path)).toThrow(/:2 has a non-numeric close/);
  });
});

describe('auditSeries', () => {
  it('counts the bars that should be there and are not', () => {
    const audit = auditSeries([bar(0, 100), bar(1, 101), bar(5, 105)], '1d');
    expect(audit.count).toBe(3);
    expect(audit.missingBars).toBe(3);
  });

  it('finds duplicates, disorder and impossible bars', () => {
    const audit = auditSeries(
      [
        bar(0, 100),
        bar(0, 100),
        bar(2, 100),
        bar(1, 100),
        { openTime: 3 * DAY, open: 100, high: 90, low: 110, close: 100, volume: 1 },
      ],
      '1d',
    );
    expect(audit.duplicates).toBe(1);
    expect(audit.outOfOrder).toBe(1);
    expect(audit.invalidRanges).toBe(1);
  });

  it('is clean for a complete series', () => {
    const audit = auditSeries(trendingSeries(100, '1d', 2), '1d');
    expect(audit.missingBars).toBe(0);
    expect(audit.duplicates).toBe(0);
    expect(audit.invalidRanges).toBe(0);
  });
});

describe('cleanSeries and sliceByTime', () => {
  it('sorts, de-duplicates and drops impossible bars', () => {
    const cleaned = cleanSeries([
      bar(2, 102),
      bar(0, 100),
      bar(0, 100),
      { openTime: 3 * DAY, open: 100, high: 90, low: 110, close: 100, volume: 1 },
    ]);
    expect(cleaned.map((c) => c.openTime)).toEqual([0, 2 * DAY]);
  });

  it('keeps only the requested window', () => {
    const series = [bar(0, 1), bar(1, 2), bar(2, 3), bar(3, 4)];
    expect(sliceByTime(series, DAY, 2 * DAY)).toHaveLength(2);
    expect(sliceByTime(series)).toHaveLength(4);
  });
});

describe('synthetic series', () => {
  it('is identical for the same seed and different for another', () => {
    const a = randomWalk(100, '1d', 99);
    const b = randomWalk(100, '1d', 99);
    const c = randomWalk(100, '1d', 100);
    expect(a.map((x) => x.close)).toEqual(b.map((x) => x.close));
    expect(a[50]?.close).not.toBe(c[50]?.close);
  });

  it('produces bars whose high and low contain the open and close', () => {
    for (const candle of randomWalk(500, '1h', 7)) {
      expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
      expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
      expect(candle.close).toBeGreaterThan(0);
    }
  });

  it('draws uniformly enough to be usable as a generator', () => {
    const rng = makeRng(5);
    const draws = Array.from({ length: 10_000 }, () => rng());
    const average = draws.reduce((s, v) => s + v, 0) / draws.length;
    expect(average).toBeGreaterThan(0.48);
    expect(average).toBeLessThan(0.52);
    expect(Math.min(...draws)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...draws)).toBeLessThan(1);
  });
});

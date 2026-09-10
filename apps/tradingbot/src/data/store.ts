import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { INTERVAL_MS, type Candle, type Interval } from '../types.js';

/**
 * Candles on disk, as CSV.
 *
 * CSV rather than a database because the point of a cache here is that you can
 * open it, eyeball it, and hand it to something else. A research loop that
 * re-downloads years of history on every run is a research loop nobody runs
 * twice.
 */
export function cachePath(dataDir: string, symbol: string, interval: Interval): string {
  return join(resolve(dataDir), `${symbol.toUpperCase()}-${interval}.csv`);
}

const HEADER = 'openTime,open,high,low,close,volume';

export function writeCandles(path: string, candles: readonly Candle[]): void {
  mkdirSync(dirname(path), { recursive: true });
  const lines = [HEADER];
  for (const c of candles) {
    lines.push(`${c.openTime},${c.open},${c.high},${c.low},${c.close},${c.volume}`);
  }
  writeFileSync(path, `${lines.join('\n')}\n`, 'utf8');
}

export function readCandles(path: string): Candle[] {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  const out: Candle[] = [];

  for (const [index, line] of lines.entries()) {
    if (index === 0 && line.startsWith('openTime')) continue;
    const parts = line.split(',');
    if (parts.length < 6) throw new Error(`${path}:${index + 1} has fewer than 6 columns`);
    const candle: Candle = {
      openTime: Number(parts[0]),
      open: Number(parts[1]),
      high: Number(parts[2]),
      low: Number(parts[3]),
      close: Number(parts[4]),
      volume: Number(parts[5]),
    };
    for (const [key, value] of Object.entries(candle)) {
      if (!Number.isFinite(value)) {
        throw new Error(`${path}:${index + 1} has a non-numeric ${key}: ${value}`);
      }
    }
    out.push(candle);
  }

  return out;
}

export function readCandlesIfPresent(path: string): Candle[] | null {
  return existsSync(path) ? readCandles(path) : null;
}

/**
 * What is wrong with a series, if anything.
 *
 * Gaps matter more than they look. A missing hour in the middle of a series
 * quietly changes what "the last 20 bars" means, and an exchange outage tends to
 * sit exactly where the most violent price move was — so the bars a backtest is
 * missing are rarely the boring ones.
 */
export interface SeriesAudit {
  count: number;
  firstTime: number | null;
  lastTime: number | null;
  /** Bars that should exist between first and last but do not. */
  missingBars: number;
  duplicates: number;
  outOfOrder: number;
  /** Bars where high < low, or the close sits outside the range. */
  invalidRanges: number;
}

export function auditSeries(candles: readonly Candle[], interval: Interval): SeriesAudit {
  const barMs = INTERVAL_MS[interval];
  const first = candles[0];
  const last = candles[candles.length - 1];
  let duplicates = 0;
  let outOfOrder = 0;
  let invalidRanges = 0;

  for (let i = 0; i < candles.length; i += 1) {
    const c = candles[i] as Candle;
    if (c.high < c.low || c.close > c.high || c.close < c.low || c.open > c.high || c.open < c.low) {
      invalidRanges += 1;
    }
    const prev = candles[i - 1];
    if (prev) {
      if (c.openTime === prev.openTime) duplicates += 1;
      else if (c.openTime < prev.openTime) outOfOrder += 1;
    }
  }

  const expected =
    first && last ? Math.round((last.openTime - first.openTime) / barMs) + 1 : candles.length;

  return {
    count: candles.length,
    firstTime: first?.openTime ?? null,
    lastTime: last?.openTime ?? null,
    missingBars: Math.max(0, expected - candles.length),
    duplicates,
    outOfOrder,
    invalidRanges,
  };
}

/** Sort, drop duplicates, and drop rows that fail the range check. */
export function cleanSeries(candles: readonly Candle[]): Candle[] {
  const sorted = [...candles].sort((a, b) => a.openTime - b.openTime);
  const out: Candle[] = [];
  for (const c of sorted) {
    if (c.high < c.low) continue;
    const prev = out[out.length - 1];
    if (prev && prev.openTime === c.openTime) continue;
    out.push(c);
  }
  return out;
}

/** Keep only the candles inside `[from, to]`, both epoch milliseconds. */
export function sliceByTime(candles: readonly Candle[], from?: number, to?: number): Candle[] {
  return candles.filter(
    (c) => (from === undefined || c.openTime >= from) && (to === undefined || c.openTime <= to),
  );
}

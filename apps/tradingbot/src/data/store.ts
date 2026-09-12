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
  /**
   * Overnight gaps that look like an unadjusted split rather than a price move.
   *
   * The quietest way an equity backtest goes wrong. A 2-for-1 split in a
   * price series that has not been adjusted for it looks exactly like a 50%
   * overnight crash: a trend filter sells into it, a dip-buyer buys it, and both
   * results are fiction. Crypto has no splits, so this list is empty there and
   * costs nothing to check.
   */
  suspectedActions: CorporateActionSuspect[];
}

export interface CorporateActionSuspect {
  time: number;
  /** Previous close divided by this bar's open. */
  ratio: number;
  /** The simple ratio it sits close to, written the way a split is quoted. */
  looksLike: string;
}

/**
 * Ratios that a split or reverse split produces. Anything landing very close to
 * one of these, on a large gap, is far more likely to be a corporate action than
 * a genuine overnight move of that size.
 */
const SPLIT_RATIOS: readonly { value: number; label: string }[] = [
  { value: 2, label: '2-for-1' },
  { value: 3, label: '3-for-1' },
  { value: 4, label: '4-for-1' },
  { value: 5, label: '5-for-1' },
  { value: 10, label: '10-for-1' },
  { value: 20, label: '20-for-1' },
  { value: 1.5, label: '3-for-2' },
  { value: 1 / 2, label: '1-for-2 reverse' },
  { value: 1 / 3, label: '1-for-3 reverse' },
  { value: 1 / 4, label: '1-for-4 reverse' },
  { value: 1 / 5, label: '1-for-5 reverse' },
  { value: 1 / 10, label: '1-for-10 reverse' },
];

/**
 * Flag overnight gaps that look like unadjusted corporate actions.
 *
 * Deliberately a suspicion rather than a correction. A genuine crash that happens
 * to land within the tolerance of a round ratio would be flagged too, and silently
 * "fixing" a real price move is worse than asking a human to look. Two conditions
 * have to hold: the gap is large, and it is close to a ratio that a split produces.
 */
export function detectUnadjustedActions(
  candles: readonly Candle[],
  options: { minimumGap?: number; tolerance?: number } = {},
): CorporateActionSuspect[] {
  const minimumGap = options.minimumGap ?? 0.2;
  const tolerance = options.tolerance ?? 0.02;
  const out: CorporateActionSuspect[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const previous = candles[i - 1] as Candle;
    const current = candles[i] as Candle;
    if (previous.close <= 0 || current.open <= 0) continue;

    const ratio = previous.close / current.open;
    const gap = Math.abs(ratio - 1);
    if (gap < minimumGap) continue;

    for (const candidate of SPLIT_RATIOS) {
      if (Math.abs(ratio - candidate.value) / candidate.value <= tolerance) {
        out.push({ time: current.openTime, ratio, looksLike: candidate.label });
        break;
      }
    }
  }

  return out;
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
    suspectedActions: detectUnadjustedActions(candles),
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

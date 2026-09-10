import { INTERVAL_MS, type Candle, type Interval } from '../types.js';

/**
 * Public market data from Binance.
 *
 * This module reads only. There is no API key, no signature, and no order
 * endpoint anywhere in it — the public klines endpoint needs no credentials, and
 * keeping the data path credential-free means nothing in the research loop can
 * accidentally place a trade.
 *
 * `data-api.binance.vision` is Binance's own read-only mirror for exactly this
 * purpose. It is less likely to be geo-blocked than the main host, so it is the
 * default, with the main API as a fallback.
 */
const HOSTS = ['https://data-api.binance.vision', 'https://api.binance.com'];

/** Binance returns at most this many klines per request. */
const MAX_LIMIT = 1000;

export interface FetchOptions {
  symbol: string;
  interval: Interval;
  /** Inclusive start, epoch milliseconds. */
  startTime: number;
  /** Exclusive end, epoch milliseconds. Defaults to now. */
  endTime?: number;
  /** Called after each page so a long download can show progress. */
  onProgress?: (fetched: number, upTo: number) => void;
}

/**
 * Download every closed candle in the window, paging forward from `startTime`.
 *
 * The last, still-forming candle is dropped. Including it is a subtle and
 * expensive bug: its close keeps changing, so a strategy tested against it is
 * reacting to a price that had not settled yet.
 */
export async function fetchCandles(options: FetchOptions): Promise<Candle[]> {
  const { symbol, interval, startTime, onProgress } = options;
  const endTime = options.endTime ?? Date.now();
  const barMs = INTERVAL_MS[interval];
  const out: Candle[] = [];
  let cursor = startTime;

  while (cursor < endTime) {
    const page = await fetchPage(symbol, interval, cursor, endTime);
    if (page.length === 0) break;

    for (const candle of page) {
      // Drop anything at or past the bar that is still open right now.
      if (candle.openTime + barMs > Date.now()) continue;
      if (candle.openTime >= endTime) continue;
      const previous = out[out.length - 1];
      if (previous && candle.openTime <= previous.openTime) continue;
      out.push(candle);
    }

    const lastOpen = page[page.length - 1]?.openTime;
    if (lastOpen === undefined) break;
    const nextCursor = lastOpen + barMs;
    if (nextCursor <= cursor) break;
    cursor = nextCursor;

    onProgress?.(out.length, cursor);

    // Binance's weight limit is generous for klines, but a tight loop over years
    // of minute data will still trip it. A short pause costs nothing next to
    // being rate-limited into a ban.
    if (page.length === MAX_LIMIT) await sleep(120);
  }

  return out;
}

async function fetchPage(
  symbol: string,
  interval: Interval,
  startTime: number,
  endTime: number,
): Promise<Candle[]> {
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
    startTime: String(startTime),
    endTime: String(endTime),
    limit: String(MAX_LIMIT),
  });

  let lastError: unknown;
  for (const host of HOSTS) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetch(`${host}/api/v3/klines?${params.toString()}`, {
          headers: { accept: 'application/json' },
        });
        if (response.status === 429 || response.status === 418) {
          // Respect the exchange's own backoff hint when it sends one.
          const retryAfter = Number(response.headers.get('retry-after') ?? '5');
          await sleep(Math.min(60, Math.max(1, retryAfter)) * 1000);
          continue;
        }
        if (!response.ok) {
          throw new Error(`${host} answered ${response.status}: ${await safeText(response)}`);
        }
        return parseKlines(await response.json());
      } catch (error) {
        lastError = error;
        await sleep(500 * (attempt + 1));
      }
    }
  }

  throw new Error(
    `Could not reach Binance market data. Last error: ${String(lastError)}. ` +
      `If you are on a network that blocks exchange APIs, download the candles ` +
      `elsewhere and point the bot at the CSV with --csv.`,
  );
}

/** Turn Binance's array-of-arrays into candles, rejecting anything malformed. */
export function parseKlines(payload: unknown): Candle[] {
  if (!Array.isArray(payload)) throw new Error('Expected an array of klines');
  return payload.map((row, index) => {
    if (!Array.isArray(row) || row.length < 6) {
      throw new Error(`Kline ${index} is not a row of at least 6 fields`);
    }
    const candle: Candle = {
      openTime: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    };
    for (const [key, value] of Object.entries(candle)) {
      if (!Number.isFinite(value)) throw new Error(`Kline ${index} has a bad ${key}: ${value}`);
    }
    return candle;
  });
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 200);
  } catch {
    return '<no body>';
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

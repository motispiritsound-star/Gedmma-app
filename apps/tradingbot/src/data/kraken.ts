import { INTERVAL_MS, type Candle, type Interval } from '../types.js';
import type { DataSource } from './source.js';

/**
 * Kraken's public market data.
 *
 * This is the venue where the crypto strategies in this repository can actually
 * be traded by a European retail client, which IBKR cannot serve. Three things
 * about the API shape the code below, and all three are the kind of detail that
 * silently corrupts a backtest:
 *
 * The OHLC endpoint returns **at most 720 bars**, whatever you ask for. Six
 * hundred days of daily history is the ceiling, not a default. Longer backtests
 * need Kraken's downloadable OHLCVT archives, fed in with `--csv`.
 *
 * The last bar in the response is **the current, still-forming candle, and it is
 * always present** regardless of the `since` you passed. Its close keeps moving. A
 * strategy tested against it is reacting to a price that had not settled, and
 * dropping it is not optional.
 *
 * And the response is keyed by Kraken's own canonical pair name, not by the one
 * you asked for: ask for `XBTEUR` and the answer arrives under `XXBTZEUR`.
 */
const PUBLIC_BASE = 'https://api.kraken.com/0/public';

/** Our interval names as Kraken's `interval` parameter, which is in minutes. */
const MINUTES_FOR: Record<Interval, number> = {
  '1m': 1,
  '5m': 5,
  '15m': 15,
  '1h': 60,
  '4h': 240,
  '1d': 1440,
};

/** Kraken never returns more than this many bars from the OHLC endpoint. */
export const MAX_OHLC_BARS = 720;

export interface KrakenPair {
  /** Kraken's canonical name, e.g. XXBTZEUR. */
  name: string;
  /** The shorter alternate name, e.g. XBTEUR. */
  altname: string;
  base: string;
  quote: string;
  /** Smallest order Kraken will accept, in base units. */
  orderMin: number;
  /** Decimals allowed in an order volume. More than this is rejected. */
  volumeDecimals: number;
  /** Decimals allowed in a price. */
  priceDecimals: number;
}

interface KrakenEnvelope<T> {
  error: string[];
  result?: T;
}

/**
 * Unwrap Kraken's envelope.
 *
 * Kraken answers HTTP 200 with an `error` array for most failures, so a client
 * that only checks the status code treats a rejected order as a success.
 */
export function unwrap<T>(payload: unknown, what: string): T {
  const envelope = payload as KrakenEnvelope<T> | null;
  if (!envelope || typeof envelope !== 'object') {
    throw new Error(`Kraken returned something that is not an envelope for ${what}`);
  }
  if (Array.isArray(envelope.error) && envelope.error.length > 0) {
    throw new Error(`Kraken refused ${what}: ${envelope.error.join('; ')}`);
  }
  if (envelope.result === undefined) {
    throw new Error(`Kraken returned no result for ${what}`);
  }
  return envelope.result;
}

/** Parse the OHLC payload, dropping the bar that has not closed yet. */
export function parseOhlc(result: unknown, interval: Interval, now = Date.now()): Candle[] {
  const record = result as Record<string, unknown>;
  // Everything except `last` is the pair, under whatever name Kraken prefers.
  const key = Object.keys(record).find((k) => k !== 'last');
  if (key === undefined) throw new Error('Kraken returned no OHLC series');
  const rows = record[key];
  if (!Array.isArray(rows)) throw new Error('Kraken OHLC series is not an array');

  const barMs = INTERVAL_MS[interval];
  return rows
    .map((row) => {
      if (!Array.isArray(row) || row.length < 7) {
        throw new Error('Kraken OHLC row does not have the expected 8 fields');
      }
      return {
        openTime: Number(row[0]) * 1000,
        open: Number(row[1]),
        high: Number(row[2]),
        low: Number(row[3]),
        close: Number(row[4]),
        volume: Number(row[6]),
      };
    })
    .filter((candle) => {
      for (const value of Object.values(candle)) {
        if (!Number.isFinite(value)) return false;
      }
      // The still-forming bar is always present and always has to go.
      return candle.openTime + barMs <= now;
    })
    .sort((a, b) => a.openTime - b.openTime);
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}

/**
 * Contract details for a pair.
 *
 * Worth fetching before trading rather than guessing: an order with one decimal
 * too many, or below `ordermin`, is rejected outright, and a bot that discovers
 * that at the moment it wants to exit is a bot with a position it cannot close.
 */
export async function fetchPair(pair: string): Promise<KrakenPair> {
  const result = unwrap<Record<string, unknown>>(
    await getJson(`${PUBLIC_BASE}/AssetPairs?pair=${encodeURIComponent(pair)}`),
    `AssetPairs for ${pair}`,
  );
  const name = Object.keys(result)[0];
  if (name === undefined) throw new Error(`Kraken knows no pair called "${pair}"`);
  const record = result[name] as Record<string, unknown>;
  return {
    name,
    altname: typeof record.altname === 'string' ? record.altname : name,
    base: typeof record.base === 'string' ? record.base : '',
    quote: typeof record.quote === 'string' ? record.quote : '',
    orderMin: Number(record.ordermin ?? 0),
    volumeDecimals: Number(record.lot_decimals ?? 8),
    priceDecimals: Number(record.pair_decimals ?? 2),
  };
}

export interface KrakenOhlcOptions {
  pair: string;
  interval: Interval;
  /** Epoch milliseconds. Kraken still caps the answer at 720 bars. */
  since?: number;
}

export async function fetchKrakenCandles(options: KrakenOhlcOptions): Promise<Candle[]> {
  const query = new URLSearchParams({
    pair: options.pair,
    interval: String(MINUTES_FOR[options.interval]),
  });
  if (options.since !== undefined) {
    query.set('since', String(Math.floor(options.since / 1000)));
  }
  const result = unwrap<unknown>(
    await getJson(`${PUBLIC_BASE}/OHLC?${query.toString()}`),
    `OHLC for ${options.pair}`,
  );
  return parseOhlc(result, options.interval);
}

/** Kraken public data behind the `DataSource` interface. */
export function krakenDataSource(): DataSource {
  return {
    name: 'kraken',
    async recent(instrument: string, interval: Interval, bars: number): Promise<Candle[]> {
      if (bars > MAX_OHLC_BARS) {
        throw new Error(
          `Kraken's OHLC endpoint returns at most ${MAX_OHLC_BARS} bars, and ${bars} were ` +
            `asked for. Use a coarser interval, or download Kraken's historical OHLCVT ` +
            `archive and backtest it with --csv.`,
        );
      }
      const candles = await fetchKrakenCandles({
        pair: instrument,
        interval,
        since: Date.now() - (bars + 2) * INTERVAL_MS[interval],
      });
      return candles.slice(-bars);
    },
    async since(instrument: string, interval: Interval, sinceOpenTime: number): Promise<Candle[]> {
      const candles = await fetchKrakenCandles({ pair: instrument, interval, since: sinceOpenTime });
      return candles.filter((c) => c.openTime > sinceOpenTime);
    },
  };
}

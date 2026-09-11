import type { IbkrClient } from '../broker/ibkrClient.js';
import { INTERVAL_MS, type Candle, type Interval } from '../types.js';
import type { DataSource } from './source.js';

/** Our interval names in IBKR's bar grammar. */
const BAR_FOR: Record<Interval, string> = {
  '1m': '1min',
  '5m': '5mins',
  '15m': '15mins',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

/**
 * How much history to ask for, in IBKR's period grammar.
 *
 * Padded generously, because IBKR returns regular trading hours only: a request
 * sized as if the market ran 24/7 comes back about a third short on intraday
 * bars and two-sevenths short on daily ones. Asking for too much costs one
 * request; asking for too little silently shortens every indicator's window.
 */
export function periodFor(interval: Interval, bars: number): string {
  const calendarDays = Math.ceil(((bars * INTERVAL_MS[interval]) / 86_400_000) * 2.2) + 2;
  if (calendarDays <= 30) return `${Math.max(1, calendarDays)}d`;
  const months = Math.ceil(calendarDays / 30);
  if (months <= 11) return `${months}m`;
  return `${Math.ceil(months / 12)}y`;
}

export interface IbkrDataOptions {
  client: IbkrClient;
  /**
   * Include pre- and post-market bars. Left false, because those prints are thin
   * and wide and are not where a market order at the open would go.
   */
  outsideRth?: boolean;
}

/**
 * Historical and recent bars from an IBKR gateway.
 *
 * Instruments are named by contract ID here, not ticker: "AAPL" is several
 * contracts on several venues in several currencies, and guessing which one is
 * meant is how an order ends up on the wrong exchange. Use `ibkr search` to find
 * the conid once, then use the number.
 */
export function ibkrDataSource(options: IbkrDataOptions): DataSource {
  const { client } = options;
  const outsideRth = options.outsideRth ?? false;

  const fetch = async (instrument: string, interval: Interval, bars: number): Promise<Candle[]> => {
    const conid = Number(instrument);
    if (!Number.isInteger(conid) || conid <= 0) {
      throw new Error(
        `IBKR instruments are contract IDs, not tickers — got "${instrument}". ` +
          `Run "bot ibkr search --symbol ${instrument}" to find the conid.`,
      );
    }
    const rows = await client.history({
      conid,
      period: periodFor(interval, bars),
      bar: BAR_FOR[interval],
      outsideRth,
    });

    const barMs = INTERVAL_MS[interval];
    const now = Date.now();
    return rows
      // Drop the bar that is still forming; its close keeps moving.
      .filter((row) => row.openTime + barMs <= now)
      .sort((a, b) => a.openTime - b.openTime)
      .map((row) => ({
        openTime: row.openTime,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
      }));
  };

  return {
    name: 'ibkr',
    async recent(instrument, interval, bars) {
      const candles = await fetch(instrument, interval, bars);
      return candles.slice(-bars);
    },
    async since(instrument, interval, sinceOpenTime) {
      // IBKR has no "since" parameter, so a short window is fetched and filtered.
      const candles = await fetch(instrument, interval, 50);
      return candles.filter((c) => c.openTime > sinceOpenTime);
    },
  };
}

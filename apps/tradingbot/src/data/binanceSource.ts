import { INTERVAL_MS, type Candle, type Interval } from '../types.js';
import { fetchCandles } from './binance.js';
import type { DataSource } from './source.js';

/** Binance public market data behind the `DataSource` interface. */
export function binanceDataSource(): DataSource {
  return {
    name: 'binance',
    async recent(instrument: string, interval: Interval, bars: number): Promise<Candle[]> {
      const candles = await fetchCandles({
        symbol: instrument,
        interval,
        startTime: Date.now() - (bars + 5) * INTERVAL_MS[interval],
      });
      return candles.slice(-bars);
    },
    async since(instrument: string, interval: Interval, sinceOpenTime: number): Promise<Candle[]> {
      const candles = await fetchCandles({ symbol: instrument, interval, startTime: sinceOpenTime + 1 });
      return candles.filter((c) => c.openTime > sinceOpenTime);
    },
  };
}

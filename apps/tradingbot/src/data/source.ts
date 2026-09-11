import type { Candle, Interval } from '../types.js';

/**
 * Where a live loop gets its bars.
 *
 * An interface rather than a direct call to Binance, because the instrument you
 * can actually trade depends on the broker: IBKR will not sell a Dutch retail
 * client spot Bitcoin, and Binance has no opinion about Dutch equities. Testing a
 * strategy on one venue's prices and running it on another's is a category error
 * that looks like it works right up until the fills come back.
 */
export interface DataSource {
  readonly name: string;
  /**
   * The most recent `bars` closed candles, oldest first. Must never include the
   * bar that is still forming.
   */
  recent(instrument: string, interval: Interval, bars: number): Promise<Candle[]>;
  /** Candles after `sinceOpenTime`, exclusive. Used to poll for new bars. */
  since(instrument: string, interval: Interval, sinceOpenTime: number): Promise<Candle[]>;
}

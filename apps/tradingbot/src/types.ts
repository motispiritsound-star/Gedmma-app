/**
 * The vocabulary every other module shares.
 *
 * Two conventions run through the whole codebase and are worth stating once:
 *
 *  - Prices and cash are in the *quote* currency (USDT for BTCUSDT), quantities
 *    are in the *base* currency (BTC). Nothing here holds money in integers,
 *    because nothing here settles money; a backtest that is off by a cent is
 *    still a correct backtest.
 *  - A strategy never places orders. It returns a *target weight*: the fraction
 *    of equity it wants to hold in the asset. The broker turns that into orders.
 *    This is what makes two strategies comparable, and it is what keeps
 *    position-sizing decisions in one place instead of scattered through
 *    strategy code.
 */

/** One OHLCV bar. `openTime` is the epoch-millisecond start of the bar. */
export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Bar intervals, spelled the way exchanges spell them. */
export type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/** How many milliseconds one bar of each interval covers. */
export const INTERVAL_MS: Record<Interval, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '15m': 900_000,
  '1h': 3_600_000,
  '4h': 14_400_000,
  '1d': 86_400_000,
};

/** How many bars of each interval fit in a year. Used to annualise returns. */
export const BARS_PER_YEAR: Record<Interval, number> = {
  '1m': 525_600,
  '5m': 105_120,
  '15m': 35_040,
  '1h': 8_760,
  '4h': 2_190,
  '1d': 365,
};

export function isInterval(value: string): value is Interval {
  return value in INTERVAL_MS;
}

/** A completed change of position, recorded at the moment it filled. */
export interface Fill {
  time: number;
  /** Signed: positive bought base, negative sold base. */
  qty: number;
  /** The price actually paid, slippage included. */
  price: number;
  /** Commission in quote currency, always positive. */
  fee: number;
  /** Why the broker filled this — useful when reading a trade log. */
  reason: 'rebalance' | 'liquidate' | 'kill-switch';
}

/**
 * A round trip: the position went from flat to non-flat and back to flat (or to
 * the other side). Win rate and profit factor are computed over these, not over
 * individual fills, because a fill is not a bet.
 */
export interface Trade {
  openTime: number;
  closeTime: number;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  qty: number;
  /** Profit in quote currency, after the fees of both legs. */
  pnl: number;
  /** Profit as a fraction of the notional put at risk. */
  returnPct: number;
  bars: number;
}

/** One row of the equity curve, recorded at every bar close. */
export interface EquityPoint {
  time: number;
  /** Cash plus the mark-to-market value of the position. */
  equity: number;
  /** What the asset itself did over the same period, starting from the same cash. */
  benchmark: number;
  /** Fraction of equity held in the asset at this close. */
  weight: number;
  price: number;
}

/** What it costs to trade. Defaults are Binance spot taker fees, unrounded. */
export interface CostModel {
  /** Commission per fill, in basis points of notional. 10 bps = 0.10%. */
  feeBps: number;
  /**
   * The gap between the price you see and the price you get, in basis points.
   * On BTCUSDT with small size this is small; on a thin altcoin it is the
   * single biggest number in the model, and the one people leave at zero.
   */
  slippageBps: number;
  /**
   * Daily cost of holding a short, in basis points of notional. Spot cannot
   * short at all; this exists so that a short-enabled backtest is not quietly
   * free money.
   */
  borrowBpsPerDay: number;
}

export const DEFAULT_COSTS: CostModel = {
  feeBps: 10,
  slippageBps: 5,
  borrowBpsPerDay: 5,
};

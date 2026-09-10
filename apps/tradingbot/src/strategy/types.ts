import type { Candle } from '../types.js';

/**
 * What a strategy is allowed to see, and all it is allowed to see.
 *
 * `candles` ends at the bar that has just closed. There is no `next`, no index
 * into the full series, and no way to reach past the end — a strategy that
 * wants to cheat would have to be handed different data, which is exactly the
 * property a backtest needs.
 */
export interface StrategyContext {
  /** History up to and including the bar that just closed. */
  readonly candles: readonly Candle[];
  /** Closing prices of `candles`, precomputed because every strategy wants them. */
  readonly closes: readonly number[];
  /** The weight the portfolio currently holds, for strategies with hysteresis. */
  readonly currentWeight: number;
}

/**
 * A strategy maps history to a desired exposure.
 *
 * The return value is a target weight: the fraction of equity to hold in the
 * asset. `1` is fully long, `0` is flat, `-1` is fully short. Returning the
 * same number twice costs nothing — the broker only trades the difference.
 */
export interface Strategy {
  readonly name: string;
  /** A one-line description, printed in reports so a result is self-documenting. */
  readonly describe: string;
  /** The minimum number of bars before `onBar` can return anything but 0. */
  readonly warmupBars: number;
  onBar(ctx: StrategyContext): number;
}

/** A strategy that takes parameters, so the walk-forward search can vary them. */
export interface StrategyFactory<P> {
  readonly name: string;
  /** The parameter sets to search over. Keep this small; see docs/TRADING.md. */
  readonly grid: readonly P[];
  create(params: P): Strategy;
}

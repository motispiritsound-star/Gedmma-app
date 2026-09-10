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

/**
 * What a multi-asset strategy sees. Same discipline as `StrategyContext`: each
 * series in `history` has been grown one bar at a time, so it ends at the bar
 * that just closed and contains nothing after it.
 */
export interface PortfolioContext {
  readonly history: ReadonlyMap<string, readonly Candle[]>;
  readonly currentWeights: ReadonlyMap<string, number>;
  /** Index of the bar that just closed, on the aligned timeline. */
  readonly barIndex: number;
}

/**
 * A multi-asset strategy returns a target weight per symbol.
 *
 * It may return fewer symbols than the universe — anything absent is treated as
 * zero — and it need not respect the exposure limits. The portfolio engine caps
 * per symbol and in aggregate afterwards, so a strategy can express conviction
 * without also having to implement risk management.
 */
export interface PortfolioStrategy {
  readonly name: string;
  readonly describe: string;
  readonly warmupBars: number;
  onBar(ctx: PortfolioContext): Map<string, number>;
}

export interface PortfolioStrategyFactory<P> {
  readonly name: string;
  readonly grid: readonly P[];
  create(params: P): PortfolioStrategy;
}

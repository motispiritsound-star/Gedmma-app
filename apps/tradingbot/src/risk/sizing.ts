import { returns, stdevAll } from '../indicators/index.js';
import { BARS_PER_YEAR, type Interval } from '../types.js';

/**
 * Size the position by how much the market is moving, not by conviction.
 *
 * A strategy that is "fully long" holds a very different amount of risk in a calm
 * market than in a panic — the same weight can be 20% annualised volatility one
 * month and 90% the next. Scaling the weight so that realised volatility lands
 * near a target is the one sizing change with consistent evidence behind it
 * across asset classes: it does not improve the average return much, but it
 * flattens the worst drawdowns, and a drawdown you sit through is worth more than
 * a return you abandon.
 *
 * This deliberately only ever scales *down* past the cap. Volatility targeting
 * that levers up in quiet markets is how a strategy ends up maximally exposed
 * immediately before volatility returns, which is exactly when it returns.
 */
export interface SizingConfig {
  /** Annualised volatility to aim for, as a fraction. 0.2 is twenty percent. */
  targetAnnualVol: number;
  /** Bars of history used to estimate current volatility. */
  lookback: number;
  /** Never scale above this multiple of the strategy's own target weight. */
  maxLeverage: number;
}

export const DEFAULT_SIZING: SizingConfig = {
  targetAnnualVol: 0.2,
  lookback: 30,
  maxLeverage: 1,
};

/**
 * The multiplier to apply to a strategy's target weight.
 *
 * Returns 1 when there is not enough history to estimate volatility, so a
 * strategy is never silently flattened by a warm-up problem, and never more than
 * `maxLeverage`.
 */
export function volatilityScalar(
  closes: readonly number[],
  interval: Interval,
  config: SizingConfig,
): number {
  if (config.targetAnnualVol <= 0) return 1;
  if (closes.length < config.lookback + 1) return 1;

  const window = closes.slice(-(config.lookback + 1));
  const realised = stdevAll(returns(window)) * Math.sqrt(BARS_PER_YEAR[interval]);
  if (realised <= 0) return 1;

  return Math.min(config.maxLeverage, config.targetAnnualVol / realised);
}

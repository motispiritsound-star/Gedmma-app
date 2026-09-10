import type { CostModel } from '../types.js';

/**
 * The rules that sit between a strategy's opinion and the account's money.
 *
 * A strategy is allowed to be wrong. The risk layer's job is to make sure that
 * being wrong repeatedly costs a survivable amount, because the one thing no
 * edge can recover from is running out of capital. Everything here is a cap, a
 * floor, or a stop: nothing in this file can make a position larger than the
 * strategy asked for.
 */

export interface RiskLimits {
  /**
   * The largest fraction of equity that may sit in the asset. 1 means no
   * leverage and no borrowing. Above 1 is leverage, which is how the accounts
   * in the screenshots actually disappear.
   */
  maxWeight: number;
  /**
   * Stop trading for the rest of the day once equity is this far below the
   * day's starting equity. 0.05 is five percent.
   */
  maxDailyLossPct: number;
  /**
   * Stop trading entirely once equity is this far below its high-water mark.
   * This is the kill switch: it does not reset, because a strategy that has
   * lost this much has falsified itself and deserves a human looking at it.
   */
  maxDrawdownPct: number;
  /**
   * Don't rebalance for a weight change smaller than this. Without it a
   * strategy that oscillates around a threshold pays fees all day for nothing.
   */
  rebalanceThreshold: number;
  /** Skip any order below this notional, the way a real exchange would. */
  minOrderQuote: number;
}

/**
 * The defaults are deliberately loose enough that a long-only crypto strategy
 * can actually run. A 20% kill switch sounds prudent and is useless here: BTC
 * has drawn down more than 20% in most calendar years, so a long-only bot with
 * that switch shuts itself off in the first few months of any real history and
 * every backtest becomes a test of the switch instead of the strategy.
 *
 * Set `maxDrawdownPct` from the drawdown your own backtest showed, with room to
 * spare — its job is to catch a strategy that has stopped working, not ordinary
 * volatility it was always going to see.
 */
export const DEFAULT_LIMITS: RiskLimits = {
  maxWeight: 1,
  maxDailyLossPct: 0.1,
  maxDrawdownPct: 0.35,
  rebalanceThreshold: 0.05,
  minOrderQuote: 10,
};

export type RiskVerdict =
  | { action: 'allow'; weight: number }
  | { action: 'hold'; weight: number; reason: string }
  | { action: 'flatten'; reason: string };

/**
 * Tracks the state a risk decision needs: the high-water mark and where the
 * current day started. It is a class because it is the one genuinely stateful
 * part of the system, and hiding that state in a closure would make it harder
 * to assert on in a test.
 */
export class RiskManager {
  private readonly limits: RiskLimits;
  private highWater: number;
  private dayStartEquity: number;
  private dayIndex: number;
  private tripped: string | null = null;
  private haltedDay: number | null = null;
  private readonly enforceDailyLoss: boolean;

  /**
   * `enforceDailyLoss` exists because a daily loss limit cannot be honoured by
   * data coarser than a day. On daily bars the account is only ever observed
   * once per day, so a 10% daily stop would not stop anything — it would simply
   * sell the day after a bad close, which is a different strategy, not a risk
   * control. The backtest switches it off rather than pretend, and says so.
   */
  constructor(
    startingEquity: number,
    limits: RiskLimits = DEFAULT_LIMITS,
    enforceDailyLoss = true,
  ) {
    if (startingEquity <= 0) throw new Error('Starting equity must be positive');
    if (limits.maxWeight <= 0) throw new Error('maxWeight must be positive');
    this.limits = limits;
    this.enforceDailyLoss = enforceDailyLoss;
    this.highWater = startingEquity;
    this.dayStartEquity = startingEquity;
    this.dayIndex = 0;
  }

  /**
   * A snapshot of the state a restart would otherwise lose. The high-water mark
   * is the important one: without it, a bot restarted mid-drawdown measures its
   * drawdown from the bottom and cheerfully keeps trading.
   */
  get state(): RiskState {
    return {
      highWater: this.highWater,
      dayStartEquity: this.dayStartEquity,
      dayIndex: this.dayIndex,
      tripped: this.tripped,
      haltedDay: this.haltedDay,
    };
  }

  restoreFrom(state: RiskState): void {
    this.highWater = state.highWater;
    this.dayStartEquity = state.dayStartEquity;
    this.dayIndex = state.dayIndex;
    this.tripped = state.tripped;
    this.haltedDay = state.haltedDay;
  }

  /** True once the drawdown kill switch has fired. It never un-fires. */
  get isTripped(): boolean {
    return this.tripped !== null;
  }

  get trippedReason(): string | null {
    return this.tripped;
  }

  /**
   * Record the account's state at a bar close, before any decision is taken for
   * the next bar. Returns nothing; the verdict comes from `evaluate`.
   */
  mark(time: number, equity: number): void {
    const day = Math.floor(time / 86_400_000);
    if (day !== this.dayIndex) {
      this.dayIndex = day;
      this.dayStartEquity = equity;
      // A new day clears the daily stop but never the kill switch.
      this.haltedDay = null;
    }
    if (equity > this.highWater) this.highWater = equity;

    if (this.tripped === null && this.highWater > 0) {
      const drawdown = 1 - equity / this.highWater;
      if (drawdown >= this.limits.maxDrawdownPct) {
        this.tripped =
          `drawdown ${(drawdown * 100).toFixed(1)}% reached the ` +
          `${(this.limits.maxDrawdownPct * 100).toFixed(1)}% kill switch`;
      }
    }

    if (this.enforceDailyLoss && this.haltedDay === null && this.dayStartEquity > 0) {
      const dayLoss = 1 - equity / this.dayStartEquity;
      if (dayLoss >= this.limits.maxDailyLossPct) {
        this.haltedDay = day;
      }
    }
  }

  /**
   * Turn a strategy's target weight into the weight the broker may actually
   * trade toward.
   */
  evaluate(target: number, currentWeight: number, equity: number, price: number): RiskVerdict {
    if (this.tripped !== null) {
      return currentWeight === 0
        ? { action: 'hold', weight: 0, reason: this.tripped }
        : { action: 'flatten', reason: this.tripped };
    }

    if (this.haltedDay !== null) {
      // A daily stop closes risk and then sits out. It does not open anything.
      if (currentWeight !== 0) {
        return { action: 'flatten', reason: 'daily loss limit reached' };
      }
      return { action: 'hold', weight: 0, reason: 'daily loss limit reached' };
    }

    const capped = clamp(target, -this.limits.maxWeight, this.limits.maxWeight);
    const delta = Math.abs(capped - currentWeight);

    // Closing a position is always allowed, however small the change: refusing
    // to exit because the exit is small is how a stop-loss fails to fire.
    const isClosing = capped === 0 && currentWeight !== 0;
    if (!isClosing) {
      if (delta < this.limits.rebalanceThreshold) {
        return { action: 'hold', weight: currentWeight, reason: 'below rebalance threshold' };
      }
      if (delta * equity < this.limits.minOrderQuote) {
        return { action: 'hold', weight: currentWeight, reason: 'below exchange minimum order' };
      }
    }

    if (price <= 0) return { action: 'hold', weight: currentWeight, reason: 'no valid price' };
    return { action: 'allow', weight: capped };
  }
}

/** The risk manager's memory, so a restart does not forget a drawdown. */
export interface RiskState {
  highWater: number;
  dayStartEquity: number;
  dayIndex: number;
  tripped: string | null;
  haltedDay: number | null;
}

/**
 * The largest weight that can actually be held once the commission on the entry
 * comes out of the same pot of cash.
 *
 * A target of exactly 1.0 spends every cent on the asset and leaves nothing for
 * the fee, so the account finishes the fill a few cents overdrawn. A real
 * exchange rejects that, and left in place it quietly turns a no-leverage
 * backtest into a very slightly leveraged one — small, but the wrong direction,
 * and it compounds across thousands of fills.
 */
export function feeAdjustedCeiling(ceiling: number, costs: CostModel): number {
  return Math.max(0, ceiling * (1 - costs.feeBps / 10_000));
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

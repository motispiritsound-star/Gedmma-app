import type { Candle } from '../types.js';

/**
 * Protective exits, and the honest way to fill them.
 *
 * Two things about stops are almost always modelled wrongly, and both flatter the
 * result:
 *
 * A stop does not fill at the stop price. It becomes a market order when the
 * price touches it, and if the market gapped past it — overnight, over a weekend,
 * on a liquidation cascade — the fill is wherever the market reopened. A backtest
 * that fills every stop at exactly the stop price has quietly assumed away the
 * only losses a stop cannot protect you from, which are the large ones. So a stop
 * here fills at the worse of the trigger and the bar's open.
 *
 * And when a bar's range contains both the stop and the take-profit, OHLC data
 * cannot say which came first. Assuming the good one is how a backtest turns a
 * coin flip into an edge, so this assumes the stop.
 */
export interface StopConfig {
  /** Exit if price moves this fraction against the entry. 0.05 is five percent. */
  initialPct?: number;
  /** Exit if price retraces this fraction from the best price seen since entry. */
  trailingPct?: number;
  /** Exit if price moves this fraction in favour of the entry. */
  takeProfitPct?: number;
  /**
   * Bars to stay flat after a stop fires.
   *
   * Without this a stop is nearly useless on a trend strategy: the signal is
   * still long the bar after the exit, so the bot buys straight back in and the
   * only thing the stop achieved was two commissions. A cooldown is what turns it
   * into a risk control rather than a churn generator.
   */
  cooldownBars?: number;
}

export type StopReason = 'stop-loss' | 'trailing-stop' | 'take-profit';

export interface StopHit {
  /** The price the exit actually fills at, gap included. */
  price: number;
  reason: StopReason;
  /** The price the order was resting at, for comparison with `price`. */
  trigger: number;
  /** How much worse the fill was than the trigger, as a fraction. */
  slippedBy: number;
}

/** True when any exit is configured. Used to skip the work entirely otherwise. */
export function hasStops(config: StopConfig): boolean {
  return (
    (config.initialPct ?? 0) > 0 ||
    (config.trailingPct ?? 0) > 0 ||
    (config.takeProfitPct ?? 0) > 0
  );
}

/**
 * Tracks one open position's protective levels.
 *
 * Separate from the broker because the broker knows about money and this knows
 * about prices, and because a stop has to be checked inside a bar while the
 * broker only ever acts at its edges.
 */
export class StopTracker {
  private side: 'long' | 'short' | null = null;
  private entry = 0;
  /** Best price seen since entry: the high for a long, the low for a short. */
  private best = 0;
  private readonly config: StopConfig;

  constructor(config: StopConfig) {
    this.config = config;
    const fractions: (keyof StopConfig)[] = ['initialPct', 'trailingPct', 'takeProfitPct'];
    for (const key of fractions) {
      const value = config[key];
      if (value !== undefined && (value < 0 || value >= 1)) {
        throw new Error(`${key} must be a fraction in [0, 1), got ${value}`);
      }
    }
    const cooldown = config.cooldownBars;
    if (cooldown !== undefined && (cooldown < 0 || !Number.isInteger(cooldown))) {
      throw new Error(`cooldownBars must be a non-negative whole number, got ${cooldown}`);
    }
  }

  get isOpen(): boolean {
    return this.side !== null;
  }

  /** Called when a position is opened, at the price it was opened at. */
  open(side: 'long' | 'short', entryPrice: number): void {
    this.side = side;
    this.entry = entryPrice;
    this.best = entryPrice;
  }

  close(): void {
    this.side = null;
    this.entry = 0;
    this.best = 0;
  }

  /** Called once per bar after any exit check, to advance the trailing level. */
  observe(bar: Candle): void {
    if (this.side === 'long') this.best = Math.max(this.best, bar.high);
    else if (this.side === 'short') this.best = Math.min(this.best, bar.low);
  }

  /** The resting levels, for a journal or a report. Null when flat. */
  levels(): { stop: number | null; trailing: number | null; target: number | null } | null {
    if (this.side === null) return null;
    const long = this.side === 'long';
    const initial = this.config.initialPct;
    const trailing = this.config.trailingPct;
    const take = this.config.takeProfitPct;
    return {
      stop: initial ? this.entry * (long ? 1 - initial : 1 + initial) : null,
      trailing: trailing ? this.best * (long ? 1 - trailing : 1 + trailing) : null,
      target: take ? this.entry * (long ? 1 + take : 1 - take) : null,
    };
  }

  /**
   * Whether this bar takes the position out, and at what price.
   *
   * Call it before `observe` for the same bar: a trailing stop is measured from
   * the best price *before* this bar, because a bar that makes a new high and
   * then collapses through the old trailing level did exactly that in that order
   * as far as the data can tell.
   */
  check(bar: Candle): StopHit | null {
    if (this.side === null) return null;
    const levels = this.levels();
    if (!levels) return null;
    const long = this.side === 'long';

    // Candidate exits, each with the price it would actually fill at. For a loss
    // the gap works against you, so the fill is the worse of trigger and open.
    const candidates: StopHit[] = [];

    const addAdverse = (trigger: number | null, reason: StopReason): void => {
      if (trigger === null) return;
      const touched = long ? bar.low <= trigger : bar.high >= trigger;
      if (!touched) return;
      const price = long ? Math.min(trigger, bar.open) : Math.max(trigger, bar.open);
      candidates.push({
        price,
        reason,
        trigger,
        slippedBy: trigger === 0 ? 0 : Math.abs(price - trigger) / trigger,
      });
    };

    addAdverse(levels.stop, 'stop-loss');
    addAdverse(levels.trailing, 'trailing-stop');

    // An adverse exit wins whenever one is available, and the worst of them wins
    // among themselves: within one bar there is no information to do better, and
    // guessing in your own favour is how a backtest lies.
    if (candidates.length > 0) {
      return candidates.reduce((worst, c) =>
        long ? (c.price < worst.price ? c : worst) : c.price > worst.price ? c : worst,
      );
    }

    if (levels.target !== null) {
      const touched = long ? bar.high >= levels.target : bar.low <= levels.target;
      if (touched) {
        // A gap through a take-profit fills better than the resting order, which
        // is the one case where the gap is on your side.
        const price = long ? Math.max(levels.target, bar.open) : Math.min(levels.target, bar.open);
        return {
          price,
          reason: 'take-profit',
          trigger: levels.target,
          slippedBy: levels.target === 0 ? 0 : Math.abs(price - levels.target) / levels.target,
        };
      }
    }

    return null;
  }
}

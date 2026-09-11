import { BARS_PER_YEAR, type Candle, type Interval } from '../types.js';
import { normalCdf, normalSurvival } from './stats.js';

/**
 * What a return target actually requires, rather than whether it sounds nice.
 *
 * Every other module here measures a strategy. This one measures a *goal*, and it
 * exists because the question "can I turn X into Y in Z" has an exact answer that
 * nobody ever computes before committing the money. The answer does not depend on
 * which indicators you use, how good your code is, or how hard you work. It falls
 * out of three facts about compounding and leverage, and they are unforgiving.
 *
 * ## The ceiling on growth
 *
 * Leverage does not raise the Sharpe ratio; it scales both the return and the
 * volatility. For a strategy with annualised Sharpe `S` and volatility `σ`, taking
 * leverage `L` gives an arithmetic drift of `L·S·σ` and a variance of `L²σ²`, so
 * the *logarithmic* growth rate — the one that compounds — is
 *
 *     g(L) = L·S·σ − ½·L²·σ²
 *
 * That is a downward parabola in `L`. Differentiating, it peaks at `L* = S/σ`,
 * which is the Kelly fraction, and the peak value is
 *
 *     g(L*) = S²/2
 *
 * This is the result that decides everything below, and it is worth stating
 * plainly: **the fastest any strategy can compound, at any leverage, is `S²/2` per
 * year.** More leverage past `L*` makes you poorer, not richer, because the
 * variance term grows quadratically while the return term grows linearly. There is
 * no setting, no amount of effort and no cleverness that gets around it.
 *
 * So a target multiple `m` over `T` years requires
 *
 *     S ≥ √(2·ln(m)/T)
 *
 * and that is a *necessary* condition for the median outcome to reach the target,
 * not a sufficient one.
 *
 * ## The price of running at the ceiling
 *
 * At `L*`, the log-equity is a Brownian motion with drift `S²/2` and volatility
 * `S`, so `2μ/σ² = 1` exactly. The probability of ever falling to a fraction `f`
 * of your starting capital is then `exp(-2μ·|ln f|/σ²) = f`.
 *
 * Which reads: at growth-optimal leverage, the chance of being down 50% at some
 * point is 50%, and the chance of being down 90% is 10%. That is not a badly tuned
 * system. That is what optimal looks like.
 *
 * ## The floor leverage cannot cross
 *
 * All of the above assumes you can rebalance continuously and that a loss is just
 * a loss. With real leverage it is not: at `L` times leverage, a single adverse
 * move of `1/L` takes the account to zero and there is no recovery from zero. The
 * maths above permits a 50% drawdown; a liquidation at the same depth ends the
 * experiment permanently. So a leverage figure should always be read next to the
 * one-day move that would end it.
 */

export interface Goal {
  startingCapital: number;
  targetCapital: number;
  horizonYears: number;
}

export interface GrowthAssumption {
  /** Annualised Sharpe ratio of the strategy, before leverage. */
  sharpe: number;
  /** Annualised volatility of the strategy, before leverage. */
  volatility: number;
  /**
   * Fraction of growth-optimal leverage to run at. 1 is full Kelly — the fastest
   * possible compounding and the drawdowns in the comment above. Half Kelly gives
   * up a quarter of the growth rate for a great deal less pain, which is why
   * practitioners who use Kelly at all use a fraction of it.
   */
  kellyFraction: number;
}

export interface GoalOdds {
  /** Leverage the assumption implies. 1 is unlevered. */
  leverage: number;
  /** Annualised log growth rate. This is what compounds. */
  logGrowth: number;
  /** Annualised volatility after leverage. */
  volatility: number;
  /** Where the median path ends, as a multiple of starting capital. */
  medianMultiple: number;
  /** Probability of finishing at or above the target. */
  probabilityOfTarget: number;
  /** Probability of being down 50% from the start at some point within the horizon. */
  probabilityOfHalving: number;
  /** Probability of being down 90% from the start at some point within the horizon. */
  probabilityOfNinetyPercentLoss: number;
  /** The same two, but over all time rather than just the horizon. */
  eventualHalving: number;
  eventualNinetyPercentLoss: number;
  /**
   * The single adverse move that would wipe a levered account out, as a fraction.
   * Infinity when unlevered, because an unlevered long cannot be liquidated.
   */
  liquidationMove: number;
}

/** The multiple a goal asks for. */
export function targetMultiple(goal: Goal): number {
  if (goal.startingCapital <= 0) throw new Error('Starting capital must be positive');
  if (goal.targetCapital <= 0) throw new Error('Target capital must be positive');
  if (goal.horizonYears <= 0) throw new Error('The horizon must be positive');
  return goal.targetCapital / goal.startingCapital;
}

/**
 * The lowest Sharpe ratio at which the *median* outcome reaches the target, from
 * `S ≥ √(2·ln(m)/T)`.
 *
 * Necessary, not sufficient: it assumes growth-optimal leverage, continuous
 * rebalancing, no liquidation, and that the Sharpe ratio is real and known in
 * advance rather than estimated from a backtest.
 */
export function minimumSharpeFor(goal: Goal): number {
  const multiple = targetMultiple(goal);
  if (multiple <= 1) return 0;
  return Math.sqrt((2 * Math.log(multiple)) / goal.horizonYears);
}

/** The compound rate a goal needs over a period, as a fraction. */
export function requiredRatePerPeriod(goal: Goal, periodsPerYear: number): number {
  const multiple = targetMultiple(goal);
  return multiple ** (1 / (goal.horizonYears * periodsPerYear)) - 1;
}

export function assessGoal(goal: Goal, assumption: GrowthAssumption): GoalOdds {
  const { sharpe, volatility, kellyFraction } = assumption;
  if (volatility <= 0) throw new Error('Volatility must be positive');
  if (kellyFraction < 0) throw new Error('The Kelly fraction cannot be negative');

  const multiple = targetMultiple(goal);
  const horizon = goal.horizonYears;

  // Leverage is a fraction of the growth-optimal S/σ.
  const leverage = kellyFraction * (sharpe / volatility);
  const leveredVol = leverage * volatility;
  // g(L) = L·S·σ − ½L²σ², the log growth rate that actually compounds.
  const logGrowth = leverage * sharpe * volatility - 0.5 * leverage * leverage * volatility * volatility;

  const spread = leveredVol * Math.sqrt(horizon);
  const drift = logGrowth * horizon;
  const needed = Math.log(multiple);

  // normalSurvival rather than 1 - normalCdf: the interesting answers here are far
  // out in the tail, where the CDF approximation has nothing left to subtract.
  const probabilityOfTarget =
    spread <= 0 ? (drift >= needed ? 1 : 0) : normalSurvival((needed - drift) / spread);

  return {
    leverage,
    logGrowth,
    volatility: leveredVol,
    medianMultiple: Math.exp(drift),
    probabilityOfTarget,
    probabilityOfHalving: probabilityOfFallingWithin(logGrowth, leveredVol, 0.5, horizon),
    probabilityOfNinetyPercentLoss: probabilityOfFallingWithin(logGrowth, leveredVol, 0.9, horizon),
    eventualHalving: probabilityOfFalling(logGrowth, leveredVol, 0.5),
    eventualNinetyPercentLoss: probabilityOfFalling(logGrowth, leveredVol, 0.9),
    liquidationMove: leverage > 1 ? 1 / leverage : Infinity,
  };
}

/**
 * Probability of ever falling `loss` below the starting capital.
 *
 * For log-equity as a Brownian motion with drift `μ` and volatility `σ`, the
 * chance of ever reaching a level `a` below the start is `exp(-2μa/σ²)` when the
 * drift is positive, and certainty when it is not. No horizon appears in it: given
 * long enough, this is the probability that it happens at all.
 */
export function probabilityOfFalling(logGrowth: number, volatility: number, loss: number): number {
  if (loss <= 0) return 1;
  if (loss >= 1) return 0;
  if (volatility <= 0) return logGrowth > 0 ? 0 : 1;
  if (logGrowth <= 0) return 1;
  const distance = -Math.log(1 - loss);
  return Math.min(1, Math.exp((-2 * logGrowth * distance) / (volatility * volatility)));
}

/**
 * Probability of falling `loss` below the start at some point *within* `horizon`.
 *
 * The first-passage probability for a Brownian motion with drift, from the
 * reflection principle:
 *
 *     P(min ≤ −a) = Φ((−a − μT)/(σ√T)) + exp(−2μa/σ²)·Φ((μT − a)/(σ√T))
 *
 * This assumes the account is watched continuously. A bot that only acts once a
 * bar will see a smaller number, because a dip that crosses and recovers inside one
 * bar goes unnoticed — but the money was still gone at the moment it crossed, and
 * with leverage a liquidation does not wait for your next bar. So the continuous
 * figure is the one to plan against.
 */
export function probabilityOfFallingWithin(
  logGrowth: number,
  volatility: number,
  loss: number,
  horizon: number,
): number {
  if (loss <= 0) return 1;
  if (loss >= 1) return 0;
  if (horizon <= 0) return 0;
  if (volatility <= 0) return logGrowth * horizon <= Math.log(1 - loss) ? 1 : 0;

  const a = -Math.log(1 - loss);
  const spread = volatility * Math.sqrt(horizon);
  const drift = logGrowth * horizon;
  const reflected = Math.exp((-2 * logGrowth * a) / (volatility * volatility));

  return Math.min(
    1,
    normalCdf((-a - drift) / spread) + reflected * normalCdf((drift - a) / spread),
  );
}

/** Years to reach a multiple at a steady annual return. */
export function yearsToMultiple(multiple: number, annualReturn: number): number {
  if (multiple <= 1) return 0;
  if (annualReturn <= 0) return Infinity;
  return Math.log(multiple) / Math.log(1 + annualReturn);
}

/**
 * Where steady contributions get you, which is the lever most people actually
 * have.
 *
 * Included because it is the honest comparison. Someone weighing a 100x return
 * target is usually not comparing it against anything, and the alternative —
 * ordinary returns plus money added every month — is both achievable and, over the
 * horizons that matter, larger.
 */
export function withContributions(options: {
  startingCapital: number;
  monthlyContribution: number;
  annualReturn: number;
  years: number;
}): number {
  const { startingCapital, monthlyContribution, annualReturn, years } = options;
  const monthlyRate = (1 + annualReturn) ** (1 / 12) - 1;
  const months = Math.round(years * 12);
  let balance = startingCapital;
  for (let i = 0; i < months; i += 1) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
  }
  return balance;
}

export interface LiquidationExposure {
  leverage: number;
  /** The adverse move that takes the account to zero. */
  liquidationMove: number;
  barsExamined: number;
  /** Bars whose adverse excursion from the open reached that move. */
  barsThatWouldHaveLiquidated: number;
  /** The worst single adverse excursion in the series, as a fraction. */
  worstAdverseMove: number;
  /** Chance per bar, from the historical frequency. */
  perBarProbability: number;
  /**
   * Chance of at least one such bar in a year, from that frequency.
   *
   * The figure that matters, and the one leverage calculations leave out. The
   * growth mathematics treats a drawdown as recoverable. A liquidation is not: it
   * is an absorbing barrier, and crossing it once ends the experiment however good
   * the strategy was.
   */
  annualProbability: number;
}

/**
 * How often this instrument has moved far enough to liquidate a levered account.
 *
 * Measured from each bar's open to its low (for a long), so it counts the move as
 * the position would have experienced it rather than close to close. Close-to-close
 * understates it badly: the exchange liquidates on the low, not on the close.
 *
 * This is the bridge between an abstract leverage figure and a specific market. A
 * table saying "10x leverage is wiped out by a 10% move" means nothing until you
 * know that the thing you are trading does 10% in a day several times a year.
 */
export function liquidationExposure(options: {
  candles: readonly Candle[];
  interval: Interval;
  leverage: number;
  /** Long by default; a short is liquidated by the high instead. */
  side?: 'long' | 'short';
}): LiquidationExposure {
  const { candles, interval, leverage } = options;
  const side = options.side ?? 'long';
  if (leverage <= 1) {
    return {
      leverage,
      liquidationMove: Infinity,
      barsExamined: candles.length,
      barsThatWouldHaveLiquidated: 0,
      worstAdverseMove: 0,
      perBarProbability: 0,
      annualProbability: 0,
    };
  }

  const threshold = 1 / leverage;
  let hits = 0;
  let worst = 0;

  for (const candle of candles) {
    if (candle.open <= 0) continue;
    const adverse =
      side === 'long'
        ? (candle.open - candle.low) / candle.open
        : (candle.high - candle.open) / candle.open;
    if (adverse > worst) worst = adverse;
    if (adverse >= threshold) hits += 1;
  }

  const perBar = candles.length === 0 ? 0 : hits / candles.length;
  // One minus the chance of surviving every bar in a year. Independence across bars
  // is a simplification, and it errs optimistic: these moves cluster.
  const annual = perBar <= 0 ? 0 : 1 - (1 - perBar) ** BARS_PER_YEAR[interval];

  return {
    leverage,
    liquidationMove: threshold,
    barsExamined: candles.length,
    barsThatWouldHaveLiquidated: hits,
    worstAdverseMove: worst,
    perBarProbability: perBar,
    annualProbability: annual,
  };
}

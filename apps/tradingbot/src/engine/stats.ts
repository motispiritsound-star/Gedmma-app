/**
 * The statistics needed to answer one question: how much of a backtest result
 * is selection, and how much is real?
 *
 * Every tutorial bot reports a Sharpe ratio. Almost none reports the Sharpe
 * ratio it would have reported anyway, given how many configurations were tried
 * before that one was kept. The difference between those two numbers is the
 * whole game, and the functions here compute it.
 */

/** Euler–Mascheroni constant, which appears in the expected maximum of N draws. */
const EULER_MASCHERONI = 0.5772156649015329;

/**
 * Standard normal CDF, via Abramowitz & Stegun 7.1.26 (error under 1.5e-7).
 * That is comfortably enough for a p-value a human is going to read as
 * "significant" or "not".
 */
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * The upper tail, `1 − Φ(z)`, computed so that it stays meaningful far out.
 *
 * `1 - normalCdf(z)` is useless past about z = 5: the CDF approximation has an
 * absolute error around 1.5e-7, so everything smaller than that subtracts to zero
 * and a probability of 1e-19 prints as "impossible". That distinction matters when
 * the answer is the point — "zero" reads as rounding, where "2e-19" reads as the
 * actual number.
 *
 * So from z = 2 upward this switches to the Mills ratio as a continued fraction,
 * `φ(z)/(z + 1/(z + 2/(z + 3/(z + …))))`, which is accurate precisely where the
 * polynomial is not. Checked against reference values, sixteen levels of the
 * fraction are exact to five significant figures from z = 2 outward — so the
 * switch-over is seamless as well as more accurate, and the whole range where
 * significance tests live is covered by the better method rather than the worse one.
 */
const MILLS_FROM = 2;
const MILLS_LEVELS = 16;

export function normalSurvival(z: number): number {
  if (Number.isNaN(z)) return Number.NaN;
  if (z < MILLS_FROM) return 1 - normalCdf(z);

  const density = Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
  // Evaluated from the bottom up, which is the numerically stable direction.
  let fraction = 0;
  for (let k = MILLS_LEVELS; k >= 1; k -= 1) {
    fraction = k / (z + fraction);
  }
  return density / (z + fraction);
}

export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z);
  return sign * y;
}

/**
 * Inverse standard normal CDF, via Acklam's rational approximation (relative
 * error under 1.15e-9). Needed for the expected-maximum term below, which asks
 * for quantiles far out in the tail where a crude approximation would matter.
 */
const ACKLAM_A = [
  -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
  -3.066479806614716e1, 2.506628277459239,
] as const;
const ACKLAM_B = [
  -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
  -1.328068155288572e1,
] as const;
const ACKLAM_C = [
  -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
  4.374664141464968, 2.938163982698783,
] as const;
const ACKLAM_D = [
  7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416,
] as const;

function horner(coefficients: readonly number[], x: number): number {
  let value = 0;
  for (const c of coefficients) value = value * x + c;
  return value;
}

export function normalInv(p: number): number {
  if (Number.isNaN(p)) return Number.NaN;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  const pLow = 0.02425;

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return horner(ACKLAM_C, q) / (horner(ACKLAM_D, q) * q + 1);
  }
  if (p > 1 - pLow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -horner(ACKLAM_C, q) / (horner(ACKLAM_D, q) * q + 1);
  }

  const q = p - 0.5;
  const r = q * q;
  return (horner(ACKLAM_A, r) * q) / (horner(ACKLAM_B, r) * r + 1);
}

/** Sample skewness of a series. */
export function skewness(values: readonly number[]): number {
  const n = values.length;
  if (n < 3) return 0;
  const m = values.reduce((s, v) => s + v, 0) / n;
  let m2 = 0;
  let m3 = 0;
  for (const v of values) {
    const d = v - m;
    m2 += d * d;
    m3 += d * d * d;
  }
  m2 /= n;
  m3 /= n;
  if (m2 === 0) return 0;
  return m3 / m2 ** 1.5;
}

/** Sample kurtosis, *not* excess: a normal distribution scores 3, not 0. */
export function kurtosis(values: readonly number[]): number {
  const n = values.length;
  if (n < 4) return 3;
  const m = values.reduce((s, v) => s + v, 0) / n;
  let m2 = 0;
  let m4 = 0;
  for (const v of values) {
    const d = v - m;
    m2 += d * d;
    m4 += d * d * d * d;
  }
  m2 /= n;
  m4 /= n;
  if (m2 === 0) return 3;
  return m4 / (m2 * m2);
}

/**
 * The Sharpe ratio you should expect from the *best* of N independent attempts
 * on data with no edge in it, given how much those attempts vary.
 *
 * This is the term most backtests are missing. Try twenty parameter sets and
 * keep the best, and you have not measured a strategy — you have measured the
 * maximum of twenty draws, which is a positive number even when every draw came
 * from noise. Bailey and López de Prado's expression for that maximum:
 *
 *   SR0 = sd(SR_trials) · [ (1−γ)·Φ⁻¹(1 − 1/N) + γ·Φ⁻¹(1 − 1/(N·e)) ]
 *
 * All Sharpe ratios here are per-observation, not annualised.
 */
export function expectedMaxSharpe(trialCount: number, trialSharpeSd: number): number {
  if (trialCount <= 1 || trialSharpeSd <= 0) return 0;
  const n = trialCount;
  const first = normalInv(1 - 1 / n);
  const second = normalInv(1 - 1 / (n * Math.E));
  return trialSharpeSd * ((1 - EULER_MASCHERONI) * first + EULER_MASCHERONI * second);
}

export interface DeflatedSharpeInput {
  /** The winning strategy's bar-by-bar returns. */
  returns: readonly number[];
  /** Annualised Sharpe ratios of every configuration that was tried, winner included. */
  trialSharpesAnnual: readonly number[];
  /** Bars per year, to convert annualised ratios back to per-bar. */
  barsPerYear: number;
}

export interface DeflatedSharpeResult {
  /** Per-observation Sharpe of the winner. */
  observedSharpe: number;
  /** The hurdle the selection process alone would clear. */
  selectionHurdle: number;
  /** How many configurations were searched. */
  trials: number;
  /**
   * The probability that the true Sharpe is above zero, after accounting for
   * the search, the length of the series, and the fat tails of returns. Below
   * 0.95 the result is not evidence of anything.
   */
  probability: number;
  /** Plain-language reading of `probability`. */
  verdict: 'significant' | 'inconclusive' | 'indistinguishable from selection';
}

/**
 * The deflated Sharpe ratio.
 *
 * A plain Sharpe ratio asks "did this make money per unit of risk?". This asks
 * the question that matters after a parameter search: "would a strategy with no
 * edge have looked this good, given that I tried N of them on T observations of
 * skewed, fat-tailed returns?" Short series, negative skew and excess kurtosis
 * all make a Sharpe ratio less trustworthy, and all three are normal in crypto.
 */
export function deflatedSharpe(input: DeflatedSharpeInput): DeflatedSharpeResult {
  const { returns, trialSharpesAnnual, barsPerYear } = input;
  const t = returns.length;
  const trials = trialSharpesAnnual.length;

  if (t < 4 || trials === 0) {
    return {
      observedSharpe: 0,
      selectionHurdle: 0,
      trials,
      probability: 0,
      verdict: 'inconclusive',
    };
  }

  const scale = Math.sqrt(barsPerYear);
  const perBar = trialSharpesAnnual.map((s) => s / scale);
  const observed = Math.max(...perBar);

  const mean = perBar.reduce((s, v) => s + v, 0) / trials;
  const variance =
    trials < 2 ? 0 : perBar.reduce((s, v) => s + (v - mean) ** 2, 0) / (trials - 1);
  const hurdle = expectedMaxSharpe(trials, Math.sqrt(variance));

  const g3 = skewness(returns);
  const g4 = kurtosis(returns);

  // The variance of an estimated Sharpe ratio, adjusted for skew and kurtosis.
  // Clamped at zero because extreme samples can drive the expression negative,
  // and a negative variance should produce a refusal to answer rather than NaN.
  const denom = 1 - g3 * observed + ((g4 - 1) / 4) * observed * observed;
  if (denom <= 0) {
    return {
      observedSharpe: observed,
      selectionHurdle: hurdle,
      trials,
      probability: 0,
      verdict: 'inconclusive',
    };
  }

  const z = ((observed - hurdle) * Math.sqrt(t - 1)) / Math.sqrt(denom);
  const probability = normalCdf(z);

  return {
    observedSharpe: observed,
    selectionHurdle: hurdle,
    trials,
    probability,
    verdict:
      probability >= 0.95
        ? 'significant'
        : probability >= 0.75
          ? 'inconclusive'
          : 'indistinguishable from selection',
  };
}

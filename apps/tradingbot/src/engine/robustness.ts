import { makeRng } from '../data/synthetic.js';
import { BARS_PER_YEAR, INTERVAL_MS, type Interval, type Trade } from '../types.js';
import { maxDrawdownOf } from './metrics.js';
import { kurtosis, normalInv, skewness } from './stats.js';

/**
 * How long a track record has to be before a Sharpe ratio means anything.
 *
 * This is the number that answers a question this harness has been answering with
 * a rule of thumb: "forward-test for thirty times the holding period". That advice
 * is not wrong but it is not derived from anything. The minimum track record
 * length is, and it falls straight out of the same expression that deflates a
 * Sharpe ratio — the variance of an estimated Sharpe, adjusted for skew and fat
 * tails:
 *
 *   MinTRL = 1 + [1 − γ₃·SR + (γ₄−1)/4·SR²] · (Z_α / SR)²
 *
 * The shape of it is the useful part. Required length goes with the *inverse
 * square* of the Sharpe ratio, so a strategy with half the edge needs four times
 * the evidence. A per-bar Sharpe that looks respectable annualised can still need
 * years of daily bars to distinguish from zero, and that is not pessimism, it is
 * arithmetic.
 *
 * One consequence is worth stating because it disappoints everyone who works it
 * out: for a given *annualised* Sharpe, the calendar time required is the same
 * whatever bar size you measure on. Hourly bars need twenty-four times as many
 * observations, each covering a twenty-fourth of the time. Trading a finer
 * interval does not get you to significance faster — an annualised Sharpe ratio is
 * a claim about a year, and sampling the same year more often does not produce more
 * independent evidence about it.
 */
export interface TrackRecordRequirement {
  /** Observations needed, at the bar size the returns were measured on. */
  bars: number;
  /** The same in days, which is what a human actually plans around. */
  days: number;
  /** The confidence the figure is for. */
  confidence: number;
  /** Per-observation Sharpe the requirement was computed from. */
  observedSharpe: number;
  /** True when the edge is negative or zero, in which case no length suffices. */
  hopeless: boolean;
}

export function minimumTrackRecordLength(options: {
  returns: readonly number[];
  /** Annualised Sharpe, as the reports print it. */
  sharpeAnnual: number;
  interval: Interval;
  /** 0.95 by default: the length at which you could reject "no edge" at 5%. */
  confidence?: number;
}): TrackRecordRequirement {
  const confidence = options.confidence ?? 0.95;
  const barsPerYear = BARS_PER_YEAR[options.interval];
  const sharpe = options.sharpeAnnual / Math.sqrt(barsPerYear);

  if (!(sharpe > 0) || options.returns.length < 4) {
    return {
      bars: Infinity,
      days: Infinity,
      confidence,
      observedSharpe: sharpe,
      hopeless: true,
    };
  }

  const g3 = skewness(options.returns);
  const g4 = kurtosis(options.returns);
  const variance = 1 - g3 * sharpe + ((g4 - 1) / 4) * sharpe * sharpe;
  if (!(variance > 0)) {
    return { bars: Infinity, days: Infinity, confidence, observedSharpe: sharpe, hopeless: true };
  }

  const z = normalInv(confidence);
  const bars = 1 + variance * (z / sharpe) ** 2;
  return {
    bars,
    days: (bars * INTERVAL_MS[options.interval]) / 86_400_000,
    confidence,
    observedSharpe: sharpe,
    hopeless: false,
  };
}

export interface DrawdownDistribution {
  runs: number;
  /** Drawdowns from resampled orderings, ascending. */
  drawdowns: number[];
  median: number;
  /** The drawdown a quarter of orderings exceed. Plan for this one. */
  p75: number;
  p95: number;
  worst: number;
  /** Final returns from the same resampling, for the spread of outcomes. */
  medianReturn: number;
  worstReturn: number;
  /** Share of orderings that ended below where they started. */
  losingShare: number;
}

/**
 * Reshuffle the order of the trades that actually happened, many times.
 *
 * The backtest reports the one drawdown that history happened to deal, which is a
 * sample of size one from the thing that actually decides whether a strategy is
 * runnable. The same trades in a different order produce a different worst moment,
 * and three losses in a row instead of spread out is the difference between a bad
 * month and switching the bot off at the bottom.
 *
 * This holds the trades fixed and varies only their sequence, so it says nothing
 * about whether the edge is real — `noise` and `significance` are for that. What it
 * says is: *given* these trades, how bad does the ride plausibly get? Plan for the
 * 75th percentile rather than the one the backtest drew, and decide in advance
 * whether you would sit through it.
 */
export function bootstrapDrawdowns(options: {
  trades: readonly Trade[];
  startingEquity: number;
  runs?: number;
  seed?: number;
}): DrawdownDistribution {
  const { trades, startingEquity } = options;
  const runs = options.runs ?? 1000;
  const rng = makeRng(options.seed ?? 7);

  // Each trade is applied as a return on the equity at the time, so the ordering
  // genuinely matters: a loss early compounds differently from a loss late.
  const returns = trades
    .map((t) => (t.returnPct === 0 && t.pnl !== 0 ? 0 : t.returnPct))
    .filter((r) => Number.isFinite(r));

  if (returns.length < 2) {
    return {
      runs: 0,
      drawdowns: [],
      median: 0,
      p75: 0,
      p95: 0,
      worst: 0,
      medianReturn: 0,
      worstReturn: 0,
      losingShare: 0,
    };
  }

  const drawdowns: number[] = [];
  const finals: number[] = [];

  for (let run = 0; run < runs; run += 1) {
    // Sampling with replacement rather than permuting: a permutation always ends
    // at the same equity, which hides the spread of outcomes the ordering implies.
    const path: number[] = [startingEquity];
    let equity = startingEquity;
    for (let i = 0; i < returns.length; i += 1) {
      const pick = returns[Math.floor(rng() * returns.length)] as number;
      equity *= 1 + pick;
      if (equity <= 0) {
        equity = 0;
        path.push(0);
        break;
      }
      path.push(equity);
    }
    drawdowns.push(maxDrawdownOf(path));
    finals.push(equity / startingEquity - 1);
  }

  drawdowns.sort((a, b) => a - b);
  const sortedFinals = [...finals].sort((a, b) => a - b);
  const at = (series: readonly number[], q: number): number =>
    series[Math.min(series.length - 1, Math.floor((series.length - 1) * q))] as number;

  return {
    runs,
    drawdowns,
    median: at(drawdowns, 0.5),
    p75: at(drawdowns, 0.75),
    p95: at(drawdowns, 0.95),
    worst: drawdowns[drawdowns.length - 1] as number,
    medianReturn: at(sortedFinals, 0.5),
    worstReturn: sortedFinals[0] as number,
    losingShare: finals.filter((r) => r < 0).length / finals.length,
  };
}

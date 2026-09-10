import { mean, returns, stdevAll } from '../indicators/index.js';
import { BARS_PER_YEAR, type EquityPoint, type Interval, type Trade } from '../types.js';

export interface Metrics {
  startEquity: number;
  endEquity: number;
  totalReturn: number;
  /** Compound annual growth rate, from the elapsed wall-clock time. */
  cagr: number;
  annualVol: number;
  sharpe: number;
  sortino: number;
  maxDrawdown: number;
  /** CAGR divided by max drawdown: return per unit of worst pain. */
  calmar: number;
  trades: number;
  winRate: number;
  profitFactor: number;
  feesPaid: number;
  /** Notional traded per unit of starting equity, annualised. */
  annualTurnover: number;
  /** Fraction of bars with a non-zero position. */
  timeInMarket: number;
  /**
   * The t-statistic of the mean bar return. Below about 2 the result is
   * indistinguishable from luck, whatever the equity curve looks like.
   */
  tStat: number;
  benchmarkReturn: number;
  benchmarkMaxDrawdown: number;
  /** Total return minus the benchmark's. Negative means buy-and-hold won. */
  excessReturn: number;
}

export function computeMetrics(
  curve: readonly EquityPoint[],
  trades: readonly Trade[],
  interval: Interval,
  feesPaid: number,
  turnover: number,
): Metrics {
  const first = curve[0];
  const last = curve[curve.length - 1];
  if (!first || !last || curve.length < 2) {
    return emptyMetrics(first?.equity ?? 0);
  }

  const equities = curve.map((p) => p.equity);
  const rets = returns(equities);
  const barsPerYear = BARS_PER_YEAR[interval];

  // Elapsed time is counted in bars, not wall clock. The two agree on a
  // complete series and diverge in two cases that matter: a series with gaps,
  // and the walk-forward curve, which stitches only the test windows together
  // and would otherwise be credited with the years it spent in-sample. Counting
  // bars also keeps CAGR consistent with the volatility below, which annualises
  // by bar count — mixing the two makes Calmar and Sharpe incomparable. Run
  // `data` to see how many bars a series is missing.
  const years = Math.max((curve.length - 1) / barsPerYear, 1 / barsPerYear);

  const totalReturn = last.equity / first.equity - 1;
  const cagr = last.equity > 0 ? (last.equity / first.equity) ** (1 / years) - 1 : -1;

  const barVol = stdevAll(rets);
  const annualVol = barVol * Math.sqrt(barsPerYear);
  const barMean = mean(rets);
  const sharpe = barVol === 0 ? 0 : (barMean / barVol) * Math.sqrt(barsPerYear);

  // Downside deviation divides by *every* observation, not only the losing
  // ones. Dividing by the count of losses instead is a common slip, and it
  // makes a strategy that rarely loses look worse than one that loses often.
  const downVol = Math.sqrt(mean(rets.map((r) => (r < 0 ? r * r : 0))));
  // A curve with no losing bar at all has no downside to divide by, and its
  // Sortino really is unbounded. Reporting 0 there would rank the only strategy
  // that never lost money last, so the infinity is passed through and the
  // report prints it as one.
  const sortino =
    downVol === 0
      ? barMean === 0
        ? 0
        : Math.sign(barMean) * Infinity
      : (barMean / downVol) * Math.sqrt(barsPerYear);

  const maxDrawdown = maxDrawdownOf(equities);
  const benchmarks = curve.map((p) => p.benchmark);
  const benchmarkReturn = (last.benchmark ?? 0) / (first.benchmark || 1) - 1;

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));

  return {
    startEquity: first.equity,
    endEquity: last.equity,
    totalReturn,
    cagr,
    annualVol,
    sharpe,
    sortino,
    maxDrawdown,
    calmar: maxDrawdown === 0 ? 0 : cagr / maxDrawdown,
    trades: trades.length,
    winRate: trades.length === 0 ? 0 : wins.length / trades.length,
    profitFactor: grossLoss === 0 ? (grossWin > 0 ? Infinity : 0) : grossWin / grossLoss,
    feesPaid,
    annualTurnover: (turnover / first.equity) / years,
    timeInMarket: curve.filter((p) => p.weight !== 0).length / curve.length,
    tStat: barVol === 0 ? 0 : (barMean / barVol) * Math.sqrt(rets.length),
    benchmarkReturn,
    benchmarkMaxDrawdown: maxDrawdownOf(benchmarks),
    excessReturn: totalReturn - benchmarkReturn,
  };
}

/** The deepest peak-to-trough fall, as a positive fraction. */
export function maxDrawdownOf(series: readonly number[]): number {
  let peak = series[0] ?? 0;
  let worst = 0;
  for (const v of series) {
    if (v > peak) peak = v;
    if (peak > 0) {
      const dd = 1 - v / peak;
      if (dd > worst) worst = dd;
    }
  }
  return worst;
}

function emptyMetrics(startEquity: number): Metrics {
  return {
    startEquity,
    endEquity: startEquity,
    totalReturn: 0,
    cagr: 0,
    annualVol: 0,
    sharpe: 0,
    sortino: 0,
    maxDrawdown: 0,
    calmar: 0,
    trades: 0,
    winRate: 0,
    profitFactor: 0,
    feesPaid: 0,
    annualTurnover: 0,
    timeInMarket: 0,
    tStat: 0,
    benchmarkReturn: 0,
    benchmarkMaxDrawdown: 0,
    excessReturn: 0,
  };
}

/**
 * The sentences a report should print alongside the numbers.
 *
 * This exists because a table of ratios invites the reader to pick the biggest
 * one. These warnings are the things that, in practice, explain a good-looking
 * backtest: too few trades, costs that dwarf the edge, or a result that simply
 * tracked the market it was measured against.
 */
export function caveats(m: Metrics): string[] {
  const out: string[] = [];
  if (m.trades < 30) {
    out.push(
      `Only ${m.trades} round trips. Fewer than ~30 and the statistics mean very ` +
        `little: one lucky trade can carry the entire result.`,
    );
  }
  if (Math.abs(m.tStat) < 2) {
    out.push(
      `t-statistic ${m.tStat.toFixed(2)} is below 2, so this result is not ` +
        `statistically distinguishable from noise.`,
    );
  }
  if (m.excessReturn <= 0) {
    out.push(
      `Buy-and-hold returned ${pct(m.benchmarkReturn)} over the same period, ` +
        `against this strategy's ${pct(m.totalReturn)}. It did not beat holding the asset.`,
    );
  }
  if (m.feesPaid > Math.abs(m.endEquity - m.startEquity) && m.feesPaid > 0) {
    out.push(
      `Fees and slippage came to ${m.feesPaid.toFixed(2)}, more than the entire ` +
        `profit or loss. The strategy is mostly paying the exchange.`,
    );
  }
  if (m.annualTurnover > 50) {
    out.push(
      `Turnover is ${m.annualTurnover.toFixed(0)}x equity a year. Real fills at ` +
        `that rate will be worse than modelled.`,
    );
  }
  if (m.maxDrawdown > 0.3) {
    out.push(
      `Worst drawdown was ${pct(m.maxDrawdown)}. Decide now whether you would ` +
        `keep the bot running through that, because most people switch it off at the bottom.`,
    );
  }
  return out;
}

export function pct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

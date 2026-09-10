import { returns } from '../indicators/index.js';
import type { RiskLimits } from '../risk/risk.js';
import type { StrategyFactory } from '../strategy/types.js';
import { BARS_PER_YEAR, type Candle, type CostModel, type Interval } from '../types.js';
import { runBacktest } from './backtest.js';
import { deflatedSharpe, type DeflatedSharpeResult } from './stats.js';

export interface SignificanceOptions {
  candles: readonly Candle[];
  factory: StrategyFactory<never>;
  interval: Interval;
  startingCash: number;
  costs?: CostModel;
  limits?: RiskLimits;
}

export interface SignificanceResult {
  /** Every configuration tried, best first. */
  trials: { name: string; sharpe: number; totalReturn: number; trades: number }[];
  winner: string;
  /** Annualised Sharpe of the winner, the number a tutorial would report. */
  winnerSharpeAnnual: number;
  deflated: DeflatedSharpeResult;
}

/**
 * Run every configuration in a strategy's grid, then ask whether the best one
 * means anything.
 *
 * This is the step between "my backtest has a Sharpe of 1.3" and knowing
 * whether that number survives the fact that it was chosen. Trying four
 * parameter sets and keeping the winner inflates the Sharpe ratio even when
 * none of them has an edge, and the inflation grows with how many were tried
 * and how much they differed. The deflated Sharpe ratio prices that in.
 *
 * Report the deflated figure, not the raw one. If a strategy cannot clear the
 * hurdle its own parameter search creates, there is nothing there.
 */
export function assessSignificance(options: SignificanceOptions): SignificanceResult {
  const { candles, factory, interval, startingCash } = options;

  const runs = factory.grid.map((params) => {
    const strategy = factory.create(params);
    const result = runBacktest({
      candles,
      strategy,
      interval,
      startingCash,
      costs: options.costs,
      limits: options.limits,
    });
    return {
      name: strategy.name,
      sharpe: result.metrics.sharpe,
      totalReturn: result.metrics.totalReturn,
      trades: result.metrics.trades,
      curve: result.curve,
    };
  });

  const sorted = [...runs].sort((a, b) => b.sharpe - a.sharpe);
  const winner = sorted[0];
  if (!winner) throw new Error('The strategy grid is empty, so there is nothing to assess');

  const deflated = deflatedSharpe({
    returns: returns(winner.curve.map((p) => p.equity)),
    trialSharpesAnnual: runs.map((r) => r.sharpe),
    barsPerYear: BARS_PER_YEAR[interval],
  });

  return {
    trials: sorted.map(({ name, sharpe, totalReturn, trades }) => ({
      name,
      sharpe,
      totalReturn,
      trades,
    })),
    winner: winner.name,
    winnerSharpeAnnual: winner.sharpe,
    deflated,
  };
}

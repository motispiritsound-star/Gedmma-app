import { sma } from '../indicators/index.js';
import type { Strategy, StrategyFactory } from './types.js';

export interface TrendFilterParams {
  /** Bars in the trend average. 200 on daily bars is the classic. */
  maPeriod: number;
  /** Bars over which the asset's own return must be positive to hold it. */
  momentumBars: number;
  /**
   * How far below the average price must fall before the position is closed.
   *
   * The single most important number in the rule. Without a band, price oscillating
   * around the average sells and rebuys every few bars, and the commission alone
   * turns a working filter into a losing one. With one, the same rule trades a
   * fraction as often for nearly the same exposure.
   */
  exitBuffer: number;
}

/**
 * Hold while the chart is above its long average and rising; stand aside otherwise.
 *
 * Of everything in the technical-analysis canon, this is the rule with the most
 * support behind it, and it is deliberately the dullest: no crossovers, no
 * oscillators, no patterns. A long moving average and the asset's own trailing
 * return, with a band to stop it churning.
 *
 * Two things are worth being clear about before reading any result from it.
 *
 * It is not a timing system in the sense people usually mean. It does not find
 * tops and bottoms; it sits out some of the worst stretches and gives up some of
 * the best. What it mostly does is reduce drawdown, and it pays for that by
 * lagging — expect a lower return than simply holding, with a smaller worst
 * moment. `timing` will tell you how much of whatever it earns comes from the
 * choice of moments rather than from being invested at all.
 *
 * And it is long-only and unlevered by construction, which makes it the one shape
 * in this repository that cannot produce the failure modes of the last few
 * sections of docs/TRADING.md. Its worst case is a bad few years, not zero.
 */
export function trendFilter(params: TrendFilterParams): Strategy {
  const { maPeriod, momentumBars, exitBuffer } = params;
  if (maPeriod < 2) throw new Error(`maPeriod must be at least 2, got ${maPeriod}`);
  if (momentumBars < 1) throw new Error(`momentumBars must be at least 1, got ${momentumBars}`);
  if (exitBuffer < 0 || exitBuffer >= 1) {
    throw new Error(`exitBuffer must be a fraction in [0, 1), got ${exitBuffer}`);
  }

  return {
    name: `trend-filter(${maPeriod},${momentumBars},${exitBuffer})`,
    describe:
      `Hold while price is above its ${maPeriod}-bar average and its ${momentumBars}-bar ` +
      `return is positive; exit ${(exitBuffer * 100).toFixed(1)}% below the average`,
    warmupBars: Math.max(maPeriod, momentumBars) + 1,

    onBar: (ctx) => {
      const closes = ctx.closes;
      const last = closes[closes.length - 1];
      const average = sma(closes, maPeriod);
      if (last === undefined || average === null || average <= 0) return 0;

      const then = closes[closes.length - 1 - momentumBars];
      if (then === undefined || then <= 0) return 0;
      const momentum = last / then - 1;

      // Already long: stay until price drops through the lower edge of the band.
      if (ctx.currentWeight > 0) return last < average * (1 - exitBuffer) ? 0 : 1;

      return last > average && momentum > 0 ? 1 : 0;
    },
  };
}

export const trendFilterFactory: StrategyFactory<TrendFilterParams> = {
  name: 'trend-filter',
  grid: [
    { maPeriod: 200, momentumBars: 126, exitBuffer: 0.02 },
    { maPeriod: 200, momentumBars: 63, exitBuffer: 0.03 },
    { maPeriod: 150, momentumBars: 63, exitBuffer: 0.02 },
    { maPeriod: 100, momentumBars: 21, exitBuffer: 0.02 },
  ],
  create: trendFilter,
};

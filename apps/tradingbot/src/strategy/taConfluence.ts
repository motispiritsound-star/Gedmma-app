import { rsi, sma } from '../indicators/index.js';
import type { Strategy, StrategyFactory } from './types.js';

export interface TaConfluenceParams {
  /** The regime filter: only buy while price is above this average. */
  trendMa: number;
  /** The asset's own trailing return must be positive over this many bars. */
  momentumBars: number;
  /** Bars in the RSI used to time the entry. */
  rsiPeriod: number;
  /**
   * Buy only when RSI is below this — the "pullback inside an uptrend" setup.
   * Above it, the chart is extended and the entry waits.
   */
  maxEntryRsi: number;
  /** Exit when price closes below this average. Shorter than `trendMa`. */
  exitMa: number;
}

/**
 * Trend, momentum and a pullback entry, which is what "technical analysis of a
 * chart" usually means in practice.
 *
 * Four conditions, stacked the way a discretionary chart reader stacks them: only
 * act in an uptrend, only when the trend is confirmed by the asset's own return,
 * enter on a pullback rather than into strength, and leave on a shorter average.
 *
 * It is here because it is what was asked for, and because it is the clearest
 * demonstration of the cost of asking. Count the parameters: five, against the
 * three of `trend-filter`. Every one of them is a dial that can be turned until
 * the backtest looks good, and the grid the walk-forward has to search grows
 * multiplicatively. `significance` deflates a Sharpe ratio by the size of the
 * search that produced it, so the same measured edge is worth materially less
 * here than from a simpler rule — which is the honest price of confluence, and
 * the reason more signals so often means less evidence.
 *
 * Run `significance` and `timing` on both and compare. If the five-parameter
 * version does not clearly beat the three-parameter one *after* deflation, the
 * extra conditions are decoration.
 */
export function taConfluence(params: TaConfluenceParams): Strategy {
  const { trendMa, momentumBars, rsiPeriod, maxEntryRsi, exitMa } = params;
  if (exitMa >= trendMa) {
    throw new Error(`exitMa must be shorter than trendMa, got ${exitMa} and ${trendMa}`);
  }
  if (maxEntryRsi <= 0 || maxEntryRsi >= 100) {
    throw new Error(`maxEntryRsi must be between 0 and 100, got ${maxEntryRsi}`);
  }

  return {
    name: `ta-confluence(${trendMa},${momentumBars},rsi${rsiPeriod}<${maxEntryRsi},exit${exitMa})`,
    describe:
      `Buy a pullback (RSI${rsiPeriod} below ${maxEntryRsi}) inside an uptrend ` +
      `(above SMA${trendMa}, ${momentumBars}-bar return positive); exit below SMA${exitMa}`,
    warmupBars: Math.max(trendMa, momentumBars, rsiPeriod) + 1,

    onBar: (ctx) => {
      const closes = ctx.closes;
      const last = closes[closes.length - 1];
      if (last === undefined) return 0;

      const exitAverage = sma(closes, exitMa);
      if (exitAverage === null) return 0;

      // The exit is checked first and on its own terms: a position is closed on the
      // shorter average regardless of what the entry conditions now say. Requiring
      // the entry conditions to also fail would leave the position open through a
      // decline that the rule was meant to avoid.
      if (ctx.currentWeight > 0) return last < exitAverage ? 0 : 1;

      const trendAverage = sma(closes, trendMa);
      const strength = rsi(closes, rsiPeriod);
      const then = closes[closes.length - 1 - momentumBars];
      if (trendAverage === null || strength === null || then === undefined || then <= 0) return 0;

      const inUptrend = last > trendAverage;
      const rising = last / then - 1 > 0;
      const notExtended = strength < maxEntryRsi;

      return inUptrend && rising && notExtended ? 1 : 0;
    },
  };
}

export const taConfluenceFactory: StrategyFactory<TaConfluenceParams> = {
  name: 'ta-confluence',
  grid: [
    { trendMa: 200, momentumBars: 126, rsiPeriod: 14, maxEntryRsi: 60, exitMa: 50 },
    { trendMa: 200, momentumBars: 63, rsiPeriod: 14, maxEntryRsi: 50, exitMa: 50 },
    { trendMa: 150, momentumBars: 63, rsiPeriod: 14, maxEntryRsi: 60, exitMa: 30 },
    { trendMa: 100, momentumBars: 21, rsiPeriod: 7, maxEntryRsi: 55, exitMa: 20 },
  ],
  create: taConfluence,
};

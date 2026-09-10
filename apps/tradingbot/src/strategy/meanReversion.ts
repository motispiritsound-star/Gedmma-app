import { zscore } from '../indicators/index.js';
import type { Strategy, StrategyFactory } from './types.js';

export interface MeanReversionParams {
  lookback: number;
  /** How far from the mean to enter, in standard deviations. */
  entryZ: number;
  /** How close to the mean to exit. Below `entryZ`, or the position never closes. */
  exitZ: number;
  /** Whether a move up is traded as well as a move down. Spot accounts cannot. */
  allowShort: boolean;
}

/**
 * Buy what has fallen too far from its own mean, sell it back at the mean.
 *
 * The hysteresis between `entryZ` and `exitZ` is the part that matters. Without
 * it the position flips on every bar that crosses the threshold and the fees
 * eat the strategy; with it the bot trades a fraction as often. If you change
 * one number in this file, change that gap and watch the turnover line in the
 * report.
 */
export function meanReversion(params: MeanReversionParams): Strategy {
  const { lookback, entryZ, exitZ, allowShort } = params;
  if (exitZ >= entryZ) {
    throw new Error(`meanReversion needs exitZ < entryZ, got ${exitZ} and ${entryZ}`);
  }
  return {
    name: `mean-reversion(${lookback},${entryZ},${exitZ}${allowShort ? ',short' : ''})`,
    describe:
      `Buy below -${entryZ}σ of the ${lookback}-bar mean and exit at ${exitZ}σ` +
      (allowShort ? `, and the mirror image on the short side` : ''),
    warmupBars: lookback + 1,
    onBar: (ctx) => {
      const z = zscore(ctx.closes, lookback);
      if (z === null) return 0;
      const held = ctx.currentWeight;

      // Already long: stay long until price has come back toward the mean.
      if (held > 0) return z < -exitZ ? 1 : 0;
      if (held < 0) return z > exitZ ? -1 : 0;

      if (z <= -entryZ) return 1;
      if (allowShort && z >= entryZ) return -1;
      return 0;
    },
  };
}

export const meanReversionFactory: StrategyFactory<MeanReversionParams> = {
  name: 'mean-reversion',
  grid: [
    { lookback: 20, entryZ: 1.5, exitZ: 0.25, allowShort: false },
    { lookback: 20, entryZ: 2, exitZ: 0.5, allowShort: false },
    { lookback: 50, entryZ: 2, exitZ: 0.5, allowShort: false },
    { lookback: 100, entryZ: 2.5, exitZ: 0.5, allowShort: false },
  ],
  create: meanReversion,
};

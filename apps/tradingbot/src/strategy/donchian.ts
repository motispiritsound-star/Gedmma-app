import type { Strategy, StrategyFactory } from './types.js';

export interface DonchianParams {
  entryBars: number;
  exitBars: number;
}

/**
 * Buy a break above the highest close of the last `entryBars`, leave on a break
 * below the lowest close of the last `exitBars`.
 *
 * This is the oldest published trend rule there is, and it is here as a
 * contrast to the mean-reversion strategy: the two want opposite things from a
 * market. Whichever of them looks good on a given stretch of history is mostly
 * telling you what that stretch of history did, not what the rule knows.
 */
export function donchian(params: DonchianParams): Strategy {
  const { entryBars, exitBars } = params;
  return {
    name: `donchian(${entryBars},${exitBars})`,
    describe: `Long on a ${entryBars}-bar closing high, out on a ${exitBars}-bar closing low`,
    warmupBars: Math.max(entryBars, exitBars) + 1,
    onBar: (ctx) => {
      const closes = ctx.closes;
      const last = closes[closes.length - 1];
      if (last === undefined) return 0;
      if (closes.length <= Math.max(entryBars, exitBars)) return 0;

      // The windows exclude the current bar, so "highest of the last N" cannot
      // include the very close being tested against it.
      const entryWindow = closes.slice(-entryBars - 1, -1);
      const exitWindow = closes.slice(-exitBars - 1, -1);
      const highest = Math.max(...entryWindow);
      const lowest = Math.min(...exitWindow);

      if (ctx.currentWeight > 0) return last < lowest ? 0 : 1;
      return last > highest ? 1 : 0;
    },
  };
}

export const donchianFactory: StrategyFactory<DonchianParams> = {
  name: 'donchian',
  grid: [
    { entryBars: 20, exitBars: 10 },
    { entryBars: 55, exitBars: 20 },
    { entryBars: 100, exitBars: 50 },
  ],
  create: donchian,
};

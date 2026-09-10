import { ema } from '../indicators/index.js';
import type { Strategy, StrategyFactory } from './types.js';

export interface EmaCrossParams {
  fast: number;
  slow: number;
}

/**
 * Long while the fast EMA is above the slow one, flat otherwise.
 *
 * This is the strategy every tutorial starts with, which is precisely why it is
 * worth measuring honestly: it trades often, so fees bite, and it is long in
 * exactly the periods a buy-and-hold is long. Run it before believing anything
 * more complicated.
 */
export function emaCross(params: EmaCrossParams): Strategy {
  const { fast, slow } = params;
  if (fast >= slow) throw new Error(`emaCross needs fast < slow, got ${fast} and ${slow}`);
  return {
    name: `ema-cross(${fast},${slow})`,
    describe: `Long while EMA${fast} is above EMA${slow}, otherwise flat`,
    warmupBars: slow + 1,
    onBar: (ctx) => {
      const f = ema(ctx.closes, fast);
      const s = ema(ctx.closes, slow);
      if (f === null || s === null) return 0;
      return f > s ? 1 : 0;
    },
  };
}

export const emaCrossFactory: StrategyFactory<EmaCrossParams> = {
  name: 'ema-cross',
  grid: [
    { fast: 8, slow: 21 },
    { fast: 12, slow: 26 },
    { fast: 20, slow: 50 },
    { fast: 50, slow: 200 },
  ],
  create: emaCross,
};

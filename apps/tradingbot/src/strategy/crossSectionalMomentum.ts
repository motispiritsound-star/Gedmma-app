import type { Candle } from '../types.js';
import type { PortfolioContext, PortfolioStrategy, PortfolioStrategyFactory } from './types.js';

export interface CrossSectionalMomentumParams {
  /** Bars of trailing return used to rank the universe. */
  lookback: number;
  /** How many of the top-ranked symbols to hold, equally weighted. */
  hold: number;
  /** Bars between rebalances. Ranking every bar is mostly paying fees. */
  rebalanceBars: number;
  /**
   * Require a symbol's own trailing return to be positive before holding it.
   *
   * Without this the strategy always holds the best of a falling universe, which
   * in a crypto bear market means being fully long the least-bad coin for a year.
   * This is the "absolute momentum" or trend overlay, and it is usually the
   * difference between a survivable drawdown and an account-ending one.
   */
  requirePositive: boolean;
}

/**
 * Hold the strongest few symbols in the universe, refreshed periodically.
 *
 * Cross-sectional momentum is the one systematic effect in crypto with a real
 * published literature behind it, rather than a screenshot: relative strength
 * among coins has persisted over horizons of roughly one to twelve weeks across
 * several independent studies. That does not make it free money. It makes it the
 * honest starting point for a multi-asset bot, which is why it is here instead of
 * a fifth indicator crossover.
 *
 * Two properties of the implementation matter more than the ranking rule. It
 * rebalances on a clock rather than on every bar, because a ranking that
 * reshuffles hourly pays fees for noise. And it ranks on returns ending at the
 * bar that just closed, so the symbol it buys is chosen from information that
 * existed before the fill.
 */
export function crossSectionalMomentum(params: CrossSectionalMomentumParams): PortfolioStrategy {
  const { lookback, hold, rebalanceBars, requirePositive } = params;
  if (hold < 1) throw new Error(`crossSectionalMomentum must hold at least 1 symbol, got ${hold}`);
  if (lookback < 2) throw new Error(`lookback must be at least 2 bars, got ${lookback}`);
  if (rebalanceBars < 1) throw new Error(`rebalanceBars must be at least 1, got ${rebalanceBars}`);

  return {
    name: `xs-momentum(${lookback},top${hold},every${rebalanceBars}${requirePositive ? ',trend' : ''})`,
    describe:
      `Hold the top ${hold} of the universe by ${lookback}-bar return, ` +
      `rebalanced every ${rebalanceBars} bars` +
      (requirePositive ? `, and only while a symbol's own return is positive` : ''),
    warmupBars: lookback + 1,

    onBar: (ctx: PortfolioContext) => {
      const symbols = [...ctx.history.keys()];

      // Between rebalances the existing book is restated unchanged. The engine
      // trades only differences, so restating it costs nothing.
      if (ctx.barIndex % rebalanceBars !== 0) {
        return new Map(symbols.map((s) => [s, ctx.currentWeights.get(s) ?? 0]));
      }

      const scored: { symbol: string; momentum: number }[] = [];
      for (const symbol of symbols) {
        const candles = ctx.history.get(symbol) as readonly Candle[];
        if (candles.length < lookback + 1) continue;
        const last = candles[candles.length - 1]?.close;
        const then = candles[candles.length - 1 - lookback]?.close;
        if (last === undefined || then === undefined || then <= 0) continue;
        scored.push({ symbol, momentum: last / then - 1 });
      }

      const eligible = requirePositive ? scored.filter((s) => s.momentum > 0) : scored;
      eligible.sort((a, b) => b.momentum - a.momentum);
      const chosen = eligible.slice(0, hold);

      const targets = new Map<string, number>(symbols.map((s) => [s, 0]));
      if (chosen.length === 0) return targets;

      // Equal weight across the chosen names, sized so a full book is fully
      // invested and a partial one holds cash rather than concentrating.
      const weight = 1 / hold;
      for (const { symbol } of chosen) targets.set(symbol, weight);
      return targets;
    },
  };
}

export const crossSectionalMomentumFactory: PortfolioStrategyFactory<CrossSectionalMomentumParams> = {
  name: 'xs-momentum',
  grid: [
    { lookback: 30, hold: 3, rebalanceBars: 7, requirePositive: true },
    { lookback: 60, hold: 3, rebalanceBars: 7, requirePositive: true },
    { lookback: 90, hold: 5, rebalanceBars: 14, requirePositive: true },
    { lookback: 60, hold: 3, rebalanceBars: 7, requirePositive: false },
  ],
  create: crossSectionalMomentum,
};

/**
 * Hold every symbol in equal weight, forever. The portfolio benchmark, and the
 * thing a multi-asset strategy has to beat to have been worth writing.
 */
export function equalWeightHold(): PortfolioStrategy {
  return {
    name: 'equal-weight-hold',
    describe: 'Buy an equal share of every symbol on the first bar and never trade again',
    warmupBars: 0,
    onBar: (ctx) => {
      const symbols = [...ctx.history.keys()];
      const weight = symbols.length === 0 ? 0 : 1 / symbols.length;
      return new Map(symbols.map((s) => [s, weight]));
    },
  };
}

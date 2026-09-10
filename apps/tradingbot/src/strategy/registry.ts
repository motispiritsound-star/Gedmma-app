import { buyAndHold } from './buyAndHold.js';
import { donchianFactory } from './donchian.js';
import { emaCrossFactory } from './emaCross.js';
import { meanReversionFactory } from './meanReversion.js';
import type { Strategy, StrategyFactory } from './types.js';

/**
 * Every strategy the CLI can name, with its parameter grid.
 *
 * The grids are short on purpose. A grid of a thousand combinations will always
 * contain one that looks brilliant on any history you feed it, and that one
 * combination is the one you would pick — which is how a backtest becomes a
 * story about the past instead of a prediction. docs/TRADING.md has the
 * arithmetic.
 */
// The factories are deliberately heterogeneous in their parameter type, and the
// registry only ever needs to treat them as opaque, so `unknown` is the honest
// element type here.
export const FACTORIES: readonly StrategyFactory<never>[] = [
  emaCrossFactory as unknown as StrategyFactory<never>,
  meanReversionFactory as unknown as StrategyFactory<never>,
  donchianFactory as unknown as StrategyFactory<never>,
];

export function factoryByName(name: string): StrategyFactory<never> | undefined {
  return FACTORIES.find((f) => f.name === name);
}

/** The names the CLI accepts, benchmark included. */
export function strategyNames(): string[] {
  return [...FACTORIES.map((f) => f.name), 'buy-and-hold'];
}

/**
 * Build a strategy from a name and, optionally, an index into its grid. With no
 * index the first grid entry is used, which keeps `backtest --strategy ema-cross`
 * working without anyone having to read the grid first.
 */
export function buildStrategy(name: string, gridIndex = 0): Strategy {
  if (name === 'buy-and-hold') return buyAndHold();
  const factory = factoryByName(name);
  if (!factory) {
    throw new Error(`Unknown strategy "${name}". Known: ${strategyNames().join(', ')}`);
  }
  const params = factory.grid[gridIndex];
  if (params === undefined) {
    throw new Error(
      `Strategy "${name}" has ${factory.grid.length} parameter sets, asked for index ${gridIndex}`,
    );
  }
  return factory.create(params);
}

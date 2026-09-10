import type { Strategy } from './types.js';

/**
 * Hold the asset. This is the benchmark, and it is in here as a first-class
 * strategy rather than a footnote for one reason: most trading bots lose to it.
 * A result that does not beat buy-and-hold after costs is not an edge, however
 * good its Sharpe ratio looks on its own.
 */
export function buyAndHold(): Strategy {
  return {
    name: 'buy-and-hold',
    describe: 'Buy on the first bar and never trade again',
    warmupBars: 0,
    onBar: () => 1,
  };
}

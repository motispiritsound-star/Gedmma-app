import { mean, returns, stdevAll } from '../indicators/index.js';
import type { Candle } from '../types.js';

export interface CorrelationReport {
  symbols: string[];
  /** Row-major correlation matrix, indexed the same as `symbols`. */
  matrix: number[][];
  /** The mean of every distinct pair. */
  averagePairwise: number;
  highestPair: { a: string; b: string; rho: number } | null;
  lowestPair: { a: string; b: string; rho: number } | null;
  /**
   * How many independent bets the basket is really worth.
   *
   * For n equally weighted assets with average pairwise correlation ρ, the
   * variance of the basket is the same as that of `n / (1 + (n−1)ρ)`
   * uncorrelated assets. At ρ = 0.85 — routine for major coins against each
   * other — fifty markets are worth about 1.2 bets. "Scans 50 markets
   * simultaneously" is therefore a statement about CPU, not about risk.
   */
  effectiveBets: number;
  /** Bars used, after aligning the series. */
  observations: number;
}

/** Pearson correlation of two equal-length series. */
export function correlation(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const xs = a.slice(0, n);
  const ys = b.slice(0, n);
  const sdX = stdevAll(xs);
  const sdY = stdevAll(ys);
  if (sdX === 0 || sdY === 0) return 0;
  const mX = mean(xs);
  const mY = mean(ys);
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    sum += ((xs[i] as number) - mX) * ((ys[i] as number) - mY);
  }
  return sum / ((n - 1) * sdX * sdY);
}

/**
 * How much diversification a basket of assets actually provides.
 *
 * This is the number that answers the "scans 50 markets" claim, and it is worth
 * running before building any multi-asset strategy: if the effective count comes
 * back near 1, every position is the same position wearing a different ticker,
 * and the risk limits should treat it that way.
 */
export function analyseCorrelation(series: ReadonlyMap<string, readonly Candle[]>): CorrelationReport {
  const symbols = [...series.keys()];
  const observations = Math.min(
    ...symbols.map((s) => (series.get(s)?.length ?? 0)),
    Number.POSITIVE_INFINITY,
  );

  const retSeries = symbols.map((symbol) => {
    const candles = series.get(symbol) ?? [];
    return returns(candles.map((c) => c.close));
  });

  const matrix = symbols.map((_, i) =>
    symbols.map((__, j) =>
      i === j ? 1 : correlation(retSeries[i] as number[], retSeries[j] as number[]),
    ),
  );

  const pairs: { a: string; b: string; rho: number }[] = [];
  for (let i = 0; i < symbols.length; i += 1) {
    for (let j = i + 1; j < symbols.length; j += 1) {
      pairs.push({
        a: symbols[i] as string,
        b: symbols[j] as string,
        rho: (matrix[i] as number[])[j] as number,
      });
    }
  }

  const averagePairwise = pairs.length === 0 ? 0 : mean(pairs.map((p) => p.rho));
  const n = symbols.length;
  // Negative average correlation would make the denominator collapse or go
  // negative; clamping at a floor keeps the figure meaningful rather than
  // reporting more independent bets than there are assets.
  const denominator = Math.max(1e-6, 1 + (n - 1) * averagePairwise);
  const effectiveBets = n === 0 ? 0 : Math.min(n, n / denominator);

  const sorted = [...pairs].sort((x, y) => y.rho - x.rho);

  return {
    symbols,
    matrix,
    averagePairwise,
    highestPair: sorted[0] ?? null,
    lowestPair: sorted[sorted.length - 1] ?? null,
    effectiveBets,
    observations: Number.isFinite(observations) ? observations : 0,
  };
}

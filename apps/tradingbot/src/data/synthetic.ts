import { INTERVAL_MS, type Candle, type Interval } from '../types.js';

/**
 * Price series with known properties, generated from a seed.
 *
 * Two uses, both of them about honesty rather than convenience.
 *
 * The tests need a series whose behaviour is known in advance: a strategy that
 * buys dips must make money on a mean-reverting series and lose it on a random
 * walk, and if it does not, the engine is broken.
 *
 * The second use is the sharper one. Run a strategy over a few hundred random
 * walks — series with no edge in them by construction — and look at the spread
 * of results. Some of those runs will show a beautiful equity curve. That spread
 * is the amount of "performance" a backtest produces from nothing, and any real
 * result has to be bigger than it to mean anything.
 */
export interface SyntheticOptions {
  bars: number;
  interval: Interval;
  startPrice: number;
  /** Annualised drift. 0 is a pure random walk. */
  drift: number;
  /** Annualised volatility. Bitcoin has historically run 0.5 to 0.9. */
  vol: number;
  /** How strongly price is pulled back to its recent mean, per bar. 0 is none. */
  meanReversion: number;
  seed: number;
  /** Chance per bar of a jump, and its size in standard deviations. */
  jumpProb?: number;
  jumpSigma?: number;
}

/** Mulberry32: small, fast, and identical on every machine. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller, for normal draws from a uniform generator. */
export function makeNormal(rng: () => number): () => number {
  return () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

export function generateSeries(options: SyntheticOptions): Candle[] {
  const { bars, interval, startPrice, drift, vol, meanReversion, seed } = options;
  const jumpProb = options.jumpProb ?? 0;
  const jumpSigma = options.jumpSigma ?? 4;

  const rng = makeRng(seed);
  const normal = makeNormal(rng);
  const barMs = INTERVAL_MS[interval];
  const barsPerYear = (365 * 86_400_000) / barMs;
  const dt = 1 / barsPerYear;
  const sigma = vol * Math.sqrt(dt);
  const mu = (drift - 0.5 * vol * vol) * dt;

  const out: Candle[] = [];
  let logPrice = Math.log(startPrice);
  let logMean = logPrice;
  const startTime = Date.UTC(2020, 0, 1);

  for (let i = 0; i < bars; i += 1) {
    const shock = normal() * sigma;
    const jump = jumpProb > 0 && rng() < jumpProb ? normal() * sigma * jumpSigma : 0;
    const pull = meanReversion * (logMean - logPrice);
    const open = Math.exp(logPrice);

    logPrice += mu + shock + jump + pull;
    const close = Math.exp(logPrice);

    // The bar's extremes are drawn around the open and close rather than derived
    // from them, so high and low carry the intrabar range a real bar would.
    const wick = Math.abs(normal()) * sigma * 0.5;
    const high = Math.max(open, close) * (1 + wick);
    const low = Math.min(open, close) * (1 - wick);

    out.push({
      openTime: startTime + i * barMs,
      open,
      high,
      low,
      close,
      volume: 100 + rng() * 100,
    });

    // The "mean" the series reverts to drifts slowly, so a mean-reverting series
    // still trends over a long window instead of being pinned to one price.
    logMean += (logPrice - logMean) * 0.01;
  }

  return out;
}

/** A series with no predictable structure at all. The null hypothesis. */
export function randomWalk(bars: number, interval: Interval, seed: number): Candle[] {
  return generateSeries({
    bars,
    interval,
    startPrice: 30_000,
    drift: 0,
    vol: 0.6,
    meanReversion: 0,
    seed,
    jumpProb: 0.002,
  });
}

/** A series that trends, where a trend-follower ought to make money. */
export function trendingSeries(bars: number, interval: Interval, seed: number): Candle[] {
  return generateSeries({
    bars,
    interval,
    startPrice: 30_000,
    drift: 0.8,
    vol: 0.35,
    meanReversion: 0,
    seed,
  });
}

/** A series that snaps back, where a dip-buyer ought to make money. */
export function meanRevertingSeries(bars: number, interval: Interval, seed: number): Candle[] {
  return generateSeries({
    bars,
    interval,
    startPrice: 30_000,
    drift: 0,
    vol: 0.5,
    meanReversion: 0.08,
    seed,
  });
}

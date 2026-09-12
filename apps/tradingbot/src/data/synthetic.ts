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

export interface UniverseOptions {
  symbols: readonly string[];
  bars: number;
  interval: Interval;
  /**
   * How much of each symbol's move comes from one shared market factor, from 0
   * to 1. This is the knob that matters: crypto majors move together at
   * correlations near 0.9, which is why a basket of them diversifies almost
   * nothing. The exact correlation it implies is derived in `generateUniverse`.
   */
  marketBeta: number;
  /** Annualised volatility of the shared factor. */
  marketVol: number;
  /** Annualised volatility of each symbol's own idiosyncratic move. */
  idiosyncraticVol: number;
  /** Annualised drift of the shared factor. */
  drift: number;
  seed: number;
  /**
   * Per-symbol persistence of relative strength, from 0 to 1. Above zero a
   * symbol that has outperformed tends to keep outperforming, which is the
   * effect a cross-sectional momentum strategy claims to harvest. Set it to 0
   * for a universe where that strategy should earn nothing.
   */
  momentumPersistence?: number;
}

/**
 * A universe of correlated symbols driven by one shared factor.
 *
 * Built for two tests that cannot be run on a single series. The first is
 * whether the portfolio engine is correct: with `momentumPersistence` above
 * zero a cross-sectional strategy must make money, and at zero it must not. The
 * second is the diversification question — generate twenty symbols at
 * `marketBeta` 0.9 and the correlation report will show they are worth barely
 * more than one independent bet, which is what a real basket of crypto majors
 * looks like.
 */
export function generateUniverse(options: UniverseOptions): Map<string, Candle[]> {
  const {
    symbols,
    bars,
    interval,
    marketBeta,
    marketVol,
    idiosyncraticVol,
    drift,
    seed,
  } = options;
  const persistence = options.momentumPersistence ?? 0;

  const rng = makeRng(seed);
  const normal = makeNormal(rng);
  const barMs = INTERVAL_MS[interval];
  const barsPerYear = (365 * 86_400_000) / barMs;
  const dt = 1 / barsPerYear;
  const marketSigma = marketVol * Math.sqrt(dt);
  const idioSigma = idiosyncraticVol * Math.sqrt(dt);
  const mu = (drift - 0.5 * marketVol * marketVol) * dt;
  const startTime = Date.UTC(2020, 0, 1);

  const out = new Map<string, Candle[]>(symbols.map((s) => [s, []]));
  const logPrice = new Map<string, number>();
  const trend = new Map<string, number>();
  for (const [i, symbol] of symbols.entries()) {
    // Staggered starting prices, so ranking is not trivially alphabetical.
    logPrice.set(symbol, Math.log(100 * (1 + i * 0.37)));
    trend.set(symbol, 0);
  }

  for (let t = 0; t < bars; t += 1) {
    const marketShock = normal() * marketSigma;

    for (const symbol of symbols) {
      const previous = logPrice.get(symbol) as number;
      const open = Math.exp(previous);

      // Relative strength is carried forward as an AR(1) process, so a symbol
      // that led last period is more likely to lead this one. The carried term
      // is weighted by `persistence` as well as smoothed by it, which is what
      // makes zero persistence mean *no* momentum rather than extra noise. With
      // it at zero the pairwise correlation of the universe is exactly
      //
      //   ρ = (β·σmarket)² / ( (β·σmarket)² + (1−β²)·σidio² )
      //
      // so the defaults in `cryptoLikeUniverse` (β 0.9, σmarket 0.7, σidio 0.5)
      // land near 0.89 — which is what a basket of crypto majors actually is.
      const innovation = normal() * idioSigma;
      const carried = persistence * (trend.get(symbol) as number) + (1 - persistence) * innovation;
      trend.set(symbol, carried);

      const step =
        mu +
        marketBeta * marketShock +
        Math.sqrt(1 - marketBeta * marketBeta) * innovation +
        persistence * carried;
      const next = previous + step;
      logPrice.set(symbol, next);
      const close = Math.exp(next);

      const wick = Math.abs(normal()) * idioSigma * 0.5;
      (out.get(symbol) as Candle[]).push({
        openTime: startTime + t * barMs,
        open,
        high: Math.max(open, close) * (1 + wick),
        low: Math.min(open, close) * (1 - wick),
        close,
        volume: 100 + rng() * 100,
      });
    }
  }

  return out;
}

/** A universe that behaves like crypto majors: highly correlated, trending. */
export function cryptoLikeUniverse(
  symbols: readonly string[],
  bars: number,
  interval: Interval,
  seed: number,
  momentumPersistence = 0,
): Map<string, Candle[]> {
  return generateUniverse({
    symbols,
    bars,
    interval,
    marketBeta: 0.9,
    marketVol: 0.7,
    idiosyncraticVol: 0.5,
    // Drift is quoted in arithmetic terms and converted to a log drift inside
    // `generateUniverse`, where half the variance is subtracted. At 0.7 vol that
    // subtraction is 24.5 points a year, so anything under ~0.25 here produces a
    // universe whose median path falls — which is a fine thing to test against,
    // but a poor default for checking whether a strategy can find an edge.
    drift: 0.5,
    seed,
    momentumPersistence,
  });
}

export interface EquityLikeOptions {
  bars: number;
  interval: Interval;
  startPrice: number;
  /** Annualised drift and volatility while the market is rising. */
  bullDrift: number;
  bullVol: number;
  /** Annualised drift and volatility while it is falling. Bears are faster. */
  bearDrift: number;
  bearVol: number;
  /** Chance per bar of leaving the regime it is in. Lower means longer regimes. */
  bullExitProb: number;
  bearExitProb: number;
  seed: number;
}

/**
 * A series that behaves like an index rather than a random walk.
 *
 * The distinction matters more than any indicator. A geometric random walk has no
 * exploitable structure by construction, so no timing rule can beat holding it —
 * which is exactly why `noise` uses one. Real equity markets are not that: they
 * spend long stretches rising quietly and shorter stretches falling fast, and the
 * regimes persist long enough to be identified while they are happening.
 *
 * That persistence is the only thing a trend filter can possibly be exploiting. It
 * is modelled here as a two-state switch because that is the honest minimum: if a
 * rule cannot make money on a series where the structure is present and known, it
 * is broken; if it makes money on a random walk, the test is broken.
 *
 * The defaults are roughly index-like — a bull at 12% with 14% volatility, a bear
 * at −25% with 30%, bulls lasting years and bears months — but do not read any
 * backtest on this as evidence about a real market. It is a test fixture, not a
 * simulation of anything.
 */
export function generateEquityLike(options: EquityLikeOptions): Candle[] {
  const {
    bars,
    interval,
    startPrice,
    bullDrift,
    bullVol,
    bearDrift,
    bearVol,
    bullExitProb,
    bearExitProb,
    seed,
  } = options;

  const rng = makeRng(seed);
  const normal = makeNormal(rng);
  const barMs = INTERVAL_MS[interval];
  const barsPerYear = (365 * 86_400_000) / barMs;
  const dt = 1 / barsPerYear;
  const startTime = Date.UTC(2010, 0, 1);

  const out: Candle[] = [];
  let logPrice = Math.log(startPrice);
  let bull = true;

  for (let i = 0; i < bars; i += 1) {
    // The regime is decided before the bar is drawn, so no bar is generated from a
    // state that had not been entered yet.
    if (bull ? rng() < bullExitProb : rng() < bearExitProb) bull = !bull;

    const drift = bull ? bullDrift : bearDrift;
    const vol = bull ? bullVol : bearVol;
    const sigma = vol * Math.sqrt(dt);
    const mu = (drift - 0.5 * vol * vol) * dt;

    const open = Math.exp(logPrice);
    logPrice += mu + normal() * sigma;
    const close = Math.exp(logPrice);

    const wick = Math.abs(normal()) * sigma * 0.6;
    out.push({
      openTime: startTime + i * barMs,
      open,
      high: Math.max(open, close) * (1 + wick),
      low: Math.min(open, close) * (1 - wick),
      close,
      volume: 1_000_000 * (0.5 + rng()),
    });
  }

  return out;
}

/** An index-like series with persistent bull and bear regimes. */
export function equityLikeSeries(bars: number, interval: Interval, seed: number): Candle[] {
  return generateEquityLike({
    bars,
    interval,
    startPrice: 100,
    bullDrift: 0.12,
    bullVol: 0.14,
    bearDrift: -0.25,
    bearVol: 0.3,
    // On daily bars: bulls of about two years, bears of about four months.
    bullExitProb: 1 / 500,
    bearExitProb: 1 / 90,
    seed,
  });
}

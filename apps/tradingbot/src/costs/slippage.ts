/**
 * What it costs to move size, as opposed to what it costs to trade at all.
 *
 * Everything in this harness until now priced slippage as a flat number of basis
 * points, which is a statement about the spread and says nothing about the order.
 * That is the single thing the serious execution-oriented backtesters
 * (NautilusTrader among them) are built around and the vectorised research tools
 * are criticised for: a fixed-cost model lies about microstructure, and it lies in
 * the direction of optimism, because it says a €50 order and a €50,000 order in the
 * same asset cost the same to execute.
 *
 * They do not. Beyond a small fraction of the volume trading alongside you, your
 * own order moves the price against you, and the move grows roughly with the
 * square root of your participation — the empirical regularity usually written
 *
 *   impact ≈ k · σ · √(Q / V)
 *
 * with σ the asset's volatility over the interval, Q the order's value and V the
 * value traded in that interval. The exponent being a half rather than one is why
 * this matters: impact per unit *falls* with size, so it is invisible while you
 * are small and then suddenly is not.
 *
 * The practical consequence for this repository is that a backtest is no longer
 * size-independent. The same strategy on the same bars is cheaper at €500 than at
 * €500,000, which is true, and it means a result has to be quoted with the size it
 * was measured at.
 */

export interface ImpactModel {
  /**
   * The `k` above. Around 1 is the usual empirical ballpark for equities; crypto
   * venues vary enormously by pair and time of day. Treat it as a knob to be
   * calibrated against your own fills, not a constant of nature.
   */
  coefficient: number;
  /**
   * Participation below which impact is treated as zero.
   *
   * Not a physical threshold — impact never really is zero — but below a fraction
   * of a percent of the interval's volume the square-root term is smaller than the
   * tick, and pretending to model it is false precision.
   */
  negligibleParticipation: number;
  /**
   * Ceiling in basis points.
   *
   * A bar with almost no volume would otherwise produce an arbitrarily bad fill,
   * and a thin bar in the data is at least as likely to be a data problem as a real
   * liquidity hole. The cap keeps one bad row from dominating a whole run — and
   * when the cap binds often, the report says so, because that is the signal that
   * the size being tested is not tradeable in this market.
   */
  maxBps: number;
}

export const DEFAULT_IMPACT: ImpactModel = {
  coefficient: 1,
  negligibleParticipation: 0.001,
  maxBps: 500,
};

/** What a fill sees of the bar it happens in. */
export interface MarketContext {
  /** Units traded in the bar, in the instrument's own units. */
  volume: number;
  high: number;
  low: number;
  close: number;
}

export interface SlippageBreakdown {
  /** Basis points from the spread, paid whatever the size. */
  spreadBps: number;
  /** Basis points from the order's own footprint. */
  impactBps: number;
  totalBps: number;
  /** The order's value as a fraction of the bar's. Zero when volume is unknown. */
  participation: number;
  /** True when `maxBps` bound the result, which is worth knowing about. */
  capped: boolean;
}

/**
 * A cheap per-bar volatility proxy: the bar's range over its close.
 *
 * Parkinson's estimator would be the textbook choice and is a constant factor
 * away; the constant would be absorbed by `coefficient` during calibration, so it
 * buys nothing here.
 */
export function barVolatility(market: MarketContext): number {
  if (market.close <= 0) return 0;
  const range = market.high - market.low;
  return range > 0 ? range / market.close : 0;
}

/**
 * Total slippage for one fill, in basis points, split into its two causes.
 *
 * With no market context — a CSV without volume, or a caller that has none — the
 * impact term is zero and this degrades to the flat spread model. That is a
 * silent optimism, so `participation` comes back as zero and the reports say when
 * a run had no volume to work with.
 */
export function slippageFor(options: {
  spreadBps: number;
  impact?: ImpactModel;
  /** The order's value, in quote currency. */
  orderNotional: number;
  market?: MarketContext;
}): SlippageBreakdown {
  const spreadBps = Math.max(0, options.spreadBps);
  const { impact, market, orderNotional } = options;

  if (!impact || !market || orderNotional <= 0) {
    return { spreadBps, impactBps: 0, totalBps: spreadBps, participation: 0, capped: false };
  }

  const barNotional = market.volume * market.close;
  if (!(barNotional > 0)) {
    // A bar that reports no volume tells us nothing about liquidity, and guessing
    // zero impact is the optimistic guess. The spread is charged and the caller is
    // told participation was unmeasurable.
    return { spreadBps, impactBps: 0, totalBps: spreadBps, participation: 0, capped: false };
  }

  const participation = orderNotional / barNotional;
  if (participation < impact.negligibleParticipation) {
    return { spreadBps, impactBps: 0, totalBps: spreadBps, participation, capped: false };
  }

  const sigma = barVolatility(market);
  const raw = impact.coefficient * sigma * Math.sqrt(participation) * 10_000;
  const impactBps = Math.min(raw, impact.maxBps);

  return {
    spreadBps,
    impactBps,
    totalBps: spreadBps + impactBps,
    participation,
    capped: raw > impact.maxBps,
  };
}

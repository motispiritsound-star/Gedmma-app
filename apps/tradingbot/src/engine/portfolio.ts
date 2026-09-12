import { commissionFor } from '../costs/commission.js';
import { slippageFor } from '../costs/slippage.js';
import { alignUniverse } from '../data/align.js';
import {
  DEFAULT_LIMITS,
  RiskManager,
  clamp,
  feeAdjustedCeiling,
  type RiskLimits,
} from '../risk/risk.js';
import type { PortfolioStrategy } from '../strategy/types.js';
import {
  DEFAULT_COSTS,
  INTERVAL_MS,
  type Candle,
  type CostModel,
  type EquityPoint,
  type Fill,
  type Interval,
} from '../types.js';
import { computeMetrics, type Metrics } from './metrics.js';

export interface PortfolioLimits extends RiskLimits {
  /** The largest fraction of equity any single symbol may hold. */
  maxWeightPerSymbol: number;
  /** The largest total long exposure across all symbols. 1 means no leverage. */
  maxGrossExposure: number;
}

export const DEFAULT_PORTFOLIO_LIMITS: PortfolioLimits = {
  ...DEFAULT_LIMITS,
  maxWeightPerSymbol: 0.34,
  maxGrossExposure: 1,
};

export interface PortfolioBacktestOptions {
  universe: ReadonlyMap<string, readonly Candle[]>;
  strategy: PortfolioStrategy;
  interval: Interval;
  startingCash: number;
  costs?: CostModel;
  limits?: PortfolioLimits;
}

export interface PortfolioResult {
  strategy: string;
  describe: string;
  interval: Interval;
  symbols: string[];
  curve: EquityPoint[];
  metrics: Metrics;
  fills: Fill[];
  /** Per-symbol share of the notional traded, so concentration is visible. */
  tradedBySymbol: Record<string, number>;
  /** Average number of symbols held at once. */
  averagePositions: number;
  droppedBars: number;
  lateListings: { symbol: string; firstTime: number }[];
  killSwitch: string | null;
  dailyLossEnforced: boolean;
}

/**
 * A backtest across several symbols sharing one pot of cash.
 *
 * The single-asset engine cannot express what a multi-asset strategy gets wrong,
 * which is mostly concentration: ten positions that all rise and fall together
 * are one position, and the cash they compete for is finite. So cash is a single
 * pool here, weights are capped per symbol *and* in aggregate, and the benchmark
 * is an equal-weight hold of the whole universe rather than whichever symbol
 * happened to do best.
 *
 * Fills land at the next bar's open, exactly as in the single-asset engine, and
 * for the same reason.
 */
export function runPortfolioBacktest(options: PortfolioBacktestOptions): PortfolioResult {
  const { strategy, interval, startingCash } = options;
  const costs = options.costs ?? DEFAULT_COSTS;
  const limits = options.limits ?? DEFAULT_PORTFOLIO_LIMITS;

  const aligned = alignUniverse(options.universe, interval);
  const symbols = [...aligned.series.keys()];
  const length = aligned.times.length;
  if (symbols.length === 0) throw new Error('A portfolio backtest needs at least one symbol');
  if (length < 2) {
    throw new Error(
      `The symbols overlap on only ${length} bars once aligned. ` +
        `Check the date range, or drop the symbol that listed most recently.`,
    );
  }

  const barMs = INTERVAL_MS[interval];
  const dailyLossEnforced = barMs < 86_400_000;

  // Both ceilings hold back one entry's commission; see `feeAdjustedCeiling`.
  const effectiveLimits: PortfolioLimits = {
    ...limits,
    maxWeight: feeAdjustedCeiling(limits.maxWeight, costs, startingCash),
    maxGrossExposure: feeAdjustedCeiling(limits.maxGrossExposure, costs, startingCash),
  };
  const risk = new RiskManager(startingCash, effectiveLimits, dailyLossEnforced);

  // Positions are held in base quantity per symbol against one shared cash
  // balance, which is what makes the gross exposure cap meaningful.
  const qty = new Map<string, number>(symbols.map((s) => [s, 0]));
  const tradedBySymbol: Record<string, number> = Object.fromEntries(symbols.map((s) => [s, 0]));
  let cash = startingCash;
  let fees = 0;
  let turnover = 0;
  const fills: Fill[] = [];
  const curve: EquityPoint[] = [];
  let positionCountSum = 0;

  const history = new Map<string, Candle[]>(symbols.map((s) => [s, []]));
  const benchmarkQty = new Map<string, number>();
  for (const symbol of symbols) {
    const first = aligned.series.get(symbol)?.[0]?.close ?? 0;
    // The benchmark buys an equal share of every symbol on bar zero and holds.
    benchmarkQty.set(symbol, first > 0 ? startingCash / symbols.length / first : 0);
  }

  const closeAt = (symbol: string, index: number): number =>
    aligned.series.get(symbol)?.[index]?.close ?? 0;
  const openAt = (symbol: string, index: number): number =>
    aligned.series.get(symbol)?.[index]?.open ?? 0;

  for (let i = 0; i < length; i += 1) {
    const time = aligned.times[i] as number;

    let marked = cash;
    let benchmark = 0;
    let held = 0;
    for (const symbol of symbols) {
      const close = closeAt(symbol, i);
      const q = qty.get(symbol) as number;
      marked += q * close;
      benchmark += (benchmarkQty.get(symbol) as number) * close;
      if (q !== 0) held += 1;
    }
    positionCountSum += held;

    const grossNotional = symbols.reduce(
      (sum, symbol) => sum + Math.abs(qty.get(symbol) as number) * closeAt(symbol, i),
      0,
    );

    curve.push({
      time,
      equity: marked,
      benchmark,
      weight: marked > 0 ? grossNotional / marked : 0,
      // There is no single price for a basket, so the benchmark's value stands
      // in for one. It is only used for reporting, never for a fill.
      price: benchmark,
    });

    risk.mark(time, marked);

    for (const symbol of symbols) {
      (history.get(symbol) as Candle[]).push(aligned.series.get(symbol)?.[i] as Candle);
    }

    if (i + 1 >= length) break;

    const currentWeights = new Map<string, number>(
      symbols.map((symbol) => [
        symbol,
        marked > 0 ? ((qty.get(symbol) as number) * closeAt(symbol, i)) / marked : 0,
      ]),
    );

    let targets =
      i + 1 < strategy.warmupBars
        ? new Map<string, number>(symbols.map((s) => [s, 0]))
        : strategy.onBar({ history, currentWeights, barIndex: i });

    targets = applyPortfolioLimits(targets, symbols, effectiveLimits);

    // The risk layer still owns the account-level decisions. It is consulted on
    // the gross exposure, and a flatten or a halt overrides every target.
    const grossTarget = [...targets.values()].reduce((s, w) => s + Math.abs(w), 0);
    const verdict = risk.evaluate(
      grossTarget,
      currentWeights.size === 0 ? 0 : [...currentWeights.values()].reduce((s, w) => s + Math.abs(w), 0),
      marked,
      1,
    );

    if (verdict.action !== 'allow') {
      if (verdict.action === 'flatten') {
        targets = new Map(symbols.map((s) => [s, 0]));
      } else {
        continue;
      }
    }

    // Gross exposure is measured as a sum of absolute weights, so the long-only
    // rule has to be applied per symbol here as well as in aggregate above.
    if ((limits.longOnly ?? true) === true) {
      for (const [symbol, weight] of targets) {
        if (weight < 0) targets.set(symbol, 0);
      }
    }

    const nextTime = aligned.times[i + 1] as number;
    for (const symbol of symbols) {
      const target = targets.get(symbol) ?? 0;
      const reference = openAt(symbol, i + 1);
      if (reference <= 0) continue;

      const currentQty = qty.get(symbol) as number;
      const desiredRough = (target * marked) / reference;
      const roughDelta = desiredRough - currentQty;
      const side = Math.sign(roughDelta);
      if (side === 0) continue;

      // The fill lands in the next bar, so that bar's volume and range price it.
      const slippage = slippageFor({
        spreadBps: costs.slippageBps,
        impact: costs.impact,
        orderNotional: Math.abs(roughDelta) * reference,
        market: aligned.series.get(symbol)?.[i + 1],
      });
      const fillPrice = reference * (1 + (side * slippage.totalBps) / 10_000);
      const desiredQty = (target * marked) / fillPrice;
      const delta = desiredQty - currentQty;
      const notional = Math.abs(delta) * fillPrice;

      // Both gates that keep a portfolio from churning: a weight change too
      // small to matter, and an order an exchange would reject. Closing out is
      // exempt, as in the single-asset engine.
      const isClosing = target === 0 && currentQty !== 0;
      if (!isClosing) {
        const weightChange = Math.abs(target - (currentWeights.get(symbol) ?? 0));
        if (weightChange < limits.rebalanceThreshold) continue;
        if (notional < limits.minOrderQuote) continue;
      }

      const fee = commissionFor(costs.commission, delta, fillPrice);
      cash -= delta * fillPrice + fee;
      qty.set(symbol, currentQty + delta);
      fees += fee;
      turnover += notional;
      tradedBySymbol[symbol] = (tradedBySymbol[symbol] ?? 0) + notional;
      fills.push({
        time: nextTime,
        qty: delta,
        price: fillPrice,
        fee,
        reason: risk.isTripped ? 'kill-switch' : verdict.action === 'flatten' ? 'liquidate' : 'rebalance',
      });
    }
  }

  // Close everything at the last close so the final equity is cash.
  const lastIndex = length - 1;
  for (const symbol of symbols) {
    const q = qty.get(symbol) as number;
    if (q === 0) continue;
    const price = closeAt(symbol, lastIndex) * (1 - (costs.slippageBps / 10_000) * Math.sign(q));
    const notional = Math.abs(q) * price;
    const fee = commissionFor(costs.commission, q, price);
    cash += q * price - fee;
    fees += fee;
    turnover += notional;
    qty.set(symbol, 0);
  }
  const lastPoint = curve[curve.length - 1];
  if (lastPoint) {
    lastPoint.equity = cash;
    lastPoint.weight = 0;
  }

  const metrics = computeMetrics(curve, [], interval, fees, turnover);

  return {
    strategy: strategy.name,
    describe: strategy.describe,
    interval,
    symbols,
    curve,
    metrics: { ...metrics, trades: fills.length },
    fills,
    tradedBySymbol,
    averagePositions: length === 0 ? 0 : positionCountSum / length,
    droppedBars: aligned.droppedBars,
    lateListings: aligned.lateListings,
    killSwitch: risk.trippedReason,
    dailyLossEnforced,
  };
}

/**
 * Cap each symbol, then cap the total, scaling everything down proportionally if
 * the strategy asked for more gross exposure than the account allows.
 *
 * Scaling rather than truncating matters: dropping the last few positions to fit
 * the budget would silently change which bets the strategy made, while scaling
 * keeps its relative conviction and just holds less of everything.
 */
export function applyPortfolioLimits(
  targets: ReadonlyMap<string, number>,
  symbols: readonly string[],
  limits: PortfolioLimits,
): Map<string, number> {
  const capped = new Map<string, number>();
  for (const symbol of symbols) {
    const raw = targets.get(symbol) ?? 0;
    capped.set(
      symbol,
      Number.isFinite(raw) ? clamp(raw, -limits.maxWeightPerSymbol, limits.maxWeightPerSymbol) : 0,
    );
  }

  const gross = [...capped.values()].reduce((s, w) => s + Math.abs(w), 0);
  const ceiling = Math.min(limits.maxGrossExposure, limits.maxWeight);
  if (gross > ceiling && gross > 0) {
    const scale = ceiling / gross;
    for (const [symbol, weight] of capped) capped.set(symbol, weight * scale);
  }

  return capped;
}

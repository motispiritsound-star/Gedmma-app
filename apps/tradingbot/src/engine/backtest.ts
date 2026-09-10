import { DEFAULT_LIMITS, RiskManager, feeAdjustedCeiling, type RiskLimits } from '../risk/risk.js';
import type { Strategy } from '../strategy/types.js';
import {
  DEFAULT_COSTS,
  INTERVAL_MS,
  type Candle,
  type CostModel,
  type EquityPoint,
  type Fill,
  type Interval,
  type Trade,
} from '../types.js';
import { PaperBroker } from './broker.js';
import { computeMetrics, type Metrics } from './metrics.js';

export interface BacktestOptions {
  candles: readonly Candle[];
  strategy: Strategy;
  interval: Interval;
  startingCash: number;
  costs?: CostModel;
  limits?: RiskLimits;
}

export interface BacktestResult {
  strategy: string;
  describe: string;
  interval: Interval;
  curve: EquityPoint[];
  trades: readonly Trade[];
  fills: readonly Fill[];
  metrics: Metrics;
  /** Set when the drawdown kill switch fired, with the reason it gives. */
  killSwitch: string | null;
  /** Bars the risk layer refused to act on, by reason. Worth reading. */
  blocked: Record<string, number>;
  /** False when the bars are too coarse for a daily loss limit to mean anything. */
  dailyLossEnforced: boolean;
}

/**
 * Run a strategy over history.
 *
 * The ordering in the loop is the whole point of this function, so it is spelled
 * out rather than compressed:
 *
 *   1. Bar `i` closes. Equity is marked at that close.
 *   2. The strategy sees bars `0..i` and returns a target weight.
 *   3. The risk layer adjusts or vetoes it.
 *   4. The order fills at bar `i + 1`'s *open*, plus slippage.
 *
 * Step 4 is what separates a backtest from a fantasy. Filling at the close of
 * the bar that generated the signal — the default in most tutorial code — hands
 * the strategy a price it could not have traded at, and that one line is worth
 * more imaginary profit than any indicator in this repository.
 */
export function runBacktest(options: BacktestOptions): BacktestResult {
  const { candles, strategy, interval, startingCash } = options;
  const costs = options.costs ?? DEFAULT_COSTS;
  const limits = options.limits ?? DEFAULT_LIMITS;

  if (candles.length < 2) {
    throw new Error(`A backtest needs at least 2 candles, got ${candles.length}`);
  }

  const barMs = INTERVAL_MS[interval];
  const dailyLossEnforced = barMs < 86_400_000;

  const broker = new PaperBroker(startingCash, costs);
  // The weight cap is reduced by one entry's commission, so a fully invested
  // target does not leave the account overdrawn by the fee.
  const risk = new RiskManager(
    startingCash,
    { ...limits, maxWeight: feeAdjustedCeiling(limits.maxWeight, costs) },
    dailyLossEnforced,
  );
  const curve: EquityPoint[] = [];
  const blocked: Record<string, number> = {};

  const firstClose = candles[0]?.close ?? 0;
  const benchmarkQty = firstClose > 0 ? startingCash / firstClose : 0;

  // History is grown one bar at a time and handed to the strategy as-is, rather
  // than sliced out of the full series on every bar. Slicing would be O(n^2) on
  // a minute series, and growing the arrays has a second advantage: the future
  // bars are not merely hidden from the strategy, they are not in the array yet.
  const history: Candle[] = [];
  const closes: number[] = [];

  for (let i = 0; i < candles.length; i += 1) {
    const bar = candles[i] as Candle;
    broker.accrueCarry(bar.close, barMs);
    broker.tickBar();

    const equity = broker.equity(bar.close);
    curve.push({
      time: bar.openTime,
      equity,
      benchmark: benchmarkQty * bar.close,
      weight: broker.weight(bar.close),
      price: bar.close,
    });

    risk.mark(bar.openTime, equity);

    history.push(bar);
    closes.push(bar.close);

    const next = candles[i + 1];
    if (!next) break;

    const currentWeight = broker.weight(bar.close);
    const rawTarget =
      i + 1 < strategy.warmupBars
        ? 0
        : strategy.onBar({ candles: history, closes, currentWeight });

    if (!Number.isFinite(rawTarget)) {
      throw new Error(`Strategy ${strategy.name} returned ${rawTarget} at bar ${i}`);
    }

    const verdict = risk.evaluate(rawTarget, currentWeight, equity, next.open);
    if (verdict.action === 'flatten') {
      broker.flatten(next.open, next.openTime, risk.isTripped ? 'kill-switch' : 'liquidate');
      blocked[verdict.reason] = (blocked[verdict.reason] ?? 0) + 1;
    } else if (verdict.action === 'hold') {
      blocked[verdict.reason] = (blocked[verdict.reason] ?? 0) + 1;
    } else {
      broker.rebalanceTo(verdict.weight, next.open, next.openTime);
    }
  }

  // Close the book at the last price so the final equity is money, not a mark.
  const finalBar = candles[candles.length - 1] as Candle;
  if (broker.qty !== 0) {
    broker.flatten(finalBar.close, finalBar.openTime);
    const lastPoint = curve[curve.length - 1];
    if (lastPoint) {
      lastPoint.equity = broker.equity(finalBar.close);
      lastPoint.weight = 0;
    }
  }

  const metrics = computeMetrics(curve, broker.trades, interval, broker.fees, broker.turnover);

  return {
    strategy: strategy.name,
    describe: strategy.describe,
    interval,
    curve,
    trades: broker.trades,
    fills: broker.fills,
    metrics,
    killSwitch: risk.trippedReason,
    blocked,
    dailyLossEnforced,
  };
}

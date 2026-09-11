import { DEFAULT_LIMITS, RiskManager, feeAdjustedCeiling, type RiskLimits } from '../risk/risk.js';
import { volatilityScalar, type SizingConfig } from '../risk/sizing.js';
import { StopTracker, hasStops, type StopConfig, type StopReason } from '../risk/stops.js';
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
import { roundTripDrag } from '../costs/commission.js';
import { PaperBroker } from './broker.js';
import { computeMetrics, type Metrics } from './metrics.js';

export interface BacktestOptions {
  candles: readonly Candle[];
  strategy: Strategy;
  interval: Interval;
  startingCash: number;
  costs?: CostModel;
  limits?: RiskLimits;
  /** Protective exits. Omitted, the position is only ever closed by the strategy. */
  stops?: StopConfig;
  /**
   * Scale the strategy's weight so realised volatility lands near a target.
   * Omitted, the strategy's own weight is used unchanged.
   */
  sizing?: SizingConfig;
}

export interface StopSummary {
  /** How many exits each kind of protective order caused. */
  byReason: Record<StopReason, number>;
  /**
   * Average fraction by which a stop filled worse than the price it rested at.
   * This is the number a backtest that fills stops at the stop price reports as
   * zero, and it is the reason stop-based strategies disappoint live.
   */
  averageSlippagePastTrigger: number;
  /** The single worst gap past a stop, as a fraction. */
  worstSlippagePastTrigger: number;
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
  /** Null when no protective exits were configured. */
  stops: StopSummary | null;
  /**
   * What a full-size round trip costs in commission alone, as a fraction of the
   * position, at this account's starting equity. A floor-based schedule makes this
   * a function of account size, and on a small account it is usually larger than
   * any edge the strategy could have.
   */
  commissionDrag: { perRoundTrip: number; atNotional: number };
  /**
   * What the fills cost in slippage and how much of each bar they were. Quote any
   * result together with the size it was measured at: with an impact model in
   * play, the same strategy on the same bars is cheaper small than large.
   */
  execution: {
    averageSlippageBps: number;
    worstParticipation: number;
    cappedFills: number;
    impactCost: number;
    /** False when the series carried no volume, so impact could not be modelled. */
    volumeAvailable: boolean;
  };
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
    { ...limits, maxWeight: feeAdjustedCeiling(limits.maxWeight, costs, startingCash) },
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

  const stopConfig = options.stops ?? {};
  const stopsOn = hasStops(stopConfig);
  const stopTracker = new StopTracker(stopConfig);
  const stopCounts: Record<StopReason, number> = {
    'stop-loss': 0,
    'trailing-stop': 0,
    'take-profit': 0,
  };
  const slippages: number[] = [];
  let cooldownUntil = -1;

  for (let i = 0; i < candles.length; i += 1) {
    const bar = candles[i] as Candle;

    // Protective exits are checked at the top of the bar, against this bar's own
    // range, because the position was established at this bar's open and a stop
    // is allowed to fire inside the bar that created it.
    if (stopsOn && broker.qty !== 0) {
      if (!stopTracker.isOpen) {
        stopTracker.open(broker.qty > 0 ? 'long' : 'short', bar.open);
      }
      const hit = stopTracker.check(bar);
      if (hit) {
        broker.flatten(hit.price, bar.openTime, hit.reason, bar);
        stopCounts[hit.reason] += 1;
        slippages.push(hit.slippedBy);
        stopTracker.close();
        cooldownUntil = i + (stopConfig.cooldownBars ?? 0);
      } else {
        stopTracker.observe(bar);
      }
    } else if (stopsOn && stopTracker.isOpen) {
      stopTracker.close();
    }

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
    const strategyTarget =
      i + 1 < strategy.warmupBars
        ? 0
        : strategy.onBar({ candles: history, closes, currentWeight });

    if (!Number.isFinite(strategyTarget)) {
      throw new Error(`Strategy ${strategy.name} returned ${strategyTarget} at bar ${i}`);
    }

    // A cooldown only blocks *opening*. Closing is always allowed, or a stop
    // could strand a position it was meant to protect.
    const afterCooldown = i < cooldownUntil ? Math.min(strategyTarget, currentWeight, 0) : strategyTarget;
    const rawTarget = options.sizing
      ? afterCooldown * volatilityScalar(closes, interval, options.sizing)
      : afterCooldown;

    const verdict = risk.evaluate(rawTarget, currentWeight, equity, next.open);
    if (verdict.action === 'flatten') {
      broker.flatten(next.open, next.openTime, risk.isTripped ? 'kill-switch' : 'liquidate', next);
      blocked[verdict.reason] = (blocked[verdict.reason] ?? 0) + 1;
    } else if (verdict.action === 'hold') {
      blocked[verdict.reason] = (blocked[verdict.reason] ?? 0) + 1;
    } else {
      const before = broker.qty;
      // The fill happens inside the *next* bar, so that is the bar whose volume
      // and range decide what the order costs.
      broker.rebalanceTo(verdict.weight, next.open, next.openTime, 'rebalance', next);
      // A fill that opens or reverses a position resets the protective levels to
      // the price it was actually opened at.
      if (stopsOn && broker.qty !== 0 && (before === 0 || Math.sign(before) !== Math.sign(broker.qty))) {
        stopTracker.open(broker.qty > 0 ? 'long' : 'short', next.open);
      } else if (stopsOn && broker.qty === 0) {
        stopTracker.close();
      }
    }
  }

  // Close the book at the last price so the final equity is money, not a mark.
  const finalBar = candles[candles.length - 1] as Candle;
  if (broker.qty !== 0) {
    broker.flatten(finalBar.close, finalBar.openTime, 'liquidate', finalBar);
    const lastPoint = curve[curve.length - 1];
    if (lastPoint) {
      lastPoint.equity = broker.equity(finalBar.close);
      lastPoint.weight = 0;
    }
  }

  const metrics = computeMetrics(curve, broker.trades, interval, broker.fees, broker.turnover);
  const fullSizeNotional = startingCash * limits.maxWeight;

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
    commissionDrag: {
      perRoundTrip: roundTripDrag(costs.commission, fullSizeNotional, firstClose),
      atNotional: fullSizeNotional,
    },
    execution: {
      ...broker.execution,
      volumeAvailable: candles.some((c) => c.volume > 0),
    },
    stops: stopsOn
      ? {
          byReason: stopCounts,
          averageSlippagePastTrigger:
            slippages.length === 0 ? 0 : slippages.reduce((a, b) => a + b, 0) / slippages.length,
          worstSlippagePastTrigger: slippages.length === 0 ? 0 : Math.max(...slippages),
        }
      : null,
  };
}

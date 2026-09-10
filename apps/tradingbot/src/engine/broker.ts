import type { CostModel, Fill, Trade } from '../types.js';

/**
 * A paper broker that charges for everything a real one charges for.
 *
 * The costs are not decoration. A strategy that turns its book over daily on
 * 10 bps of fees and 5 bps of slippage pays roughly 55% of capital a year in
 * costs before it has predicted anything. Most "profitable" bots are profitable
 * only in a model where trading is free, so this broker makes it expensive by
 * default and the reports print the bill.
 */
/**
 * Everything a broker needs to pick up where it left off.
 *
 * A bot described as running 24/7 has to survive a restart, and the only thing
 * that makes that true is writing this down after every bar. A paper account
 * that silently resets to its starting cash whenever the process dies is not a
 * forward test of anything — it is a fresh demo each time, which is exactly the
 * failure mode that makes "running for three months" mean nothing.
 */
export interface BrokerState {
  cash: number;
  qty: number;
  fees: number;
  turnover: number;
  fills: Fill[];
  trades: Trade[];
  openLeg: { time: number; price: number; qty: number; fee: number; bars: number } | null;
}

export class PaperBroker {
  private readonly costs: CostModel;
  private cashBalance: number;
  private qtyHeld = 0;
  private readonly fillLog: Fill[] = [];
  private readonly tradeLog: Trade[] = [];
  private feesTotal = 0;
  private turnoverTotal = 0;

  /** The leg that opened the position currently held, for round-trip accounting. */
  private openLeg: { time: number; price: number; qty: number; fee: number; bars: number } | null =
    null;

  constructor(startingCash: number, costs: CostModel) {
    if (startingCash <= 0) throw new Error('Starting cash must be positive');
    this.cashBalance = startingCash;
    this.costs = costs;
  }

  get cash(): number {
    return this.cashBalance;
  }

  get qty(): number {
    return this.qtyHeld;
  }

  get fees(): number {
    return this.feesTotal;
  }

  /** Total notional traded, in quote currency. Divide by equity for turnover. */
  get turnover(): number {
    return this.turnoverTotal;
  }

  get fills(): readonly Fill[] {
    return this.fillLog;
  }

  get trades(): readonly Trade[] {
    return this.tradeLog;
  }

  /** A snapshot that `restore` can turn back into this broker. */
  get state(): BrokerState {
    return {
      cash: this.cashBalance,
      qty: this.qtyHeld,
      fees: this.feesTotal,
      turnover: this.turnoverTotal,
      fills: [...this.fillLog],
      trades: [...this.tradeLog],
      openLeg: this.openLeg === null ? null : { ...this.openLeg },
    };
  }

  static restore(state: BrokerState, costs: CostModel): PaperBroker {
    // Starting cash must be positive, but a restored account may legitimately
    // hold no cash at all because it is fully invested, so the constructor is
    // given a placeholder and the real balance is written over it.
    const broker = new PaperBroker(1, costs);
    broker.cashBalance = state.cash;
    broker.qtyHeld = state.qty;
    broker.feesTotal = state.fees;
    broker.turnoverTotal = state.turnover;
    broker.fillLog.push(...state.fills);
    broker.tradeLog.push(...state.trades);
    broker.openLeg = state.openLeg === null ? null : { ...state.openLeg };
    return broker;
  }

  /** Cash plus the position marked at `price`. */
  equity(price: number): number {
    return this.cashBalance + this.qtyHeld * price;
  }

  /** The fraction of equity currently in the asset; negative when short. */
  weight(price: number): number {
    const eq = this.equity(price);
    if (eq <= 0) return 0;
    return (this.qtyHeld * price) / eq;
  }

  /**
   * The daily cost of carrying a short, applied once per bar at the bar's
   * duration. Longs on spot carry no cost, so this does nothing for them.
   */
  accrueCarry(price: number, barMs: number): void {
    if (this.qtyHeld >= 0 || this.costs.borrowBpsPerDay === 0) return;
    const notional = Math.abs(this.qtyHeld) * price;
    const days = barMs / 86_400_000;
    const cost = notional * (this.costs.borrowBpsPerDay / 10_000) * days;
    this.cashBalance -= cost;
    this.feesTotal += cost;
  }

  /**
   * Move toward `targetWeight` at `referencePrice`, which must be a price the
   * strategy has not seen — the backtest passes the *next* bar's open. Returns
   * the fill, or null when nothing traded.
   */
  rebalanceTo(
    targetWeight: number,
    referencePrice: number,
    time: number,
    reason: Fill['reason'] = 'rebalance',
  ): Fill | null {
    if (referencePrice <= 0) return null;
    const equity = this.equity(referencePrice);
    if (equity <= 0) return null;

    // Slippage depends on the side, and the side depends on the size, so the
    // desired size is computed once at the unslipped price to settle the sign
    // and then again at the price that sign implies. The residual error is
    // second order in the slippage and not worth iterating away.
    const roughTarget = (targetWeight * equity) / referencePrice;
    const side = Math.sign(roughTarget - this.qtyHeld);
    if (side === 0) return null;
    const fillPrice = referencePrice * (1 + (side * this.costs.slippageBps) / 10_000);

    const desiredQty = (targetWeight * equity) / fillPrice;
    const delta = desiredQty - this.qtyHeld;
    if (delta === 0) return null;

    const notional = Math.abs(delta) * fillPrice;
    const fee = notional * (this.costs.feeBps / 10_000);

    const wasQty = this.qtyHeld;
    this.cashBalance -= delta * fillPrice + fee;
    this.qtyHeld += delta;
    this.feesTotal += fee;
    this.turnoverTotal += notional;

    this.recordRoundTrip(wasQty, delta, fillPrice, fee, time);

    const fill: Fill = { time, qty: delta, price: fillPrice, fee, reason };
    this.fillLog.push(fill);
    return fill;
  }

  /** Sell or buy back everything. Used by the risk layer and at the final bar. */
  flatten(referencePrice: number, time: number, reason: Fill['reason'] = 'liquidate'): Fill | null {
    if (this.qtyHeld === 0) return null;
    return this.rebalanceTo(0, referencePrice, time, reason);
  }

  /** Called once per bar so an open round trip can report how long it lasted. */
  tickBar(): void {
    if (this.openLeg) this.openLeg.bars += 1;
  }

  /**
   * Maintain the round-trip log. A fill that reduces the position toward zero
   * closes a trade; a fill that crosses zero closes one and opens another,
   * which is why the crossing case is handled explicitly rather than treated as
   * a single trade with a confusing side.
   */
  private recordRoundTrip(
    wasQty: number,
    delta: number,
    price: number,
    fee: number,
    time: number,
  ): void {
    const nowQty = wasQty + delta;

    if (wasQty === 0 && nowQty !== 0) {
      this.openLeg = { time, price, qty: nowQty, fee, bars: 0 };
      return;
    }

    if (wasQty !== 0 && Math.sign(nowQty) === Math.sign(wasQty) && Math.abs(nowQty) > Math.abs(wasQty)) {
      // Adding to a winner: average the entry in rather than opening a second
      // trade, so the log stays one row per round trip.
      if (this.openLeg) {
        const totalQty = this.openLeg.qty + delta;
        this.openLeg.price =
          (this.openLeg.price * this.openLeg.qty + price * delta) / (totalQty === 0 ? 1 : totalQty);
        this.openLeg.qty = totalQty;
        this.openLeg.fee += fee;
      }
      return;
    }

    if (wasQty !== 0 && this.openLeg) {
      const leg = this.openLeg;
      const closedQty =
        nowQty === 0 ? leg.qty : Math.sign(leg.qty) * Math.min(Math.abs(leg.qty), Math.abs(delta));
      // A partial exit — which the weight cap produces whenever it trims a
      // position rather than closing it — takes its share of the entry fee with
      // it, and leaves the rest attached to what is still open. Charging the
      // whole entry fee to the first partial close would overstate that trade's
      // loss and hand the remainder a free entry.
      const closedFraction = Math.abs(closedQty) / Math.abs(leg.qty);
      const notional = Math.abs(closedQty) * leg.price;
      const gross = closedQty * (price - leg.price);
      const feeShare = leg.fee * closedFraction + fee;
      this.tradeLog.push({
        openTime: leg.time,
        closeTime: time,
        side: leg.qty > 0 ? 'long' : 'short',
        entryPrice: leg.price,
        exitPrice: price,
        qty: Math.abs(closedQty),
        pnl: gross - feeShare,
        returnPct: notional === 0 ? 0 : (gross - feeShare) / notional,
        bars: leg.bars,
      });

      if (nowQty === 0) {
        this.openLeg = null;
      } else if (Math.sign(nowQty) !== Math.sign(wasQty)) {
        // The fill reversed the position: the remainder is a new trade.
        this.openLeg = { time, price, qty: nowQty, fee: 0, bars: 0 };
      } else {
        this.openLeg = { ...leg, qty: nowQty, fee: leg.fee * (1 - closedFraction) };
      }
    }
  }
}

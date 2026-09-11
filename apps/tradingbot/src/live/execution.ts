import { PaperBroker, type BrokerState } from '../engine/broker.js';
import type { CostModel, Fill } from '../types.js';

/**
 * The seam between "decided to trade" and "traded".
 *
 * The shape of `OrderOutcome` is the important part, and it changed once the real
 * broker arrived. A simulated fill is synchronous: you ask for a weight and you
 * have it. A real order is not — it is accepted, queued, possibly partially
 * filled, possibly rejected, and if the market is shut it sits there until the
 * open. An interface that returns `Fill | null` can only express the simulated
 * case, and code written against it will believe it is in a position it does not
 * yet hold.
 *
 * So a live adapter reports what it *submitted*, and the loop re-reads the actual
 * position from the broker on the next bar rather than assuming. That is slower,
 * more annoying, and the only version that is true.
 */
export type OrderOutcome =
  /** The position changed now, at this price. Only a simulator can promise this. */
  | { kind: 'filled'; fill: Fill }
  /** The order reached the broker. Whether it fills, and at what, is not known yet. */
  | { kind: 'submitted'; orderId: string; requestedQuantity: number; note: string }
  /** Nothing was sent, and why. */
  | { kind: 'skipped'; reason: string };

export interface ExecutionAdapter {
  readonly kind: 'paper' | 'live';
  /** A label for logs and journals: "paper" or "ibkr:DU1234567". */
  readonly label: string;
  /** Equity in the account currency. A live adapter asks the broker. */
  equity(price: number): Promise<number> | number;
  /** The fraction of equity held in the instrument. */
  weight(price: number): Promise<number> | number;
  /** Move toward a target weight. */
  rebalanceTo(targetWeight: number, price: number, time: number): Promise<OrderOutcome>;
  flatten(price: number, time: number): Promise<OrderOutcome>;
  readonly fills: readonly Fill[];
}

/** Simulated execution against live prices, with the same costs as a backtest. */
export class PaperExecution implements ExecutionAdapter {
  readonly kind = 'paper';
  readonly label = 'paper';
  private readonly broker: PaperBroker;

  constructor(startingCash: number, costs: CostModel, resumeFrom?: BrokerState) {
    this.broker = resumeFrom
      ? PaperBroker.restore(resumeFrom, costs)
      : new PaperBroker(startingCash, costs);
  }

  /** The broker's state, for persisting a long run across restarts. */
  get state(): BrokerState {
    return this.broker.state;
  }

  equity(price: number): number {
    return this.broker.equity(price);
  }

  weight(price: number): number {
    return this.broker.weight(price);
  }

  async rebalanceTo(targetWeight: number, price: number, time: number): Promise<OrderOutcome> {
    const fill = this.broker.rebalanceTo(targetWeight, price, time);
    return fill === null
      ? { kind: 'skipped', reason: 'already at target' }
      : { kind: 'filled', fill };
  }

  async flatten(price: number, time: number): Promise<OrderOutcome> {
    const fill = this.broker.flatten(price, time);
    return fill === null ? { kind: 'skipped', reason: 'already flat' } : { kind: 'filled', fill };
  }

  get fills(): readonly Fill[] {
    return this.broker.fills;
  }

  get fees(): number {
    return this.broker.fees;
  }
}

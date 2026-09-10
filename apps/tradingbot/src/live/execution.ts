import { PaperBroker, type BrokerState } from '../engine/broker.js';
import type { CostModel, Fill } from '../types.js';

/**
 * The seam between "decided to trade" and "traded".
 *
 * There is exactly one implementation in this repository, and it is simulated.
 * That is a deliberate boundary, not an omission: wiring a real exchange in means
 * creating API keys with withdrawal disabled, handling partial fills, rejects,
 * reconnects, clock drift and duplicate order IDs, and deciding how much real
 * money may be lost while you find out which of those you got wrong. All of that
 * is downstream of a question this repository exists to answer first — whether
 * the strategy has any edge at all out of sample.
 *
 * If the answer turns out to be yes, implement this interface against the
 * exchange and keep the rest of the system unchanged. If the answer is no, you
 * have saved yourself the money.
 */
export interface ExecutionAdapter {
  readonly kind: 'paper' | 'live';
  /** Equity in quote currency, marked at `price`. */
  equity(price: number): number;
  /** The fraction of equity currently held in the asset. */
  weight(price: number): number;
  /** Move toward a target weight. Returns the fill, or null if nothing traded. */
  rebalanceTo(targetWeight: number, price: number, time: number): Promise<Fill | null>;
  flatten(price: number, time: number): Promise<Fill | null>;
  readonly fills: readonly Fill[];
}

/** Simulated execution against live prices, with the same costs as a backtest. */
export class PaperExecution implements ExecutionAdapter {
  readonly kind = 'paper';
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

  async rebalanceTo(targetWeight: number, price: number, time: number): Promise<Fill | null> {
    return this.broker.rebalanceTo(targetWeight, price, time);
  }

  async flatten(price: number, time: number): Promise<Fill | null> {
    return this.broker.flatten(price, time);
  }

  get fills(): readonly Fill[] {
    return this.broker.fills;
  }

  get fees(): number {
    return this.broker.fees;
  }
}

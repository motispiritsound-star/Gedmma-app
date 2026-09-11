import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import { PaperBroker } from '../src/engine/broker.js';
import type { CostModel } from '../src/types.js';

const FREE: CostModel = { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 };
const REALISTIC: CostModel = { commission: bpsCommission(10), slippageBps: 5, borrowBpsPerDay: 5 };

describe('PaperBroker', () => {
  it('puts the whole account into the asset at weight 1', () => {
    const broker = new PaperBroker(1000, FREE);
    broker.rebalanceTo(1, 100, 0);
    expect(broker.qty).toBeCloseTo(10, 10);
    expect(broker.cash).toBeCloseTo(0, 10);
    expect(broker.weight(100)).toBeCloseTo(1, 10);
  });

  it('charges the fee on the way in and the way out', () => {
    const broker = new PaperBroker(1000, { ...FREE, commission: bpsCommission(10) });
    broker.rebalanceTo(1, 100, 0);
    broker.rebalanceTo(0, 100, 1);
    // Two fills at 10 bps of roughly 1000 each: about 2 in total, and the price
    // never moved, so the loss is exactly the commission.
    expect(broker.fees).toBeGreaterThan(1.9);
    expect(broker.fees).toBeLessThan(2.1);
    expect(broker.equity(100)).toBeCloseTo(1000 - broker.fees, 8);
  });

  it('buys above the reference price and sells below it', () => {
    const broker = new PaperBroker(1000, { ...FREE, slippageBps: 50 });
    broker.rebalanceTo(1, 100, 0);
    const buy = broker.fills[0];
    expect(buy?.price).toBeCloseTo(100.5, 8);

    broker.rebalanceTo(0, 100, 1);
    const sell = broker.fills[1];
    expect(sell?.price).toBeCloseTo(99.5, 8);
  });

  it('never trades when already at the target', () => {
    const broker = new PaperBroker(1000, REALISTIC);
    broker.rebalanceTo(1, 100, 0);
    const fillsAfterEntry = broker.fills.length;
    broker.rebalanceTo(broker.weight(100), 100, 1);
    expect(broker.fills).toHaveLength(fillsAfterEntry);
  });

  it('records a profitable round trip net of both fees', () => {
    const broker = new PaperBroker(1000, { ...FREE, commission: bpsCommission(10) });
    broker.rebalanceTo(1, 100, 0);
    broker.rebalanceTo(0, 110, 1);
    expect(broker.trades).toHaveLength(1);
    const trade = broker.trades[0];
    expect(trade?.side).toBe('long');
    expect(trade?.pnl).toBeGreaterThan(95);
    expect(trade?.pnl).toBeLessThan(100);
    expect(trade?.returnPct).toBeGreaterThan(0.09);
  });

  it('splits a reversal into two round trips', () => {
    const broker = new PaperBroker(1000, FREE);
    broker.rebalanceTo(1, 100, 0);
    broker.rebalanceTo(-1, 110, 1);
    expect(broker.trades).toHaveLength(1);
    broker.rebalanceTo(0, 105, 2);
    expect(broker.trades).toHaveLength(2);
    expect(broker.trades[1]?.side).toBe('short');
    // The short was opened at 110 and closed at 105, so it made money.
    expect(broker.trades[1]?.pnl).toBeGreaterThan(0);
  });

  it('charges borrow on a short and nothing on a long', () => {
    const short = new PaperBroker(1000, { ...FREE, borrowBpsPerDay: 100 });
    short.rebalanceTo(-1, 100, 0);
    const before = short.equity(100);
    short.accrueCarry(100, 86_400_000);
    expect(short.equity(100)).toBeLessThan(before);

    const long = new PaperBroker(1000, { ...FREE, borrowBpsPerDay: 100 });
    long.rebalanceTo(1, 100, 0);
    const longBefore = long.equity(100);
    long.accrueCarry(100, 86_400_000);
    expect(long.equity(100)).toBeCloseTo(longBefore, 10);
  });

  it('counts notional traded as turnover', () => {
    const broker = new PaperBroker(1000, FREE);
    broker.rebalanceTo(1, 100, 0);
    broker.rebalanceTo(0, 100, 1);
    expect(broker.turnover).toBeCloseTo(2000, 0);
  });

  it('refuses to start with no money', () => {
    expect(() => new PaperBroker(0, FREE)).toThrow(/positive/);
  });
});

describe('partial exits', () => {
  it('splits the entry fee between the part closed and the part still open', () => {
    const broker = new PaperBroker(1000, { ...FREE, commission: bpsCommission(10) });
    broker.rebalanceTo(1, 100, 0);
    const entryFee = broker.fees;

    // Trim to half the position, then close the rest at the same price.
    broker.rebalanceTo(0.5, 100, 1);
    broker.rebalanceTo(0, 100, 2);

    expect(broker.trades).toHaveLength(2);
    const charged = (broker.trades[0]?.pnl ?? 0) + (broker.trades[1]?.pnl ?? 0);
    // The price never moved, so the two round trips together account for every
    // cent of commission paid — no fee double-charged and none lost.
    expect(-charged).toBeCloseTo(broker.fees, 8);
    expect(entryFee).toBeGreaterThan(0);
  });
})

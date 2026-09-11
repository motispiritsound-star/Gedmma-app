import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import {
  DEFAULT_IMPACT,
  barVolatility,
  slippageFor,
  type MarketContext,
} from '../src/costs/slippage.js';
import { PaperBroker } from '../src/engine/broker.js';
import { runBacktest } from '../src/engine/backtest.js';
import type { Strategy } from '../src/strategy/types.js';
import type { Candle } from '../src/types.js';

/** A bar with a 2% range and a known traded value. */
function market(volume: number, close = 100): MarketContext {
  return { volume, high: close * 1.01, low: close * 0.99, close };
}

describe('barVolatility', () => {
  it('is the range over the close', () => {
    expect(barVolatility(market(10, 100))).toBeCloseTo(0.02, 10);
  });

  it('is zero for a bar that did not move, and for a nonsense close', () => {
    expect(barVolatility({ volume: 10, high: 100, low: 100, close: 100 })).toBe(0);
    expect(barVolatility({ volume: 10, high: 1, low: 0, close: 0 })).toBe(0);
  });
});

describe('slippageFor', () => {
  it('is the spread alone when no impact model is given', () => {
    const result = slippageFor({ spreadBps: 5, orderNotional: 1_000_000, market: market(1) });
    expect(result.totalBps).toBe(5);
    expect(result.impactBps).toBe(0);
  });

  it('is the spread alone when there is no market context to size against', () => {
    const result = slippageFor({ spreadBps: 5, impact: DEFAULT_IMPACT, orderNotional: 1_000_000 });
    expect(result.totalBps).toBe(5);
    expect(result.participation).toBe(0);
  });

  it('charges nothing extra for an order far below the noise floor', () => {
    // One euro against a bar that traded a hundred thousand.
    const result = slippageFor({
      spreadBps: 5,
      impact: DEFAULT_IMPACT,
      orderNotional: 1,
      market: market(1000),
    });
    expect(result.impactBps).toBe(0);
    expect(result.participation).toBeGreaterThan(0);
  });

  it('grows with the square root of participation, not linearly', () => {
    const impact = { ...DEFAULT_IMPACT, maxBps: 100_000 };
    const bar = market(1000); // 100,000 of notional traded in the bar.
    const small = slippageFor({ spreadBps: 0, impact, orderNotional: 10_000, market: bar });
    const quadruple = slippageFor({ spreadBps: 0, impact, orderNotional: 40_000, market: bar });
    // Four times the size is twice the impact. Linear would be four times, and
    // getting that exponent wrong is the difference between a capacity limit that
    // bites gradually and one that appears out of nowhere.
    expect(quadruple.impactBps / small.impactBps).toBeCloseTo(2, 6);
  });

  it('scales with the bar’s own volatility', () => {
    const impact = { ...DEFAULT_IMPACT, maxBps: 100_000 };
    const calm: MarketContext = { volume: 1000, high: 100.1, low: 99.9, close: 100 };
    const wild: MarketContext = { volume: 1000, high: 105, low: 95, close: 100 };
    const a = slippageFor({ spreadBps: 0, impact, orderNotional: 10_000, market: calm });
    const b = slippageFor({ spreadBps: 0, impact, orderNotional: 10_000, market: wild });
    expect(b.impactBps).toBeGreaterThan(a.impactBps * 10);
  });

  it('caps the result and says that it did', () => {
    const result = slippageFor({
      spreadBps: 5,
      impact: { ...DEFAULT_IMPACT, maxBps: 50 },
      // An order worth ten times the whole bar.
      orderNotional: 1_000_000,
      market: market(1000),
    });
    expect(result.impactBps).toBe(50);
    expect(result.capped).toBe(true);
    expect(result.totalBps).toBe(55);
  });

  it('charges no impact on a bar that reports no volume, and says participation is unknown', () => {
    const result = slippageFor({
      spreadBps: 5,
      impact: DEFAULT_IMPACT,
      orderNotional: 10_000,
      market: { volume: 0, high: 101, low: 99, close: 100 },
    });
    // Guessing zero impact is the optimistic guess; participation of 0 is the
    // signal that it could not be measured rather than that it was tiny.
    expect(result.impactBps).toBe(0);
    expect(result.participation).toBe(0);
  });
});

describe('impact in the broker', () => {
  const costs = {
    commission: bpsCommission(0),
    slippageBps: 0,
    borrowBpsPerDay: 0,
    impact: { ...DEFAULT_IMPACT, maxBps: 100_000 },
  };

  it('makes a buy fill above the reference price, by more when the order is larger', () => {
    const small = new PaperBroker(1_000, costs);
    small.rebalanceTo(1, 100, 0, 'rebalance', market(1000));
    const large = new PaperBroker(100_000, costs);
    large.rebalanceTo(1, 100, 0, 'rebalance', market(1000));

    expect(small.fills[0]?.price).toBeGreaterThan(100);
    expect(large.fills[0]?.price).toBeGreaterThan(small.fills[0]?.price as number);
  });

  it('records the worst participation and what impact cost', () => {
    const broker = new PaperBroker(50_000, costs);
    broker.rebalanceTo(1, 100, 0, 'rebalance', market(1000));
    const execution = broker.execution;
    expect(execution.worstParticipation).toBeGreaterThan(0.3);
    expect(execution.impactCost).toBeGreaterThan(0);
    expect(execution.averageSlippageBps).toBeGreaterThan(0);
  });

  it('counts the fills that hit the ceiling', () => {
    const broker = new PaperBroker(1_000_000, { ...costs, impact: { ...DEFAULT_IMPACT, maxBps: 10 } });
    broker.rebalanceTo(1, 100, 0, 'rebalance', market(10));
    expect(broker.execution.cappedFills).toBe(1);
  });
});

describe('impact in the backtest', () => {
  const alwaysLong: Strategy = {
    name: 'always-long',
    describe: 'always long',
    warmupBars: 0,
    onBar: () => 1,
  };

  /** A flat market with a known volume per bar, so participation is predictable. */
  function flat(bars: number, volume: number): Candle[] {
    return Array.from({ length: bars }, (_, i) => ({
      openTime: i * 86_400_000,
      open: 100,
      high: 101,
      low: 99,
      close: 100,
      volume,
    }));
  }

  const base = {
    interval: '1d' as const,
    costs: { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 },
    limits: {
      maxWeight: 1,
      maxDailyLossPct: 1,
      maxDrawdownPct: 1,
      rebalanceThreshold: 0.01,
      minOrderQuote: 0,
    },
  };

  it('makes the same strategy on the same bars worse at larger size', () => {
    const withImpact = {
      ...base.costs,
      impact: { ...DEFAULT_IMPACT, maxBps: 100_000 },
    };
    const small = runBacktest({
      ...base,
      candles: flat(30, 1000),
      strategy: alwaysLong,
      startingCash: 1_000,
      costs: withImpact,
    });
    const large = runBacktest({
      ...base,
      candles: flat(30, 1000),
      strategy: alwaysLong,
      startingCash: 1_000_000,
      costs: withImpact,
    });
    // An edge is not a property of a strategy, it is a property of a strategy at a
    // size, and this is the assertion that keeps that true.
    expect(large.metrics.totalReturn).toBeLessThan(small.metrics.totalReturn);
    expect(large.execution.worstParticipation).toBeGreaterThan(
      small.execution.worstParticipation,
    );
  });

  it('reports that volume was missing when the series has none', () => {
    const result = runBacktest({
      ...base,
      candles: flat(30, 0),
      strategy: alwaysLong,
      startingCash: 1_000,
      costs: { ...base.costs, impact: DEFAULT_IMPACT },
    });
    expect(result.execution.volumeAvailable).toBe(false);
    expect(result.execution.worstParticipation).toBe(0);
  });

  it('changes nothing when no impact model is configured', () => {
    const result = runBacktest({
      ...base,
      candles: flat(30, 1000),
      strategy: alwaysLong,
      startingCash: 1_000_000,
      costs: base.costs,
    });
    expect(result.execution.impactCost).toBe(0);
    expect(result.execution.worstParticipation).toBe(0);
  });
});

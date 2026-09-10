import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMITS, RiskManager, clamp, type RiskLimits } from '../src/risk/risk.js';

const LIMITS: RiskLimits = {
  maxWeight: 1,
  maxDailyLossPct: 0.05,
  maxDrawdownPct: 0.2,
  rebalanceThreshold: 0.05,
  minOrderQuote: 10,
};

const DAY = 86_400_000;

describe('RiskManager', () => {
  it('caps a greedy target at the weight limit', () => {
    const risk = new RiskManager(1000, { ...LIMITS, maxWeight: 0.5 });
    risk.mark(0, 1000);
    const verdict = risk.evaluate(5, 0, 1000, 100);
    expect(verdict).toEqual({ action: 'allow', weight: 0.5 });
  });

  it('holds when the change is smaller than the rebalance threshold', () => {
    const risk = new RiskManager(1000, LIMITS);
    risk.mark(0, 1000);
    const verdict = risk.evaluate(0.52, 0.5, 1000, 100);
    expect(verdict.action).toBe('hold');
  });

  it('holds when the order would be below the exchange minimum', () => {
    const risk = new RiskManager(20, { ...LIMITS, rebalanceThreshold: 0 });
    risk.mark(0, 20);
    // 20 of equity moving 10% of weight is a 2 order, under the 10 minimum.
    const verdict = risk.evaluate(0.1, 0, 20, 100);
    expect(verdict.action).toBe('hold');
    if (verdict.action === 'hold') expect(verdict.reason).toMatch(/minimum order/);
  });

  it('always allows an exit, however small', () => {
    const risk = new RiskManager(1000, { ...LIMITS, rebalanceThreshold: 0.9 });
    risk.mark(0, 1000);
    const verdict = risk.evaluate(0, 0.01, 1000, 100);
    expect(verdict).toEqual({ action: 'allow', weight: 0 });
  });

  it('fires the kill switch at the drawdown limit and never resets it', () => {
    const risk = new RiskManager(1000, LIMITS);
    risk.mark(0, 1000);
    expect(risk.isTripped).toBe(false);

    risk.mark(DAY, 790);
    expect(risk.isTripped).toBe(true);
    expect(risk.trippedReason).toMatch(/kill switch/);

    // A full recovery, and several days later: still tripped.
    risk.mark(10 * DAY, 5000);
    expect(risk.isTripped).toBe(true);
    expect(risk.evaluate(1, 0, 5000, 100).action).toBe('hold');
  });

  it('flattens an open position when the kill switch fires', () => {
    const risk = new RiskManager(1000, LIMITS);
    risk.mark(0, 1000);
    risk.mark(DAY, 700);
    expect(risk.evaluate(1, 0.8, 700, 100).action).toBe('flatten');
  });

  it('measures drawdown from the high-water mark, not the start', () => {
    const risk = new RiskManager(1000, LIMITS);
    risk.mark(0, 1000);
    risk.mark(DAY, 2000);
    // 1700 is up 70% on the start but down 15% from the peak: under the limit.
    risk.mark(2 * DAY, 1700);
    expect(risk.isTripped).toBe(false);
    risk.mark(3 * DAY, 1550);
    expect(risk.isTripped).toBe(true);
  });

  it('stops for the day at the daily loss limit and resumes the next day', () => {
    const risk = new RiskManager(1000, { ...LIMITS, maxDrawdownPct: 1 });
    risk.mark(0, 1000);
    risk.mark(3_600_000, 940);
    expect(risk.evaluate(1, 0, 940, 100).action).toBe('hold');

    // A new calendar day resets the daily stop but not the kill switch.
    risk.mark(DAY + 3_600_000, 940);
    expect(risk.evaluate(1, 0, 940, 100).action).toBe('allow');
  });

  it('ignores the daily limit entirely when told not to enforce it', () => {
    const risk = new RiskManager(1000, { ...LIMITS, maxDrawdownPct: 1 }, false);
    risk.mark(0, 1000);
    risk.mark(3_600_000, 500);
    expect(risk.evaluate(1, 0, 500, 100).action).toBe('allow');
  });

  it('will not start with impossible settings', () => {
    expect(() => new RiskManager(0, LIMITS)).toThrow(/positive/);
    expect(() => new RiskManager(1000, { ...LIMITS, maxWeight: 0 })).toThrow(/maxWeight/);
  });

  it('ships defaults that let a long-only crypto strategy survive its own volatility', () => {
    // A 20% kill switch would end any long-only BTC backtest in its first year.
    expect(DEFAULT_LIMITS.maxDrawdownPct).toBeGreaterThan(0.25);
    expect(DEFAULT_LIMITS.maxWeight).toBe(1);
  });
});

describe('clamp', () => {
  it('bounds on both sides', () => {
    expect(clamp(5, -1, 1)).toBe(1);
    expect(clamp(-5, -1, 1)).toBe(-1);
    expect(clamp(0.5, -1, 1)).toBe(0.5);
  });
});

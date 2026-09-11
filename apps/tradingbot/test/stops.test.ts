import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import { runBacktest } from '../src/engine/backtest.js';
import { StopTracker, hasStops } from '../src/risk/stops.js';
import { volatilityScalar, DEFAULT_SIZING } from '../src/risk/sizing.js';
import type { Strategy } from '../src/strategy/types.js';
import type { Candle, CostModel } from '../src/types.js';

const FREE: CostModel = { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 };
const LOOSE = {
  maxWeight: 1,
  maxDailyLossPct: 1,
  maxDrawdownPct: 1,
  rebalanceThreshold: 0.01,
  minOrderQuote: 0,
};
const DAY = 86_400_000;

function bar(i: number, open: number, high: number, low: number, close: number): Candle {
  return { openTime: i * DAY, open, high, low, close, volume: 1 };
}

const alwaysLong: Strategy = {
  name: 'always-long',
  describe: 'always long',
  warmupBars: 0,
  onBar: () => 1,
};

describe('hasStops', () => {
  it('is false for an empty config and for zeroes', () => {
    expect(hasStops({})).toBe(false);
    expect(hasStops({ initialPct: 0, trailingPct: 0 })).toBe(false);
    expect(hasStops({ initialPct: 0.05 })).toBe(true);
    // A cooldown alone is not a stop; there is nothing to cool down from.
    expect(hasStops({ cooldownBars: 5 })).toBe(false);
  });
});

describe('StopTracker', () => {
  it('refuses settings that are not fractions', () => {
    expect(() => new StopTracker({ initialPct: 1.5 })).toThrow(/fraction in \[0, 1\)/);
    expect(() => new StopTracker({ trailingPct: -0.1 })).toThrow(/fraction/);
    expect(() => new StopTracker({ initialPct: 0.05, cooldownBars: 2.5 })).toThrow(/whole number/);
  });

  it('reports no levels while flat', () => {
    expect(new StopTracker({ initialPct: 0.05 }).levels()).toBeNull();
  });

  it('fills at the stop when the bar only dips through it', () => {
    const tracker = new StopTracker({ initialPct: 0.05 });
    tracker.open('long', 100);
    const hit = tracker.check(bar(1, 99, 101, 94, 100));
    expect(hit?.reason).toBe('stop-loss');
    expect(hit?.price).toBeCloseTo(95, 10);
    expect(hit?.slippedBy).toBeCloseTo(0, 10);
  });

  it('fills at the open when the bar gapped past the stop', () => {
    const tracker = new StopTracker({ initialPct: 0.05 });
    tracker.open('long', 100);
    const hit = tracker.check(bar(1, 80, 82, 78, 80));
    expect(hit?.price).toBe(80);
    expect(hit?.trigger).toBeCloseTo(95, 10);
    // 80 against a 95 stop is 15.8% worse than the resting order.
    expect(hit?.slippedBy).toBeCloseTo(15 / 95, 6);
  });

  it('does nothing while the bar stays above the stop', () => {
    const tracker = new StopTracker({ initialPct: 0.05 });
    tracker.open('long', 100);
    expect(tracker.check(bar(1, 100, 103, 96, 102))).toBeNull();
  });

  it('ratchets a trailing stop up but never down', () => {
    const tracker = new StopTracker({ trailingPct: 0.1 });
    tracker.open('long', 100);
    expect(tracker.levels()?.trailing).toBeCloseTo(90, 10);

    tracker.observe(bar(1, 100, 120, 99, 118));
    expect(tracker.levels()?.trailing).toBeCloseTo(108, 10);

    // A lower bar must not pull the trailing level back down.
    tracker.observe(bar(2, 118, 119, 110, 112));
    expect(tracker.levels()?.trailing).toBeCloseTo(108, 10);

    const hit = tracker.check(bar(3, 112, 112, 100, 101));
    expect(hit?.reason).toBe('trailing-stop');
    expect(hit?.price).toBeCloseTo(108, 10);
  });

  it('fills a take-profit better when the gap is in your favour', () => {
    const tracker = new StopTracker({ takeProfitPct: 0.1 });
    tracker.open('long', 100);
    const hit = tracker.check(bar(1, 125, 130, 124, 128));
    expect(hit?.reason).toBe('take-profit');
    // The resting order was at 110; the market opened at 125, so you got 125.
    expect(hit?.price).toBe(125);
  });

  it('assumes the stop when one bar contains both the stop and the target', () => {
    const tracker = new StopTracker({ initialPct: 0.05, takeProfitPct: 0.05 });
    tracker.open('long', 100);
    const hit = tracker.check(bar(1, 100, 110, 90, 100));
    // OHLC cannot say which came first. Guessing the good one is how a backtest
    // turns a coin flip into an edge.
    expect(hit?.reason).toBe('stop-loss');
  });

  it('mirrors all of it for a short', () => {
    const tracker = new StopTracker({ initialPct: 0.05, trailingPct: 0.1 });
    tracker.open('short', 100);
    expect(tracker.levels()?.stop).toBeCloseTo(105, 10);
    const gapped = tracker.check(bar(1, 130, 132, 128, 130));
    expect(gapped?.reason).toBe('stop-loss');
    expect(gapped?.price).toBe(130);
  });

  it('forgets everything when the position closes', () => {
    const tracker = new StopTracker({ initialPct: 0.05 });
    tracker.open('long', 100);
    tracker.close();
    expect(tracker.isOpen).toBe(false);
    expect(tracker.check(bar(1, 10, 10, 10, 10))).toBeNull();
  });
});

describe('stops inside the backtest', () => {
  /** Flat at 100, then a bar that opens at 80 — a gap straight through a 5% stop. */
  const gapped: Candle[] = [
    bar(0, 100, 100, 100, 100),
    bar(1, 100, 100, 100, 100),
    bar(2, 80, 82, 78, 80),
    bar(3, 80, 80, 80, 80),
  ];

  it('exits at the gap, not at the stop price', () => {
    const result = runBacktest({
      candles: gapped,
      strategy: alwaysLong,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
      stops: { initialPct: 0.05, cooldownBars: 10 },
    });
    const exit = result.fills.find((f) => f.reason === 'stop-loss');
    expect(exit?.price).toBe(80);
    // 800, not the 950 a naive backtest would report.
    expect(result.metrics.endEquity).toBeCloseTo(800, 6);
    expect(result.stops?.byReason['stop-loss']).toBe(1);
    expect(result.stops?.worstSlippagePastTrigger).toBeGreaterThan(0.15);
  });

  it('reports nothing when no stops are configured', () => {
    const result = runBacktest({
      candles: gapped,
      strategy: alwaysLong,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.stops).toBeNull();
    // Without a stop the position simply rides the gap down and is marked out.
    expect(result.metrics.endEquity).toBeCloseTo(800, 6);
  });

  it('keeps the bot flat during the cooldown, then lets it back in', () => {
    // A long slow recovery after the gap: without a cooldown the always-long
    // strategy would buy back on the very next bar.
    const candles: Candle[] = [
      ...gapped,
      ...Array.from({ length: 8 }, (_, i) => bar(4 + i, 80 + i, 81 + i, 79 + i, 80 + i)),
    ];
    const result = runBacktest({
      candles,
      strategy: alwaysLong,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
      stops: { initialPct: 0.05, cooldownBars: 4 },
    });

    const stopAt = result.fills.findIndex((f) => f.reason === 'stop-loss');
    const reentry = result.fills[stopAt + 1];
    expect(reentry).toBeDefined();
    const stopTime = result.fills[stopAt]?.time as number;
    // Re-entry happens, but only after the cooldown has run out.
    expect((reentry?.time as number) - stopTime).toBeGreaterThanOrEqual(4 * DAY);
  });

  it('takes profit when the target is hit', () => {
    const rising: Candle[] = [
      bar(0, 100, 100, 100, 100),
      bar(1, 100, 100, 100, 100),
      bar(2, 101, 130, 100, 128),
      bar(3, 128, 128, 128, 128),
    ];
    const result = runBacktest({
      candles: rising,
      strategy: alwaysLong,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
      stops: { takeProfitPct: 0.1, cooldownBars: 10 },
    });
    expect(result.stops?.byReason['take-profit']).toBe(1);
    expect(result.fills.find((f) => f.reason === 'take-profit')?.price).toBeCloseTo(110, 10);
  });
});

describe('volatility targeting', () => {
  /** A price series with a given constant per-bar move, alternating direction. */
  function zigzag(bars: number, stepPct: number): number[] {
    const out = [100];
    for (let i = 1; i < bars; i += 1) {
      out.push((out[i - 1] as number) * (1 + (i % 2 === 0 ? stepPct : -stepPct)));
    }
    return out;
  }

  it('halves the weight when volatility doubles', () => {
    const config = { targetAnnualVol: 0.2, lookback: 40, maxLeverage: 10 };
    const calm = volatilityScalar(zigzag(60, 0.005), '1d', config);
    const wild = volatilityScalar(zigzag(60, 0.01), '1d', config);
    expect(calm / wild).toBeCloseTo(2, 1);
  });

  it('never scales above the leverage cap', () => {
    const scalar = volatilityScalar(zigzag(60, 0.0001), '1d', DEFAULT_SIZING);
    expect(scalar).toBeLessThanOrEqual(DEFAULT_SIZING.maxLeverage);
  });

  it('leaves the weight alone when there is not enough history', () => {
    expect(volatilityScalar([100, 101], '1d', DEFAULT_SIZING)).toBe(1);
  });

  it('leaves the weight alone on a series that never moves', () => {
    expect(volatilityScalar(Array.from({ length: 60 }, () => 100), '1d', DEFAULT_SIZING)).toBe(1);
  });

  it('cuts exposure in the backtest when volatility is high', () => {
    const candles = Array.from({ length: 200 }, (_, i) => {
      const close = 100 * (1 + (i % 2 === 0 ? 0.03 : -0.029));
      return bar(i, close, close * 1.01, close * 0.99, close);
    });
    const unsized = runBacktest({
      candles,
      strategy: alwaysLong,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    const sized = runBacktest({
      candles,
      strategy: alwaysLong,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
      sizing: { targetAnnualVol: 0.1, lookback: 30, maxLeverage: 1 },
    });
    const averageWeight = (r: typeof unsized): number =>
      r.curve.reduce((s, p) => s + Math.abs(p.weight), 0) / r.curve.length;
    expect(averageWeight(sized)).toBeLessThan(averageWeight(unsized));
  });
});

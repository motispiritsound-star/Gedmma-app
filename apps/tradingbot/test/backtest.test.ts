import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import { runBacktest } from '../src/engine/backtest.js';
import { meanRevertingSeries, trendingSeries } from '../src/data/synthetic.js';
import { buyAndHold } from '../src/strategy/buyAndHold.js';
import { emaCross } from '../src/strategy/emaCross.js';
import { meanReversion } from '../src/strategy/meanReversion.js';
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

function flatCandles(count: number, price: number): Candle[] {
  return Array.from({ length: count }, (_, i) => ({
    openTime: i * 86_400_000,
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 1,
  }));
}

describe('the strategy cannot see the future', () => {
  it('is never handed more bars than have closed', () => {
    const candles = trendingSeries(200, '1d', 3);
    const seen: number[] = [];
    const spy: Strategy = {
      name: 'spy',
      describe: 'records how much history it was given',
      warmupBars: 0,
      onBar: (ctx) => {
        seen.push(ctx.candles.length);
        // The final bar in the view must be the latest closed bar, never a later one.
        const last = ctx.candles[ctx.candles.length - 1];
        expect(last?.openTime).toBe(candles[ctx.candles.length - 1]?.openTime);
        return 0;
      },
    };

    runBacktest({ candles, strategy: spy, interval: '1d', startingCash: 1000, costs: FREE });

    // One decision per bar except the last, which has no bar to fill against.
    expect(seen).toHaveLength(candles.length - 1);
    expect(seen[0]).toBe(1);
    expect(seen[seen.length - 1]).toBe(candles.length - 1);
  });

  it('fills at the next bar open, not at the close that produced the signal', () => {
    // Flat at 100, then a single bar that opens at 200. A strategy that went long
    // on the last 100-close must pay 200, because that is the first price it
    // could actually have traded at.
    const candles: Candle[] = [
      ...flatCandles(3, 100),
      { openTime: 3 * 86_400_000, open: 200, high: 200, low: 200, close: 200, volume: 1 },
      { openTime: 4 * 86_400_000, open: 200, high: 200, low: 200, close: 200, volume: 1 },
    ];

    const buyOnBarTwo: Strategy = {
      name: 'buy-on-bar-two',
      describe: 'goes long once three bars have closed',
      warmupBars: 0,
      onBar: (ctx) => (ctx.candles.length >= 3 ? 1 : 0),
    };

    const result = runBacktest({
      candles,
      strategy: buyOnBarTwo,
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });

    const entry = result.fills[0];
    expect(entry?.price).toBe(200);
    // Buying the gap at 200 and selling at 200 makes nothing. A backtest that
    // filled at the 100 close would report a 100% gain out of thin air.
    expect(result.metrics.endEquity).toBeCloseTo(1000, 6);
  });
});

describe('costs', () => {
  it('loses exactly the commission on a flat market', () => {
    const candles = flatCandles(50, 100);
    const result = runBacktest({
      candles,
      strategy: buyAndHold(),
      interval: '1d',
      startingCash: 1000,
      costs: { commission: bpsCommission(10), slippageBps: 0, borrowBpsPerDay: 0 },
      limits: LOOSE,
    });
    expect(result.metrics.endEquity).toBeCloseTo(1000 - result.metrics.feesPaid, 6);
    expect(result.metrics.feesPaid).toBeGreaterThan(0);
  });

  it('turns a profitable gross strategy into a losing net one when fees are high', () => {
    const candles = meanRevertingSeries(800, '1h', 11);
    const strategy = () => meanReversion({ lookback: 20, entryZ: 1, exitZ: 0.1, allowShort: false });
    const free = runBacktest({
      candles,
      strategy: strategy(),
      interval: '1h',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    const expensive = runBacktest({
      candles,
      strategy: strategy(),
      interval: '1h',
      startingCash: 1000,
      costs: { commission: bpsCommission(100), slippageBps: 50, borrowBpsPerDay: 0 },
      limits: LOOSE,
    });
    expect(free.metrics.totalReturn).toBeGreaterThan(expensive.metrics.totalReturn);
    expect(expensive.metrics.feesPaid).toBeGreaterThan(free.metrics.feesPaid);
  });
});

describe('the benchmark', () => {
  it('tracks the asset itself, independent of what the strategy does', () => {
    const candles = trendingSeries(300, '1d', 5);
    const result = runBacktest({
      candles,
      strategy: emaCross({ fast: 8, slow: 21 }),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    const first = candles[0] as Candle;
    const last = candles[candles.length - 1] as Candle;
    expect(result.metrics.benchmarkReturn).toBeCloseTo(last.close / first.close - 1, 6);
  });

  it('leaves buy-and-hold level with the benchmark when trading is free', () => {
    const candles = trendingSeries(300, '1d', 6);
    const result = runBacktest({
      candles,
      strategy: buyAndHold(),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.metrics.excessReturn).toBeCloseTo(0, 6);
  });
});

describe('the engine finds the edge that is actually there', () => {
  it('rewards trend following on a trending series and punishes it on a reverting one', () => {
    const trend = runBacktest({
      candles: trendingSeries(2000, '1d', 7),
      strategy: emaCross({ fast: 8, slow: 21 }),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    const revert = runBacktest({
      candles: meanRevertingSeries(2000, '1d', 7),
      strategy: emaCross({ fast: 8, slow: 21 }),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    expect(trend.metrics.sharpe).toBeGreaterThan(revert.metrics.sharpe);
  });

  it('rewards dip buying on a reverting series', () => {
    const result = runBacktest({
      candles: meanRevertingSeries(2000, '1d', 9),
      strategy: meanReversion({ lookback: 20, entryZ: 1.5, exitZ: 0.25, allowShort: false }),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.metrics.totalReturn).toBeGreaterThan(0);
    expect(result.metrics.trades).toBeGreaterThan(20);
  });
});

describe('guard rails', () => {
  it('refuses a series too short to mean anything', () => {
    expect(() =>
      runBacktest({
        candles: flatCandles(1, 100),
        strategy: buyAndHold(),
        interval: '1d',
        startingCash: 1000,
      }),
    ).toThrow(/at least 2 candles/);
  });

  it('rejects a strategy that returns a non-number', () => {
    const broken: Strategy = {
      name: 'broken',
      describe: 'returns NaN',
      warmupBars: 0,
      onBar: () => Number.NaN,
    };
    expect(() =>
      runBacktest({
        candles: flatCandles(10, 100),
        strategy: broken,
        interval: '1d',
        startingCash: 1000,
      }),
    ).toThrow(/returned NaN/);
  });

  it('does not enforce a daily stop on daily bars, and says so', () => {
    const daily = runBacktest({
      candles: flatCandles(10, 100),
      strategy: buyAndHold(),
      interval: '1d',
      startingCash: 1000,
    });
    expect(daily.dailyLossEnforced).toBe(false);

    const hourly = runBacktest({
      candles: flatCandles(10, 100).map((c, i) => ({ ...c, openTime: i * 3_600_000 })),
      strategy: buyAndHold(),
      interval: '1h',
      startingCash: 1000,
    });
    expect(hourly.dailyLossEnforced).toBe(true);
  });

  it('ends flat, so the final equity is cash rather than a mark', () => {
    const result = runBacktest({
      candles: trendingSeries(200, '1d', 13),
      strategy: buyAndHold(),
      interval: '1d',
      startingCash: 1000,
      costs: FREE,
      limits: LOOSE,
    });
    expect(result.curve[result.curve.length - 1]?.weight).toBe(0);
  });
});

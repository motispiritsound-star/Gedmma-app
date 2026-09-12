import { describe, expect, it } from 'vitest';
import { bpsCommission } from '../src/costs/commission.js';
import { equityLikeSeries, randomWalk } from '../src/data/synthetic.js';
import { detectUnadjustedActions, auditSeries } from '../src/data/store.js';
import { runBacktest } from '../src/engine/backtest.js';
import { unleveredGrowth } from '../src/engine/feasibility.js';
import { DEFAULT_LIMITS, RiskManager } from '../src/risk/risk.js';
import { taConfluence } from '../src/strategy/taConfluence.js';
import { trendFilter } from '../src/strategy/trendFilter.js';
import { buildStrategy, strategyNames } from '../src/strategy/registry.js';
import type { Strategy } from '../src/strategy/types.js';
import type { Candle, CostModel } from '../src/types.js';

const FREE: CostModel = { commission: bpsCommission(0), slippageBps: 0, borrowBpsPerDay: 0 };
const BASE = {
  maxWeight: 1,
  maxDailyLossPct: 1,
  maxDrawdownPct: 1,
  rebalanceThreshold: 0.01,
  minOrderQuote: 0,
};
const DAY = 86_400_000;

describe('long-only enforcement', () => {
  it('is the default, because most accounts cannot short at all', () => {
    expect(DEFAULT_LIMITS.longOnly).toBeUndefined();
    const risk = new RiskManager(1000, BASE);
    risk.mark(0, 1000);
    // Undefined means long-only: a spot balance and an ordinary share account
    // cannot short, so that is the safe reading of an unset flag.
    expect(risk.evaluate(-1, 0, 1000, 100).action).toBe('refuse');
  });

  it('refuses a short rather than silently reading it as flat', () => {
    const risk = new RiskManager(1000, BASE);
    risk.mark(0, 1000);
    const verdict = risk.evaluate(-0.5, 0, 1000, 100);
    expect(verdict.action).toBe('refuse');
    if (verdict.action === 'refuse') {
      expect(verdict.weight).toBe(0);
      expect(verdict.reason).toMatch(/long-only/);
    }
  });

  it('still lets an existing long be closed when a short is asked for', () => {
    const risk = new RiskManager(1000, BASE);
    risk.mark(0, 1000);
    // Flipping from long to short becomes "close the long", not "do nothing" —
    // otherwise the position would be stranded by its own signal.
    const verdict = risk.evaluate(-1, 0.8, 1000, 100);
    expect(verdict.action).toBe('allow');
    if (verdict.action === 'allow') expect(verdict.weight).toBe(0);
  });

  it('permits shorts when the account is explicitly marked as able to', () => {
    const risk = new RiskManager(1000, { ...BASE, longOnly: false });
    risk.mark(0, 1000);
    const verdict = risk.evaluate(-1, 0, 1000, 100);
    expect(verdict.action).toBe('allow');
    if (verdict.action === 'allow') expect(verdict.weight).toBe(-1);
  });

  it('never holds a negative weight through a whole backtest', () => {
    const wantsShort: Strategy = {
      name: 'always-short',
      describe: 'asks to be short at every bar',
      warmupBars: 0,
      onBar: () => -1,
    };
    const result = runBacktest({
      candles: randomWalk(300, '1d', 3),
      strategy: wantsShort,
      interval: '1d',
      startingCash: 10_000,
      costs: FREE,
      limits: BASE,
    });
    for (const point of result.curve) expect(point.weight).toBeGreaterThanOrEqual(0);
    expect(result.fills).toHaveLength(0);
    // And it says why, rather than reporting a flat strategy with no explanation.
    expect(Object.keys(result.blocked).join(' ')).toMatch(/long-only/);
  });
});

describe('trendFilter', () => {
  it('refuses settings that cannot work', () => {
    expect(() => trendFilter({ maPeriod: 1, momentumBars: 10, exitBuffer: 0 })).toThrow(/maPeriod/);
    expect(() => trendFilter({ maPeriod: 200, momentumBars: 0, exitBuffer: 0 })).toThrow(
      /momentumBars/,
    );
    expect(() => trendFilter({ maPeriod: 200, momentumBars: 10, exitBuffer: 1 })).toThrow(
      /exitBuffer/,
    );
  });

  it('is never short, whatever the chart does', () => {
    const strategy = trendFilter({ maPeriod: 20, momentumBars: 10, exitBuffer: 0.02 });
    const falling = Array.from({ length: 60 }, (_, i) => 100 - i);
    const candles: Candle[] = falling.map((close, i) => ({
      openTime: i * DAY,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1,
    }));
    for (let i = 21; i < candles.length; i += 1) {
      const view = candles.slice(0, i);
      const weight = strategy.onBar({
        candles: view,
        closes: view.map((c) => c.close),
        currentWeight: 0,
      });
      expect(weight).toBe(0);
    }
  });

  it('holds a rising chart and lets go below the band', () => {
    const strategy = trendFilter({ maPeriod: 10, momentumBars: 5, exitBuffer: 0.05 });
    const rising = Array.from({ length: 40 }, (_, i) => 100 + i * 2);
    const candles: Candle[] = rising.map((close, i) => ({
      openTime: i * DAY,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1,
    }));
    const closes = candles.map((c) => c.close);
    expect(strategy.onBar({ candles, closes, currentWeight: 0 })).toBe(1);

    // A collapse far below the average closes it.
    const crashed = [...closes.slice(0, -1), 50];
    expect(
      strategy.onBar({
        candles,
        closes: crashed,
        currentWeight: 1,
      }),
    ).toBe(0);
  });

  it('trades rarely enough that a broker schedule stops mattering', () => {
    const result = runBacktest({
      candles: equityLikeSeries(4000, '1d', 11),
      strategy: trendFilter({ maPeriod: 200, momentumBars: 126, exitBuffer: 0.02 }),
      interval: '1d',
      startingCash: 10_000,
      costs: { commission: bpsCommission(10), slippageBps: 5, borrowBpsPerDay: 0 },
      limits: BASE,
    });
    // The whole fee problem that makes an hourly crypto strategy unviable simply
    // does not arise at this turnover, which is the quiet advantage of this shape.
    expect(result.metrics.annualFeeDrag).toBeLessThan(0.01);
    expect(result.metrics.trades).toBeLessThan(60);
  });

  it('cuts the drawdown, which is what it is actually for', () => {
    const candles = equityLikeSeries(4000, '1d', 11);
    const filtered = runBacktest({
      candles,
      strategy: trendFilter({ maPeriod: 200, momentumBars: 126, exitBuffer: 0.02 }),
      interval: '1d',
      startingCash: 10_000,
      costs: FREE,
      limits: BASE,
    });
    expect(filtered.metrics.maxDrawdown).toBeLessThan(filtered.metrics.benchmarkMaxDrawdown);
    expect(filtered.metrics.timeInMarket).toBeLessThan(1);
  });
});

describe('taConfluence', () => {
  it('refuses an exit average that is not shorter than the trend average', () => {
    expect(() =>
      taConfluence({ trendMa: 50, momentumBars: 20, rsiPeriod: 14, maxEntryRsi: 60, exitMa: 50 }),
    ).toThrow(/shorter than trendMa/);
  });

  it('refuses an RSI threshold outside its own range', () => {
    expect(() =>
      taConfluence({ trendMa: 200, momentumBars: 20, rsiPeriod: 14, maxEntryRsi: 0, exitMa: 50 }),
    ).toThrow(/maxEntryRsi/);
    expect(() =>
      taConfluence({ trendMa: 200, momentumBars: 20, rsiPeriod: 14, maxEntryRsi: 100, exitMa: 50 }),
    ).toThrow(/maxEntryRsi/);
  });

  it('waits for a pullback rather than buying into strength', () => {
    const strategy = taConfluence({
      trendMa: 20,
      momentumBars: 10,
      rsiPeriod: 5,
      maxEntryRsi: 50,
      exitMa: 10,
    });
    // A chart rising every single bar has an RSI of 100: in an uptrend, rising, and
    // refused anyway, because the entry rule is a pullback.
    const closes = Array.from({ length: 40 }, (_, i) => 100 + i * 2);
    const candles: Candle[] = closes.map((close, i) => ({
      openTime: i * DAY,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1,
    }));
    expect(strategy.onBar({ candles, closes, currentWeight: 0 })).toBe(0);
  });

  it('costs more in parameters than it earns on this fixture', () => {
    const candles = equityLikeSeries(4000, '1d', 11);
    const simple = runBacktest({
      candles,
      strategy: trendFilter({ maPeriod: 200, momentumBars: 126, exitBuffer: 0.02 }),
      interval: '1d',
      startingCash: 10_000,
      costs: FREE,
      limits: BASE,
    });
    const complex = runBacktest({
      candles,
      strategy: taConfluence({
        trendMa: 200,
        momentumBars: 126,
        rsiPeriod: 14,
        maxEntryRsi: 60,
        exitMa: 50,
      }),
      interval: '1d',
      startingCash: 10_000,
      costs: FREE,
      limits: BASE,
    });
    // Five parameters and ten times the trades, for a worse result. Not a law of
    // nature, but the direction is the usual one and worth pinning.
    expect(complex.metrics.trades).toBeGreaterThan(simple.metrics.trades * 3);
    expect(complex.metrics.sharpe).toBeLessThan(simple.metrics.sharpe);
  });
});

describe('the registry knows the new strategies', () => {
  it('lists and builds them', () => {
    expect(strategyNames()).toContain('trend-filter');
    expect(strategyNames()).toContain('ta-confluence');
    for (const name of strategyNames()) {
      expect(() => buildStrategy(name)).not.toThrow();
    }
  });
});

describe('detectUnadjustedActions', () => {
  function series(closes: readonly number[]): Candle[] {
    return closes.map((close, i) => ({
      openTime: i * DAY,
      open: close,
      high: close,
      low: close,
      close,
      volume: 1,
    }));
  }

  it('spots an unadjusted 2-for-1 split', () => {
    // 100 -> 50 overnight: identical to a 50% crash in the data, and almost
    // certainly a split that nobody adjusted for.
    const found = detectUnadjustedActions(series([98, 99, 100, 50, 51, 52]));
    expect(found).toHaveLength(1);
    expect(found[0]?.looksLike).toBe('2-for-1');
    expect(found[0]?.ratio).toBeCloseTo(2, 6);
  });

  it('spots a reverse split too', () => {
    const found = detectUnadjustedActions(series([10, 10, 10, 100, 101]));
    expect(found[0]?.looksLike).toBe('1-for-10 reverse');
  });

  it('ignores an ordinary large move that is not a round ratio', () => {
    // Down 37%: a real crash, and not close to any split ratio.
    expect(detectUnadjustedActions(series([100, 100, 63, 64]))).toHaveLength(0);
  });

  it('ignores small moves even when they are near a ratio', () => {
    expect(detectUnadjustedActions(series([100, 100, 99, 98]))).toHaveLength(0);
  });

  it('finds nothing in a crypto series, which has no splits', () => {
    expect(auditSeries(randomWalk(2000, '1d', 4), '1d').suspectedActions).toHaveLength(0);
  });

  it('is reported by the audit', () => {
    const audit = auditSeries(series([100, 100, 100, 25, 25]), '1d');
    expect(audit.suspectedActions).toHaveLength(1);
    expect(audit.suspectedActions[0]?.looksLike).toBe('4-for-1');
  });
});

describe('unleveredGrowth', () => {
  it('is S·σ − ½σ², which is far below the levered ceiling', () => {
    expect(unleveredGrowth(1, 0.2)).toBeCloseTo(0.18, 10);
    // The levered ceiling at the same Sharpe is S²/2 = 0.5. Removing leverage does
    // not merely reduce risk; it lowers what the plan can return.
    expect(unleveredGrowth(1, 0.2)).toBeLessThan(0.5);
  });

  it('peaks in volatility at σ = S and falls after it', () => {
    const sharpe = 1;
    expect(unleveredGrowth(sharpe, 1)).toBeCloseTo(0.5, 10);
    expect(unleveredGrowth(sharpe, 1.5)).toBeLessThan(unleveredGrowth(sharpe, 1));
  });

  it('is negative when the volatility drag exceeds the edge', () => {
    expect(unleveredGrowth(0.2, 1)).toBeLessThan(0);
  });
});

describe('equityLikeSeries', () => {
  it('is reproducible and well formed', () => {
    const a = equityLikeSeries(500, '1d', 3);
    const b = equityLikeSeries(500, '1d', 3);
    expect(a.map((c) => c.close)).toEqual(b.map((c) => c.close));
    for (const candle of a) {
      expect(candle.high).toBeGreaterThanOrEqual(Math.max(candle.open, candle.close));
      expect(candle.low).toBeLessThanOrEqual(Math.min(candle.open, candle.close));
      expect(candle.volume).toBeGreaterThan(0);
    }
  });

  it('has deeper drawdowns than its volatility alone implies, because regimes persist', () => {
    const candles = equityLikeSeries(4000, '1d', 11);
    const closes = candles.map((c) => c.close);
    let peak = closes[0] as number;
    let worst = 0;
    for (const close of closes) {
      if (close > peak) peak = close;
      worst = Math.max(worst, 1 - close / peak);
    }
    // A persistent bear regime produces a drawdown a single-regime walk at the same
    // average volatility would rarely reach. That persistence is the only thing a
    // trend filter can be exploiting.
    expect(worst).toBeGreaterThan(0.2);
  });
});

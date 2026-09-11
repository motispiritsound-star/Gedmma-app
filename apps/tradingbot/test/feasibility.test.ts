import { describe, expect, it } from 'vitest';
import { randomWalk } from '../src/data/synthetic.js';
import type { Candle } from '../src/types.js';
import {
  assessGoal,
  liquidationExposure,
  minimumSharpeFor,
  probabilityOfFalling,
  probabilityOfFallingWithin,
  requiredRatePerPeriod,
  targetMultiple,
  withContributions,
  yearsToMultiple,
  type Goal,
} from '../src/engine/feasibility.js';

/** The goal this module was written to answer. */
const HUNDRED_X: Goal = { startingCapital: 10_000, targetCapital: 1_000_000, horizonYears: 1 };

describe('targetMultiple', () => {
  it('is the ratio asked for', () => {
    expect(targetMultiple(HUNDRED_X)).toBe(100);
  });

  it('refuses a goal that is not a goal', () => {
    expect(() => targetMultiple({ ...HUNDRED_X, startingCapital: 0 })).toThrow(/Starting capital/);
    expect(() => targetMultiple({ ...HUNDRED_X, targetCapital: -1 })).toThrow(/Target capital/);
    expect(() => targetMultiple({ ...HUNDRED_X, horizonYears: 0 })).toThrow(/horizon/);
  });
});

describe('requiredRatePerPeriod', () => {
  it('turns 100x in a year into the daily rate it really is', () => {
    // 100^(1/252) − 1. Every trading day, net of costs, for a year.
    expect(requiredRatePerPeriod(HUNDRED_X, 252)).toBeCloseTo(0.01844, 5);
  });

  it('and into the monthly rate', () => {
    expect(requiredRatePerPeriod(HUNDRED_X, 12)).toBeCloseTo(0.4678, 4);
  });

  it('is zero for a goal already met', () => {
    expect(requiredRatePerPeriod({ ...HUNDRED_X, targetCapital: 10_000 }, 12)).toBeCloseTo(0, 10);
  });

  it('scales the way compounding does, not the way intuition does', () => {
    const tenX: Goal = { startingCapital: 10_000, targetCapital: 100_000, horizonYears: 1 };
    const hundredX = requiredRatePerPeriod(HUNDRED_X, 12);
    const ten = requiredRatePerPeriod(tenX, 12);
    // Ten times the target is nowhere near ten times the monthly rate — but it is
    // also not a small step up, which is the part people get wrong in both
    // directions.
    expect(hundredX / ten).toBeGreaterThan(1.5);
    expect(hundredX / ten).toBeLessThan(3);
  });
});

describe('minimumSharpeFor', () => {
  it('derives 3.03 for 100x in a year, from S = sqrt(2 ln m / T)', () => {
    // The ceiling on log growth at any leverage is S²/2, so reaching ln(100) in one
    // year needs S² / 2 >= 4.605.
    expect(minimumSharpeFor(HUNDRED_X)).toBeCloseTo(3.035, 3);
  });

  it('falls with the square root of the horizon', () => {
    const overFive = minimumSharpeFor({ ...HUNDRED_X, horizonYears: 5 });
    expect(overFive).toBeCloseTo(minimumSharpeFor(HUNDRED_X) / Math.sqrt(5), 6);
  });

  it('is zero when the goal asks for nothing', () => {
    expect(minimumSharpeFor({ ...HUNDRED_X, targetCapital: 5_000 })).toBe(0);
  });

  it('asks far more of a short horizon than a long one', () => {
    // Doubling money in a month needs a higher Sharpe than 100x in a decade.
    const month = minimumSharpeFor({
      startingCapital: 10_000,
      targetCapital: 20_000,
      horizonYears: 1 / 12,
    });
    const decade = minimumSharpeFor({ ...HUNDRED_X, horizonYears: 10 });
    expect(month).toBeGreaterThan(decade);
  });
});

describe('assessGoal', () => {
  it('puts the median outcome exactly on target at the minimum Sharpe', () => {
    const odds = assessGoal(HUNDRED_X, {
      sharpe: minimumSharpeFor(HUNDRED_X),
      volatility: 0.3,
      kellyFraction: 1,
    });
    expect(odds.medianMultiple).toBeCloseTo(100, 0);
    // Median on target means a coin flip, not a plan.
    expect(odds.probabilityOfTarget).toBeCloseTo(0.5, 2);
  });

  it('caps log growth at S²/2, which is the whole constraint', () => {
    const sharpe = 2;
    const full = assessGoal(HUNDRED_X, { sharpe, volatility: 0.3, kellyFraction: 1 });
    expect(full.logGrowth).toBeCloseTo((sharpe * sharpe) / 2, 6);

    // Past growth-optimal, more leverage compounds *slower*. This is the property
    // that makes "just use more leverage" not a strategy.
    const over = assessGoal(HUNDRED_X, { sharpe, volatility: 0.3, kellyFraction: 1.5 });
    const way = assessGoal(HUNDRED_X, { sharpe, volatility: 0.3, kellyFraction: 2 });
    expect(over.logGrowth).toBeLessThan(full.logGrowth);
    expect(way.logGrowth).toBeCloseTo(0, 6);
    expect(way.leverage).toBeGreaterThan(full.leverage);
  });

  it('collapses the odds as the Sharpe ratio falls, and fast', () => {
    const at = (sharpe: number): number =>
      assessGoal(HUNDRED_X, { sharpe, volatility: 0.3, kellyFraction: 1 }).probabilityOfTarget;
    expect(at(3)).toBeGreaterThan(0.4);
    expect(at(2)).toBeLessThan(0.15);
    expect(at(1)).toBeLessThan(0.001);
    // A Sharpe of 0.5 is a respectable real strategy. The target is out of reach by
    // many orders of magnitude, not by a little.
    expect(at(0.5)).toBeLessThan(1e-12);
  });

  it('prices growth-optimal leverage honestly: half the time you are down half', () => {
    const odds = assessGoal(HUNDRED_X, { sharpe: 3, volatility: 0.3, kellyFraction: 1 });
    // At full Kelly, 2mu/sigma^2 = 1 exactly, so P(ever down to a fraction f) = f.
    expect(odds.eventualHalving).toBeCloseTo(0.5, 6);
    expect(odds.eventualNinetyPercentLoss).toBeCloseTo(0.1, 6);
    // Within the horizon it is a little less, because there is less time for it.
    expect(odds.probabilityOfHalving).toBeLessThan(odds.eventualHalving);
    expect(odds.probabilityOfHalving).toBeGreaterThan(0.4);
  });

  it('shows what a fraction of Kelly buys', () => {
    const full = assessGoal(HUNDRED_X, { sharpe: 1.5, volatility: 0.3, kellyFraction: 1 });
    const half = assessGoal(HUNDRED_X, { sharpe: 1.5, volatility: 0.3, kellyFraction: 0.5 });
    // Half Kelly gives up a quarter of the growth rate...
    expect(half.logGrowth).toBeCloseTo(full.logGrowth * 0.75, 6);
    // ...and a great deal of the pain.
    expect(half.eventualHalving).toBeLessThan(full.eventualHalving / 3);
  });

  it('reports the single move that ends a levered account', () => {
    const levered = assessGoal(HUNDRED_X, { sharpe: 3, volatility: 0.3, kellyFraction: 1 });
    expect(levered.leverage).toBeCloseTo(10, 6);
    // At ten times leverage, a 10% adverse move is the end. Bitcoin does that.
    expect(levered.liquidationMove).toBeCloseTo(0.1, 6);
  });

  it('cannot be liquidated when unlevered', () => {
    const odds = assessGoal(HUNDRED_X, { sharpe: 0.3, volatility: 0.3, kellyFraction: 1 });
    expect(odds.leverage).toBeCloseTo(1, 6);
    expect(odds.liquidationMove).toBe(Infinity);
  });

  it('rejects impossible assumptions', () => {
    expect(() => assessGoal(HUNDRED_X, { sharpe: 1, volatility: 0, kellyFraction: 1 })).toThrow(
      /Volatility/,
    );
    expect(() => assessGoal(HUNDRED_X, { sharpe: 1, volatility: 0.3, kellyFraction: -1 })).toThrow(
      /Kelly/,
    );
  });
});

describe('probabilityOfFalling', () => {
  it('is certain without a positive drift', () => {
    // Given long enough, a driftless walk visits every level below it.
    expect(probabilityOfFalling(0, 0.3, 0.5)).toBe(1);
    expect(probabilityOfFalling(-0.1, 0.3, 0.5)).toBe(1);
  });

  it('falls as the drift-to-variance ratio rises', () => {
    expect(probabilityOfFalling(0.5, 0.3, 0.5)).toBeLessThan(probabilityOfFalling(0.1, 0.3, 0.5));
  });

  it('is bounded', () => {
    expect(probabilityOfFalling(1, 0.3, 1)).toBe(0);
    expect(probabilityOfFalling(1, 0.3, 0)).toBe(1);
  });
});

describe('probabilityOfFallingWithin', () => {
  it('is zero over no time at all', () => {
    expect(probabilityOfFallingWithin(1, 1, 0.5, 0)).toBe(0);
  });

  it('rises with the horizon, toward the all-time figure', () => {
    const growth = 2;
    const vol = 2;
    const year = probabilityOfFallingWithin(growth, vol, 0.5, 1);
    const decade = probabilityOfFallingWithin(growth, vol, 0.5, 10);
    const ever = probabilityOfFalling(growth, vol, 0.5);
    expect(year).toBeLessThan(decade);
    expect(decade).toBeLessThanOrEqual(ever + 1e-9);
    expect(decade).toBeGreaterThan(ever * 0.95);
  });

  it('matches the closed form at full Kelly to within simulation error', () => {
    // Checked against a fine-grained Monte Carlo during development: 40,000 paths
    // monitored 64,512 times a year gave 48.0% against this formula's 49.1%, with
    // the gap closing as monitoring gets finer. Discrete monitoring always
    // understates a barrier crossing, which is why the continuous figure is the one
    // to plan against.
    const odds = assessGoal(HUNDRED_X, { sharpe: 3.0349, volatility: 0.3, kellyFraction: 1 });
    expect(odds.probabilityOfHalving).toBeCloseTo(0.491, 2);
  });
});

describe('yearsToMultiple', () => {
  it('takes fourteen years to turn 10k into a million at the best record there is', () => {
    // Renaissance Medallion, about 39% a year net over three decades.
    expect(yearsToMultiple(100, 0.39)).toBeCloseTo(14.0, 1);
  });

  it('takes twenty-five at a very good 20%', () => {
    expect(yearsToMultiple(100, 0.2)).toBeCloseTo(25.3, 1);
  });

  it('never gets there without a positive return', () => {
    expect(yearsToMultiple(100, 0)).toBe(Infinity);
    expect(yearsToMultiple(100, -0.1)).toBe(Infinity);
  });
});

describe('withContributions', () => {
  it('grows a starting sum with monthly additions', () => {
    const balance = withContributions({
      startingCapital: 10_000,
      monthlyContribution: 500,
      annualReturn: 0.07,
      years: 10,
    });
    expect(balance).toBeGreaterThan(10_000 * 1.07 ** 10);
    expect(balance).toBeGreaterThan(80_000);
  });

  it('shows that contributions dominate returns over a decade', () => {
    const noAdditions = withContributions({
      startingCapital: 10_000,
      monthlyContribution: 0,
      annualReturn: 0.15,
      years: 10,
    });
    const additions = withContributions({
      startingCapital: 10_000,
      monthlyContribution: 300,
      annualReturn: 0.07,
      years: 10,
    });
    // Half the return and 300 a month beats double the return and nothing added.
    expect(additions).toBeGreaterThan(noAdditions);
  });

  it('is just the starting sum over no time', () => {
    expect(
      withContributions({ startingCapital: 10_000, monthlyContribution: 500, annualReturn: 0.07, years: 0 }),
    ).toBe(10_000);
  });
});

describe('liquidationExposure', () => {
  const DAY = 86_400_000;

  /** Bars that each fall `adverse` from their open before recovering. */
  function bars(count: number, adverse: number, open = 100): Candle[] {
    return Array.from({ length: count }, (_, i) => ({
      openTime: i * DAY,
      open,
      high: open * 1.01,
      low: open * (1 - adverse),
      close: open,
      volume: 1,
    }));
  }

  it('is not a risk at all without leverage', () => {
    const result = liquidationExposure({
      candles: bars(100, 0.5),
      interval: '1d',
      leverage: 1,
    });
    expect(result.liquidationMove).toBe(Infinity);
    expect(result.annualProbability).toBe(0);
  });

  it('counts the bars whose low reaches the liquidation level', () => {
    // At 10x leverage, a 10% adverse move is the end.
    const calm = liquidationExposure({ candles: bars(100, 0.05), interval: '1d', leverage: 10 });
    expect(calm.barsThatWouldHaveLiquidated).toBe(0);

    const violent = liquidationExposure({ candles: bars(100, 0.12), interval: '1d', leverage: 10 });
    expect(violent.barsThatWouldHaveLiquidated).toBe(100);
    expect(violent.worstAdverseMove).toBeCloseTo(0.12, 8);
  });

  it('measures from the open to the low, not close to close', () => {
    // A bar that falls 15% intrabar and closes flat. Close-to-close sees nothing;
    // the exchange liquidates on the low.
    const candles: Candle[] = [
      { openTime: 0, open: 100, high: 100, low: 85, close: 100, volume: 1 },
    ];
    const result = liquidationExposure({ candles, interval: '1d', leverage: 10 });
    expect(result.barsThatWouldHaveLiquidated).toBe(1);
  });

  it('looks at the high instead for a short', () => {
    const candles: Candle[] = [
      { openTime: 0, open: 100, high: 115, low: 100, close: 100, volume: 1 },
    ];
    expect(
      liquidationExposure({ candles, interval: '1d', leverage: 10, side: 'long' })
        .barsThatWouldHaveLiquidated,
    ).toBe(0);
    expect(
      liquidationExposure({ candles, interval: '1d', leverage: 10, side: 'short' })
        .barsThatWouldHaveLiquidated,
    ).toBe(1);
  });

  it('turns a rare bar into the annual probability that actually matters', () => {
    // One bar in 200 on a daily series is a bit under twice a year.
    const candles = [...bars(199, 0.01), ...bars(1, 0.2)];
    const result = liquidationExposure({ candles, interval: '1d', leverage: 10 });
    expect(result.perBarProbability).toBeCloseTo(1 / 200, 6);
    // Rare per bar, near-certain per year. This is the conversion people skip.
    expect(result.annualProbability).toBeGreaterThan(0.8);
  });

  it('scales with leverage, because the threshold does', () => {
    const candles = bars(1000, 0.08);
    expect(
      liquidationExposure({ candles, interval: '1d', leverage: 5 }).barsThatWouldHaveLiquidated,
    ).toBe(0);
    expect(
      liquidationExposure({ candles, interval: '1d', leverage: 20 }).barsThatWouldHaveLiquidated,
    ).toBe(1000);
  });

  it('survives an empty series without dividing by zero', () => {
    const result = liquidationExposure({ candles: [], interval: '1d', leverage: 10 });
    expect(result.perBarProbability).toBe(0);
    expect(result.annualProbability).toBe(0);
  });

  it('finds the real exposure of the leverage 100x in a year requires', () => {
    // A random walk at 60% annualised volatility — less volatile than Bitcoin has
    // been — against the 10.1x leverage a coin-flip at 100x demands.
    const odds = assessGoal(HUNDRED_X, {
      sharpe: minimumSharpeFor(HUNDRED_X),
      volatility: 0.3,
      kellyFraction: 1,
    });
    const result = liquidationExposure({
      candles: randomWalk(2000, '1d', 42),
      interval: '1d',
      leverage: odds.leverage,
    });
    expect(result.barsThatWouldHaveLiquidated).toBeGreaterThan(0);
    // The closing argument, and it is measured rather than asserted: at the leverage
    // the target needs, liquidation within the year is the likely outcome.
    expect(result.annualProbability).toBeGreaterThan(0.5);
  });
});

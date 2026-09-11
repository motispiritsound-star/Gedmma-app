import { describe, expect, it } from 'vitest';
import {
  deflatedSharpe,
  normalSurvival,
  expectedMaxSharpe,
  kurtosis,
  normalCdf,
  normalInv,
  skewness,
} from '../src/engine/stats.js';

describe('normalCdf', () => {
  it('matches the textbook values', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.959964)).toBeCloseTo(0.975, 5);
    expect(normalCdf(-1.644854)).toBeCloseTo(0.05, 5);
  });
});

/** Where `normalSurvival` changes method. Kept here so the test can probe the join. */
const MILLS_JOIN = 2;

describe('normalSurvival', () => {
  it('agrees with the CDF below the switch-over, where the CDF is fine', () => {
    for (const z of [0, 1, 1.5, 1.9]) {
      expect(normalSurvival(z)).toBeCloseTo(1 - normalCdf(z), 9);
    }
  });

  it('matches reference values across the range significance tests live in', () => {
    const reference: [number, number][] = [
      [2, 2.2750132e-2],
      [2.5, 6.2096653e-3],
      [3, 1.3498980e-3],
      [3.5, 2.3262908e-4],
      [4, 3.1671242e-5],
      [5, 2.8665157e-7],
    ];
    for (const [z, want] of reference) {
      expect(normalSurvival(z) / want).toBeCloseTo(1, 4);
    }
  });

  it('stays accurate far out in the tail, where 1 − Φ(z) is exactly zero', () => {
    expect(normalSurvival(6) / 9.865876e-10).toBeCloseTo(1, 4);
    expect(normalSurvival(8) / 6.220961e-16).toBeCloseTo(1, 3);
    expect(normalSurvival(10) / 7.619853e-24).toBeCloseTo(1, 3);

    // This is the failure it exists to fix. The naive subtraction gives exactly
    // zero, which reads as "impossible, by rounding" rather than as the answer —
    // and when the answer is the whole point, that difference matters.
    expect(1 - normalCdf(10)).toBe(0);
    expect(normalSurvival(10)).toBeGreaterThan(0);
  });

  it('decreases monotonically across the switch-over point', () => {
    let previous = normalSurvival(1.5);
    for (const z of [1.9, 1.999, 2, 2.001, 2.5, 3, 5, 8, 12]) {
      const current = normalSurvival(z);
      expect(current).toBeLessThan(previous);
      previous = current;
    }
  });

  it('joins the two branches without a visible step', () => {
    // Both methods evaluated at the same point, so this measures the join itself
    // rather than the function's genuine decay over an interval.
    const polynomial = 1 - normalCdf(MILLS_JOIN);
    const fraction = normalSurvival(MILLS_JOIN);
    expect(fraction / polynomial).toBeCloseTo(1, 3);
  });
});

describe('normalInv', () => {
  it('matches the textbook quantiles', () => {
    expect(normalInv(0.975)).toBeCloseTo(1.959964, 5);
    expect(normalInv(0.95)).toBeCloseTo(1.644854, 5);
    expect(normalInv(0.5)).toBeCloseTo(0, 8);
    expect(normalInv(0.001)).toBeCloseTo(-3.090232, 5);
  });

  it('round-trips through the CDF across the whole range', () => {
    for (const p of [0.0001, 0.01, 0.2, 0.5, 0.8, 0.99, 0.9999]) {
      expect(normalCdf(normalInv(p))).toBeCloseTo(p, 5);
    }
  });

  it('returns infinities at the boundaries rather than NaN', () => {
    expect(normalInv(0)).toBe(-Infinity);
    expect(normalInv(1)).toBe(Infinity);
  });
});

describe('skewness and kurtosis', () => {
  it('is zero and three for a symmetric series', () => {
    const symmetric = [-2, -1, -1, 0, 0, 0, 1, 1, 2];
    expect(skewness(symmetric)).toBeCloseTo(0, 8);
    expect(kurtosis(symmetric)).toBeGreaterThan(1.5);
  });

  it('is negative when the tail is on the left', () => {
    expect(skewness([1, 1, 1, 1, 1, 1, 1, 1, 1, -20])).toBeLessThan(0);
  });

  it('rises above three when the tails are fat', () => {
    const fat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -10, 10];
    expect(kurtosis(fat)).toBeGreaterThan(3);
  });

  it('defaults safely on series too short to measure', () => {
    expect(skewness([1])).toBe(0);
    expect(kurtosis([1, 2])).toBe(3);
  });
});

describe('expectedMaxSharpe', () => {
  it('is zero when only one configuration was tried', () => {
    expect(expectedMaxSharpe(1, 0.05)).toBe(0);
  });

  it('grows with the number of configurations searched', () => {
    const few = expectedMaxSharpe(5, 0.05);
    const many = expectedMaxSharpe(500, 0.05);
    expect(many).toBeGreaterThan(few);
    expect(few).toBeGreaterThan(0);
  });

  it('grows with how much the configurations differ', () => {
    expect(expectedMaxSharpe(20, 0.1)).toBeGreaterThan(expectedMaxSharpe(20, 0.01));
  });

  it('is zero when every configuration scored the same', () => {
    expect(expectedMaxSharpe(20, 0)).toBe(0);
  });
});

describe('deflatedSharpe', () => {
  /** A return series with a given per-bar mean and standard deviation. */
  function series(length: number, perBarSharpe: number, seed = 1): number[] {
    let a = seed;
    const rnd = (): number => {
      a = (a * 1103515245 + 12345) % 2147483648;
      return a / 2147483648;
    };
    const out: number[] = [];
    for (let i = 0; i < length; i += 1) {
      // Two uniforms summed is close enough to normal for this purpose.
      out.push(0.01 * (rnd() + rnd() - 1) + perBarSharpe * 0.01);
    }
    return out;
  }

  it('calls a strong result on a long series significant', () => {
    const result = deflatedSharpe({
      returns: series(2000, 0.15),
      trialSharpesAnnual: [1.4, 1.2, 1.1, 0.9],
      barsPerYear: 365,
    });
    expect(result.probability).toBeGreaterThan(0.95);
    expect(result.verdict).toBe('significant');
  });

  it('becomes less confident as more configurations are searched', () => {
    const returns = series(400, 0.05);
    const few = deflatedSharpe({ returns, trialSharpesAnnual: [0.8, 0.7], barsPerYear: 365 });
    const many = deflatedSharpe({
      returns,
      // A wide search: many configurations, widely spread.
      trialSharpesAnnual: Array.from({ length: 200 }, (_, i) => 0.8 - i * 0.01),
      barsPerYear: 365,
    });
    expect(many.selectionHurdle).toBeGreaterThan(few.selectionHurdle);
    expect(many.probability).toBeLessThan(few.probability);
  });

  it('reports the number of configurations it was given', () => {
    const result = deflatedSharpe({
      returns: series(500, 0.05),
      trialSharpesAnnual: [0.5, 0.4, 0.3],
      barsPerYear: 365,
    });
    expect(result.trials).toBe(3);
  });

  it('takes the best trial as the observed Sharpe', () => {
    const result = deflatedSharpe({
      returns: series(500, 0.05),
      trialSharpesAnnual: [0.2, 1.9, 0.4],
      barsPerYear: 365,
    });
    expect(result.observedSharpe).toBeCloseTo(1.9 / Math.sqrt(365), 8);
  });

  it('refuses to answer on a series too short to measure', () => {
    const result = deflatedSharpe({
      returns: [0.01, 0.02],
      trialSharpesAnnual: [1],
      barsPerYear: 365,
    });
    expect(result.probability).toBe(0);
    expect(result.verdict).toBe('inconclusive');
  });
});

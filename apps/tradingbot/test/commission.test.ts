import { describe, expect, it } from 'vitest';
import {
  bpsCommission,
  commissionFor,
  describeCommission,
  ibkrFixedShares,
  ibkrTieredShares,
  maxFractionOfNotional,
  roundTripDrag,
} from '../src/costs/commission.js';

describe('basis-point commission', () => {
  it('is a flat share of notional', () => {
    expect(commissionFor(bpsCommission(10), 2, 500)).toBeCloseTo(1, 10);
  });

  it('is zero on an empty order', () => {
    expect(commissionFor(bpsCommission(10), 0, 500)).toBe(0);
  });
});

describe('per-unit commission, the shape a broker actually uses', () => {
  const model = ibkrTieredShares();

  it('charges the floor, not the rate, on a small order', () => {
    // 10 shares at 0.0035 is 3.5 cents. The 0.35 floor is what you pay.
    expect(commissionFor(model, 10, 100)).toBeCloseTo(0.35, 10);
  });

  it('charges the rate once the order is big enough to clear the floor', () => {
    // 1000 shares at 0.0035 is 3.50, well above the floor.
    expect(commissionFor(model, 1000, 50)).toBeCloseTo(3.5, 10);
  });

  it('applies the percentage cap after the floor, not before', () => {
    // A 20 order: the floor is 0.35 but the 1% cap is 0.20, and the cap wins.
    // Reversing the two would charge 0.35 and overstate what tiny trades cost.
    expect(commissionFor(model, 1, 20)).toBeCloseTo(0.2, 10);
  });

  it('is the floor exactly where the cap stops binding', () => {
    // At a 35 notional the 1% cap equals the 0.35 floor.
    expect(commissionFor(model, 1, 35)).toBeCloseTo(0.35, 10);
  });

  it('costs more on the fixed schedule than the tiered one for a small order', () => {
    const tiered = commissionFor(ibkrTieredShares(), 100, 50);
    const fixed = commissionFor(ibkrFixedShares(), 100, 50);
    expect(fixed).toBeGreaterThan(tiered);
  });
});

describe('flat and per-contract commission', () => {
  it('charges a flat amount per order, never more than the order is worth', () => {
    expect(commissionFor({ kind: 'per-order', amount: 1 }, 5, 100)).toBe(1);
    expect(commissionFor({ kind: 'per-order', amount: 1 }, 1, 0.5)).toBeCloseTo(0.5, 10);
  });

  it('charges per contract with a floor', () => {
    const model = { kind: 'per-contract', perContract: 0.85, minimumPerOrder: 1 } as const;
    expect(commissionFor(model, 1, 5000)).toBe(1);
    expect(commissionFor(model, 10, 5000)).toBeCloseTo(8.5, 10);
  });
});

describe('maxFractionOfNotional', () => {
  it('is the rate for a basis-point model, whatever the size', () => {
    expect(maxFractionOfNotional(bpsCommission(10), 100)).toBeCloseTo(0.001, 10);
    expect(maxFractionOfNotional(bpsCommission(10), 1_000_000)).toBeCloseTo(0.001, 10);
  });

  it('shrinks with order size for a floor-based model', () => {
    const model = ibkrTieredShares();
    const small = maxFractionOfNotional(model, 100);
    const large = maxFractionOfNotional(model, 100_000);
    expect(small).toBeGreaterThan(large);
    // Never above the model's own cap.
    expect(small).toBeLessThanOrEqual(0.01);
  });

  it('is zero rather than infinite on an empty notional', () => {
    expect(maxFractionOfNotional(ibkrTieredShares(), 0)).toBe(0);
  });
});

describe('roundTripDrag', () => {
  it('counts both legs', () => {
    expect(roundTripDrag(bpsCommission(10), 1000, 100)).toBeCloseTo(0.002, 10);
  });

  it('shows why a floor ruins small orders', () => {
    const model = ibkrTieredShares();
    // A 40 order pays the 0.35 floor twice: 1.75% of the position gone.
    expect(roundTripDrag(model, 40, 20)).toBeCloseTo(0.0175, 6);
    // The same schedule on a 4000 position barely registers.
    expect(roundTripDrag(model, 4000, 20)).toBeLessThan(0.001);
  });

  it('is zero for a degenerate order', () => {
    expect(roundTripDrag(bpsCommission(10), 0, 100)).toBe(0);
    expect(roundTripDrag(bpsCommission(10), 100, 0)).toBe(0);
  });
});

describe('describeCommission', () => {
  it('says which shape it is, for the line above the numbers', () => {
    expect(describeCommission(bpsCommission(10))).toMatch(/bps/);
    expect(describeCommission(ibkrTieredShares())).toMatch(/min 0\.35/);
    expect(describeCommission({ kind: 'per-order', amount: 2 })).toMatch(/per order/);
  });
});

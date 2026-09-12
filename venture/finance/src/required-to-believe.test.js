import test from 'node:test';
import assert from 'node:assert/strict';
import { v, computeOrderEconomics } from './economics.js';
import { maxAffordableUnitCost, sourcingSpecification, priceLadder } from './required-to-believe.js';

const base = {
  pricePerUnitInclVat: v(79, 'ESTIMATE'),
  unitsPerOrder: v(1, 'ESTIMATE'),
  vatRate: v(0.21, 'FACT'),
  unitCost: v(0, 'ESTIMATE'),
  paymentPctFee: v(0.019, 'FACT'),
  paymentFixedFee: v(0.25, 'FACT'),
  outboundShipCost: v(5.5, 'ESTIMATE'),
};

test('the ceiling is the exact cost at which contribution equals the requirement', () => {
  const { maxUnitCost } = maxAffordableUnitCost(base, 25);
  const at = computeOrderEconomics({ ...base, unitCost: v(maxUnitCost, 'ESTIMATE') });
  assert.ok(Math.abs(at.contributionBeforeAds - 25) < 0.01, `got ${at.contributionBeforeAds}`);
});

test('a cost one euro above the ceiling breaks the requirement', () => {
  const { maxUnitCost } = maxAffordableUnitCost(base, 25);
  const over = computeOrderEconomics({ ...base, unitCost: v(maxUnitCost + 1, 'ESTIMATE') });
  assert.ok(over.contributionBeforeAds < 25);
});

test('an impossible requirement is reported as impossible rather than as a tiny ceiling', () => {
  // Net revenue on a EUR 79 order is ~65.29; 200 is unreachable with free goods.
  const r = maxAffordableUnitCost(base, 200);
  assert.equal(r.achievable, false);
  assert.equal(r.maxUnitCost, 0);
});

test('the sourcing specification states a usable negotiation limit', () => {
  const s = sourcingSpecification(base, { plannedCac: 22, requiredFirstOrderProfit: 5 });
  assert.equal(s.requiredContribution, 27);
  assert.ok(s.maxUnitCost > 0);
  assert.match(s.statement, /Landed cost must stay at or below EUR/);
  assert.match(s.statement, /27\.00 of contribution/);
});

test('an unachievable specification says what to change', () => {
  const tiny = { ...base, pricePerUnitInclVat: v(12, 'ESTIMATE') };
  const s = sourcingSpecification(tiny, { plannedCac: 25 });
  assert.equal(s.achievable, false);
  assert.match(s.statement, /Raise the price, raise units per order, or lower acquisition cost/);
});

test('the price ladder shows where a product becomes viable at all', () => {
  const ladder = priceLadder(base, [20, 40, 60, 80, 100], { plannedCac: 22 });
  assert.equal(ladder.length, 5);
  // Headroom must increase monotonically with price.
  for (let i = 1; i < ladder.length; i += 1) {
    assert.ok(ladder[i].maxUnitCost >= ladder[i - 1].maxUnitCost);
  }
  assert.equal(ladder[0].achievable, false, 'a EUR 20 order cannot fund a EUR 22 CAC');
  assert.equal(ladder.at(-1).achievable, true);
});

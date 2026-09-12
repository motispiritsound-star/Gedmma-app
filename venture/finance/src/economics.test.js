import test from 'node:test';
import assert from 'node:assert/strict';

import {
  v,
  weakestProvenance,
  computeOrderEconomics,
  computeAcquisitionTargets,
  computeLifetimeValue,
  computeReturnOnAcquisition,
} from './economics.js';
import {
  runStressSuite,
  evaluateGates,
  DEFAULT_GATES,
  formatSuiteMarkdown,
} from './stress.js';

/** A deliberately plain candidate, easy to reason about by hand. */
function simpleSpec(overrides = {}) {
  return {
    pricePerUnitInclVat: v(60.5, 'ASSUMPTION'),
    unitsPerOrder: v(1, 'ASSUMPTION'),
    vatRate: v(0.21, 'FACT', 'Dutch standard btw'),
    unitCost: v(15, 'ASSUMPTION'),
    ...overrides,
  };
}

test('VAT is removed from revenue and never counted as income', () => {
  const order = computeOrderEconomics(simpleSpec());
  assert.equal(order.grossInclVat, 60.5);
  assert.ok(Math.abs(order.netRevenue - 50) < 1e-9, 'net of 21% VAT should be 50.00');
  assert.ok(Math.abs(order.vatCollected - 10.5) < 1e-9);
});

test('gross margin is computed on net revenue, not on the VAT-inclusive price', () => {
  const order = computeOrderEconomics(simpleSpec());
  // 50 net, 15 cost => 70%. Against the inclusive 60.50 it would look like 75.2%.
  assert.ok(Math.abs(order.grossMarginPct - 0.7) < 1e-9);
});

test('payment fees are charged on the full amount the customer pays, VAT included', () => {
  const order = computeOrderEconomics(
    simpleSpec({ paymentPctFee: v(0.02, 'ASSUMPTION'), paymentFixedFee: v(0.25, 'ASSUMPTION') }),
  );
  // 2% of 60.50 (not of 50) plus 0.25
  assert.ok(Math.abs(order.costs.payment - (60.5 * 0.02 + 0.25)) < 1e-9);
});

test('break-even ROAS on an ex-VAT basis is exactly the reciprocal of contribution margin', () => {
  const order = computeOrderEconomics(
    simpleSpec({ paymentPctFee: v(0.02, 'ASSUMPTION'), packagingPerOrder: v(1.2, 'ASSUMPTION') }),
  );
  const t = computeAcquisitionTargets(order, { roasBasis: 'exclVat' });
  assert.ok(
    Math.abs(t.breakEvenRoas - 1 / order.contributionMarginPct) < 1e-9,
    'the identity the brief asks us to check should hold exactly',
  );
});

test('sending VAT-inclusive purchase values raises break-even ROAS by the VAT factor', () => {
  const order = computeOrderEconomics(simpleSpec({ paymentPctFee: v(0.02, 'ASSUMPTION') }));
  const excl = computeAcquisitionTargets(order, { roasBasis: 'exclVat' });
  const incl = computeAcquisitionTargets(order, { roasBasis: 'inclVat' });
  assert.ok(
    Math.abs(incl.breakEvenRoas / excl.breakEvenRoas - 1.21) < 1e-9,
    'a store reporting inclusive values needs a 21% higher ROAS to break even',
  );
  // The practical trap: believing the ex-VAT figure while the pixel reports inclusive.
  assert.ok(incl.breakEvenRoas > excl.breakEvenRoas);
});

test('shipping revenue offsets shipping cost and lifts contribution', () => {
  const withoutShipping = computeOrderEconomics(
    simpleSpec({ outboundShipCost: v(5, 'ASSUMPTION') }),
  );
  const withShipping = computeOrderEconomics(
    simpleSpec({
      outboundShipCost: v(5, 'ASSUMPTION'),
      shippingChargedInclVat: v(4.95, 'ASSUMPTION'),
    }),
  );
  assert.ok(withShipping.contributionBeforeAds > withoutShipping.contributionBeforeAds);
});

test('refunds cost more than the goods, because fulfilment and carriage are sunk', () => {
  const clean = computeOrderEconomics(
    simpleSpec({ outboundShipCost: v(5, 'ASSUMPTION'), pickPackPerOrder: v(2, 'ASSUMPTION') }),
  );
  const refunding = computeOrderEconomics(
    simpleSpec({
      outboundShipCost: v(5, 'ASSUMPTION'),
      pickPackPerOrder: v(2, 'ASSUMPTION'),
      refundRate: v(0.05, 'ASSUMPTION'),
    }),
  );
  const damage = clean.contributionBeforeAds - refunding.contributionBeforeAds;
  // 5% of an order whose net revenue alone is 50 => strictly more than 2.50 lost.
  assert.ok(damage > 0.05 * 50, `expected more than the goods value to be lost, got ${damage}`);
});

test('unitsPerOrder raises AOV and improves contribution margin via fixed-cost dilution', () => {
  const one = computeOrderEconomics(
    simpleSpec({ packagingPerOrder: v(1.5, 'ASSUMPTION'), outboundShipCost: v(5, 'ASSUMPTION') }),
  );
  const two = computeOrderEconomics(
    simpleSpec({
      unitsPerOrder: v(2, 'ASSUMPTION'),
      packagingPerOrder: v(1.5, 'ASSUMPTION'),
      outboundShipCost: v(5, 'ASSUMPTION'),
    }),
  );
  assert.ok(two.aovInclVat > one.aovInclVat);
  assert.ok(
    two.contributionMarginPct > one.contributionMarginPct,
    'per-order costs spread over more units must improve the margin',
  );
});

test('provenance propagates from the weakest input to the verdict', () => {
  assert.equal(weakestProvenance([v(1, 'FACT'), v(2, 'ESTIMATE')]), 'ESTIMATE');
  assert.equal(weakestProvenance([v(1, 'FACT'), v(2, 'UNVERIFIED')]), 'UNVERIFIED');

  const order = computeOrderEconomics(
    simpleSpec({ unitCost: v(15, 'UNVERIFIED', 'no supplier has quoted this') }),
  );
  assert.equal(order.provenance, 'UNVERIFIED');
});

test('unverified inputs cannot produce a decision-grade pass, however good they look', () => {
  const spec = simpleSpec({
    unitCost: v(5, 'UNVERIFIED', 'invented'),
    paymentPctFee: v(0.019, 'FACT'),
  });
  const suite = runStressSuite(spec, { plannedCac: 10 });
  const result = evaluateGates(suite);

  assert.equal(result.failures.length, 0, 'the numbers themselves are excellent');
  assert.equal(result.decisionGrade, false, 'but they are not decision-grade');
  assert.equal(result.confidence, 'INDICATIVE');
  assert.match(result.verdict, /INDICATIVE ONLY/);
  assert.match(result.verdict, /No money may be committed/);
});

test('a recorded assumption yields a conditional pass, not a blocked one', () => {
  // An assumption is a deliberate choice ("we will offer free shipping"), which
  // is materially different from an unknown. It must not halt the analysis.
  const spec = simpleSpec({ shippingChargedInclVat: v(0, 'ASSUMPTION', 'free-shipping policy') });
  const result = evaluateGates(runStressSuite(spec, { plannedCac: 12 }));

  assert.equal(result.decisionGrade, true);
  assert.equal(result.confidence, 'CONDITIONAL');
  assert.match(result.verdict, /conditional on the recorded assumptions/);
});

test('a conversion-rate fall is modelled as higher CAC, not as higher unit cost', () => {
  const suite = runStressSuite(simpleSpec(), { plannedCac: 10 });
  const base = suite.find((s) => s.id === 'base');
  const cvr = suite.find((s) => s.id === 'cvr-20');

  assert.equal(cvr.contributionBeforeAds, base.contributionBeforeAds, 'unit costs are unchanged');
  assert.ok(Math.abs(cvr.assumedCac - base.assumedCac * 1.25) < 1e-9, '20% fewer orders => CAC x1.25');
});

test('thin-contribution candidates are rejected even when margin percentages look fine', () => {
  // 90% gross margin on a EUR 6 product: great ratio, no money to buy traffic with.
  const spec = {
    pricePerUnitInclVat: v(6.05, 'ESTIMATE'),
    unitsPerOrder: v(1, 'ESTIMATE'),
    vatRate: v(0.21, 'FACT'),
    unitCost: v(0.5, 'ESTIMATE'),
  };
  const suite = runStressSuite(spec, { plannedCac: 8 });
  const result = evaluateGates(suite);

  assert.equal(result.passes, false);
  assert.ok(
    result.failures.some((f) => /too thin to buy traffic/.test(f)),
    `expected the absolute-contribution gate to fire, got: ${result.failures.join('; ')}`,
  );
});

test('a healthy candidate on estimated inputs passes and is decision-grade', () => {
  const spec = {
    pricePerUnitInclVat: v(79, 'ESTIMATE', 'observed competitor band'),
    unitsPerOrder: v(1.3, 'ESTIMATE'),
    vatRate: v(0.21, 'FACT'),
    unitCost: v(16, 'ESTIMATE', 'pending supplier quote'),
    packagingPerOrder: v(1.8, 'ESTIMATE'),
    pickPackPerOrder: v(2.2, 'ESTIMATE'),
    outboundShipCost: v(5.5, 'ESTIMATE'),
    shippingChargedInclVat: v(0, 'ASSUMPTION', 'free shipping'),
    paymentPctFee: v(0.019, 'FACT'),
    paymentFixedFee: v(0.25, 'FACT'),
    refundRate: v(0.02, 'ESTIMATE'),
    returnRate: v(0.06, 'ESTIMATE'),
    returnShipCost: v(6, 'ESTIMATE'),
    supportCostPerOrder: v(0.9, 'ESTIMATE'),
  };
  const suite = runStressSuite(spec, { plannedCac: 22 });
  const result = evaluateGates(suite);

  assert.equal(result.decisionGrade, true);
  assert.equal(result.confidence, 'CONDITIONAL', 'free shipping is a recorded policy choice');
  assert.equal(result.passes, true, `unexpected failures: ${result.failures.join('; ')}`);
  assert.match(result.verdict, /PASSES/);
});

test('the stress suite covers every shock the brief requires', () => {
  const suite = runStressSuite(simpleSpec(), { plannedCac: 10 });
  const ids = suite.map((s) => s.id);
  for (const required of ['base', 'cac+25', 'cogs+10', 'ship+20', 'cvr-20', 'refund+50', 'compound']) {
    assert.ok(ids.includes(required), `missing scenario ${required}`);
  }
});

test('lifetime value discounts later orders and never inflates the first', () => {
  const order = computeOrderEconomics(simpleSpec());
  const undiscounted = computeLifetimeValue(order, {
    repeatOrdersPerYear: v(2, 'ASSUMPTION'),
    retentionRate: v(1, 'ASSUMPTION'),
    annualDiscountRate: 0,
    horizonYears: 2,
  });
  const realistic = computeLifetimeValue(order, {
    repeatOrdersPerYear: v(2, 'ASSUMPTION'),
    retentionRate: v(0.4, 'ASSUMPTION'),
    annualDiscountRate: 0.15,
    horizonYears: 2,
  });

  assert.ok(realistic.lifetimeContribution < undiscounted.lifetimeContribution);
  assert.ok(realistic.lifetimeContribution >= order.contributionBeforeAds);
  assert.equal(realistic.firstOrderContribution, order.contributionBeforeAds);
});

test('LTV cannot rescue a first order that loses money, and says so', () => {
  const order = computeOrderEconomics(simpleSpec());
  const ltv = computeLifetimeValue(order, {
    repeatOrdersPerYear: v(4, 'ASSUMPTION'),
    retentionRate: v(0.8, 'ASSUMPTION'),
  });
  const roa = computeReturnOnAcquisition(ltv, 45);

  assert.ok(roa.ltvToCac > 1, 'lifetime value looks comfortable');
  assert.equal(roa.paybackOnFirstOrder, false, 'yet the first order does not pay back');
  assert.ok(roa.firstOrderProfit < 0);
});

test('invalid inputs are rejected rather than silently producing nonsense', () => {
  assert.throws(() => v(Number.NaN, 'FACT'), TypeError);
  assert.throws(() => v(1, 'VIBES'), TypeError);
  assert.throws(
    () => computeOrderEconomics(simpleSpec({ unitsPerOrder: v(0, 'ASSUMPTION') })),
    RangeError,
  );
  assert.throws(
    () => computeOrderEconomics(simpleSpec({ vatRate: v(1.21, 'ASSUMPTION') })),
    RangeError,
  );
  assert.throws(() => computeReturnOnAcquisition({ lifetimeContribution: 1 }, 0), RangeError);
});

test('the markdown formatter emits a usable table', () => {
  const suite = runStressSuite(simpleSpec(), { plannedCac: 10 });
  const md = formatSuiteMarkdown(suite);
  assert.match(md, /\| Scenario \|/);
  assert.match(md, /Base case/);
  assert.match(md, /Compound/);
  assert.equal(md.split('\n').length, suite.length + 2);
});

test('default gates encode the brief thresholds', () => {
  assert.equal(DEFAULT_GATES.minGrossMarginPct, 0.6);
  assert.equal(DEFAULT_GATES.requireFirstOrderProfit, true);
});

test('a warranty reserve is carried for claims beyond the withdrawal window', () => {
  // The 14-day refund and return provisions do not cover the EU two-year
  // conformity guarantee, and for the first 12 months the burden of proof is
  // reversed against the merchant. A durable good priced without this reserve
  // looks more profitable than it is.
  const without = computeOrderEconomics(simpleSpec());
  const withReserve = computeOrderEconomics(
    simpleSpec({
      warrantyClaimRate: v(0.03, 'ASSUMPTION', 'replacement rate months 2-24'),
      warrantyCostPerClaim: v(25, 'ASSUMPTION', 'goods plus carriage both ways'),
    }),
  );

  assert.ok(Math.abs(withReserve.costs.warranty - 0.75) < 1e-9);
  assert.ok(
    withReserve.contributionBeforeAds < without.contributionBeforeAds,
    'the reserve must reduce contribution',
  );
});

test('the warranty reserve is stressed alongside refunds', () => {
  const spec = simpleSpec({
    warrantyClaimRate: v(0.04, 'ASSUMPTION'),
    warrantyCostPerClaim: v(25, 'ASSUMPTION'),
  });
  const suite = runStressSuite(spec, { plannedCac: 10 });
  const base = suite.find((s) => s.id === 'base');
  const worse = suite.find((s) => s.id === 'refund+50');

  assert.ok(
    worse.contributionBeforeAds < base.contributionBeforeAds,
    'a rise in failure rates must hit the warranty reserve too, not only refunds',
  );
});

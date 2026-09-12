import test from 'node:test';
import assert from 'node:assert/strict';
import { v } from './economics.js';
import { forecast, BUDGET_SCENARIOS, formatForecast } from './forecast.js';

const spec = {
  pricePerUnitInclVat: v(79, 'ASSUMPTION'),
  unitsPerOrder: v(1, 'ASSUMPTION'),
  vatRate: v(0.21, 'FACT'),
  unitCost: v(18, 'UNVERIFIED'),
  outboundShipCost: v(5.5, 'ASSUMPTION'),
  paymentPctFee: v(0.019, 'ASSUMPTION'),
};

const base = {
  months: 6,
  adSpend: [500, 800, 1200, 1600, 2000, 2500],
  cac: 27,
  cacInflation: 1.02,
  organicOrders: 10,
  organicGrowth: 1.15,
  subscriptionTakeRate: 0.3,
  monthlyChurn: 0.08,
  subscriptionValue: 20,
  fixedMonthlyCost: 400,
};

test('subscribers accumulate rather than resetting each month', () => {
  const r = forecast(spec, base);
  for (let i = 1; i < r.rows.length; i += 1) {
    assert.ok(
      r.rows[i].subscribers > r.rows[i - 1].subscribers,
      `subscribers fell in month ${i + 1} despite positive acquisition`,
    );
  }
});

test('churn is applied before the new cohort joins, so month one is not flattered', () => {
  const noChurn = forecast(spec, { ...base, monthlyChurn: 0 });
  const churned = forecast(spec, { ...base, monthlyChurn: 0.5 });

  // Month 1 must be identical: the new cohort has not yet had a chance to churn.
  assert.ok(Math.abs(noChurn.rows[0].subscribers - churned.rows[0].subscribers) < 1e-9);
  // By month 6 the difference must be large.
  assert.ok(churned.rows[5].subscribers < noChurn.rows[5].subscribers * 0.7);
});

test('with constant acquisition, churn caps the subscriber base at a steady state', () => {
  // Acquisition must be held flat for a steady state to exist at all — organic
  // growth left compounding would (correctly) grow the base without limit.
  const r = forecast(spec, {
    ...base,
    months: 36,
    monthlyChurn: 0.5,
    adSpend: [1000],
    cacInflation: 1,
    organicGrowth: 1,
  });
  const late = r.rows.slice(-3).map((x) => x.subscribers);
  const spread = Math.max(...late) - Math.min(...late);
  assert.ok(spread < 1, `subscriber base should approach a steady state, spread was ${spread}`);
});

test('CAC inflation makes later ad euros buy fewer orders', () => {
  const r = forecast(spec, { ...base, adSpend: [1000, 1000, 1000, 1000, 1000, 1000], organicOrders: 0, organicGrowth: 1 });
  assert.ok(r.rows[5].paidOrders < r.rows[0].paidOrders);
});

test('the cash trough is reported, because it is the money actually required', () => {
  const r = forecast(spec, base);
  assert.ok(r.cashTrough <= 0 || r.rows[0].operatingProfit > 0);
  // The trough must be at least as deep as the worst single month.
  const worst = Math.min(...r.rows.map((x) => x.operatingProfit));
  assert.ok(r.cashTrough <= worst + 1e-9);
});

test('a business that never turns a profit reports no break-even month rather than guessing', () => {
  const r = forecast(spec, { ...base, cac: 500, organicOrders: 0, subscriptionTakeRate: 0 });
  assert.equal(r.breakEvenMonth, null);
  assert.match(formatForecast(r, 'doomed'), /none within the horizon/);
});

test('budget scenarios escalate and the accelerated case is gated on measurement', () => {
  const lean = BUDGET_SCENARIOS.lean.monthlyAdSpend.reduce((a, b) => a + b, 0);
  const std = BUDGET_SCENARIOS.standard.monthlyAdSpend.reduce((a, b) => a + b, 0);
  const acc = BUDGET_SCENARIOS.accelerated.monthlyAdSpend.reduce((a, b) => a + b, 0);
  assert.ok(lean < std && std < acc);
  assert.match(BUDGET_SCENARIOS.lean.purpose, /information, not revenue/);
  assert.match(BUDGET_SCENARIOS.accelerated.purpose, /measured rather than assumed/);
});

test('the renderer produces a row per month', () => {
  const r = forecast(spec, base);
  const md = formatForecast(r, 'Base');
  assert.equal(md.split('\n').filter((l) => /^\| \d/.test(l)).length, 6);
});

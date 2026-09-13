import test from 'node:test';
import assert from 'node:assert/strict';
import { v, computeOrderEconomics } from './economics.js';
import { assessMargin, repriceToRestore, DEFAULT_THRESHOLDS } from './margin-guard.js';
import { starterSet, CAC_COLD } from './product-spec.js';

const at = (cost) => starterSet(79, cost);
const ctx = (cost = 18) => ({ baselineUnitCost: cost, plannedCac: CAC_COLD });

test('a healthy product returns OK and no reasons', () => {
  const r = assessMargin(at(18), ctx());
  assert.equal(r.action, 'OK');
  assert.deepEqual(r.reasons, []);
  assert.match(r.summary, /No action/);
});

test('a cost rise past the tolerance is flagged before margins break', () => {
  // +12% on an 18.00 baseline: margins are still fine, but it is worth knowing.
  const r = assessMargin(at(20.16), ctx());
  assert.equal(r.action, 'WATCH');
  assert.ok(r.reasons.some((x) => /landed cost is up/.test(x)));
  assert.ok(Math.abs(r.costIncreasePct - 0.12) < 1e-9);
});

test('escalation is monotonic — a worse problem overrides a milder one', () => {
  const r = assessMargin(at(45), ctx());
  // Many thresholds trip at once; the reported action must be the most severe.
  assert.ok(['REPRICE', 'WITHDRAW'].includes(r.action), `got ${r.action}`);
  assert.ok(r.reasons.length > 1, 'several reasons should be collected');
});

test('promotion is stopped once contribution can no longer buy traffic', () => {
  const r = assessMargin(at(38), ctx());
  assert.ok(
    ['STOP_PROMOTION', 'REPRICE', 'WITHDRAW'].includes(r.action),
    `expected at least STOP_PROMOTION, got ${r.action}`,
  );
  assert.match(r.summary, /STOP PROMOTION|REPRICE|WITHDRAW/);
});

test('a product that loses money before advertising is withdrawn, not merely repriced', () => {
  const r = assessMargin(at(80), ctx());
  assert.equal(r.action, 'WITHDRAW');
  assert.ok(r.contributionBeforeAds <= 0);
  assert.match(r.summary, /loses money before advertising/);
});

test('the guard reports how much contribution the cost change actually cost', () => {
  const r = assessMargin(at(24), ctx(18));
  // Six euros more cost is six euros less contribution — COGS is linear here.
  assert.ok(Math.abs(r.contributionLost - 6) < 1e-9, `got ${r.contributionLost}`);
});

test('the recommended price restores the baseline contribution exactly', () => {
  const baseline = computeOrderEconomics(at(18)).contributionBeforeAds;
  const r = assessMargin(at(24), ctx(18));

  assert.ok(r.repriceTo > 79, 'a cost rise must imply a higher price');

  const restored = computeOrderEconomics({
    ...at(24),
    pricePerUnitInclVat: v(r.repriceTo, 'ESTIMATE'),
  }).contributionBeforeAds;

  assert.ok(restored >= baseline, `restored ${restored} should reach baseline ${baseline}`);
  assert.ok(restored - baseline < 0.05, 'and should not overshoot meaningfully');
});

test('naively adding the cost increase to the price under-recovers', () => {
  // The shortcut most people use: cost went up EUR 6, so add EUR 6 to the price.
  // VAT and the percentage payment fee scale with price, so it is not enough.
  const baseline = computeOrderEconomics(at(18)).contributionBeforeAds;
  const naive = computeOrderEconomics({
    ...at(24),
    pricePerUnitInclVat: v(79 + 6, 'ESTIMATE'),
  }).contributionBeforeAds;

  assert.ok(
    naive < baseline,
    'adding the cost delta to a VAT-inclusive price does not restore contribution',
  );
});

test('an unrecoverable position returns null rather than an absurd price', () => {
  // No price restores this contribution when the goods cost more than any
  // plausible ceiling allows.
  const impossible = repriceToRestore(at(500), 1000);
  assert.equal(impossible, null);
});

test('the guard advises and never acts', () => {
  const r = assessMargin(at(45), ctx());
  // The returned shape carries no side effect, only a recommendation. Automating
  // a withdrawal on a cost feed is how a bad feed empties a catalogue.
  assert.ok('action' in r && 'summary' in r);
  assert.ok(!('applied' in r) && !('hidden' in r));
});

test('provenance survives into the recommendation', () => {
  const r = assessMargin(at(18), ctx());
  assert.equal(r.provenance, 'UNVERIFIED', 'the spec is built on unquoted costs');
});

test('thresholds are configurable and the defaults are the documented ones', () => {
  assert.equal(DEFAULT_THRESHOLDS.stopPromotionMarginPct, 0.25);
  const strict = assessMargin(at(18), ctx(), { warnContributionMarginPct: 0.99 });
  assert.equal(strict.action, 'WATCH');
});

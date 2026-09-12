import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WEIGHTS,
  SUPPLIER_DEPENDENT,
  scoreCandidate,
  rankCandidates,
  formatScorecard,
} from './opportunity-score.js';

const dim = (score, provenance, rationale = 'because') => ({ score, provenance, rationale });

/** Fill every dimension, so a complete score can be produced. */
function complete(score = 8, provenance = 'ESTIMATE') {
  const d = {};
  for (const k of Object.keys(WEIGHTS)) d[k] = dim(score, provenance);
  return d;
}

test('weights sum to 1', () => {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(total - 1) < 1e-9, `weights sum to ${total}`);
});

test('a fully scored candidate produces a valid, comparable total', () => {
  const r = scoreCandidate('ideal', complete(10));
  assert.equal(r.valid, true);
  assert.ok(Math.abs(r.knownScore - 100) < 1e-9);
  assert.equal(r.missing.length, 0);
  assert.match(r.verdict, /Complete score/);
});

test('supplier-dependent dimensions are a third of the model, and their absence invalidates it', () => {
  const dims = complete();
  for (const k of SUPPLIER_DEPENDENT) delete dims[k];

  const r = scoreCandidate('no supplier data', dims);
  assert.equal(r.valid, false);
  assert.ok(
    Math.abs(r.missingWeight - 0.375) < 1e-9,
    `expected 37.5% of the model to be supplier-dependent, got ${(r.missingWeight * 100).toFixed(1)}%`,
  );
  assert.match(r.verdict, /INCOMPLETE/);
  assert.match(r.verdict, /indicative only/);
});

test('the possible range widens exactly by the unscored weight', () => {
  const dims = complete(10);
  delete dims.supplierQuality; // 7.5%
  const r = scoreCandidate('one gap', dims);

  assert.ok(Math.abs(r.minPossible - 92.5) < 1e-9);
  assert.ok(Math.abs(r.maxPossible - 100) < 1e-9);
});

test('an explicitly unverified dimension invalidates the score even when nothing is missing', () => {
  const dims = complete();
  dims.verifiedDemand = dim(9, 'UNVERIFIED', 'no keyword tool available');

  const r = scoreCandidate('looks good, is not', dims);
  assert.equal(r.missing.length, 0);
  assert.equal(r.valid, false);
  assert.deepEqual(r.unverified, ['verifiedDemand']);
});

test('a rationale is mandatory — a bare number is not a score', () => {
  assert.throws(
    () => scoreCandidate('lazy', { verifiedDemand: { score: 9, provenance: 'FACT' } }),
    /rationale is required/,
  );
});

test('out-of-range scores are rejected', () => {
  assert.throws(() => scoreCandidate('bad', { verifiedDemand: dim(11, 'FACT') }), RangeError);
  assert.throws(() => scoreCandidate('bad', { verifiedDemand: dim(-1, 'FACT') }), RangeError);
});

test('common-mode gaps still permit a relative ranking, but not a threshold', () => {
  const gapped = (score) => {
    const d = complete(score);
    for (const k of SUPPLIER_DEPENDENT) delete d[k];
    return d;
  };
  const result = rankCandidates([
    scoreCandidate('weaker', gapped(5)),
    scoreCandidate('stronger', gapped(9)),
  ]);

  assert.equal(result.ranked[0].name, 'stronger');
  assert.match(result.interpretation, /common-mode/);
  assert.match(result.interpretation, /RELATIVE ranking is informative/);
  assert.match(result.interpretation, /no pass\/fail threshold/);
});

test('candidates missing different dimensions are reported as not comparable', () => {
  const a = complete();
  delete a.supplierQuality;
  const b = complete();
  delete b.creativePotential;

  const result = rankCandidates([scoreCandidate('a', a), scoreCandidate('b', b)]);
  assert.match(result.interpretation, /not comparable/);
});

test('a near-tie is reported as a tie rather than a winner', () => {
  const gapped = (score) => {
    const d = complete(score);
    for (const k of SUPPLIER_DEPENDENT) delete d[k];
    return d;
  };
  const close = rankCandidates([scoreCandidate('a', gapped(8)), scoreCandidate('b', gapped(8.1))]);
  assert.match(close.decisive, /genuine tie/);

  const clear = rankCandidates([scoreCandidate('a', gapped(3)), scoreCandidate('b', gapped(9))]);
  assert.match(clear.decisive, /separated by more than 5 points/);
});

test('the scorecard renders every dimension, including the unscored ones', () => {
  const dims = complete();
  delete dims.supplierQuality;
  const md = formatScorecard(scoreCandidate('render me', dims));

  assert.match(md, /### render me/);
  assert.match(md, /\| supplierQuality \| 7\.5% \| — \| — \|/);
  assert.match(md, /INCOMPLETE/);
  for (const k of Object.keys(WEIGHTS)) assert.ok(md.includes(k), `missing ${k}`);
});

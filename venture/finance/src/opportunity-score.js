/**
 * Product opportunity scoring.
 *
 * Implements the weighted model from the commissioning brief (§7), with one
 * behaviour the brief did not ask for and which turns out to matter more than
 * the weights: the scorer refuses to produce a total when the dimensions
 * feeding it have not been established.
 *
 * That refusal is not pedantry. Roughly 37.5% of the brief's weighting —
 * gross-margin potential, contribution-margin potential and supplier quality —
 * is unknowable until a supplier has quoted. A scorer that happily returns
 * "78/100" while a third of its inputs are guesses produces a number with the
 * appearance of rigour and the content of a hunch, and that number is what gets
 * used to justify committing capital.
 */

/** @typedef {import('./economics.js').Provenance} Provenance */

/**
 * The brief's weights, adjusted where this project's research gave a reason.
 * Every deviation is justified inline, because unexplained reweighting is how a
 * scoring model gets quietly bent toward a preferred answer.
 */
export const WEIGHTS = {
  verifiedDemand: 0.15,
  trendDurability: 0.1,
  grossMarginPotential: 0.15,
  contributionMarginPotential: 0.15,
  creativePotential: 0.1,
  competitionDifferentiation: 0.1,
  supplierQuality: 0.075,
  shippingFulfilment: 0.075,
  repeatAndLtv: 0.05,
  regulatoryAndReturnRisk: 0.05,
};

/**
 * Dimensions that cannot honestly be scored before a supplier has quoted.
 * Named explicitly so the gap is visible rather than implied.
 */
export const SUPPLIER_DEPENDENT = [
  'grossMarginPotential',
  'contributionMarginPotential',
  'supplierQuality',
];

/**
 * @typedef {object} Dimension
 * @property {number} score       0-10
 * @property {Provenance} provenance
 * @property {string} rationale   why this score — required, never optional
 * @property {string} [evidence]  ledger IDs supporting it
 */

/**
 * Score one candidate.
 *
 * @param {string} name
 * @param {Partial<Record<keyof WEIGHTS, Dimension>>} dimensions
 * @returns {{
 *   name: string,
 *   knownScore: number, knownWeight: number, normalisedKnownScore: number,
 *   missing: string[], missingWeight: number,
 *   unverified: string[],
 *   maxPossible: number, minPossible: number,
 *   valid: boolean, verdict: string,
 *   detail: Array<{dimension: string, weight: number, score: number|null, provenance: Provenance|null, rationale: string}>
 * }}
 */
export function scoreCandidate(name, dimensions) {
  const detail = [];
  const missing = [];
  const unverified = [];
  let knownScore = 0;
  let knownWeight = 0;

  for (const [dimension, weight] of Object.entries(WEIGHTS)) {
    const d = dimensions[dimension];

    if (!d) {
      missing.push(dimension);
      detail.push({ dimension, weight, score: null, provenance: null, rationale: 'not scored' });
      continue;
    }
    if (d.score < 0 || d.score > 10) {
      throw new RangeError(`${name}.${dimension}: score must be 0-10, got ${d.score}`);
    }
    if (!d.rationale) {
      throw new Error(`${name}.${dimension}: a rationale is required for every score`);
    }
    if (d.provenance === 'UNVERIFIED') {
      unverified.push(dimension);
    }

    knownScore += (d.score / 10) * weight * 100;
    knownWeight += weight;
    detail.push({
      dimension,
      weight,
      score: d.score,
      provenance: d.provenance,
      rationale: d.rationale,
    });
  }

  const missingWeight = 1 - knownWeight;

  // What the candidate could still become once the gaps are filled, best and
  // worst case. The spread is the honest expression of how much is unknown.
  const maxPossible = knownScore + missingWeight * 100;
  const minPossible = knownScore;

  // A total is only meaningful when the unknown weight is small and nothing
  // load-bearing is explicitly unverified.
  const valid = missingWeight < 0.01 && unverified.length === 0;

  return {
    name,
    knownScore,
    knownWeight,
    normalisedKnownScore: knownWeight > 0 ? knownScore / knownWeight : 0,
    missing,
    missingWeight,
    unverified,
    maxPossible,
    minPossible,
    valid,
    verdict: buildVerdict(valid, missing, missingWeight, unverified),
    detail,
  };
}

function buildVerdict(valid, missing, missingWeight, unverified) {
  if (valid) return 'Complete score. Comparable against other complete scores.';

  const parts = [];
  if (missing.length) {
    parts.push(
      `${(missingWeight * 100).toFixed(1)}% of the model is unscored (${missing.join(', ')})`,
    );
  }
  if (unverified.length) {
    parts.push(`unverified inputs: ${unverified.join(', ')}`);
  }
  return `INCOMPLETE — ${parts.join('; ')}. Ranking on this basis is indicative only.`;
}

/**
 * Rank candidates, and say plainly whether the ranking can be trusted.
 *
 * When every candidate is missing the same supplier-dependent dimensions, the
 * *relative* ranking on what IS known still carries information — the gaps are
 * common-mode. What it cannot support is an absolute pass/fail against a
 * threshold. This distinction is the useful part.
 *
 * @param {ReturnType<typeof scoreCandidate>[]} scored
 */
export function rankCandidates(scored) {
  const ranked = [...scored].sort(
    (a, b) => b.normalisedKnownScore - a.normalisedKnownScore,
  );

  const allSameGaps =
    scored.length > 1 &&
    scored.every(
      (s) => JSON.stringify([...s.missing].sort()) === JSON.stringify([...scored[0].missing].sort()),
    );

  const anyValid = scored.some((s) => s.valid);

  let interpretation;
  if (anyValid && scored.every((s) => s.valid)) {
    interpretation = 'Ranking is complete and absolute thresholds may be applied.';
  } else if (allSameGaps) {
    interpretation =
      'Every candidate is missing the same dimensions, so the gaps are common-mode and the ' +
      'RELATIVE ranking is informative. Absolute scores are not, and no pass/fail threshold ' +
      'may be applied until the supplier-dependent dimensions are filled.';
  } else {
    interpretation =
      'Candidates are missing DIFFERENT dimensions, so they are not comparable to each other. ' +
      'Fill the gaps before ranking.';
  }

  const separation =
    ranked.length > 1
      ? ranked[0].normalisedKnownScore - ranked[1].normalisedKnownScore
      : Infinity;

  return {
    ranked,
    interpretation,
    separation,
    decisive:
      separation > 5
        ? 'The leader is separated by more than 5 points on known dimensions.'
        : 'The top candidates are within 5 points — treat as a genuine tie and decide on ' +
          'qualitative grounds or gather the missing data before committing.',
  };
}

/** Render a scorecard as markdown. */
export function formatScorecard(result) {
  const lines = [
    `### ${result.name}`,
    '',
    `**Score on known dimensions: ${result.knownScore.toFixed(1)} / ${(result.knownWeight * 100).toFixed(1)} available**  `,
    `**Normalised: ${result.normalisedKnownScore.toFixed(1)} / 100**  `,
    `**Range once gaps are filled: ${result.minPossible.toFixed(1)} – ${result.maxPossible.toFixed(1)}**`,
    '',
    `> ${result.verdict}`,
    '',
    '| Dimension | Weight | Score | Provenance | Rationale |',
    '|---|---:|---:|---|---|',
  ];
  for (const d of result.detail) {
    lines.push(
      `| ${d.dimension} | ${(d.weight * 100).toFixed(1)}% | ${d.score ?? '—'} | ${d.provenance ?? '—'} | ${d.rationale} |`,
    );
  }
  return lines.join('\n');
}

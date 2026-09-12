/**
 * Stress testing and go/no-go gates.
 *
 * A candidate that only works at its base case is not a business, it is a hope.
 * These scenarios are deliberately unkind, and each one corresponds to something
 * that routinely happens in the first ninety days of a real store.
 */

import { computeOrderEconomics, computeAcquisitionTargets } from './economics.js';

/**
 * Apply a multiplicative shock to a tagged input without losing its provenance.
 * @param {import('./economics.js').Input|undefined} input
 * @param {number} factor
 */
function shock(input, factor) {
  if (!input) return input;
  return { ...input, value: input.value * factor };
}

/**
 * The standard shock set.
 *
 * Note on `cvrDrop`: a fall in conversion rate does not change any unit cost.
 * It raises acquisition cost, because the same click spend buys fewer orders.
 * A 20% fall in conversion multiplies CAC by 1/0.8 = 1.25. Modelling a CVR drop
 * as a cost increase — a common error — understates the damage.
 */
export const STANDARD_SHOCKS = [
  { id: 'base', label: 'Base case', cost: 1, ship: 1, refund: 1, cacFactor: 1 },
  { id: 'cac+25', label: 'CAC +25%', cost: 1, ship: 1, refund: 1, cacFactor: 1.25 },
  { id: 'cogs+10', label: 'Supplier cost +10%', cost: 1.1, ship: 1, refund: 1, cacFactor: 1 },
  { id: 'ship+20', label: 'Shipping +20%', cost: 1, ship: 1.2, refund: 1, cacFactor: 1 },
  { id: 'cvr-20', label: 'Conversion -20% (CAC +25%)', cost: 1, ship: 1, refund: 1, cacFactor: 1.25 },
  { id: 'refund+50', label: 'Refunds +50%', cost: 1, ship: 1, refund: 1.5, cacFactor: 1 },
  {
    id: 'compound',
    label: 'Compound: CAC +25%, COGS +10%, shipping +20%, refunds +50%',
    cost: 1.1,
    ship: 1.2,
    refund: 1.5,
    cacFactor: 1.25,
  },
];

/**
 * Run a candidate through every shock.
 *
 * @param {import('./economics.js').OrderSpec} spec
 * @param {{ plannedCac: number, targetContributionShare?: number, roasBasis?: 'inclVat'|'exclVat' }} acquisition
 */
export function runStressSuite(spec, acquisition) {
  return STANDARD_SHOCKS.map((s) => {
    const shocked = {
      ...spec,
      unitCost: shock(spec.unitCost, s.cost),
      inboundPerUnit: shock(spec.inboundPerUnit, s.cost),
      outboundShipCost: shock(spec.outboundShipCost, s.ship),
      returnShipCost: shock(spec.returnShipCost, s.ship),
      refundRate: shock(spec.refundRate, s.refund),
      returnRate: shock(spec.returnRate, s.refund),
      warrantyClaimRate: shock(spec.warrantyClaimRate, s.refund),
    };

    const order = computeOrderEconomics(shocked);
    const targets = computeAcquisitionTargets(order, {
      targetContributionShare: acquisition.targetContributionShare,
      roasBasis: acquisition.roasBasis,
    });
    const cac = acquisition.plannedCac * s.cacFactor;

    return {
      id: s.id,
      label: s.label,
      contributionBeforeAds: order.contributionBeforeAds,
      contributionMarginPct: order.contributionMarginPct,
      grossMarginPct: order.grossMarginPct,
      breakEvenRoas: targets.breakEvenRoas,
      assumedCac: cac,
      firstOrderProfit: order.contributionBeforeAds - cac,
      survives: order.contributionBeforeAds - cac > 0,
      provenance: order.provenance,
    };
  });
}

/**
 * @typedef {object} Gates
 * @property {number} [minGrossMarginPct]
 * @property {number} [minContributionMarginPct]
 * @property {number} [minContributionAbs]  absolute € per order available to buy traffic
 * @property {number} [maxBreakEvenRoas]
 * @property {boolean} [requireFirstOrderProfit]
 * @property {boolean} [requireCompoundSurvival]
 */

/** Defaults reflecting the commissioning brief's guidance (§8). */
export const DEFAULT_GATES = {
  minGrossMarginPct: 0.6,
  minContributionMarginPct: 0.25,
  minContributionAbs: 15,
  maxBreakEvenRoas: 2.5,
  requireFirstOrderProfit: true,
  requireCompoundSurvival: false,
};

/**
 * Judge a stress suite against the gates.
 *
 * Provenance is a first-class gate. A candidate whose numbers are unverified
 * cannot pass, however good those numbers look — that is the entire point.
 *
 * @param {ReturnType<typeof runStressSuite>} suite
 * @param {Gates} [gates]
 */
export function evaluateGates(suite, gates = DEFAULT_GATES) {
  const base = suite.find((s) => s.id === 'base');
  if (!base) throw new Error('stress suite must contain a base case');
  const compound = suite.find((s) => s.id === 'compound');

  const failures = [];

  if (gates.minGrossMarginPct != null && base.grossMarginPct < gates.minGrossMarginPct) {
    failures.push(
      `gross margin ${pct(base.grossMarginPct)} below floor ${pct(gates.minGrossMarginPct)}`,
    );
  }
  if (
    gates.minContributionMarginPct != null &&
    base.contributionMarginPct < gates.minContributionMarginPct
  ) {
    failures.push(
      `pre-ad contribution margin ${pct(base.contributionMarginPct)} below floor ${pct(gates.minContributionMarginPct)}`,
    );
  }
  if (gates.minContributionAbs != null && base.contributionBeforeAds < gates.minContributionAbs) {
    failures.push(
      `contribution of ${eur(base.contributionBeforeAds)} per order is too thin to buy traffic (floor ${eur(gates.minContributionAbs)})`,
    );
  }
  if (gates.maxBreakEvenRoas != null && base.breakEvenRoas > gates.maxBreakEvenRoas) {
    failures.push(
      `break-even ROAS ${base.breakEvenRoas.toFixed(2)}x above ceiling ${gates.maxBreakEvenRoas.toFixed(2)}x`,
    );
  }
  if (gates.requireFirstOrderProfit && !base.survives) {
    failures.push('loses money on the first order at planned CAC');
  }
  if (gates.requireCompoundSurvival && compound && !compound.survives) {
    failures.push('does not survive the compound shock');
  }

  const fragile = suite.filter((s) => s.id !== 'base' && s.id !== 'compound' && !s.survives);

  // The anti-fabrication gate.
  //
  // Only UNVERIFIED blocks a decision. It is the one tag that means "this number
  // is required and nobody has established it". An ASSUMPTION is different in
  // kind: it is a deliberate, recorded choice — a free-shipping policy, a target
  // discount rate — and proceeding on recorded assumptions is exactly how this
  // stage of work is supposed to run. Conflating the two would either block all
  // progress or, worse, encourage quietly relabelling unknowns as assumptions.
  const decisionGrade = base.provenance !== 'UNVERIFIED';
  const confidence =
    base.provenance === 'UNVERIFIED'
      ? 'INDICATIVE'
      : base.provenance === 'ASSUMPTION'
        ? 'CONDITIONAL'
        : 'SUPPORTED';

  return {
    passes: failures.length === 0,
    failures,
    fragileUnder: fragile.map((s) => s.label),
    compoundSurvives: compound ? compound.survives : null,
    provenance: base.provenance,
    decisionGrade,
    confidence,
    verdict: buildVerdict(failures, confidence, base.provenance),
  };
}

function buildVerdict(failures, confidence, provenance) {
  if (confidence === 'INDICATIVE') {
    return `INDICATIVE ONLY — at least one input is ${provenance}. No money may be committed on this result until those inputs are established.`;
  }
  const outcome =
    failures.length === 0
      ? 'PASSES the economic gates'
      : `FAILS ${failures.length} gate(s)`;
  return confidence === 'CONDITIONAL'
    ? `${outcome}, conditional on the recorded assumptions holding.`
    : `${outcome} on sourced or reasoned inputs.`;
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const eur = (x) => `EUR ${x.toFixed(2)}`;

/** Render a stress suite as a markdown table for the research documents. */
export function formatSuiteMarkdown(suite) {
  const header =
    '| Scenario | Contribution/order | Contribution margin | Break-even ROAS | Assumed CAC | First-order profit | Survives |\n' +
    '|---|---:|---:|---:|---:|---:|:--:|';
  const rows = suite.map(
    (s) =>
      `| ${s.label} | ${eur(s.contributionBeforeAds)} | ${pct(s.contributionMarginPct)} | ` +
      `${s.breakEvenRoas.toFixed(2)}x | ${eur(s.assumedCac)} | ${eur(s.firstOrderProfit)} | ` +
      `${s.survives ? 'yes' : 'NO'} |`,
  );
  return [header, ...rows].join('\n');
}

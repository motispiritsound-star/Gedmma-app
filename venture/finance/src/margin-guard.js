/**
 * Margin guard.
 *
 * The brief (§34) asks that supplier price changes must not be allowed to
 * quietly destroy margins: if landed cost rises past a threshold, stop
 * promoting the product, flag it, consider repricing.
 *
 * The reason this is code rather than a note in a runbook is that the failure it
 * prevents is silent. A supplier raises a price 8%, the store keeps selling, the
 * ad account keeps spending against a break-even ROAS that is no longer true,
 * and the damage is only visible weeks later in a bank balance. Nobody notices
 * because every individual number still looks normal.
 *
 * The guard is deliberately advisory. It returns a recommended action and never
 * takes one: automatically hiding a product or pausing a campaign on a cost
 * feed is exactly the kind of automation that can do substantial financial
 * damage when the feed is wrong. A human approves the action.
 */

import { computeOrderEconomics, computeAcquisitionTargets, v } from './economics.js';

/**
 * Escalating responses, weakest first. Each implies the ones before it.
 * @typedef {'OK'|'WATCH'|'STOP_PROMOTION'|'REPRICE'|'WITHDRAW'} Action
 */

/**
 * @typedef {object} GuardThresholds
 * @property {number} [warnContributionMarginPct]  below this, watch it
 * @property {number} [stopPromotionMarginPct]     below this, stop paid promotion
 * @property {number} [minContributionAbs]         absolute euros needed to buy traffic
 * @property {number} [maxCostIncreasePct]         rise vs the baseline cost that triggers review
 */

export const DEFAULT_THRESHOLDS = {
  warnContributionMarginPct: 0.35,
  stopPromotionMarginPct: 0.25,
  minContributionAbs: 15,
  maxCostIncreasePct: 0.1,
};

/**
 * Assess a product against its baseline after a cost change.
 *
 * @param {import('./economics.js').OrderSpec} spec  with the CURRENT landed cost
 * @param {{ baselineUnitCost: number, plannedCac: number }} context
 * @param {GuardThresholds} [thresholds]
 */
export function assessMargin(spec, context, thresholds = DEFAULT_THRESHOLDS) {
  const current = computeOrderEconomics(spec);
  const targets = computeAcquisitionTargets(current);

  const baseline = computeOrderEconomics({
    ...spec,
    unitCost: v(context.baselineUnitCost, spec.unitCost.provenance, 'baseline'),
  });

  const costIncreasePct =
    context.baselineUnitCost > 0
      ? (spec.unitCost.value - context.baselineUnitCost) / context.baselineUnitCost
      : 0;

  const contributionLost = baseline.contributionBeforeAds - current.contributionBeforeAds;

  const reasons = [];
  /** @type {Action} */
  let action = 'OK';

  const escalate = (next, reason) => {
    reasons.push(reason);
    const order = ['OK', 'WATCH', 'STOP_PROMOTION', 'REPRICE', 'WITHDRAW'];
    if (order.indexOf(next) > order.indexOf(action)) action = next;
  };

  // A cost rise alone is worth knowing about even when margins still hold,
  // because it is usually the first of several.
  if (thresholds.maxCostIncreasePct != null && costIncreasePct > thresholds.maxCostIncreasePct) {
    escalate(
      'WATCH',
      `landed cost is up ${(costIncreasePct * 100).toFixed(1)}% on baseline ` +
        `(${eur(context.baselineUnitCost)} → ${eur(spec.unitCost.value)})`,
    );
  }

  if (
    thresholds.warnContributionMarginPct != null &&
    current.contributionMarginPct < thresholds.warnContributionMarginPct
  ) {
    escalate(
      'WATCH',
      `contribution margin ${pct(current.contributionMarginPct)} below the watch level ` +
        `${pct(thresholds.warnContributionMarginPct)}`,
    );
  }

  if (
    thresholds.stopPromotionMarginPct != null &&
    current.contributionMarginPct < thresholds.stopPromotionMarginPct
  ) {
    escalate(
      'STOP_PROMOTION',
      `contribution margin ${pct(current.contributionMarginPct)} below the promotion floor ` +
        `${pct(thresholds.stopPromotionMarginPct)} — paid traffic is no longer justified`,
    );
  }

  if (
    thresholds.minContributionAbs != null &&
    current.contributionBeforeAds < thresholds.minContributionAbs
  ) {
    escalate(
      'STOP_PROMOTION',
      `contribution of ${eur(current.contributionBeforeAds)} per order is too thin to buy traffic`,
    );
  }

  // The decisive test: can the order still pay for its own acquisition?
  if (current.contributionBeforeAds < context.plannedCac) {
    escalate(
      'REPRICE',
      `contribution ${eur(current.contributionBeforeAds)} no longer covers CAC of ` +
        `${eur(context.plannedCac)} — every acquired order now loses money`,
    );
  }

  if (current.contributionBeforeAds <= 0) {
    escalate('WITHDRAW', 'the order loses money before any advertising at all');
  }

  return {
    action,
    reasons,
    contributionBeforeAds: current.contributionBeforeAds,
    contributionMarginPct: current.contributionMarginPct,
    breakEvenRoas: targets.breakEvenRoas,
    costIncreasePct,
    contributionLost,
    // What the price would have to become to restore the baseline contribution.
    repriceTo: repriceToRestore(spec, baseline.contributionBeforeAds),
    provenance: current.provenance,
    summary: summarise(action, reasons),
  };
}

/**
 * Solve for the VAT-inclusive price that restores a target contribution at the
 * current cost. Contribution rises monotonically with price, so a bisection is
 * well defined; this beats the common shortcut of adding the cost increase to
 * the price, which under-recovers because payment fees and VAT scale with it.
 *
 * @param {import('./economics.js').OrderSpec} spec
 * @param {number} targetContribution
 */
export function repriceToRestore(spec, targetContribution) {
  const contributionAt = (price) =>
    computeOrderEconomics({
      ...spec,
      pricePerUnitInclVat: v(price, 'ESTIMATE', 'reprice probe'),
    }).contributionBeforeAds;

  let lo = 0.01;
  let hi = Math.max(spec.pricePerUnitInclVat.value * 4, 10);

  if (contributionAt(hi) < targetContribution) return null;

  while (hi - lo > 0.005) {
    const mid = (lo + hi) / 2;
    if (contributionAt(mid) < targetContribution) lo = mid;
    else hi = mid;
  }
  return Math.ceil(hi * 100) / 100;
}

function summarise(action, reasons) {
  if (action === 'OK') return 'No action. Margins are within tolerance.';
  const head = {
    WATCH: 'WATCH — review at the next weekly meeting.',
    STOP_PROMOTION: 'STOP PROMOTION — pause paid traffic to this product, then decide.',
    REPRICE: 'REPRICE — every acquired order is now losing money.',
    WITHDRAW: 'WITHDRAW — the product loses money before advertising.',
  }[action];
  return `${head} ${reasons.join('; ')}.`;
}

const pct = (x) => `${(x * 100).toFixed(1)}%`;
const eur = (x) => `EUR ${x.toFixed(2)}`;

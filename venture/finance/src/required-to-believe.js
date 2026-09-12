/**
 * Required-to-believe analysis.
 *
 * No supplier has quoted, so the landed cost of the hero product is unknown. The
 * tempting move is to invent one. The honest move is to invert the question:
 * given a retail price and an acquisition cost, what is the MOST a unit may cost
 * before the business stops working?
 *
 * That turns an unknown into a specification. "Find a supplier" is not
 * actionable; "this fails above EUR 21.40 landed at MOQ we can fund" is a
 * sourcing brief, a negotiation limit, and a kill criterion in one number.
 */

import { computeOrderEconomics, computeAcquisitionTargets, v } from './economics.js';

/**
 * Binary-search the maximum unit cost at which the order still clears a required
 * contribution. Contribution falls monotonically as unit cost rises, so the
 * search is well-defined.
 *
 * @param {import('./economics.js').OrderSpec} spec  unitCost is ignored
 * @param {number} requiredContribution  euros of pre-ad contribution needed
 * @param {{ max?: number, tolerance?: number }} [opts]
 * @returns {{ maxUnitCost: number, achievable: boolean }}
 */
export function maxAffordableUnitCost(spec, requiredContribution, opts = {}) {
  const max = opts.max ?? 1000;
  const tolerance = opts.tolerance ?? 0.001;

  const contributionAt = (cost) =>
    computeOrderEconomics({ ...spec, unitCost: v(cost, 'ESTIMATE', 'search probe') })
      .contributionBeforeAds;

  if (contributionAt(0) < requiredContribution) {
    // Even free goods do not clear the bar: the problem is price or the cost
    // stack around the product, not the product cost.
    return { maxUnitCost: 0, achievable: false };
  }

  let lo = 0;
  let hi = max;
  while (hi - lo > tolerance) {
    const mid = (lo + hi) / 2;
    if (contributionAt(mid) >= requiredContribution) lo = mid;
    else hi = mid;
  }
  return { maxUnitCost: lo, achievable: true };
}

/**
 * The full sourcing specification implied by a price point and a CAC.
 *
 * @param {import('./economics.js').OrderSpec} spec
 * @param {{ plannedCac: number, requiredFirstOrderProfit?: number }} acquisition
 */
export function sourcingSpecification(spec, acquisition) {
  const required =
    acquisition.plannedCac + (acquisition.requiredFirstOrderProfit ?? 0);

  const { maxUnitCost, achievable } = maxAffordableUnitCost(spec, required);

  // What the economics look like exactly at the ceiling.
  const atCeiling = computeOrderEconomics({
    ...spec,
    unitCost: v(maxUnitCost, 'ESTIMATE', 'at the sourcing ceiling'),
  });
  const targets = computeAcquisitionTargets(atCeiling);

  return {
    achievable,
    maxUnitCost,
    requiredContribution: required,
    plannedCac: acquisition.plannedCac,
    grossMarginAtCeiling: atCeiling.grossMarginPct,
    contributionMarginAtCeiling: atCeiling.contributionMarginPct,
    breakEvenRoasAtCeiling: targets.breakEvenRoas,
    // A supplier quote above this is not a negotiation, it is a no.
    statement: achievable
      ? `Landed cost must stay at or below EUR ${maxUnitCost.toFixed(2)} per unit to leave ` +
        `EUR ${required.toFixed(2)} of contribution at a EUR ${acquisition.plannedCac.toFixed(2)} CAC. ` +
        `Above that the order does not pay for its own acquisition.`
      : `No unit cost works at this price and CAC — the order cannot cover ` +
        `EUR ${required.toFixed(2)} even with free goods. Raise the price, raise units per ` +
        `order, or lower acquisition cost.`,
  };
}

/**
 * Sweep a range of retail prices to find where a product becomes viable.
 * Answers "how high does the price have to be?" rather than assuming one.
 *
 * @param {import('./economics.js').OrderSpec} spec
 * @param {number[]} prices
 * @param {{ plannedCac: number, requiredFirstOrderProfit?: number }} acquisition
 */
export function priceLadder(spec, prices, acquisition) {
  return prices.map((price) => {
    const at = { ...spec, pricePerUnitInclVat: v(price, 'ESTIMATE', 'ladder probe') };
    const s = sourcingSpecification(at, acquisition);
    return {
      priceInclVat: price,
      maxUnitCost: s.maxUnitCost,
      achievable: s.achievable,
      grossMarginAtCeiling: s.grossMarginAtCeiling,
    };
  });
}

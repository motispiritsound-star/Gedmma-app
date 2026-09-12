/**
 * Unit economics engine.
 *
 * Design principle: this module computes, it does not assert. Every number that
 * enters it carries a provenance tag, and every result carries the weakest
 * provenance of everything that fed it. A verdict derived from an unverified
 * supplier cost is therefore visibly an unverified verdict, in code, rather
 * than a confident-looking number in a spreadsheet.
 *
 * VAT treatment is explicit because it is the most common source of silently
 * wrong DTC economics in the EU. A Dutch B2C store advertises VAT-inclusive
 * prices; VAT is never the merchant's revenue. Payment processors, however,
 * charge on the full amount the customer pays, VAT included. Getting either of
 * these backwards moves break-even ROAS by tens of percent.
 *
 * Zero dependencies. Run with `node --test`.
 */

/** @typedef {'FACT'|'ESTIMATE'|'ASSUMPTION'|'UNVERIFIED'} Provenance */

/**
 * @typedef {object} Input
 * @property {number} value
 * @property {Provenance} provenance
 * @property {string} [note]   why this value, or what would verify it
 * @property {string} [source] URL or supplier reference where applicable
 */

/** Provenance ordered from strongest to weakest. */
const PROVENANCE_RANK = ['FACT', 'ESTIMATE', 'ASSUMPTION', 'UNVERIFIED'];

/**
 * Tag a number with where it came from.
 * @param {number} value
 * @param {Provenance} provenance
 * @param {string} [note]
 * @param {string} [source]
 * @returns {Input}
 */
export function v(value, provenance, note, source) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new TypeError(`v() requires a number, received ${String(value)}`);
  }
  if (!PROVENANCE_RANK.includes(provenance)) {
    throw new TypeError(`Unknown provenance "${provenance}"`);
  }
  return { value, provenance, note, source };
}

/**
 * The weakest provenance among the inputs supplied. Results are only as
 * trustworthy as their flimsiest ingredient.
 * @param {Input[]} inputs
 * @returns {Provenance}
 */
export function weakestProvenance(inputs) {
  let worst = 0;
  for (const input of inputs) {
    const rank = PROVENANCE_RANK.indexOf(input.provenance);
    if (rank > worst) worst = rank;
  }
  return /** @type {Provenance} */ (PROVENANCE_RANK[worst]);
}

/** Read an optional Input, defaulting to a zero that does not weaken provenance. */
function read(input) {
  return input ? input.value : 0;
}

/** Collect the Inputs actually present, for provenance roll-up. */
function present(...inputs) {
  return inputs.filter(Boolean);
}

/**
 * @typedef {object} OrderSpec
 * @property {Input} pricePerUnitInclVat  shelf price the customer sees, VAT included
 * @property {Input} unitsPerOrder        average units in an order (drives AOV)
 * @property {Input} vatRate              e.g. 0.21 for Dutch standard btw
 * @property {Input} unitCost             landed cost of goods per unit
 * @property {Input} [inboundPerUnit]     freight + duty amortised per unit, if importing
 * @property {Input} [packagingPerOrder]
 * @property {Input} [pickPackPerOrder]   3PL or supplier fulfilment fee
 * @property {Input} [outboundShipCost]   what carriage actually costs the merchant
 * @property {Input} [shippingChargedInclVat] what the customer pays for shipping
 * @property {Input} [paymentPctFee]      e.g. 0.019
 * @property {Input} [paymentFixedFee]    e.g. 0.25, per transaction
 * @property {Input} [discountRate]       share of gross given away in promos
 * @property {Input} [refundRate]         orders refunded with goods NOT recovered
 * @property {Input} [returnRate]         orders returned with goods recovered saleable
 * @property {Input} [returnShipCost]     merchant's cost to take a return back
 * @property {Input} [restockingLoss]     value lost per returned unit (grading down)
 * @property {Input} [supportCostPerOrder]
 * @property {Input} [commissionRate]     affiliate/creator share of gross
 */

/**
 * Compute per-order economics before any advertising cost.
 *
 * @param {OrderSpec} spec
 * @returns {{
 *   grossInclVat: number, netRevenue: number, vatCollected: number,
 *   costs: Record<string, number>, totalVariableCost: number,
 *   contributionBeforeAds: number, contributionMarginPct: number,
 *   grossMarginPct: number, aovInclVat: number, aovExclVat: number,
 *   provenance: Provenance
 * }}
 */
export function computeOrderEconomics(spec) {
  const price = spec.pricePerUnitInclVat.value;
  const units = spec.unitsPerOrder.value;
  const vatRate = spec.vatRate.value;

  if (units <= 0) throw new RangeError('unitsPerOrder must be positive');
  if (vatRate < 0 || vatRate >= 1) throw new RangeError('vatRate must be in [0,1)');

  const discountRate = read(spec.discountRate);
  const commissionRate = read(spec.commissionRate);

  // What the customer is charged for goods, after promotional giveaway.
  const goodsInclVat = price * units * (1 - discountRate);
  const shippingInclVat = read(spec.shippingChargedInclVat);
  const grossInclVat = goodsInclVat + shippingInclVat;

  // VAT is collected on behalf of the state and is never revenue.
  const netRevenue = grossInclVat / (1 + vatRate);
  const vatCollected = grossInclVat - netRevenue;

  // --- Cost stack -----------------------------------------------------------
  const cogs = (spec.unitCost.value + read(spec.inboundPerUnit)) * units;
  const packaging = read(spec.packagingPerOrder);
  const pickPack = read(spec.pickPackPerOrder);
  const outboundShipping = read(spec.outboundShipCost);

  // Processors charge on the full amount the customer pays, VAT included.
  const payment =
    grossInclVat * read(spec.paymentPctFee) + read(spec.paymentFixedFee);

  // A refund loses the sale and the goods: revenue reverses, but the outbound
  // cost, the fulfilment work and typically the fixed payment fee are sunk.
  const refundRate = read(spec.refundRate);
  const refundLossPerOrder =
    netRevenue - cogs > 0
      ? netRevenue + outboundShipping + pickPack + read(spec.paymentFixedFee)
      : netRevenue;
  const refundProvision = refundRate * refundLossPerOrder;

  // A return recovers saleable goods, so the loss is carriage both ways plus
  // whatever value the item loses on the way back.
  const returnRate = read(spec.returnRate);
  const returnProvision =
    returnRate *
    (outboundShipping +
      read(spec.returnShipCost) +
      read(spec.restockingLoss) * units +
      pickPack);

  const support = read(spec.supportCostPerOrder);
  const commission = grossInclVat * commissionRate;

  const costs = {
    cogs,
    packaging,
    pickPack,
    outboundShipping,
    payment,
    refundProvision,
    returnProvision,
    support,
    commission,
  };

  const totalVariableCost = Object.values(costs).reduce((a, b) => a + b, 0);
  const contributionBeforeAds = netRevenue - totalVariableCost;

  return {
    grossInclVat,
    netRevenue,
    vatCollected,
    costs,
    totalVariableCost,
    contributionBeforeAds,
    contributionMarginPct: contributionBeforeAds / netRevenue,
    grossMarginPct: (netRevenue - cogs) / netRevenue,
    aovInclVat: grossInclVat,
    aovExclVat: netRevenue,
    provenance: weakestProvenance(
      present(
        spec.pricePerUnitInclVat,
        spec.unitsPerOrder,
        spec.vatRate,
        spec.unitCost,
        spec.inboundPerUnit,
        spec.packagingPerOrder,
        spec.pickPackPerOrder,
        spec.outboundShipCost,
        spec.shippingChargedInclVat,
        spec.paymentPctFee,
        spec.paymentFixedFee,
        spec.discountRate,
        spec.refundRate,
        spec.returnRate,
        spec.returnShipCost,
        spec.restockingLoss,
        spec.supportCostPerOrder,
        spec.commissionRate,
      ),
    ),
  };
}

/**
 * Acquisition targets implied by the per-order contribution.
 *
 * `roasBasis` matters and is usually got wrong. Ad platforms report ROAS against
 * whatever purchase value the pixel sends them. A Dutch store that sends the
 * VAT-inclusive order total — the default for most integrations — must compare
 * against a break-even ROAS computed on that same inclusive basis, otherwise the
 * target is flattering by roughly the VAT rate.
 *
 * @param {ReturnType<typeof computeOrderEconomics>} order
 * @param {{ targetContributionShare?: number, roasBasis?: 'inclVat'|'exclVat' }} [opts]
 */
export function computeAcquisitionTargets(order, opts = {}) {
  const targetShare = opts.targetContributionShare ?? 0.35;
  const roasBasis = opts.roasBasis ?? 'inclVat';

  if (targetShare < 0 || targetShare >= 1) {
    throw new RangeError('targetContributionShare must be in [0,1)');
  }

  // Spending the whole contribution breaks even on the first order by definition.
  const breakEvenCac = order.contributionBeforeAds;

  // Keep a share of contribution as profit; spend the rest on acquisition.
  const targetCac = breakEvenCac * (1 - targetShare);

  const revenueBasis =
    roasBasis === 'inclVat' ? order.grossInclVat : order.netRevenue;

  const breakEvenRoas = breakEvenCac > 0 ? revenueBasis / breakEvenCac : Infinity;
  const targetRoas = targetCac > 0 ? revenueBasis / targetCac : Infinity;

  return {
    breakEvenCac,
    targetCac,
    breakEvenRoas,
    targetRoas,
    roasBasis,
    revenueBasis,
    profitable: order.contributionBeforeAds > 0,
    provenance: order.provenance,
  };
}

/**
 * Repeat-purchase economics.
 *
 * Deliberately conservative: later orders are discounted for the fact that a
 * cohort decays and that money arriving in twelve months is worth less than
 * money arriving now. LTV computed without decay is the standard way weak
 * first-order economics get disguised.
 *
 * @param {ReturnType<typeof computeOrderEconomics>} order
 * @param {{ repeatOrdersPerYear: Input, retentionRate: Input, horizonYears?: number, annualDiscountRate?: number }} spec
 */
export function computeLifetimeValue(order, spec) {
  const repeat = spec.repeatOrdersPerYear.value;
  const retention = spec.retentionRate.value;
  const horizon = spec.horizonYears ?? 2;
  const discount = spec.annualDiscountRate ?? 0.15;

  if (retention < 0 || retention > 1) throw new RangeError('retentionRate must be in [0,1]');

  // Year 0 is the acquisition order itself; it is already paid for by CAC.
  let contribution = order.contributionBeforeAds;
  let surviving = 1;

  for (let year = 1; year <= horizon; year += 1) {
    surviving *= retention;
    const discountFactor = 1 / Math.pow(1 + discount, year);
    contribution += order.contributionBeforeAds * repeat * surviving * discountFactor;
  }

  return {
    lifetimeContribution: contribution,
    firstOrderContribution: order.contributionBeforeAds,
    repeatShare:
      contribution > 0
        ? (contribution - order.contributionBeforeAds) / contribution
        : 0,
    horizonYears: horizon,
    provenance: weakestProvenance([
      spec.repeatOrdersPerYear,
      spec.retentionRate,
      { value: 0, provenance: order.provenance },
    ]),
  };
}

/**
 * Payback and LTV:CAC at an assumed achieved CAC.
 * @param {ReturnType<typeof computeLifetimeValue>} ltv
 * @param {number} achievedCac
 */
export function computeReturnOnAcquisition(ltv, achievedCac) {
  if (achievedCac <= 0) throw new RangeError('achievedCac must be positive');
  return {
    ltvToCac: ltv.lifetimeContribution / achievedCac,
    firstOrderProfit: ltv.firstOrderContribution - achievedCac,
    paybackOnFirstOrder: ltv.firstOrderContribution >= achievedCac,
    provenance: ltv.provenance,
  };
}

export { PROVENANCE_RANK };

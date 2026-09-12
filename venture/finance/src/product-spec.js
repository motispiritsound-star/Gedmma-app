/**
 * The canonical cost stack for the padel starter set.
 *
 * Single source of truth. Two generators previously defined the product
 * separately and quoted sourcing ceilings that differed by 12 cents — small, but
 * exactly the kind of drift that makes a document set untrustworthy, because a
 * reader cannot tell which number is current.
 *
 * Every value here is ASSUMPTION or UNVERIFIED. Nothing has been quoted.
 */

import { v } from './economics.js';

/** Cold-traffic CAC derived by the sourcing research from published NL Meta CPM ranges. */
export const CAC_COLD = 27.08;

/** A more optimistic blended figure, assuming community and club traffic contribute. */
export const CAC_BLENDED = 20.0;

/**
 * @param {number} priceInclVat
 * @param {number} [unitCost] landed cost of the complete set; 0 when solving for it
 */
export const starterSet = (priceInclVat, unitCost = 0) => ({
  pricePerUnitInclVat: v(priceInclVat, 'UNVERIFIED', 'no NL retailer page could be opened to observe a price band'),
  unitsPerOrder: v(1, 'ASSUMPTION', 'the set is the default entry SKU'),
  vatRate: v(0.21, 'FACT', 'Dutch standard btw'),
  unitCost: v(unitCost, 'UNVERIFIED', 'solved for, not assumed — no supplier contacted'),
  packagingPerOrder: v(1.8, 'ASSUMPTION', 'branded mailer and insert'),
  pickPackPerOrder: v(2.2, 'ASSUMPTION', 'NL 3PL pick and pack'),
  outboundShipCost: v(5.5, 'ASSUMPTION', 'NL parcel'),
  shippingChargedInclVat: v(0, 'ASSUMPTION', 'free shipping — a policy choice'),
  paymentPctFee: v(0.019, 'ASSUMPTION', 'blended iDEAL/card; iDEAL is typically a cheaper flat fee'),
  paymentFixedFee: v(0.25, 'ASSUMPTION'),
  refundRate: v(0.02, 'ASSUMPTION'),
  returnRate: v(0.06, 'ASSUMPTION', 'no sizing, so well below the ~30% EU apparel norm'),
  returnShipCost: v(6.0, 'ASSUMPTION'),
  restockingLoss: v(2.0, 'ASSUMPTION'),
  warrantyClaimRate: v(0.03, 'ASSUMPTION', 'replacements in months 2-24, when burden of proof is reversed against us'),
  warrantyCostPerClaim: v(25.0, 'ASSUMPTION', 'replacement goods plus carriage both ways'),
  supportCostPerOrder: v(0.9, 'ASSUMPTION'),
});

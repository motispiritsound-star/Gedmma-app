/**
 * What a broker actually charges, which is rarely a percentage.
 *
 * The harness started on a crypto exchange, where commission genuinely is a flat
 * number of basis points and the model is a one-liner. Interactive Brokers is not
 * like that, and the difference decides whether a small account can trade at all:
 * a per-share rate with a floor means the floor, not the rate, is what you pay.
 * At a $0.35 minimum, a €200 order costs 0.175% one way and 0.35% round trip —
 * three and a half times the crypto fee this harness defaulted to — and on a €50
 * order it is 1.4%.
 *
 * So commission is a model rather than a number, the engines ask the model, and
 * the reports print what it cost. Every default here is a starting point to be
 * replaced with the schedule on your own statement: IBKR's rates vary by account
 * type, region, venue and volume tier, and they change.
 */

export type CommissionModel =
  /** A flat rate on notional. Crypto exchanges, and little else. */
  | { kind: 'bps'; bps: number }
  /**
   * A rate per unit traded, with a floor per order and a ceiling expressed as a
   * share of the order's value. This is the shape IBKR uses for shares, and the
   * floor is the part that decides whether small orders are viable.
   */
  | {
      kind: 'per-unit';
      perUnit: number;
      minimumPerOrder: number;
      /** Ceiling as a fraction of notional. IBKR caps share commission at 1%. */
      maxFractionOfNotional: number;
    }
  /** A flat amount per order, whatever the size. */
  | { kind: 'per-order'; amount: number }
  /** Futures and options: a rate per contract with a floor. */
  | { kind: 'per-contract'; perContract: number; minimumPerOrder: number };

/** A flat basis-point rate, for exchanges that charge one. */
export function bpsCommission(bps: number): CommissionModel {
  return { kind: 'bps', bps };
}

/**
 * IBKR's tiered US share schedule, as of writing: $0.0035 per share, $0.35
 * minimum per order, capped at 1% of trade value.
 *
 * Check your own statement before trusting this. The fixed schedule is $0.005 per
 * share with a $1.00 minimum, European venues are priced differently with their
 * own minimums in local currency, and all of it changes.
 */
export function ibkrTieredShares(): CommissionModel {
  return { kind: 'per-unit', perUnit: 0.0035, minimumPerOrder: 0.35, maxFractionOfNotional: 0.01 };
}

/** IBKR's fixed US share schedule: $0.005 per share, $1.00 minimum, 1% cap. */
export function ibkrFixedShares(): CommissionModel {
  return { kind: 'per-unit', perUnit: 0.005, minimumPerOrder: 1, maxFractionOfNotional: 0.01 };
}

/** What one fill costs. `quantity` is in units of the instrument. */
export function commissionFor(model: CommissionModel, quantity: number, price: number): number {
  const units = Math.abs(quantity);
  const notional = units * Math.abs(price);
  if (units === 0 || notional === 0) return 0;

  switch (model.kind) {
    case 'bps':
      return notional * (model.bps / 10_000);
    case 'per-order':
      return Math.min(model.amount, notional);
    case 'per-contract':
      return Math.max(model.minimumPerOrder, units * model.perContract);
    case 'per-unit': {
      const floored = Math.max(model.minimumPerOrder, units * model.perUnit);
      // The cap is applied after the floor, which is why a very small order pays
      // the cap rather than the floor. Reversing the two overstates what tiny
      // trades cost and understates how badly the floor bites medium ones.
      return Math.min(floored, notional * model.maxFractionOfNotional);
    }
  }
}

/**
 * The largest share of a given notional this model can charge.
 *
 * Used to hold back enough cash for the commission on a fully invested entry. For
 * a floor-based model that fraction depends on the size of the order, so the
 * notional has to be passed in rather than assumed away.
 */
export function maxFractionOfNotional(model: CommissionModel, notional: number): number {
  if (notional <= 0) return 0;
  switch (model.kind) {
    case 'bps':
      return model.bps / 10_000;
    case 'per-order':
      return Math.min(1, model.amount / notional);
    case 'per-contract':
      // Without a contract price there is no way to bound this as a fraction, so
      // the floor against the whole notional is the honest worst case.
      return Math.min(1, model.minimumPerOrder / notional);
    case 'per-unit':
      return Math.min(model.maxFractionOfNotional, Math.max(model.minimumPerOrder / notional, 0));
  }
}

/** A one-line summary, for the source line reports print above the numbers. */
export function describeCommission(model: CommissionModel): string {
  switch (model.kind) {
    case 'bps':
      return `${model.bps} bps of notional`;
    case 'per-order':
      return `${model.amount.toFixed(2)} per order`;
    case 'per-contract':
      return `${model.perContract.toFixed(4)}/contract, min ${model.minimumPerOrder.toFixed(2)}`;
    case 'per-unit':
      return (
        `${model.perUnit.toFixed(4)}/unit, min ${model.minimumPerOrder.toFixed(2)}, ` +
        `capped at ${(model.maxFractionOfNotional * 100).toFixed(2)}% of notional`
      );
  }
}

/**
 * How much of a position a round trip consumes under this model.
 *
 * This exists to be printed unprompted when the number is embarrassing. A
 * strategy has to earn this back before it has made anything, and at small order
 * sizes the figure is usually larger than any edge it could plausibly have.
 */
export function roundTripDrag(
  model: CommissionModel,
  orderNotional: number,
  price: number,
): number {
  if (orderNotional <= 0 || price <= 0) return 0;
  const quantity = orderNotional / price;
  return (2 * commissionFor(model, quantity, price)) / orderNotional;
}

import { add, applyPercentage, money, multiply, type Money } from '../lib/money.ts';

/**
 * Dutch consumer prices are quoted including VAT, so `priceCents` on a product
 * is the gross price. Tax is therefore *extracted* from the total rather than
 * added to it: 21% VAT inside a gross amount is `gross * 21 / 121`.
 */
export const VAT_RATE_PERCENT = 21;

export interface PriceLine {
  readonly sku: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly total: Money;
}

export interface PriceBreakdown {
  readonly lines: readonly PriceLine[];
  readonly subtotal: Money;
  readonly shipping: Money;
  /** VAT contained in `total`, for the invoice. Not added on top. */
  readonly tax: Money;
  readonly total: Money;
}

export function line(input: {
  sku: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}): PriceLine {
  const unitPrice = money(input.unitPriceCents);
  return {
    sku: input.sku,
    name: input.name,
    quantity: input.quantity,
    unitPrice,
    total: multiply(unitPrice, input.quantity),
  };
}

export function priceOrder(lines: readonly PriceLine[], shippingCents: number): PriceBreakdown {
  const subtotal = lines.reduce<Money>((total, item) => add(total, item.total), money(0));
  const shipping = money(shippingCents);
  const total = add(subtotal, shipping);
  // gross * rate / (100 + rate), expressed with the shared rounding helper.
  const tax = applyPercentage(total, (VAT_RATE_PERCENT * 100) / (100 + VAT_RATE_PERCENT));
  return { lines, subtotal, shipping, tax, total };
}

/** Estimated parcel weight, used only to get a shipping quote. */
export function estimateParcelGrams(boxCount: number): number {
  const PACKAGING_GRAMS = 180;
  const BOX_GRAMS = 900;
  return PACKAGING_GRAMS + BOX_GRAMS * Math.max(boxCount, 1);
}

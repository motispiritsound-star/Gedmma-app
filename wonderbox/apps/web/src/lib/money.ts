/**
 * Money is an integer number of minor units plus a currency. There is no
 * floating point anywhere in the commerce path: cents in, cents out, and the
 * only rounding happens in one documented place (`applyPercentage`).
 */

export type Currency = 'EUR';

export interface Money {
  readonly cents: number;
  readonly currency: Currency;
}

export class CurrencyMismatchError extends Error {
  constructor(a: Currency, b: Currency) {
    super(`Cannot combine ${a} with ${b}`);
    this.name = 'CurrencyMismatchError';
  }
}

export function money(cents: number, currency: Currency = 'EUR'): Money {
  if (!Number.isInteger(cents)) {
    throw new TypeError(`Money must be whole minor units, received ${cents}`);
  }
  return { cents, currency };
}

export const zero = (currency: Currency = 'EUR'): Money => money(0, currency);

export function add(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  return money(a.cents + b.cents, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new CurrencyMismatchError(a.currency, b.currency);
  return money(a.cents - b.cents, a.currency);
}

export function multiply(a: Money, quantity: number): Money {
  if (!Number.isInteger(quantity)) {
    throw new TypeError(`Quantity must be a whole number, received ${quantity}`);
  }
  return money(a.cents * quantity, a.currency);
}

export function sum(values: readonly Money[], currency: Currency = 'EUR'): Money {
  return values.reduce<Money>((total, value) => add(total, value), zero(currency));
}

/**
 * Applies a percentage (e.g. 21 for Dutch VAT) using half-up rounding, which is
 * what Dutch invoicing expects. Isolated here so every call site rounds alike.
 */
export function applyPercentage(value: Money, percentage: number): Money {
  const raw = (value.cents * percentage) / 100;
  return money(Math.round(raw), value.currency);
}

const FORMATTERS = new Map<string, Intl.NumberFormat>();

export function formatMoney(value: Money, locale = 'nl-NL'): string {
  const key = `${locale}:${value.currency}`;
  let formatter = FORMATTERS.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: value.currency });
    FORMATTERS.set(key, formatter);
  }
  return formatter.format(value.cents / 100);
}

/** Convenience for rendering a bare cents column straight out of the database. */
export function formatCents(cents: number, currency: Currency = 'EUR', locale = 'nl-NL'): string {
  return formatMoney(money(cents, currency), locale);
}

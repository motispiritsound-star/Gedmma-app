import { DEFAULT_LOCALE, type Locale } from './locales.js';

/** Every amount in Buurklus is stored as an integer number of cents. */
export const CURRENCY = 'EUR' as const;
export const CENTS_PER_EURO = 100;

/** The standard Dutch VAT rate, applied to professional subscriptions. */
export const VAT_RATE = 0.21;

export function eurosToCents(euros: number): number {
  return Math.round(euros * CENTS_PER_EURO);
}

export function centsToEuros(cents: number): number {
  return cents / CENTS_PER_EURO;
}

const LOCALE_TAGS: Record<Locale, string> = {
  nl: 'nl-NL',
  en: 'en-NL',
};

/** Formats cents as a currency string, e.g. `€ 1.250,00`. */
export function formatCents(
  cents: number,
  locale: Locale = DEFAULT_LOCALE,
  options: { withDecimals?: boolean } = {},
): string {
  const { withDecimals = true } = options;
  const fractionDigits = withDecimals ? 2 : 0;
  return new Intl.NumberFormat(LOCALE_TAGS[locale] ?? LOCALE_TAGS[DEFAULT_LOCALE], {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(centsToEuros(cents));
}

/** Renders a job budget range, collapsing to a single value when both ends match. */
export function formatBudgetRange(
  minCents: number | null | undefined,
  maxCents: number | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string | null {
  const opts = { withDecimals: false } as const;
  if (minCents != null && maxCents != null) {
    if (minCents === maxCents) return formatCents(minCents, locale, opts);
    return `${formatCents(minCents, locale, opts)} – ${formatCents(maxCents, locale, opts)}`;
  }
  if (minCents != null) return formatCents(minCents, locale, opts);
  if (maxCents != null) return formatCents(maxCents, locale, opts);
  return null;
}

export interface VatBreakdown {
  /** Amount excluding tax — "exclusief btw" on a Dutch invoice. */
  netCents: number;
  vatCents: number;
  /** Amount including tax — "inclusief btw". */
  grossCents: number;
  vatRate: number;
}

/** Splits a tax-exclusive price into the ex-btw / btw / incl-btw invoice lines. */
export function applyVat(netCents: number, rate: number = VAT_RATE): VatBreakdown {
  const vatCents = Math.round(netCents * rate);
  return {
    netCents,
    vatCents,
    grossCents: netCents + vatCents,
    vatRate: rate,
  };
}

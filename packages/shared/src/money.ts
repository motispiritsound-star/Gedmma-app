import { DEFAULT_LOCALE, type Locale } from './locales.js';

/** Every amount in Khidma is stored as an integer number of centimes (MAD/100). */
export const CURRENCY = 'MAD' as const;
export const CENTIMES_PER_DIRHAM = 100;

/** Standard Moroccan VAT rate applied to professional subscriptions. */
export const VAT_RATE = 0.2;

export function dirhamsToCentimes(dirhams: number): number {
  return Math.round(dirhams * CENTIMES_PER_DIRHAM);
}

export function centimesToDirhams(centimes: number): number {
  return centimes / CENTIMES_PER_DIRHAM;
}

const LOCALE_TAGS: Record<Locale, string> = {
  fr: 'fr-MA',
  ar: 'ar-MA',
  en: 'en-MA',
};

/** Formats centimes as a currency string, e.g. `1 250,00 MAD`. */
export function formatCentimes(
  centimes: number,
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
  }).format(centimesToDirhams(centimes));
}

/** Renders a job budget range, collapsing to a single value when both ends match. */
export function formatBudgetRange(
  minCentimes: number | null | undefined,
  maxCentimes: number | null | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string | null {
  const opts = { withDecimals: false } as const;
  if (minCentimes != null && maxCentimes != null) {
    if (minCentimes === maxCentimes) return formatCentimes(minCentimes, locale, opts);
    return `${formatCentimes(minCentimes, locale, opts)} – ${formatCentimes(maxCentimes, locale, opts)}`;
  }
  if (minCentimes != null) return formatCentimes(minCentimes, locale, opts);
  if (maxCentimes != null) return formatCentimes(maxCentimes, locale, opts);
  return null;
}

export interface VatBreakdown {
  /** Amount excluding tax — "hors taxes" on a Moroccan invoice. */
  netCentimes: number;
  vatCentimes: number;
  /** Amount including tax — "toutes taxes comprises". */
  grossCentimes: number;
  vatRate: number;
}

/** Splits a tax-exclusive price into the HT / TVA / TTC lines of an invoice. */
export function applyVat(netCentimes: number, rate: number = VAT_RATE): VatBreakdown {
  const vatCentimes = Math.round(netCentimes * rate);
  return {
    netCentimes,
    vatCentimes,
    grossCentimes: netCentimes + vatCentimes,
    vatRate: rate,
  };
}

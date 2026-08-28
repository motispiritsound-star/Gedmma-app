/**
 * Buurklus ships Dutch first and English second. English serves expats,
 * international students and the many tradespeople in the Netherlands who work
 * in English before they work in Dutch.
 */
export const SUPPORTED_LOCALES = ['nl', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'nl';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Picks the best supported locale from an `Accept-Language` header or from the
 * device locale list reported by expo-localization (e.g. `['nl-NL', 'en']`).
 */
export function resolveLocale(candidates: readonly string[] | string | null | undefined): Locale {
  if (!candidates) return DEFAULT_LOCALE;
  const list = typeof candidates === 'string' ? candidates.split(',') : candidates;
  for (const raw of list) {
    const tag = raw.split(';')[0]?.trim().toLowerCase();
    if (!tag) continue;
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

/** A translatable label carried by catalog rows that live in code, not in the DB. */
export type LocalizedText = Record<Locale, string>;

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text[DEFAULT_LOCALE];
}

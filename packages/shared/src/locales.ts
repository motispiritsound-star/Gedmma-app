/**
 * Khidma ships French first (the language of business and administration in
 * Morocco), Arabic second (Modern Standard Arabic, right-to-left) and English
 * third for expatriates and tourists.
 */
export const SUPPORTED_LOCALES = ['fr', 'ar', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

/** Locales written right-to-left. Drives `I18nManager.forceRTL` in the app. */
export const RTL_LOCALES: readonly Locale[] = ['ar'];

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Picks the best supported locale from an `Accept-Language` header or from the
 * device locale list reported by expo-localization (e.g. `['fr-MA', 'ar']`).
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

import { z } from 'zod';

export const SUPPORTED_LOCALES = ['nl', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LocaleSchema = z.enum(SUPPORTED_LOCALES);

/**
 * The fallback chain. Dutch is the launch market and English is the universal
 * backstop, so `nl -> en` and `en -> nl`: a child never hits silence because a
 * translator was behind.
 */
export const FALLBACK_CHAIN: Record<Locale, readonly Locale[]> = {
  nl: ['nl', 'en'],
  en: ['en', 'nl'],
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Picks the best supported locale from an Accept-Language header. */
export function negotiateLocale(header: string | null | undefined, fallback: Locale): Locale {
  if (!header) return fallback;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.find((p) => p.trim().startsWith('q='));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split('=')[1]) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }
  return fallback;
}

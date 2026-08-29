import { dictionaries, type Locale, type MessageKey } from './dictionaries';

export const LOCALES = ['nl', 'en'] as const satisfies readonly Locale[];
export const DEFAULT_LOCALE: Locale = 'nl';

export type { Locale, MessageKey };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function toDbLocale(locale: Locale): 'NL' | 'EN' {
  return locale === 'nl' ? 'NL' : 'EN';
}

export function fromDbLocale(locale: 'NL' | 'EN'): Locale {
  return locale === 'NL' ? 'nl' : 'en';
}

/** Translate a UI key, interpolating {placeholders}. Missing keys are loud. */
export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>): string {
  const table = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const raw: string = table[key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export type Translator = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function translator(locale: Locale): Translator {
  return (key, vars) => translate(locale, key, vars);
}

/** Negotiates a locale from an Accept-Language header. */
export function negotiateLocale(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const parts = header
    .split(',')
    .map((entry) => {
      const [tag, q] = entry.trim().split(';q=');
      return { tag: (tag ?? '').toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const part of parts) {
    if (part.tag.startsWith('nl')) return 'nl';
    if (part.tag.startsWith('en')) return 'en';
  }
  return DEFAULT_LOCALE;
}

import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isRtl, resolveLocale } from '@khidma/shared';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import en from './locales/en.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = `${prefix}${key}`;
    if (typeof value === 'string') keys.add(path);
    else for (const nested of flatten(value, `${path}.`)) keys.add(nested);
  }
  return keys;
}

/** i18next resolves `foo_one` / `foo_other` from a lookup of `foo`. */
const isPluralVariant = (key: string) => /_(one|two|few|many|other|zero)$/.test(key);

describe('translations', () => {
  const bundles: Record<string, Tree> = { fr: fr as Tree, ar: ar as Tree, en: en as Tree };

  it('ships a bundle for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(bundles[locale]).toBeDefined();
    }
  });

  it('keeps Arabic and English key-for-key with French', () => {
    const french = flatten(bundles.fr!);
    expect(french.size).toBeGreaterThan(250);

    for (const locale of ['ar', 'en'] as const) {
      const other = flatten(bundles[locale]!);
      const missing = [...french].filter((key) => !other.has(key) && !isPluralVariant(key));
      const extra = [...other].filter((key) => !french.has(key) && !isPluralVariant(key));
      expect({ locale, missing, extra }).toEqual({ locale, missing: [], extra: [] });
    }
  });

  it('never leaves a translation empty', () => {
    for (const [locale, bundle] of Object.entries(bundles)) {
      for (const key of flatten(bundle)) {
        const value = key.split('.').reduce<unknown>(
          (node, part) => (node as Record<string, unknown>)?.[part],
          bundle,
        );
        expect(typeof value === 'string' && value.trim().length > 0, `${locale}.${key}`).toBe(true);
      }
    }
  });

  it('uses the same interpolation placeholders in every language', () => {
    const placeholders = (value: string) =>
      (value.match(/\{\{(\w+)\}\}/g) ?? []).map((match) => match.slice(2, -2)).sort();

    const read = (bundle: Tree, key: string) =>
      key.split('.').reduce<unknown>(
        (node, part) => (node as Record<string, unknown>)?.[part],
        bundle,
      ) as string | undefined;

    for (const key of flatten(bundles.fr!)) {
      if (isPluralVariant(key)) continue;
      const expected = placeholders(read(bundles.fr!, key) ?? '');
      for (const locale of ['ar', 'en'] as const) {
        const actual = placeholders(read(bundles[locale]!, key) ?? '');
        expect(actual, `${locale}.${key}`).toEqual(expected);
      }
    }
  });
});

describe('locale resolution', () => {
  it('reads the device locale list the way expo-localization reports it', () => {
    expect(resolveLocale(['fr-MA', 'ar-MA'])).toBe('fr');
    expect(resolveLocale(['ar-MA', 'fr-FR'])).toBe('ar');
    expect(resolveLocale(['en-US'])).toBe('en');
  });

  it('falls back to French for a language Khidma does not ship', () => {
    expect(resolveLocale(['es-ES', 'de-DE'])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
  });

  it('marks only Arabic as right-to-left', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('fr')).toBe(false);
    expect(isRtl('en')).toBe(false);
  });
});

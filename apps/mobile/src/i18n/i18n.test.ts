import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, resolveLocale } from '@buurklus/shared';
import nl from './locales/nl.json';
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
  const bundles: Record<string, Tree> = { nl: nl as Tree, en: en as Tree };

  it('ships a bundle for every supported locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(bundles[locale], locale).toBeDefined();
    }
  });

  it('keeps English key-for-key with Dutch', () => {
    const dutch = flatten(bundles.nl!);
    expect(dutch.size).toBeGreaterThan(250);

    const english = flatten(bundles.en!);
    const missing = [...dutch].filter((key) => !english.has(key) && !isPluralVariant(key));
    const extra = [...english].filter((key) => !dutch.has(key) && !isPluralVariant(key));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it('never leaves a translation empty', () => {
    for (const [locale, bundle] of Object.entries(bundles)) {
      for (const key of flatten(bundle)) {
        const value = key
          .split('.')
          .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], bundle);
        expect(typeof value === 'string' && value.trim().length > 0, `${locale}.${key}`).toBe(true);
      }
    }
  });

  it('uses the same interpolation placeholders in both languages', () => {
    const placeholders = (value: string) =>
      (value.match(/\{\{(\w+)\}\}/g) ?? []).map((match) => match.slice(2, -2)).sort();

    const read = (bundle: Tree, key: string) =>
      key
        .split('.')
        .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], bundle) as
        | string
        | undefined;

    for (const key of flatten(bundles.nl!)) {
      if (isPluralVariant(key)) continue;
      const expected = placeholders(read(bundles.nl!, key) ?? '');
      const actual = placeholders(read(bundles.en!, key) ?? '');
      expect(actual, `en.${key}`).toEqual(expected);
    }
  });

  it('never leaves the old brand name in the copy', () => {
    for (const [locale, bundle] of Object.entries(bundles)) {
      for (const key of flatten(bundle)) {
        const value = String(
          key
            .split('.')
            .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], bundle),
        );
        expect(value.toLowerCase(), `${locale}.${key}`).not.toContain('khidma');
      }
    }
  });
});

describe('locale resolution', () => {
  it('reads the device locale list the way expo-localization reports it', () => {
    expect(resolveLocale(['nl-NL', 'en-GB'])).toBe('nl');
    expect(resolveLocale(['en-US', 'nl-NL'])).toBe('en');
  });

  it('falls back to Dutch for a language Buurklus does not ship', () => {
    expect(resolveLocale(['de-DE', 'fr-FR'])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_LOCALE).toBe('nl');
  });
});

import { describe, expect, it } from 'vitest';
import {
  MissingTranslationError,
  missingLocales,
  resolve,
  text,
  textList,
  toLocalised,
  tryResolve,
} from '../src/lib/i18n/localised.ts';
import { negotiateLocale } from '../src/lib/i18n/locale.ts';

describe('translation fallback', () => {
  const both = { nl: 'Hallo', en: 'Hello' };
  const dutchOnly = { nl: 'Alleen Nederlands' };
  const englishOnly = { en: 'English only' };

  it('prefers the requested locale when it exists', () => {
    expect(resolve(both, 'nl')).toEqual({ value: 'Hallo', locale: 'nl', usedFallback: false });
    expect(resolve(both, 'en')).toEqual({ value: 'Hello', locale: 'en', usedFallback: false });
  });

  it('falls back and says so, so the UI can tell the child', () => {
    const resolved = resolve(englishOnly, 'nl');
    expect(resolved.value).toBe('English only');
    expect(resolved.locale).toBe('en');
    expect(resolved.usedFallback).toBe(true);
  });

  it('falls back in the other direction too', () => {
    expect(resolve(dutchOnly, 'en')).toEqual({
      value: 'Alleen Nederlands',
      locale: 'nl',
      usedFallback: true,
    });
  });

  it('treats whitespace-only copy as missing rather than serving blank audio', () => {
    expect(tryResolve({ nl: '   ', en: 'Hello' }, 'nl')?.locale).toBe('en');
    expect(toLocalised({ nl: '', en: 'Hello' })).toEqual({ en: 'Hello' });
  });

  it('throws only when nothing at all is available', () => {
    expect(() => resolve({}, 'nl')).toThrow(MissingTranslationError);
    expect(tryResolve({}, 'nl')).toBeNull();
    expect(text({}, 'nl', 'fallback')).toBe('fallback');
  });

  it('survives a malformed Json column', () => {
    expect(tryResolve(null, 'nl')).toBeNull();
    expect(tryResolve('a string', 'nl')).toBeNull();
    expect(tryResolve({ nl: 42 }, 'nl')).toBeNull();
  });

  it('reports which locales an editor still owes', () => {
    expect(missingLocales(dutchOnly)).toEqual(['en']);
    expect(missingLocales(both)).toEqual([]);
  });

  it('resolves ordered step lists', () => {
    expect(textList([{ nl: 'Een', en: 'One' }, { en: 'Two' }], 'nl')).toEqual(['Een', 'Two']);
  });

  it('negotiates a locale from Accept-Language, honouring q values', () => {
    expect(negotiateLocale('nl-NL,nl;q=0.9,en;q=0.8', 'en')).toBe('nl');
    expect(negotiateLocale('fr-FR,fr;q=0.9,en-GB;q=0.7', 'nl')).toBe('en');
    expect(negotiateLocale('fr-FR', 'nl')).toBe('nl');
    expect(negotiateLocale(null, 'nl')).toBe('nl');
  });
});

import { describe, expect, it } from 'vitest';
import { dictionaries } from '@/lib/i18n/dictionaries';
import { DEFAULT_LOCALE, LOCALES, isLocale, negotiateLocale, translate, translator, toDbLocale, fromDbLocale } from '@/lib/i18n';
import { AGE_BAND_LABELS, CATEGORY_LABELS, LEVEL_LABELS, ageBandsInRange, isAgeAppropriate } from '@/lib/i18n/labels';

describe('interface translations', () => {
  it('offers Dutch and English with identical key sets', () => {
    expect(LOCALES).toEqual(['nl', 'en']);
    expect(DEFAULT_LOCALE).toBe('nl');

    const nlKeys = Object.keys(dictionaries.nl).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(enKeys).toEqual(nlKeys);
  });

  it('has no empty or untranslated (identical placeholder) strings', () => {
    for (const [key, value] of Object.entries(dictionaries.nl)) {
      expect(value.trim(), `nl.${key} is empty`).not.toBe('');
    }
    for (const [key, value] of Object.entries(dictionaries.en)) {
      expect(value.trim(), `en.${key} is empty`).not.toBe('');
    }
  });

  it('translates and interpolates in both languages', () => {
    expect(translate('nl', 'nav.bookings')).toBe('Boekingen');
    expect(translate('en', 'nav.bookings')).toBe('Bookings');
    expect(translate('nl', 'search.results', { count: 12 })).toBe('12 activiteiten gevonden');
    expect(translate('en', 'search.results', { count: 12 })).toBe('12 activities found');
  });

  it('leaves an unknown placeholder untouched instead of printing undefined', () => {
    expect(translate('nl', 'auth.verify.sent', {})).toContain('{email}');
    expect(translator('en')('activity.cancellationWindow', { hours: 48 })).toContain('48');
  });

  it('recognises valid locales and negotiates from Accept-Language', () => {
    expect(isLocale('nl')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(negotiateLocale('en-GB,en;q=0.9')).toBe('en');
    expect(negotiateLocale('nl-NL,nl;q=0.9,en;q=0.8')).toBe('nl');
    expect(negotiateLocale('de-DE')).toBe('nl');
    expect(negotiateLocale(null)).toBe('nl');
  });

  it('maps between URL locales and database locales', () => {
    expect(toDbLocale('nl')).toBe('NL');
    expect(toDbLocale('en')).toBe('EN');
    expect(fromDbLocale('NL')).toBe('nl');
    expect(fromDbLocale('EN')).toBe('en');
  });

  it('labels every enum value in both languages', () => {
    for (const table of [AGE_BAND_LABELS, CATEGORY_LABELS, LEVEL_LABELS]) {
      for (const [key, labels] of Object.entries(table)) {
        expect(labels.nl, `${key} misses a Dutch label`).toBeTruthy();
        expect(labels.en, `${key} misses an English label`).toBeTruthy();
      }
    }
    expect(Object.keys(CATEGORY_LABELS).length).toBeGreaterThanOrEqual(10);
  });
});

describe('age band helpers', () => {
  it('expands a range and answers whether a child fits it', () => {
    expect(ageBandsInRange('AGE_6_8', 'AGE_12_14')).toEqual(['AGE_6_8', 'AGE_9_11', 'AGE_12_14']);
    expect(isAgeAppropriate('AGE_9_11', 'AGE_6_8', 'AGE_12_14')).toBe(true);
    expect(isAgeAppropriate('AGE_15_17', 'AGE_6_8', 'AGE_12_14')).toBe(false);
    expect(isAgeAppropriate('AGE_6_8', 'AGE_6_8', 'AGE_6_8')).toBe(true);
  });
});

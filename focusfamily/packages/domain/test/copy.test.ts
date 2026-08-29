import { describe, expect, it } from 'vitest';
import {
  NON_DIAGNOSTIC_BLOCKLIST,
  NON_SHAMING_BLOCKLIST,
  allCopy,
  assertNonDiagnostic,
  auditCopy,
  catalogues,
  createTranslator,
  en,
  missingKeys,
  nl,
  translate,
} from '../src/index.js';

describe('the shipped copy', () => {
  it('contains no clinical framing and no shaming, in either language', () => {
    const violations = auditCopy(allCopy());
    expect(
      violations,
      violations.map((v) => `${v.key}: "${v.term}" (${v.list})`).join('\n'),
    ).toEqual([]);
  });

  it('has the same keys in Dutch and English', () => {
    expect(missingKeys('nl')).toEqual([]);
    expect(Object.keys(nl).sort()).toEqual(Object.keys(en).sort());
  });

  it('has no empty strings', () => {
    for (const [key, value] of Object.entries(allCopy())) {
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });

  it('actually blocks the words we say we block', () => {
    for (const term of [...NON_DIAGNOSTIC_BLOCKLIST, ...NON_SHAMING_BLOCKLIST]) {
      expect(() => assertNonDiagnostic(`Something ${term} here`)).toThrowError(
        /clinical_or_shaming/,
      );
    }
  });

  it('does not trip over a blocked term inside an ordinary word', () => {
    // "lui" is blocked on its own; "luisteren" (to listen) must be fine.
    expect(() => assertNonDiagnostic('We blijven naar elkaar luisteren.')).not.toThrow();
    expect(() => assertNonDiagnostic('Straatverlichting en strafschop')).not.toThrow();
  });
});

describe('translation', () => {
  it('falls back to the key rather than crashing a screen', () => {
    expect(translate('nl', 'this.key.does.not.exist')).toBe('this.key.does.not.exist');
  });

  it('translates the same key differently per locale', () => {
    expect(translate('nl', 'app.tagline')).not.toBe(translate('en', 'app.tagline'));
    expect(translate('nl', 'source.simulated.label')).toBe('Voorbeeldgegevens');
    expect(translate('en', 'source.simulated.label')).toBe('Example data');
  });

  it('substitutes parameters', () => {
    expect(translate('en', 'Hello {name}', { name: 'Sam' })).toBe('Hello Sam');
  });

  it('exposes a bound translator', () => {
    const t = createTranslator('nl');
    expect(t('focus.start')).toBe('Samen starten');
  });

  it('ships exactly two locales', () => {
    expect(Object.keys(catalogues).sort()).toEqual(['en', 'nl']);
  });
});

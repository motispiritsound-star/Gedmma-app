import { describe, expect, it } from 'vitest';
import {
  ANONYMISED,
  CURRENT_AGREEMENTS,
  DATA_REQUEST_DEADLINE_DAYS,
  LEGAL_DOCUMENTS,
  LEGAL_PAGES,
  MINIMUM_AGE,
  OPERATOR,
  RETENTION,
  RETENTION_BY_KEY,
  SUPERVISORY_AUTHORITY,
  documentVersion,
  legalPage,
  legalPath,
  missingOperatorFields,
  retentionCutoff,
  retentionDays,
} from './legal.js';
import { SUPPORTED_LOCALES } from './locales.js';

describe('legal documents', () => {
  it('versions every page with a date, so the record says which text', () => {
    for (const document of LEGAL_PAGES) {
      expect(document.version, document.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // A version that is not a real date would sort and compare wrongly.
      expect(Number.isNaN(Date.parse(document.version)), document.key).toBe(false);
    }
  });

  it('points every page at a locale-prefixed path on the site', () => {
    for (const page of LEGAL_PAGES) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(page.paths[locale], `${page.key}.${locale}`).toMatch(
          new RegExp(`^/${locale}/[a-z-]+/$`),
        );
        expect(legalPath(page.key, locale)).toBe(page.paths[locale]);
      }
    }
  });

  it('asks people to agree to the terms and the privacy statement, not to a cookie page', () => {
    expect(LEGAL_DOCUMENTS.map((page) => page.key).sort()).toEqual(['PRIVACY', 'TERMS']);
    expect(LEGAL_PAGES.length).toBeGreaterThan(LEGAL_DOCUMENTS.length);
  });

  it('agrees with itself about what is current', () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(CURRENT_AGREEMENTS[document.key]).toBe(document.version);
      expect(documentVersion(document.key)).toBe(document.version);
    }
  });

  it('refuses a page nobody wrote', () => {
    // @ts-expect-error -- the point is what happens when a caller ignores the type.
    expect(() => legalPage('REFUND_POLICY')).toThrow();
  });
});

describe('the retention schedule', () => {
  it('gives every rule a reason, in every language', () => {
    for (const rule of RETENTION) {
      for (const locale of SUPPORTED_LOCALES) {
        // A period with no stated reason is a number somebody made up, and it
        // is the first thing a supervisory authority asks about.
        expect(rule.reason[locale]?.length ?? 0, `${rule.key}.${locale}`).toBeGreaterThan(30);
      }
    }
  });

  it('has one rule per key', () => {
    expect(RETENTION_BY_KEY.size).toBe(RETENTION.length);
  });

  it('keeps the fiscal record longest, because the law says so', () => {
    const longest = RETENTION.reduce((max, rule) => (rule.days > max.days ? rule : max));
    expect(longest.key).toBe('invoice');
    expect(retentionDays('invoice')).toBe(7 * 365);
  });

  it('deletes a sign-in code within a day of it being useless', () => {
    expect(retentionDays('otpChallenge')).toBe(1);
  });

  it('turns a rule into a cut-off in the past', () => {
    const now = new Date('2026-08-28T12:00:00Z');
    expect(retentionCutoff('otpChallenge', now).toISOString()).toBe('2026-08-27T12:00:00.000Z');
    expect(retentionCutoff('notification', now).getTime()).toBeLessThan(now.getTime());
  });

  it('refuses a rule that does not exist rather than sweeping everything', () => {
    // A silent zero here would set the cut-off to now and delete the lot.
    expect(() => retentionDays('nonsense')).toThrow();
    expect(() => retentionCutoff('nonsense')).toThrow();
  });
});

describe('the rest of the legal surface', () => {
  it('sets the minimum age to the Dutch figure', () => {
    expect(MINIMUM_AGE).toBe(16);
  });

  it('answers a data request inside the month the GDPR allows', () => {
    expect(DATA_REQUEST_DEADLINE_DAYS).toBeLessThanOrEqual(31);
  });

  it('uses a placeholder nobody could mistake for real data', () => {
    expect(ANONYMISED.length).toBeGreaterThan(0);
    expect(ANONYMISED).not.toMatch(/^\s*$/);
  });
});

describe('who is responsible', () => {
  it('invents nothing it does not know', () => {
    // A made-up KvK number or address on a published privacy statement is
    // worse than an empty one, because it reads as answered.
    for (const field of missingOperatorFields()) {
      expect(OPERATOR[field], field).toBeNull();
    }
  });

  it('names what still has to be filled in before this is published', () => {
    // Fails, correctly, on the day someone fills them in and forgets to
    // update whatever else assumes they are missing.
    expect(missingOperatorFields()).toEqual(['legalName', 'kvk', 'address', 'email']);
    expect(missingOperatorFields({ ...OPERATOR, legalName: 'Buurklus B.V.' })).not.toContain(
      'legalName',
    );
  });

  it('points people at the authority they can complain to', () => {
    expect(SUPERVISORY_AUTHORITY.url).toMatch(/^https:\/\/autoriteitpersoonsgegevens\.nl\//);
  });
});

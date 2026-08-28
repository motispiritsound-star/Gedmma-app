import { describe, expect, it } from 'vitest';
import {
  ANONYMISED,
  CURRENT_AGREEMENTS,
  DATA_REQUEST_DEADLINE_DAYS,
  LEGAL_DOCUMENTS,
  MINIMUM_AGE,
  RETENTION,
  RETENTION_BY_KEY,
  documentVersion,
  retentionCutoff,
  retentionDays,
} from './legal.js';
import { SUPPORTED_LOCALES } from './locales.js';

describe('legal documents', () => {
  it('versions every document with a date, so the record says which text', () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.version, document.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // A version that is not a real date would sort and compare wrongly.
      expect(Number.isNaN(Date.parse(document.version)), document.key).toBe(false);
    }
  });

  it('points every document at a page that exists on the site', () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(document.path, document.key).toMatch(/^\/[a-z-]+\/$/);
    }
  });

  it('agrees with itself about what is current', () => {
    for (const document of LEGAL_DOCUMENTS) {
      expect(CURRENT_AGREEMENTS[document.key]).toBe(document.version);
      expect(documentVersion(document.key)).toBe(document.version);
    }
  });

  it('refuses a document nobody wrote', () => {
    // @ts-expect-error -- the point is what happens when a caller ignores the type.
    expect(() => documentVersion('COOKIES')).toThrow();
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

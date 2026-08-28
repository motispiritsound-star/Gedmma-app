/**
 * The legal surface of the platform, in one place: which documents a user
 * agrees to, which version of each is current, how long each kind of data is
 * kept, and the age below which an account may not be opened.
 *
 * These are not decorative constants. Article 5(1)(e) of the GDPR requires a
 * retention period per purpose and Article 7(1) requires being able to
 * demonstrate what someone agreed to and when — which is impossible unless the
 * version they agreed to is recorded alongside the timestamp. Everything the
 * API, the app and the website say about retention is read from here, so the
 * privacy statement and the code that deletes cannot drift apart.
 *
 * None of this is legal advice, and none of it makes the platform compliant on
 * its own: the AVG is as much organisational as technical. See
 * docs/PRIVACY.md for what still has to be arranged off the keyboard.
 */

/**
 * Agreeing to the terms is **not** consent in the GDPR sense. The lawful basis
 * for processing someone's job, quotes and messages is performance of the
 * contract, Article 6(1)(b) — the service cannot be delivered without them.
 * Calling that "consent" would be a mistake with teeth: consent must be freely
 * given and withdrawable at any time, and nobody can withdraw their way out of
 * the platform needing their phone number to sign them in.
 *
 * Real consent, Article 6(1)(a), is asked for separately and only where the
 * processing is genuinely optional. Today that is one thing: marketing
 * messages. It is off by default and can be withdrawn without losing the
 * account, which is what makes it consent rather than a condition of service.
 */
export type AgreementDocument = 'TERMS' | 'PRIVACY';

export interface LegalDocument {
  key: AgreementDocument;
  /**
   * ISO date the wording last changed. A date is a better version than a
   * number here: it answers "which text did they see" without a changelog.
   */
  version: string;
  /** Path on the public website, relative to the site root. */
  path: string;
}

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  { key: 'TERMS', version: '2026-08-28', path: '/voorwaarden/' },
  { key: 'PRIVACY', version: '2026-08-28', path: '/privacy/' },
];

export const DOCUMENT_BY_KEY: ReadonlyMap<AgreementDocument, LegalDocument> = new Map(
  LEGAL_DOCUMENTS.map((document) => [document.key, document]),
);

export function documentVersion(key: AgreementDocument): string {
  const document = DOCUMENT_BY_KEY.get(key);
  if (!document) throw new Error(`Unknown legal document: ${key}`);
  return document.version;
}

/** What a new account must currently agree to, as {TERMS: version, ...}. */
export const CURRENT_AGREEMENTS: Readonly<Record<AgreementDocument, string>> = Object.freeze(
  Object.fromEntries(LEGAL_DOCUMENTS.map((d) => [d.key, d.version])) as Record<
    AgreementDocument,
    string
  >,
);

/**
 * The Netherlands lowered the age for an information-society service to 16 in
 * the UAVG (Article 5), the lowest the GDPR allows a member state to go from
 * its default of 16 — below it a parent has to consent, which this platform has
 * no way to verify. So 16 is a hard floor, not a check box we can look past.
 *
 * The account holder confirms their age; nothing here verifies it, and the
 * privacy statement says so rather than implying a check that does not happen.
 */
export const MINIMUM_AGE = 16;

/**
 * How long each kind of data is kept, and why. "Why" is the part that matters:
 * a retention period without a reason is a number somebody made up, and it is
 * the first thing an Autoriteit Persoonsgegevens questionnaire asks for.
 */
export interface RetentionRule {
  /** Machine-readable name, matching the sweep that enforces it. */
  key: string;
  days: number;
  /** Stated in the privacy statement, in both languages. */
  reason: { nl: string; en: string };
}

const DAYS_PER_YEAR = 365;

export const RETENTION: readonly RetentionRule[] = [
  {
    key: 'otpChallenge',
    days: 1,
    reason: {
      nl: 'Inlogcodes verlopen binnen enkele minuten. Wat overblijft wordt dagelijks verwijderd.',
      en: 'Sign-in codes expire within minutes. Whatever is left is deleted daily.',
    },
  },
  {
    key: 'refreshToken',
    days: 30,
    reason: {
      nl: 'Verlopen sessies worden 30 dagen bewaard om misbruik van een gestolen apparaat te kunnen zien, daarna verwijderd.',
      en: 'Expired sessions are kept for 30 days so misuse of a stolen device can be spotted, then deleted.',
    },
  },
  {
    key: 'notification',
    days: 90,
    reason: {
      nl: 'Meldingen in de app worden na 90 dagen verwijderd. De onderliggende klus of offerte blijft staan.',
      en: 'In-app notifications are deleted after 90 days. The underlying job or quote stays.',
    },
  },
  {
    key: 'closedJob',
    days: 2 * DAYS_PER_YEAR,
    reason: {
      nl: 'Afgeronde en verlopen klussen, met de offertes en berichten die erbij horen, worden na twee jaar geanonimiseerd. Twee jaar dekt de garantietermijn waarbinnen een klant nog op het werk kan terugkomen.',
      en: 'Completed and expired jobs, with their quotes and messages, are anonymised after two years. Two years covers the warranty period in which a customer may still come back about the work.',
    },
  },
  {
    key: 'inactiveAccount',
    days: 3 * DAYS_PER_YEAR,
    reason: {
      nl: 'Een account waarmee drie jaar niet is ingelogd wordt verwijderd. Je krijgt daarvoor eerst bericht.',
      en: 'An account not signed into for three years is deleted. You are told before that happens.',
    },
  },
  {
    key: 'invoice',
    days: 7 * DAYS_PER_YEAR,
    reason: {
      nl: 'Facturen en betaalgegevens moeten zeven jaar bewaard blijven; dat is de fiscale bewaarplicht uit artikel 52 van de Algemene wet inzake rijksbelastingen. Ze worden losgekoppeld van je account maar niet vernietigd.',
      en: 'Invoices and payment records must be kept for seven years under Dutch tax law (Article 52 AWR). They are detached from your account but not destroyed.',
    },
  },
  {
    key: 'agreementRecord',
    days: 7 * DAYS_PER_YEAR,
    reason: {
      nl: 'Waar en wanneer je akkoord ging met de voorwaarden wordt zeven jaar bewaard, zolang er nog een geschil over de overeenkomst mogelijk is.',
      en: 'Where and when you agreed to the terms is kept for seven years, for as long as a dispute about the agreement remains possible.',
    },
  },
];

export const RETENTION_BY_KEY: ReadonlyMap<string, RetentionRule> = new Map(
  RETENTION.map((rule) => [rule.key, rule]),
);

export function retentionDays(key: string): number {
  const rule = RETENTION_BY_KEY.get(key);
  if (!rule) throw new Error(`Unknown retention rule: ${key}`);
  return rule.days;
}

/** The cut-off date for a rule: anything older than this is due for sweeping. */
export function retentionCutoff(key: string, now = new Date()): Date {
  return new Date(now.getTime() - retentionDays(key) * 86_400_000);
}

/**
 * How long a data request may take. Article 12(3): without undue delay and in
 * any case within one month. This platform answers an export immediately, so
 * the deadline only matters for anything that has to be handled by a person.
 */
export const DATA_REQUEST_DEADLINE_DAYS = 30;

/**
 * The value that replaces a name, phone number or address when an account is
 * erased. A single recognisable token beats scattering empty strings: it is
 * obvious in a database dump that the row was anonymised on purpose rather
 * than saved half-empty by a bug.
 */
export const ANONYMISED = '[verwijderd]';

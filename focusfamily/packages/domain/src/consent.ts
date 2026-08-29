import { z } from 'zod';
import { DomainError } from './errors.js';
import { type AgeBand } from './people.js';
import type { DataSourceKind } from './measurement.js';

/**
 * Consent in FocusFamily is layered. A guardian's permission is necessary but
 * never sufficient for measuring a child: from 11 upwards the child's own
 * assent is required as well, and anyone can withdraw at any time without
 * losing access to the rest of the product.
 */
export const consentScopes = [
  'account.basic',
  'measurement.self_report',
  'measurement.app_observed',
  'measurement.os_verified',
  'notifications.push',
  'insights.weekly_review',
  'ai.assistant',
] as const;
export type ConsentScope = (typeof consentScopes)[number];

export const consentDecisions = ['granted', 'withdrawn', 'expired'] as const;
export type ConsentDecision = (typeof consentDecisions)[number];

export const consentRecordSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  /** Whose data the consent is about. */
  subjectUserId: z.string(),
  /** Who pressed the button. For a child under 11 this is a guardian. */
  actorUserId: z.string(),
  scope: z.enum(consentScopes),
  decision: z.enum(consentDecisions),
  /** Exact wording shown at the time, stored for the consent history screen. */
  statementKey: z.string().min(1).max(120),
  statementVersion: z.string().min(1).max(16),
  recordedAt: z.coerce.date(),
  supersededAt: z.coerce.date().nullable().default(null),
});
export type ConsentRecord = z.infer<typeof consentRecordSchema>;

/** Which consent scope a given provenance requires before it may be stored. */
export const SCOPE_BY_SOURCE: Readonly<Record<DataSourceKind, ConsentScope | null>> =
  Object.freeze({
    self_reported: 'measurement.self_report',
    app_observed: 'measurement.app_observed',
    os_verified: 'measurement.os_verified',
    simulated: null,
  });

/**
 * From this age a child must personally assent in addition to their guardian.
 * Below it, the guardian consents and the child still sees a plain-language
 * explanation of every active measurement.
 */
export const CHILD_ASSENT_FROM_AGE_BAND: AgeBand = '11-13';

const assentRequiredBands: ReadonlySet<AgeBand> = new Set<AgeBand>(['11-13', '14-17']);

export function requiresChildAssent(ageBand: AgeBand, scope: ConsentScope): boolean {
  if (ageBand === 'adult') return false;
  if (scope === 'account.basic') return false;
  return assentRequiredBands.has(ageBand);
}

export interface ConsentState {
  readonly scope: ConsentScope;
  readonly guardianGranted: boolean;
  readonly subjectGranted: boolean;
  readonly effective: boolean;
  readonly reasonKey: string;
}

function latestFor(
  records: readonly ConsentRecord[],
  scope: ConsentScope,
  subjectUserId: string,
  predicate: (record: ConsentRecord) => boolean,
): ConsentRecord | undefined {
  return records
    .filter(
      (record) =>
        record.scope === scope &&
        record.subjectUserId === subjectUserId &&
        predicate(record),
    )
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
}

/**
 * Resolve the live consent state for one subject and one scope from the full
 * history. History is append-only: withdrawal adds a record, it never deletes.
 */
export function evaluateConsent(args: {
  records: readonly ConsentRecord[];
  scope: ConsentScope;
  subjectUserId: string;
  subjectAgeBand: AgeBand;
}): ConsentState {
  const { records, scope, subjectUserId, subjectAgeBand } = args;
  const isAdult = subjectAgeBand === 'adult';

  const guardianRecord = latestFor(
    records,
    scope,
    subjectUserId,
    (record) => isAdult || record.actorUserId !== subjectUserId,
  );
  const subjectRecord = latestFor(
    records,
    scope,
    subjectUserId,
    (record) => record.actorUserId === subjectUserId,
  );

  const guardianGranted = isAdult
    ? subjectRecord?.decision === 'granted'
    : guardianRecord?.decision === 'granted';
  const subjectGranted = subjectRecord?.decision === 'granted';

  if (isAdult) {
    return {
      scope,
      guardianGranted: Boolean(guardianGranted),
      subjectGranted: Boolean(subjectGranted),
      effective: Boolean(subjectGranted),
      reasonKey: subjectGranted ? 'consent.effective' : 'consent.missing_self',
    };
  }

  if (!guardianGranted) {
    return {
      scope,
      guardianGranted: false,
      subjectGranted: Boolean(subjectGranted),
      effective: false,
      reasonKey: 'consent.missing_guardian',
    };
  }

  if (requiresChildAssent(subjectAgeBand, scope) && !subjectGranted) {
    return {
      scope,
      guardianGranted: true,
      subjectGranted: false,
      effective: false,
      reasonKey: 'consent.missing_child_assent',
    };
  }

  return {
    scope,
    guardianGranted: true,
    subjectGranted: Boolean(subjectGranted),
    effective: true,
    reasonKey: 'consent.effective',
  };
}

export function assertConsent(state: ConsentState): void {
  if (!state.effective) {
    throw DomainError.consentRequired(state.reasonKey, { scope: state.scope });
  }
}

/** May a measurement of this provenance be written for this subject right now? */
export function measurementAllowed(args: {
  records: readonly ConsentRecord[];
  subjectUserId: string;
  subjectAgeBand: AgeBand;
  source: DataSourceKind;
}): ConsentState {
  const scope = SCOPE_BY_SOURCE[args.source];
  if (scope === null) {
    return {
      scope: 'measurement.self_report',
      guardianGranted: true,
      subjectGranted: true,
      effective: true,
      reasonKey: 'consent.not_required_simulated',
    };
  }
  return evaluateConsent({
    records: args.records,
    scope,
    subjectUserId: args.subjectUserId,
    subjectAgeBand: args.subjectAgeBand,
  });
}

/**
 * The consent history screen, newest first, with the exact statement each
 * person saw. Every family member can open this for themselves.
 */
export function consentTimeline(
  records: readonly ConsentRecord[],
  subjectUserId: string,
): ConsentRecord[] {
  return records
    .filter((record) => record.subjectUserId === subjectUserId)
    .slice()
    .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
}

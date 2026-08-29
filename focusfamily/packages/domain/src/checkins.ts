import { z } from 'zod';
import { DomainError } from './errors.js';

/**
 * Check-ins ask three ordinary questions: did you sleep enough, how is your
 * mood, and did screens cause friction today. They are not a screening
 * instrument and the language never implies one.
 */
export const moodLevels = [1, 2, 3, 4, 5] as const;
export type MoodLevel = (typeof moodLevels)[number];

export const MOOD_LABEL_KEYS: Readonly<Record<MoodLevel, string>> = Object.freeze({
  1: 'checkin.mood.1',
  2: 'checkin.mood.2',
  3: 'checkin.mood.3',
  4: 'checkin.mood.4',
  5: 'checkin.mood.5',
});

export const conflictLevels = ['none', 'a_little', 'quite_a_bit'] as const;
export type ConflictLevel = (typeof conflictLevels)[number];

export const checkInSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    /** Always the person themselves. Nobody fills one in for someone else. */
    userId: z.string(),
    dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sleepHours: z.number().min(0).max(16).nullable().default(null),
    /** Self-reported bedtime, if the person wants to share it. */
    bedtime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().default(null),
    mood: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    conflict: z.enum(conflictLevels),
    /** Free text stays private to the author unless they share it in review. */
    note: z.string().max(500).nullable().default(null),
    sharedWithFamily: z.boolean().default(false),
    source: z.literal('self_reported').default('self_reported'),
    createdAt: z.coerce.date(),
  })
  .strict();
export type CheckIn = z.infer<typeof checkInSchema>;

/**
 * Words the product refuses to put in front of a family. Clinical framing
 * turns a conversation into a verdict, and we are not qualified to give one.
 *
 * Checked by a unit test across the whole shipped copy catalogue.
 */
export const NON_DIAGNOSTIC_BLOCKLIST: readonly string[] = Object.freeze([
  // English
  'addiction',
  'addicted',
  'addict',
  'disorder',
  'diagnose',
  'diagnosis',
  'pathological',
  'depression',
  'anxiety disorder',
  'adhd',
  'symptom',
  'treatment',
  'therapy plan',
  'clinical',
  // Nederlands
  'verslaving',
  'verslaafd',
  'stoornis',
  'diagnose',
  'diagnostiek',
  'pathologisch',
  'depressie',
  'angststoornis',
  'symptoom',
  'behandeling',
  'klinisch',
]);

/** Shaming language, in both languages. Also enforced against the catalogue. */
export const NON_SHAMING_BLOCKLIST: readonly string[] = Object.freeze([
  'failed',
  'failure',
  'lazy',
  'bad child',
  'punish',
  'punishment',
  'you lost',
  'caught',
  'gefaald',
  'mislukt',
  'lui',
  'stout kind',
  'straf',
  'gestraft',
  'betrapt',
]);

export interface CopyViolation {
  readonly key: string;
  readonly term: string;
  readonly list: 'diagnostic' | 'shaming';
}

function findTerms(
  text: string,
  list: readonly string[],
): string[] {
  const haystack = text.toLowerCase();
  return list.filter((term) => {
    const index = haystack.indexOf(term);
    if (index === -1) return false;
    const before = haystack[index - 1];
    const after = haystack[index + term.length];
    const isWordChar = (char: string | undefined): boolean =>
      char !== undefined && /[a-z0-9]/.test(char);
    return !isWordChar(before) && !isWordChar(after);
  });
}

/** Scan a copy catalogue and report every clinical or shaming phrase. */
export function auditCopy(catalogue: Readonly<Record<string, string>>): CopyViolation[] {
  const violations: CopyViolation[] = [];
  for (const [key, text] of Object.entries(catalogue)) {
    for (const term of findTerms(text, NON_DIAGNOSTIC_BLOCKLIST)) {
      violations.push({ key, term, list: 'diagnostic' });
    }
    for (const term of findTerms(text, NON_SHAMING_BLOCKLIST)) {
      violations.push({ key, term, list: 'shaming' });
    }
  }
  return violations;
}

export function assertNonDiagnostic(text: string): void {
  const terms = [
    ...findTerms(text, NON_DIAGNOSTIC_BLOCKLIST),
    ...findTerms(text, NON_SHAMING_BLOCKLIST),
  ];
  if (terms.length > 0) {
    throw DomainError.policy('copy.clinical_or_shaming', { terms });
  }
}

export interface CheckInTrend {
  readonly days: number;
  readonly averageSleepHours: number | null;
  readonly averageMood: number | null;
  readonly conflictDays: number;
  readonly responseCount: number;
  /** Always self-reported - stated so the UI cannot forget to say it. */
  readonly source: 'self_reported';
}

export function summariseCheckIns(
  checkIns: readonly CheckIn[],
  days: number,
): CheckInTrend {
  const sleep = checkIns.map((entry) => entry.sleepHours).filter((v): v is number => v !== null);
  const moods = checkIns.map((entry) => entry.mood);
  return {
    days,
    averageSleepHours:
      sleep.length > 0
        ? Math.round((sleep.reduce((a, b) => a + b, 0) / sleep.length) * 10) / 10
        : null,
    averageMood:
      moods.length > 0
        ? Math.round((moods.reduce<number>((a, b) => a + b, 0) / moods.length) * 10) / 10
        : null,
    conflictDays: checkIns.filter((entry) => entry.conflict !== 'none').length,
    responseCount: checkIns.length,
    source: 'self_reported',
  };
}

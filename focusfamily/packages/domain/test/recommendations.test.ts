import { describe, expect, it } from 'vitest';
import {
  ALLOWED_FACT_KEYS,
  DisabledAiAdvisor,
  assertWithinDataBoundary,
  prepareAiRequest,
  recommendOne,
  validateAiSuggestion,
  type CheckIn,
  type FamilyAgreement,
  type FocusSession,
  type RecommendationInput,
} from '../src/index.js';

const now = new Date('2026-03-20T20:00:00Z');
const afterBaseline = new Date('2026-03-01T20:00:00Z');

function agreementWith(audience: 'everyone' | 'children'): FamilyAgreement {
  return {
    id: 'a1',
    familyId: 'fam_1',
    title: 'Ours',
    status: 'active',
    agreedByUserIds: [],
    createdByUserId: 'u_parent',
    createdAt: afterBaseline,
    activatedAt: afterBaseline,
    reviewOnDayKey: null,
    rules: [
      {
        id: 'r1',
        agreementId: 'a1',
        context: 'meals',
        kind: 'devices_away',
        audience,
        memberId: null,
        ageBands: [],
        startsAt: '18:00',
        endsAt: '19:00',
        weekdays: [],
        text: 'Phones away while we eat.',
        repairText: null,
        createdAt: afterBaseline,
      },
    ],
  };
}

function baseInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    family: { baselineStartedAt: afterBaseline },
    now,
    guardianCount: 2,
    agreements: [agreementWith('everyone')],
    focusSessions: [],
    checkIns: [],
    hasDinnerSchedule: true,
    usageSources: ['app_observed'],
    ...overrides,
  };
}

function focusSession(id: string, finished: boolean): FocusSession {
  const start = new Date('2026-03-18T18:00:00Z');
  return {
    id,
    familyId: 'fam_1',
    scheduleId: null,
    participantIds: ['u_parent', 'u_teen'],
    startedByUserId: 'u_parent',
    plannedMinutes: 30,
    status: finished ? 'completed' : 'abandoned',
    events: [
      { id: `${id}-s`, type: 'start', at: start, reason: null, recordedOffline: false },
      {
        id: `${id}-e`,
        type: finished ? 'complete' : 'abandon',
        at: new Date(start.getTime() + (finished ? 25 : 5) * 60_000),
        reason: null,
        recordedOffline: false,
      },
    ],
    source: 'app_observed',
    createdAt: start,
  };
}

function checkIn(dayKey: string, sleepHours: number): CheckIn {
  return {
    id: `ci-${dayKey}`,
    familyId: 'fam_1',
    userId: 'u_teen',
    dayKey,
    sleepHours,
    bedtime: null,
    mood: 3,
    conflict: 'none',
    note: null,
    sharedWithFamily: false,
    source: 'self_reported',
    createdAt: new Date(`${dayKey}T08:00:00Z`),
  };
}

describe('the recommendation engine', () => {
  it('says nothing at all during the neutral baseline week', () => {
    const result = recommendOne(
      baseInput({ family: { baselineStartedAt: new Date('2026-03-18T00:00:00Z') } }),
    );
    expect(result).toBeNull();
  });

  it('says nothing before the baseline has even started', () => {
    expect(recommendOne(baseInput({ family: { baselineStartedAt: null } }))).toBeNull();
  });

  it('asks for an adult rule first when the agreement only binds the children', () => {
    const result = recommendOne(baseInput({ agreements: [agreementWith('children')] }));
    expect(result?.kind).toBe('add_adult_rule');
    expect(result?.reasonKey).toBe('recommendation.add_adult_rule.reason');
  });

  it('suggests inviting the second grown-up when there is only one', () => {
    expect(recommendOne(baseInput({ guardianCount: 1 }))?.kind).toBe(
      'invite_second_guardian',
    );
  });

  it('suggests a shorter moment when most attempts are abandoned', () => {
    const result = recommendOne(
      baseInput({
        focusSessions: [
          focusSession('f1', false),
          focusSession('f2', false),
          focusSession('f3', true),
        ],
      }),
    );
    expect(result?.kind).toBe('shorten_first_focus_moment');
    expect(result?.evidence.map((e) => e.factKey)).toContain('fact.focus_sessions_started');
  });

  it('suggests scheduling a meal when there is none', () => {
    expect(recommendOne(baseInput({ hasDinnerSchedule: false }))?.kind).toBe(
      'schedule_one_dinner',
    );
  });

  it('suggests moving the chargers, and labels the evidence as self-reported', () => {
    const result = recommendOne(
      baseInput({
        checkIns: [
          checkIn('2026-03-16', 7),
          checkIn('2026-03-17', 7.5),
          checkIn('2026-03-18', 6.5),
        ],
      }),
    );
    expect(result?.kind).toBe('shift_bedtime_charging');
    expect(result?.confidence).toBe('low');
    const sleepEvidence = result?.evidence.find(
      (item) => item.factKey === 'fact.average_sleep_hours',
    );
    expect(sleepEvidence?.label.kind).toBe('self_reported');
  });

  it('returns exactly one suggestion, never a list', () => {
    const result = recommendOne(baseInput({ guardianCount: 1, hasDinnerSchedule: false }));
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(false);
  });

  it('always states which facts it used, and only allowed ones', () => {
    const inputs = [
      baseInput({ agreements: [agreementWith('children')] }),
      baseInput({ guardianCount: 1 }),
      baseInput({ hasDinnerSchedule: false }),
      baseInput({ focusSessions: [focusSession('f1', true)] }),
    ];
    for (const input of inputs) {
      const result = recommendOne(input);
      expect(result?.evidence.length ?? 0).toBeGreaterThan(0);
      expect(result?.engine).toBe('deterministic_rules_v1');
      if (result) expect(() => assertWithinDataBoundary(result)).not.toThrow();
    }
  });

  it('celebrates a good week rather than inventing a problem', () => {
    const result = recommendOne(baseInput({ focusSessions: [focusSession('f1', true)] }));
    expect(result?.kind).toBe('talk_about_a_good_week');
  });
});

describe('the optional AI interface', () => {
  it('is disabled in the shipped build', async () => {
    const advisor = new DisabledAiAdvisor();
    expect(advisor.enabled).toBe(false);
    expect(await advisor.suggest()).toBeNull();
  });

  it('strips anything outside the data boundary before a request leaves', () => {
    const request = prepareAiRequest(
      [
        { key: 'fact.guardian_count', value: 2 },
        { key: 'fact.child_note_text', value: 'I had a rough day' },
        { key: 'fact.browsing_history', value: 'example.com' },
      ],
      'nl',
    );
    expect(request.facts.map((f) => f.key)).toEqual(['fact.guardian_count']);
  });

  it('rejects a suggestion with clinical wording', () => {
    expect(() =>
      validateAiSuggestion({
        titleKey: 't',
        bodyKey: 'b',
        reason: 'Your child shows signs of screen addiction.',
        usedFactKeys: ['fact.guardian_count'],
      }),
    ).toThrowError(/clinical_or_shaming/);
  });

  it('rejects a suggestion that used a fact it was never given', () => {
    expect(() =>
      validateAiSuggestion({
        titleKey: 't',
        bodyKey: 'b',
        reason: 'One small change could help.',
        usedFactKeys: ['fact.private_messages'],
      }),
    ).toThrowError(/outside the boundary/);
  });

  it('keeps the boundary list free of anything sensitive', () => {
    for (const key of ALLOWED_FACT_KEYS) {
      expect(key).not.toMatch(/message|browsing|location|note|health|religion|gender/);
    }
  });
});

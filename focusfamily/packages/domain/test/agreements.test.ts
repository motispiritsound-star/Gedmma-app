import { describe, expect, it } from 'vitest';
import {
  AGREEMENT_TEMPLATES,
  assertActivatable,
  bindsAdults,
  rulesFor,
  validateAgreement,
  type AgreementRule,
  type FamilyAgreement,
} from '../src/index.js';

function rule(overrides: Partial<AgreementRule>): AgreementRule {
  return {
    id: 'r1',
    agreementId: 'a1',
    context: 'meals',
    kind: 'devices_away',
    audience: 'everyone',
    memberId: null,
    ageBands: [],
    startsAt: '18:00',
    endsAt: '19:00',
    weekdays: [],
    text: 'Phones in the basket while we eat.',
    repairText: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function agreement(rules: AgreementRule[]): FamilyAgreement {
  return {
    id: 'a1',
    familyId: 'fam_1',
    title: 'Our agreement',
    status: 'draft',
    agreedByUserIds: [],
    createdByUserId: 'u_parent',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    activatedAt: null,
    reviewOnDayKey: null,
    rules,
  };
}

describe('adults have to be in the agreement', () => {
  it('rejects an agreement that only binds the children', () => {
    const issues = validateAgreement(agreement([rule({ audience: 'children' })]));
    expect(issues.map((issue) => issue.code)).toContain('adults_not_included');
  });

  it('accepts an agreement where at least one rule binds everyone', () => {
    expect(validateAgreement(agreement([rule({})]))).toEqual([]);
  });

  it('flags a context that asks something of children only', () => {
    const issues = validateAgreement(
      agreement([
        rule({ id: 'r1', context: 'meals', audience: 'everyone' }),
        rule({ id: 'r2', context: 'bedtime', audience: 'children', startsAt: null, endsAt: null }),
      ]),
    );
    expect(issues.map((issue) => issue.code)).toContain('children_only_context');
    expect(issues.find((issue) => issue.code === 'children_only_context')?.context).toBe(
      'bedtime',
    );
  });

  it('refuses to activate an agreement with issues', () => {
    expect(() => assertActivatable(agreement([rule({ audience: 'children' })]))).toThrowError(
      /not_activatable/,
    );
    expect(() => assertActivatable(agreement([rule({})]))).not.toThrow();
  });

  it('knows a member rule binds an adult only when the adult band is named', () => {
    expect(bindsAdults(rule({ audience: 'member', ageBands: ['adult'] }))).toBe(true);
    expect(bindsAdults(rule({ audience: 'member', ageBands: ['11-13'] }))).toBe(false);
    expect(bindsAdults(rule({ audience: 'children' }))).toBe(false);
    expect(bindsAdults(rule({ audience: 'everyone' }))).toBe(true);
  });

  it('warns about a window that swallows the whole day', () => {
    const issues = validateAgreement(
      agreement([rule({ startsAt: '07:00', endsAt: '23:00' })]),
    );
    expect(issues.map((issue) => issue.code)).toContain('window_too_long');
  });

  it('needs at least one rule', () => {
    expect(validateAgreement(agreement([])).map((i) => i.code)).toEqual(['no_rules']);
  });
});

describe('age-appropriate variations', () => {
  const rules = [
    rule({ id: 'all', audience: 'everyone' }),
    rule({ id: 'teens', audience: 'children', ageBands: ['14-17'], startsAt: null, endsAt: null }),
    rule({ id: 'adults', audience: 'adults', startsAt: null, endsAt: null }),
    rule({
      id: 'weekday',
      audience: 'everyone',
      weekdays: [1, 2, 3, 4, 5],
      startsAt: null,
      endsAt: null,
    }),
  ];

  it('gives every member their own list, adults included', () => {
    const forTeen = rulesFor({ rules }, { memberId: 'u_teen', ageBand: '14-17', weekday: 3 });
    expect(forTeen.map((r) => r.id)).toEqual(['all', 'teens', 'weekday']);

    const forAdult = rulesFor({ rules }, { memberId: 'u_parent', ageBand: 'adult', weekday: 3 });
    expect(forAdult.map((r) => r.id)).toEqual(['all', 'adults', 'weekday']);
  });

  it('respects weekday narrowing', () => {
    const sunday = rulesFor({ rules }, { memberId: 'u_teen', ageBand: '14-17', weekday: 0 });
    expect(sunday.map((r) => r.id)).toEqual(['all', 'teens']);
  });

  it('does not apply a teen rule to a younger child', () => {
    const forChild = rulesFor({ rules }, { memberId: 'u_kid', ageBand: '8-10', weekday: 3 });
    expect(forChild.map((r) => r.id)).toEqual(['all', 'weekday']);
  });
});

describe('starting templates', () => {
  it('cover all six contexts and every one of them binds everybody', () => {
    expect(new Set(AGREEMENT_TEMPLATES.map((t) => t.context)).size).toBe(6);
    for (const template of AGREEMENT_TEMPLATES) {
      expect(template.audience).toBe('everyone');
      expect(template.repairKey).toBeTruthy();
    }
  });
});

import { describe, expect, it } from 'vitest';
import {
  assertConsent,
  consentTimeline,
  evaluateConsent,
  measurementAllowed,
  requiresChildAssent,
  type ConsentRecord,
} from '../src/index.js';

function record(overrides: Partial<ConsentRecord>): ConsentRecord {
  return {
    id: 'c1',
    familyId: 'fam_1',
    subjectUserId: 'u_kid',
    actorUserId: 'u_parent',
    scope: 'measurement.os_verified',
    decision: 'granted',
    statementKey: 'consent.statement.measurement.os_verified',
    statementVersion: '1',
    recordedAt: new Date('2026-01-01T10:00:00Z'),
    supersededAt: null,
    ...overrides,
  };
}

describe('consent layering', () => {
  it('requires a child assent from 11 upwards, but not for basic account data', () => {
    expect(requiresChildAssent('8-10', 'measurement.os_verified')).toBe(false);
    expect(requiresChildAssent('11-13', 'measurement.os_verified')).toBe(true);
    expect(requiresChildAssent('14-17', 'measurement.os_verified')).toBe(true);
    expect(requiresChildAssent('11-13', 'account.basic')).toBe(false);
    expect(requiresChildAssent('adult', 'measurement.os_verified')).toBe(false);
  });

  it('is not effective on a guardian yes alone for a teenager', () => {
    const state = evaluateConsent({
      records: [record({})],
      scope: 'measurement.os_verified',
      subjectUserId: 'u_kid',
      subjectAgeBand: '14-17',
    });
    expect(state.guardianGranted).toBe(true);
    expect(state.effective).toBe(false);
    expect(state.reasonKey).toBe('consent.missing_child_assent');
    expect(() => assertConsent(state)).toThrowError(/missing_child_assent/);
  });

  it('becomes effective once the young person agrees too', () => {
    const state = evaluateConsent({
      records: [record({}), record({ id: 'c2', actorUserId: 'u_kid' })],
      scope: 'measurement.os_verified',
      subjectUserId: 'u_kid',
      subjectAgeBand: '14-17',
    });
    expect(state.effective).toBe(true);
  });

  it('lets an 8 year old be covered by their guardian, and still shows them the statement', () => {
    const state = evaluateConsent({
      records: [record({})],
      scope: 'measurement.os_verified',
      subjectUserId: 'u_kid',
      subjectAgeBand: '8-10',
    });
    expect(state.effective).toBe(true);
  });

  it('stops immediately when anyone withdraws, newest record wins', () => {
    const state = evaluateConsent({
      records: [
        record({}),
        record({ id: 'c2', actorUserId: 'u_kid' }),
        record({
          id: 'c3',
          actorUserId: 'u_kid',
          decision: 'withdrawn',
          recordedAt: new Date('2026-02-01T10:00:00Z'),
        }),
      ],
      scope: 'measurement.os_verified',
      subjectUserId: 'u_kid',
      subjectAgeBand: '14-17',
    });
    expect(state.effective).toBe(false);
  });

  it('treats an adult as consenting for themselves', () => {
    const state = evaluateConsent({
      records: [
        record({ subjectUserId: 'u_parent', actorUserId: 'u_parent', decision: 'granted' }),
      ],
      scope: 'measurement.os_verified',
      subjectUserId: 'u_parent',
      subjectAgeBand: 'adult',
    });
    expect(state.effective).toBe(true);
  });
});

describe('measurement gating', () => {
  it('blocks OS-verified data without the matching consent scope', () => {
    const state = measurementAllowed({
      records: [],
      subjectUserId: 'u_kid',
      subjectAgeBand: '11-13',
      source: 'os_verified',
    });
    expect(state.effective).toBe(false);
    expect(state.reasonKey).toBe('consent.missing_guardian');
  });

  it('needs no consent for clearly-labelled simulated data', () => {
    const state = measurementAllowed({
      records: [],
      subjectUserId: 'u_kid',
      subjectAgeBand: '11-13',
      source: 'simulated',
    });
    expect(state.effective).toBe(true);
    expect(state.reasonKey).toBe('consent.not_required_simulated');
  });
});

describe('consent history', () => {
  it('is append-only and newest first', () => {
    const timeline = consentTimeline(
      [
        record({ id: 'a', recordedAt: new Date('2026-01-01T00:00:00Z') }),
        record({
          id: 'b',
          decision: 'withdrawn',
          recordedAt: new Date('2026-03-01T00:00:00Z'),
        }),
        record({ id: 'c', subjectUserId: 'someone_else' }),
      ],
      'u_kid',
    );
    expect(timeline.map((entry) => entry.id)).toEqual(['b', 'a']);
    expect(timeline.every((entry) => entry.statementKey.length > 0)).toBe(true);
  });
});

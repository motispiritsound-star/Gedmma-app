import { describe, expect, it } from 'vitest';
import {
  countsAsCompleted,
  nextOccurrence,
  occurrencesInRange,
  reconcileSession,
  sessionProgress,
  focusScheduleSchema,
  type FocusEvent,
  type FocusSchedule,
  type FocusSession,
} from '../src/index.js';

const schedule: FocusSchedule = focusScheduleSchema.parse({
  id: 'sch_1',
  familyId: 'fam_1',
  agreementId: null,
  kind: 'dinner',
  title: 'Dinner together',
  startsAt: '18:00',
  durationMinutes: 45,
  // Tuesday, Thursday, Sunday
  weekdays: [2, 4, 0],
  participantIds: ['u_parent', 'u_teen', 'u_kid'],
  enabled: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
});

function session(events: FocusEvent[], overrides: Partial<FocusSession> = {}): FocusSession {
  return {
    id: 'fs_1',
    familyId: 'fam_1',
    scheduleId: 'sch_1',
    participantIds: ['u_parent', 'u_teen'],
    startedByUserId: 'u_parent',
    plannedMinutes: 45,
    status: 'running',
    events,
    source: 'app_observed',
    createdAt: new Date('2026-03-03T17:55:00Z'),
    ...overrides,
  };
}

function event(overrides: Partial<FocusEvent> & Pick<FocusEvent, 'id' | 'type' | 'at'>): FocusEvent {
  return { reason: null, recordedOffline: false, ...overrides };
}

describe('focus scheduling', () => {
  it('finds the next occurrence on a scheduled weekday', () => {
    // Monday 2 March 2026, 09:00 local.
    const from = new Date(2026, 2, 2, 9, 0, 0);
    const next = nextOccurrence(schedule, from);
    expect(next).not.toBeNull();
    expect(next?.getDay()).toBe(2);
    expect(next?.getHours()).toBe(18);
    expect(next?.getMinutes()).toBe(0);
  });

  it('skips today once the start time has passed', () => {
    const from = new Date(2026, 2, 3, 19, 0, 0); // Tuesday, after dinner
    const next = nextOccurrence(schedule, from);
    expect(next?.getDay()).toBe(4); // Thursday
  });

  it('returns nothing for a disabled schedule', () => {
    expect(nextOccurrence({ ...schedule, enabled: false }, new Date(2026, 2, 2))).toBeNull();
  });

  it('lists a whole week of occurrences', () => {
    const from = new Date(2026, 2, 2, 0, 0, 0);
    const to = new Date(2026, 2, 8, 23, 59, 0);
    expect(occurrencesInRange(schedule, from, to).map((d) => d.getDay())).toEqual([2, 4, 0]);
  });

  it('includes the adults in the participant list', () => {
    expect(schedule.participantIds).toContain('u_parent');
  });
});

describe('local timer', () => {
  const start = new Date('2026-03-03T18:00:00Z');

  it('adds up focused minutes across a pause', () => {
    const progress = sessionProgress(
      session([
        event({ id: 'e1', type: 'start', at: start }),
        event({
          id: 'e2',
          type: 'pause',
          at: new Date('2026-03-03T18:10:00Z'),
          reason: 'someone_needed_me',
        }),
        event({ id: 'e3', type: 'resume', at: new Date('2026-03-03T18:15:00Z') }),
        event({ id: 'e4', type: 'complete', at: new Date('2026-03-03T18:45:00Z') }),
      ]),
      new Date('2026-03-03T19:00:00Z'),
    );
    expect(progress.focusedMinutes).toBe(40);
    expect(progress.pausedMinutes).toBe(5);
    expect(progress.pauseCount).toBe(1);
    expect(progress.reasons).toEqual(['someone_needed_me']);
    expect(progress.status).toBe('completed');
  });

  it('keeps counting while the session is still running', () => {
    const progress = sessionProgress(
      session([event({ id: 'e1', type: 'start', at: start })]),
      new Date('2026-03-03T18:12:00Z'),
    );
    expect(progress.focusedMinutes).toBe(12);
    expect(progress.status).toBe('running');
  });

  it('survives a log that never got its resume back', () => {
    const progress = sessionProgress(
      session([
        event({ id: 'e1', type: 'start', at: start }),
        event({ id: 'e2', type: 'pause', at: new Date('2026-03-03T18:05:00Z') }),
      ]),
      new Date('2026-03-03T18:35:00Z'),
    );
    expect(progress.status).toBe('paused');
    expect(progress.focusedMinutes).toBe(5);
    expect(progress.pausedMinutes).toBe(30);
  });

  it('counts a moment as done at 60 per cent of the plan, pauses and all', () => {
    const done = session([
      event({ id: 'e1', type: 'start', at: start }),
      event({ id: 'e2', type: 'complete', at: new Date('2026-03-03T18:30:00Z') }),
    ]);
    expect(countsAsCompleted(done, new Date('2026-03-03T19:00:00Z'))).toBe(true);

    const short = session([
      event({ id: 'e1', type: 'start', at: start }),
      event({ id: 'e2', type: 'complete', at: new Date('2026-03-03T18:10:00Z') }),
    ]);
    expect(countsAsCompleted(short, new Date('2026-03-03T19:00:00Z'))).toBe(false);
  });

  it('does not count an abandoned moment, and does not treat it as a failure elsewhere', () => {
    const abandoned = session([
      event({ id: 'e1', type: 'start', at: start }),
      event({ id: 'e2', type: 'abandon', at: new Date('2026-03-03T18:40:00Z') }),
    ]);
    expect(countsAsCompleted(abandoned, new Date('2026-03-03T19:00:00Z'))).toBe(false);
    expect(sessionProgress(abandoned, new Date('2026-03-03T19:00:00Z')).status).toBe('abandoned');
  });
});

describe('offline reconciliation', () => {
  const serverNow = new Date('2026-03-03T19:00:00Z');
  const base = session([
    event({ id: 'e1', type: 'start', at: new Date('2026-03-03T18:00:00Z') }),
  ]);

  it('accepts a queue recorded while the phone was offline', () => {
    const result = reconcileSession({
      server: base,
      incoming: [
        event({
          id: 'e2',
          type: 'pause',
          at: new Date('2026-03-03T18:20:00Z'),
          reason: 'urgent_call',
          recordedOffline: true,
        }),
        event({
          id: 'e3',
          type: 'resume',
          at: new Date('2026-03-03T18:25:00Z'),
          recordedOffline: true,
        }),
        event({
          id: 'e4',
          type: 'complete',
          at: new Date('2026-03-03T18:50:00Z'),
          recordedOffline: true,
        }),
      ],
      serverNow,
    });
    expect(result.appliedEventIds).toEqual(['e2', 'e3', 'e4']);
    expect(result.session.status).toBe('completed');
    expect(sessionProgress(result.session, serverNow).focusedMinutes).toBe(45);
  });

  it('collapses a retried upload instead of double counting', () => {
    const once = reconcileSession({
      server: base,
      incoming: [event({ id: 'e2', type: 'complete', at: new Date('2026-03-03T18:40:00Z') })],
      serverNow,
    });
    const twice = reconcileSession({
      server: once.session,
      incoming: [event({ id: 'e2', type: 'complete', at: new Date('2026-03-03T18:40:00Z') })],
      serverNow,
    });
    expect(twice.duplicateEventIds).toEqual(['e2']);
    expect(twice.session.events).toHaveLength(2);
  });

  it('clamps a device clock that runs far ahead', () => {
    const result = reconcileSession({
      server: base,
      incoming: [event({ id: 'e2', type: 'complete', at: new Date('2030-01-01T00:00:00Z') })],
      serverNow,
    });
    expect(result.clampedToServerTime).toBe(true);
    expect(result.session.events.find((e) => e.id === 'e2')?.at.getTime()).toBe(
      serverNow.getTime(),
    );
  });

  it('refuses to re-open a finished session with a stale queue', () => {
    const finished = reconcileSession({
      server: base,
      incoming: [event({ id: 'e2', type: 'complete', at: new Date('2026-03-03T18:40:00Z') })],
      serverNow,
    }).session;
    const stale = reconcileSession({
      server: finished,
      incoming: [event({ id: 'e9', type: 'resume', at: new Date('2026-03-03T18:41:00Z') })],
      serverNow,
    });
    expect(stale.rejectedEventIds).toEqual(['e9']);
    expect(stale.session.status).toBe('completed');
  });

  it('never lets an offline event predate the session itself', () => {
    const result = reconcileSession({
      server: base,
      incoming: [event({ id: 'e2', type: 'pause', at: new Date('2020-01-01T00:00:00Z') })],
      serverNow,
    });
    const clamped = result.session.events.find((entry) => entry.id === 'e2');
    expect(clamped?.at.getTime()).toBe(base.createdAt.getTime());
    expect(result.clampedToServerTime).toBe(true);
  });
});

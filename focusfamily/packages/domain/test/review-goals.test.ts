import { describe, expect, it } from 'vitest';
import {
  buildWeeklyReview,
  celebrationForGoal,
  goalProgress,
  momentum,
  type CheckIn,
  type FocusSession,
  type Goal,
  type GoalContribution,
} from '../src/index.js';

const monday = new Date(2026, 2, 16, 12, 0, 0); // Monday 16 March 2026
const now = new Date(2026, 2, 22, 20, 0, 0);

function focusSession(id: string, finished: boolean, withAdult: boolean): FocusSession {
  const start = new Date(2026, 2, 17, 18, 0, 0);
  return {
    id,
    familyId: 'fam_1',
    scheduleId: null,
    participantIds: withAdult ? ['u_parent', 'u_teen'] : ['u_teen', 'u_kid'],
    startedByUserId: withAdult ? 'u_parent' : 'u_teen',
    plannedMinutes: 30,
    status: finished ? 'completed' : 'abandoned',
    events: [
      { id: `${id}s`, type: 'start', at: start, reason: null, recordedOffline: false },
      {
        id: `${id}e`,
        type: finished ? 'complete' : 'abandon',
        at: new Date(start.getTime() + (finished ? 28 : 4) * 60_000),
        reason: null,
        recordedOffline: false,
      },
    ],
    source: 'app_observed',
    createdAt: start,
  };
}

const goal: Goal = {
  id: 'g1',
  familyId: 'fam_1',
  kind: 'device_free_dinners',
  title: 'Three device-free dinners',
  target: 3,
  periodDays: 7,
  startsOnDayKey: '2026-03-16',
  participantIds: ['u_parent', 'u_parent2', 'u_teen', 'u_kid'],
  createdByUserId: 'u_parent',
  createdAt: monday,
  archivedAt: null,
};

function contribution(id: string, by: string): GoalContribution {
  return {
    id,
    goalId: 'g1',
    familyId: 'fam_1',
    contributedByUserId: by,
    dayKey: '2026-03-17',
    amount: 1,
    focusSessionId: null,
    source: 'app_observed',
    createdAt: monday,
  };
}

const checkIn: CheckIn = {
  id: 'ci1',
  familyId: 'fam_1',
  userId: 'u_teen',
  dayKey: '2026-03-17',
  sleepHours: 8,
  bedtime: '22:00',
  mood: 4,
  conflict: 'a_little',
  note: null,
  sharedWithFamily: false,
  source: 'self_reported',
  createdAt: monday,
};

describe('the weekly review is a conversation, not a score', () => {
  const review = buildWeeklyReview({
    familyId: 'fam_1',
    weekOf: monday,
    now,
    adultUserIds: ['u_parent', 'u_parent2'],
    agreements: [],
    focusSessions: [
      focusSession('f1', true, true),
      focusSession('f2', false, false),
    ],
    checkIns: [checkIn],
    goals: [goal],
    goalContributions: [contribution('c1', 'u_teen'), contribution('c2', 'u_parent')],
    usageSources: ['app_observed', 'self_reported'],
  });

  it('has no score, grade or ranking field anywhere in it', () => {
    const serialised = JSON.stringify(review);
    expect(serialised).not.toMatch(/"score"|"grade"|"rank"|"leaderboard"|"streak"/i);
    expect('score' in review).toBe(false);
  });

  it('leads with what went well', () => {
    expect(review.wentWell.length).toBeGreaterThan(0);
    expect(review.wentWell).toContain('review.well.focus_moments');
    expect(review.wentWell).toContain('review.well.adults_joined');
  });

  it('always offers something to talk about', () => {
    expect(review.conversationStarters).toContain('review.talk.one_change');
    expect(review.conversationStarters).toContain('review.talk.what_got_in_the_way');
    expect(review.conversationStarters).toContain('review.talk.tense_moment');
  });

  it('labels every figure with where it came from', () => {
    for (const figure of review.figures) {
      expect(figure.source.labelKey).toMatch(/^source\./);
      expect(figure.source.confidenceKey).toMatch(/^confidence\./);
    }
    const sleep = review.figures.find((f) => f.labelKey === 'review.figure.average_sleep');
    expect(sleep?.source.kind).toBe('self_reported');
    const focus = review.figures.find(
      (f) => f.labelKey === 'review.figure.focus_moments_completed',
    );
    expect(focus?.source.kind).toBe('app_observed');
  });

  it('says plainly whether the phone reported anything at all', () => {
    expect(review.dataNote.noteKey).toBe('review.data_note.no_os_data');
  });

  it('shows adult participation as a plain fact', () => {
    expect(review.adultParticipation).toEqual({
      adultsInFocusSessions: 1,
      totalFocusSessions: 2,
    });
  });

  it('covers a Monday-to-Sunday week', () => {
    expect(review.weekStartDayKey).toBe('2026-03-16');
    expect(review.weekEndDayKey).toBe('2026-03-22');
  });

  it('falls back to something kind when the week was empty', () => {
    const empty = buildWeeklyReview({
      familyId: 'fam_1',
      weekOf: monday,
      now,
      adultUserIds: ['u_parent'],
      agreements: [],
      focusSessions: [],
      checkIns: [],
      goals: [],
      goalContributions: [],
      usageSources: [],
    });
    expect(empty.wentWell).toEqual(['review.well.you_showed_up']);
  });
});

describe('joint goals', () => {
  it('counts everyone together and notices when adults joined', () => {
    const progress = goalProgress({
      goal,
      contributions: [contribution('c1', 'u_teen'), contribution('c2', 'u_parent')],
      adultUserIds: ['u_parent', 'u_parent2'],
    });
    expect(progress.achieved).toBe(2);
    expect(progress.remaining).toBe(1);
    expect(progress.reached).toBe(false);
    expect(progress.adultsTookPart).toBe(true);
  });

  it('produces a private celebration card once reached, and none before', () => {
    const notYet = goalProgress({
      goal,
      contributions: [contribution('c1', 'u_teen')],
      adultUserIds: ['u_parent'],
    });
    expect(celebrationForGoal(goal, notYet)).toBeNull();

    const reached = goalProgress({
      goal,
      contributions: [
        contribution('c1', 'u_teen'),
        contribution('c2', 'u_parent'),
        contribution('c3', 'u_kid'),
      ],
      adultUserIds: ['u_parent'],
    });
    const card = celebrationForGoal(goal, reached);
    expect(card?.visibility).toBe('family_private');
    expect(card?.kind).toBe('everyone_joined_in');
  });
});

describe('momentum instead of streaks', () => {
  it('keeps the best week even after a quiet one, and loses nothing', () => {
    const result = momentum([2, 4, 3, 0]);
    expect(result.currentWeek).toBe(0);
    expect(result.bestWeek).toBe(4);
    expect(result.lostAnything).toBe(false);
  });

  it('handles a brand new family', () => {
    expect(momentum([])).toEqual({ currentWeek: 0, bestWeek: 0, lostAnything: false });
  });
});

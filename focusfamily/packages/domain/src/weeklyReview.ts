import type { FamilyAgreement } from './agreements.js';
import type { CheckIn, CheckInTrend } from './checkins.js';
import { summariseCheckIns } from './checkins.js';
import { countsAsCompleted, type FocusSession } from './focus.js';
import type { Goal, GoalContribution } from './goals.js';
import { goalProgress, type GoalProgress } from './goals.js';
import type { DataSourceKind } from './measurement.js';
import { describeSource, type SourceLabel } from './measurement.js';
import { localDateKey, startOfWeek, addDays } from './time.js';

/**
 * The weekly review is a conversation agenda, not a report card.
 *
 * There is no total score, no grade, no comparison with other families and no
 * per-child ranking. The type below has no `score` field by design, and a unit
 * test asserts that it never gains one.
 */
export interface ReviewFigure {
  readonly labelKey: string;
  readonly value: number | string | null;
  readonly source: SourceLabel;
}

export interface WeeklyReview {
  readonly weekStartDayKey: string;
  readonly weekEndDayKey: string;
  readonly familyId: string;
  /** Two or three things that went well. Always populated first. */
  readonly wentWell: readonly string[];
  /** Open questions for the table, phrased as questions. */
  readonly conversationStarters: readonly string[];
  readonly figures: readonly ReviewFigure[];
  readonly goals: readonly GoalProgress[];
  readonly checkInTrend: CheckInTrend;
  /** Did the adults take part? Shown plainly, because it is the point. */
  readonly adultParticipation: {
    readonly adultsInFocusSessions: number;
    readonly totalFocusSessions: number;
  };
  readonly dataNote: {
    readonly sourcesUsed: readonly DataSourceKind[];
    readonly noteKey: string;
  };
}

export interface WeeklyReviewInput {
  readonly familyId: string;
  readonly weekOf: Date;
  readonly now: Date;
  readonly adultUserIds: readonly string[];
  readonly agreements: readonly FamilyAgreement[];
  readonly focusSessions: readonly FocusSession[];
  readonly checkIns: readonly CheckIn[];
  readonly goals: readonly Goal[];
  readonly goalContributions: readonly GoalContribution[];
  readonly usageSources: readonly DataSourceKind[];
}

export function buildWeeklyReview(input: WeeklyReviewInput): WeeklyReview {
  const start = startOfWeek(input.weekOf);
  const end = addDays(start, 6);
  const weekStartDayKey = localDateKey(start);
  const weekEndDayKey = localDateKey(end);

  const sessionsThisWeek = input.focusSessions.filter(
    (session) =>
      session.createdAt.getTime() >= start.getTime() &&
      session.createdAt.getTime() <= addDays(end, 1).getTime(),
  );
  const completed = sessionsThisWeek.filter((session) =>
    countsAsCompleted(session, input.now),
  );
  const withAdults = sessionsThisWeek.filter((session) =>
    session.participantIds.some((id) => input.adultUserIds.includes(id)),
  );

  const checkInsThisWeek = input.checkIns.filter(
    (entry) => entry.dayKey >= weekStartDayKey && entry.dayKey <= weekEndDayKey,
  );
  const trend = summariseCheckIns(checkInsThisWeek, 7);

  const goals = input.goals.map((goal) =>
    goalProgress({
      goal,
      contributions: input.goalContributions,
      adultUserIds: input.adultUserIds,
    }),
  );

  const wentWell: string[] = [];
  if (completed.length > 0) wentWell.push('review.well.focus_moments');
  if (withAdults.length > 0) wentWell.push('review.well.adults_joined');
  if (goals.some((goal) => goal.achieved > 0)) wentWell.push('review.well.goal_progress');
  if (checkInsThisWeek.length > 0) wentWell.push('review.well.checkins');
  if (wentWell.length === 0) wentWell.push('review.well.you_showed_up');

  const conversationStarters: string[] = ['review.talk.what_was_easy'];
  if (completed.length < sessionsThisWeek.length) {
    conversationStarters.push('review.talk.what_got_in_the_way');
  }
  if (trend.conflictDays > 0) conversationStarters.push('review.talk.tense_moment');
  if (withAdults.length < sessionsThisWeek.length) {
    conversationStarters.push('review.talk.adults_next_week');
  }
  conversationStarters.push('review.talk.one_change');

  const figures: ReviewFigure[] = [
    {
      labelKey: 'review.figure.focus_moments_completed',
      value: completed.length,
      source: describeSource('app_observed'),
    },
    {
      labelKey: 'review.figure.focus_moments_started',
      value: sessionsThisWeek.length,
      source: describeSource('app_observed'),
    },
    {
      labelKey: 'review.figure.average_sleep',
      value: trend.averageSleepHours,
      source: describeSource('self_reported'),
    },
    {
      labelKey: 'review.figure.average_mood',
      value: trend.averageMood,
      source: describeSource('self_reported'),
    },
    {
      labelKey: 'review.figure.active_agreements',
      value: input.agreements.filter((agreement) => agreement.status === 'active').length,
      source: describeSource('app_observed'),
    },
  ];

  const sourcesUsed = [
    ...new Set<DataSourceKind>([
      'app_observed',
      'self_reported',
      ...input.usageSources,
    ]),
  ];

  return {
    weekStartDayKey,
    weekEndDayKey,
    familyId: input.familyId,
    wentWell,
    conversationStarters,
    figures,
    goals,
    checkInTrend: trend,
    adultParticipation: {
      adultsInFocusSessions: withAdults.length,
      totalFocusSessions: sessionsThisWeek.length,
    },
    dataNote: {
      sourcesUsed,
      noteKey: sourcesUsed.includes('os_verified')
        ? 'review.data_note.mixed_with_os'
        : 'review.data_note.no_os_data',
    },
  };
}

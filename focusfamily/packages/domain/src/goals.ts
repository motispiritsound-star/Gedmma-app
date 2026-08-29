import { z } from 'zod';

/**
 * Joint goals belong to the family, never to one child. Progress is additive
 * only: there is no streak to break and nothing is ever taken away.
 */
export const goalKinds = [
  'device_free_dinners',
  'screen_free_evenings',
  'shared_activities',
  'bedtime_routine',
  'outdoor_time',
] as const;
export type GoalKind = (typeof goalKinds)[number];

export const goalSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    kind: z.enum(goalKinds),
    title: z.string().min(3).max(80),
    /** e.g. three device-free dinners in a week. */
    target: z.number().int().min(1).max(50),
    periodDays: z.number().int().min(1).max(31).default(7),
    startsOnDayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Everyone in the family, adults included - that is the whole point. */
    participantIds: z.array(z.string()).min(1),
    createdByUserId: z.string(),
    createdAt: z.coerce.date(),
    archivedAt: z.coerce.date().nullable().default(null),
  })
  .strict();
export type Goal = z.infer<typeof goalSchema>;

export const goalContributionSchema = z
  .object({
    id: z.string(),
    goalId: z.string(),
    familyId: z.string(),
    /** Which member logged it; the credit is still the family's. */
    contributedByUserId: z.string(),
    dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    amount: z.number().int().min(1).max(10).default(1),
    focusSessionId: z.string().nullable().default(null),
    source: z.enum(['self_reported', 'app_observed']),
    createdAt: z.coerce.date(),
  })
  .strict();
export type GoalContribution = z.infer<typeof goalContributionSchema>;

export interface GoalProgress {
  readonly goalId: string;
  readonly target: number;
  readonly achieved: number;
  readonly remaining: number;
  readonly reached: boolean;
  /** Who joined in. Shown as a list, never as a leaderboard. */
  readonly contributorIds: readonly string[];
  readonly adultsTookPart: boolean;
}

export function goalProgress(args: {
  goal: Goal;
  contributions: readonly GoalContribution[];
  adultUserIds: readonly string[];
}): GoalProgress {
  const relevant = args.contributions.filter(
    (contribution) => contribution.goalId === args.goal.id,
  );
  const achieved = relevant.reduce((sum, contribution) => sum + contribution.amount, 0);
  const contributorIds = [...new Set(relevant.map((c) => c.contributedByUserId))];
  return {
    goalId: args.goal.id,
    target: args.goal.target,
    achieved,
    remaining: Math.max(0, args.goal.target - achieved),
    reached: achieved >= args.goal.target,
    contributorIds,
    adultsTookPart: contributorIds.some((id) => args.adultUserIds.includes(id)),
  };
}

/* --------------------------- celebration cards --------------------------- */

export const achievementKinds = [
  'first_agreement',
  'first_focus_moment',
  'goal_reached',
  'week_reviewed',
  'everyone_joined_in',
] as const;
export type AchievementKind = (typeof achievementKinds)[number];

export const achievementSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    kind: z.enum(achievementKinds),
    /** Collective by construction: an achievement has no single owner. */
    goalId: z.string().nullable().default(null),
    titleKey: z.string().min(1).max(80),
    bodyKey: z.string().min(1).max(120),
    earnedAt: z.coerce.date(),
    /** Private to the family. There is no sharing surface and no ranking. */
    visibility: z.literal('family_private').default('family_private'),
  })
  .strict();
export type Achievement = z.infer<typeof achievementSchema>;

export interface CelebrationCard {
  readonly kind: AchievementKind;
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly participantIds: readonly string[];
  readonly visibility: 'family_private';
}

/**
 * Build the card for a reached goal. Note what is absent: no score, no
 * comparison with other families, no "you almost lost your streak".
 */
export function celebrationForGoal(
  goal: Goal,
  progress: GoalProgress,
): CelebrationCard | null {
  if (!progress.reached) return null;
  return {
    kind: progress.adultsTookPart ? 'everyone_joined_in' : 'goal_reached',
    titleKey: 'celebration.goal.title',
    bodyKey: progress.adultsTookPart
      ? 'celebration.goal.body_everyone'
      : 'celebration.goal.body',
    participantIds: progress.contributorIds,
    visibility: 'family_private',
  };
}

/**
 * Momentum, not streaks. We count the best week the family ever had and the
 * current week; a quiet week lowers the current number but never removes the
 * best one, and no notification is sent about a "lost" streak.
 */
export interface Momentum {
  readonly currentWeek: number;
  readonly bestWeek: number;
  readonly lostAnything: false;
}

export function momentum(weeklyCounts: readonly number[]): Momentum {
  const current = weeklyCounts.length > 0 ? (weeklyCounts[weeklyCounts.length - 1] ?? 0) : 0;
  const best = weeklyCounts.reduce((max, value) => (value > max ? value : max), 0);
  return { currentWeek: current, bestWeek: best, lostAnything: false };
}

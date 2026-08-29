import {
  assertCan,
  celebrationForGoal,
  DomainError,
  goalKinds,
  goalProgress,
  localDateKey,
  momentum,
  type Goal,
  type GoalContribution,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { newId, requireFamily, type Services } from '../context.js';

const goalInputSchema = z.object({
  kind: z.enum(goalKinds),
  title: z.string().min(3).max(80),
  target: z.number().int().min(1).max(50),
  periodDays: z.number().int().min(1).max(31).default(7),
  participantIds: z.array(z.string().min(1)).min(1),
});

function toDomainGoal(row: {
  id: string;
  familyId: string;
  kind: string;
  title: string;
  target: number;
  periodDays: number;
  startsOnDayKey: string;
  participantIds: string[];
  createdByUserId: string;
  createdAt: Date;
  archivedAt: Date | null;
}): Goal {
  return { ...row, kind: row.kind as Goal['kind'] };
}

function toDomainContribution(row: {
  id: string;
  goalId: string;
  familyId: string;
  contributedByUserId: string;
  dayKey: string;
  amount: number;
  focusSessionId: string | null;
  source: string;
  createdAt: Date;
}): GoalContribution {
  return { ...row, source: row.source as GoalContribution['source'] };
}

export async function registerGoalRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  app.get('/goals', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'goal.read', { familyId: session.familyId });

    const [goals, contributions, guardians, achievements] = await Promise.all([
      prisma.goal.findMany({
        where: { familyId: session.familyId, archivedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.goalContribution.findMany({ where: { familyId: session.familyId } }),
      prisma.membership.findMany({
        where: { familyId: session.familyId, role: 'guardian', removedAt: null },
      }),
      prisma.achievement.findMany({
        where: { familyId: session.familyId },
        orderBy: { earnedAt: 'desc' },
      }),
    ]);

    const adultUserIds = guardians.map((guardian) => guardian.userId);
    const domainContributions = contributions.map(toDomainContribution);

    return {
      goals: goals.map((row) => {
        const goal = toDomainGoal(row);
        const progress = goalProgress({
          goal,
          contributions: domainContributions,
          adultUserIds,
        });
        return { goal, progress, celebration: celebrationForGoal(goal, progress) };
      }),
      // Momentum, never a streak that can be lost.
      momentum: momentum(weeklyCounts(domainContributions)),
      achievements: achievements.map((achievement) => ({
        id: achievement.id,
        kind: achievement.kind,
        titleKey: achievement.titleKey,
        bodyKey: achievement.bodyKey,
        earnedAt: achievement.earnedAt,
        visibility: achievement.visibility,
      })),
    };
  });

  app.post('/goals', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'goal.create', { familyId: session.familyId });
    const body = goalInputSchema.parse(request.body);
    const created = await prisma.goal.create({
      data: {
        id: newId('goal'),
        familyId: session.familyId,
        kind: body.kind,
        title: body.title,
        target: body.target,
        periodDays: body.periodDays,
        startsOnDayKey: localDateKey(new Date()),
        participantIds: body.participantIds,
        createdByUserId: session.actor.userId,
      },
    });
    return reply.code(201).send({ goal: toDomainGoal(created) });
  });

  /** Anyone in the family can log a contribution, adults included. */
  app.post('/goals/:id/contributions', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'goal.contribute', { familyId: session.familyId });
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        amount: z.number().int().min(1).max(10).default(1),
        focusSessionId: z.string().nullable().default(null),
        dayKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      })
      .parse(request.body);

    const goal = await prisma.goal.findFirst({
      where: { id, familyId: session.familyId, archivedAt: null },
    });
    if (!goal) throw new DomainError('not_found', 'goal.not_found');

    const created = await prisma.goalContribution.create({
      data: {
        id: newId('gc'),
        goalId: id,
        familyId: session.familyId,
        contributedByUserId: session.actor.userId,
        dayKey: body.dayKey ?? localDateKey(new Date()),
        amount: body.amount,
        focusSessionId: body.focusSessionId,
        source: body.focusSessionId ? 'app_observed' : 'self_reported',
      },
    });

    const [contributions, guardians] = await Promise.all([
      prisma.goalContribution.findMany({ where: { goalId: id } }),
      prisma.membership.findMany({
        where: { familyId: session.familyId, role: 'guardian', removedAt: null },
      }),
    ]);
    const progress = goalProgress({
      goal: toDomainGoal(goal),
      contributions: contributions.map(toDomainContribution),
      adultUserIds: guardians.map((guardian) => guardian.userId),
    });
    const celebration = celebrationForGoal(toDomainGoal(goal), progress);

    // A celebration card is created once and stays inside the family.
    if (celebration) {
      await prisma.achievement.upsert({
        where: { id: `ach_${id}` },
        create: {
          id: `ach_${id}`,
          familyId: session.familyId,
          goalId: id,
          kind: celebration.kind,
          titleKey: celebration.titleKey,
          bodyKey: celebration.bodyKey,
        },
        update: {},
      });
    }

    return reply.code(201).send({
      contribution: toDomainContribution(created),
      progress,
      celebration,
    });
  });
}

function weeklyCounts(contributions: readonly GoalContribution[]): number[] {
  const byWeek = new Map<string, number>();
  for (const contribution of contributions) {
    const date = new Date(`${contribution.dayKey}T12:00:00`);
    const monday = new Date(date);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    const key = localDateKey(monday);
    byWeek.set(key, (byWeek.get(key) ?? 0) + contribution.amount);
  }
  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
}

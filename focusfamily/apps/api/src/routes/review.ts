import {
  assertCan,
  buildWeeklyReview,
  checkInSchema,
  recommendOne,
  startOfWeek,
  type CheckIn,
  type DataSourceKind,
  type Goal,
  type GoalContribution,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireFamily, type Services } from '../context.js';
import { toDomainSession } from '../mappers.js';
import { toDomainAgreement } from './agreements.js';

export async function registerReviewRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  /**
   * The weekly review and the single recommendation, built from the same data.
   * Both are held back while the neutral first week is running - `recommendOne`
   * checks the baseline itself, so there is no way to bypass it here.
   */
  app.get('/review/week', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'checkin.read_family_aggregate', {
      familyId: session.familyId,
    });
    const query = z
      .object({ weekOf: z.coerce.date().optional() })
      .parse(request.query ?? {});
    const now = new Date();
    const weekOf = query.weekOf ?? now;
    const weekStart = startOfWeek(weekOf);

    const [family, agreementRows, sessionRows, checkInRows, goalRows, contributionRows, guardians, usageRows, schedules] =
      await Promise.all([
        prisma.family.findUniqueOrThrow({ where: { id: session.familyId } }),
        prisma.familyAgreement.findMany({
          where: { familyId: session.familyId },
          include: { rules: true },
        }),
        prisma.focusSession.findMany({
          where: { familyId: session.familyId },
          include: { events: true },
        }),
        prisma.checkIn.findMany({ where: { familyId: session.familyId } }),
        prisma.goal.findMany({ where: { familyId: session.familyId, archivedAt: null } }),
        prisma.goalContribution.findMany({ where: { familyId: session.familyId } }),
        prisma.membership.findMany({
          where: { familyId: session.familyId, role: 'guardian', removedAt: null },
        }),
        prisma.usageSummary.findMany({
          where: { familyId: session.familyId },
          select: { source: true },
          distinct: ['source'],
        }),
        prisma.focusSchedule.findMany({ where: { familyId: session.familyId } }),
      ]);

    const agreements = agreementRows.map(toDomainAgreement);
    const focusSessions = sessionRows.map(toDomainSession);
    const checkIns: CheckIn[] = checkInRows.map((row) =>
      checkInSchema.parse({ ...row, source: 'self_reported' }),
    );
    const goals: Goal[] = goalRows.map((row) => ({ ...row, kind: row.kind as Goal['kind'] }));
    const goalContributions: GoalContribution[] = contributionRows.map((row) => ({
      ...row,
      source: row.source as GoalContribution['source'],
    }));
    const usageSources = usageRows.map((row) => row.source as DataSourceKind);
    const adultUserIds = guardians.map((guardian) => guardian.userId);

    const review = buildWeeklyReview({
      familyId: session.familyId,
      weekOf: weekStart,
      now,
      adultUserIds,
      agreements,
      focusSessions,
      checkIns,
      goals,
      goalContributions,
      usageSources,
    });

    const recommendation = recommendOne({
      family: { baselineStartedAt: family.baselineStartedAt },
      now,
      guardianCount: adultUserIds.length,
      agreements,
      focusSessions: focusSessions.filter(
        (item) => item.createdAt.getTime() >= weekStart.getTime() - 7 * 86_400_000,
      ),
      checkIns: checkIns.filter(
        (item) => item.createdAt.getTime() >= weekStart.getTime() - 7 * 86_400_000,
      ),
      hasDinnerSchedule: schedules.some(
        (schedule) => schedule.kind === 'dinner' && schedule.enabled,
      ),
      usageSources,
    });

    return {
      review,
      recommendation,
      // Stated explicitly so a client cannot present a suggestion as a model output.
      recommendationEngine: 'deterministic_rules_v1',
      aiAdvisorEnabled: services.config.AI_ADVISOR_ENABLED === '1',
    };
  });
}

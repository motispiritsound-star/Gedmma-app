import { assertCan } from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { audit, requireSession, type Services } from '../context.js';

/**
 * The back office.
 *
 * Support staff get counts and nothing else. There is no endpoint here that
 * takes a family id, and `assertCan` refuses every family permission for an
 * actor without a membership - so even a bug in this file cannot turn into a
 * way to read a family's agreements.
 */
export async function registerAdminRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  app.get('/admin/metrics', async (request) => {
    const session = requireSession(request);
    assertCan(session.actor, 'admin.metrics.read');

    const [families, guardians, children, activeAgreements, focusSessions, subscriptions] =
      await Promise.all([
        prisma.family.count(),
        prisma.membership.count({ where: { role: 'guardian', removedAt: null } }),
        prisma.membership.count({ where: { role: 'child', removedAt: null } }),
        prisma.familyAgreement.count({ where: { status: 'active' } }),
        prisma.focusSession.count(),
        prisma.subscription.groupBy({ by: ['plan'], _count: { _all: true } }),
      ]);

    await audit(services, {
      actorUserId: session.actor.userId,
      action: 'admin.metrics.viewed',
    });

    return {
      // Aggregates only. No names, no ids, no content.
      families,
      guardians,
      children,
      activeAgreements,
      focusSessions,
      plans: subscriptions.map((row) => ({ plan: row.plan, count: row._count._all })),
      note: 'Aggregate counts only. Support staff cannot open family content.',
    };
  });
}

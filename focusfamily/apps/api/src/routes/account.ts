import { FEATURE_FROM_DB, type DbFeature } from '@focusfamily/db';
import {
  DELETION_GRACE_DAYS,
  DomainError,
  MockBillingProvider,
  NOT_COLLECTED,
  assertCan,
  defaultPreference,
  effectivePlan,
  notificationCategories,
  notificationPreferenceSchema,
  scheduleDeletion,
  shouldDeliver,
  type ExportBundle,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit, newId, requireFamily, type Services } from '../context.js';
import { toDomainSubscription } from '../mappers.js';

const preferenceSchema = z.object({
  enabledCategories: z.array(z.enum(notificationCategories)),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  quietHoursEnabled: z.boolean(),
  channel: z.enum(['push', 'email', 'none']),
});

const billing = new MockBillingProvider();

export async function registerAccountRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  /* ----------------------------- notifications --------------------------- */

  app.get('/notifications/preferences', async (request) => {
    const session = requireFamily(request);
    const row = await prisma.notificationPreference.findUnique({
      where: { userId_familyId: { userId: session.actor.userId, familyId: session.familyId } },
    });
    const preference = row
      ? notificationPreferenceSchema.parse({
          ...row,
          enabledCategories: row.enabledCategories,
        })
      : defaultPreference({
          id: 'unsaved',
          userId: session.actor.userId,
          familyId: session.familyId,
          isChild: session.actor.role === 'child',
          now: new Date(),
        });

    const now = new Date();
    return {
      preference,
      // A live preview, so the setting is not an abstraction.
      previewNow: Object.fromEntries(
        notificationCategories.map((category) => [
          category,
          shouldDeliver({ preference, category, now }),
        ]),
      ),
    };
  });

  app.patch('/notifications/preferences', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'notification.preference.update', {
      familyId: session.familyId,
      subjectUserId: session.actor.userId,
    });
    const body = preferenceSchema.parse(request.body);
    const saved = await prisma.notificationPreference.upsert({
      where: { userId_familyId: { userId: session.actor.userId, familyId: session.familyId } },
      create: { id: newId('np'), userId: session.actor.userId, familyId: session.familyId, ...body },
      update: body,
    });
    return { preference: notificationPreferenceSchema.parse(saved) };
  });

  /* ------------------------------- billing ------------------------------- */

  app.get('/billing', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'subscription.read', { familyId: session.familyId });
    const [row, entitlements] = await Promise.all([
      prisma.subscription.findFirst({
        where: { familyId: session.familyId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.entitlement.findMany({ where: { familyId: session.familyId } }),
    ]);
    const subscription = toDomainSubscription(row);
    return {
      subscription,
      plan: effectivePlan(subscription),
      entitlements: entitlements.map((entitlement) => ({
        feature: FEATURE_FROM_DB[entitlement.feature as DbFeature],
        source: entitlement.source,
        expiresAt: entitlement.expiresAt,
      })),
      provider: services.config.BILLING_PROVIDER,
      testMode: true,
    };
  });

  /**
   * Checkout. With no Stripe key configured this uses the mock provider, which
   * says so out loud rather than pretending a payment happened.
   */
  app.post('/billing/checkout', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'subscription.manage', { familyId: session.familyId });
    const body = z
      .object({ plan: z.enum(['family_premium', 'sponsored']) })
      .parse(request.body);

    if (services.config.BILLING_PROVIDER === 'stripe_test') {
      // Deliberately not implemented behind a fake success: a deployment that
      // sets stripe_test without a price id should fail loudly at this point.
      if (!services.config.STRIPE_PRICE_FAMILY_PREMIUM) {
        throw new DomainError('capability_unavailable', 'billing.stripe_not_configured');
      }
    }

    const checkout = await billing.createCheckout({
      familyId: session.familyId,
      plan: body.plan,
      successUrl: `${services.config.WEB_BASE_URL}/app/settings/plan`,
      cancelUrl: `${services.config.WEB_BASE_URL}/pricing`,
    });
    return reply.code(201).send({ checkout, testMode: true });
  });

  app.post('/billing/confirm', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'subscription.manage', { familyId: session.familyId });
    const body = z.object({ sessionId: z.string().min(1) }).parse(request.body);
    const confirmed = await billing.confirm(body.sessionId);
    const saved = await prisma.subscription.upsert({
      where: { id: `sub_${session.familyId}` },
      create: {
        id: `sub_${session.familyId}`,
        familyId: session.familyId,
        plan: confirmed.plan,
        status: confirmed.status,
        provider: 'mock',
        providerRef: confirmed.providerRef,
        currentPeriodEnd: confirmed.currentPeriodEnd,
      },
      update: {
        plan: confirmed.plan,
        status: confirmed.status,
        providerRef: confirmed.providerRef,
        currentPeriodEnd: confirmed.currentPeriodEnd,
      },
    });
    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'subscription.changed',
      metadata: { plan: confirmed.plan, provider: 'mock' },
    });
    return { subscription: toDomainSubscription(saved) };
  });

  /**
   * Redeem an employer or school code. The sponsor never learns who redeemed
   * it: we store the sponsor's name on the family, and nothing about the
   * family on the sponsor.
   */
  app.post('/billing/sponsor-code', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'subscription.manage', { familyId: session.familyId });
    const body = z.object({ code: z.string().min(4).max(40) }).parse(request.body);
    const sponsorName = body.code.toUpperCase().startsWith('SCHOOL-')
      ? 'Deelnemende school'
      : 'Deelnemende werkgever';
    const saved = await prisma.subscription.upsert({
      where: { id: `sub_${session.familyId}` },
      create: {
        id: `sub_${session.familyId}`,
        familyId: session.familyId,
        plan: 'sponsored',
        status: 'active',
        provider: 'sponsor_code',
        providerRef: body.code,
        sponsorName,
        currentPeriodEnd: new Date(Date.now() + 365 * 86_400_000),
      },
      update: {
        plan: 'sponsored',
        status: 'active',
        provider: 'sponsor_code',
        providerRef: body.code,
        sponsorName,
      },
    });
    return { subscription: toDomainSubscription(saved) };
  });

  /* ------------------------------ data rights ---------------------------- */

  app.post('/account/export', async (request, reply) => {
    const session = requireFamily(request);
    const body = z.object({ scope: z.enum(['self', 'family']).default('self') }).parse(
      request.body ?? {},
    );
    assertCan(session.actor, 'export.request', {
      familyId: session.familyId,
      subjectUserId: session.actor.userId,
    });
    // Only a guardian may take the whole family with them.
    if (body.scope === 'family' && session.actor.role !== 'guardian') {
      throw DomainError.forbidden('authz.guardian_only');
    }

    const bundle = await buildExportBundle(services, {
      familyId: session.familyId,
      userId: session.actor.userId,
      scope: body.scope,
    });

    const saved = await prisma.dataExportRequest.create({
      data: {
        id: newId('exp'),
        familyId: session.familyId,
        requestedByUserId: session.actor.userId,
        scope: body.scope,
        format: 'json',
        status: 'ready',
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86_400_000),
        payload: bundle as unknown as object,
      },
    });
    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'export.requested',
      metadata: { scope: body.scope },
    });
    return reply.code(201).send({ requestId: saved.id, bundle });
  });

  /** The caller's own export requests, without the bundles themselves. */
  app.get('/account/export', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'export.request', {
      familyId: session.familyId,
      subjectUserId: session.actor.userId,
    });
    const rows = await prisma.dataExportRequest.findMany({
      where: { familyId: session.familyId, requestedByUserId: session.actor.userId },
      orderBy: { requestedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        scope: true,
        format: true,
        status: true,
        requestedAt: true,
        expiresAt: true,
      },
    });
    const now = Date.now();
    return {
      requests: rows.map((row) => ({
        ...row,
        expired: row.expiresAt !== null && row.expiresAt.getTime() < now,
      })),
    };
  });

  app.get('/account/export/:id', async (request) => {
    const session = requireFamily(request);
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const row = await prisma.dataExportRequest.findFirst({
      where: { id, familyId: session.familyId, requestedByUserId: session.actor.userId },
    });
    if (!row) throw new DomainError('not_found', 'export.not_found');
    if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
      throw new DomainError('not_found', 'export.expired');
    }
    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'export.delivered',
    });
    return { request: { id: row.id, scope: row.scope, status: row.status }, bundle: row.payload };
  });

  app.post('/account/deletion', async (request, reply) => {
    const session = requireFamily(request);
    const body = z
      .object({
        scope: z.enum(['self', 'child_profile', 'family']).default('self'),
        subjectUserId: z.string().nullable().default(null),
      })
      .parse(request.body ?? {});
    assertCan(session.actor, 'deletion.request', { familyId: session.familyId });
    if (body.scope !== 'self' && session.actor.role !== 'guardian') {
      throw DomainError.forbidden('authz.guardian_only');
    }

    const requested = scheduleDeletion({
      id: newId('del'),
      familyId: session.familyId,
      requestedByUserId: session.actor.userId,
      subjectUserId: body.scope === 'self' ? session.actor.userId : body.subjectUserId,
      scope: body.scope,
      now: new Date(),
    });
    const saved = await prisma.deletionRequest.create({ data: requested });
    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'deletion.requested',
      metadata: { scope: body.scope, graceDays: DELETION_GRACE_DAYS },
    });
    return reply.code(201).send({
      request: saved,
      graceDays: DELETION_GRACE_DAYS,
      cancellableUntil: saved.executeAfter,
    });
  });

  app.delete('/account/deletion/:id', async (request) => {
    const session = requireFamily(request);
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const row = await prisma.deletionRequest.findFirst({
      where: { id, familyId: session.familyId },
    });
    if (!row) throw new DomainError('not_found', 'deletion.not_found');
    if (row.requestedByUserId !== session.actor.userId && session.actor.role !== 'guardian') {
      throw DomainError.forbidden('authz.self_only');
    }
    const updated = await prisma.deletionRequest.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'deletion.cancelled',
    });
    return { request: updated };
  });

  /**
   * Execute a deletion that is past its grace period. In a deployment this is
   * a scheduled job; it is exposed here so the demo can show the whole cycle.
   */
  app.post('/account/deletion/:id/execute', async (request) => {
    const session = requireFamily(request);
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const row = await prisma.deletionRequest.findFirst({
      where: { id, familyId: session.familyId },
    });
    if (!row) throw new DomainError('not_found', 'deletion.not_found');
    if (row.status !== 'scheduled') throw new DomainError('conflict', 'deletion.not_scheduled');
    if (row.executeAfter.getTime() > Date.now()) {
      throw new DomainError('conflict', 'deletion.still_in_grace_period');
    }

    if (row.scope === 'family') {
      await prisma.family.delete({ where: { id: session.familyId } });
    } else if (row.subjectUserId) {
      await prisma.user.delete({ where: { id: row.subjectUserId } });
    }
    await audit(services, {
      familyId: null,
      actorUserId: session.actor.userId,
      action: 'deletion.completed',
      metadata: { scope: row.scope },
    });
    return { deleted: true, scope: row.scope };
  });

  app.get('/account/deletion', async (request) => {
    const session = requireFamily(request);
    const rows = await prisma.deletionRequest.findMany({
      where: { familyId: session.familyId },
      orderBy: { requestedAt: 'desc' },
    });
    return { requests: rows, graceDays: DELETION_GRACE_DAYS };
  });
}

/**
 * Build the export bundle. Note the `notCollected` list: the file states what
 * was never held, so "everything about me" is verifiable rather than implied.
 */
async function buildExportBundle(
  services: Services,
  args: { familyId: string; userId: string; scope: 'self' | 'family' },
): Promise<ExportBundle> {
  const { prisma } = services;
  const whereUser = args.scope === 'family' ? {} : { userId: args.userId };
  const [user, family, memberships, consents, sources, usage, agreements, schedules, sessions, checkIns, goals, contributions, achievements, preferences, subscriptions, auditLog] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: args.userId } }),
      prisma.family.findUnique({ where: { id: args.familyId } }),
      prisma.membership.findMany({ where: { familyId: args.familyId, ...whereUser } }),
      prisma.consentRecord.findMany({
        where:
          args.scope === 'family'
            ? { familyId: args.familyId }
            : { familyId: args.familyId, subjectUserId: args.userId },
      }),
      prisma.measurementSource.findMany({ where: { familyId: args.familyId } }),
      prisma.usageSummary.findMany({ where: { familyId: args.familyId, ...whereUser } }),
      prisma.familyAgreement.findMany({
        where: { familyId: args.familyId },
        include: { rules: true },
      }),
      prisma.focusSchedule.findMany({ where: { familyId: args.familyId } }),
      prisma.focusSession.findMany({
        where: { familyId: args.familyId },
        include: { events: true },
      }),
      prisma.checkIn.findMany({ where: { familyId: args.familyId, ...whereUser } }),
      prisma.goal.findMany({ where: { familyId: args.familyId } }),
      prisma.goalContribution.findMany({ where: { familyId: args.familyId } }),
      prisma.achievement.findMany({ where: { familyId: args.familyId } }),
      prisma.notificationPreference.findMany({ where: { familyId: args.familyId, ...whereUser } }),
      prisma.subscription.findMany({ where: { familyId: args.familyId } }),
      prisma.auditLog.findMany({ where: { familyId: args.familyId }, take: 500 }),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    scope: args.scope,
    format: 'json',
    subject: { userId: user.id, displayName: user.displayName },
    family: family ? { id: family.id, name: family.name } : null,
    sections: {
      memberships,
      consentRecords: consents,
      measurementSources: sources,
      usageSummaries: usage,
      agreements,
      focusSchedules: schedules,
      focusSessions: sessions,
      checkIns,
      goals,
      goalContributions: contributions,
      achievements,
      notificationPreferences: preferences,
      subscriptions,
      auditLog,
    },
    notCollected: NOT_COLLECTED,
  };
}

import { AGE_BAND_FROM_DB, AGE_BAND_TO_DB, type DbAgeBand } from '@focusfamily/db';
import {
  AGREEMENT_TEMPLATES,
  DomainError,
  agreementContexts,
  ageBands,
  assertCan,
  assertNonDiagnostic,
  effectivePlan,
  hasFeature,
  ruleAudiences,
  ruleKinds,
  rulesFor,
  validateAgreement,
  type AgeBand,
  type AgreementRule,
  type FamilyAgreement,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit, newId, requireFamily, type Services } from '../context.js';
import { toDomainSubscription } from '../mappers.js';

const ruleInputSchema = z.object({
  context: z.enum(agreementContexts),
  kind: z.enum(ruleKinds),
  audience: z.enum(ruleAudiences),
  memberId: z.string().nullable().default(null),
  ageBands: z.array(z.enum(ageBands)).default([]),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().default(null),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().default(null),
  weekdays: z.array(z.number().int().min(0).max(6)).default([]),
  text: z.string().min(3).max(240),
  repairText: z.string().max(240).nullable().default(null),
});

const agreementInputSchema = z.object({
  title: z.string().min(3).max(80),
  rules: z.array(ruleInputSchema).min(1).max(30),
});

type DbAgreement = {
  id: string;
  familyId: string;
  title: string;
  status: string;
  agreedByUserIds: string[];
  createdByUserId: string;
  createdAt: Date;
  activatedAt: Date | null;
  reviewOnDayKey: string | null;
  rules: Array<{
    id: string;
    agreementId: string;
    context: string;
    kind: string;
    audience: string;
    memberId: string | null;
    ageBands: string[];
    startsAt: string | null;
    endsAt: string | null;
    weekdays: number[];
    text: string;
    repairText: string | null;
    createdAt: Date;
  }>;
};

export function toDomainAgreement(row: DbAgreement): FamilyAgreement {
  return {
    id: row.id,
    familyId: row.familyId,
    title: row.title,
    status: row.status as FamilyAgreement['status'],
    agreedByUserIds: row.agreedByUserIds,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
    activatedAt: row.activatedAt,
    reviewOnDayKey: row.reviewOnDayKey,
    rules: row.rules.map(
      (rule): AgreementRule => ({
        id: rule.id,
        agreementId: rule.agreementId,
        context: rule.context as AgreementRule['context'],
        kind: rule.kind as AgreementRule['kind'],
        audience: rule.audience as AgreementRule['audience'],
        memberId: rule.memberId,
        ageBands: rule.ageBands.map((band) => AGE_BAND_FROM_DB[band as DbAgeBand]),
        startsAt: rule.startsAt,
        endsAt: rule.endsAt,
        weekdays: rule.weekdays,
        text: rule.text,
        repairText: rule.repairText,
        createdAt: rule.createdAt,
      }),
    ),
  };
}

export async function registerAgreementRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  /** Starting points the family edits in their own words. */
  app.get('/agreements/templates', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'agreement.read', { familyId: session.familyId });
    return { templates: AGREEMENT_TEMPLATES };
  });

  app.get('/agreements', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'agreement.read', { familyId: session.familyId });
    const rows = await prisma.familyAgreement.findMany({
      where: { familyId: session.familyId },
      include: { rules: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    const agreements = rows.map(toDomainAgreement);

    // "What applies to me" - computed for the caller, adults included.
    const mine = agreements
      .filter((agreement) => agreement.status === 'active')
      .flatMap((agreement) =>
        rulesFor(agreement, {
          memberId: session.actor.userId,
          ageBand: session.actor.ageBand,
        }),
      );

    return {
      agreements: agreements.map((agreement) => ({
        ...agreement,
        issues: validateAgreement(agreement),
        bindsMe: rulesFor(agreement, {
          memberId: session.actor.userId,
          ageBand: session.actor.ageBand,
        }).length,
      })),
      appliesToMe: mine,
    };
  });

  app.post('/agreements', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'agreement.create', { familyId: session.familyId });
    const body = agreementInputSchema.parse(request.body);
    for (const rule of body.rules) {
      assertNonDiagnostic(rule.text);
      if (rule.repairText) assertNonDiagnostic(rule.repairText);
    }

    // A second agreement is a Premium feature; the first one is always free.
    const existing = await prisma.familyAgreement.count({
      where: { familyId: session.familyId, status: { in: ['draft', 'proposed', 'active'] } },
    });
    if (existing >= 1) {
      const subscription = await prisma.subscription.findFirst({
        where: { familyId: session.familyId },
        orderBy: { createdAt: 'desc' },
      });
      const allowed = hasFeature({
        subscription: toDomainSubscription(subscription),
        feature: 'agreements.multiple',
      });
      if (!allowed) {
        throw new DomainError('entitlement_required', 'billing.upgrade_needed', {
          feature: 'agreements.multiple',
        });
      }
    }

    const id = newId('agr');
    await prisma.familyAgreement.create({
      data: {
        id,
        familyId: session.familyId,
        title: body.title,
        status: 'draft',
        agreedByUserIds: [session.actor.userId],
        createdByUserId: session.actor.userId,
        rules: {
          create: body.rules.map((rule) => ({
            id: newId('rule'),
            context: rule.context,
            kind: rule.kind,
            audience: rule.audience,
            memberId: rule.memberId,
            ageBands: rule.ageBands.map((band) => AGE_BAND_TO_DB[band as AgeBand]),
            startsAt: rule.startsAt,
            endsAt: rule.endsAt,
            weekdays: rule.weekdays,
            text: rule.text,
            repairText: rule.repairText,
          })),
        },
      },
    });

    const created = await prisma.familyAgreement.findUniqueOrThrow({
      where: { id },
      include: { rules: true },
    });
    return reply.code(201).send({
      agreement: toDomainAgreement(created),
      issues: validateAgreement(toDomainAgreement(created)),
    });
  });

  /**
   * Activation is the moment the rules start applying. It is refused unless at
   * least one rule binds an adult - the product principle, enforced in code.
   */
  app.post('/agreements/:id/activate', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'agreement.activate', { familyId: session.familyId });
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);

    const row = await prisma.familyAgreement.findFirst({
      where: { id, familyId: session.familyId },
      include: { rules: true },
    });
    if (!row) throw new DomainError('not_found', 'agreement.not_found');

    const agreement = toDomainAgreement(row);
    const issues = validateAgreement(agreement);
    if (issues.length > 0) {
      throw DomainError.policy('agreement.not_activatable', {
        issues: issues.map((issue) => issue.code),
      });
    }

    await prisma.$transaction([
      prisma.familyAgreement.updateMany({
        where: { familyId: session.familyId, status: 'active', id: { not: id } },
        data: { status: 'retired' },
      }),
      prisma.familyAgreement.update({
        where: { id },
        data: { status: 'active', activatedAt: new Date() },
      }),
    ]);

    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'agreement.activated',
      metadata: { rules: row.rules.length },
    });
    return { id, status: 'active' };
  });

  /** Anyone in the family, child included, can propose a change. */
  app.post('/agreements/:id/proposals', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'agreement.propose_change', { familyId: session.familyId });
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({ ruleId: z.string().min(1).nullable().default(null), text: z.string().min(3).max(240) })
      .parse(request.body);
    assertNonDiagnostic(body.text);

    const agreement = await prisma.familyAgreement.findFirst({
      where: { id, familyId: session.familyId },
    });
    if (!agreement) throw new DomainError('not_found', 'agreement.not_found');

    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'agreement.change_proposed',
      metadata: { agreementId: id, ruleId: body.ruleId ?? 'new' },
    });
    return reply.code(201).send({ proposed: true, agreementId: id, text: body.text });
  });

  /** The per-member transparency view: what applies to this person, and why. */
  app.get('/agreements/applies-to/:userId', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'agreement.read', { familyId: session.familyId });
    const { userId } = z.object({ userId: z.string().min(1) }).parse(request.params);

    const membership = await prisma.membership.findFirst({
      where: { familyId: session.familyId, userId, removedAt: null },
      include: { childProfile: true },
    });
    if (!membership) throw new DomainError('not_found', 'family.member_not_found');
    const ageBand: AgeBand = membership.childProfile
      ? AGE_BAND_FROM_DB[membership.childProfile.ageBand as DbAgeBand]
      : 'adult';

    const rows = await prisma.familyAgreement.findMany({
      where: { familyId: session.familyId, status: 'active' },
      include: { rules: true },
    });
    const rules = rows
      .map(toDomainAgreement)
      .flatMap((agreement) => rulesFor(agreement, { memberId: userId, ageBand }));

    return { userId, ageBand, rules };
  });

  app.get('/plan', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'subscription.read', { familyId: session.familyId });
    const subscription = await prisma.subscription.findFirst({
      where: { familyId: session.familyId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      plan: effectivePlan(toDomainSubscription(subscription)),
      status: subscription?.status ?? 'none',
    };
  });
}

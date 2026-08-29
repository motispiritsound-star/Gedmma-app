import {
  AGE_BAND_FROM_DB,
  AGE_BAND_TO_DB,
  CONSENT_SCOPE_FROM_DB,
  CONSENT_SCOPE_TO_DB,
  type DbAgeBand,
  type DbConsentScope,
  hashPassword,
  passwordIssues,
} from '@focusfamily/db';
import {
  BASELINE_DAYS,
  DomainError,
  MAX_CHILD_AGE,
  MIN_CHILD_AGE,
  ageBandFor,
  assertCan,
  baselineState,
  consentScopes,
  consentTimeline,
  dataSourceKinds,
  describeSource,
  evaluateConsent,
  measurementAllowed,
  requiresChildAssent,
  type AgeBand,
  type ConsentRecord,
  type ConsentScope,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  audit,
  newId,
  requireFamily,
  requireSession,
  type Services,
} from '../context.js';
import { createToken, hashToken } from '../security.js';

const createFamilySchema = z.object({
  name: z.string().min(1).max(80),
  timeZone: z.string().min(1).max(64).default('Europe/Amsterdam'),
  locale: z.enum(['nl', 'en']).default('nl'),
  displayName: z.string().min(1).max(60),
  /** Starting the neutral week is the default; skipping it must be deliberate. */
  startBaseline: z.boolean().default(true),
});

const inviteSchema = z.object({ email: z.string().email().max(200) });

const linkChildSchema = z.object({
  displayName: z.string().min(1).max(60),
  birthYear: z.number().int().min(1990).max(2100),
  email: z.string().email().max(200).nullable().default(null),
  password: z.string().min(1).max(200),
  canEditOwnAgreements: z.boolean().default(true),
});

const consentSchema = z.object({
  subjectUserId: z.string().min(1),
  scope: z.enum(consentScopes),
  decision: z.enum(['granted', 'withdrawn']),
  statementVersion: z.string().min(1).max(16).default('2026-01'),
});

const measurementSchema = z.object({
  sourceId: z.string().min(1),
  enabled: z.boolean(),
});

function toDomainConsent(row: {
  id: string;
  familyId: string;
  subjectUserId: string;
  actorUserId: string;
  scope: string;
  decision: string;
  statementKey: string;
  statementVersion: string;
  recordedAt: Date;
  supersededAt: Date | null;
}): ConsentRecord {
  return {
    id: row.id,
    familyId: row.familyId,
    subjectUserId: row.subjectUserId,
    actorUserId: row.actorUserId,
    scope: CONSENT_SCOPE_FROM_DB[row.scope as DbConsentScope],
    decision: row.decision as ConsentRecord['decision'],
    statementKey: row.statementKey,
    statementVersion: row.statementVersion,
    recordedAt: row.recordedAt,
    supersededAt: row.supersededAt,
  };
}

export async function registerFamilyRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  app.post('/families', async (request, reply) => {
    const session = requireSession(request);
    assertCan(session.actor, 'family.create');
    if (session.actor.familyId) {
      throw new DomainError('conflict', 'family.already_member');
    }
    const body = createFamilySchema.parse(request.body);
    const familyId = newId('fam');
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.family.create({
        data: {
          id: familyId,
          name: body.name,
          locale: body.locale,
          timeZone: body.timeZone,
          baselineStartedAt: body.startBaseline ? now : null,
        },
      });
      await tx.membership.create({
        data: {
          id: newId('mem'),
          familyId,
          userId: session.actor.userId,
          role: 'guardian',
          displayName: body.displayName,
        },
      });
      await tx.consentRecord.create({
        data: {
          id: newId('con'),
          familyId,
          subjectUserId: session.actor.userId,
          actorUserId: session.actor.userId,
          scope: 'account_basic',
          decision: 'granted',
          statementKey: 'consent.statement.account.basic',
          statementVersion: '2026-01',
        },
      });
      await tx.measurementSource.createMany({
        data: [
          {
            id: newId('ms'),
            familyId,
            userId: null,
            kind: 'app_observed',
            provider: 'focusfamily.timer',
            enabled: true,
          },
          {
            id: newId('ms'),
            familyId,
            userId: null,
            kind: 'self_reported',
            provider: 'focusfamily.form',
            enabled: true,
          },
        ],
      });
      await tx.notificationPreference.create({
        data: {
          id: newId('np'),
          userId: session.actor.userId,
          familyId,
          enabledCategories: [
            'focus_reminder',
            'checkin_invite',
            'weekly_review_ready',
            'agreement_change_proposed',
            'celebration',
            'account_security',
          ],
        },
      });
    });

    await audit(services, {
      familyId,
      actorUserId: session.actor.userId,
      action: 'family.created',
      metadata: { baseline: body.startBaseline },
    });
    return reply.code(201).send({ familyId, baselineDays: BASELINE_DAYS });
  });

  /** The family overview every member sees, children included. */
  app.get('/family', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'family.read', { familyId: session.familyId });
    const family = await prisma.family.findUniqueOrThrow({
      where: { id: session.familyId },
      include: {
        memberships: {
          where: { removedAt: null },
          include: { childProfile: true },
          orderBy: { joinedAt: 'asc' },
        },
        measurementSources: true,
      },
    });

    return {
      family: {
        id: family.id,
        name: family.name,
        locale: family.locale,
        timeZone: family.timeZone,
      },
      baseline: baselineState({ baselineStartedAt: family.baselineStartedAt }, new Date()),
      members: family.memberships.map((membership) => ({
        userId: membership.userId,
        membershipId: membership.id,
        displayName: membership.displayName,
        role: membership.role,
        ageBand: membership.childProfile
          ? AGE_BAND_FROM_DB[membership.childProfile.ageBand as DbAgeBand]
          : ('adult' as AgeBand),
      })),
      // Everyone can see exactly which measurements are running, and for whom.
      measurements: family.measurementSources.map((source) => ({
        id: source.id,
        userId: source.userId,
        provider: source.provider,
        enabled: source.enabled,
        label: describeSource(source.kind as (typeof dataSourceKinds)[number]),
      })),
    };
  });

  app.post('/family/invitations', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'family.invite_guardian', { familyId: session.familyId });
    const body = inviteSchema.parse(request.body);
    const token = createToken();
    const invitation = await prisma.invitation.create({
      data: {
        id: newId('inv'),
        familyId: session.familyId,
        email: body.email.toLowerCase(),
        role: 'guardian',
        tokenHash: hashToken(token),
        invitedBy: session.actor.userId,
        expiresAt: new Date(Date.now() + 14 * 86_400_000),
      },
    });
    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'guardian.invited',
    });
    // The token is returned once; a real deployment emails it instead.
    return reply.code(201).send({
      invitationId: invitation.id,
      token,
      expiresAt: invitation.expiresAt,
    });
  });

  app.post('/family/invitations/accept', async (request, reply) => {
    const session = requireSession(request);
    const body = z
      .object({ token: z.string().min(10), displayName: z.string().min(1).max(60) })
      .parse(request.body);
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash: hashToken(body.token) },
    });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() < Date.now()) {
      throw DomainError.invalid('invitation.invalid_or_expired');
    }
    if (session.actor.familyId && session.actor.familyId !== invitation.familyId) {
      throw new DomainError('conflict', 'family.already_member');
    }
    await prisma.$transaction(async (tx) => {
      await tx.membership.create({
        data: {
          id: newId('mem'),
          familyId: invitation.familyId,
          userId: session.actor.userId,
          role: 'guardian',
          displayName: body.displayName,
        },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      await tx.consentRecord.create({
        data: {
          id: newId('con'),
          familyId: invitation.familyId,
          subjectUserId: session.actor.userId,
          actorUserId: session.actor.userId,
          scope: 'account_basic',
          decision: 'granted',
          statementKey: 'consent.statement.account.basic',
          statementVersion: '2026-01',
        },
      });
      await tx.notificationPreference.create({
        data: {
          id: newId('np'),
          userId: session.actor.userId,
          familyId: invitation.familyId,
          enabledCategories: [
            'focus_reminder',
            'weekly_review_ready',
            'agreement_change_proposed',
            'celebration',
            'account_security',
          ],
        },
      });
    });
    await audit(services, {
      familyId: invitation.familyId,
      actorUserId: session.actor.userId,
      action: 'guardian.joined',
    });
    return reply.code(201).send({ familyId: invitation.familyId });
  });

  /**
   * Linking a child creates their account, their consent record and their
   * notification preference in one step, and records who did it.
   */
  app.post('/family/children', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'child.link', { familyId: session.familyId });
    const body = linkChildSchema.parse(request.body);
    const issues = passwordIssues(body.password);
    if (issues.length > 0) throw DomainError.invalid('password.rejected', { issues });

    const now = new Date();
    const age = now.getFullYear() - body.birthYear;
    if (age < MIN_CHILD_AGE || age > MAX_CHILD_AGE) {
      throw DomainError.invalid('child.age_out_of_range', {
        min: MIN_CHILD_AGE,
        max: MAX_CHILD_AGE,
      });
    }
    const ageBand = ageBandFor(age);
    const userId = newId('usr');
    const membershipId = newId('mem');

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          email: body.email ? body.email.toLowerCase() : null,
          passwordHash: await hashPassword(body.password),
          displayName: body.displayName,
          locale: 'nl',
        },
      });
      await tx.membership.create({
        data: {
          id: membershipId,
          familyId: session.familyId,
          userId,
          role: 'child',
          displayName: body.displayName,
        },
      });
      await tx.childProfile.create({
        data: {
          id: newId('cp'),
          membershipId,
          familyId: session.familyId,
          birthYear: body.birthYear,
          ageBand: AGE_BAND_TO_DB[ageBand],
          canEditOwnAgreements: body.canEditOwnAgreements,
          linkedByUserId: session.actor.userId,
        },
      });
      await tx.consentRecord.create({
        data: {
          id: newId('con'),
          familyId: session.familyId,
          subjectUserId: userId,
          actorUserId: session.actor.userId,
          scope: 'account_basic',
          decision: 'granted',
          statementKey: 'consent.statement.account.basic',
          statementVersion: '2026-01',
        },
      });
      await tx.notificationPreference.create({
        data: {
          id: newId('np'),
          userId,
          familyId: session.familyId,
          enabledCategories: ['focus_reminder', 'celebration', 'account_security'],
          quietHoursStart: ageBand === '8-10' ? '19:30' : '20:30',
          quietHoursEnd: '07:30',
        },
      });
    });

    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      action: 'child.linked',
      subjectUserId: userId,
      metadata: { ageBand },
    });
    return reply.code(201).send({
      userId,
      ageBand,
      assentRequired: requiresChildAssent(ageBand, 'measurement.os_verified'),
    });
  });

  /* -------------------------------- consent ------------------------------ */

  app.get('/consent', async (request) => {
    const session = requireFamily(request);
    const subjectUserId =
      (request.query as { subjectUserId?: string }).subjectUserId ?? session.actor.userId;
    assertCan(session.actor, 'consent.history.read', {
      familyId: session.familyId,
      subjectUserId,
    });

    const rows = await prisma.consentRecord.findMany({
      where: { familyId: session.familyId, subjectUserId },
      orderBy: { recordedAt: 'desc' },
    });
    const records = rows.map(toDomainConsent);
    const membership = await prisma.membership.findFirst({
      where: { familyId: session.familyId, userId: subjectUserId, removedAt: null },
      include: { childProfile: true },
    });
    const ageBand: AgeBand = membership?.childProfile
      ? AGE_BAND_FROM_DB[membership.childProfile.ageBand as DbAgeBand]
      : 'adult';

    return {
      subjectUserId,
      ageBand,
      states: consentScopes.map((scope) => ({
        ...evaluateConsent({ records, scope, subjectUserId, subjectAgeBand: ageBand }),
        assentRequired: requiresChildAssent(ageBand, scope),
        statementKey: `consent.statement.${scope}`,
      })),
      history: consentTimeline(records, subjectUserId).map((record) => ({
        id: record.id,
        scope: record.scope,
        decision: record.decision,
        actorUserId: record.actorUserId,
        statementKey: record.statementKey,
        statementVersion: record.statementVersion,
        recordedAt: record.recordedAt,
      })),
    };
  });

  app.post('/consent', async (request, reply) => {
    const session = requireFamily(request);
    const body = consentSchema.parse(request.body);
    const permission = body.decision === 'granted' ? 'consent.grant' : 'consent.withdraw';
    assertCan(session.actor, permission, {
      familyId: session.familyId,
      subjectUserId: body.subjectUserId,
    });

    // A guardian may consent on a child's behalf; nobody may consent on behalf
    // of another adult, and nobody may grant on behalf of a teenager's assent.
    if (body.subjectUserId !== session.actor.userId) {
      if (session.actor.role !== 'guardian') {
        throw DomainError.forbidden('authz.self_only');
      }
      const target = await prisma.membership.findFirst({
        where: { familyId: session.familyId, userId: body.subjectUserId, removedAt: null },
        include: { childProfile: true },
      });
      if (!target) throw new DomainError('not_found', 'family.member_not_found');
      if (target.role !== 'child') throw DomainError.forbidden('consent.adults_decide_for_themselves');
    }

    const record = await prisma.consentRecord.create({
      data: {
        id: newId('con'),
        familyId: session.familyId,
        subjectUserId: body.subjectUserId,
        actorUserId: session.actor.userId,
        scope: CONSENT_SCOPE_TO_DB[body.scope as ConsentScope],
        decision: body.decision,
        statementKey: `consent.statement.${body.scope}`,
        statementVersion: body.statementVersion,
      },
    });

    // Withdrawal switches the matching measurement off in the same breath.
    if (body.decision === 'withdrawn') {
      const kind =
        body.scope === 'measurement.os_verified'
          ? 'os_verified'
          : body.scope === 'measurement.app_observed'
            ? 'app_observed'
            : body.scope === 'measurement.self_report'
              ? 'self_reported'
              : null;
      if (kind) {
        await prisma.measurementSource.updateMany({
          where: { familyId: session.familyId, userId: body.subjectUserId, kind },
          data: { enabled: false, disabledAt: new Date() },
        });
      }
    }

    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      subjectUserId: body.subjectUserId,
      action: body.decision === 'granted' ? 'consent.granted' : 'consent.withdrawn',
      metadata: { scope: body.scope },
    });
    return reply.code(201).send({ id: record.id, recordedAt: record.recordedAt });
  });

  /* ------------------------ measurement on/off switch --------------------- */

  app.patch('/measurements', async (request) => {
    const session = requireFamily(request);
    const body = measurementSchema.parse(request.body);
    assertCan(session.actor, body.enabled ? 'measurement.enable' : 'measurement.disable', {
      familyId: session.familyId,
    });

    const source = await prisma.measurementSource.findFirst({
      where: { id: body.sourceId, familyId: session.familyId },
    });
    if (!source) throw new DomainError('not_found', 'measurement.not_found');

    if (body.enabled && source.userId) {
      const membership = await prisma.membership.findFirst({
        where: { familyId: session.familyId, userId: source.userId, removedAt: null },
        include: { childProfile: true },
      });
      const ageBand: AgeBand = membership?.childProfile
        ? AGE_BAND_FROM_DB[membership.childProfile.ageBand as DbAgeBand]
        : 'adult';
      const records = (
        await prisma.consentRecord.findMany({
          where: { familyId: session.familyId, subjectUserId: source.userId },
        })
      ).map(toDomainConsent);
      const state = measurementAllowed({
        records,
        subjectUserId: source.userId,
        subjectAgeBand: ageBand,
        source: source.kind as (typeof dataSourceKinds)[number],
      });
      // This is the line that stops a guardian switching on a measurement a
      // teenager has not agreed to.
      if (!state.effective) {
        throw new DomainError('consent_required', state.reasonKey, { scope: state.scope });
      }
    }

    const updated = await prisma.measurementSource.update({
      where: { id: source.id },
      data: { enabled: body.enabled, disabledAt: body.enabled ? null : new Date() },
    });
    await audit(services, {
      familyId: session.familyId,
      actorUserId: session.actor.userId,
      subjectUserId: source.userId,
      action: body.enabled ? 'measurement.enabled' : 'measurement.disabled',
      metadata: { provider: source.provider },
    });
    return { id: updated.id, enabled: updated.enabled };
  });
}

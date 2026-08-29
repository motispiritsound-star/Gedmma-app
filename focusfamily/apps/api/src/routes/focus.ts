import {
  DomainError,
  assertCan,
  countsAsCompleted,
  focusEventSchema,
  focusKinds,
  hasFeature,
  nextOccurrence,
  occurrencesInRange,
  pauseReasons,
  reconcileSession,
  sessionProgress,
  type FocusEvent,
  type FocusSchedule,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit, newId, requireFamily, type Services } from '../context.js';
import { toDomainSession, toDomainSubscription } from '../mappers.js';

const scheduleInputSchema = z.object({
  kind: z.enum(focusKinds),
  title: z.string().min(2).max(60),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  durationMinutes: z.number().int().min(5).max(240),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1),
  participantIds: z.array(z.string().min(1)).min(1),
  agreementId: z.string().nullable().default(null),
});

const startSessionSchema = z.object({
  scheduleId: z.string().nullable().default(null),
  participantIds: z.array(z.string().min(1)).min(1),
  plannedMinutes: z.number().int().min(1).max(240),
  /** Client id so an offline start can be retried without duplicating. */
  clientSessionId: z.string().min(1).max(64).nullable().default(null),
  startedAt: z.coerce.date().nullable().default(null),
});

const syncSchema = z.object({
  events: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        type: z.enum(['start', 'pause', 'resume', 'complete', 'abandon']),
        at: z.coerce.date(),
        reason: z.enum(pauseReasons).nullable().default(null),
        recordedOffline: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(200),
});

function toDomainSchedule(row: {
  id: string;
  familyId: string;
  agreementId: string | null;
  kind: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  weekdays: number[];
  participantIds: string[];
  enabled: boolean;
  createdAt: Date;
}): FocusSchedule {
  return {
    id: row.id,
    familyId: row.familyId,
    agreementId: row.agreementId,
    kind: row.kind as FocusSchedule['kind'],
    title: row.title,
    startsAt: row.startsAt,
    durationMinutes: row.durationMinutes,
    weekdays: row.weekdays,
    participantIds: row.participantIds,
    enabled: row.enabled,
    createdAt: row.createdAt,
  };
}

export async function registerFocusRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  app.get('/focus/schedules', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'focus.schedule.read', { familyId: session.familyId });
    const rows = await prisma.focusSchedule.findMany({
      where: { familyId: session.familyId },
      orderBy: { startsAt: 'asc' },
    });
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
    return {
      schedules: rows.map((row) => {
        const schedule = toDomainSchedule(row);
        return {
          ...schedule,
          nextOccurrence: nextOccurrence(schedule, now),
          thisWeek: occurrencesInRange(schedule, now, weekEnd),
          includesMe: schedule.participantIds.includes(session.actor.userId),
        };
      }),
    };
  });

  app.post('/focus/schedules', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'focus.schedule.create', { familyId: session.familyId });
    const body = scheduleInputSchema.parse(request.body);

    // Three schedules are free; a fourth needs Premium.
    const count = await prisma.focusSchedule.count({ where: { familyId: session.familyId } });
    if (count >= 3) {
      const subscription = await prisma.subscription.findFirst({
        where: { familyId: session.familyId },
        orderBy: { createdAt: 'desc' },
      });
      if (
        !hasFeature({
          subscription: toDomainSubscription(subscription),
          feature: 'focus.custom_schedules',
        })
      ) {
        throw new DomainError('entitlement_required', 'billing.upgrade_needed', {
          feature: 'focus.custom_schedules',
        });
      }
    }

    const members = await prisma.membership.findMany({
      where: { familyId: session.familyId, removedAt: null },
    });
    const memberIds = new Set(members.map((member) => member.userId));
    for (const id of body.participantIds) {
      if (!memberIds.has(id)) throw DomainError.invalid('focus.unknown_participant', { id });
    }

    const created = await prisma.focusSchedule.create({
      data: {
        id: newId('sch'),
        familyId: session.familyId,
        agreementId: body.agreementId,
        kind: body.kind,
        title: body.title,
        startsAt: body.startsAt,
        durationMinutes: body.durationMinutes,
        weekdays: body.weekdays,
        participantIds: body.participantIds,
      },
    });
    return reply.code(201).send({ schedule: toDomainSchedule(created) });
  });

  app.patch('/focus/schedules/:id', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'focus.schedule.update', { familyId: session.familyId });
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        enabled: z.boolean().optional(),
        durationMinutes: z.number().int().min(5).max(240).optional(),
        startsAt: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      })
      .parse(request.body);

    const existing = await prisma.focusSchedule.findFirst({
      where: { id, familyId: session.familyId },
    });
    if (!existing) throw new DomainError('not_found', 'focus.schedule_not_found');
    const updated = await prisma.focusSchedule.update({ where: { id }, data: body });
    return { schedule: toDomainSchedule(updated) };
  });

  /**
   * Starting a focus moment is voluntary and available to everyone, adults and
   * children alike. `clientSessionId` makes the call idempotent so a phone that
   * came back online does not create a second session.
   */
  app.post('/focus/sessions', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'focus.session.start', { familyId: session.familyId });
    const body = startSessionSchema.parse(request.body);

    const id = body.clientSessionId ? `fs_${body.clientSessionId}` : newId('fs');
    const existing = await prisma.focusSession.findUnique({
      where: { id },
      include: { events: true },
    });
    if (existing) {
      return reply.code(200).send({ session: toDomainSession(existing), reused: true });
    }

    const startedAt = body.startedAt ?? new Date();
    const created = await prisma.focusSession.create({
      data: {
        id,
        familyId: session.familyId,
        scheduleId: body.scheduleId,
        participantIds: [...new Set([session.actor.userId, ...body.participantIds])],
        startedByUserId: session.actor.userId,
        plannedMinutes: body.plannedMinutes,
        status: 'running',
        createdAt: startedAt,
        events: {
          create: [
            {
              id: `${id}_start`,
              type: 'start',
              at: startedAt,
              recordedOffline: body.startedAt !== null,
            },
          ],
        },
      },
      include: { events: true },
    });
    return reply.code(201).send({ session: toDomainSession(created), reused: false });
  });

  app.get('/focus/sessions', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'focus.session.read', { familyId: session.familyId });
    const rows = await prisma.focusSession.findMany({
      where: { familyId: session.familyId },
      include: { events: true },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    const now = new Date();
    return {
      sessions: rows.map((row) => {
        const domain = toDomainSession(row);
        return {
          ...domain,
          progress: sessionProgress(domain, now),
          completed: countsAsCompleted(domain, now),
        };
      }),
    };
  });

  /**
   * The offline reconciliation endpoint.
   *
   * The phone owns the timer; the server owns the truth about what has already
   * been accepted. Duplicates collapse, stale events after a finish are
   * rejected, and a device clock that runs ahead is clamped rather than
   * trusted. All of that logic lives in the domain package and is unit tested
   * there; this handler only persists the result.
   */
  app.post('/focus/sessions/:id/sync', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'focus.session.start', { familyId: session.familyId });
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const body = syncSchema.parse(request.body);

    const row = await prisma.focusSession.findFirst({
      where: { id, familyId: session.familyId },
      include: { events: true },
    });
    if (!row) throw new DomainError('not_found', 'focus.session_not_found');
    const server = toDomainSession(row);
    if (!server.participantIds.includes(session.actor.userId)) {
      throw DomainError.forbidden('focus.not_a_participant', { sessionId: id });
    }

    const incoming: FocusEvent[] = body.events.map((event) => focusEventSchema.parse(event));
    const serverNow = new Date();
    const result = reconcileSession({ server, incoming, serverNow });

    if (result.appliedEventIds.length > 0) {
      const applied = new Set(result.appliedEventIds);
      await prisma.focusSessionEvent.createMany({
        data: result.session.events
          .filter((event) => applied.has(event.id))
          .map((event) => ({
            id: event.id,
            sessionId: id,
            type: event.type,
            at: event.at,
            reason: event.reason,
            recordedOffline: event.recordedOffline,
          })),
        skipDuplicates: true,
      });
      await prisma.focusSession.update({
        where: { id },
        data: { status: result.session.status },
      });
    }

    const progress = sessionProgress(result.session, serverNow);
    if (progress.status === 'completed') {
      await audit(services, {
        familyId: session.familyId,
        actorUserId: session.actor.userId,
        action: 'focus.session.completed',
        metadata: { minutes: progress.focusedMinutes, pauses: progress.pauseCount },
      });
    }

    return {
      session: result.session,
      progress,
      applied: result.appliedEventIds,
      duplicates: result.duplicateEventIds,
      rejected: result.rejectedEventIds,
      clampedToServerTime: result.clampedToServerTime,
      counted: countsAsCompleted(result.session, serverNow),
    };
  });
}

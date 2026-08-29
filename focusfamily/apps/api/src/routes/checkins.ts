import {
  DomainError,
  assertCan,
  assertNonDiagnostic,
  checkInSchema,
  conflictLevels,
  describeSource,
  localDateKey,
  summariseCheckIns,
  type CheckIn,
} from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { newId, requireFamily, type Services } from '../context.js';

const checkInInputSchema = z.object({
  dayKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sleepHours: z.number().min(0).max(16).nullable().default(null),
  bedtime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).nullable().default(null),
  mood: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  conflict: z.enum(conflictLevels),
  note: z.string().max(500).nullable().default(null),
  sharedWithFamily: z.boolean().default(false),
});

function toDomainCheckIn(row: {
  id: string;
  familyId: string;
  userId: string;
  dayKey: string;
  sleepHours: number | null;
  bedtime: string | null;
  mood: number;
  conflict: string;
  note: string | null;
  sharedWithFamily: boolean;
  createdAt: Date;
}): CheckIn {
  return checkInSchema.parse({ ...row, source: 'self_reported' });
}

export async function registerCheckInRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const { prisma } = services;

  /**
   * A check-in is always about yourself. There is no endpoint that lets one
   * person fill one in for another, and no endpoint that returns another
   * member's private note.
   */
  app.post('/checkins', async (request, reply) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'checkin.create_self', {
      familyId: session.familyId,
      subjectUserId: session.actor.userId,
    });
    const body = checkInInputSchema.parse(request.body);
    if (body.note) assertNonDiagnostic(body.note);
    const dayKey = body.dayKey ?? localDateKey(new Date());

    const saved = await prisma.checkIn.upsert({
      where: { userId_dayKey: { userId: session.actor.userId, dayKey } },
      create: {
        id: newId('ci'),
        familyId: session.familyId,
        userId: session.actor.userId,
        dayKey,
        sleepHours: body.sleepHours,
        bedtime: body.bedtime,
        mood: body.mood,
        conflict: body.conflict,
        note: body.note,
        sharedWithFamily: body.sharedWithFamily,
      },
      update: {
        sleepHours: body.sleepHours,
        bedtime: body.bedtime,
        mood: body.mood,
        conflict: body.conflict,
        note: body.note,
        sharedWithFamily: body.sharedWithFamily,
      },
    });
    return reply.code(201).send({ checkIn: toDomainCheckIn(saved) });
  });

  app.get('/checkins/me', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'checkin.read_self', {
      familyId: session.familyId,
      subjectUserId: session.actor.userId,
    });
    const rows = await prisma.checkIn.findMany({
      where: { familyId: session.familyId, userId: session.actor.userId },
      orderBy: { dayKey: 'desc' },
      take: 60,
    });
    const checkIns = rows.map(toDomainCheckIn);
    return {
      checkIns,
      trend: summariseCheckIns(checkIns.slice(0, 7), 7),
      source: describeSource('self_reported'),
    };
  });

  /**
   * The family view is deliberately thin: counts and averages, plus only the
   * notes someone actively chose to share. A guardian cannot read a private
   * note, and the API has no parameter that would let them try.
   */
  app.get('/checkins/family', async (request) => {
    const session = requireFamily(request);
    assertCan(session.actor, 'checkin.read_family_aggregate', {
      familyId: session.familyId,
    });
    const since = new Date(Date.now() - 14 * 86_400_000);
    const rows = await prisma.checkIn.findMany({
      where: { familyId: session.familyId, createdAt: { gte: since } },
      orderBy: { dayKey: 'desc' },
    });
    const checkIns = rows.map(toDomainCheckIn);

    return {
      trend: summariseCheckIns(checkIns, 14),
      respondents: [...new Set(checkIns.map((entry) => entry.userId))].length,
      shared: checkIns
        .filter((entry) => entry.sharedWithFamily)
        .map((entry) => ({
          userId: entry.userId,
          dayKey: entry.dayKey,
          mood: entry.mood,
          conflict: entry.conflict,
          note: entry.note,
        })),
      source: describeSource('self_reported'),
    };
  });

  /** Trying to read someone else's check-ins is refused, not silently empty. */
  app.get('/checkins/:userId', async (request) => {
    const session = requireFamily(request);
    const { userId } = z.object({ userId: z.string().min(1) }).parse(request.params);
    if (userId !== session.actor.userId) {
      throw DomainError.forbidden('checkin.private_to_the_author', { userId });
    }
    assertCan(session.actor, 'checkin.read_self', {
      familyId: session.familyId,
      subjectUserId: userId,
    });
    const rows = await prisma.checkIn.findMany({
      where: { familyId: session.familyId, userId },
      orderBy: { dayKey: 'desc' },
      take: 60,
    });
    return { checkIns: rows.map(toDomainCheckIn) };
  });
}

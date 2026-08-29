import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { audit } from '@/lib/audit';
import { reference } from '@/lib/crypto';
import {
  AuthorizationError,
  ConflictError,
  InsufficientCreditsError,
  NotFoundError,
  SessionFullError,
  ValidationError,
} from '@/lib/errors';
import { requireChildInFamily, requireProviderAccess } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { creditBalance, postLedgerEntry } from '@/modules/billing/credits';
import { notify } from '@/modules/notifications/service';
import { isAgeAppropriate } from '@/lib/i18n/labels';

export const bookingSchema = z.object({
  sessionId: z.string().cuid(),
  childProfileId: z.string().cuid(),
});

export interface BookingResult {
  bookingId: string;
  reference: string;
  creditsCharged: number;
  balanceAfter: number;
}

/**
 * Reserves exactly one seat with a single conditional UPDATE. Two concurrent
 * transactions cannot both succeed: whichever commits second sees
 * `seatsTaken = totalSeats` and its WHERE clause matches zero rows. The DB
 * CHECK constraint backs this up if the query is ever changed carelessly.
 */
async function reserveSeat(tx: Prisma.TransactionClient, sessionId: string): Promise<boolean> {
  const updated = await tx.$executeRaw`
    UPDATE "Capacity"
       SET "seatsTaken" = "seatsTaken" + 1,
           "updatedAt"  = NOW()
     WHERE "sessionId" = ${sessionId}
       AND "seatsTaken" < "totalSeats"
  `;
  return updated === 1;
}

async function releaseSeat(tx: Prisma.TransactionClient, sessionId: string): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Capacity"
       SET "seatsTaken" = "seatsTaken" - 1,
           "updatedAt"  = NOW()
     WHERE "sessionId" = ${sessionId}
       AND "seatsTaken" > 0
  `;
}

export async function bookSession(
  user: SessionUser,
  familyId: string,
  input: z.infer<typeof bookingSchema>,
): Promise<BookingResult> {
  const child = await requireChildInFamily(familyId, input.childProfileId);

  const session = await prisma.session.findUnique({
    where: { id: input.sessionId },
    include: { activity: { include: { provider: true, translations: true } }, capacity: true },
  });
  if (!session || !session.capacity) throw new NotFoundError('Session not found');
  if (session.status !== 'SCHEDULED') throw new ValidationError('This session is no longer open for bookings');
  if (session.startsAt.getTime() <= Date.now()) throw new ValidationError('This session has already started');

  const { activity } = session;
  if (activity.status !== 'PUBLISHED' || activity.provider.status !== 'APPROVED') {
    throw new NotFoundError('Session not found');
  }
  if (!isAgeAppropriate(child.ageBand, activity.minAgeBand, activity.maxAgeBand)) {
    throw new ValidationError('This activity is not suitable for this child’s age band');
  }

  const existing = await prisma.booking.findUnique({
    where: { sessionId_childProfileId: { sessionId: session.id, childProfileId: child.id } },
  });
  if (existing && existing.status === 'CONFIRMED') {
    throw new ConflictError('already_booked', 'This child is already booked for this session');
  }

  const bookingReference = reference('BK');

  const result = await prisma.$transaction(async (tx) => {
    const reserved = await reserveSeat(tx, session.id);
    if (!reserved) throw new SessionFullError();

    // Credits are checked and deducted inside the same transaction as the seat,
    // so a failure on either side rolls the other back.
    const balance = await creditBalance(familyId, tx);
    if (balance < activity.creditCost) {
      throw new InsufficientCreditsError(activity.creditCost, balance);
    }

    const booking = existing
      ? await tx.booking.update({
          where: { id: existing.id },
          data: {
            status: 'CONFIRMED',
            reference: bookingReference,
            creditsCharged: activity.creditCost,
            cancelledAt: null,
            cancellationReason: null,
            lateCancellation: false,
            createdById: user.id,
          },
        })
      : await tx.booking.create({
          data: {
            reference: bookingReference,
            familyId,
            childProfileId: child.id,
            sessionId: session.id,
            createdById: user.id,
            status: 'CONFIRMED',
            creditsCharged: activity.creditCost,
            isTrial: activity.trialAvailable,
          },
        });

    const entry = await postLedgerEntry(
      {
        familyId,
        bookingId: booking.id,
        type: 'BOOKING_DEDUCTION',
        delta: -activity.creditCost,
        description: `Booking ${booking.reference}`,
        idempotencyKey: `booking:${booking.id}:charge`,
      },
      tx,
    );

    await tx.attendance.upsert({
      where: { bookingId: booking.id },
      create: { bookingId: booking.id, sessionId: session.id, childProfileId: child.id, status: 'EXPECTED' },
      update: { status: 'EXPECTED' },
    });

    // A waitlist entry for the same child is now satisfied.
    await tx.waitlistEntry.updateMany({
      where: { sessionId: session.id, childProfileId: child.id, status: 'WAITING' },
      data: { status: 'PROMOTED', promotedAt: new Date() },
    });

    await audit(
      {
        actorUserId: user.id,
        actorRole: user.role,
        action: 'booking.created',
        entityType: 'Booking',
        entityId: booking.id,
        metadata: { sessionId: session.id, credits: activity.creditCost },
      },
      tx,
    );

    return { booking, balanceAfter: entry.balanceAfter };
  });

  const title = activity.translations.find((t) => t.locale === 'NL')?.title ?? activity.slug;
  const titleEn = activity.translations.find((t) => t.locale === 'EN')?.title ?? title;
  await notify({
    userId: user.id,
    category: 'BOOKING_CONFIRMED',
    titleNl: 'Boeking bevestigd',
    titleEn: 'Booking confirmed',
    bodyNl: `${child.nickname} is ingeschreven voor ${title} op ${session.startsAt.toLocaleString('nl-NL')}. Referentie ${result.booking.reference}.`,
    bodyEn: `${child.nickname} is booked for ${titleEn} on ${session.startsAt.toLocaleString('en-GB')}. Reference ${result.booking.reference}.`,
    link: `/nl/bookings`,
  });

  return {
    bookingId: result.booking.id,
    reference: result.booking.reference,
    creditsCharged: activity.creditCost,
    balanceAfter: result.balanceAfter,
  };
}

export async function joinWaitlist(user: SessionUser, familyId: string, sessionId: string, childProfileId: string) {
  const child = await requireChildInFamily(familyId, childProfileId);
  const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { capacity: true } });
  if (!session?.capacity) throw new NotFoundError('Session not found');
  if (session.status !== 'SCHEDULED') throw new ValidationError('This session is no longer open');

  const waiting = await prisma.waitlistEntry.count({ where: { sessionId, status: 'WAITING' } });
  if (waiting >= session.capacity.waitlistLimit) {
    throw new ConflictError('waitlist_full', 'The waitlist for this session is full');
  }

  const entry = await prisma.waitlistEntry.upsert({
    where: { sessionId_childProfileId: { sessionId, childProfileId: child.id } },
    create: { sessionId, familyId, childProfileId: child.id, position: waiting + 1, status: 'WAITING' },
    update: { status: 'WAITING', position: waiting + 1, promotedAt: null },
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'booking.waitlist_joined',
    entityType: 'WaitlistEntry',
    entityId: entry.id,
    metadata: { sessionId },
  });
  return entry;
}

/**
 * Cancels a booking, refunds credits when the guardian is inside the free
 * window, frees the seat and offers it to the first person on the waitlist.
 */
export async function cancelBooking(
  user: SessionUser,
  familyId: string,
  bookingId: string,
  options: { reason?: string; byProvider?: boolean } = {},
) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, ...(options.byProvider ? {} : { familyId }) },
    include: {
      session: { include: { activity: { include: { translations: true } }, capacity: true } },
      childProfile: true,
    },
  });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.status !== 'CONFIRMED') throw new ValidationError('This booking is not active');

  const hoursUntilStart = (booking.session.startsAt.getTime() - Date.now()) / 3_600_000;
  const windowHours = booking.session.activity.cancellationHours;
  // A provider-side cancellation always refunds in full.
  const late = !options.byProvider && hoursUntilStart < windowHours;

  const outcome = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: options.byProvider ? 'CANCELLED_BY_PROVIDER' : 'CANCELLED_BY_GUARDIAN',
        cancelledAt: new Date(),
        cancellationReason: options.reason ?? null,
        lateCancellation: late,
      },
    });

    await releaseSeat(tx, booking.sessionId);

    let refunded = 0;
    if (!late) {
      const entry = await postLedgerEntry(
        {
          familyId: booking.familyId,
          bookingId: booking.id,
          type: 'CANCELLATION_REFUND',
          delta: booking.creditsCharged,
          description: `Cancellation refund ${booking.reference}`,
          idempotencyKey: `booking:${booking.id}:refund`,
        },
        tx,
      );
      refunded = entry.delta;
    }

    await tx.attendance.updateMany({ where: { bookingId: booking.id }, data: { status: 'EXCUSED' } });

    await audit(
      {
        actorUserId: user.id,
        actorRole: user.role,
        action: options.byProvider ? 'booking.cancelled_by_provider' : 'booking.cancelled_by_guardian',
        entityType: 'Booking',
        entityId: booking.id,
        metadata: { late, refundedCredits: refunded, hoursUntilStart: Math.round(hoursUntilStart) },
      },
      tx,
    );

    return { updated, refunded, late };
  });

  const title = booking.session.activity.translations.find((t) => t.locale === 'NL')?.title ?? '';
  const titleEn = booking.session.activity.translations.find((t) => t.locale === 'EN')?.title ?? title;
  await notify({
    userId: booking.createdById,
    category: 'BOOKING_CANCELLED',
    titleNl: 'Boeking geannuleerd',
    titleEn: 'Booking cancelled',
    bodyNl: outcome.late
      ? `Je boeking voor ${title} is geannuleerd. Omdat dit binnen ${windowHours} uur voor aanvang gebeurde, zijn de credits niet teruggestort.`
      : `Je boeking voor ${title} is geannuleerd en ${booking.creditsCharged} credits zijn teruggestort.`,
    bodyEn: outcome.late
      ? `Your booking for ${titleEn} was cancelled. Because this happened within ${windowHours} hours of the start, credits were not refunded.`
      : `Your booking for ${titleEn} was cancelled and ${booking.creditsCharged} credits were returned.`,
    link: '/nl/bookings',
  });

  await promoteFromWaitlist(booking.sessionId);
  return outcome;
}

/**
 * Offers a freed seat to the longest-waiting child. The seat is held by
 * creating a confirmed booking only when the family still has enough credits;
 * otherwise the entry is skipped and the next one is tried.
 */
export async function promoteFromWaitlist(sessionId: string): Promise<{ promotedBookingId: string | null }> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { capacity: true, activity: { include: { translations: true } } },
  });
  if (!session?.capacity || session.status !== 'SCHEDULED') return { promotedBookingId: null };
  if (session.capacity.seatsTaken >= session.capacity.totalSeats) return { promotedBookingId: null };

  const candidates = await prisma.waitlistEntry.findMany({
    where: { sessionId, status: 'WAITING' },
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    include: { childProfile: true, family: { include: { memberships: { orderBy: { createdAt: 'asc' }, take: 1 } } } },
  });

  for (const candidate of candidates) {
    const owner = candidate.family.memberships[0];
    if (!owner) continue;

    try {
      const promoted = await prisma.$transaction(async (tx) => {
        const reserved = await reserveSeat(tx, sessionId);
        if (!reserved) return null;

        const balance = await creditBalance(candidate.familyId, tx);
        if (balance < session.activity.creditCost) {
          await releaseSeat(tx, sessionId);
          return null;
        }

        const booking = await tx.booking.upsert({
          where: { sessionId_childProfileId: { sessionId, childProfileId: candidate.childProfileId } },
          create: {
            reference: reference('BK'),
            familyId: candidate.familyId,
            childProfileId: candidate.childProfileId,
            sessionId,
            createdById: owner.userId,
            status: 'CONFIRMED',
            creditsCharged: session.activity.creditCost,
          },
          update: { status: 'CONFIRMED', creditsCharged: session.activity.creditCost, cancelledAt: null },
        });

        await postLedgerEntry(
          {
            familyId: candidate.familyId,
            bookingId: booking.id,
            type: 'BOOKING_DEDUCTION',
            delta: -session.activity.creditCost,
            description: `Waitlist promotion ${booking.reference}`,
            idempotencyKey: `booking:${booking.id}:charge`,
          },
          tx,
        );

        await tx.attendance.upsert({
          where: { bookingId: booking.id },
          create: {
            bookingId: booking.id,
            sessionId,
            childProfileId: candidate.childProfileId,
            status: 'EXPECTED',
          },
          update: { status: 'EXPECTED' },
        });

        await tx.waitlistEntry.update({
          where: { id: candidate.id },
          data: { status: 'PROMOTED', promotedAt: new Date() },
        });

        await audit(
          {
            actorUserId: null,
            action: 'booking.waitlist_promoted',
            entityType: 'Booking',
            entityId: booking.id,
            metadata: { sessionId, waitlistEntryId: candidate.id },
          },
          tx,
        );

        return booking;
      });

      if (promoted) {
        const title = session.activity.translations.find((t) => t.locale === 'NL')?.title ?? '';
        const titleEn = session.activity.translations.find((t) => t.locale === 'EN')?.title ?? title;
        await notify({
          userId: owner.userId,
          category: 'WAITLIST_PROMOTED',
          titleNl: 'Er is een plek vrijgekomen',
          titleEn: 'A place has opened up',
          bodyNl: `${candidate.childProfile.nickname} heeft een plek gekregen bij ${title}. Referentie ${promoted.reference}.`,
          bodyEn: `${candidate.childProfile.nickname} got a place at ${titleEn}. Reference ${promoted.reference}.`,
          link: '/nl/bookings',
        });
        return { promotedBookingId: promoted.id };
      }
    } catch (error) {
      if (error instanceof InsufficientCreditsError) continue;
      throw error;
    }
  }

  return { promotedBookingId: null };
}

export const attendanceSchema = z.object({
  bookingId: z.string().cuid(),
  status: z.enum(['ATTENDED', 'ABSENT', 'EXCUSED']),
  note: z.string().trim().max(500).optional(),
});

/** Check-in by provider staff. Tenant-scoped: staff can only mark their own. */
export async function recordAttendance(user: SessionUser, providerId: string, input: z.infer<typeof attendanceSchema>) {
  const context = await requireProviderAccess(user, providerId, 'bookings:checkin');

  const booking = await prisma.booking.findFirst({
    where: { id: input.bookingId, session: { activity: { providerId } } },
    include: { session: true },
  });
  if (!booking) throw new AuthorizationError('That booking does not belong to your organisation');

  const attendance = await prisma.attendance.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      sessionId: booking.sessionId,
      childProfileId: booking.childProfileId,
      status: input.status,
      checkedInAt: input.status === 'ATTENDED' ? new Date() : null,
      recordedById: context.staffId,
      note: input.note ?? null,
    },
    update: {
      status: input.status,
      checkedInAt: input.status === 'ATTENDED' ? new Date() : null,
      recordedById: context.staffId,
      note: input.note ?? null,
    },
  });

  if (input.status === 'ATTENDED') {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'COMPLETED' } });
  } else if (input.status === 'ABSENT') {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: 'NO_SHOW' } });
  }

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'provider.attendance_recorded',
    entityType: 'Attendance',
    entityId: attendance.id,
    metadata: { providerId, bookingId: booking.id, status: input.status },
  });

  return attendance;
}

export async function listFamilyBookings(familyId: string) {
  return prisma.booking.findMany({
    where: { familyId },
    orderBy: { createdAt: 'desc' },
    include: {
      childProfile: { select: { id: true, nickname: true, ageBand: true } },
      attendance: true,
      review: { select: { id: true } },
      session: {
        include: {
          activity: { include: { translations: true, provider: { select: { displayName: true } } } },
        },
      },
    },
  });
}

export async function listFamilyWaitlist(familyId: string) {
  return prisma.waitlistEntry.findMany({
    where: { familyId, status: 'WAITING' },
    orderBy: { createdAt: 'desc' },
    include: {
      childProfile: { select: { nickname: true } },
      session: { include: { activity: { include: { translations: true } } } },
    },
  });
}

/** Roster for a session, scoped to the provider that owns it. */
export async function sessionRoster(user: SessionUser, providerId: string, sessionId: string) {
  await requireProviderAccess(user, providerId, 'bookings:read');
  const session = await prisma.session.findFirst({
    where: { id: sessionId, activity: { providerId } },
    include: {
      activity: { include: { translations: true } },
      capacity: true,
      bookings: {
        where: { status: { in: ['CONFIRMED', 'COMPLETED', 'NO_SHOW'] } },
        include: {
          // Providers see a nickname, age band and the notes they need to run
          // the session safely — never the child's full identity or address.
          childProfile: { select: { id: true, nickname: true, ageBand: true, accessibilityNeeds: true, medicalNotes: true } },
          attendance: true,
          family: { include: { memberships: { include: { user: { select: { displayName: true, email: true } } } } } },
        },
      },
      waitlist: { where: { status: 'WAITING' }, include: { childProfile: { select: { nickname: true } } } },
    },
  });
  if (!session) throw new AuthorizationError('That session does not belong to your organisation');
  return session;
}

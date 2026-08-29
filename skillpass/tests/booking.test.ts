import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { bookSession, cancelBooking, joinWaitlist, promoteFromWaitlist, recordAttendance } from '@/modules/booking/service';
import { creditBalance, recomputeBalance } from '@/modules/billing/credits';
import {
  createActivity,
  createChild,
  createCity,
  createGuardianWithFamily,
  createProvider,
  createSession,
  grantCredits,
} from './helpers';

describe('booking a session', () => {
  it('charges credits, reserves a seat and creates an expected attendance row', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 3 });
    const session = await createSession({ activityId: activity.id, totalSeats: 5 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id, { ageBand: 'AGE_9_11' });
    await grantCredits(family.id, 10);

    const result = await bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id });

    expect(result.creditsCharged).toBe(3);
    expect(result.balanceAfter).toBe(7);
    expect(await creditBalance(family.id)).toBe(7);
    // The derived balance and the sum of the ledger must never diverge.
    expect(await recomputeBalance(family.id)).toBe(7);

    const capacity = await prisma.capacity.findUniqueOrThrow({ where: { sessionId: session.id } });
    expect(capacity.seatsTaken).toBe(1);

    const attendance = await prisma.attendance.findUniqueOrThrow({ where: { bookingId: result.bookingId } });
    expect(attendance.status).toBe('EXPECTED');
  });

  it('refuses a booking when the family does not have enough credits and leaves no trace', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 5 });
    const session = await createSession({ activityId: activity.id, totalSeats: 5 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id);
    await grantCredits(family.id, 2);

    await expect(bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id })).rejects.toMatchObject({
      code: 'insufficient_credits',
    });

    // The seat reservation is rolled back with the credit check.
    const capacity = await prisma.capacity.findUniqueOrThrow({ where: { sessionId: session.id } });
    expect(capacity.seatsTaken).toBe(0);
    expect(await prisma.booking.count()).toBe(0);
    expect(await creditBalance(family.id)).toBe(2);
  });

  it('refuses a child outside the activity age range', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, minAgeBand: 'AGE_15_17', maxAgeBand: 'AGE_15_17' });
    const session = await createSession({ activityId: activity.id, totalSeats: 5 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id, { ageBand: 'AGE_6_8' });
    await grantCredits(family.id, 10);

    await expect(bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id })).rejects.toThrow(
      /age band/i,
    );
  });

  it('refuses a booking on an unpublished activity even with a valid session id', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, published: false });
    const session = await createSession({ activityId: activity.id, totalSeats: 5 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id);
    await grantCredits(family.id, 10);

    await expect(bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id })).rejects.toMatchObject({
      code: 'not_found',
    });
  });
});

describe('capacity under concurrency', () => {
  it('never oversells the last seat when several families book at once', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 1 });
    const session = await createSession({ activityId: activity.id, totalSeats: 1 });

    const families = await Promise.all(
      [1, 2, 3, 4, 5].map(async (index) => {
        const { family, viewer } = await createGuardianWithFamily(`racer${index}@test.local`);
        const child = await createChild(family.id, { nickname: `Kid${index}` });
        await grantCredits(family.id, 10, `grant-${index}`);
        return { family, viewer, child };
      }),
    );

    const results = await Promise.allSettled(
      families.map((entry) =>
        bookSession(entry.viewer, entry.family.id, { sessionId: session.id, childProfileId: entry.child.id }),
      ),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(4);
    for (const failure of failed) {
      expect((failure as PromiseRejectedResult).reason).toMatchObject({ code: 'session_full' });
    }

    const capacity = await prisma.capacity.findUniqueOrThrow({ where: { sessionId: session.id } });
    expect(capacity.seatsTaken).toBe(1);
    expect(await prisma.booking.count({ where: { status: 'CONFIRMED' } })).toBe(1);
  });

  it('rejects an oversell attempted directly against the database', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider });
    const session = await createSession({ activityId: activity.id, totalSeats: 2 });

    await expect(
      prisma.capacity.update({ where: { sessionId: session.id }, data: { seatsTaken: 3 } }),
    ).rejects.toThrow(/capacity_seats_within_bounds/);
  });
});

describe('cancellation and refunds', () => {
  it('refunds credits and frees the seat when cancelling inside the free window', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 3 });
    const session = await createSession({ activityId: activity.id, totalSeats: 4, startsInHours: 72 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id);
    await grantCredits(family.id, 10);

    const booking = await bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id });
    expect(await creditBalance(family.id)).toBe(7);

    const outcome = await cancelBooking(viewer, family.id, booking.bookingId, { reason: 'plans changed' });

    expect(outcome.late).toBe(false);
    expect(await creditBalance(family.id)).toBe(10);
    const capacity = await prisma.capacity.findUniqueOrThrow({ where: { sessionId: session.id } });
    expect(capacity.seatsTaken).toBe(0);

    // Two ledger rows: the charge and its refund. Nothing was mutated.
    const ledger = await prisma.creditLedgerEntry.findMany({ where: { bookingId: booking.bookingId } });
    expect(ledger.map((entry) => entry.delta).sort((a, b) => a - b)).toEqual([-3, 3]);
  });

  it('keeps the credits for a late cancellation but still frees the seat', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    // Cancellation window is 24 hours; the session starts in 2.
    const activity = await createActivity({ provider, creditCost: 3 });
    const session = await createSession({ activityId: activity.id, totalSeats: 4, startsInHours: 2 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id);
    await grantCredits(family.id, 10);

    const booking = await bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id });
    const outcome = await cancelBooking(viewer, family.id, booking.bookingId);

    expect(outcome.late).toBe(true);
    expect(await creditBalance(family.id)).toBe(7);
    const capacity = await prisma.capacity.findUniqueOrThrow({ where: { sessionId: session.id } });
    expect(capacity.seatsTaken).toBe(0);
  });

  it('cannot double-refund a booking, because the ledger key is idempotent', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 2 });
    const session = await createSession({ activityId: activity.id, totalSeats: 4 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id);
    await grantCredits(family.id, 10);

    const booking = await bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id });
    await cancelBooking(viewer, family.id, booking.bookingId);
    await expect(cancelBooking(viewer, family.id, booking.bookingId)).rejects.toThrow(/not active/);

    expect(await creditBalance(family.id)).toBe(10);
  });
});

describe('waitlist promotion', () => {
  it('promotes the first waiting child when a seat is freed', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 2 });
    const session = await createSession({ activityId: activity.id, totalSeats: 1 });

    const holder = await createGuardianWithFamily('holder@test.local');
    const holderChild = await createChild(holder.family.id, { nickname: 'First' });
    await grantCredits(holder.family.id, 10, 'holder-grant');
    const booking = await bookSession(holder.viewer, holder.family.id, {
      sessionId: session.id,
      childProfileId: holderChild.id,
    });

    const waiter = await createGuardianWithFamily('waiter@test.local');
    const waiterChild = await createChild(waiter.family.id, { nickname: 'Second' });
    await grantCredits(waiter.family.id, 10, 'waiter-grant');
    await joinWaitlist(waiter.viewer, waiter.family.id, session.id, waiterChild.id);

    await cancelBooking(holder.viewer, holder.family.id, booking.bookingId);

    const promoted = await prisma.booking.findFirstOrThrow({
      where: { childProfileId: waiterChild.id, status: 'CONFIRMED' },
    });
    expect(promoted.creditsCharged).toBe(2);
    expect(await creditBalance(waiter.family.id)).toBe(8);

    const entry = await prisma.waitlistEntry.findFirstOrThrow({ where: { childProfileId: waiterChild.id } });
    expect(entry.status).toBe('PROMOTED');

    const capacity = await prisma.capacity.findUniqueOrThrow({ where: { sessionId: session.id } });
    expect(capacity.seatsTaken).toBe(1);

    const notification = await prisma.notification.findFirst({
      where: { userId: waiter.user.id, category: 'WAITLIST_PROMOTED', channel: 'IN_APP' },
    });
    expect(notification).not.toBeNull();
  });

  it('skips a waiting family without enough credits and promotes the next one', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 4 });
    const session = await createSession({ activityId: activity.id, totalSeats: 1 });

    const holder = await createGuardianWithFamily('holder@test.local');
    const holderChild = await createChild(holder.family.id);
    await grantCredits(holder.family.id, 10, 'holder-grant');
    const booking = await bookSession(holder.viewer, holder.family.id, {
      sessionId: session.id,
      childProfileId: holderChild.id,
    });

    const broke = await createGuardianWithFamily('broke@test.local');
    const brokeChild = await createChild(broke.family.id, { nickname: 'Broke' });
    await grantCredits(broke.family.id, 1, 'broke-grant');
    await joinWaitlist(broke.viewer, broke.family.id, session.id, brokeChild.id);

    const rich = await createGuardianWithFamily('rich@test.local');
    const richChild = await createChild(rich.family.id, { nickname: 'Rich' });
    await grantCredits(rich.family.id, 20, 'rich-grant');
    await joinWaitlist(rich.viewer, rich.family.id, session.id, richChild.id);

    await cancelBooking(holder.viewer, holder.family.id, booking.bookingId);

    expect(await prisma.booking.count({ where: { childProfileId: brokeChild.id, status: 'CONFIRMED' } })).toBe(0);
    expect(await prisma.booking.count({ where: { childProfileId: richChild.id, status: 'CONFIRMED' } })).toBe(1);
    // The skipped family keeps its place in the queue.
    const skipped = await prisma.waitlistEntry.findFirstOrThrow({ where: { childProfileId: brokeChild.id } });
    expect(skipped.status).toBe('WAITING');
  });

  it('does nothing when the session is still full', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider });
    const session = await createSession({ activityId: activity.id, totalSeats: 1 });

    const holder = await createGuardianWithFamily('holder@test.local');
    const child = await createChild(holder.family.id);
    await grantCredits(holder.family.id, 10, 'holder-grant');
    await bookSession(holder.viewer, holder.family.id, { sessionId: session.id, childProfileId: child.id });

    const waiter = await createGuardianWithFamily('waiter@test.local');
    const waiterChild = await createChild(waiter.family.id);
    await grantCredits(waiter.family.id, 10, 'waiter-grant');
    await joinWaitlist(waiter.viewer, waiter.family.id, session.id, waiterChild.id);

    expect(await promoteFromWaitlist(session.id)).toEqual({ promotedBookingId: null });
  });
});

describe('attendance check-in', () => {
  it('marks a booking completed and records who checked the child in', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider });
    const session = await createSession({ activityId: activity.id, totalSeats: 4 });

    const { family, viewer } = await createGuardianWithFamily();
    const child = await createChild(family.id);
    await grantCredits(family.id, 10);
    const booking = await bookSession(viewer, family.id, { sessionId: session.id, childProfileId: child.id });

    const attendance = await recordAttendance(provider.owner, provider.providerId, {
      bookingId: booking.bookingId,
      status: 'ATTENDED',
    });

    expect(attendance.status).toBe('ATTENDED');
    expect(attendance.checkedInAt).not.toBeNull();
    expect(attendance.recordedById).toBe(provider.staffId);

    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: booking.bookingId } });
    expect(updated.status).toBe('COMPLETED');
  });
});

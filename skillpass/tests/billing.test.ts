import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { MockPaymentProvider, paymentProvider } from '@/lib/adapters/payments';
import { env } from '@/lib/env';
import {
  adjustCredits,
  handlePaymentWebhook,
  refundPayment,
  startSubscription,
} from '@/modules/billing/subscriptions';
import { creditBalance, grantMonthlyCredits, postLedgerEntry, recomputeBalance } from '@/modules/billing/credits';
import { calculatePayout, createPayout } from '@/modules/billing/payouts';
import { bookSession, recordAttendance } from '@/modules/booking/service';
import {
  createActivity,
  createChild,
  createCity,
  createGuardianWithFamily,
  createPlan,
  createProvider,
  createSession,
  createUser,
  grantCredits,
  sessionUser,
} from './helpers';

function signedWebhook(body: object) {
  const raw = JSON.stringify(body);
  const provider = paymentProvider() as MockPaymentProvider;
  return { raw, signature: provider.signWebhook(raw) };
}

describe('credit ledger', () => {
  it('is append-only at the database level', async () => {
    const { family } = await createGuardianWithFamily();
    const entry = await grantCredits(family.id, 5);

    await expect(
      prisma.creditLedgerEntry.update({ where: { id: entry.id }, data: { delta: 500 } }),
    ).rejects.toThrow(/append-only/);
    await expect(prisma.creditLedgerEntry.delete({ where: { id: entry.id } })).rejects.toThrow(/append-only/);
  });

  it('never lets the balance go negative', async () => {
    const { family } = await createGuardianWithFamily();
    await grantCredits(family.id, 2);

    await expect(
      prisma.$transaction((tx) =>
        postLedgerEntry(
          { familyId: family.id, type: 'BOOKING_DEDUCTION', delta: -5, description: 'too much', idempotencyKey: 'x' },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'insufficient_credits' });
  });

  it('treats a repeated idempotency key as a no-op', async () => {
    const { family } = await createGuardianWithFamily();
    await grantCredits(family.id, 10);

    const first = await prisma.$transaction((tx) =>
      postLedgerEntry(
        { familyId: family.id, type: 'BOOKING_DEDUCTION', delta: -2, description: 'charge', idempotencyKey: 'same-key' },
        tx,
      ),
    );
    const second = await prisma.$transaction((tx) =>
      postLedgerEntry(
        { familyId: family.id, type: 'BOOKING_DEDUCTION', delta: -2, description: 'charge', idempotencyKey: 'same-key' },
        tx,
      ),
    );

    expect(second.id).toBe(first.id);
    expect(await creditBalance(family.id)).toBe(8);
    expect(await recomputeBalance(family.id)).toBe(8);
  });

  it('grants the monthly allowance once per subscription period', async () => {
    const { family } = await createGuardianWithFamily();
    const plan = await createPlan({ slug: 'family-monthly', priceCents: 2995, monthlyCredits: 8 });
    const subscription = await prisma.subscription.create({
      data: {
        planId: plan.id,
        familyId: family.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date('2026-08-01'),
        currentPeriodEnd: new Date('2026-09-01'),
      },
    });

    await grantMonthlyCredits(subscription.id);
    await grantMonthlyCredits(subscription.id);

    expect(await creditBalance(family.id)).toBe(8);
    expect(await prisma.creditLedgerEntry.count({ where: { type: 'MONTHLY_GRANT' } })).toBe(1);
  });
});

describe('subscription checkout', () => {
  it('activates a free plan immediately without a payment', async () => {
    const { family, viewer } = await createGuardianWithFamily();
    await createPlan({ slug: 'free-discovery', priceCents: 0, monthlyCredits: 0 });

    const result = await startSubscription(viewer, family.id, 'free-discovery');

    expect(result.paymentId).toBeNull();
    const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: result.subscriptionId } });
    expect(subscription.status).toBe('ACTIVE');
    expect(await prisma.payment.count()).toBe(0);
  });

  it('creates a pending payment for a paid plan and grants no credits before the webhook', async () => {
    const { family, viewer } = await createGuardianWithFamily();
    await createPlan({ slug: 'family-monthly', priceCents: 2995, monthlyCredits: 8 });

    const result = await startSubscription(viewer, family.id, 'family-monthly');

    const payment = await prisma.payment.findUniqueOrThrow({ where: { id: result.paymentId! } });
    expect(payment.status).toBe('PENDING');
    expect(payment.amountCents).toBe(2995);

    const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: result.subscriptionId } });
    expect(subscription.status).toBe('TRIALING');
    expect(await creditBalance(family.id)).toBe(0);
  });
});

describe('payment webhooks', () => {
  it('rejects a webhook without a valid signature', async () => {
    const { raw } = signedWebhook({ id: 'evt_1', type: 'checkout.completed', data: { externalRef: 'ref' } });

    await expect(handlePaymentWebhook(raw, null)).rejects.toThrow(/Missing webhook signature/);
    await expect(handlePaymentWebhook(raw, 'sha256=deadbeef')).rejects.toThrow(/Invalid webhook signature/);
    // A tampered body invalidates a previously valid signature.
    const { signature } = signedWebhook({ id: 'evt_1', type: 'checkout.completed', data: { externalRef: 'ref' } });
    await expect(handlePaymentWebhook(`${raw} `, signature)).rejects.toThrow(/Invalid webhook signature/);
    expect(await prisma.webhookEvent.count()).toBe(0);
  });

  it('activates the subscription and grants credits exactly once, however often it is delivered', async () => {
    const { family, viewer } = await createGuardianWithFamily();
    await createPlan({ slug: 'family-monthly', priceCents: 2995, monthlyCredits: 8 });
    const started = await startSubscription(viewer, family.id, 'family-monthly');

    const { raw, signature } = signedWebhook({
      id: 'evt_checkout_1',
      type: 'checkout.completed',
      data: { externalRef: started.externalRef, amountCents: 2995, currency: 'EUR' },
    });

    const first = await handlePaymentWebhook(raw, signature);
    const second = await handlePaymentWebhook(raw, signature);
    const third = await handlePaymentWebhook(raw, signature);

    expect(first.status).toBe('processed');
    expect(second.status).toBe('duplicate');
    expect(third.status).toBe('duplicate');

    const payment = await prisma.payment.findUniqueOrThrow({ where: { externalRef: started.externalRef! } });
    expect(payment.status).toBe('SUCCEEDED');
    expect(payment.paidAt).not.toBeNull();

    const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: started.subscriptionId } });
    expect(subscription.status).toBe('ACTIVE');

    // Credits granted once, not three times.
    expect(await creditBalance(family.id)).toBe(8);
    expect(await prisma.creditLedgerEntry.count({ where: { type: 'MONTHLY_GRANT' } })).toBe(1);
    expect(await prisma.webhookEvent.count()).toBe(1);
  });

  it('marks the subscription past due on a failed checkout', async () => {
    const { family, viewer } = await createGuardianWithFamily();
    await createPlan({ slug: 'family-monthly', priceCents: 2995, monthlyCredits: 8 });
    const started = await startSubscription(viewer, family.id, 'family-monthly');

    const { raw, signature } = signedWebhook({
      id: 'evt_failed_1',
      type: 'checkout.failed',
      data: { externalRef: started.externalRef },
    });
    expect((await handlePaymentWebhook(raw, signature)).status).toBe('processed');

    const subscription = await prisma.subscription.findUniqueOrThrow({ where: { id: started.subscriptionId } });
    expect(subscription.status).toBe('PAST_DUE');
    expect(await creditBalance(family.id)).toBe(0);
  });

  it('records an unrecognised event type without acting on it', async () => {
    const { raw, signature } = signedWebhook({
      id: 'evt_unknown_1',
      type: 'invoice.weird',
      data: { externalRef: 'whatever' },
    });
    expect(await handlePaymentWebhook(raw, signature)).toMatchObject({ status: 'ignored' });
    expect(await prisma.webhookEvent.count()).toBe(1);
  });

  it('uses the mock provider by default so no credentials are needed', () => {
    expect(env().PAYMENT_PROVIDER).toBe('mock');
    expect(paymentProvider().name).toBe('mock');
  });
});

describe('refunds and adjustments', () => {
  it('refunds money against a successful payment and updates its status', async () => {
    const { family, viewer } = await createGuardianWithFamily();
    await createPlan({ slug: 'family-monthly', priceCents: 2995, monthlyCredits: 8 });
    const started = await startSubscription(viewer, family.id, 'family-monthly');
    const { raw, signature } = signedWebhook({
      id: 'evt_ok',
      type: 'checkout.completed',
      data: { externalRef: started.externalRef, amountCents: 2995, currency: 'EUR' },
    });
    await handlePaymentWebhook(raw, signature);

    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));
    const partial = await refundPayment(admin, started.paymentId!, 1000, 'session cancelled');
    expect(partial.status).toBe('SUCCEEDED');
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId! } })).status).toBe(
      'PARTIALLY_REFUNDED',
    );

    // A second refund may not take the total beyond what was actually paid.
    await expect(refundPayment(admin, started.paymentId!, 2500, 'too much')).rejects.toThrow(/exceeds/);

    await refundPayment(admin, started.paymentId!, 1995, 'remainder');
    expect((await prisma.payment.findUniqueOrThrow({ where: { id: started.paymentId! } })).status).toBe('REFUNDED');

    // Once fully refunded there is nothing left to refund.
    await expect(refundPayment(admin, started.paymentId!, 100, 'again')).rejects.toThrow(
      /Only a successful payment can be refunded/,
    );
  });

  it('records an administrator credit adjustment in the audit log', async () => {
    const { family } = await createGuardianWithFamily();
    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));

    await adjustCredits(admin, family.id, 3, 'goodwill after a cancelled session');

    expect(await creditBalance(family.id)).toBe(3);
    const entry = await prisma.auditLog.findFirstOrThrow({ where: { action: 'admin.credits_adjusted' } });
    expect(entry.actorUserId).toBe(admin.id);
  });
});

describe('provider payouts', () => {
  it('settles attended bookings only and subtracts the platform commission', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await createActivity({ provider, creditCost: 2 });
    const session = await createSession({ activityId: activity.id, totalSeats: 5, startsInHours: 24 });

    const attendee = await createGuardianWithFamily('attendee@test.local');
    const attendeeChild = await createChild(attendee.family.id);
    await grantCredits(attendee.family.id, 10, 'attendee');
    const attendedBooking = await bookSession(attendee.viewer, attendee.family.id, {
      sessionId: session.id,
      childProfileId: attendeeChild.id,
    });

    const absentee = await createGuardianWithFamily('absentee@test.local');
    const absenteeChild = await createChild(absentee.family.id);
    await grantCredits(absentee.family.id, 10, 'absentee');
    const absentBooking = await bookSession(absentee.viewer, absentee.family.id, {
      sessionId: session.id,
      childProfileId: absenteeChild.id,
    });

    await recordAttendance(provider.owner, provider.providerId, { bookingId: attendedBooking.bookingId, status: 'ATTENDED' });
    await recordAttendance(provider.owner, provider.providerId, { bookingId: absentBooking.bookingId, status: 'ABSENT' });

    const periodStart = new Date(Date.now() - 86_400_000);
    const periodEnd = new Date(Date.now() + 7 * 86_400_000);
    const preview = await calculatePayout(provider.providerId, periodStart, periodEnd);

    // Only the attended booking counts: 1500 cents gross, 15% commission.
    expect(preview.attendedBookings).toBe(1);
    expect(preview.grossCents).toBe(1500);
    expect(preview.commissionCents).toBe(225);
    expect(preview.netCents).toBe(1275);

    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));
    const payout = await createPayout(admin, provider.providerId, periodStart, periodEnd);
    expect(payout.netCents).toBe(1275);
    expect(payout.status).toBe('PAID');

    // Re-running the payout for the same period does not double-pay.
    const again = await createPayout(admin, provider.providerId, periodStart, periodEnd);
    expect(again.id).toBe(payout.id);
    expect(await prisma.payout.count()).toBe(1);
  });
});

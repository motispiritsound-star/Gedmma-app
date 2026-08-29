import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { ConflictError } from '../src/lib/errors.ts';
import { MockPaymentProvider, paymentProvider } from '../src/lib/providers/payments/index.ts';
import {
  addMonths,
  cancelSubscription,
  createSubscription,
  dueSubscriptions,
  pauseSubscription,
  previewRenewal,
  resumeSubscription,
  runRenewal,
  skipNextRenewal,
} from '../src/server/subscriptions.ts';
import { markOrderPaid, placeOrder } from '../src/server/orders.ts';
import { makeBox, makeDueSubscription, makeFamily, makePlan, resetDatabase } from './helpers/fixtures.ts';

describe('subscription engine', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('creates a subscription and pays the first order with the mock provider', async () => {
    const box = await makeBox({ stock: 20, priceCents: 3495 });
    const plan = await makePlan();
    const { family, address } = await makeFamily();

    const subscription = await createSubscription({ familyId: family.id, planCode: plan.code });
    expect(subscription.status).toBe('ACTIVE');
    expect(subscription.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());

    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      subscriptionId: subscription.id,
      idempotencyKey: `sub-first-${subscription.id}`,
    });
    expect(placed.order.status).toBe('PENDING_PAYMENT');
    expect(placed.order.totalCents).toBe(3495 + 495);

    const provider = paymentProvider() as MockPaymentProvider;
    await provider.confirmIntent(placed.order.paymentIntentRef!, 'succeed');
    const paid = await markOrderPaid(placed.order.id);

    expect(paid.status).toBe('PAID');
    expect(paid.paidAt).not.toBeNull();
    // Paying produces exactly one invoice, whatever happens afterwards.
    expect(await prisma.invoice.count({ where: { orderId: paid.id } })).toBe(1);
    await markOrderPaid(placed.order.id);
    expect(await prisma.invoice.count({ where: { orderId: paid.id } })).toBe(1);
  });

  it('refuses a second subscription for the same family', async () => {
    const plan = await makePlan();
    const { family } = await makeFamily();
    await createSubscription({ familyId: family.id, planCode: plan.code });
    await expect(
      createSubscription({ familyId: family.id, planCode: plan.code }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns the same order when checkout is submitted twice', async () => {
    const box = await makeBox({ stock: 10 });
    const { family, address } = await makeFamily();
    const key = `double-click-${family.id}`;

    const first = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: key,
    });
    const second = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: key,
    });

    expect(second.reused).toBe(true);
    expect(second.order.id).toBe(first.order.id);
    // And critically: stock was reserved once, not twice.
    expect(await prisma.stockReservation.count({ where: { orderId: first.order.id } })).toBe(1);
  });

  it('previews a renewal without changing anything', async () => {
    await makeBox({ stock: 10 });
    const plan = await makePlan(undefined, 3295);
    const { family } = await makeFamily();
    const subscription = await createSubscription({ familyId: family.id, planCode: plan.code });

    const preview = await previewRenewal(subscription.id);
    expect(preview.willRenew).toBe(true);
    expect(preview.reason).toBe('ok');
    expect(preview.amount.cents).toBe(3295);
    expect(preview.periodAfterRenewal.end.getTime()).toBeGreaterThan(preview.renewsOn.getTime());

    const unchanged = await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(unchanged.currentPeriodEnd.toISOString()).toBe(
      subscription.currentPeriodEnd.toISOString(),
    );
  });

  it('renews a due subscription into a real order', async () => {
    const box = await makeBox({ stock: 10 });
    const plan = await makePlan();
    const { family } = await makeFamily();
    const subscription = await makeDueSubscription(family.id, plan.id);
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { nextBoxProductId: box.product.id },
    });

    expect(await dueSubscriptions()).toContain(subscription.id);

    const result = await runRenewal(subscription.id);
    expect(result.outcome).toBe('renewed');
    expect(result.orderId).toBeDefined();

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId! } });
    expect(order.subscriptionId).toBe(subscription.id);

    // The period moved on, so a second run finds nothing to do.
    const again = await runRenewal(subscription.id);
    expect(again.outcome).toBe('notDue');
    expect(await prisma.order.count({ where: { subscriptionId: subscription.id } })).toBe(1);
  });

  it('does not bill a period twice when the renewal job is retried', async () => {
    const box = await makeBox({ stock: 10 });
    const plan = await makePlan();
    const { family } = await makeFamily();
    const subscription = await makeDueSubscription(family.id, plan.id);
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { nextBoxProductId: box.product.id },
    });

    const first = await runRenewal(subscription.id);
    expect(first.outcome).toBe('renewed');

    // Simulate a job that crashed after placing the order but before the
    // period was advanced, and is then retried against the same period.
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { currentPeriodEnd: subscription.currentPeriodEnd },
    });
    const retry = await runRenewal(subscription.id);

    expect(retry.outcome).toBe('renewed');
    expect(retry.orderId).toBe(first.orderId);
    expect(await prisma.order.count({ where: { subscriptionId: subscription.id } })).toBe(1);
  });

  it('skips exactly one renewal and then resumes normally', async () => {
    const box = await makeBox({ stock: 10 });
    const plan = await makePlan();
    const { family } = await makeFamily();
    const subscription = await makeDueSubscription(family.id, plan.id);
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { nextBoxProductId: box.product.id },
    });

    await skipNextRenewal(subscription.id, true);
    const preview = await previewRenewal(subscription.id);
    expect(preview.willRenew).toBe(false);
    expect(preview.reason).toBe('skipped');

    const skipped = await runRenewal(subscription.id);
    expect(skipped.outcome).toBe('skipped');
    expect(await prisma.order.count({ where: { subscriptionId: subscription.id } })).toBe(0);

    // The skip flag consumed itself; the period after this one ships again.
    const after = await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } });
    expect(after.skipNextRenewal).toBe(false);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { currentPeriodEnd: addMonths(new Date(), -1) },
    });
    const renewed = await runRenewal(subscription.id);
    expect(renewed.outcome).toBe('renewed');
  });

  it('pauses without billing and resumes into a fresh period', async () => {
    await makeBox({ stock: 10 });
    const plan = await makePlan();
    const { family } = await makeFamily();
    const subscription = await makeDueSubscription(family.id, plan.id);

    const until = addMonths(new Date(), 2);
    await pauseSubscription(subscription.id, until);

    const preview = await previewRenewal(subscription.id);
    expect(preview.reason).toBe('paused');
    expect(preview.amount.cents).toBe(0);

    const paused = await runRenewal(subscription.id);
    expect(paused.outcome).toBe('paused');
    expect(await prisma.order.count({ where: { subscriptionId: subscription.id } })).toBe(0);

    const resumed = await resumeSubscription(subscription.id);
    expect(resumed.status).toBe('ACTIVE');
    expect(resumed.pausedUntil).toBeNull();
    // Resuming starts today rather than back-billing the paused months.
    expect(resumed.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
  });

  it('cancels at the end of the paid period, not immediately', async () => {
    await makeBox({ stock: 10 });
    const plan = await makePlan();
    const { family } = await makeFamily();
    const subscription = await createSubscription({ familyId: family.id, planCode: plan.code });

    const cancelled = await cancelSubscription(subscription.id);
    expect(cancelled.status).toBe('ACTIVE');
    expect(cancelled.cancelAt?.toISOString()).toBe(subscription.currentPeriodEnd.toISOString());

    const preview = await previewRenewal(subscription.id);
    expect(preview.reason).toBe('cancelled');
    expect(preview.willRenew).toBe(false);
  });

  it('clamps a renewal date that has no matching day in the target month', () => {
    // A subscription started on 31 January renews on 28/29 February.
    const january31 = new Date(Date.UTC(2026, 0, 31));
    expect(addMonths(january31, 1).toISOString().slice(0, 10)).toBe('2026-02-28');
    expect(addMonths(january31, 3).toISOString().slice(0, 10)).toBe('2026-04-30');
  });
});

import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { MockPaymentProvider, paymentProvider } from '../src/lib/providers/payments/index.ts';
import { MockShippingProvider, shippingProvider } from '../src/lib/providers/shipping/index.ts';
import { handleFulfilmentWebhook, handlePaymentWebhook } from '../src/server/webhooks.ts';
import { createShipmentForOrder, placeOrder, refundOrder } from '../src/server/orders.ts';
import { money } from '../src/lib/money.ts';
import { stockLevels } from '../src/server/inventory.ts';
import { makeBox, makeFamily, resetDatabase } from './helpers/fixtures.ts';

/**
 * Webhook idempotency.
 *
 * Payment and shipping providers retry. The unique index on
 * (provider, externalId) is what makes a redelivery a no-op, so these tests
 * fire the exact same signed body several times and assert nothing moved.
 */
describe('webhook processing', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  async function pendingOrder(name: string) {
    const box = await makeBox({ stock: 5 });
    const { family, address } = await makeFamily(name);
    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: `wh-${family.id}`,
    });
    return { box, family, order: placed.order };
  }

  it('rejects an unsigned or badly signed body without touching anything', async () => {
    const { order } = await pendingOrder('Webhook A');
    const provider = paymentProvider() as MockPaymentProvider;
    const { body } = provider.signWebhook({
      id: 'evt-unsigned',
      type: 'payment.succeeded',
      data: { paymentIntentRef: order.paymentIntentRef },
    });

    expect(await handlePaymentWebhook(body, null)).toEqual({ outcome: 'invalidSignature' });
    expect(await handlePaymentWebhook(body, 't=1,v1=deadbeef')).toEqual({
      outcome: 'invalidSignature',
    });

    const unchanged = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(unchanged.status).toBe('PENDING_PAYMENT');
    expect(await prisma.webhookEvent.count()).toBe(0);
  });

  it('marks an order paid once, however many times the event is delivered', async () => {
    const { order } = await pendingOrder('Webhook B');
    const provider = paymentProvider() as MockPaymentProvider;
    const signed = provider.signWebhook({
      id: 'evt-paid-1',
      type: 'payment.succeeded',
      data: { paymentIntentRef: order.paymentIntentRef },
    });

    const first = await handlePaymentWebhook(signed.body, signed.signature);
    expect(first.outcome).toBe('processed');

    // The provider did not see our 200 and retries. Twice.
    const second = await handlePaymentWebhook(signed.body, signed.signature);
    const third = await handlePaymentWebhook(signed.body, signed.signature);
    expect(second.outcome).toBe('duplicate');
    expect(third.outcome).toBe('duplicate');

    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe('PAID');
    // One invoice, one payment, one row in the ledger — not three.
    expect(await prisma.invoice.count({ where: { orderId: order.id } })).toBe(1);
    expect(await prisma.webhookEvent.count({ where: { externalId: 'evt-paid-1' } })).toBe(1);
  });

  it('records a failed payment as PAST_DUE on the subscription', async () => {
    const box = await makeBox({ stock: 5 });
    const { family, address } = await makeFamily('Webhook C');
    const plan = await prisma.subscriptionPlan.create({
      data: {
        code: `plan-${family.id}`,
        name: { nl: 'Plan', en: 'Plan' },
        description: { nl: '', en: '' },
        priceCents: 3295,
      },
    });
    const subscription = await prisma.subscription.create({
      data: {
        familyId: family.id,
        planId: plan.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
        providerRef: `sub-${family.id}`,
      },
    });
    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      subscriptionId: subscription.id,
      idempotencyKey: `wh-fail-${family.id}`,
    });

    const provider = paymentProvider() as MockPaymentProvider;
    const failed = provider.signWebhook({
      id: 'evt-failed-1',
      type: 'payment.failed',
      data: { paymentIntentRef: placed.order.paymentIntentRef },
    });
    await handlePaymentWebhook(failed.body, failed.signature);

    expect(
      (await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } })).status,
    ).toBe('PAST_DUE');

    // …and a later successful renewal event puts it back.
    const renewed = provider.signWebhook({
      id: 'evt-renewed-1',
      type: 'subscription.renewed',
      data: { subscriptionRef: subscription.providerRef },
    });
    await handlePaymentWebhook(renewed.body, renewed.signature);
    expect(
      (await prisma.subscription.findUniqueOrThrow({ where: { id: subscription.id } })).status,
    ).toBe('ACTIVE');
  });

  it('applies a refund once even if the event arrives repeatedly', async () => {
    const { order } = await pendingOrder('Webhook D');
    const provider = paymentProvider() as MockPaymentProvider;
    const paid = provider.signWebhook({
      id: 'evt-paid-2',
      type: 'payment.succeeded',
      data: { paymentIntentRef: order.paymentIntentRef },
    });
    await handlePaymentWebhook(paid.body, paid.signature);

    const refunded = provider.signWebhook({
      id: 'evt-refund-1',
      type: 'payment.refunded',
      data: { paymentIntentRef: order.paymentIntentRef, amountCents: 500 },
    });
    await handlePaymentWebhook(refunded.body, refunded.signature);
    await handlePaymentWebhook(refunded.body, refunded.signature);

    const after = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(after.refundedCents).toBe(500);
  });

  it('ignores an event type it does not know without failing', async () => {
    const provider = paymentProvider() as MockPaymentProvider;
    const signed = provider.signWebhook({ id: 'evt-weird-1', type: 'account.updated', data: {} });
    expect((await handlePaymentWebhook(signed.body, signed.signature)).outcome).toBe('ignored');
    const stored = await prisma.webhookEvent.findFirstOrThrow({
      where: { externalId: 'evt-weird-1' },
    });
    expect(stored.status).toBe('ignored');
  });

  it('advances a shipment exactly once per carrier event', async () => {
    const { order } = await pendingOrder('Webhook E');
    const payments = paymentProvider() as MockPaymentProvider;
    const paid = payments.signWebhook({
      id: 'evt-paid-3',
      type: 'payment.succeeded',
      data: { paymentIntentRef: order.paymentIntentRef },
    });
    await handlePaymentWebhook(paid.body, paid.signature);
    await createShipmentForOrder(order.id);

    const shipment = await prisma.shipment.findFirstOrThrow({ where: { orderId: order.id } });
    const carrier = shippingProvider() as MockShippingProvider;
    const transit = carrier.signWebhook({
      id: 'ship-evt-1',
      providerRef: shipment.providerRef,
      status: 'in_transit',
      occurredAt: new Date().toISOString(),
    });

    expect((await handleFulfilmentWebhook(transit.body, transit.signature)).outcome).toBe('processed');
    expect((await handleFulfilmentWebhook(transit.body, transit.signature)).outcome).toBe('duplicate');

    const updated = await prisma.shipment.findUniqueOrThrow({ where: { id: shipment.id } });
    expect(updated.status).toBe('IN_TRANSIT');
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status,
    ).toBe('SHIPPED');

    const delivered = carrier.signWebhook({
      id: 'ship-evt-2',
      providerRef: shipment.providerRef,
      status: 'delivered',
      occurredAt: new Date().toISOString(),
    });
    await handleFulfilmentWebhook(delivered.body, delivered.signature);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status,
    ).toBe('DELIVERED');
  });

  it('puts stock back when a parcel is returned', async () => {
    const { box, order } = await pendingOrder('Webhook F');
    const payments = paymentProvider() as MockPaymentProvider;
    const paid = payments.signWebhook({
      id: 'evt-paid-4',
      type: 'payment.succeeded',
      data: { paymentIntentRef: order.paymentIntentRef },
    });
    await handlePaymentWebhook(paid.body, paid.signature);
    await createShipmentForOrder(order.id);

    const before = (await stockLevels()).find(
      (level) => level.inventoryItemId === box.inventoryItem.id,
    );
    expect(before?.onHand).toBe(4);

    const shipment = await prisma.shipment.findFirstOrThrow({ where: { orderId: order.id } });
    const carrier = shippingProvider() as MockShippingProvider;
    const returned = carrier.signWebhook({
      id: 'ship-evt-3',
      providerRef: shipment.providerRef,
      status: 'returned',
      occurredAt: new Date().toISOString(),
    });
    await handleFulfilmentWebhook(returned.body, returned.signature);

    const after = (await stockLevels()).find(
      (level) => level.inventoryItemId === box.inventoryItem.id,
    );
    expect(after?.onHand).toBe(5);
  });

  it('refunds in full, revokes the code and releases the stock', async () => {
    const { box, order, family } = await pendingOrder('Webhook G');
    const payments = paymentProvider() as MockPaymentProvider;
    const paid = payments.signWebhook({
      id: 'evt-paid-5',
      type: 'payment.succeeded',
      data: { paymentIntentRef: order.paymentIntentRef },
    });
    await handlePaymentWebhook(paid.body, paid.signature);

    const fresh = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    await refundOrder(order.id, money(fresh.totalCents), 'Damaged in transit');

    const refunded = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(refunded.status).toBe('REFUNDED');
    expect(refunded.refundedCents).toBe(fresh.totalCents);

    const level = (await stockLevels()).find(
      (entry) => entry.inventoryItemId === box.inventoryItem.id,
    );
    expect(level?.reserved).toBe(0);
    expect(level?.onHand).toBe(5);

    const invoices = await prisma.invoice.findMany({ where: { familyId: family.id } });
    expect(invoices.every((invoice) => invoice.status === 'REFUNDED')).toBe(true);
  });

  it('never refunds more than was captured', async () => {
    const { order } = await pendingOrder('Webhook H');
    const payments = paymentProvider() as MockPaymentProvider;
    const paid = payments.signWebhook({
      id: 'evt-paid-6',
      type: 'payment.succeeded',
      data: { paymentIntentRef: order.paymentIntentRef },
    });
    await handlePaymentWebhook(paid.body, paid.signature);

    await expect(refundOrder(order.id, money(order.totalCents + 1), 'Oops')).rejects.toThrow(
      /Refundable amount/,
    );
    await expect(refundOrder(order.id, money(0), 'Oops')).rejects.toThrow(/Refundable amount/);
  });
});

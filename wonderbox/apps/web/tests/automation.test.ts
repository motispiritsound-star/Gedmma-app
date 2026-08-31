import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/db.ts';
import { ConflictError } from '../src/lib/errors.ts';
import { MockPaymentProvider, paymentProvider } from '../src/lib/providers/payments/index.ts';
import { MockSupplierChannel, supplierChannel } from '../src/lib/providers/suppliers/index.ts';
import {
  approvePurchaseOrder,
  createPurchaseOrder,
  demandForecast,
  receivePurchaseOrder,
  replenishmentProposal,
  sendPurchaseOrder,
} from '../src/server/purchasing.ts';
import { runJob } from '../src/server/jobs.ts';
import { stockLevels } from '../src/server/inventory.ts';
import { markOrderPaid, placeOrder } from '../src/server/orders.ts';
import { addMonths } from '../src/server/subscriptions.ts';
import {
  makeBox,
  makeDueSubscription,
  makeFamily,
  makePlan,
  resetDatabase,
  unique,
} from './helpers/fixtures.ts';

/**
 * The automated supply loop.
 *
 * Forecast from the subscription book, net against stock and open orders,
 * raise a purchase order, receive it, ship. The tests below are written around
 * the two ways an automated purchasing loop ruins a company: ordering the same
 * thing twice, and committing money nobody approved.
 */

async function supplierFor(
  itemId: string,
  options: { moq?: number; leadTimeDays?: number; safetyStock?: number; autoApproveUnderCents?: number; minOrderValueCents?: number } = {},
) {
  const supplier = await prisma.supplier.create({
    data: {
      code: unique('SUP').toUpperCase(),
      name: 'Test supplier',
      email: 'orders@test.invalid',
      leadTimeDays: options.leadTimeDays ?? 14,
      minOrderValueCents: options.minOrderValueCents ?? 0,
      autoApproveUnderCents: options.autoApproveUnderCents ?? 0,
    },
  });
  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      supplierId: supplier.id,
      supplierSku: 'SUP-1',
      costCents: 100,
      moq: options.moq ?? 1,
      leadTimeDays: options.leadTimeDays ?? 14,
      safetyStockUnits: options.safetyStock ?? 0,
    },
  });
  return supplier;
}

describe('demand forecast', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('reads demand off the subscription book rather than guessing', async () => {
    const box = await makeBox({ stock: 100 });
    const plan = await makePlan();
    for (let i = 0; i < 5; i += 1) {
      const { family } = await makeFamily(`Forecast ${i}`);
      await prisma.subscription.create({
        data: {
          familyId: family.id,
          planId: plan.id,
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: addMonths(new Date(), 1),
          providerRef: unique('sub'),
          nextBoxProductId: box.product.id,
        },
      });
    }

    const forecast = await demandForecast(1);
    // Five live subscriptions is five boxes. Not an estimate.
    expect(forecast[0]?.boxes.get(box.product.id)).toBe(5);
  });

  it('does not ship to a subscription that is paused, skipping or cancelled', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 100 });
    const plan = await makePlan();

    const make = async (name: string, data: Record<string, unknown>) => {
      const { family } = await makeFamily(name);
      return prisma.subscription.create({
        data: {
          familyId: family.id,
          planId: plan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: addMonths(new Date(), 1),
          providerRef: unique('sub'),
          nextBoxProductId: box.product.id,
          ...data,
        },
      });
    };

    await make('Live', { status: 'ACTIVE' });
    await make('Paused', { status: 'PAUSED', pausedUntil: addMonths(new Date(), 6) });
    await make('Skipping', { status: 'ACTIVE', skipNextRenewal: true });
    await make('Leaving', { status: 'ACTIVE', cancelAt: new Date(Date.now() - 1000) });

    const forecast = await demandForecast(1);
    expect(forecast[0]?.boxes.get(box.product.id)).toBe(1);
  });

  it('gives a skipping subscription its box back the period after', async () => {
    await resetDatabase();
    const first = await makeBox({ stock: 100 });
    const second = await makeBox({ stock: 100 });
    await prisma.boxProduct.update({ where: { id: first.product.id }, data: { curriculumIndex: 1 } });
    await prisma.boxProduct.update({ where: { id: second.product.id }, data: { curriculumIndex: 2 } });

    const plan = await makePlan();
    const { family } = await makeFamily('Skipper');
    await prisma.subscription.create({
      data: {
        familyId: family.id,
        planId: plan.id,
        status: 'ACTIVE',
        skipNextRenewal: true,
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 1),
        providerRef: unique('sub'),
        nextBoxProductId: first.product.id,
      },
    });

    const forecast = await demandForecast(2);
    expect([...(forecast[0]?.boxes ?? [])]).toEqual([]);
    expect(forecast[1]?.boxes.get(first.product.id)).toBe(1);
  });

  it('ships a quarterly plan every third period, not every month', async () => {
    await resetDatabase();
    const first = await makeBox({ stock: 100 });
    const second = await makeBox({ stock: 100 });
    await prisma.boxProduct.update({ where: { id: first.product.id }, data: { curriculumIndex: 1 } });
    await prisma.boxProduct.update({ where: { id: second.product.id }, data: { curriculumIndex: 2 } });

    const plan = await makePlan(unique('q'), 8900, 3);
    const { family } = await makeFamily('Quarterly');
    await prisma.subscription.create({
      data: {
        familyId: family.id,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 3),
        providerRef: unique('sub'),
        nextBoxProductId: first.product.id,
      },
    });

    const forecast = await demandForecast(4);
    expect(forecast[0]?.boxes.get(first.product.id)).toBe(1);
    expect(forecast[1]?.boxes.size).toBe(0);
    expect(forecast[2]?.boxes.size).toBe(0);
    expect(forecast[3]?.boxes.get(second.product.id)).toBe(1);
  });

  it('stops forecasting for a family that has had every box there is', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 100 });
    const plan = await makePlan();
    const { family } = await makeFamily('Completionist');
    await prisma.subscription.create({
      data: {
        familyId: family.id,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 1),
        providerRef: unique('sub'),
        nextBoxProductId: box.product.id,
      },
    });

    const forecast = await demandForecast(3);
    // One box in the catalogue: they get it once, and then the curriculum is
    // out of road. Ordering stock for a shipment that cannot happen would be
    // worse than forecasting nothing.
    expect(forecast[0]?.boxes.get(box.product.id)).toBe(1);
    expect(forecast[1]?.boxes.size).toBe(0);
    expect(forecast[2]?.boxes.size).toBe(0);
  });
});

describe('replenishment', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('orders nothing when the shelf already covers demand and buffer', async () => {
    const box = await makeBox({ stock: 500 });
    await supplierFor(box.inventoryItem.id, { safetyStock: 50 });
    expect(await replenishmentProposal()).toEqual([]);
  });

  it('covers the safety buffer even with no demand at all', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 10 });
    await supplierFor(box.inventoryItem.id, { safetyStock: 200 });

    const [proposal] = await replenishmentProposal();
    expect(proposal?.lines[0]?.shortfall).toBe(190);
  });

  it('does not re-order what is already on its way', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 0 });
    const supplier = await supplierFor(box.inventoryItem.id, { safetyStock: 300 });

    const before = await replenishmentProposal();
    expect(before[0]?.lines[0]?.orderQuantity).toBe(300);

    await createPurchaseOrder(before[0]!, 'test:on-order');

    const after = await replenishmentProposal();
    // The draft order counts as cover: nothing left to propose.
    expect(after).toEqual([]);
    expect(supplier.id).toBeTruthy();
  });

  it('holds back an order that falls under the supplier’s minimum', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 0 });
    await supplierFor(box.inventoryItem.id, { safetyStock: 10, minOrderValueCents: 50_000 });

    const [proposal] = await replenishmentProposal();
    expect(proposal?.belowMinimumOrderValue).toBe(true);

    const run = await runJob('replenish-stock');
    expect(run.status).toBe('succeeded');
    // Nothing raised: a supplier would just reject it.
    expect(await prisma.purchaseOrder.count()).toBe(0);
  });

  it('groups lines from the same supplier into one order', async () => {
    await resetDatabase();
    const first = await makeBox({ stock: 0 });
    const second = await makeBox({ stock: 0 });
    const supplier = await supplierFor(first.inventoryItem.id, { safetyStock: 100 });
    await prisma.inventoryItem.update({
      where: { id: second.inventoryItem.id },
      data: { supplierId: supplier.id, costCents: 50, safetyStockUnits: 80 },
    });

    const proposals = await replenishmentProposal();
    expect(proposals).toHaveLength(1);
    expect(proposals[0]?.lines).toHaveLength(2);
  });
});

describe('purchase orders', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  async function draftOrder(options: { autoApproveUnderCents?: number } = {}) {
    const box = await makeBox({ stock: 0 });
    await supplierFor(box.inventoryItem.id, {
      safetyStock: 200,
      autoApproveUnderCents: options.autoApproveUnderCents ?? 0,
    });
    const [proposal] = await replenishmentProposal();
    const { order } = await createPurchaseOrder(proposal!, unique('origin'));
    return { box, order, proposal: proposal! };
  }

  it('will not send an order nobody approved', async () => {
    const { order } = await draftOrder();
    expect(order.status).toBe('DRAFT');
    await expect(sendPurchaseOrder(order.id)).rejects.toBeInstanceOf(ConflictError);

    const channel = supplierChannel('EMAIL') as MockSupplierChannel;
    expect(channel.outbox().some((doc) => doc.number === order.number)).toBe(false);
  });

  it('sends once approved, and sending twice is a no-op', async () => {
    const { order } = await draftOrder();
    await approvePurchaseOrder(order.id, null);
    const sent = await sendPurchaseOrder(order.id);
    expect(sent.status).toBe('SENT');
    expect(sent.sentAt).not.toBeNull();

    const again = await sendPurchaseOrder(order.id);
    expect(again.sentAt?.toISOString()).toBe(sent.sentAt?.toISOString());
  });

  it('raises one order per origin key, however often the job runs', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 0 });
    await supplierFor(box.inventoryItem.id, { safetyStock: 150 });
    const [proposal] = await replenishmentProposal();

    const first = await createPurchaseOrder(proposal!, 'replenish:same-day');
    const second = await createPurchaseOrder(proposal!, 'replenish:same-day');
    const third = await createPurchaseOrder(proposal!, 'replenish:same-day');

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(third.created).toBe(false);
    expect(second.order.id).toBe(first.order.id);
    expect(await prisma.purchaseOrder.count()).toBe(1);
  });

  it('sends automatically only under the supplier’s own ceiling', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 0 });
    await supplierFor(box.inventoryItem.id, {
      safetyStock: 100,
      autoApproveUnderCents: 100_000,
    });

    const run = await runJob('replenish-stock');
    expect(run.summary).toMatchObject({ autoSent: 1 });

    const order = await prisma.purchaseOrder.findFirstOrThrow();
    expect(order.status).toBe('SENT');
    expect(order.approvedById).toBeNull();
  });

  it('books in a partial delivery, then completes it', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 0 });
    await supplierFor(box.inventoryItem.id, { safetyStock: 100 });
    const [proposal] = await replenishmentProposal();
    const { order } = await createPurchaseOrder(proposal!, unique('origin'));
    await approvePurchaseOrder(order.id, null);
    await sendPurchaseOrder(order.id);

    const partial = await receivePurchaseOrder(
      order.id,
      [{ inventoryItemId: box.inventoryItem.id, quantity: 40 }],
      null,
    );
    expect(partial.status).toBe('PARTIALLY_RECEIVED');
    let level = (await stockLevels()).find((l) => l.inventoryItemId === box.inventoryItem.id);
    expect(level?.onHand).toBe(40);

    const complete = await receivePurchaseOrder(
      order.id,
      [{ inventoryItemId: box.inventoryItem.id, quantity: 60 }],
      null,
    );
    expect(complete.status).toBe('RECEIVED');
    level = (await stockLevels()).find((l) => l.inventoryItemId === box.inventoryItem.id);
    expect(level?.onHand).toBe(100);
  });

  it('refuses to book in more than was ordered', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 0 });
    await supplierFor(box.inventoryItem.id, { safetyStock: 50 });
    const [proposal] = await replenishmentProposal();
    const { order } = await createPurchaseOrder(proposal!, unique('origin'));

    await receivePurchaseOrder(
      order.id,
      [{ inventoryItemId: box.inventoryItem.id, quantity: 999 }],
      null,
    );
    const level = (await stockLevels()).find((l) => l.inventoryItemId === box.inventoryItem.id);
    // Capped at what the order actually said.
    expect(level?.onHand).toBe(50);
  });
});

describe('scheduled jobs', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('records every run so an operator can see the machinery is alive', async () => {
    const run = await runJob('retention-sweep');
    expect(run.status).toBe('succeeded');

    const stored = await prisma.jobRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(stored.job).toBe('retention-sweep');
    expect(stored.finishedAt).not.toBeNull();
  });

  it('skips a repeat inside the interval instead of doing the work again', async () => {
    await runJob('retention-sweep');
    const skipped = await runJob('retention-sweep', { minIntervalMinutes: 60 });
    expect(skipped.skipped).toBe(true);
    expect(skipped.status).toBe('skipped');
  });

  it('records a failure rather than throwing at the scheduler', async () => {
    const run = await runJob('replenish-stock');
    expect(['succeeded', 'failed']).toContain(run.status);
    expect(run.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('rejects a job name it does not know', async () => {
    await expect(runJob('drop-everything')).rejects.toThrow(/Unknown job/);
  });

  it('lets one family’s bad data through without stopping the batch', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 50 });
    const plan = await makePlan();

    const healthy = await makeFamily('Healthy');
    await prisma.subscription.update({
      where: { id: (await makeDueSubscription(healthy.family.id, plan.id)).id },
      data: { nextBoxProductId: box.product.id },
    });

    // A family with no address at all: renewal cannot produce an order.
    const broken = await makeFamily('Broken');
    await prisma.address.deleteMany({ where: { familyId: broken.family.id } });
    await makeDueSubscription(broken.family.id, plan.id);

    const run = await runJob('renew-subscriptions');
    expect(run.status).toBe('succeeded');
    expect(run.summary).toMatchObject({ due: 2 });
    // The healthy one still shipped.
    expect(await prisma.order.count()).toBe(1);
  });

  it('labels paid orders when auto-fulfilment is switched on', async () => {
    await resetDatabase();
    const box = await makeBox({ stock: 20 });
    const { family, address } = await makeFamily('Auto');
    const placed = await placeOrder({
      familyId: family.id,
      lines: [{ boxProductId: box.product.id, quantity: 1 }],
      shippingAddressId: address.id,
      idempotencyKey: unique('auto'),
    });
    const provider = paymentProvider() as MockPaymentProvider;
    await provider.confirmIntent(placed.order.paymentIntentRef!, 'succeed');
    await markOrderPaid(placed.order.id);

    const run = await runJob('fulfil-paid-orders');
    expect(run.status).toBe('succeeded');
    expect(run.summary).toMatchObject({ candidates: 1, labelled: 1, failures: [] });

    const shipment = await prisma.shipment.findFirstOrThrow({ where: { orderId: placed.order.id } });
    expect(shipment.trackingCode).toBeTruthy();
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: placed.order.id } })).status,
    ).toBe('FULFILLING');
  });

  it('does not label the same order twice when the job runs again', async () => {
    const before = await prisma.shipment.count();
    await runJob('fulfil-paid-orders');
    await runJob('fulfil-paid-orders');
    // The order is no longer PAID and already has a shipment, so it is not a
    // candidate any more. An overlapping cron cannot buy two labels.
    expect(await prisma.shipment.count()).toBe(before);
  });
});

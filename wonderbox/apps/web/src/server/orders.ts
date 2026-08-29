import { randomUUID } from 'node:crypto';
import type { Order, OrderStatus } from '@prisma/client';
import { prisma, type Db } from '../lib/db.ts';
import { ConflictError, NotFoundError } from '../lib/errors.ts';
import type { Money } from '../lib/money.ts';
import { paymentProvider } from '../lib/providers/payments/index.ts';
import { shippingProvider } from '../lib/providers/shipping/index.ts';
import { audit } from '../lib/audit.ts';
import { commitReservations, releaseReservations, requirementsForBox, reserveStock, restockCommitted } from './inventory.ts';
import { estimateParcelGrams, line, priceOrder, type PriceBreakdown } from './pricing.ts';
import { assignActivationCodeToOrder } from './activation.ts';

export interface OrderLineInput {
  readonly boxProductId: string;
  readonly quantity: number;
}

export interface PlaceOrderInput {
  readonly familyId: string;
  readonly lines: readonly OrderLineInput[];
  readonly shippingAddressId: string;
  readonly billingAddressId?: string | null;
  readonly subscriptionId?: string | null;
  /**
   * Supplied by the checkout form. Two submits of the same form return the
   * same order instead of charging a family twice.
   */
  readonly idempotencyKey: string;
  readonly actorUserId?: string | null;
}

export interface PlacedOrder {
  readonly order: Order;
  readonly breakdown: PriceBreakdown;
  readonly checkoutUrl: string;
  readonly reused: boolean;
}

function orderNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `WB-${stamp}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

/**
 * Places an order: prices it, reserves the stock, and asks the payment
 * provider for an intent. Stock is held from this moment, before any money
 * moves, because a paid order we cannot fulfil is worse than a lost sale.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { items: true },
  });
  if (existing) {
    const breakdown = priceOrder(
      existing.items.map((item) =>
        line({
          sku: item.sku,
          name: item.nameSnapshot,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
        }),
      ),
      existing.shippingCents,
    );
    const intent = existing.paymentIntentRef
      ? await paymentProvider().getIntent(existing.paymentIntentRef)
      : null;
    return {
      order: existing,
      breakdown,
      checkoutUrl: intent?.checkoutUrl ?? `/checkout/${existing.id}`,
      reused: true,
    };
  }

  const address = await prisma.address.findFirst({
    where: { id: input.shippingAddressId, familyId: input.familyId },
  });
  if (!address) throw new NotFoundError('Shipping address');

  const products = await prisma.boxProduct.findMany({
    where: { id: { in: input.lines.map((entry) => entry.boxProductId) }, status: 'ACTIVE' },
    include: { translations: true },
  });
  if (products.length !== new Set(input.lines.map((entry) => entry.boxProductId)).size) {
    throw new NotFoundError('Box product');
  }

  const priceLines = input.lines.map((entry) => {
    const product = products.find((candidate) => candidate.id === entry.boxProductId);
    if (!product) throw new NotFoundError('Box product');
    const name =
      product.translations.find((translation) => translation.locale === 'nl')?.name ??
      product.translations[0]?.name ??
      product.sku;
    return line({
      sku: product.sku,
      name,
      quantity: entry.quantity,
      unitPriceCents: product.priceCents,
    });
  });

  const boxCount = input.lines.reduce((total, entry) => total + entry.quantity, 0);
  const quote = await shippingProvider().quote({
    destination: {
      recipient: address.recipient,
      line1: address.line1,
      line2: address.line2,
      postalCode: address.postalCode,
      city: address.city,
      region: address.region,
      country: address.country,
      phone: address.phone,
    },
    parcel: {
      reference: input.idempotencyKey,
      weightGrams: estimateParcelGrams(boxCount),
      items: priceLines.map((entry) => ({
        sku: entry.sku,
        quantity: entry.quantity,
        description: entry.name,
      })),
    },
  });

  const breakdown = priceOrder(priceLines, quote.cents);

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: orderNumber(),
        familyId: input.familyId,
        subscriptionId: input.subscriptionId ?? null,
        status: 'PENDING_PAYMENT',
        subtotalCents: breakdown.subtotal.cents,
        shippingCents: breakdown.shipping.cents,
        taxCents: breakdown.tax.cents,
        totalCents: breakdown.total.cents,
        shippingAddressId: address.id,
        billingAddressId: input.billingAddressId ?? null,
        idempotencyKey: input.idempotencyKey,
        items: {
          create: input.lines.map((entry) => {
            const product = products.find((candidate) => candidate.id === entry.boxProductId)!;
            const priceLine = priceLines.find((candidate) => candidate.sku === product.sku)!;
            return {
              boxProductId: product.id,
              sku: product.sku,
              nameSnapshot: priceLine.name,
              quantity: entry.quantity,
              unitPriceCents: product.priceCents,
              totalCents: priceLine.total.cents,
            };
          }),
        },
      },
    });

    for (const entry of input.lines) {
      const requirements = await requirementsForBox(entry.boxProductId, entry.quantity, tx);
      await reserveStock(tx, created.id, requirements);
    }

    return created;
  });

  const family = await prisma.family.findUniqueOrThrow({
    where: { id: input.familyId },
    include: { users: { where: { deletedAt: null }, take: 1 } },
  });
  const customerRef =
    family.paymentCustomerRef ??
    (
      await paymentProvider().createCustomer({
        email: family.users[0]?.email ?? `family-${family.id}@wonderbox.invalid`,
        name: family.name,
      })
    ).ref;
  if (!family.paymentCustomerRef) {
    await prisma.family.update({
      where: { id: family.id },
      data: { paymentCustomerRef: customerRef },
    });
  }

  const intent = await paymentProvider().createIntent({
    customerRef,
    amount: breakdown.total,
    description: `WonderBox order ${order.number}`,
    idempotencyKey: input.idempotencyKey,
    metadata: { orderId: order.id, familyId: input.familyId },
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentIntentRef: intent.ref },
  });

  await audit({
    actorUserId: input.actorUserId ?? null,
    actorRole: 'PARENT',
    action: 'order.placed',
    entityType: 'Order',
    entityId: order.id,
    metadata: { totalCents: breakdown.total.cents, lines: input.lines.length },
  });

  return { order: updated, breakdown, checkoutUrl: intent.checkoutUrl, reused: false };
}

/**
 * Marks an order paid. Idempotent by design: calling it twice for the same
 * order is a no-op, which is what makes webhook redelivery harmless.
 */
export async function markOrderPaid(orderId: string, db: Db = prisma): Promise<Order> {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');
  if (order.status !== 'PENDING_PAYMENT') return order;

  const paid = await db.order.update({
    where: { id: orderId },
    data: { status: 'PAID', paidAt: new Date() },
  });

  const invoiceCount = await db.invoice.count({ where: { orderId } });
  if (invoiceCount === 0) {
    await db.invoice.create({
      data: {
        number: `INV-${paid.number}`,
        familyId: paid.familyId,
        orderId: paid.id,
        subscriptionId: paid.subscriptionId,
        status: 'PAID',
        totalCents: paid.totalCents,
        taxCents: paid.taxCents,
        paidAt: paid.paidAt,
      },
    });
  }

  // The family can activate as soon as they have paid; the printed code in the
  // parcel matches the one reserved for them here.
  await assignActivationCodeToOrder(paid.id, db);

  await audit(
    {
      action: 'order.paid',
      entityType: 'Order',
      entityId: paid.id,
      metadata: { totalCents: paid.totalCents },
    },
    db,
  );
  return paid;
}

export async function cancelOrder(
  orderId: string,
  reason: string,
  actorUserId?: string | null,
): Promise<Order> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundError('Order');
    if (order.status === 'CANCELLED') return order;
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new ConflictError('alreadyShipped', 'A shipped order can only be refunded, not cancelled');
    }
    await releaseReservations(tx, orderId);
    const cancelled = await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await tx.activationCode.updateMany({
      where: { orderId, state: 'ASSIGNED' },
      data: { state: 'UNASSIGNED', familyId: null, orderId: null, assignedAt: null },
    });
    await audit(
      {
        actorUserId: actorUserId ?? null,
        action: 'order.cancelled',
        entityType: 'Order',
        entityId: orderId,
        metadata: { reason },
      },
      tx,
    );
    return cancelled;
  });
}

/**
 * Refunds all or part of an order. A full refund on a shipped order also puts
 * the goods back on hand, because the parcel is coming home.
 */
export async function refundOrder(
  orderId: string,
  amount: Money,
  reason: string,
  actorUserId?: string | null,
): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError('Order');
  if (!order.paymentIntentRef) throw new ConflictError('notPaid', 'Order was never paid');
  const remaining = order.totalCents - order.refundedCents;
  if (amount.cents <= 0 || amount.cents > remaining) {
    throw new ConflictError('refundTooLarge', `Refundable amount is ${remaining} cents`);
  }

  await paymentProvider().refund({
    paymentIntentRef: order.paymentIntentRef,
    amount,
    reason,
  });

  return prisma.$transaction(async (tx) => {
    const refundedTotal = order.refundedCents + amount.cents;
    const isFull = refundedTotal >= order.totalCents;
    if (isFull) {
      await releaseReservations(tx, orderId);
      await restockCommitted(tx, orderId);
      await tx.activationCode.updateMany({
        where: { orderId, state: 'ASSIGNED' },
        data: { state: 'REVOKED', revokedAt: new Date() },
      });
    }
    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        refundedCents: refundedTotal,
        status: isFull ? ('REFUNDED' satisfies OrderStatus) : order.status,
      },
    });
    await tx.invoice.updateMany({
      where: { orderId },
      data: { status: isFull ? 'REFUNDED' : 'PAID' },
    });
    await audit(
      {
        actorUserId: actorUserId ?? null,
        action: 'order.refunded',
        entityType: 'Order',
        entityId: orderId,
        metadata: { amountCents: amount.cents, full: isFull, reason },
      },
      tx,
    );
    return updated;
  });
}

/** Ops creates the label. This is the moment stock actually leaves the shelf. */
export async function createShipmentForOrder(
  orderId: string,
  actorUserId?: string | null,
): Promise<{ trackingCode: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shippingAddress: true, shipments: true },
  });
  if (!order) throw new NotFoundError('Order');
  if (order.status !== 'PAID' && order.status !== 'FULFILLING') {
    throw new ConflictError('notPayable', `Order is ${order.status}`);
  }
  const alreadyLabelled = order.shipments.find((shipment) => shipment.trackingCode);
  if (alreadyLabelled?.trackingCode) return { trackingCode: alreadyLabelled.trackingCode };

  const label = await shippingProvider().createLabel({
    destination: {
      recipient: order.shippingAddress.recipient,
      line1: order.shippingAddress.line1,
      line2: order.shippingAddress.line2,
      postalCode: order.shippingAddress.postalCode,
      city: order.shippingAddress.city,
      region: order.shippingAddress.region,
      country: order.shippingAddress.country,
      phone: order.shippingAddress.phone,
    },
    parcel: {
      reference: order.number,
      weightGrams: estimateParcelGrams(
        order.items.reduce((total, item) => total + item.quantity, 0),
      ),
      items: order.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        description: item.nameSnapshot,
      })),
    },
    idempotencyKey: `label:${order.id}`,
  });

  await prisma.$transaction(async (tx) => {
    await commitReservations(tx, order.id);
    await tx.shipment.create({
      data: {
        orderId: order.id,
        provider: shippingProvider().name,
        providerRef: label.providerRef,
        trackingCode: label.trackingCode,
        labelKey: label.labelKey,
        status: 'LABEL_CREATED',
      },
    });
    await tx.order.update({ where: { id: order.id }, data: { status: 'FULFILLING' } });
    await audit(
      {
        actorUserId: actorUserId ?? null,
        actorRole: 'OPS',
        action: 'shipment.labelCreated',
        entityType: 'Order',
        entityId: order.id,
        metadata: { providerRef: label.providerRef },
      },
      tx,
    );
  });

  return { trackingCode: label.trackingCode };
}

/** Applies a carrier status change. Safe to call repeatedly with the same status. */
export async function applyShipmentStatus(
  providerRef: string,
  status: 'label_created' | 'in_transit' | 'delivered' | 'failed' | 'returned',
  occurredAt: Date,
): Promise<void> {
  const shipment = await prisma.shipment.findUnique({ where: { providerRef } });
  if (!shipment) throw new NotFoundError('Shipment');

  const mapping = {
    label_created: { shipment: 'LABEL_CREATED', order: 'FULFILLING' },
    in_transit: { shipment: 'IN_TRANSIT', order: 'SHIPPED' },
    delivered: { shipment: 'DELIVERED', order: 'DELIVERED' },
    failed: { shipment: 'FAILED', order: null },
    returned: { shipment: 'RETURNED', order: null },
  } as const;
  const target = mapping[status];

  await prisma.$transaction(async (tx) => {
    await tx.shipment.update({
      where: { id: shipment.id },
      data: {
        status: target.shipment,
        shippedAt: status === 'in_transit' ? occurredAt : shipment.shippedAt,
        deliveredAt: status === 'delivered' ? occurredAt : shipment.deliveredAt,
      },
    });
    if (target.order) {
      await tx.order.update({ where: { id: shipment.orderId }, data: { status: target.order } });
    }
    if (status === 'returned') {
      await restockCommitted(tx, shipment.orderId);
    }
  });
}

/** Convenience for the mock checkout page and the tests. */
export async function payOrderWithMock(orderId: string): Promise<Order> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.paymentIntentRef) throw new NotFoundError('Payment intent');
  await paymentProvider().confirmIntent(order.paymentIntentRef, 'succeed');
  return markOrderPaid(orderId);
}


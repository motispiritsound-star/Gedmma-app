import { randomUUID } from 'node:crypto';
import type { PurchaseOrder, PurchaseOrderStatus } from '@prisma/client';
import { prisma } from '../lib/db.ts';
import { ConflictError, NotFoundError } from '../lib/errors.ts';
import { money, type Money } from '../lib/money.ts';
import { audit } from '../lib/audit.ts';
import { supplierChannel, type PurchaseOrderDocument } from '../lib/providers/suppliers/index.ts';
import { addMonths } from './subscriptions.ts';
import { receiveBatch } from './inventory.ts';

/**
 * Purchasing.
 *
 * The point of a subscription business is that demand is *known*: every active
 * subscription is a promise to ship one box in a period, and the curriculum
 * says which one. So replenishment here is not a guess from a moving average —
 * it is the subscription book, expanded into components, netted against what is
 * on the shelf and what is already on order.
 *
 * The one thing that is deliberately not fully automatic is the moment money is
 * committed. A supplier's `autoApproveUnderCents` is zero by default, which
 * means a proposed order waits for a person. Raise it per supplier once you
 * trust the numbers — see COMMERCE_AND_FULFILMENT.md.
 */

export interface DemandPeriod {
  readonly periodStart: Date;
  readonly periodEnd: Date;
  /** Units per box product. */
  readonly boxes: ReadonlyMap<string, number>;
}

/**
 * How many of each box will be needed, period by period.
 *
 * Subscription demand is simulated per subscription: whatever box is queued up
 * next, then the following ones in curriculum order, skipping what that family
 * already has. Paused and cancelled subscriptions do not consume a box, and a
 * subscription flagged to skip loses exactly one period.
 *
 * One-off sales are added as a flat run rate from the trailing window, because
 * nothing about them is knowable in advance.
 */
export async function demandForecast(periods = 3, now = new Date()): Promise<DemandPeriod[]> {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIALING', 'PAUSED'] } },
    include: { plan: true },
  });

  const catalogue = await prisma.boxProduct.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ curriculumIndex: 'asc' }, { sku: 'asc' }],
    select: { id: true },
  });
  const order = catalogue.map((box) => box.id);
  if (order.length === 0) return [];

  // What each family already has, so the simulation does not ship a repeat.
  const owned = new Map<string, Set<string>>();
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { notIn: ['CANCELLED'] } } },
    select: { boxProductId: true, order: { select: { familyId: true } } },
  });
  for (const item of items) {
    const set = owned.get(item.order.familyId) ?? new Set<string>();
    set.add(item.boxProductId);
    owned.set(item.order.familyId, set);
  }

  // One-off run rate: boxes sold in the last 90 days outside a subscription,
  // expressed per month.
  const since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneOff = await prisma.orderItem.findMany({
    where: {
      order: { subscriptionId: null, placedAt: { gte: since }, status: { notIn: ['CANCELLED'] } },
    },
    select: { boxProductId: true, quantity: true },
  });
  const runRate = new Map<string, number>();
  for (const item of oneOff) {
    runRate.set(item.boxProductId, (runRate.get(item.boxProductId) ?? 0) + item.quantity / 3);
  }

  const result: DemandPeriod[] = [];
  // Working copy: the simulation consumes boxes as it walks forward in time.
  const simulated = new Map<string, Set<string>>();
  for (const [familyId, set] of owned) simulated.set(familyId, new Set(set));
  const skipRemaining = new Map<string, boolean>(
    subscriptions.map((subscription) => [subscription.id, subscription.skipNextRenewal]),
  );

  for (let period = 0; period < periods; period += 1) {
    const periodStart = addMonths(now, period);
    const periodEnd = addMonths(now, period + 1);
    const boxes = new Map<string, number>();

    for (const subscription of subscriptions) {
      // A pause that outlasts this period ships nothing.
      if (
        subscription.status === 'PAUSED' &&
        subscription.pausedUntil &&
        subscription.pausedUntil > periodEnd
      ) {
        continue;
      }
      if (subscription.cancelAt && subscription.cancelAt <= periodStart) continue;
      if (skipRemaining.get(subscription.id)) {
        skipRemaining.set(subscription.id, false);
        continue;
      }
      // Quarterly plans do not ship every month.
      if (period % Math.max(subscription.plan.intervalMonths, 1) !== 0) continue;

      const already = simulated.get(subscription.familyId) ?? new Set<string>();
      const queued =
        period === 0 && subscription.nextBoxProductId && !already.has(subscription.nextBoxProductId)
          ? subscription.nextBoxProductId
          : order.find((boxId) => !already.has(boxId));
      if (!queued) continue;

      already.add(queued);
      simulated.set(subscription.familyId, already);
      boxes.set(queued, (boxes.get(queued) ?? 0) + 1);
    }

    for (const [boxId, rate] of runRate) {
      if (rate <= 0) continue;
      boxes.set(boxId, (boxes.get(boxId) ?? 0) + Math.ceil(rate));
    }

    result.push({ periodStart, periodEnd, boxes });
  }

  return result;
}

export interface ReplenishmentLine {
  readonly inventoryItemId: string;
  readonly sku: string;
  readonly name: string;
  readonly supplierSku: string | null;
  /** Forecast consumption inside the cover horizon. */
  readonly demand: number;
  readonly safetyStock: number;
  readonly onHand: number;
  readonly reserved: number;
  readonly onOrder: number;
  readonly shortfall: number;
  /** After rounding up to the supplier's minimum order quantity. */
  readonly orderQuantity: number;
  readonly unitCost: Money;
  readonly lineCost: Money;
  readonly leadTimeDays: number;
}

export interface SupplierProposal {
  readonly supplierId: string;
  readonly supplierCode: string;
  readonly supplierName: string;
  readonly channel: string;
  readonly lines: readonly ReplenishmentLine[];
  readonly subtotal: Money;
  readonly leadTimeDays: number;
  readonly expectedAt: Date;
  /** True when the total falls under this supplier's own minimum. */
  readonly belowMinimumOrderValue: boolean;
  /** True when it is small enough for this supplier to be sent unattended. */
  readonly autoApprovable: boolean;
}

/**
 * What needs ordering, grouped per supplier.
 *
 * The cover horizon is each item's own lead time plus one period, because an
 * order placed today arrives after the lead time and has to last until the one
 * after it lands.
 */
export async function replenishmentProposal(now = new Date()): Promise<SupplierProposal[]> {
  const forecast = await demandForecast(4, now);
  if (forecast.length === 0) return [];

  const components = await prisma.kitComponent.findMany();
  const items = await prisma.inventoryItem.findMany({
    include: { batches: true, supplier: true },
  });

  // Open purchase orders already cover part of the gap.
  const openLines = await prisma.purchaseOrderLine.findMany({
    where: {
      purchaseOrder: { status: { in: ['DRAFT', 'APPROVED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'] } },
    },
    select: { inventoryItemId: true, quantity: true, receivedQuantity: true },
  });
  const onOrder = new Map<string, number>();
  for (const line of openLines) {
    const outstanding = Math.max(line.quantity - line.receivedQuantity, 0);
    onOrder.set(line.inventoryItemId, (onOrder.get(line.inventoryItemId) ?? 0) + outstanding);
  }

  const proposals = new Map<string, ReplenishmentLine[]>();

  for (const item of items) {
    if (!item.supplierId || !item.supplier?.active) continue;

    const leadDays = item.leadTimeDays || item.supplier.leadTimeDays;
    // Periods the order has to cover: the lead time, plus the period after it.
    const horizonPeriods = Math.min(Math.ceil(leadDays / 30) + 1, forecast.length);

    let demand = 0;
    for (const period of forecast.slice(0, horizonPeriods)) {
      for (const [boxId, units] of period.boxes) {
        const component = components.find(
          (candidate) =>
            candidate.boxProductId === boxId && candidate.inventoryItemId === item.id,
        );
        if (component) demand += component.quantity * units;
      }
    }
    if (demand === 0 && item.safetyStockUnits === 0) continue;

    const onHand = item.batches.reduce((total, batch) => total + batch.quantityOnHand, 0);
    const reserved = item.batches.reduce((total, batch) => total + batch.quantityReserved, 0);
    const covered = onHand - reserved + (onOrder.get(item.id) ?? 0);
    const shortfall = Math.max(demand + item.safetyStockUnits - covered, 0);
    if (shortfall === 0) continue;

    const moq = Math.max(item.moq, 1);
    const orderQuantity = Math.ceil(shortfall / moq) * moq;

    const lines = proposals.get(item.supplierId) ?? [];
    lines.push({
      inventoryItemId: item.id,
      sku: item.sku,
      name: item.name,
      supplierSku: item.supplierSku,
      demand,
      safetyStock: item.safetyStockUnits,
      onHand,
      reserved,
      onOrder: onOrder.get(item.id) ?? 0,
      shortfall,
      orderQuantity,
      unitCost: money(item.costCents),
      lineCost: money(item.costCents * orderQuantity),
      leadTimeDays: leadDays,
    });
    proposals.set(item.supplierId, lines);
  }

  const suppliers = await prisma.supplier.findMany({
    where: { id: { in: [...proposals.keys()] } },
  });

  return suppliers
    .map((supplier) => {
      const lines = (proposals.get(supplier.id) ?? []).sort(
        (a, b) => b.lineCost.cents - a.lineCost.cents,
      );
      const subtotal = lines.reduce((total, line) => total + line.lineCost.cents, 0);
      const leadTimeDays = lines.reduce((slowest, line) => Math.max(slowest, line.leadTimeDays), 0);
      const expectedAt = new Date(now.getTime() + leadTimeDays * 24 * 60 * 60 * 1000);
      return {
        supplierId: supplier.id,
        supplierCode: supplier.code,
        supplierName: supplier.name,
        channel: supplier.channel,
        lines,
        subtotal: money(subtotal),
        leadTimeDays,
        expectedAt,
        belowMinimumOrderValue: subtotal < supplier.minOrderValueCents,
        autoApprovable:
          supplier.autoApproveUnderCents > 0 && subtotal <= supplier.autoApproveUnderCents,
      } satisfies SupplierProposal;
    })
    .filter((proposal) => proposal.lines.length > 0)
    .sort((a, b) => b.subtotal.cents - a.subtotal.cents);
}

function purchaseOrderNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `PO-${stamp}-${randomUUID().slice(0, 5).toUpperCase()}`;
}

/**
 * Raises a purchase order from a proposal.
 *
 * `originKey` is unique, so the replenishment job can run every hour and still
 * raise one order per supplier per day — a second attempt finds the existing
 * order and returns it rather than ordering twice.
 */
export async function createPurchaseOrder(
  proposal: SupplierProposal,
  originKey?: string,
): Promise<{ order: PurchaseOrder; created: boolean }> {
  if (originKey) {
    const existing = await prisma.purchaseOrder.findUnique({ where: { originKey } });
    if (existing) return { order: existing, created: false };
  }

  const order = await prisma.purchaseOrder.create({
    data: {
      number: purchaseOrderNumber(),
      supplierId: proposal.supplierId,
      status: 'DRAFT',
      subtotalCents: proposal.subtotal.cents,
      expectedAt: proposal.expectedAt,
      originKey: originKey ?? null,
      lines: {
        create: proposal.lines.map((line) => ({
          inventoryItemId: line.inventoryItemId,
          quantity: line.orderQuantity,
          unitCostCents: line.unitCost.cents,
          lineCents: line.lineCost.cents,
        })),
      },
    },
  });

  await audit({
    actorRole: 'SYSTEM',
    action: 'purchaseOrder.created',
    entityType: 'PurchaseOrder',
    entityId: order.id,
    metadata: { supplierId: proposal.supplierId, lines: proposal.lines.length, originKey },
  });
  return { order, created: true };
}

export async function approvePurchaseOrder(
  purchaseOrderId: string,
  actorUserId: string | null,
): Promise<PurchaseOrder> {
  const order = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
  if (!order) throw new NotFoundError('Purchase order');
  if (order.status !== 'DRAFT') return order;

  const approved = await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedById: actorUserId },
  });
  await audit({
    actorUserId,
    actorRole: actorUserId ? 'OPS' : 'SYSTEM',
    action: 'purchaseOrder.approved',
    entityType: 'PurchaseOrder',
    entityId: purchaseOrderId,
    metadata: { subtotalCents: order.subtotalCents, automatic: actorUserId === null },
  });
  return approved;
}

/** Hands an approved order to the supplier's channel. Never sends a draft. */
export async function sendPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrder> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { supplier: true, lines: { include: { inventoryItem: true } } },
  });
  if (!order) throw new NotFoundError('Purchase order');
  if (order.status === 'SENT' || order.status === 'CONFIRMED') return order;
  if (order.status !== 'APPROVED') {
    throw new ConflictError('notApproved', `Purchase order is ${order.status}, not APPROVED`);
  }

  const document: PurchaseOrderDocument = {
    number: order.number,
    supplierName: order.supplier.name,
    supplierEmail: order.supplier.email,
    currency: order.currency,
    subtotalCents: order.subtotalCents,
    expectedAt: order.expectedAt,
    notes: order.notes,
    lines: order.lines.map((line) => ({
      supplierSku: line.inventoryItem.supplierSku,
      sku: line.inventoryItem.sku,
      name: line.inventoryItem.name,
      quantity: line.quantity,
      unitCostCents: line.unitCostCents,
      lineCents: line.lineCents,
    })),
  };

  const result = await supplierChannel(order.supplier.channel).send(document);
  if (!result.ok) throw new ConflictError('dispatchFailed', result.detail);

  const sent = await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: 'SENT', sentAt: new Date() },
  });
  await audit({
    actorRole: 'SYSTEM',
    action: 'purchaseOrder.sent',
    entityType: 'PurchaseOrder',
    entityId: purchaseOrderId,
    metadata: { channel: order.supplier.channel, externalRef: result.externalRef ?? null },
  });
  return sent;
}

export interface ReceiptLine {
  readonly inventoryItemId: string;
  readonly quantity: number;
}

/**
 * Books goods in against a purchase order.
 *
 * Partial deliveries are the norm, so this is additive and can be called as
 * often as boxes turn up at the door. The order settles to RECEIVED only when
 * every line is complete.
 */
export async function receivePurchaseOrder(
  purchaseOrderId: string,
  receipts: readonly ReceiptLine[],
  actorUserId: string | null,
): Promise<PurchaseOrder> {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { lines: true },
  });
  if (!order) throw new NotFoundError('Purchase order');
  if (order.status === 'CANCELLED') {
    throw new ConflictError('cancelled', 'A cancelled purchase order cannot receive goods');
  }

  const batchCode = `${order.number}-${new Date().toISOString().slice(0, 10)}`;

  for (const receipt of receipts) {
    if (receipt.quantity <= 0) continue;
    const line = order.lines.find((candidate) => candidate.inventoryItemId === receipt.inventoryItemId);
    if (!line) continue;

    const outstanding = Math.max(line.quantity - line.receivedQuantity, 0);
    const accepted = Math.min(receipt.quantity, outstanding);
    if (accepted === 0) continue;

    await receiveBatch({
      inventoryItemId: receipt.inventoryItemId,
      batchCode,
      quantity: accepted,
    });
    await prisma.purchaseOrderLine.update({
      where: { id: line.id },
      data: { receivedQuantity: { increment: accepted } },
    });
  }

  const refreshed = await prisma.purchaseOrderLine.findMany({ where: { purchaseOrderId } });
  const complete = refreshed.every((line) => line.receivedQuantity >= line.quantity);
  const started = refreshed.some((line) => line.receivedQuantity > 0);
  const status: PurchaseOrderStatus = complete
    ? 'RECEIVED'
    : started
      ? 'PARTIALLY_RECEIVED'
      : order.status;

  const updated = await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status, receivedAt: complete ? new Date() : null },
  });
  await audit({
    actorUserId,
    actorRole: actorUserId ? 'OPS' : 'SYSTEM',
    action: 'purchaseOrder.received',
    entityType: 'PurchaseOrder',
    entityId: purchaseOrderId,
    metadata: { complete, lines: receipts.length },
  });
  return updated;
}

export async function cancelPurchaseOrder(
  purchaseOrderId: string,
  actorUserId: string | null,
): Promise<PurchaseOrder> {
  const order = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
  if (!order) throw new NotFoundError('Purchase order');
  if (order.status === 'RECEIVED') {
    throw new ConflictError('alreadyReceived', 'Goods have already been booked in');
  }
  const cancelled = await prisma.purchaseOrder.update({
    where: { id: purchaseOrderId },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  await audit({
    actorUserId,
    action: 'purchaseOrder.cancelled',
    entityType: 'PurchaseOrder',
    entityId: purchaseOrderId,
  });
  return cancelled;
}

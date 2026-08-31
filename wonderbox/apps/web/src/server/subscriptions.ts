import { randomUUID } from 'node:crypto';
import type { Subscription } from '@prisma/client';
import { prisma } from '../lib/db.ts';
import { ConflictError, NotFoundError } from '../lib/errors.ts';
import { money, type Money } from '../lib/money.ts';
import { audit } from '../lib/audit.ts';
import { placeOrder } from './orders.ts';

/**
 * The subscription engine.
 *
 * A subscription is a promise to ship one box per period. Three controls sit
 * on top of that promise, and they are deliberately different things:
 *
 *   skip   — drop exactly one shipment; the period still advances, billing for
 *            that period does not happen, and the next box is unchanged.
 *   pause  — stop entirely until a date. No renewals run while paused.
 *   cancel — stop at the end of the paid period. Nothing is clawed back.
 */

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const targetMonth = result.getUTCMonth() + months;
  const dayOfMonth = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(targetMonth);
  // Clamp: a subscription started on the 31st renews on the 30th in April.
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(dayOfMonth, daysInTargetMonth));
  return result;
}

export interface RenewalPreview {
  readonly subscriptionId: string;
  readonly willRenew: boolean;
  readonly reason: 'ok' | 'skipped' | 'paused' | 'cancelled' | 'pastDue';
  readonly renewsOn: Date;
  readonly amount: Money;
  readonly nextBox: { id: string; sku: string; name: string } | null;
  /** The period the parent lands in if nothing changes. */
  readonly periodAfterRenewal: { start: Date; end: Date };
}

/** Picks the next box in curriculum order that this family has not had yet. */
export async function chooseNextBox(familyId: string, ageBand: string | null) {
  const owned = await prisma.orderItem.findMany({
    where: { order: { familyId, status: { notIn: ['CANCELLED'] } } },
    select: { boxProductId: true },
  });
  const ownedIds = new Set(owned.map((item) => item.boxProductId));

  const candidates = await prisma.boxProduct.findMany({
    where: { status: 'ACTIVE' },
    include: { translations: true },
    orderBy: [{ curriculumIndex: 'asc' }, { sku: 'asc' }],
  });

  const banded = ageBand ? candidates.filter((box) => matchesBand(box, ageBand)) : candidates;
  const pool = banded.length > 0 ? banded : candidates;
  return pool.find((box) => !ownedIds.has(box.id)) ?? pool[0] ?? null;
}

function matchesBand(box: { ageMin: number; ageMax: number }, ageBand: string): boolean {
  const ranges: Record<string, [number, number]> = {
    AGE_5_6: [5, 6],
    AGE_7_8: [7, 8],
    AGE_9_10: [9, 10],
    AGE_11_12: [11, 12],
  };
  const range = ranges[ageBand];
  if (!range) return true;
  return box.ageMin <= range[1] && box.ageMax >= range[0];
}

export async function createSubscription(input: {
  familyId: string;
  planCode: string;
  actorUserId?: string | null;
  now?: Date;
}): Promise<Subscription> {
  const now = input.now ?? new Date();
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: input.planCode } });
  if (!plan || !plan.active) throw new NotFoundError('Subscription plan');

  const active = await prisma.subscription.findFirst({
    where: { familyId: input.familyId, status: { in: ['ACTIVE', 'TRIALING', 'PAUSED'] } },
  });
  if (active) throw new ConflictError('alreadySubscribed', 'This family already has a subscription');

  const nextBox = await chooseNextBox(input.familyId, plan.ageBand);

  const subscription = await prisma.subscription.create({
    data: {
      familyId: input.familyId,
      planId: plan.id,
      status: 'ACTIVE',
      startedAt: now,
      currentPeriodStart: now,
      currentPeriodEnd: addMonths(now, plan.intervalMonths),
      providerRef: `sub_${randomUUID()}`,
      nextBoxProductId: nextBox?.id ?? null,
    },
  });

  await audit({
    actorUserId: input.actorUserId ?? null,
    actorRole: 'PARENT',
    action: 'subscription.created',
    entityType: 'Subscription',
    entityId: subscription.id,
    metadata: { planCode: plan.code },
  });
  return subscription;
}

export async function previewRenewal(
  subscriptionId: string,
  now = new Date(),
): Promise<RenewalPreview> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, nextBox: { include: { translations: true } } },
  });
  if (!subscription) throw new NotFoundError('Subscription');

  const renewsOn = subscription.currentPeriodEnd;
  const periodAfterRenewal = {
    start: renewsOn,
    end: addMonths(renewsOn, subscription.plan.intervalMonths),
  };

  let reason: RenewalPreview['reason'] = 'ok';
  if (subscription.status === 'CANCELLED') reason = 'cancelled';
  else if (subscription.status === 'PAST_DUE') reason = 'pastDue';
  else if (subscription.status === 'PAUSED' && (subscription.pausedUntil ?? renewsOn) > now) {
    reason = 'paused';
  } else if (subscription.skipNextRenewal) reason = 'skipped';
  else if (subscription.cancelAt && subscription.cancelAt <= renewsOn) reason = 'cancelled';

  return {
    subscriptionId,
    willRenew: reason === 'ok',
    reason,
    renewsOn,
    amount: money(reason === 'ok' ? subscription.plan.priceCents : 0),
    nextBox: subscription.nextBox
      ? {
          id: subscription.nextBox.id,
          sku: subscription.nextBox.sku,
          name:
            subscription.nextBox.translations.find((t) => t.locale === 'nl')?.name ??
            subscription.nextBox.translations[0]?.name ??
            subscription.nextBox.sku,
        }
      : null,
    periodAfterRenewal,
  };
}

export async function skipNextRenewal(
  subscriptionId: string,
  skip: boolean,
  actorUserId?: string | null,
): Promise<Subscription> {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) throw new NotFoundError('Subscription');
  if (subscription.status === 'CANCELLED') {
    throw new ConflictError('cancelled', 'A cancelled subscription cannot skip');
  }
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { skipNextRenewal: skip },
  });
  await audit({
    actorUserId: actorUserId ?? null,
    action: skip ? 'subscription.skipped' : 'subscription.unskipped',
    entityType: 'Subscription',
    entityId: subscriptionId,
  });
  return updated;
}

export async function pauseSubscription(
  subscriptionId: string,
  until: Date,
  actorUserId?: string | null,
): Promise<Subscription> {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) throw new NotFoundError('Subscription');
  if (subscription.status === 'CANCELLED') {
    throw new ConflictError('cancelled', 'A cancelled subscription cannot be paused');
  }
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'PAUSED', pausedUntil: until },
  });
  await audit({
    actorUserId: actorUserId ?? null,
    action: 'subscription.paused',
    entityType: 'Subscription',
    entityId: subscriptionId,
    metadata: { until: until.toISOString() },
  });
  return updated;
}

export async function resumeSubscription(
  subscriptionId: string,
  actorUserId?: string | null,
  now = new Date(),
): Promise<Subscription> {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) throw new NotFoundError('Subscription');
  if (subscription.status !== 'PAUSED') return subscription;

  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { id: subscription.planId } });
  // Resuming mid-pause starts a fresh period today rather than back-billing.
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      pausedUntil: null,
      currentPeriodStart: now,
      currentPeriodEnd: addMonths(now, plan.intervalMonths),
    },
  });
  await audit({
    actorUserId: actorUserId ?? null,
    action: 'subscription.resumed',
    entityType: 'Subscription',
    entityId: subscriptionId,
  });
  return updated;
}

export async function cancelSubscription(
  subscriptionId: string,
  actorUserId?: string | null,
  immediate = false,
): Promise<Subscription> {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) throw new NotFoundError('Subscription');
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: immediate
      ? { status: 'CANCELLED', cancelledAt: new Date(), cancelAt: new Date() }
      : { cancelAt: subscription.currentPeriodEnd },
  });
  await audit({
    actorUserId: actorUserId ?? null,
    action: 'subscription.cancelled',
    entityType: 'Subscription',
    entityId: subscriptionId,
    metadata: { immediate },
  });
  return updated;
}

export interface RenewalResult {
  readonly subscriptionId: string;
  readonly outcome: 'renewed' | 'skipped' | 'paused' | 'cancelled' | 'noStock' | 'notDue';
  readonly orderId?: string;
}

/**
 * Runs one subscription's renewal. Called by the scheduled job and by the ops
 * console. Advancing the period is what makes it safe to run twice: a second
 * call finds the subscription no longer due.
 */
export async function runRenewal(
  subscriptionId: string,
  now = new Date(),
): Promise<RenewalResult> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, family: { include: { addresses: true } } },
  });
  if (!subscription) throw new NotFoundError('Subscription');
  if (subscription.currentPeriodEnd > now) {
    return { subscriptionId, outcome: 'notDue' };
  }

  const interval = subscription.plan.intervalMonths;
  const advance = async (data: Record<string, unknown> = {}) =>
    prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        currentPeriodStart: subscription.currentPeriodEnd,
        currentPeriodEnd: addMonths(subscription.currentPeriodEnd, interval),
        ...data,
      },
    });

  if (subscription.status === 'CANCELLED' || (subscription.cancelAt && subscription.cancelAt <= now)) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'CANCELLED', cancelledAt: subscription.cancelledAt ?? now },
    });
    return { subscriptionId, outcome: 'cancelled' };
  }

  if (subscription.status === 'PAUSED') {
    if (subscription.pausedUntil && subscription.pausedUntil <= now) {
      await resumeSubscription(subscriptionId, null, now);
      return { subscriptionId, outcome: 'renewed' };
    }
    await advance();
    return { subscriptionId, outcome: 'paused' };
  }

  if (subscription.skipNextRenewal) {
    await advance({ skipNextRenewal: false });
    await audit({
      action: 'subscription.renewalSkipped',
      entityType: 'Subscription',
      entityId: subscriptionId,
    });
    return { subscriptionId, outcome: 'skipped' };
  }

  const address =
    subscription.family.addresses.find((candidate) => candidate.isDefaultShipping) ??
    subscription.family.addresses[0];
  if (!address) return { subscriptionId, outcome: 'noStock' };

  const box =
    (subscription.nextBoxProductId
      ? await prisma.boxProduct.findUnique({ where: { id: subscription.nextBoxProductId } })
      : null) ?? (await chooseNextBox(subscription.familyId, subscription.plan.ageBand));
  if (!box) return { subscriptionId, outcome: 'noStock' };

  try {
    const placed = await placeOrder({
      familyId: subscription.familyId,
      lines: [{ boxProductId: box.id, quantity: 1 }],
      shippingAddressId: address.id,
      subscriptionId: subscription.id,
      // Period-scoped so a retried job reuses the same order.
      idempotencyKey: `renewal:${subscription.id}:${subscription.currentPeriodEnd.toISOString()}`,
    });
    const following = await chooseNextBox(subscription.familyId, subscription.plan.ageBand);
    await advance({ nextBoxProductId: following?.id ?? null, status: 'ACTIVE' });
    return { subscriptionId, outcome: 'renewed', orderId: placed.order.id };
  } catch (error) {
    if (error instanceof ConflictError && error.code === 'outOfStock') {
      return { subscriptionId, outcome: 'noStock' };
    }
    throw error;
  }
}

/** Every subscription whose period has ended. The scheduled job's work list. */
export async function dueSubscriptions(now = new Date()): Promise<string[]> {
  const rows = await prisma.subscription.findMany({
    where: { status: { in: ['ACTIVE', 'TRIALING', 'PAUSED'] }, currentPeriodEnd: { lte: now } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

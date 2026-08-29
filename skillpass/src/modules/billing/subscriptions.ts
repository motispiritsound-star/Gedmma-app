import { z } from 'zod';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { audit } from '@/lib/audit';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { paymentProvider } from '@/lib/adapters/payments';
import type { SessionUser } from '@/lib/auth/session';
import { grantMonthlyCredits, postLedgerEntry } from './credits';
import { notify } from '@/modules/notifications/service';

export const subscribeSchema = z.object({ planSlug: z.string().min(1) });

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const targetMonth = next.getMonth() + months;
  next.setMonth(targetMonth);
  return next;
}

export async function listPlans(audience: 'GUARDIAN' | 'PROVIDER' = 'GUARDIAN') {
  return prisma.subscriptionPlan.findMany({
    where: { audience, isActive: true },
    orderBy: { priceCents: 'asc' },
  });
}

export async function activeSubscription(familyId: string) {
  return prisma.subscription.findFirst({
    where: { familyId, status: { in: ['ACTIVE', 'TRIALING'] } },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });
}

export interface StartSubscriptionResult {
  subscriptionId: string;
  paymentId: string | null;
  /** Where to send the guardian: a PSP checkout page, or straight back. */
  redirectUrl: string;
  externalRef: string | null;
}

/**
 * Starts a subscription. Free plans activate immediately; paid plans create a
 * PENDING payment and hand the guardian to the payment provider. Credits are
 * granted only when the webhook confirms the payment — never optimistically.
 */
export async function startSubscription(
  user: SessionUser,
  familyId: string,
  planSlug: string,
  locale: 'nl' | 'en' = 'nl',
): Promise<StartSubscriptionResult> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { slug: planSlug } });
  if (!plan || !plan.isActive) throw new NotFoundError('Plan not found');
  if (plan.audience !== 'GUARDIAN') throw new ValidationError('This plan is not available for families');

  const current = await activeSubscription(familyId);
  if (current?.planId === plan.id) {
    throw new ConflictError('already_subscribed', 'This family is already on this plan');
  }

  const now = new Date();
  const periodEnd = addMonths(now, 1);

  const subscription = await prisma.$transaction(async (tx) => {
    if (current) {
      await tx.subscription.update({
        where: { id: current.id },
        data: { status: 'CANCELLED', cancelledAt: now },
      });
    }
    return tx.subscription.create({
      data: {
        planId: plan.id,
        familyId,
        status: plan.priceCents === 0 ? 'ACTIVE' : 'TRIALING',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'billing.subscription_started',
    entityType: 'Subscription',
    entityId: subscription.id,
    metadata: { planSlug, priceCents: plan.priceCents },
  });

  // Free plan: activate and grant its (possibly zero) credits right away.
  if (plan.priceCents === 0) {
    await grantMonthlyCredits(subscription.id);
    return {
      subscriptionId: subscription.id,
      paymentId: null,
      redirectUrl: `/${locale}/plans?status=active`,
      externalRef: null,
    };
  }

  const provider = paymentProvider();
  const checkout = await provider.createCheckout({
    reference: subscription.id,
    description: locale === 'nl' ? plan.nameNl : plan.nameEn,
    amount: { amountCents: plan.priceCents, currency: plan.currency },
    customerEmail: user.email,
    successUrl: `${env().APP_URL}/${locale}/plans?status=paid`,
    cancelUrl: `${env().APP_URL}/${locale}/plans?status=cancelled`,
    metadata: { subscriptionId: subscription.id, familyId },
  });

  const payment = await prisma.payment.create({
    data: {
      familyId,
      subscriptionId: subscription.id,
      purpose: 'SUBSCRIPTION',
      amountCents: plan.priceCents,
      currency: plan.currency,
      status: 'PENDING',
      provider: provider.name,
      externalRef: checkout.externalRef,
    },
  });

  await prisma.subscription.update({ where: { id: subscription.id }, data: { externalRef: checkout.externalRef } });

  return {
    subscriptionId: subscription.id,
    paymentId: payment.id,
    redirectUrl: checkout.redirectUrl,
    externalRef: checkout.externalRef,
  };
}

export async function cancelSubscription(user: SessionUser, familyId: string) {
  const current = await activeSubscription(familyId);
  if (!current) throw new NotFoundError('No active subscription');
  const updated = await prisma.subscription.update({
    where: { id: current.id },
    data: { cancelAtPeriodEnd: true },
  });
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'billing.subscription_cancelled',
    entityType: 'Subscription',
    entityId: current.id,
  });
  return updated;
}

export interface WebhookOutcome {
  status: 'processed' | 'duplicate' | 'ignored';
  eventId: string;
  type: string;
}

/**
 * Processes a payment webhook exactly once. The (provider, eventId) unique
 * index is the idempotency guard: a replayed delivery is recorded as a
 * duplicate and performs no side effects.
 */
export async function handlePaymentWebhook(rawBody: string, signature: string | null): Promise<WebhookOutcome> {
  const provider = paymentProvider();
  const event = provider.parseWebhook(rawBody, signature); // throws on a bad signature

  const { createHash } = await import('node:crypto');
  const payloadHash = createHash('sha256').update(rawBody).digest('hex');

  try {
    await prisma.webhookEvent.create({
      data: { provider: provider.name, eventId: event.id, eventType: event.type, payloadHash },
    });
  } catch {
    // Unique violation: this delivery has been seen before.
    return { status: 'duplicate', eventId: event.id, type: event.type };
  }

  switch (event.type) {
    case 'checkout.completed': {
      const payment = await prisma.payment.findUnique({
        where: { externalRef: event.externalRef },
        include: { subscription: { include: { plan: true } } },
      });
      if (!payment) break;

      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCEEDED', paidAt: new Date() },
        });
        if (payment.subscriptionId) {
          await tx.subscription.update({ where: { id: payment.subscriptionId }, data: { status: 'ACTIVE' } });
        }
      });

      if (payment.subscriptionId) {
        await grantMonthlyCredits(payment.subscriptionId);
        const family = payment.familyId
          ? await prisma.familyMembership.findFirst({ where: { familyId: payment.familyId } })
          : null;
        if (family) {
          await notify({
            userId: family.userId,
            category: 'CREDITS_GRANTED',
            titleNl: 'Je credits staan klaar',
            titleEn: 'Your credits are ready',
            bodyNl: `${payment.subscription?.plan.monthlyCredits ?? 0} credits zijn toegevoegd aan je gezinsaccount.`,
            bodyEn: `${payment.subscription?.plan.monthlyCredits ?? 0} credits have been added to your family account.`,
            link: '/nl/plans',
          });
        }
      }
      break;
    }

    case 'checkout.failed': {
      const payment = await prisma.payment.findUnique({ where: { externalRef: event.externalRef } });
      if (!payment) break;
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: 'Payment failed at the provider' },
      });
      if (payment.subscriptionId) {
        await prisma.subscription.update({ where: { id: payment.subscriptionId }, data: { status: 'PAST_DUE' } });
      }
      break;
    }

    case 'refund.succeeded': {
      await prisma.refund.updateMany({
        where: { externalRef: event.externalRef },
        data: { status: 'SUCCEEDED', processedAt: new Date() },
      });
      break;
    }

    case 'payout.paid': {
      await prisma.payout.updateMany({
        where: { externalRef: event.externalRef },
        data: { status: 'PAID', paidAt: new Date() },
      });
      break;
    }

    default:
      await prisma.webhookEvent.updateMany({
        where: { provider: provider.name, eventId: event.id },
        data: { processedAt: new Date() },
      });
      return { status: 'ignored', eventId: event.id, type: event.type };
  }

  await prisma.webhookEvent.updateMany({
    where: { provider: provider.name, eventId: event.id },
    data: { processedAt: new Date() },
  });
  await audit({ action: 'billing.webhook_processed', entityType: 'WebhookEvent', entityId: event.id, metadata: { type: event.type } });

  return { status: 'processed', eventId: event.id, type: event.type };
}

/**
 * Administrator-initiated money refund. Credits are refunded separately by the
 * booking flow; this is the euro side of the transaction.
 */
export async function refundPayment(admin: SessionUser, paymentId: string, amountCents: number, reason: string) {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { refunds: true } });
  if (payment.status !== 'SUCCEEDED' && payment.status !== 'PARTIALLY_REFUNDED') {
    throw new ValidationError('Only a successful payment can be refunded');
  }
  const alreadyRefunded = payment.refunds
    .filter((r) => r.status === 'SUCCEEDED')
    .reduce((sum, r) => sum + r.amountCents, 0);
  if (amountCents <= 0 || alreadyRefunded + amountCents > payment.amountCents) {
    throw new ValidationError('The refund exceeds the amount that was paid');
  }

  const result = await paymentProvider().createRefund({
    paymentExternalRef: payment.externalRef,
    amount: { amountCents, currency: payment.currency },
    reason,
  });

  const refund = await prisma.refund.create({
    data: {
      paymentId: payment.id,
      amountCents,
      currency: payment.currency,
      reason,
      status: result.status,
      externalRef: result.externalRef,
      requestedById: admin.id,
      processedAt: result.status === 'SUCCEEDED' ? new Date() : null,
    },
  });

  const totalRefunded = alreadyRefunded + (result.status === 'SUCCEEDED' ? amountCents : 0);
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: totalRefunded >= payment.amountCents ? 'REFUNDED' : totalRefunded > 0 ? 'PARTIALLY_REFUNDED' : payment.status,
    },
  });

  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.refund_issued',
    entityType: 'Refund',
    entityId: refund.id,
    metadata: { paymentId, amountCents, reason },
  });

  return refund;
}

/** Goodwill credits, e.g. after an incident. Always leaves an audit trail. */
export async function adjustCredits(admin: SessionUser, familyId: string, delta: number, reason: string) {
  const entry = await prisma.$transaction((tx) =>
    postLedgerEntry(
      {
        familyId,
        type: 'ADMIN_ADJUSTMENT',
        delta,
        description: reason,
        idempotencyKey: `adjust:${admin.id}:${Date.now()}`,
      },
      tx,
    ),
  );
  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.credits_adjusted',
    entityType: 'CreditLedgerEntry',
    entityId: entry.id,
    metadata: { familyId, delta, reason },
  });
  return entry;
}

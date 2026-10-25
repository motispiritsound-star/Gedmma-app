import { prisma } from '../lib/db.ts';
import { money } from '../lib/money.ts';
import { paymentProvider } from '../lib/providers/payments/index.ts';
import { shippingProvider } from '../lib/providers/shipping/index.ts';
import { applyShipmentStatus, markOrderPaid } from './orders.ts';

/**
 * Webhook processing.
 *
 * Providers retry. They retry on timeouts, on 500s, and sometimes for no
 * reason at all — so every handler here is idempotent twice over:
 *
 *   1. `WebhookEvent` has a unique index on (provider, externalId). The insert
 *      is the lock: a second delivery of the same event fails to insert and is
 *      answered 200 without touching a single order.
 *   2. The handlers themselves are written so that applying the same
 *      transition twice is a no-op, in case an event arrives under two ids.
 */

export type WebhookOutcome = 'processed' | 'duplicate' | 'ignored' | 'invalidSignature';

export interface WebhookResult {
  readonly outcome: WebhookOutcome;
  readonly eventId?: string;
}

/**
 * Claims an event id. Returns false when we have seen it before, which the
 * caller must treat as success — a provider that gets a 500 will simply
 * deliver it again.
 */
async function claim(provider: string, externalId: string, type: string, payload: unknown) {
  // `createMany` with skipDuplicates rather than a create-and-catch: a
  // redelivered webhook is the normal case, not an exception, and it should
  // not turn up in the logs as a database error every time.
  const result = await prisma.webhookEvent.createMany({
    data: [{ provider, externalId, type, payload: payload as object }],
    skipDuplicates: true,
  });
  return result.count === 1;
}

async function settle(provider: string, externalId: string, status: string, error?: string) {
  await prisma.webhookEvent.updateMany({
    where: { provider, externalId },
    data: { processedAt: new Date(), status, error: error ?? null },
  });
}

export async function handlePaymentWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookResult> {
  const provider = paymentProvider();
  const event = await provider.parseWebhook(rawBody, signature);
  if (!event) return { outcome: 'invalidSignature' };

  const fresh = await claim(provider.name, event.id, event.type, event.raw);
  if (!fresh) return { outcome: 'duplicate', eventId: event.id };

  try {
    switch (event.type) {
      case 'payment.succeeded': {
        if (!event.paymentIntentRef) break;
        const order = await prisma.order.findUnique({
          where: { paymentIntentRef: event.paymentIntentRef },
        });
        if (order) await markOrderPaid(order.id);
        break;
      }
      case 'payment.failed': {
        if (!event.paymentIntentRef) break;
        const order = await prisma.order.findUnique({
          where: { paymentIntentRef: event.paymentIntentRef },
        });
        if (order?.subscriptionId) {
          await prisma.subscription.update({
            where: { id: order.subscriptionId },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
      case 'payment.refunded': {
        if (!event.paymentIntentRef) break;
        const order = await prisma.order.findUnique({
          where: { paymentIntentRef: event.paymentIntentRef },
        });
        if (order) {
          // The provider is the source of truth for what was actually refunded.
          const amount = event.amount ?? money(order.totalCents - order.refundedCents);
          await prisma.order.update({
            where: { id: order.id },
            data: {
              refundedCents: Math.min(order.refundedCents + amount.cents, order.totalCents),
              status:
                order.refundedCents + amount.cents >= order.totalCents ? 'REFUNDED' : order.status,
            },
          });
        }
        break;
      }
      case 'subscription.renewed': {
        if (!event.subscriptionRef) break;
        await prisma.subscription.updateMany({
          where: { providerRef: event.subscriptionRef, status: 'PAST_DUE' },
          data: { status: 'ACTIVE' },
        });
        break;
      }
      default:
        await settle(provider.name, event.id, 'ignored');
        return { outcome: 'ignored', eventId: event.id };
    }
    await settle(provider.name, event.id, 'processed');
    return { outcome: 'processed', eventId: event.id };
  } catch (error) {
    await settle(
      provider.name,
      event.id,
      'failed',
      error instanceof Error ? error.message : 'unknown',
    );
    throw error;
  }
}

export async function handleFulfilmentWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookResult> {
  const provider = shippingProvider();
  const update = await provider.parseWebhook(rawBody, signature);
  if (!update) return { outcome: 'invalidSignature' };

  const fresh = await claim(provider.name, update.id, update.status, update.raw);
  if (!fresh) return { outcome: 'duplicate', eventId: update.id };

  try {
    await applyShipmentStatus(update.providerRef, update.status, update.occurredAt);
    await settle(provider.name, update.id, 'processed');
    return { outcome: 'processed', eventId: update.id };
  } catch (error) {
    await settle(
      provider.name,
      update.id,
      'failed',
      error instanceof Error ? error.message : 'unknown',
    );
    throw error;
  }
}

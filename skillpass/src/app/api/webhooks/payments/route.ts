import { NextResponse } from 'next/server';
import { handlePaymentWebhook } from '@/modules/billing/subscriptions';
import { consumeRateLimit } from '@/lib/rate-limit';
import { apiError, clientIp } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * Payment webhook receiver.
 *  - The raw body is read as text: a re-serialised JSON body would break the
 *    signature check.
 *  - An invalid signature is rejected before any lookup happens.
 *  - Replays are absorbed by the (provider, eventId) unique index and answered
 *    with 200 so the provider stops retrying.
 */
export async function POST(request: Request) {
  try {
    consumeRateLimit('webhook', clientIp(request));
    const rawBody = await request.text();
    const signature = request.headers.get('x-skillpass-signature') ?? request.headers.get('stripe-signature');

    let outcome;
    try {
      outcome = await handlePaymentWebhook(rawBody, signature);
    } catch (error) {
      // Signature and payload failures must not look like server errors.
      return NextResponse.json(
        { error: { code: 'invalid_webhook', message: error instanceof Error ? error.message : 'Invalid webhook' } },
        { status: 400 },
      );
    }

    return NextResponse.json(outcome, { status: 200 });
  } catch (error) {
    return apiError(error);
  }
}

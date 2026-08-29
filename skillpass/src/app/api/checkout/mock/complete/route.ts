import { NextResponse } from 'next/server';
import { z } from 'zod';
import { env } from '@/lib/env';
import { paymentProvider } from '@/lib/adapters/payments';
import { apiError } from '@/lib/api';
import { ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const schema = z.object({
  externalRef: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  outcome: z.enum(['checkout.completed', 'checkout.failed']),
});

/**
 * Bridge used only by the built-in mock checkout page: it signs a webhook with
 * the server-side secret and posts it to the real webhook endpoint, so the
 * production code path (signature verification + idempotency) is what runs.
 */
export async function POST(request: Request) {
  try {
    if (env().PAYMENT_PROVIDER !== 'mock') {
      throw new ValidationError('The mock checkout is only available when PAYMENT_PROVIDER=mock');
    }
    const input = schema.parse(await request.json());
    const provider = paymentProvider();
    if (!provider.signWebhook) throw new ValidationError('The configured payment provider cannot sign test webhooks');

    const payload = JSON.stringify({
      id: `evt_mock_${input.externalRef}_${input.outcome}`,
      type: input.outcome,
      data: { externalRef: input.externalRef, amountCents: input.amountCents, currency: input.currency, metadata: {} },
    });

    const response = await fetch(`${env().APP_URL}/api/webhooks/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-skillpass-signature': provider.signWebhook(payload) },
      body: payload,
    });

    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) {
    return apiError(error);
  }
}

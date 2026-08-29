import { NextResponse, type NextRequest } from 'next/server';
import { handlePaymentWebhook } from '../../../../server/webhooks.ts';

/**
 * Payment provider callback.
 *
 * A duplicate delivery answers 200 and does nothing — providers retry on any
 * non-2xx, so replying 409 to a replay would guarantee an infinite retry loop
 * over an event that was already handled correctly.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const raw = await request.text();
  const signature =
    request.headers.get('stripe-signature') ?? request.headers.get('x-wonderbox-signature');

  const result = await handlePaymentWebhook(raw, signature);
  if (result.outcome === 'invalidSignature') {
    return NextResponse.json({ error: 'invalidSignature' }, { status: 400 });
  }
  return NextResponse.json({ received: true, outcome: result.outcome });
}

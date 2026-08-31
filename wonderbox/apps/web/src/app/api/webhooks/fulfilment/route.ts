import { NextResponse, type NextRequest } from 'next/server';
import { handleFulfilmentWebhook } from '../../../../server/webhooks.ts';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const raw = await request.text();
  const signature = request.headers.get('x-wonderbox-signature');

  const result = await handleFulfilmentWebhook(raw, signature);
  if (result.outcome === 'invalidSignature') {
    return NextResponse.json({ error: 'invalidSignature' }, { status: 400 });
  }
  return NextResponse.json({ received: true, outcome: result.outcome });
}

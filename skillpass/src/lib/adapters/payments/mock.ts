import { hmac, reference, safeEquals } from '../../crypto';
import type {
  CheckoutRequest,
  CheckoutResult,
  PaymentProvider,
  PaymentWebhookEvent,
  PaymentWebhookType,
  PayoutRequest,
  PayoutResult,
  RefundRequest,
  RefundResult,
} from './types';

/**
 * Offline payment provider. It behaves like a real PSP in the ways that matter
 * for correctness: it hands back an external reference, redirects to a hosted
 * page (our own /checkout/mock route) and posts HMAC-signed webhooks.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  constructor(private readonly webhookSecret: string) {}

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const externalRef = `mock_cs_${reference('X').toLowerCase().replace('-', '')}`;
    const url = new URL(request.successUrl);
    url.searchParams.set('ref', externalRef);
    return {
      externalRef,
      redirectUrl: `/checkout/mock?ref=${encodeURIComponent(externalRef)}&amount=${request.amount.amountCents}&currency=${request.amount.currency}&next=${encodeURIComponent(url.toString())}`,
    };
  }

  async createRefund(request: RefundRequest): Promise<RefundResult> {
    return { externalRef: `mock_re_${reference('R').toLowerCase().replace('-', '')}`, status: 'SUCCEEDED' };
  }

  async createPayout(request: PayoutRequest): Promise<PayoutResult> {
    return { externalRef: `mock_po_${reference('P').toLowerCase().replace('-', '')}`, status: 'PAID' };
  }

  signWebhook(rawBody: string): string {
    return `sha256=${hmac(this.webhookSecret, rawBody)}`;
  }

  parseWebhook(rawBody: string, signature: string | null): PaymentWebhookEvent {
    if (!signature) throw new Error('Missing webhook signature');
    if (!safeEquals(signature, this.signWebhook(rawBody))) {
      throw new Error('Invalid webhook signature');
    }
    const payload = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: { externalRef?: string; amountCents?: number; currency?: string; metadata?: Record<string, string> };
    };
    if (!payload.id || !payload.type || !payload.data?.externalRef) {
      throw new Error('Malformed webhook payload');
    }
    const known: PaymentWebhookType[] = ['checkout.completed', 'checkout.failed', 'refund.succeeded', 'payout.paid'];
    return {
      id: payload.id,
      type: known.includes(payload.type as PaymentWebhookType) ? (payload.type as PaymentWebhookType) : 'unknown',
      externalRef: payload.data.externalRef,
      amount:
        typeof payload.data.amountCents === 'number'
          ? { amountCents: payload.data.amountCents, currency: payload.data.currency ?? 'EUR' }
          : undefined,
      metadata: payload.data.metadata ?? {},
      raw: payload,
    };
  }
}

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { BillingPeriod, PaymentMethod } from '@buurklus/shared';
import type { Env } from '../env.js';

export interface CheckoutRequest {
  reference: string;
  grossCents: number;
  method: PaymentMethod;
  period: BillingPeriod;
  planSlug: string;
  returnUrl?: string;
  customerPhone: string;
  description: string;
}

export interface CheckoutSession {
  /** Where the app should send the pro to pay, or null when none is needed. */
  redirectUrl: string | null;
  providerRef: string;
  /** True when the payment settled without a redirect (mock, transfer). */
  settledImmediately: boolean;
}

export interface PaymentAdapter {
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Verifies a provider callback really came from the provider. */
  verifyCallbackSignature(payload: Record<string, string>, signature: string): boolean;
}

/**
 * Used in development and by the automated tests: no network call, and the
 * subscription activates as soon as checkout is requested.
 */
class MockPaymentAdapter implements PaymentAdapter {
  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    return {
      redirectUrl: null,
      providerRef: `mock_${request.reference}`,
      settledImmediately: true,
    };
  }

  verifyCallbackSignature(): boolean {
    return true;
  }
}

/**
 * Mollie is the default provider here: it covers iDEAL, which is how the
 * Netherlands pays online, and SEPA direct debit, which is how it pays for
 * subscriptions.
 *
 * Two things about Mollie shape this adapter. Its webhook carries only a
 * payment id and no signed body — the server is expected to call the API back
 * and read the authoritative status — so the "signature" checked here is a
 * shared secret placed in the webhook URL, not a body signature. And a
 * subscription is a first payment that establishes a mandate, after which
 * later charges are taken without the customer present.
 */
class MolliePaymentAdapter implements PaymentAdapter {
  constructor(private readonly env: Env) {}

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    if (request.method === 'BANK_TRANSFER') {
      // Invoiced on account: no gateway, and the team marks it paid on arrival.
      return {
        redirectUrl: null,
        providerRef: `invoice_${request.reference}`,
        settledImmediately: false,
      };
    }

    const response = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.env.MOLLIE_API_KEY ?? ''}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        amount: {
          currency: 'EUR',
          // Mollie takes a decimal string, not cents.
          value: (request.grossCents / 100).toFixed(2),
        },
        description: request.description,
        redirectUrl: request.returnUrl ?? `${this.env.PUBLIC_APP_URL}/abonnement`,
        webhookUrl: `${this.env.PUBLIC_API_URL}/v1/subscriptions/callback?token=${this.env.PAYMENT_WEBHOOK_SECRET ?? ''}`,
        method: request.method === 'IDEAL' ? 'ideal' : undefined,
        // Establishes the mandate that later monthly charges are taken against.
        sequenceType: 'first',
        metadata: { reference: request.reference, plan: request.planSlug, period: request.period },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Mollie rejected the payment (${response.status}): ${detail.slice(0, 200)}`);
    }

    const payment = (await response.json()) as {
      id: string;
      _links?: { checkout?: { href?: string } };
    };

    return {
      redirectUrl: payment._links?.checkout?.href ?? null,
      providerRef: payment.id,
      settledImmediately: false,
    };
  }

  /**
   * Mollie does not sign its webhook body, so the callback is authenticated by
   * a secret carried in the webhook URL and compared in constant time.
   */
  verifyCallbackSignature(_payload: Record<string, string>, signature: string): boolean {
    const secret = this.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) return false;

    const provided = Buffer.from(signature);
    const expected = Buffer.from(secret);
    if (provided.length !== expected.length) return false;
    return timingSafeEqual(provided, expected);
  }
}

/**
 * For providers that do sign their callbacks, this is the HMAC comparison to
 * reach for. Kept here so switching provider does not mean rediscovering it.
 */
export function verifyHmacSignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  const provided = Buffer.from(signature, 'hex');
  const computed = Buffer.from(expected, 'hex');
  if (provided.length !== computed.length) return false;
  return timingSafeEqual(provided, computed);
}

export function createPaymentAdapter(env: Env): PaymentAdapter {
  return env.PAYMENT_PROVIDER === 'mollie' ? new MolliePaymentAdapter(env) : new MockPaymentAdapter();
}

import { createHmac, timingSafeEqual } from 'node:crypto';
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

const API = 'https://api.stripe.com/v1';

/**
 * Stripe adapter, TEST MODE ONLY for this MVP. Implemented against the REST API
 * with fetch so the project carries no SDK dependency and the mock stays the
 * default. Marketplace payouts are modelled with Stripe Connect transfers;
 * before going live this needs a completed Connect onboarding flow per provider
 * and a legal review of the money-flow model (see MARKETPLACE_AND_PAYMENTS.md).
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe';

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret: string,
  ) {
    if (!secretKey.startsWith('sk_test_')) {
      // Guard rail: this MVP has not been through a payments compliance review.
      console.warn('[stripe] non-test secret key configured — SkillPass is only certified for test mode');
    }
  }

  private async post(path: string, form: Record<string, string>): Promise<Record<string, unknown>> {
    const response = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(form).toString(),
    });
    const body = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const error = body.error as { message?: string } | undefined;
      throw new Error(`Stripe ${path} failed: ${error?.message ?? response.status}`);
    }
    return body;
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const form: Record<string, string> = {
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': request.amount.currency.toLowerCase(),
      'line_items[0][price_data][unit_amount]': String(request.amount.amountCents),
      'line_items[0][price_data][product_data][name]': request.description,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      customer_email: request.customerEmail,
      client_reference_id: request.reference,
    };
    for (const [key, value] of Object.entries(request.metadata ?? {})) {
      form[`metadata[${key}]`] = value;
    }
    const session = await this.post('/checkout/sessions', form);
    return { externalRef: String(session.id), redirectUrl: String(session.url) };
  }

  async createRefund(request: RefundRequest): Promise<RefundResult> {
    const refund = await this.post('/refunds', {
      payment_intent: request.paymentExternalRef,
      amount: String(request.amount.amountCents),
      reason: 'requested_by_customer',
      'metadata[skillpass_reason]': request.reason,
    });
    const status = String(refund.status);
    return {
      externalRef: String(refund.id),
      status: status === 'succeeded' ? 'SUCCEEDED' : status === 'failed' ? 'FAILED' : 'PENDING',
    };
  }

  async createPayout(request: PayoutRequest): Promise<PayoutResult> {
    const transfer = await this.post('/transfers', {
      amount: String(request.amount.amountCents),
      currency: request.amount.currency.toLowerCase(),
      destination: request.providerAccountRef,
      description: request.description,
    });
    return { externalRef: String(transfer.id), status: 'PAID' };
  }

  /** Implements Stripe's documented `Stripe-Signature` verification scheme. */
  parseWebhook(rawBody: string, signature: string | null): PaymentWebhookEvent {
    if (!signature) throw new Error('Missing Stripe-Signature header');
    const parts = Object.fromEntries(
      signature.split(',').map((piece) => {
        const [k, v] = piece.split('=');
        return [k ?? '', v ?? ''];
      }),
    );
    const timestamp = parts.t;
    const provided = parts.v1;
    if (!timestamp || !provided) throw new Error('Malformed Stripe-Signature header');

    // Reject replays older than five minutes.
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
      throw new Error('Stripe webhook timestamp outside tolerance');
    }

    const expected = createHmac('sha256', this.webhookSecret).update(`${timestamp}.${rawBody}`).digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('Invalid Stripe webhook signature');

    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: { object: Record<string, unknown> };
    };
    const object = event.data.object;
    const typeMap: Record<string, PaymentWebhookType> = {
      'checkout.session.completed': 'checkout.completed',
      'checkout.session.async_payment_failed': 'checkout.failed',
      'charge.refunded': 'refund.succeeded',
      'transfer.paid': 'payout.paid',
    };
    return {
      id: event.id,
      type: typeMap[event.type] ?? 'unknown',
      externalRef: String(object.id ?? ''),
      amount:
        typeof object.amount_total === 'number'
          ? { amountCents: object.amount_total, currency: String(object.currency ?? 'eur').toUpperCase() }
          : undefined,
      metadata: (object.metadata as Record<string, string>) ?? {},
      raw: event,
    };
  }
}

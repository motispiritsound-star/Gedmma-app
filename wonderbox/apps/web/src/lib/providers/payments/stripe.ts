import { createHmac } from 'node:crypto';
import { safeEqual } from '../../crypto.ts';
import { money, type Money } from '../../money.ts';
import type {
  CreateIntentInput,
  PaymentCustomer,
  PaymentIntent,
  PaymentProvider,
  PaymentWebhookEvent,
  RefundResult,
} from './types.ts';

/**
 * Stripe adapter.
 *
 * It talks to the REST API directly rather than pulling in the SDK, because the
 * surface WonderBox needs is four endpoints and the SDK would be the largest
 * dependency in the tree. Set PAYMENT_PROVIDER=stripe with a test-mode key to
 * use it; every other environment runs the mock.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly name = 'stripe';

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret: string,
    private readonly appUrl: string,
    private readonly apiBase = 'https://api.stripe.com/v1',
  ) {}

  async createCustomer(input: { email: string; name: string }): Promise<PaymentCustomer> {
    const body = await this.post('/customers', { email: input.email, name: input.name });
    return { ref: String(body.id) };
  }

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const body = await this.post(
      '/payment_intents',
      {
        amount: String(input.amount.cents),
        currency: input.amount.currency.toLowerCase(),
        customer: input.customerRef,
        description: input.description,
        'automatic_payment_methods[enabled]': 'true',
        ...Object.fromEntries(
          Object.entries(input.metadata ?? {}).map(([key, value]) => [`metadata[${key}]`, value]),
        ),
      },
      input.idempotencyKey,
    );
    return this.toIntent(body);
  }

  async getIntent(ref: string): Promise<PaymentIntent | null> {
    const response = await fetch(`${this.apiBase}/payment_intents/${ref}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Stripe error ${response.status}`);
    return this.toIntent((await response.json()) as Record<string, unknown>);
  }

  /**
   * Real payments are confirmed by the customer in the browser, so there is
   * nothing to do server-side. Kept on the port so the mock can drive tests.
   */
  async confirmIntent(ref: string): Promise<PaymentIntent> {
    const intent = await this.getIntent(ref);
    if (!intent) throw new Error(`Unknown payment intent ${ref}`);
    return intent;
  }

  async refund(input: {
    paymentIntentRef: string;
    amount: Money;
    reason?: string;
  }): Promise<RefundResult> {
    const body = await this.post('/refunds', {
      payment_intent: input.paymentIntentRef,
      amount: String(input.amount.cents),
      ...(input.reason ? { reason: input.reason } : {}),
    });
    return {
      ref: String(body.id),
      amount: input.amount,
      status: body.status === 'succeeded' ? 'succeeded' : 'pending',
    };
  }

  async parseWebhook(rawBody: string, signature: string | null): Promise<PaymentWebhookEvent | null> {
    if (!signature) return null;
    const parts = Object.fromEntries(
      signature.split(',').map((piece) => {
        const [key = '', value = ''] = piece.split('=');
        return [key.trim(), value.trim()];
      }),
    );
    const timestamp = parts.t;
    const provided = parts.v1;
    if (!timestamp || !provided) return null;
    const expected = createHmac('sha256', this.webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');
    if (!safeEqual(expected, provided)) return null;

    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data: { object: Record<string, unknown> };
    };
    const object = event.data?.object ?? {};
    const mapped: Record<string, PaymentWebhookEvent['type']> = {
      'payment_intent.succeeded': 'payment.succeeded',
      'payment_intent.payment_failed': 'payment.failed',
      'charge.refunded': 'payment.refunded',
      'invoice.paid': 'subscription.renewed',
    };
    return {
      id: event.id,
      type: mapped[event.type] ?? 'unknown',
      paymentIntentRef:
        typeof object.payment_intent === 'string'
          ? object.payment_intent
          : typeof object.id === 'string'
            ? object.id
            : undefined,
      subscriptionRef: typeof object.subscription === 'string' ? object.subscription : undefined,
      amount: typeof object.amount === 'number' ? money(object.amount) : undefined,
      raw: event,
    };
  }

  private toIntent(body: Record<string, unknown>): PaymentIntent {
    const statusMap: Record<string, PaymentIntent['status']> = {
      requires_payment_method: 'requires_payment',
      requires_confirmation: 'requires_payment',
      requires_action: 'requires_payment',
      processing: 'processing',
      succeeded: 'succeeded',
      canceled: 'cancelled',
    };
    const ref = String(body.id);
    return {
      ref,
      amount: money(Number(body.amount ?? 0)),
      status: statusMap[String(body.status)] ?? 'failed',
      checkoutUrl: `${this.appUrl}/checkout/${ref}`,
      clientSecret: typeof body.client_secret === 'string' ? body.client_secret : undefined,
    };
  }

  private async post(
    path: string,
    form: Record<string, string>,
    idempotencyKey?: string,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.apiBase}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: new URLSearchParams(form).toString(),
    });
    if (!response.ok) {
      throw new Error(`Stripe ${path} failed with ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as Record<string, unknown>;
  }
}

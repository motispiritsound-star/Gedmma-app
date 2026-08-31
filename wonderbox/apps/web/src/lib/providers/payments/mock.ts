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

interface StoredIntent {
  ref: string;
  amountCents: number;
  currency: 'EUR';
  status: PaymentIntent['status'];
  description: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
}

/**
 * In-process payment provider. It behaves like a real one in the ways that
 * matter for correctness — idempotency keys, asynchronous confirmation, signed
 * webhooks — without any network. `npm run dev` uses it by default.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  private intents = new Map<string, StoredIntent>();
  private byIdempotencyKey = new Map<string, string>();
  private customers = new Set<string>();
  private counter = 0;

  constructor(private readonly webhookSecret: string) {}

  async createCustomer(input: { email: string; name: string }): Promise<PaymentCustomer> {
    const ref = `cus_mock_${hashish(input.email)}`;
    this.customers.add(ref);
    return { ref };
  }

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const existingRef = this.byIdempotencyKey.get(input.idempotencyKey);
    if (existingRef) {
      const existing = this.intents.get(existingRef);
      if (existing) return this.toIntent(existing);
    }
    this.counter += 1;
    const ref = `pi_mock_${Date.now().toString(36)}_${this.counter}`;
    const stored: StoredIntent = {
      ref,
      amountCents: input.amount.cents,
      currency: input.amount.currency,
      status: 'requires_payment',
      description: input.description,
      idempotencyKey: input.idempotencyKey,
      metadata: input.metadata ?? {},
    };
    this.intents.set(ref, stored);
    this.byIdempotencyKey.set(input.idempotencyKey, ref);
    return this.toIntent(stored);
  }

  async getIntent(ref: string): Promise<PaymentIntent | null> {
    const stored = this.intents.get(ref);
    return stored ? this.toIntent(stored) : null;
  }

  async confirmIntent(ref: string, outcome: 'succeed' | 'fail' = 'succeed'): Promise<PaymentIntent> {
    const stored = this.intents.get(ref);
    if (!stored) throw new Error(`Unknown mock payment intent ${ref}`);
    stored.status = outcome === 'succeed' ? 'succeeded' : 'failed';
    return this.toIntent(stored);
  }

  async refund(input: {
    paymentIntentRef: string;
    amount: Money;
    reason?: string;
  }): Promise<RefundResult> {
    const stored = this.intents.get(input.paymentIntentRef);
    if (!stored) throw new Error(`Unknown mock payment intent ${input.paymentIntentRef}`);
    if (input.amount.cents > stored.amountCents) {
      throw new Error('Refund exceeds the captured amount');
    }
    return { ref: `re_mock_${stored.ref}`, amount: input.amount, status: 'succeeded' };
  }

  /** Signature scheme mirrors Stripe's: `t=<ts>,v1=<hmac of ts.body>`. */
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

    const body = JSON.parse(rawBody) as {
      id?: string;
      type?: string;
      data?: { paymentIntentRef?: string; subscriptionRef?: string; amountCents?: number };
    };
    if (!body.id || !body.type) return null;

    const known = [
      'payment.succeeded',
      'payment.failed',
      'payment.refunded',
      'subscription.renewed',
    ] as const;
    const type = (known as readonly string[]).includes(body.type)
      ? (body.type as PaymentWebhookEvent['type'])
      : 'unknown';

    return {
      id: body.id,
      type,
      paymentIntentRef: body.data?.paymentIntentRef,
      subscriptionRef: body.data?.subscriptionRef,
      amount: body.data?.amountCents === undefined ? undefined : money(body.data.amountCents),
      raw: body,
    };
  }

  /** Test/dev helper: produce a correctly signed webhook body + header. */
  signWebhook(body: unknown): { body: string; signature: string } {
    const raw = JSON.stringify(body);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const v1 = createHmac('sha256', this.webhookSecret).update(`${timestamp}.${raw}`).digest('hex');
    return { body: raw, signature: `t=${timestamp},v1=${v1}` };
  }

  private toIntent(stored: StoredIntent): PaymentIntent {
    return {
      ref: stored.ref,
      amount: money(stored.amountCents, stored.currency),
      status: stored.status,
      checkoutUrl: `/checkout/mock/${stored.ref}`,
      clientSecret: `${stored.ref}_secret`,
    };
  }
}

function hashish(value: string): string {
  let acc = 0;
  for (let i = 0; i < value.length; i += 1) acc = (acc * 31 + value.charCodeAt(i)) >>> 0;
  return acc.toString(36);
}

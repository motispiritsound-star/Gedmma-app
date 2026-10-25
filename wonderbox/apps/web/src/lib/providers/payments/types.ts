import type { Money } from '../../money.ts';

/**
 * The payment provider port. Nothing in the application imports Stripe: it
 * imports this. The mock implementation is the one the test suite and local
 * development run against, which keeps the seam honest.
 */

export interface PaymentCustomer {
  readonly ref: string;
}

export interface PaymentIntent {
  readonly ref: string;
  readonly amount: Money;
  readonly status: 'requires_payment' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  /** Where the browser is sent to complete payment. Mock returns a local route. */
  readonly checkoutUrl: string;
  readonly clientSecret?: string;
}

export interface RefundResult {
  readonly ref: string;
  readonly amount: Money;
  readonly status: 'succeeded' | 'pending' | 'failed';
}

export interface CreateIntentInput {
  readonly customerRef: string;
  readonly amount: Money;
  readonly description: string;
  /** Replaying the same key must return the same intent, never a second charge. */
  readonly idempotencyKey: string;
  readonly metadata?: Record<string, string>;
}

/** A provider event, already verified and normalised. */
export interface PaymentWebhookEvent {
  readonly id: string;
  readonly type:
    | 'payment.succeeded'
    | 'payment.failed'
    | 'payment.refunded'
    | 'subscription.renewed'
    | 'unknown';
  readonly paymentIntentRef?: string;
  readonly subscriptionRef?: string;
  readonly amount?: Money;
  readonly raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  createCustomer(input: { email: string; name: string }): Promise<PaymentCustomer>;
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  getIntent(ref: string): Promise<PaymentIntent | null>;
  /** Used by the mock checkout page and by tests to drive an intent to success. */
  confirmIntent(ref: string, outcome?: 'succeed' | 'fail'): Promise<PaymentIntent>;
  refund(input: { paymentIntentRef: string; amount: Money; reason?: string }): Promise<RefundResult>;
  /**
   * Verifies the signature and parses the body. Returning null means "not ours"
   * — the route answers 400 without touching the database.
   */
  parseWebhook(rawBody: string, signature: string | null): Promise<PaymentWebhookEvent | null>;
}

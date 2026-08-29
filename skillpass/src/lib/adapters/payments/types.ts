/** Money is always minor units + ISO-4217 code. Never a float. */
export interface Money {
  amountCents: number;
  currency: string;
}

export interface CheckoutRequest {
  reference: string;
  description: string;
  amount: Money;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutResult {
  externalRef: string;
  redirectUrl: string;
}

export interface RefundRequest {
  paymentExternalRef: string;
  amount: Money;
  reason: string;
}

export interface RefundResult {
  externalRef: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
}

export interface PayoutRequest {
  providerAccountRef: string;
  amount: Money;
  periodStart: Date;
  periodEnd: Date;
  description: string;
}

export interface PayoutResult {
  externalRef: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'PAID' | 'FAILED';
}

export type PaymentWebhookType =
  | 'checkout.completed'
  | 'checkout.failed'
  | 'refund.succeeded'
  | 'payout.paid'
  | 'unknown';

export interface PaymentWebhookEvent {
  id: string;
  type: PaymentWebhookType;
  externalRef: string;
  amount?: Money;
  metadata: Record<string, string>;
  raw: unknown;
}

/**
 * Every payment/marketplace interaction goes through this port. The mock
 * implementation is complete enough to run the whole product offline; the
 * Stripe implementation talks to Stripe TEST mode only.
 */
export interface PaymentProvider {
  readonly name: string;
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>;
  createRefund(request: RefundRequest): Promise<RefundResult>;
  createPayout(request: PayoutRequest): Promise<PayoutResult>;
  /** Verifies the signature and normalises the payload. Throws when invalid. */
  parseWebhook(rawBody: string, signature: string | null): PaymentWebhookEvent;
  /** Used by the mock checkout page and by tests to produce a valid signature. */
  signWebhook?(rawBody: string): string;
}

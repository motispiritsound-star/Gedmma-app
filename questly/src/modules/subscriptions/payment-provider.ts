import "server-only";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

export type CheckoutRequest = {
  familyId: string;
  customerEmail: string;
  plan: "FAMILY_PREMIUM";
  successUrl: string;
  cancelUrl: string;
};

export type CheckoutSession = {
  /** Where the browser should be sent to complete payment. */
  url: string;
  providerSessionId: string;
  /** True when no real money can move - the UI says so explicitly. */
  simulated: boolean;
};

export type ProviderSubscription = {
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
};

/**
 * The only surface the rest of the application knows about. Swapping Stripe for
 * another provider, or running with no provider at all, happens here.
 */
export interface PaymentProvider {
  readonly kind: "MOCK" | "STRIPE";
  createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
  /** Verifies and parses a webhook body. Returns null when it is not for us. */
  parseWebhook(rawBody: string, signature: string | null): Promise<WebhookEvent | null>;
}

export type WebhookEvent =
  | { type: "subscription.activated"; familyId: string; subscription: ProviderSubscription }
  | { type: "subscription.cancelled"; familyId: string }
  | { type: "ignored" };

const MONTH_MS = 30 * 24 * 3600_000;

/**
 * Local provider used whenever Stripe is not configured. It never contacts a
 * network service, which keeps `npm run dev`, tests and CI self-contained.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly kind = "MOCK" as const;

  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession> {
    const providerSessionId = `mock_cs_${request.familyId}_${Date.now()}`;
    const url = new URL(request.successUrl);
    url.searchParams.set("simulated", "1");
    url.searchParams.set("session_id", providerSessionId);
    logger.info("payments.mock_checkout_created", { familyId: request.familyId, plan: request.plan });
    return { url: url.toString(), providerSessionId, simulated: true };
  }

  async cancelSubscription(): Promise<void> {
    // Nothing to cancel remotely.
  }

  async parseWebhook(): Promise<WebhookEvent | null> {
    return { type: "ignored" };
  }

  static activation(familyId: string): ProviderSubscription {
    void familyId;
    return {
      providerCustomerId: null,
      providerSubscriptionId: null,
      currentPeriodEnd: new Date(Date.now() + MONTH_MS),
    };
  }
}

/**
 * Stripe in test mode. The SDK is imported lazily so the dependency is never
 * loaded - and never needs credentials - when PAYMENT_PROVIDER=mock.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly kind = "STRIPE" as const;

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret: string | undefined,
    private readonly priceId: string | undefined,
  ) {}

  private async client() {
    const { default: Stripe } = await import("stripe");
    return new Stripe(this.secretKey);
  }

  async createCheckoutSession(request: CheckoutRequest): Promise<CheckoutSession> {
    if (!this.priceId) throw new Error("STRIPE_PRICE_FAMILY_PREMIUM is not configured.");
    const stripe = await this.client();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: request.customerEmail,
      line_items: [{ price: this.priceId, quantity: 1 }],
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      client_reference_id: request.familyId,
      metadata: { familyId: request.familyId },
    });
    return { url: session.url ?? request.cancelUrl, providerSessionId: session.id, simulated: false };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const stripe = await this.client();
    await stripe.subscriptions.update(providerSubscriptionId, { cancel_at_period_end: true });
  }

  async parseWebhook(rawBody: string, signature: string | null): Promise<WebhookEvent | null> {
    if (!this.webhookSecret || !signature) return null;
    const stripe = await this.client();
    const event = stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as {
        metadata?: Record<string, string> | null;
        client_reference_id?: string | null;
        customer?: string | null;
        subscription?: string | null;
      };
      const familyId = session.metadata?.familyId ?? session.client_reference_id ?? null;
      if (!familyId) return { type: "ignored" };
      return {
        type: "subscription.activated",
        familyId,
        subscription: {
          providerCustomerId: typeof session.customer === "string" ? session.customer : null,
          providerSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
          currentPeriodEnd: new Date(Date.now() + MONTH_MS),
        },
      };
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as { metadata?: Record<string, string> | null };
      const familyId = subscription.metadata?.familyId;
      if (!familyId) return { type: "ignored" };
      return { type: "subscription.cancelled", familyId };
    }

    return { type: "ignored" };
  }
}

let cached: PaymentProvider | null = null;

export function paymentProvider(): PaymentProvider {
  if (cached) return cached;
  const config = env();
  if (config.PAYMENT_PROVIDER === "stripe" && config.STRIPE_SECRET_KEY) {
    cached = new StripePaymentProvider(
      config.STRIPE_SECRET_KEY,
      config.STRIPE_WEBHOOK_SECRET,
      config.STRIPE_PRICE_FAMILY_PREMIUM,
    );
  } else {
    if (config.PAYMENT_PROVIDER === "stripe") {
      logger.warn("payments.stripe_not_configured_falling_back_to_mock");
    }
    cached = new MockPaymentProvider();
  }
  return cached;
}

/** Test helper. */
export function resetPaymentProvider(): void {
  cached = null;
}

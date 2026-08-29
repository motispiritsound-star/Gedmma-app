import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { activatePremium, cancelPremium, paymentProvider } from "@/modules/subscriptions";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. With the mock provider this route is inert: `parseWebhook`
 * returns `ignored`, so the application still boots and runs with no Stripe
 * credentials at all.
 */
export async function POST(request: Request): Promise<Response> {
  const provider = paymentProvider();
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event;
  try {
    event = await provider.parseWebhook(rawBody, signature);
  } catch (error) {
    logger.warn("stripe.webhook_verification_failed", { error: String(error) });
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (!event) return NextResponse.json({ error: "not_configured" }, { status: 400 });

  if (event.type === "subscription.activated") {
    await activatePremium({
      familyId: event.familyId,
      provider: "STRIPE",
      providerCustomerId: event.subscription.providerCustomerId,
      providerSubscriptionId: event.subscription.providerSubscriptionId,
      currentPeriodEnd: event.subscription.currentPeriodEnd,
    });
  } else if (event.type === "subscription.cancelled") {
    await cancelPremium({ familyId: event.familyId });
  }

  return NextResponse.json({ received: true });
}

import "server-only";
import type { Subscription } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { entitlementsFor, type Entitlements } from "./entitlements";
import { MockPaymentProvider, paymentProvider } from "./payment-provider";

export async function getSubscription(familyId: string): Promise<Subscription> {
  const existing = await prisma.subscription.findUnique({ where: { familyId } });
  if (existing) return existing;
  return prisma.subscription.create({ data: { familyId, plan: "FREE", status: "ACTIVE", provider: "MOCK" } });
}

export async function getEntitlements(familyId: string): Promise<Entitlements> {
  const subscription = await getSubscription(familyId);
  const active = subscription.status === "ACTIVE" || subscription.status === "TRIALING";
  return entitlementsFor(active ? subscription.plan : "FREE");
}

export type UpgradeResult = { redirectUrl: string; simulated: boolean };

export async function startUpgrade(params: {
  familyId: string;
  userId: string;
  email: string;
  appUrl: string;
}): Promise<UpgradeResult> {
  const provider = paymentProvider();
  const session = await provider.createCheckoutSession({
    familyId: params.familyId,
    customerEmail: params.email,
    plan: "FAMILY_PREMIUM",
    successUrl: `${params.appUrl}/settings/subscription/confirm`,
    cancelUrl: `${params.appUrl}/settings/subscription`,
  });
  return { redirectUrl: session.url, simulated: session.simulated };
}

/**
 * Applies a successful payment. With the mock provider this is called straight
 * from the confirmation page; with Stripe it is driven by the webhook.
 */
export async function activatePremium(params: {
  familyId: string;
  actorUserId?: string | null;
  provider?: "MOCK" | "STRIPE";
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodEnd?: Date | null;
}): Promise<Subscription> {
  const fallback = MockPaymentProvider.activation(params.familyId);
  const subscription = await prisma.subscription.upsert({
    where: { familyId: params.familyId },
    create: {
      familyId: params.familyId,
      plan: "FAMILY_PREMIUM",
      status: "ACTIVE",
      provider: params.provider ?? "MOCK",
      providerCustomerId: params.providerCustomerId ?? null,
      providerSubscriptionId: params.providerSubscriptionId ?? null,
      currentPeriodEnd: params.currentPeriodEnd ?? fallback.currentPeriodEnd,
    },
    update: {
      plan: "FAMILY_PREMIUM",
      status: "ACTIVE",
      provider: params.provider ?? "MOCK",
      providerCustomerId: params.providerCustomerId ?? null,
      providerSubscriptionId: params.providerSubscriptionId ?? null,
      currentPeriodEnd: params.currentPeriodEnd ?? fallback.currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  await recordAudit({
    action: AUDIT_ACTIONS.subscriptionChanged,
    targetType: "subscription",
    targetId: subscription.id,
    actorUserId: params.actorUserId ?? null,
    familyId: params.familyId,
    metadata: { plan: "FAMILY_PREMIUM", provider: subscription.provider },
  });

  return subscription;
}

export async function cancelPremium(params: { familyId: string; actorUserId?: string | null }): Promise<Subscription> {
  const current = await getSubscription(params.familyId);
  if (current.providerSubscriptionId && current.provider === "STRIPE") {
    await paymentProvider().cancelSubscription(current.providerSubscriptionId);
  }

  const subscription = await prisma.subscription.update({
    where: { familyId: params.familyId },
    data: {
      plan: "FREE",
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      providerSubscriptionId: null,
    },
  });

  await recordAudit({
    action: AUDIT_ACTIONS.subscriptionChanged,
    targetType: "subscription",
    targetId: subscription.id,
    actorUserId: params.actorUserId ?? null,
    familyId: params.familyId,
    metadata: { plan: "FREE" },
  });

  return subscription;
}

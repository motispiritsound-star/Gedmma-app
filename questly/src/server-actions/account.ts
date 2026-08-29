"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { destroyAllSessionsFor, destroySession, requireFamily } from "@/modules/auth";
import { activatePremium, cancelPremium, startUpgrade } from "@/modules/subscriptions";
import { cancelAccountDeletion, requestAccountDeletion } from "@/modules/privacy";

export async function upgradeAction(): Promise<void> {
  const user = await requireFamily();
  let redirectUrl: string;
  try {
    const result = await startUpgrade({
      familyId: user.familyId,
      userId: user.id,
      email: user.email,
      appUrl: env().APP_URL,
    });
    redirectUrl = result.redirectUrl;
  } catch (error) {
    logger.error("subscription.upgrade_failed", { error: String(error) });
    redirect("/settings/subscription?error=1");
  }
  redirect(redirectUrl);
}

export async function cancelSubscriptionAction(): Promise<void> {
  const user = await requireFamily();
  await cancelPremium({ familyId: user.familyId, actorUserId: user.id });
  revalidatePath("/settings/subscription");
  redirect("/settings/subscription?downgraded=1");
}

/**
 * Confirms a simulated payment. Only reachable when no real provider is
 * configured; with Stripe the webhook is the source of truth.
 */
export async function confirmMockUpgradeAction(): Promise<void> {
  const user = await requireFamily();
  if (env().PAYMENT_PROVIDER === "stripe" && env().STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is configured; upgrades are confirmed by webhook.", "provider_mismatch", 409);
  }
  await activatePremium({ familyId: user.familyId, actorUserId: user.id, provider: "MOCK" });
  revalidatePath("/", "layout");
  redirect("/settings/subscription?upgraded=1");
}

export async function requestDeletionAction(formData: FormData): Promise<void> {
  const user = await requireFamily();
  const confirmation = String(formData.get("confirm") ?? "").trim().toUpperCase();
  if (confirmation !== "VERWIJDEREN" && confirmation !== "DELETE") {
    redirect("/settings/privacy?error=confirm");
  }

  await requestAccountDeletion({
    userId: user.id,
    familyId: user.familyId,
    reason: String(formData.get("reason") ?? "") || undefined,
  });

  // Signing every session out immediately makes the intent unambiguous; the
  // account can still be recovered by signing back in during the grace period.
  await destroyAllSessionsFor(user.id);
  await destroySession();
  redirect("/?deletion=scheduled");
}

export async function cancelDeletionAction(): Promise<void> {
  const user = await requireFamily();
  await cancelAccountDeletion(user.id);
  revalidatePath("/settings/privacy");
  redirect("/settings/privacy?cancelled=1");
}

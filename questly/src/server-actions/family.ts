"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, fail, ok, type ActionResult } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireFamily } from "@/modules/auth";
import { childProfileSchema, createChild, deleteChild, updateChild } from "@/modules/children";
import {
  completeOnboarding,
  familyPreferenceSchema,
  familySettingsSchema,
  updateFamilySettings,
  updatePreference,
} from "@/modules/families";

type State = ActionResult<undefined> | null;

function issuesToFields(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) (out[issue.path.join(".") || "form"] ??= []).push(issue.message);
  return out;
}

function readChildInput(formData: FormData) {
  return childProfileSchema.safeParse({
    nickname: formData.get("nickname"),
    ageBand: formData.get("ageBand"),
    avatarKey: formData.get("avatarKey") ?? "fox",
    interestSlugs: formData.getAll("interestSlugs").map(String),
  });
}

export async function createChildAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireFamily();
  const parsed = readChildInput(formData);
  if (!parsed.success) return fail("Check the fields below.", "invalid", issuesToFields(parsed.error));

  try {
    await createChild({ familyId: user.familyId, actorUserId: user.id, input: parsed.data });
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.code);
    logger.error("children.create_failed", { error: String(error) });
    return fail("Something went wrong. Please try again.", "internal");
  }

  revalidatePath("/children");
  revalidatePath("/home");
  const next = String(formData.get("redirectTo") ?? "");
  if (next.startsWith("/")) redirect(next);
  return ok();
}

export async function updateChildAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireFamily();
  const childId = String(formData.get("childId") ?? "");
  const parsed = readChildInput(formData);
  if (!parsed.success) return fail("Check the fields below.", "invalid", issuesToFields(parsed.error));

  try {
    await updateChild({ familyId: user.familyId, childId, actorUserId: user.id, input: parsed.data });
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.code);
    return fail("Something went wrong. Please try again.", "internal");
  }

  revalidatePath("/children");
  return ok();
}

export async function deleteChildAction(formData: FormData): Promise<void> {
  const user = await requireFamily();
  await deleteChild({ familyId: user.familyId, childId: String(formData.get("childId") ?? ""), actorUserId: user.id });
  revalidatePath("/children");
  redirect("/children");
}

export async function updateFamilySettingsAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireFamily();
  const parsed = familySettingsSchema.safeParse({
    name: formData.get("name"),
    locale: formData.get("locale"),
    environment: formData.get("environment"),
    requireParentApproval: formData.get("requireParentApproval") === "on",
  });
  if (!parsed.success) return fail("Check the fields below.", "invalid", issuesToFields(parsed.error));

  await updateFamilySettings({ familyId: user.familyId, actorUserId: user.id, input: parsed.data });
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return ok();
}

export async function updatePreferenceAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireFamily();
  const parsed = familyPreferenceSchema.safeParse({
    preferredDurationMinutes: formData.get("preferredDurationMinutes"),
    preferredDifficulty: formData.get("preferredDifficulty"),
    settingPreference: formData.get("settingPreference"),
    participationStyle: formData.get("participationStyle"),
    availableMaterialSlugs: formData.getAll("availableMaterialSlugs").map(String),
  });
  if (!parsed.success) return fail("Check the fields below.", "invalid", issuesToFields(parsed.error));

  await updatePreference({ familyId: user.familyId, input: parsed.data });
  revalidatePath("/home");
  revalidatePath("/settings");

  if (String(formData.get("finishOnboarding") ?? "") === "1") {
    await completeOnboarding(user.familyId);
    redirect("/home");
  }
  return ok();
}

export async function updateEnvironmentAction(formData: FormData): Promise<void> {
  const user = await requireFamily();
  const environment = z.enum(["CITY", "SUBURB", "RURAL"]).safeParse(formData.get("environment"));
  const name = z.string().trim().min(2).max(80).safeParse(formData.get("name"));
  if (!environment.success || !name.success) redirect("/onboarding?step=family&error=1");

  await updateFamilySettings({
    familyId: user.familyId,
    actorUserId: user.id,
    input: {
      name: name.data,
      locale: formData.get("locale") === "en" ? "en" : "nl",
      environment: environment.data,
      requireParentApproval: formData.get("requireParentApproval") === "on",
    },
  });
  redirect("/onboarding?step=child");
}

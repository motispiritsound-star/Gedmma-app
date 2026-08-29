"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AppError, fail, ok, type ActionResult } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { requireRole } from "@/modules/auth";
import {
  createQuest,
  duplicateQuest,
  getAdminQuest,
  questUpsertSchema,
  setQuestStatus,
  updateQuest,
  type QuestUpsertInput,
} from "@/modules/admin";

type State = ActionResult<undefined> | null;

const ADMIN_ROLES = ["CONTENT_ADMIN", "PLATFORM_ADMIN"] as const;

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) (out[issue.path.join(".") || "form"] ??= []).push(issue.message);
  return out;
}

function lines(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Reads the quest editor form. Repeated field names keep the rows aligned, and
 * booleans are selects rather than checkboxes so an unchecked row cannot shift
 * every following row by one.
 */
function readQuestForm(formData: FormData): ReturnType<typeof questUpsertSchema.safeParse> {
  const stepCount = formData.getAll("stepNlTitle").length;
  const steps = Array.from({ length: stepCount }, (_, index) => ({
    position: index + 1,
    durationMinutes: formData.getAll("stepDuration")[index]
      ? Number(formData.getAll("stepDuration")[index])
      : undefined,
    requiresParent: String(formData.getAll("stepRequiresParent")[index] ?? "no") === "yes",
    nl: {
      title: String(formData.getAll("stepNlTitle")[index] ?? ""),
      body: String(formData.getAll("stepNlBody")[index] ?? ""),
      tip: String(formData.getAll("stepNlTip")[index] ?? "") || undefined,
    },
    en: {
      title: String(formData.getAll("stepEnTitle")[index] ?? ""),
      body: String(formData.getAll("stepEnBody")[index] ?? ""),
      tip: String(formData.getAll("stepEnTip")[index] ?? "") || undefined,
    },
  }));

  const safetyCount = formData.getAll("safetyTextNl").length;
  const safetyInstructions = Array.from({ length: safetyCount }, (_, index) => ({
    severity: String(formData.getAll("safetySeverity")[index] ?? "INFO") as "INFO" | "WARNING" | "CRITICAL",
    textNl: String(formData.getAll("safetyTextNl")[index] ?? ""),
    textEn: String(formData.getAll("safetyTextEn")[index] ?? ""),
  })).filter((entry) => entry.textNl && entry.textEn);

  const reflectionCount = formData.getAll("reflectionTextNl").length;
  const reflectionQuestions = Array.from({ length: reflectionCount }, (_, index) => ({
    textNl: String(formData.getAll("reflectionTextNl")[index] ?? ""),
    textEn: String(formData.getAll("reflectionTextEn")[index] ?? ""),
  })).filter((entry) => entry.textNl && entry.textEn);

  return questUpsertSchema.safeParse({
    slug: formData.get("slug"),
    categorySlug: formData.get("categorySlug"),
    ageBands: formData.getAll("ageBands").map(String),
    seasons: formData.getAll("seasons").length > 0 ? formData.getAll("seasons").map(String) : undefined,
    durationMinutes: formData.get("durationMinutes"),
    difficulty: formData.get("difficulty"),
    setting: formData.get("setting"),
    weather: formData.get("weather") ?? "ANY",
    minParticipants: formData.get("minParticipants"),
    maxParticipants: formData.get("maxParticipants"),
    isPremium: formData.get("isPremium") === "on",
    requiresAdultSupervision: formData.get("requiresAdultSupervision") === "on",
    safetyLevel: formData.get("safetyLevel") ?? "INFO",
    imageKey: formData.get("imageKey") || "default",
    skillSlugs: formData.getAll("skillSlugs").map(String),
    materials: formData.getAll("materialSlugs").map((slug) => ({ slug: String(slug), optional: false })),
    nl: {
      title: formData.get("nlTitle"),
      summary: formData.get("nlSummary"),
      story: formData.get("nlStory"),
      educationalObjective: formData.get("nlObjective"),
      expectedResult: formData.get("nlResult"),
      preparation: lines(formData.get("nlPreparation")),
      audioScript: String(formData.get("nlAudio") ?? "") || undefined,
    },
    en: {
      title: formData.get("enTitle"),
      summary: formData.get("enSummary"),
      story: formData.get("enStory"),
      educationalObjective: formData.get("enObjective"),
      expectedResult: formData.get("enResult"),
      preparation: lines(formData.get("enPreparation")),
      audioScript: String(formData.get("enAudio") ?? "") || undefined,
    },
    steps,
    safetyInstructions,
    reflectionQuestions,
    changeNote: String(formData.get("changeNote") ?? "") || undefined,
  });
}

export async function createQuestAction(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireRole(...ADMIN_ROLES);
  const parsed = readQuestForm(formData);
  if (!parsed.success) return fail("Check the fields below.", "invalid", fieldErrors(parsed.error));

  let slug: string;
  try {
    const quest = await createQuest({ input: parsed.data as QuestUpsertInput, actorUserId: admin.id });
    slug = quest.slug;
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.code);
    logger.error("admin.create_quest_failed", { error: String(error) });
    return fail("Something went wrong. Please try again.", "internal");
  }

  revalidatePath("/admin/quests");
  redirect(`/admin/quests/${slug}?saved=1`);
}

export async function updateQuestAction(_prev: State, formData: FormData): Promise<State> {
  const admin = await requireRole(...ADMIN_ROLES);
  const questId = String(formData.get("questId") ?? "");
  const parsed = readQuestForm(formData);
  if (!parsed.success) return fail("Check the fields below.", "invalid", fieldErrors(parsed.error));

  try {
    await updateQuest({ questId, input: parsed.data as QuestUpsertInput, actorUserId: admin.id });
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.code);
    logger.error("admin.update_quest_failed", { error: String(error) });
    return fail("Something went wrong. Please try again.", "internal");
  }

  revalidatePath("/admin/quests");
  revalidatePath("/quests");
  return ok();
}

export async function setQuestStatusAction(formData: FormData): Promise<void> {
  const admin = await requireRole(...ADMIN_ROLES);
  const status = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(formData.get("status"));
  await setQuestStatus({ questId: String(formData.get("questId") ?? ""), status, actorUserId: admin.id });
  revalidatePath("/admin/quests");
  revalidatePath("/quests");
  const back = String(formData.get("returnTo") ?? "/admin/quests");
  redirect(back.startsWith("/") ? back : "/admin/quests");
}

export async function duplicateQuestAction(formData: FormData): Promise<void> {
  const admin = await requireRole(...ADMIN_ROLES);
  const source = await getAdminQuest(String(formData.get("slug") ?? ""));
  const copy = await duplicateQuest({ questId: source.id, actorUserId: admin.id });
  revalidatePath("/admin/quests");
  redirect(`/admin/quests/${copy.slug}`);
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, fail, ok, type ActionResult } from "@/lib/errors";
import { requireFamily } from "@/modules/auth";
import {
  approvalSchema,
  completionSchema,
  decideCompletion,
  planQuest,
  plannedQuestSchema,
  startQuest,
  submitCompletion,
  toggleFavourite,
  unplanQuest,
} from "@/modules/progress";
import { storeEvidence } from "@/modules/media";
import { env } from "@/lib/env";
import { rateLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type State = ActionResult<undefined> | null;

export async function startQuestAction(formData: FormData): Promise<void> {
  const user = await requireFamily();
  const completion = await startQuest({
    familyId: user.familyId,
    userId: user.id,
    questSlug: String(formData.get("questSlug") ?? ""),
  });
  redirect(`/adventure/${completion.id}`);
}

export async function toggleFavouriteAction(formData: FormData): Promise<void> {
  const user = await requireFamily();
  await toggleFavourite({ familyId: user.familyId, questSlug: String(formData.get("questSlug") ?? "") });
  revalidatePath("/quests");
  revalidatePath("/dashboard");
  const back = String(formData.get("returnTo") ?? "");
  if (back.startsWith("/")) redirect(back);
}

export async function planQuestAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireFamily();
  const parsed = plannedQuestSchema.safeParse({
    questSlug: formData.get("questSlug"),
    scheduledFor: formData.get("scheduledFor"),
    timeOfDay: formData.get("timeOfDay") || undefined,
    note: formData.get("note") || undefined,
    childProfileIds: formData.getAll("childProfileIds").map(String),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the fields below.", "invalid");

  try {
    await planQuest({ familyId: user.familyId, userId: user.id, input: parsed.data });
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.code);
    logger.error("planner.plan_failed", { error: String(error) });
    return fail("Something went wrong. Please try again.", "internal");
  }

  revalidatePath("/planner");
  revalidatePath("/home");
  return ok();
}

export async function unplanQuestAction(formData: FormData): Promise<void> {
  const user = await requireFamily();
  await unplanQuest({ familyId: user.familyId, plannedQuestId: String(formData.get("plannedQuestId") ?? "") });
  revalidatePath("/planner");
  revalidatePath("/home");
}

export async function submitCompletionAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireFamily();

  const reflectionPrompts = formData.getAll("reflectionPrompt").map(String);
  const reflectionAnswers = formData.getAll("reflectionAnswer").map(String);
  const reflectionQuestionIds = formData.getAll("reflectionQuestionId").map(String);

  const parsed = completionSchema.safeParse({
    completionId: formData.get("completionId"),
    minutesSpent: formData.get("minutesSpent"),
    childProfileIds: formData.getAll("childProfileIds").map(String),
    familyNote: formData.get("familyNote") ?? "",
    reflections: reflectionPrompts.map((prompt, index) => ({
      questionId: reflectionQuestionIds[index] || undefined,
      prompt,
      answer: reflectionAnswers[index] ?? "",
    })),
  });

  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Check the fields below.", "invalid");

  let result;
  try {
    result = await submitCompletion({ familyId: user.familyId, userId: user.id, input: parsed.data });
  } catch (error) {
    if (error instanceof AppError) return fail(error.message, error.code);
    logger.error("completion.submit_failed", { error: String(error) });
    return fail("Something went wrong. Please try again.", "internal");
  }

  const evidence = formData.get("evidence");
  if (evidence instanceof File && evidence.size > 0) {
    const config = env();
    const limit = rateLimiter.consume(
      `upload:${user.familyId}`,
      config.RATE_LIMIT_UPLOAD_MAX,
      config.RATE_LIMIT_UPLOAD_WINDOW_SECONDS,
    );
    if (!limit.allowed) {
      return fail(`Too many uploads. Try again in ${limit.retryAfterSeconds} seconds.`, "rate_limited");
    }
    try {
      await storeEvidence({
        familyId: user.familyId,
        completionId: result.completion.id,
        userId: user.id,
        bytes: Buffer.from(await evidence.arrayBuffer()),
      });
    } catch (error) {
      if (error instanceof AppError) return fail(error.message, error.code);
      logger.error("evidence.upload_failed", { error: String(error) });
      return fail("The photo could not be saved. The adventure itself was saved.", "upload_failed");
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/home");
  redirect(`/complete/${result.completion.id}?done=1`);
}

export async function decideCompletionAction(formData: FormData): Promise<void> {
  const user = await requireFamily();
  const parsed = approvalSchema.safeParse({
    completionId: formData.get("completionId"),
    decision: formData.get("decision"),
    reason: formData.get("reason") || undefined,
  });
  if (!parsed.success) redirect("/dashboard");

  await decideCompletion({ familyId: user.familyId, userId: user.id, input: parsed.data });
  revalidatePath("/dashboard");
  redirect(`/complete/${parsed.data.completionId}`);
}

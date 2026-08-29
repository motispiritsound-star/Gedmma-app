import "server-only";
import { Prisma, type QuestCompletion } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { getEntitlements } from "@/modules/subscriptions";
import { accessibleQuestSlugs } from "@/modules/quests/service";
import { evaluateBadges, type BadgeAward } from "./badges";
import type { ApprovalInput, CompletionInput, PlannedQuestInput } from "./schemas";

/** Starts (or resumes) an adventure. One in-progress run per quest per family. */
export async function startQuest(params: {
  familyId: string;
  userId: string;
  questSlug: string;
}): Promise<QuestCompletion> {
  const quest = await prisma.quest.findFirst({
    where: { slug: params.questSlug, status: "PUBLISHED" },
    select: { id: true, slug: true, isPremium: true },
  });
  if (!quest) throw new NotFoundError("Quest not found.");

  const entitlements = await getEntitlements(params.familyId);
  const accessible = await accessibleQuestSlugs(entitlements);
  if (accessible !== null && !accessible.has(quest.slug)) {
    throw new AppError("This quest is part of Family Premium.", "premium_required", 402);
  }

  const existing = await prisma.questCompletion.findFirst({
    where: { familyId: params.familyId, questId: quest.id, status: "IN_PROGRESS" },
  });
  if (existing) return existing;

  const completion = await prisma.questCompletion.create({
    data: { familyId: params.familyId, questId: quest.id, status: "IN_PROGRESS" },
  });

  await recordAudit({
    action: AUDIT_ACTIONS.completionStarted,
    targetType: "quest_completion",
    targetId: completion.id,
    actorUserId: params.userId,
    familyId: params.familyId,
    metadata: { questSlug: quest.slug },
  });

  return completion;
}

export async function getCompletion(familyId: string, completionId: string) {
  const completion = await prisma.questCompletion.findFirst({
    where: { id: completionId, familyId },
    include: {
      quest: { include: { category: true, translations: true, reflectionQuestions: { orderBy: { position: "asc" } } } },
      participants: { include: { childProfile: true } },
      reflections: true,
      evidence: { where: { deletedAt: null }, orderBy: { createdAt: "asc" } },
      awardedBadges: { include: { badge: true } },
    },
  });
  if (!completion) throw new NotFoundError("Adventure not found.");
  return completion;
}

export type SubmitResult = { completion: QuestCompletion; awaitingApproval: boolean; badges: BadgeAward[] };

/**
 * Records the family's answers and either approves immediately or parks the run
 * for a parent's decision, depending on the family's own setting.
 */
export async function submitCompletion(params: {
  familyId: string;
  userId: string;
  input: CompletionInput;
}): Promise<SubmitResult> {
  const [completion, family] = await Promise.all([
    prisma.questCompletion.findFirst({ where: { id: params.input.completionId, familyId: params.familyId } }),
    prisma.family.findUniqueOrThrow({ where: { id: params.familyId }, select: { requireParentApproval: true } }),
  ]);
  if (!completion) throw new NotFoundError("Adventure not found.");
  if (completion.status === "APPROVED") throw new AppError("This adventure is already approved.", "already_approved");

  const children = await prisma.childProfile.findMany({
    where: { id: { in: params.input.childProfileIds }, familyId: params.familyId, deletedAt: null },
    select: { id: true },
  });
  if (children.length !== params.input.childProfileIds.length) {
    throw new ForbiddenError("One of the selected child profiles does not belong to your family.");
  }

  const awaitingApproval = family.requireParentApproval;
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.questParticipation.deleteMany({ where: { questCompletionId: completion.id } });
    await tx.completionReflection.deleteMany({ where: { questCompletionId: completion.id } });

    return tx.questCompletion.update({
      where: { id: completion.id },
      data: {
        status: awaitingApproval ? "AWAITING_APPROVAL" : "APPROVED",
        finishedAt: now,
        approvedAt: awaitingApproval ? null : now,
        approvedByUserId: awaitingApproval ? null : params.userId,
        rejectionReason: null,
        minutesSpent: params.input.minutesSpent,
        familyNote: params.input.familyNote || null,
        participants: { create: children.map((child) => ({ childProfileId: child.id })) },
        reflections: {
          create: params.input.reflections
            .filter((r) => r.answer.trim().length > 0)
            .map((r) => ({
              reflectionQuestionId: r.questionId ?? null,
              prompt: r.prompt,
              answer: r.answer,
            })),
        },
      },
    });
  });

  await recordAudit({
    action: AUDIT_ACTIONS.completionSubmitted,
    targetType: "quest_completion",
    targetId: updated.id,
    actorUserId: params.userId,
    familyId: params.familyId,
    metadata: { awaitingApproval, minutesSpent: params.input.minutesSpent },
  });

  const badges = awaitingApproval ? [] : await evaluateBadges({ familyId: params.familyId, completionId: updated.id });
  await markPlannedComplete(params.familyId, updated.questId);

  return { completion: updated, awaitingApproval, badges };
}

export async function decideCompletion(params: {
  familyId: string;
  userId: string;
  input: ApprovalInput;
}): Promise<{ completion: QuestCompletion; badges: BadgeAward[] }> {
  const completion = await prisma.questCompletion.findFirst({
    where: { id: params.input.completionId, familyId: params.familyId },
  });
  if (!completion) throw new NotFoundError("Adventure not found.");
  if (completion.status !== "AWAITING_APPROVAL") {
    throw new AppError("This adventure is not waiting for approval.", "not_awaiting_approval");
  }

  const approve = params.input.decision === "approve";
  const updated = await prisma.questCompletion.update({
    where: { id: completion.id },
    data: approve
      ? { status: "APPROVED", approvedAt: new Date(), approvedByUserId: params.userId, rejectionReason: null }
      : { status: "REJECTED", approvedAt: null, rejectionReason: params.input.reason ?? null },
  });

  await recordAudit({
    action: approve ? AUDIT_ACTIONS.completionApproved : AUDIT_ACTIONS.completionRejected,
    targetType: "quest_completion",
    targetId: updated.id,
    actorUserId: params.userId,
    familyId: params.familyId,
  });

  const badges = approve ? await evaluateBadges({ familyId: params.familyId, completionId: updated.id }) : [];
  return { completion: updated, badges };
}

// ---------------------------------------------------------------- favourites

export async function toggleFavourite(params: {
  familyId: string;
  questSlug: string;
}): Promise<{ favourited: boolean }> {
  const quest = await prisma.quest.findFirst({ where: { slug: params.questSlug }, select: { id: true } });
  if (!quest) throw new NotFoundError("Quest not found.");

  const existing = await prisma.favouriteQuest.findUnique({
    where: { familyId_questId: { familyId: params.familyId, questId: quest.id } },
  });

  if (existing) {
    await prisma.favouriteQuest.delete({ where: { id: existing.id } });
    return { favourited: false };
  }
  await prisma.favouriteQuest.create({ data: { familyId: params.familyId, questId: quest.id } });
  return { favourited: true };
}

export async function listFavouriteSlugs(familyId: string): Promise<string[]> {
  const rows = await prisma.favouriteQuest.findMany({ where: { familyId }, include: { quest: { select: { slug: true } } } });
  return rows.map((row) => row.quest.slug);
}

// ---------------------------------------------------------------- planner

export async function planQuest(params: {
  familyId: string;
  userId: string;
  input: PlannedQuestInput;
}): Promise<void> {
  const entitlements = await getEntitlements(params.familyId);
  if (!entitlements.weeklyPlanner) {
    throw new AppError("Weekly planning is part of Family Premium.", "premium_required", 402);
  }

  const quest = await prisma.quest.findFirst({
    where: { slug: params.input.questSlug, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!quest) throw new NotFoundError("Quest not found.");

  const children = await prisma.childProfile.findMany({
    where: { id: { in: params.input.childProfileIds }, familyId: params.familyId, deletedAt: null },
    select: { id: true },
  });

  try {
    await prisma.plannedQuest.create({
      data: {
        familyId: params.familyId,
        questId: quest.id,
        scheduledFor: new Date(`${params.input.scheduledFor}T00:00:00.000Z`),
        timeOfDay: params.input.timeOfDay ?? null,
        note: params.input.note ?? null,
        createdByUserId: params.userId,
        children: { create: children.map((child) => ({ childProfileId: child.id })) },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("That quest is already planned for this day.", "already_planned", 409);
    }
    throw error;
  }
}

export async function unplanQuest(params: { familyId: string; plannedQuestId: string }): Promise<void> {
  const result = await prisma.plannedQuest.deleteMany({
    where: { id: params.plannedQuestId, familyId: params.familyId },
  });
  if (result.count === 0) throw new NotFoundError("Planned quest not found.");
}

export async function listPlanned(params: { familyId: string; from: Date; to: Date }) {
  return prisma.plannedQuest.findMany({
    where: { familyId: params.familyId, scheduledFor: { gte: params.from, lte: params.to } },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    include: {
      quest: { include: { category: true, translations: true } },
      children: { include: { childProfile: { select: { id: true, nickname: true, avatarKey: true } } } },
    },
  });
}

async function markPlannedComplete(familyId: string, questId: string): Promise<void> {
  await prisma.plannedQuest.updateMany({
    where: { familyId, questId, completedAt: null },
    data: { completedAt: new Date() },
  });
}

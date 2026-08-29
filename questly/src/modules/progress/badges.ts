import { Prisma, type Badge } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export type BadgeAward = { badge: Badge; childProfileId: string | null };

/**
 * Evaluates every badge against the family's approved history and awards the
 * ones that now qualify.
 *
 * "Awarded only once" is enforced by the unique index on
 * (familyId, badgeId, scopeKey) - a duplicate insert is caught and ignored
 * rather than relying on the read that preceded it still being true.
 */
export async function evaluateBadges(params: {
  familyId: string;
  completionId?: string;
}): Promise<BadgeAward[]> {
  const [badges, completions, children] = await Promise.all([
    prisma.badge.findMany(),
    prisma.questCompletion.findMany({
      where: { familyId: params.familyId, status: "APPROVED" },
      include: {
        quest: { select: { categoryId: true, skills: { select: { skillId: true } } } },
        participants: { select: { childProfileId: true } },
        reflections: { select: { id: true } },
      },
    }),
    prisma.childProfile.findMany({ where: { familyId: params.familyId, deletedAt: null }, select: { id: true } }),
  ]);

  const awards: BadgeAward[] = [];

  for (const badge of badges) {
    const scopes: (string | null)[] = badge.scope === "CHILD" ? children.map((c) => c.id) : [null];

    for (const childProfileId of scopes) {
      const relevant = completions.filter((completion) =>
        childProfileId === null ? true : completion.participants.some((p) => p.childProfileId === childProfileId),
      );

      if (!qualifies(badge, relevant)) continue;

      const created = await tryAward({
        badgeId: badge.id,
        familyId: params.familyId,
        childProfileId,
        completionId: params.completionId,
      });
      if (created) awards.push({ badge, childProfileId });
    }
  }

  return awards;
}

type RelevantCompletion = {
  quest: { categoryId: string; skills: { skillId: string }[] };
  reflections: { id: string }[];
};

function qualifies(badge: Badge, completions: RelevantCompletion[]): boolean {
  switch (badge.criteria) {
    case "QUESTS_COMPLETED":
      return completions.length >= badge.threshold;
    case "CATEGORY_COMPLETED":
      if (!badge.categoryId) return false;
      return completions.filter((c) => c.quest.categoryId === badge.categoryId).length >= badge.threshold;
    case "SKILL_PRACTISED":
      if (!badge.skillId) return false;
      return (
        completions.filter((c) => c.quest.skills.some((s) => s.skillId === badge.skillId)).length >= badge.threshold
      );
    case "CATEGORIES_EXPLORED":
      return new Set(completions.map((c) => c.quest.categoryId)).size >= badge.threshold;
    case "REFLECTIONS_WRITTEN":
      return completions.reduce((total, c) => total + c.reflections.length, 0) >= badge.threshold;
    default:
      return false;
  }
}

async function tryAward(params: {
  badgeId: string;
  familyId: string;
  childProfileId: string | null;
  completionId?: string;
}): Promise<boolean> {
  try {
    await prisma.awardedBadge.create({
      data: {
        badgeId: params.badgeId,
        familyId: params.familyId,
        childProfileId: params.childProfileId,
        scopeKey: params.childProfileId ?? "FAMILY",
        questCompletionId: params.completionId ?? null,
      },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
    logger.error("badges.award_failed", { badgeId: params.badgeId, error: String(error) });
    return false;
  }
}

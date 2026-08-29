import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { AwardedBadge, Badge, Prisma } from '@/generated/prisma/client'

/**
 * Badge awarding.
 *
 * Badges reward real-world action: adventures actually completed, categories
 * actually explored, skills actually practised. Nothing here rewards opening
 * the app, returning daily, or time spent on a screen.
 *
 * Awarding is idempotent. A unique index on (badgeId, familyId) - partial, for
 * family-level badges - plus a per-child unique index means a repeated
 * evaluation can never hand out the same badge twice.
 */

export type BadgeAwardResult = {
  badge: Badge
  awarded: AwardedBadge
}

type FamilyProgressSnapshot = {
  approvedCompletions: number
  completionsByCategoryId: Map<string, number>
  skillPoints: Map<string, number>
  distinctCategories: number
}

async function snapshot(familyId: string): Promise<FamilyProgressSnapshot> {
  const completions = await prisma.questCompletion.findMany({
    where: { familyId, status: 'APPROVED' },
    include: { quest: { include: { skills: true } } },
  })

  const completionsByCategoryId = new Map<string, number>()
  const skillPoints = new Map<string, number>()

  for (const completion of completions) {
    const categoryId = completion.quest.categoryId
    completionsByCategoryId.set(categoryId, (completionsByCategoryId.get(categoryId) ?? 0) + 1)
    for (const link of completion.quest.skills) {
      skillPoints.set(link.skillId, (skillPoints.get(link.skillId) ?? 0) + link.weight)
    }
  }

  return {
    approvedCompletions: completions.length,
    completionsByCategoryId,
    skillPoints,
    distinctCategories: completionsByCategoryId.size,
  }
}

function meetsCriteria(badge: Badge, progress: FamilyProgressSnapshot): boolean {
  switch (badge.criteria) {
    case 'COMPLETIONS_TOTAL':
    case 'FAMILY_MILESTONE':
      return progress.approvedCompletions >= badge.threshold
    case 'COMPLETIONS_IN_CATEGORY':
      if (!badge.categoryId) return false
      return (progress.completionsByCategoryId.get(badge.categoryId) ?? 0) >= badge.threshold
    case 'SKILL_POINTS':
      if (!badge.skillId) return false
      return (progress.skillPoints.get(badge.skillId) ?? 0) >= badge.threshold
    case 'DISTINCT_CATEGORIES':
      return progress.distinctCategories >= badge.threshold
    default:
      return false
  }
}

/**
 * Evaluates every badge for a family and awards the ones newly earned.
 * Returns only the badges awarded by *this* call, so the completion screen can
 * celebrate exactly what just happened.
 */
export async function evaluateBadgesForFamily(params: {
  familyId: string
  completionId?: string | null
}): Promise<BadgeAwardResult[]> {
  const [badges, existing, progress] = await Promise.all([
    prisma.badge.findMany(),
    prisma.awardedBadge.findMany({
      where: { familyId: params.familyId, childProfileId: null },
      select: { badgeId: true },
    }),
    snapshot(params.familyId),
  ])

  const alreadyAwarded = new Set(existing.map((row) => row.badgeId))
  const results: BadgeAwardResult[] = []

  for (const badge of badges) {
    if (alreadyAwarded.has(badge.id)) continue
    if (!meetsCriteria(badge, progress)) continue

    try {
      const awarded = await prisma.awardedBadge.create({
        data: {
          badgeId: badge.id,
          familyId: params.familyId,
          childProfileId: null,
          completionId: params.completionId ?? null,
        },
      })
      results.push({ badge, awarded })
    } catch (error) {
      // A concurrent evaluation won the race; the badge is already awarded.
      if (isUniqueViolation(error)) continue
      throw error
    }
  }

  if (results.length > 0) {
    logger.info('badges.awarded', {
      familyId: params.familyId,
      badges: results.map((result) => result.badge.slug),
    })
  }

  return results
}

function isUniqueViolation(error: unknown): boolean {
  const candidate = error as Partial<Prisma.PrismaClientKnownRequestError> & { code?: string }
  return candidate?.code === 'P2002' || candidate?.code === '23505'
}

export async function listAwardedBadges(familyId: string) {
  return prisma.awardedBadge.findMany({
    where: { familyId },
    include: { badge: true, childProfile: true },
    orderBy: { awardedAt: 'desc' },
  })
}

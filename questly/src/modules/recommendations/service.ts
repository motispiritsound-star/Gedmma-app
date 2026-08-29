import { prisma } from '@/lib/db'
import type { Locale } from '@/modules/localisation'
import { accessibleQuestIds, questInclude, toCardView } from '@/modules/quests/queries'
import type { QuestCardView } from '@/modules/quests/types'
import type { PlanEntitlements } from '@/modules/subscriptions/plans'
import { getAiProvider } from './ai'
import {
  recommendQuests,
  seasonForDate,
  type RecommendationContext,
  type RecommendationQuest,
} from './engine'
import { topReasons, type LabelMaps } from './reasons'
import type { WeatherSuitability } from '@/generated/prisma/client'

export type Recommendation = {
  quest: QuestCardView
  score: number
  reasons: string[]
}

const RECENT_COMPLETIONS = 5

/**
 * Gathers everything the pure engine needs and returns localised, ranked
 * recommendations. Weather is an input rather than a fetch: the MVP has no
 * weather integration, so the caller supplies "what is it like outside?" and
 * the default is `ANY`. See FUTURE_MODULES.md.
 */
export async function recommendForFamily(params: {
  familyId: string
  locale: Locale
  entitlements: PlanEntitlements
  weather?: WeatherSuitability
  now?: Date
  limit?: number
}): Promise<Recommendation[]> {
  const now = params.now ?? new Date()

  const [family, quests, completions, favourites, allowed] = await Promise.all([
    prisma.family.findUnique({
      where: { id: params.familyId },
      include: {
        children: {
          where: { deletedAt: null },
          include: { interests: { include: { interest: { include: { category: true } } } } },
        },
      },
    }),
    prisma.quest.findMany({ where: { status: 'PUBLISHED' }, include: questInclude }),
    prisma.questCompletion.findMany({
      where: { familyId: params.familyId, status: { in: ['PENDING_APPROVAL', 'APPROVED'] } },
      orderBy: { startedAt: 'desc' },
      include: { quest: { include: { category: true, skills: { include: { skill: true } } } } },
    }),
    prisma.favouriteQuest.findMany({ where: { familyId: params.familyId }, select: { questId: true } }),
    accessibleQuestIds(params.entitlements),
  ])

  if (!family) return []

  const interestCategorySlugs = new Set<string>()
  const interestSkillSlugs = new Set<string>()
  for (const child of family.children) {
    for (const link of child.interests) {
      if (link.interest.category) interestCategorySlugs.add(link.interest.category.slug)
      interestSkillSlugs.add(link.interest.slug)
    }
  }

  const recentCategorySlugs = completions
    .slice(0, RECENT_COMPLETIONS)
    .map((completion) => completion.quest.category.slug)
  const recentSkillSlugs = completions
    .slice(0, RECENT_COMPLETIONS)
    .flatMap((completion) => completion.quest.skills.map((entry) => entry.skill.slug))

  const context: RecommendationContext = {
    childAgeBands: [...new Set(family.children.map((child) => child.ageBand))],
    interestCategorySlugs: [...interestCategorySlugs],
    interestSkillSlugs: [...interestSkillSlugs],
    completedQuestIds: completions.map((completion) => completion.questId),
    recentCategorySlugs,
    recentSkillSlugs,
    favouriteQuestIds: favourites.map((favourite) => favourite.questId),
    preferredDurationMinutes: family.preferredDuration,
    preferredDifficulty: family.preferredDifficulty,
    preferredSetting: family.preferredSetting,
    prefersFamilyActivity: family.prefersFamilyActivity,
    familySize: family.adultCount + family.children.length,
    weather: params.weather ?? 'ANY',
    season: seasonForDate(now),
    onlyCommonMaterials: false,
  }

  // Free families only get suggestions they can actually open.
  const candidates = quests.filter((quest) => allowed === null || allowed.has(quest.id))

  const engineInput: RecommendationQuest[] = candidates.map((quest) => ({
    id: quest.id,
    slug: quest.slug,
    ageBands: quest.ageBands,
    categorySlug: quest.category.slug,
    skillSlugs: quest.skills.map((entry) => entry.skill.slug),
    durationMinutes: quest.durationMinutes,
    difficulty: quest.difficulty,
    setting: quest.setting,
    weather: quest.weather,
    seasons: quest.seasons,
    minParticipants: quest.minParticipants,
    maxParticipants: quest.maxParticipants,
    isPremium: quest.isPremium,
    needsSpecialMaterials: quest.materials.some(
      (entry) => !entry.optional && !entry.material.isCommon,
    ),
  }))

  const ranked = recommendQuests(engineInput, context, params.limit ?? 6)
  const reranked = await getAiProvider().rerank(ranked, 'family-home-feed')

  const labels = await labelMaps(params.locale)
  const questById = new Map(candidates.map((quest) => [quest.id, quest]))

  return reranked.flatMap((scored) => {
    const quest = questById.get(scored.quest.id)
    if (!quest) return []
    return [
      {
        quest: toCardView(quest, params.locale, { locked: false }),
        score: scored.score,
        reasons: topReasons(scored.reasons, params.locale, labels),
      },
    ]
  })
}

async function labelMaps(locale: Locale): Promise<LabelMaps> {
  const [categories, skills, interests] = await Promise.all([
    prisma.category.findMany(),
    prisma.skill.findMany(),
    prisma.interest.findMany(),
  ])
  const pick = (row: { nameEn: string; nameNl: string }) => (locale === 'nl' ? row.nameNl : row.nameEn)
  return {
    categories: Object.fromEntries(categories.map((row) => [row.slug, pick(row).toLowerCase()])),
    skills: Object.fromEntries(
      [...skills, ...interests].map((row) => [row.slug, pick(row).toLowerCase()]),
    ),
  }
}

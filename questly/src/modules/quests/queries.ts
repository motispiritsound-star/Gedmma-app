import { prisma } from '@/lib/db'
import { notFound } from '@/lib/errors'
import { rotatingFreeSelection, type PlanEntitlements } from '@/modules/subscriptions/plans'
import type { Locale, Prisma } from '@/generated/prisma/client'
import type { QuestCardView, QuestDetailView, QuestFilters, QuestStepView } from './types'

export const questInclude = {
  category: true,
  translations: true,
  skills: { include: { skill: true } },
  materials: { include: { material: true } },
  safety: { orderBy: { position: 'asc' } },
  steps: { orderBy: { position: 'asc' }, include: { translations: true } },
} satisfies Prisma.QuestInclude

export type QuestWithRelations = Prisma.QuestGetPayload<{ include: typeof questInclude }>

function pickTranslation<T extends { locale: Locale }>(items: T[], locale: Locale): T | undefined {
  return items.find((item) => item.locale === locale) ?? items[0]
}

function localisedName(row: { nameEn: string; nameNl: string }, locale: Locale): string {
  return locale === 'nl' ? row.nameNl : row.nameEn
}

export function toCardView(
  quest: QuestWithRelations,
  locale: Locale,
  options: { locked?: boolean } = {},
): QuestCardView {
  const translation = pickTranslation(quest.translations, locale)
  return {
    id: quest.id,
    slug: quest.slug,
    title: translation?.title ?? quest.slug,
    shortDescription: translation?.shortDescription ?? '',
    imageKey: quest.imageKey,
    category: {
      slug: quest.category.slug,
      name: localisedName(quest.category, locale),
      colorToken: quest.category.colorToken,
      icon: quest.category.icon,
    },
    ageBands: quest.ageBands,
    durationMinutes: quest.durationMinutes,
    difficulty: quest.difficulty,
    setting: quest.setting,
    minParticipants: quest.minParticipants,
    maxParticipants: quest.maxParticipants,
    requiresAdult: quest.requiresAdult,
    isPremium: quest.isPremium,
    skills: quest.skills.map((entry) => ({
      slug: entry.skill.slug,
      name: localisedName(entry.skill, locale),
    })),
    materials: quest.materials.map((entry) => ({
      slug: entry.material.slug,
      name: localisedName(entry.material, locale),
      optional: entry.optional,
    })),
    hasSafetyWarnings: quest.safety.some((item) => item.severity !== 'INFO'),
    locked: options.locked ?? false,
  }
}

export function toDetailView(
  quest: QuestWithRelations,
  locale: Locale,
  options: { locked?: boolean } = {},
): QuestDetailView {
  const translation = pickTranslation(quest.translations, locale)
  const steps: QuestStepView[] = quest.steps.map((step) => {
    const stepTranslation = pickTranslation(step.translations, locale)
    return {
      id: step.id,
      position: step.position,
      estimatedMinutes: step.estimatedMinutes,
      requiresAdult: step.requiresAdult,
      title: stepTranslation?.title ?? '',
      instruction: stepTranslation?.instruction ?? '',
      audioScript: stepTranslation?.audioScript ?? null,
    }
  })

  return {
    ...toCardView(quest, locale, options),
    status: quest.status,
    story: translation?.story ?? '',
    educationalObjective: translation?.educationalObjective ?? '',
    expectedResult: translation?.expectedResult ?? '',
    preparation: translation?.preparation ?? [],
    reflectionQuestions: translation?.reflectionQuestions ?? [],
    weather: quest.weather,
    seasons: quest.seasons,
    steps,
    safety: quest.safety.map((item) => ({
      id: item.id,
      position: item.position,
      severity: item.severity,
      text: locale === 'nl' ? item.textNl : item.textEn,
    })),
    materialsDetailed: quest.materials.map((entry) => ({
      slug: entry.material.slug,
      name: localisedName(entry.material, locale),
      quantity: entry.quantity,
      optional: entry.optional,
    })),
    locale,
  }
}

export function buildQuestWhere(filters: QuestFilters): Prisma.QuestWhereInput {
  const where: Prisma.QuestWhereInput = { status: 'PUBLISHED' }
  const and: Prisma.QuestWhereInput[] = []

  if (filters.ageBands?.length) and.push({ ageBands: { hasSome: filters.ageBands } })
  if (filters.categorySlugs?.length) and.push({ category: { slug: { in: filters.categorySlugs } } })
  if (filters.skillSlugs?.length) {
    and.push({ skills: { some: { skill: { slug: { in: filters.skillSlugs } } } } })
  }
  if (filters.maxDurationMinutes) and.push({ durationMinutes: { lte: filters.maxDurationMinutes } })
  if (filters.setting && filters.setting !== 'ANY') {
    and.push({ setting: { in: [filters.setting, 'BOTH'] } })
  }
  if (filters.difficulty?.length) and.push({ difficulty: { in: filters.difficulty } })
  if (filters.weather) and.push({ weather: { hasSome: [filters.weather, 'ANY'] } })
  if (filters.participants) {
    and.push({
      minParticipants: { lte: filters.participants },
      maxParticipants: { gte: filters.participants },
    })
  }
  if (filters.onlyCommonMaterials) {
    and.push({ materials: { none: { material: { isCommon: false }, optional: false } } })
  }
  if (filters.access === 'free') and.push({ isPremium: false })
  if (filters.search) {
    and.push({
      translations: {
        some: {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { shortDescription: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
    })
  }

  if (and.length) where.AND = and
  return where
}

/**
 * The set of quest ids a family may actually open. Premium families get the
 * whole library; free families get a deterministic weekly rotation of the free
 * quests. Locked quests are still listed (so the value of Premium is visible)
 * but their detail pages refuse to serve the steps.
 */
export async function accessibleQuestIds(entitlements: PlanEntitlements): Promise<Set<string> | null> {
  if (entitlements.questAccess === 'full-library') return null
  const freeQuests = await prisma.quest.findMany({
    where: { status: 'PUBLISHED', isPremium: false },
    select: { id: true, slug: true },
    orderBy: { slug: 'asc' },
  })
  // The rotation is keyed on slugs rather than generated ids, so re-seeding or
  // deploying to another environment does not silently reshuffle which quests
  // are free this week.
  const selectedSlugs = new Set(
    rotatingFreeSelection(
      freeQuests.map((quest) => quest.slug),
      entitlements.freeQuestRotationSize,
    ),
  )
  return new Set(
    freeQuests.filter((quest) => selectedSlugs.has(quest.slug)).map((quest) => quest.id),
  )
}

export type ListQuestsResult = {
  items: QuestCardView[]
  total: number
}

export async function listQuests(params: {
  filters: QuestFilters
  locale: Locale
  entitlements: PlanEntitlements
  take?: number
  skip?: number
}): Promise<ListQuestsResult> {
  const where = buildQuestWhere(params.filters)
  const [quests, total, allowed] = await Promise.all([
    prisma.quest.findMany({
      where,
      include: questInclude,
      orderBy: [{ difficulty: 'asc' }, { durationMinutes: 'asc' }, { slug: 'asc' }],
      take: params.take ?? 24,
      skip: params.skip ?? 0,
    }),
    prisma.quest.count({ where }),
    accessibleQuestIds(params.entitlements),
  ])

  return {
    items: quests.map((quest) =>
      toCardView(quest, params.locale, { locked: allowed !== null && !allowed.has(quest.id) }),
    ),
    total,
  }
}

export async function getQuestDetail(params: {
  slug: string
  locale: Locale
  entitlements: PlanEntitlements
  includeUnpublished?: boolean
}): Promise<QuestDetailView> {
  const quest = await prisma.quest.findUnique({ where: { slug: params.slug }, include: questInclude })
  if (!quest) throw notFound('That adventure does not exist.')
  if (quest.status !== 'PUBLISHED' && !params.includeUnpublished) {
    throw notFound('That adventure is not available.')
  }
  const allowed = await accessibleQuestIds(params.entitlements)
  const locked = allowed !== null && !allowed.has(quest.id)
  return toDetailView(quest, params.locale, { locked })
}

export async function getQuestById(id: string): Promise<QuestWithRelations | null> {
  return prisma.quest.findUnique({ where: { id }, include: questInclude })
}

export async function listCategories(locale: Locale) {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: localisedName(category, locale),
    description: locale === 'nl' ? category.descriptionNl : category.descriptionEn,
    icon: category.icon,
    colorToken: category.colorToken,
  }))
}

export async function listSkills(locale: Locale) {
  const skills = await prisma.skill.findMany({ orderBy: { slug: 'asc' } })
  return skills.map((skill) => ({
    id: skill.id,
    slug: skill.slug,
    name: localisedName(skill, locale),
    description: locale === 'nl' ? skill.descriptionNl : skill.descriptionEn,
  }))
}

export async function listInterests(locale: Locale) {
  const interests = await prisma.interest.findMany({ orderBy: { slug: 'asc' } })
  return interests.map((interest) => ({
    id: interest.id,
    slug: interest.slug,
    name: localisedName(interest, locale),
    categoryId: interest.categoryId,
  }))
}

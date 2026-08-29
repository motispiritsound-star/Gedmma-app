import { prisma } from '@/lib/db'
import { conflict, notFound, validationError } from '@/lib/errors'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'
import { questInclude, type QuestWithRelations } from '@/modules/quests/queries'
import type { Prisma, Quest, QuestStatus, WeatherSuitability } from '@/generated/prisma/client'
import type { QuestInput } from './schemas'

/**
 * Content administration for quests.
 *
 * Every write that changes material content records a snapshot in
 * `QuestVersion`, so an editor can see what a quest looked like before a change
 * and who made it.
 */

export async function listQuestsForAdmin(params: {
  status?: QuestStatus
  search?: string
  take?: number
  skip?: number
}) {
  const where: Prisma.QuestWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? { translations: { some: { title: { contains: params.search, mode: 'insensitive' } } } }
      : {}),
  }
  const [items, total] = await Promise.all([
    prisma.quest.findMany({
      where,
      include: {
        category: true,
        translations: true,
        _count: { select: { completions: true, favourites: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: params.take ?? 50,
      skip: params.skip ?? 0,
    }),
    prisma.quest.count({ where }),
  ])
  return { items, total }
}

function snapshotOf(quest: QuestWithRelations): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(quest)) as Prisma.InputJsonValue
}

async function resolveReferences(input: QuestInput) {
  const category = await prisma.category.findUnique({ where: { slug: input.categorySlug } })
  if (!category) throw validationError(`Unknown category "${input.categorySlug}".`)

  const skills = await prisma.skill.findMany({ where: { slug: { in: input.skillSlugs } } })
  const missingSkill = input.skillSlugs.find(
    (slug) => !skills.some((skill) => skill.slug === slug),
  )
  if (missingSkill) throw validationError(`Unknown skill "${missingSkill}".`)

  const materialSlugs = input.materials.map((material) => material.slug)
  const materials = await prisma.material.findMany({ where: { slug: { in: materialSlugs } } })
  const missingMaterial = materialSlugs.find(
    (slug) => !materials.some((material) => material.slug === slug),
  )
  if (missingMaterial) throw validationError(`Unknown material "${missingMaterial}".`)

  return { category, skills, materials }
}

function questScalars(input: QuestInput, categoryId: string) {
  const weather: WeatherSuitability[] = input.weather.length ? input.weather : ['ANY']
  return {
    slug: input.slug,
    categoryId,
    ageBands: input.ageBands,
    durationMinutes: input.durationMinutes,
    difficulty: input.difficulty,
    setting: input.setting,
    weather,
    seasons: input.seasons,
    minParticipants: input.minParticipants,
    maxParticipants: Math.max(input.maxParticipants, input.minParticipants),
    requiresAdult: input.requiresAdult,
    isPremium: input.isPremium,
    imageKey: input.imageKey,
  }
}

function translationRows(input: QuestInput) {
  return (['en', 'nl'] as const).map((locale) => ({
    locale,
    title: input[locale].title,
    shortDescription: input[locale].shortDescription,
    story: input[locale].story,
    educationalObjective: input[locale].educationalObjective,
    expectedResult: input[locale].expectedResult,
    preparation: input[locale].preparation,
    reflectionQuestions: input[locale].reflectionQuestions,
  }))
}

export async function createQuest(params: {
  input: QuestInput
  actorUserId: string
  actorRole: string
}): Promise<Quest> {
  const existing = await prisma.quest.findUnique({ where: { slug: params.input.slug } })
  if (existing) throw conflict(`A quest with slug "${params.input.slug}" already exists.`)

  const { category, skills, materials } = await resolveReferences(params.input)

  const quest = await prisma.quest.create({
    data: {
      ...questScalars(params.input, category.id),
      status: 'DRAFT',
      version: 1,
      translations: { create: translationRows(params.input) },
      skills: { create: skills.map((skill) => ({ skillId: skill.id })) },
      materials: {
        create: params.input.materials.map((entry) => {
          const material = materials.find((row) => row.slug === entry.slug)
          return {
            materialId: material?.id ?? '',
            quantity: entry.quantity ?? null,
            optional: entry.optional,
          }
        }),
      },
      safety: {
        create: params.input.safety.map((entry) => ({
          position: entry.position,
          severity: entry.severity,
          textEn: entry.textEn,
          textNl: entry.textNl,
        })),
      },
      steps: {
        create: params.input.steps.map((step) => ({
          position: step.position,
          estimatedMinutes: step.estimatedMinutes,
          requiresAdult: step.requiresAdult,
          translations: {
            create: (['en', 'nl'] as const).map((locale) => ({
              locale,
              title: step[locale].title,
              instruction: step[locale].instruction,
              audioScript: step[locale].audioScript ?? null,
            })),
          },
        })),
      },
    },
  })

  await snapshotVersion(quest.id, params.actorUserId, params.input.changeNote ?? 'Created')

  await recordAudit({
    action: AUDIT_ACTIONS.questCreated,
    entityType: 'quest',
    entityId: quest.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    metadata: { slug: quest.slug },
  })

  return quest
}

export async function updateQuest(params: {
  questId: string
  input: QuestInput
  actorUserId: string
  actorRole: string
}): Promise<Quest> {
  const existing = await prisma.quest.findUnique({ where: { id: params.questId } })
  if (!existing) throw notFound('Quest not found.')

  const slugOwner = await prisma.quest.findUnique({ where: { slug: params.input.slug } })
  if (slugOwner && slugOwner.id !== params.questId) {
    throw conflict(`A quest with slug "${params.input.slug}" already exists.`)
  }

  const { category, skills, materials } = await resolveReferences(params.input)

  // Snapshot the *previous* state before overwriting it.
  await snapshotVersion(params.questId, params.actorUserId, params.input.changeNote ?? 'Updated')

  const quest = await prisma.$transaction(async (tx) => {
    await tx.questStep.deleteMany({ where: { questId: params.questId } })
    await tx.questSkill.deleteMany({ where: { questId: params.questId } })
    await tx.questMaterial.deleteMany({ where: { questId: params.questId } })
    await tx.safetyInstruction.deleteMany({ where: { questId: params.questId } })
    await tx.questTranslation.deleteMany({ where: { questId: params.questId } })

    return tx.quest.update({
      where: { id: params.questId },
      data: {
        ...questScalars(params.input, category.id),
        version: { increment: 1 },
        translations: { create: translationRows(params.input) },
        skills: { create: skills.map((skill) => ({ skillId: skill.id })) },
        materials: {
          create: params.input.materials.map((entry) => {
            const material = materials.find((row) => row.slug === entry.slug)
            return {
              materialId: material?.id ?? '',
              quantity: entry.quantity ?? null,
              optional: entry.optional,
            }
          }),
        },
        safety: {
          create: params.input.safety.map((entry) => ({
            position: entry.position,
            severity: entry.severity,
            textEn: entry.textEn,
            textNl: entry.textNl,
          })),
        },
        steps: {
          create: params.input.steps.map((step) => ({
            position: step.position,
            estimatedMinutes: step.estimatedMinutes,
            requiresAdult: step.requiresAdult,
            translations: {
              create: (['en', 'nl'] as const).map((locale) => ({
                locale,
                title: step[locale].title,
                instruction: step[locale].instruction,
                audioScript: step[locale].audioScript ?? null,
              })),
            },
          })),
        },
      },
    })
  })

  await recordAudit({
    action: AUDIT_ACTIONS.questUpdated,
    entityType: 'quest',
    entityId: quest.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    metadata: { slug: quest.slug, version: quest.version },
  })

  return quest
}

export async function setQuestStatus(params: {
  questId: string
  status: QuestStatus
  actorUserId: string
  actorRole: string
}): Promise<Quest> {
  const quest = await prisma.quest.findUnique({
    where: { id: params.questId },
    include: { translations: true, steps: true },
  })
  if (!quest) throw notFound('Quest not found.')

  if (params.status === 'PUBLISHED') {
    // Publishing is the gate that guarantees a family never sees a half-written
    // quest, or one that exists in only one language.
    const locales = new Set(quest.translations.map((translation) => translation.locale))
    if (!locales.has('en') || !locales.has('nl')) {
      throw validationError('A quest needs both a Dutch and an English translation before publishing.')
    }
    if (quest.steps.length === 0) {
      throw validationError('A quest needs at least one step before publishing.')
    }
  }

  const updated = await prisma.quest.update({
    where: { id: params.questId },
    data: {
      status: params.status,
      publishedAt: params.status === 'PUBLISHED' ? new Date() : quest.publishedAt,
      archivedAt: params.status === 'ARCHIVED' ? new Date() : null,
    },
  })

  const action =
    params.status === 'PUBLISHED'
      ? AUDIT_ACTIONS.questPublished
      : params.status === 'ARCHIVED'
        ? AUDIT_ACTIONS.questArchived
        : AUDIT_ACTIONS.questUnpublished

  await recordAudit({
    action,
    entityType: 'quest',
    entityId: updated.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    metadata: { slug: updated.slug, status: params.status },
  })

  return updated
}

export async function duplicateQuest(params: {
  questId: string
  actorUserId: string
  actorRole: string
}): Promise<Quest> {
  const source = await prisma.quest.findUnique({ where: { id: params.questId }, include: questInclude })
  if (!source) throw notFound('Quest not found.')

  const baseSlug = `${source.slug}-copy`
  let slug = baseSlug
  let counter = 2
  while (await prisma.quest.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter += 1
  }

  const copy = await prisma.quest.create({
    data: {
      slug,
      categoryId: source.categoryId,
      ageBands: source.ageBands,
      durationMinutes: source.durationMinutes,
      difficulty: source.difficulty,
      setting: source.setting,
      weather: source.weather,
      seasons: source.seasons,
      minParticipants: source.minParticipants,
      maxParticipants: source.maxParticipants,
      requiresAdult: source.requiresAdult,
      isPremium: source.isPremium,
      imageKey: source.imageKey,
      status: 'DRAFT',
      translations: {
        create: source.translations.map((translation) => ({
          locale: translation.locale,
          title: `${translation.title} (copy)`,
          shortDescription: translation.shortDescription,
          story: translation.story,
          educationalObjective: translation.educationalObjective,
          expectedResult: translation.expectedResult,
          preparation: translation.preparation,
          reflectionQuestions: translation.reflectionQuestions,
        })),
      },
      skills: { create: source.skills.map((entry) => ({ skillId: entry.skillId, weight: entry.weight })) },
      materials: {
        create: source.materials.map((entry) => ({
          materialId: entry.materialId,
          quantity: entry.quantity,
          optional: entry.optional,
        })),
      },
      safety: {
        create: source.safety.map((entry) => ({
          position: entry.position,
          severity: entry.severity,
          textEn: entry.textEn,
          textNl: entry.textNl,
        })),
      },
      steps: {
        create: source.steps.map((step) => ({
          position: step.position,
          estimatedMinutes: step.estimatedMinutes,
          requiresAdult: step.requiresAdult,
          translations: {
            create: step.translations.map((translation) => ({
              locale: translation.locale,
              title: translation.title,
              instruction: translation.instruction,
              audioScript: translation.audioScript,
            })),
          },
        })),
      },
    },
  })

  await recordAudit({
    action: AUDIT_ACTIONS.questDuplicated,
    entityType: 'quest',
    entityId: copy.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    metadata: { sourceSlug: source.slug, slug: copy.slug },
  })

  return copy
}

export async function snapshotVersion(
  questId: string,
  actorUserId: string | null,
  changeNote?: string,
): Promise<void> {
  const quest = await prisma.quest.findUnique({ where: { id: questId }, include: questInclude })
  if (!quest) return
  const latest = await prisma.questVersion.findFirst({
    where: { questId },
    orderBy: { version: 'desc' },
  })
  await prisma.questVersion.create({
    data: {
      questId,
      version: (latest?.version ?? 0) + 1,
      snapshot: snapshotOf(quest),
      changeNote: changeNote ?? null,
      changedByUserId: actorUserId,
    },
  })
}

export async function listQuestVersions(questId: string) {
  return prisma.questVersion.findMany({
    where: { questId },
    orderBy: { version: 'desc' },
    include: { changedByUser: { select: { displayName: true } } },
    take: 25,
  })
}

/** Aggregate, privacy-safe completion statistics for the admin dashboard. */
export async function questStatistics() {
  const [byStatus, completionsByQuest, totals] = await Promise.all([
    prisma.quest.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.questCompletion.groupBy({
      by: ['questId'],
      where: { status: 'APPROVED' },
      _count: { _all: true },
      orderBy: { _count: { questId: 'desc' } },
      take: 10,
    }),
    prisma.$transaction([
      prisma.family.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.childProfile.count({ where: { deletedAt: null } }),
      prisma.questCompletion.count({ where: { status: 'APPROVED' } }),
    ]),
  ])

  const topQuestIds = completionsByQuest.map((row) => row.questId)
  const quests = await prisma.quest.findMany({
    where: { id: { in: topQuestIds } },
    include: { translations: true },
  })

  return {
    questsByStatus: Object.fromEntries(byStatus.map((row) => [row.status, row._count._all])),
    topQuests: completionsByQuest.map((row) => ({
      questId: row.questId,
      completions: row._count._all,
      title:
        quests.find((quest) => quest.id === row.questId)?.translations.find((t) => t.locale === 'en')
          ?.title ?? row.questId,
    })),
    families: totals[0],
    users: totals[1],
    childProfiles: totals[2],
    completions: totals[3],
  }
}

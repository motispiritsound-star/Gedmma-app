import { prisma } from '@/lib/db'
import { conflict, forbidden, notFound, planLimit, validationError } from '@/lib/errors'
import type { Locale } from '@/modules/localisation'
import { accessibleQuestIds } from '@/modules/quests/queries'
import { entitlementsFor } from '@/modules/subscriptions/plans'
import { evaluateBadgesForFamily, type BadgeAwardResult } from './badges'
import type { CompletionSubmission, PlannedQuestInput } from './schemas'
import type { QuestCompletion } from '@/generated/prisma/client'

/**
 * Quest lifecycle: start -> (Adventure Mode) -> submit -> approve.
 *
 * A completion is created the moment Adventure Mode opens so the family can
 * close the app and come back later. Nothing about the flow requires the screen
 * to stay on.
 */

async function assertQuestAccessible(familyId: string, questId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({ where: { familyId } })
  const allowed = await accessibleQuestIds(entitlementsFor(subscription?.plan))
  if (allowed !== null && !allowed.has(questId)) {
    throw planLimit('This adventure is part of Family Premium.')
  }
}

export async function startQuest(params: {
  familyId: string
  questId: string
  userId: string
  locale: Locale
}): Promise<QuestCompletion> {
  const quest = await prisma.quest.findFirst({
    where: { id: params.questId, status: 'PUBLISHED' },
  })
  if (!quest) throw notFound('That adventure is not available.')
  await assertQuestAccessible(params.familyId, params.questId)

  const existing = await prisma.questCompletion.findFirst({
    where: { familyId: params.familyId, questId: params.questId, status: 'IN_PROGRESS' },
  })
  if (existing) return existing

  return prisma.questCompletion.create({
    data: {
      familyId: params.familyId,
      questId: params.questId,
      startedByUserId: params.userId,
      locale: params.locale,
      status: 'IN_PROGRESS',
    },
  })
}

export async function abandonQuest(params: {
  completionId: string
  familyId: string
}): Promise<void> {
  const completion = await prisma.questCompletion.findFirst({
    where: { id: params.completionId, familyId: params.familyId },
  })
  if (!completion) throw notFound('Adventure not found.')
  if (completion.status !== 'IN_PROGRESS') throw conflict('This adventure is already finished.')

  await prisma.questCompletion.update({
    where: { id: params.completionId },
    data: { status: 'ABANDONED', finishedAt: new Date() },
  })
}

export type SubmitCompletionResult = {
  completion: QuestCompletion
  requiresApproval: boolean
  badges: BadgeAwardResult[]
}

/**
 * Records the outcome of an adventure. When the family has parent approval
 * switched on the completion waits in `PENDING_APPROVAL` and no badges are
 * awarded until a parent approves.
 */
export async function submitCompletion(params: {
  familyId: string
  userId: string
  input: CompletionSubmission
}): Promise<SubmitCompletionResult> {
  const [completion, family] = await Promise.all([
    prisma.questCompletion.findFirst({
      where: { id: params.input.completionId, familyId: params.familyId },
      include: { quest: { include: { translations: true } } },
    }),
    prisma.family.findUnique({ where: { id: params.familyId } }),
  ])
  if (!completion || !family) throw notFound('Adventure not found.')
  if (completion.status === 'APPROVED') throw conflict('This adventure is already complete.')

  const children = await prisma.childProfile.findMany({
    where: { id: { in: params.input.childProfileIds }, familyId: params.familyId, deletedAt: null },
    select: { id: true },
  })
  if (children.length !== params.input.childProfileIds.length) {
    throw validationError('One of the selected child profiles does not belong to this family.')
  }

  const requiresApproval = family.requireParentApproval
  const now = new Date()

  const updated = await prisma.$transaction(async (tx) => {
    await tx.questParticipation.deleteMany({ where: { completionId: completion.id } })
    await tx.completionReflection.deleteMany({ where: { completionId: completion.id } })

    return tx.questCompletion.update({
      where: { id: completion.id },
      data: {
        status: requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED',
        finishedAt: now,
        approvedAt: requiresApproval ? null : now,
        approvedByUserId: requiresApproval ? null : params.userId,
        offlineMinutes: params.input.offlineMinutes,
        familyNote: params.input.familyNote?.trim() || null,
        participants: {
          create: children.map((child) => ({ childProfileId: child.id })),
        },
        reflections: {
          create: params.input.reflections
            .filter((reflection) => reflection.answer.trim().length > 0)
            .map((reflection, index) => ({
              position: index,
              question: reflection.question,
              answer: reflection.answer.trim(),
            })),
        },
      },
    })
  })

  const badges = requiresApproval
    ? []
    : await evaluateBadgesForFamily({ familyId: params.familyId, completionId: completion.id })

  return { completion: updated, requiresApproval, badges }
}

export async function approveCompletion(params: {
  completionId: string
  familyId: string
  userId: string
}): Promise<SubmitCompletionResult> {
  const completion = await prisma.questCompletion.findFirst({
    where: { id: params.completionId, familyId: params.familyId },
  })
  if (!completion) throw notFound('Adventure not found.')
  if (completion.status === 'APPROVED') {
    return { completion, requiresApproval: false, badges: [] }
  }
  if (completion.status !== 'PENDING_APPROVAL') {
    throw conflict('This adventure is not waiting for approval.')
  }

  const updated = await prisma.questCompletion.update({
    where: { id: completion.id },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedByUserId: params.userId },
  })

  const badges = await evaluateBadgesForFamily({
    familyId: params.familyId,
    completionId: completion.id,
  })

  return { completion: updated, requiresApproval: false, badges }
}

export async function getCompletionForFamily(completionId: string, familyId: string) {
  const completion = await prisma.questCompletion.findUnique({
    where: { id: completionId },
    include: {
      quest: { include: { translations: true, category: true } },
      participants: { include: { childProfile: true } },
      reflections: true,
      evidence: true,
    },
  })
  if (!completion) throw notFound('Adventure not found.')
  if (completion.familyId !== familyId) throw forbidden()
  return completion
}

// ------------------------------------------------------------- favourites ---

export async function toggleFavourite(params: {
  familyId: string
  questId: string
}): Promise<boolean> {
  const existing = await prisma.favouriteQuest.findUnique({
    where: { familyId_questId: { familyId: params.familyId, questId: params.questId } },
  })
  if (existing) {
    await prisma.favouriteQuest.delete({
      where: { familyId_questId: { familyId: params.familyId, questId: params.questId } },
    })
    return false
  }
  await prisma.favouriteQuest.create({
    data: { familyId: params.familyId, questId: params.questId },
  })
  return true
}

export async function listFavourites(familyId: string) {
  return prisma.favouriteQuest.findMany({
    where: { familyId },
    include: { quest: { include: { translations: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

// ---------------------------------------------------------------- planner ---

export async function planQuest(params: {
  familyId: string
  input: PlannedQuestInput
}): Promise<void> {
  const scheduledFor = new Date(`${params.input.scheduledFor}T00:00:00.000Z`)
  await prisma.plannedQuest.upsert({
    where: {
      familyId_questId_scheduledFor: {
        familyId: params.familyId,
        questId: params.input.questId,
        scheduledFor,
      },
    },
    create: {
      familyId: params.familyId,
      questId: params.input.questId,
      scheduledFor,
      timeOfDay: params.input.timeOfDay ?? null,
      note: params.input.note?.trim() || null,
      status: 'PLANNED',
    },
    update: {
      timeOfDay: params.input.timeOfDay ?? null,
      note: params.input.note?.trim() || null,
      status: 'PLANNED',
    },
  })
}

export async function updatePlannedQuest(params: {
  familyId: string
  plannedId: string
  status: 'PLANNED' | 'DONE' | 'SKIPPED'
}): Promise<void> {
  const planned = await prisma.plannedQuest.findFirst({
    where: { id: params.plannedId, familyId: params.familyId },
  })
  if (!planned) throw notFound('Planned adventure not found.')
  await prisma.plannedQuest.update({
    where: { id: params.plannedId },
    data: { status: params.status },
  })
}

export async function removePlannedQuest(params: {
  familyId: string
  plannedId: string
}): Promise<void> {
  const planned = await prisma.plannedQuest.findFirst({
    where: { id: params.plannedId, familyId: params.familyId },
  })
  if (!planned) throw notFound('Planned adventure not found.')
  await prisma.plannedQuest.delete({ where: { id: params.plannedId } })
}

export async function listPlannedQuests(params: {
  familyId: string
  from: Date
  to: Date
}) {
  return prisma.plannedQuest.findMany({
    where: { familyId: params.familyId, scheduledFor: { gte: params.from, lte: params.to } },
    include: { quest: { include: { translations: true, category: true } } },
    orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'asc' }],
  })
}

import { describe, expect, it } from 'vitest'
import { prisma } from '@/lib/db'
import {
  abandonQuest,
  approveCompletion,
  getCompletionForFamily,
  listFavourites,
  listPlannedQuests,
  planQuest,
  startQuest,
  submitCompletion,
  toggleFavourite,
  updatePlannedQuest,
} from '@/modules/progress/service'
import { evaluateBadgesForFamily } from '@/modules/progress/badges'
import { getFamilyStats, listPendingApprovals } from '@/modules/progress/stats'
import { AppError } from '@/lib/errors'
import { createTestFamily, questBySlug } from './helpers'

/** Acceptance criteria 4, 5 and 6. */

async function completeQuest(params: {
  familyId: string
  userId: string
  childId: string
  slug: string
  minutes?: number
}) {
  const quest = await questBySlug(params.slug)
  const completion = await startQuest({
    familyId: params.familyId,
    questId: quest.id,
    userId: params.userId,
    locale: 'nl',
  })
  return submitCompletion({
    familyId: params.familyId,
    userId: params.userId,
    input: {
      completionId: completion.id,
      childProfileIds: [params.childId],
      offlineMinutes: params.minutes ?? 45,
      familyNote: '',
      reflections: [{ question: 'Hoe ging het?', answer: 'Goed!' }],
    },
  })
}

describe('starting and completing a quest', () => {
  it('runs the full journey from start to approved', async () => {
    const { familyId, userId, children } = await createTestFamily({
      requireParentApproval: false,
      children: [{ nickname: 'Noor', ageBand: 'AGE_6_8' }],
    })
    const child = children[0]!
    const quest = await questBySlug('leaf-detective')

    const completion = await startQuest({ familyId, questId: quest.id, userId, locale: 'nl' })
    expect(completion.status).toBe('IN_PROGRESS')

    const result = await submitCompletion({
      familyId,
      userId,
      input: {
        completionId: completion.id,
        childProfileIds: [child.id],
        offlineMinutes: 50,
        familyNote: 'Noor vond een blad zo groot als haar hoofd.',
        reflections: [
          { question: 'Welk blad was het moeilijkst?', answer: 'De eik.' },
          { question: 'Wat viel je op?', answer: 'De nerven.' },
        ],
      },
    })

    expect(result.requiresApproval).toBe(false)
    expect(result.completion.status).toBe('APPROVED')
    expect(result.completion.offlineMinutes).toBe(50)

    const stored = await getCompletionForFamily(completion.id, familyId)
    expect(stored.participants).toHaveLength(1)
    expect(stored.participants[0]?.childProfileId).toBe(child.id)
    expect(stored.reflections).toHaveLength(2)
    expect(stored.familyNote).toContain('blad')

    const stats = await getFamilyStats(familyId, 'nl')
    expect(stats.completedCount).toBe(1)
    expect(stats.reportedOfflineMinutes).toBe(50)
    expect(stats.children[0]?.completed).toBe(1)
  })

  it('reuses an in-progress completion instead of starting a second one', async () => {
    const { familyId, userId } = await createTestFamily({ children: [{ nickname: 'Sem' }] })
    const quest = await questBySlug('density-tower')
    const first = await startQuest({ familyId, questId: quest.id, userId, locale: 'nl' })
    const second = await startQuest({ familyId, questId: quest.id, userId, locale: 'nl' })
    expect(second.id).toBe(first.id)
  })

  it('can be abandoned and started again later', async () => {
    const { familyId, userId } = await createTestFamily({ children: [{ nickname: 'Sem' }] })
    const quest = await questBySlug('density-tower')
    const completion = await startQuest({ familyId, questId: quest.id, userId, locale: 'nl' })
    await abandonQuest({ completionId: completion.id, familyId })
    const abandoned = await prisma.questCompletion.findUniqueOrThrow({
      where: { id: completion.id },
    })
    expect(abandoned.status).toBe('ABANDONED')

    const restarted = await startQuest({ familyId, questId: quest.id, userId, locale: 'nl' })
    expect(restarted.id).not.toBe(completion.id)
  })

  it('rejects a child profile from another family', async () => {
    const familyA = await createTestFamily({ children: [{ nickname: 'Noor' }] })
    const familyB = await createTestFamily({ children: [{ nickname: 'Vreemde' }] })
    const quest = await questBySlug('leaf-detective')
    const completion = await startQuest({
      familyId: familyA.familyId,
      questId: quest.id,
      userId: familyA.userId,
      locale: 'nl',
    })

    await expect(
      submitCompletion({
        familyId: familyA.familyId,
        userId: familyA.userId,
        input: {
          completionId: completion.id,
          childProfileIds: [familyB.children[0]!.id],
          offlineMinutes: 30,
          familyNote: '',
          reflections: [],
        },
      }),
    ).rejects.toThrowError(/does not belong to this family/)
  })

  it('refuses a premium quest on the free plan', async () => {
    const { familyId, userId } = await createTestFamily({
      premium: false,
      children: [{ nickname: 'Noor' }],
    })
    const premiumQuest = await prisma.quest.findFirstOrThrow({
      where: { status: 'PUBLISHED', isPremium: true },
    })
    await expect(
      startQuest({ familyId, questId: premiumQuest.id, userId, locale: 'nl' }),
    ).rejects.toThrowError(/Family Premium/)
  })
})

describe('parent approval', () => {
  it('holds a completion in PENDING_APPROVAL when approval is configured', async () => {
    const { familyId, userId, children } = await createTestFamily({
      requireParentApproval: true,
      children: [{ nickname: 'Noor' }],
    })

    const result = await completeQuest({
      familyId,
      userId,
      childId: children[0]!.id,
      slug: 'leaf-detective',
    })

    expect(result.requiresApproval).toBe(true)
    expect(result.completion.status).toBe('PENDING_APPROVAL')
    expect(result.badges).toHaveLength(0)

    const pending = await listPendingApprovals(familyId)
    expect(pending).toHaveLength(1)

    // Not counted as completed until a parent approves.
    expect((await getFamilyStats(familyId, 'nl')).completedCount).toBe(0)

    const approved = await approveCompletion({
      completionId: result.completion.id,
      familyId,
      userId,
    })
    expect(approved.completion.status).toBe('APPROVED')
    expect(approved.completion.approvedByUserId).toBe(userId)
    expect(approved.badges.length).toBeGreaterThan(0)
    expect((await getFamilyStats(familyId, 'nl')).completedCount).toBe(1)
  })

  it('approves immediately when the family switched approval off', async () => {
    const { familyId, userId, children } = await createTestFamily({
      requireParentApproval: false,
      children: [{ nickname: 'Sem' }],
    })
    const result = await completeQuest({
      familyId,
      userId,
      childId: children[0]!.id,
      slug: 'density-tower',
    })
    expect(result.requiresApproval).toBe(false)
    expect(result.completion.approvedAt).not.toBeNull()
  })

  it('is idempotent when a completion is approved twice', async () => {
    const { familyId, userId, children } = await createTestFamily({
      requireParentApproval: true,
      children: [{ nickname: 'Noor' }],
    })
    const result = await completeQuest({
      familyId,
      userId,
      childId: children[0]!.id,
      slug: 'leaf-detective',
    })
    await approveCompletion({ completionId: result.completion.id, familyId, userId })
    const second = await approveCompletion({ completionId: result.completion.id, familyId, userId })
    expect(second.completion.status).toBe('APPROVED')
    expect(second.badges).toHaveLength(0)
  })

  it('refuses to approve a completion belonging to another family', async () => {
    const familyA = await createTestFamily({
      requireParentApproval: true,
      children: [{ nickname: 'Noor' }],
    })
    const familyB = await createTestFamily()
    const result = await completeQuest({
      familyId: familyA.familyId,
      userId: familyA.userId,
      childId: familyA.children[0]!.id,
      slug: 'leaf-detective',
    })
    await expect(
      approveCompletion({
        completionId: result.completion.id,
        familyId: familyB.familyId,
        userId: familyB.userId,
      }),
    ).rejects.toThrowError(AppError)
  })
})

describe('badges', () => {
  it('awards a badge exactly once, however often it is evaluated', async () => {
    const { familyId, userId, children } = await createTestFamily({
      requireParentApproval: false,
      children: [{ nickname: 'Noor' }],
    })

    const first = await completeQuest({
      familyId,
      userId,
      childId: children[0]!.id,
      slug: 'leaf-detective',
    })
    expect(first.badges.map((entry) => entry.badge.slug)).toContain('first-adventure')

    // Re-evaluating must not award it again.
    const again = await evaluateBadgesForFamily({ familyId })
    expect(again.map((entry) => entry.badge.slug)).not.toContain('first-adventure')

    await completeQuest({ familyId, userId, childId: children[0]!.id, slug: 'density-tower' })
    const awarded = await prisma.awardedBadge.findMany({
      where: { familyId },
      include: { badge: true },
    })
    const firstAdventure = awarded.filter((entry) => entry.badge.slug === 'first-adventure')
    expect(firstAdventure).toHaveLength(1)
  })

  it('awards a category badge only once the threshold is reached', async () => {
    const { familyId, userId, children } = await createTestFamily({
      requireParentApproval: false,
      children: [{ nickname: 'Noor' }],
    })
    const child = children[0]!

    await completeQuest({ familyId, userId, childId: child.id, slug: 'leaf-detective' })
    await completeQuest({ familyId, userId, childId: child.id, slug: 'insect-hotel' })
    let slugs = (
      await prisma.awardedBadge.findMany({ where: { familyId }, include: { badge: true } })
    ).map((entry) => entry.badge.slug)
    expect(slugs).not.toContain('nature-friend')

    await completeQuest({ familyId, userId, childId: child.id, slug: 'bird-language-map' })
    slugs = (
      await prisma.awardedBadge.findMany({ where: { familyId }, include: { badge: true } })
    ).map((entry) => entry.badge.slug)
    expect(slugs).toContain('nature-friend')
  })

  it('never awards a badge to a family that did not earn it', async () => {
    const { familyId } = await createTestFamily({ children: [{ nickname: 'Noor' }] })
    const awarded = await evaluateBadgesForFamily({ familyId })
    expect(awarded).toHaveLength(0)
  })
})

describe('favourites and the planner', () => {
  it('toggles a favourite on and off', async () => {
    const { familyId } = await createTestFamily()
    const quest = await questBySlug('grandparent-interview')

    expect(await toggleFavourite({ familyId, questId: quest.id })).toBe(true)
    expect(await listFavourites(familyId)).toHaveLength(1)
    expect(await toggleFavourite({ familyId, questId: quest.id })).toBe(false)
    expect(await listFavourites(familyId)).toHaveLength(0)
  })

  it('plans a quest for a day and updates its status', async () => {
    const { familyId } = await createTestFamily()
    const quest = await questBySlug('flatbread-from-scratch')
    const day = '2026-09-05'

    await planQuest({ familyId, input: { questId: quest.id, scheduledFor: day, note: '' } })
    // Planning the same quest on the same day updates rather than duplicates.
    await planQuest({
      familyId,
      input: { questId: quest.id, scheduledFor: day, timeOfDay: 'MORNING', note: 'Ontbijt' },
    })

    const planned = await listPlannedQuests({
      familyId,
      from: new Date('2026-09-01'),
      to: new Date('2026-09-10'),
    })
    expect(planned).toHaveLength(1)
    expect(planned[0]?.timeOfDay).toBe('MORNING')

    await updatePlannedQuest({ familyId, plannedId: planned[0]!.id, status: 'DONE' })
    const updated = await prisma.plannedQuest.findUniqueOrThrow({ where: { id: planned[0]!.id } })
    expect(updated.status).toBe('DONE')
  })

  it('refuses to change another family’s planned quest', async () => {
    const familyA = await createTestFamily()
    const familyB = await createTestFamily()
    const quest = await questBySlug('flatbread-from-scratch')
    await planQuest({
      familyId: familyA.familyId,
      input: { questId: quest.id, scheduledFor: '2026-09-06', note: '' },
    })
    const planned = await prisma.plannedQuest.findFirstOrThrow({
      where: { familyId: familyA.familyId },
    })
    await expect(
      updatePlannedQuest({ familyId: familyB.familyId, plannedId: planned.id, status: 'DONE' }),
    ).rejects.toThrowError(AppError)
  })
})

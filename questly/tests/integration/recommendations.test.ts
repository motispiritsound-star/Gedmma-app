import { describe, expect, it } from 'vitest'
import { prisma } from '@/lib/db'
import { recommendForFamily } from '@/modules/recommendations/service'
import { startQuest, submitCompletion } from '@/modules/progress/service'
import { listQuests } from '@/modules/quests/queries'
import { entitlementsFor } from '@/modules/subscriptions/plans'
import { createTestFamily, interestIdsBySlug, questBySlug } from './helpers'

/** Acceptance criterion 3, against the real content library. */

const PREMIUM = entitlementsFor('FAMILY_PREMIUM')
const FREE = entitlementsFor('FREE')

describe('recommendations for a family', () => {
  it('only suggests quests inside the children’s age bands', async () => {
    const { familyId } = await createTestFamily({
      children: [{ nickname: 'Noor', ageBand: 'AGE_6_8' }],
    })

    const recommendations = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 10,
    })

    expect(recommendations.length).toBeGreaterThan(0)
    for (const recommendation of recommendations) {
      expect(recommendation.quest.ageBands).toContain('AGE_6_8')
    }
  })

  it('widens the feed when a second, older child is added', async () => {
    const young = await createTestFamily({
      children: [{ nickname: 'Noor', ageBand: 'AGE_6_8' }],
    })
    const mixed = await createTestFamily({
      children: [
        { nickname: 'Noor', ageBand: 'AGE_6_8' },
        { nickname: 'Sem', ageBand: 'AGE_12_15' },
      ],
    })

    const youngFeed = await recommendForFamily({
      familyId: young.familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 40,
    })
    const mixedFeed = await recommendForFamily({
      familyId: mixed.familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 40,
    })

    expect(mixedFeed.length).toBeGreaterThan(youngFeed.length)
  })

  it('gives a human-readable reason for every suggestion', async () => {
    const interestIds = await interestIdsBySlug(['experiments'])
    const { familyId } = await createTestFamily({
      children: [{ nickname: 'Sem', ageBand: 'AGE_9_11', interestIds }],
    })

    const recommendations = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 6,
    })

    for (const recommendation of recommendations) {
      expect(recommendation.reasons.length).toBeGreaterThan(0)
      for (const reason of recommendation.reasons) {
        expect(reason.trim().length).toBeGreaterThan(5)
        expect(reason).not.toContain('{')
      }
    }
  })

  it('returns reasons in the requested language', async () => {
    const { familyId } = await createTestFamily({
      children: [{ nickname: 'Noor', ageBand: 'AGE_6_8' }],
    })

    const dutch = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 3,
    })
    const english = await recommendForFamily({
      familyId,
      locale: 'en',
      entitlements: PREMIUM,
      limit: 3,
    })

    expect(dutch[0]?.reasons.join(' ')).not.toBe(english[0]?.reasons.join(' '))
    expect(dutch[0]?.quest.title).not.toBe(english[0]?.quest.title)
  })

  it('favours a category matching the child’s interests', async () => {
    const interestIds = await interestIdsBySlug(['baking'])
    const { familyId } = await createTestFamily({
      children: [{ nickname: 'Noor', ageBand: 'AGE_6_8', interestIds }],
    })
    const recommendations = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 5,
    })
    expect(recommendations.map((entry) => entry.quest.category.slug)).toContain('cooking')
  })

  it('stops suggesting a quest the family has completed', async () => {
    const { familyId, userId, children } = await createTestFamily({
      requireParentApproval: false,
      children: [{ nickname: 'Noor', ageBand: 'AGE_6_8' }],
    })

    const before = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 20,
    })
    const target = before[0]!
    const quest = await questBySlug(target.quest.slug)

    const completion = await startQuest({ familyId, questId: quest.id, userId, locale: 'nl' })
    await submitCompletion({
      familyId,
      userId,
      input: {
        completionId: completion.id,
        childProfileIds: [children[0]!.id],
        offlineMinutes: 30,
        familyNote: '',
        reflections: [],
      },
    })

    const after = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      limit: 20,
    })
    expect(after.map((entry) => entry.quest.slug)).not.toContain(target.quest.slug)
  })

  it('only suggests unlocked quests on the free plan', async () => {
    const { familyId } = await createTestFamily({
      premium: false,
      children: [{ nickname: 'Noor', ageBand: 'AGE_6_8' }],
    })
    const recommendations = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: FREE,
      limit: 20,
    })
    expect(recommendations.length).toBeGreaterThan(0)
    for (const recommendation of recommendations) {
      expect(recommendation.quest.isPremium).toBe(false)
      expect(recommendation.quest.locked).toBe(false)
    }
  })

  it('is stable across repeated calls', async () => {
    const { familyId } = await createTestFamily({
      children: [{ nickname: 'Noor', ageBand: 'AGE_9_11' }],
    })
    const first = await recommendForFamily({ familyId, locale: 'nl', entitlements: PREMIUM })
    const second = await recommendForFamily({ familyId, locale: 'nl', entitlements: PREMIUM })
    expect(first.map((entry) => entry.quest.slug)).toEqual(second.map((entry) => entry.quest.slug))
  })

  it('adapts to rainy weather', async () => {
    const { familyId } = await createTestFamily({
      children: [{ nickname: 'Noor', ageBand: 'AGE_9_11' }],
    })
    const rainy = await recommendForFamily({
      familyId,
      locale: 'nl',
      entitlements: PREMIUM,
      weather: 'RAIN_FRIENDLY',
      limit: 5,
    })
    for (const recommendation of rainy) {
      const quest = await prisma.quest.findUniqueOrThrow({ where: { id: recommendation.quest.id } })
      expect(quest.weather.some((value) => value === 'ANY' || value === 'RAIN_FRIENDLY')).toBe(true)
    }
  })
})

describe('the quest library filters', () => {
  it('filters by age band', async () => {
    const result = await listQuests({
      filters: { ageBands: ['AGE_6_8'] },
      locale: 'nl',
      entitlements: PREMIUM,
      take: 100,
    })
    expect(result.items.length).toBeGreaterThan(0)
    for (const quest of result.items) expect(quest.ageBands).toContain('AGE_6_8')
  })

  it('filters by duration, category and setting together', async () => {
    const result = await listQuests({
      filters: { maxDurationMinutes: 45, categorySlugs: ['nature'], setting: 'OUTDOOR' },
      locale: 'nl',
      entitlements: PREMIUM,
      take: 100,
    })
    for (const quest of result.items) {
      expect(quest.durationMinutes).toBeLessThanOrEqual(45)
      expect(quest.category.slug).toBe('nature')
      expect(['OUTDOOR', 'BOTH']).toContain(quest.setting)
    }
  })

  it('filters to quests that only need common household materials', async () => {
    const result = await listQuests({
      filters: { onlyCommonMaterials: true },
      locale: 'nl',
      entitlements: PREMIUM,
      take: 100,
    })
    for (const quest of result.items) {
      const row = await prisma.quest.findUniqueOrThrow({
        where: { id: quest.id },
        include: { materials: { include: { material: true } } },
      })
      const needsSpecial = row.materials.some(
        (entry) => !entry.optional && !entry.material.isCommon,
      )
      expect(needsSpecial).toBe(false)
    }
  })

  it('marks premium quests as locked for a free family without hiding them', async () => {
    const result = await listQuests({
      filters: {},
      locale: 'nl',
      entitlements: FREE,
      take: 100,
    })
    const locked = result.items.filter((quest) => quest.locked)
    const unlocked = result.items.filter((quest) => !quest.locked)
    expect(locked.length).toBeGreaterThan(0)
    expect(unlocked.length).toBe(FREE.freeQuestRotationSize)
  })

  it('searches titles in the requested language', async () => {
    const dutch = await listQuests({
      filters: { search: 'Bladerdetective' },
      locale: 'nl',
      entitlements: PREMIUM,
    })
    expect(dutch.items.map((item) => item.slug)).toContain('leaf-detective')

    const english = await listQuests({
      filters: { search: 'Leaf detective' },
      locale: 'en',
      entitlements: PREMIUM,
    })
    expect(english.items.map((item) => item.slug)).toContain('leaf-detective')
  })
})

describe('seeded content quality', () => {
  it('ships at least thirty published quests', async () => {
    expect(await prisma.quest.count({ where: { status: 'PUBLISHED' } })).toBeGreaterThanOrEqual(30)
  })

  it('has at least three quests in every category', async () => {
    const categories = await prisma.category.findMany()
    for (const category of categories) {
      const count = await prisma.quest.count({
        where: { categoryId: category.id, status: 'PUBLISHED' },
      })
      expect(count, category.slug).toBeGreaterThanOrEqual(3)
    }
  })

  it('gives every published quest both translations, steps, safety and reflection', async () => {
    const quests = await prisma.quest.findMany({
      where: { status: 'PUBLISHED' },
      include: { translations: true, steps: true, skills: true, materials: true },
    })
    for (const quest of quests) {
      const locales = quest.translations.map((row) => row.locale).sort()
      expect(locales, quest.slug).toEqual(['en', 'nl'])
      expect(quest.steps.length, quest.slug).toBeGreaterThan(0)
      expect(quest.skills.length, quest.slug).toBeGreaterThan(0)
      expect(quest.materials.length, quest.slug).toBeGreaterThan(0)
      for (const translation of quest.translations) {
        expect(translation.reflectionQuestions.length, quest.slug).toBeGreaterThan(0)
        expect(translation.preparation.length, quest.slug).toBeGreaterThan(0)
        expect(translation.educationalObjective.length, quest.slug).toBeGreaterThan(10)
      }
    }
  })

  it('marks every quest needing an adult with an explicit safety instruction', async () => {
    const quests = await prisma.quest.findMany({
      where: { status: 'PUBLISHED', requiresAdult: true },
      include: { safety: true },
    })
    for (const quest of quests) {
      expect(
        quest.safety.some((entry) => entry.severity === 'ADULT_REQUIRED'),
        quest.slug,
      ).toBe(true)
    }
  })
})

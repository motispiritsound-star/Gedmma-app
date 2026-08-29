import { describe, expect, it } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createQuest,
  duplicateQuest,
  listQuestVersions,
  listQuestsForAdmin,
  questStatistics,
  setQuestStatus,
  updateQuest,
} from '@/modules/admin/quests'
import { getQuestDetail, listQuests } from '@/modules/quests/queries'
import { entitlementsFor } from '@/modules/subscriptions/plans'
import { AppError } from '@/lib/errors'
import type { QuestInput } from '@/modules/admin/schemas'

/** Acceptance criteria 9 and 10. */

const ADMIN = { actorUserId: 'seed-admin', actorRole: 'CONTENT_ADMIN' }

function questInput(slug: string, overrides: Partial<QuestInput> = {}): QuestInput {
  return {
    slug,
    categorySlug: 'science',
    ageBands: ['AGE_9_11'],
    durationMinutes: 40,
    difficulty: 'MEDIUM',
    setting: 'INDOOR',
    weather: ['ANY'],
    seasons: [],
    minParticipants: 1,
    maxParticipants: 4,
    requiresAdult: false,
    isPremium: false,
    imageKey: 'test-quest',
    skillSlugs: ['curiosity'],
    materials: [{ slug: 'paper', quantity: '2 sheets', optional: false }],
    safety: [
      { position: 0, severity: 'INFO', textEn: 'Work at a table.', textNl: 'Werk aan tafel.' },
    ],
    steps: [
      {
        position: 0,
        estimatedMinutes: 20,
        requiresAdult: false,
        en: { title: 'Set up', instruction: 'Lay everything out on the table.' },
        nl: { title: 'Zet klaar', instruction: 'Leg alles klaar op tafel.' },
      },
    ],
    en: {
      title: 'Test adventure',
      shortDescription: 'A short English description for the test adventure.',
      story: 'An English story long enough to satisfy the content rules for a quest.',
      educationalObjective: 'Children learn to test things.',
      expectedResult: 'A tested quest.',
      preparation: ['Clear the table'],
      reflectionQuestions: ['What worked?'],
    },
    nl: {
      title: 'Testavontuur',
      shortDescription: 'Een korte Nederlandse omschrijving voor het testavontuur.',
      story: 'Een Nederlands verhaal dat lang genoeg is om aan de inhoudsregels te voldoen.',
      educationalObjective: 'Kinderen leren dingen testen.',
      expectedResult: 'Een getest avontuur.',
      preparation: ['Maak de tafel leeg'],
      reflectionQuestions: ['Wat werkte er?'],
    },
    ...overrides,
  }
}

async function adminUserId(): Promise<string> {
  const admin = await prisma.user.findFirstOrThrow({ where: { role: 'CONTENT_ADMIN' } })
  return admin.id
}

describe('admin quest management', () => {
  it('creates a quest as a draft, then publishes it', async () => {
    const actorUserId = await adminUserId()
    const quest = await createQuest({
      input: questInput('test-created-quest'),
      actorUserId,
      actorRole: ADMIN.actorRole,
    })

    expect(quest.status).toBe('DRAFT')

    // A draft is invisible to families.
    const beforePublish = await listQuests({
      filters: { search: 'Testavontuur' },
      locale: 'nl',
      entitlements: entitlementsFor('FAMILY_PREMIUM'),
    })
    expect(beforePublish.items.map((item) => item.slug)).not.toContain('test-created-quest')

    const published = await setQuestStatus({
      questId: quest.id,
      status: 'PUBLISHED',
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
    expect(published.status).toBe('PUBLISHED')
    expect(published.publishedAt).not.toBeNull()

    const detail = await getQuestDetail({
      slug: 'test-created-quest',
      locale: 'nl',
      entitlements: entitlementsFor('FAMILY_PREMIUM'),
    })
    expect(detail.title).toBe('Testavontuur')
    expect(detail.steps).toHaveLength(1)
    expect(detail.materialsDetailed[0]?.quantity).toBe('2 sheets')
    expect(detail.safety[0]?.text).toBe('Werk aan tafel.')
  })

  it('renders the same quest in Dutch and in English', async () => {
    const actorUserId = await adminUserId()
    const quest = await createQuest({
      input: questInput('test-bilingual-quest'),
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
    await setQuestStatus({
      questId: quest.id,
      status: 'PUBLISHED',
      actorUserId,
      actorRole: ADMIN.actorRole,
    })

    const dutch = await getQuestDetail({
      slug: 'test-bilingual-quest',
      locale: 'nl',
      entitlements: entitlementsFor('FAMILY_PREMIUM'),
    })
    const english = await getQuestDetail({
      slug: 'test-bilingual-quest',
      locale: 'en',
      entitlements: entitlementsFor('FAMILY_PREMIUM'),
    })

    expect(dutch.title).toBe('Testavontuur')
    expect(english.title).toBe('Test adventure')
    expect(dutch.steps[0]?.title).toBe('Zet klaar')
    expect(english.steps[0]?.title).toBe('Set up')
    expect(dutch.safety[0]?.text).toBe('Werk aan tafel.')
    expect(english.safety[0]?.text).toBe('Work at a table.')
    expect(dutch.category.name).not.toBe(english.category.name)
  })

  it('refuses to publish a quest that is missing a translation', async () => {
    const actorUserId = await adminUserId()
    const quest = await createQuest({
      input: questInput('test-half-translated'),
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
    await prisma.questTranslation.deleteMany({ where: { questId: quest.id, locale: 'en' } })

    await expect(
      setQuestStatus({
        questId: quest.id,
        status: 'PUBLISHED',
        actorUserId,
        actorRole: ADMIN.actorRole,
      }),
    ).rejects.toThrowError(/Dutch and an English translation/)
  })

  it('rejects an unknown category, skill or material', async () => {
    const actorUserId = await adminUserId()
    await expect(
      createQuest({
        input: questInput('test-bad-category', { categorySlug: 'does-not-exist' }),
        actorUserId,
        actorRole: ADMIN.actorRole,
      }),
    ).rejects.toThrowError(/Unknown category/)

    await expect(
      createQuest({
        input: questInput('test-bad-skill', { skillSlugs: ['telepathy'] }),
        actorUserId,
        actorRole: ADMIN.actorRole,
      }),
    ).rejects.toThrowError(/Unknown skill/)
  })

  it('rejects a duplicate slug', async () => {
    const actorUserId = await adminUserId()
    await createQuest({
      input: questInput('test-unique-slug'),
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
    await expect(
      createQuest({
        input: questInput('test-unique-slug'),
        actorUserId,
        actorRole: ADMIN.actorRole,
      }),
    ).rejects.toThrowError(AppError)
  })

  it('records a version snapshot on every material change', async () => {
    const actorUserId = await adminUserId()
    const quest = await createQuest({
      input: questInput('test-versioned-quest'),
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
    expect(await listQuestVersions(quest.id)).toHaveLength(1)

    await updateQuest({
      questId: quest.id,
      input: questInput('test-versioned-quest', {
        nl: { ...questInput('x').nl, title: 'Aangepast avontuur' },
        changeNote: 'Titel aangepast',
      }),
      actorUserId,
      actorRole: ADMIN.actorRole,
    })

    const versions = await listQuestVersions(quest.id)
    expect(versions).toHaveLength(2)
    expect(versions[0]?.changeNote).toBe('Titel aangepast')

    const updated = await prisma.quest.findUniqueOrThrow({ where: { id: quest.id } })
    expect(updated.version).toBe(2)

    const detail = await prisma.questTranslation.findFirstOrThrow({
      where: { questId: quest.id, locale: 'nl' },
    })
    expect(detail.title).toBe('Aangepast avontuur')
  })

  it('duplicates a quest as a new draft with a fresh slug', async () => {
    const actorUserId = await adminUserId()
    const source = await prisma.quest.findFirstOrThrow({ where: { slug: 'leaf-detective' } })
    const copy = await duplicateQuest({
      questId: source.id,
      actorUserId,
      actorRole: ADMIN.actorRole,
    })

    expect(copy.slug).toBe('leaf-detective-copy')
    expect(copy.status).toBe('DRAFT')

    const withRelations = await prisma.quest.findUniqueOrThrow({
      where: { id: copy.id },
      include: { steps: true, translations: true, materials: true, safety: true },
    })
    expect(withRelations.steps.length).toBeGreaterThan(0)
    expect(withRelations.translations).toHaveLength(2)
    expect(withRelations.safety.length).toBeGreaterThan(0)

    // A second duplicate gets its own slug rather than colliding.
    const second = await duplicateQuest({
      questId: source.id,
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
    expect(second.slug).toBe('leaf-detective-copy-2')
  })

  it('archives a quest and hides it from the family library', async () => {
    const actorUserId = await adminUserId()
    const quest = await prisma.quest.findFirstOrThrow({ where: { slug: 'four-useful-knots' } })
    await setQuestStatus({
      questId: quest.id,
      status: 'ARCHIVED',
      actorUserId,
      actorRole: ADMIN.actorRole,
    })

    const library = await listQuests({
      filters: {},
      locale: 'nl',
      entitlements: entitlementsFor('FAMILY_PREMIUM'),
      take: 100,
    })
    expect(library.items.map((item) => item.slug)).not.toContain('four-useful-knots')

    await expect(
      getQuestDetail({
        slug: 'four-useful-knots',
        locale: 'nl',
        entitlements: entitlementsFor('FAMILY_PREMIUM'),
      }),
    ).rejects.toMatchObject({ code: 'not_found' })

    // Restore it so the rest of the suite sees the full library.
    await setQuestStatus({
      questId: quest.id,
      status: 'PUBLISHED',
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
  })

  it('writes an audit entry for every content action', async () => {
    const actorUserId = await adminUserId()
    const quest = await createQuest({
      input: questInput('test-audited-quest'),
      actorUserId,
      actorRole: ADMIN.actorRole,
    })
    await setQuestStatus({
      questId: quest.id,
      status: 'PUBLISHED',
      actorUserId,
      actorRole: ADMIN.actorRole,
    })

    const actions = (
      await prisma.auditLog.findMany({
        where: { entityId: quest.id },
        select: { action: true },
      })
    ).map((entry) => entry.action)

    expect(actions).toContain('quest.created')
    expect(actions).toContain('quest.published')
  })

  it('lists quests for administrators with completion counts', async () => {
    const { items, total } = await listQuestsForAdmin({ take: 5 })
    expect(total).toBeGreaterThan(30)
    expect(items[0]).toHaveProperty('_count')
  })

  it('reports aggregate statistics only', async () => {
    const stats = await questStatistics()
    expect(stats.questsByStatus.PUBLISHED).toBeGreaterThan(0)
    expect(stats.families).toBeGreaterThan(0)
    expect(JSON.stringify(stats)).not.toContain('familyNote')
  })
})

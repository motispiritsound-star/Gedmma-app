/**
 * Repeatable development seed.
 *
 * Running this twice is safe: taxonomies are upserted by slug, quests are
 * replaced by slug, and the demo family is rebuilt from scratch each time.
 *
 * Never run against production - `ALLOW_SEED` must be enabled, and the env
 * validator refuses `ALLOW_SEED` when `NODE_ENV=production`.
 */
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import { hashPassword } from '../src/lib/crypto'
import { badges, categories, interests, materials, skills } from './seed-data/taxonomy'
import { seedQuests } from './seed-data/quests'
import type { SeedQuest } from './seed-data/quest-types'

const DEMO = {
  parentEmail: 'ouder@questly.test',
  parentPassword: 'AvontuurThuis2026',
  adminEmail: 'admin@questly.test',
  adminPassword: 'BeheerQuestly2026',
  contentEmail: 'redactie@questly.test',
  contentPassword: 'RedactieQuestly2026',
}

function requireEnv(): { databaseUrl: string } {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is required to seed.')
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed with NODE_ENV=production.')
  }
  if (process.env.ALLOW_SEED !== 'true' && process.env.ALLOW_SEED !== '1') {
    throw new Error('Set ALLOW_SEED=true to run the seed script.')
  }
  return { databaseUrl }
}

const { databaseUrl } = requireEnv()
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })

async function seedTaxonomy() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category },
      update: { ...category },
    })
  }

  for (const skill of skills) {
    await prisma.skill.upsert({ where: { slug: skill.slug }, create: skill, update: skill })
  }

  for (const interest of interests) {
    const category = await prisma.category.findUnique({ where: { slug: interest.category } })
    const data = {
      slug: interest.slug,
      nameEn: interest.nameEn,
      nameNl: interest.nameNl,
      categoryId: category?.id ?? null,
    }
    await prisma.interest.upsert({ where: { slug: interest.slug }, create: data, update: data })
  }

  for (const material of materials) {
    const data = {
      slug: material.slug,
      nameEn: material.nameEn,
      nameNl: material.nameNl,
      isCommon: 'isCommon' in material ? material.isCommon : true,
    }
    await prisma.material.upsert({ where: { slug: material.slug }, create: data, update: data })
  }

  for (const badge of badges) {
    const category =
      'category' in badge ? await prisma.category.findUnique({ where: { slug: badge.category } }) : null
    const skill = 'skill' in badge ? await prisma.skill.findUnique({ where: { slug: badge.skill } }) : null
    const data = {
      slug: badge.slug,
      nameEn: badge.nameEn,
      nameNl: badge.nameNl,
      descriptionEn: badge.descriptionEn,
      descriptionNl: badge.descriptionNl,
      icon: badge.icon,
      criteria: badge.criteria,
      threshold: badge.threshold,
      categoryId: category?.id ?? null,
      skillId: skill?.id ?? null,
    }
    await prisma.badge.upsert({ where: { slug: badge.slug }, create: data, update: data })
  }

  console.log(
    `  taxonomy: ${categories.length} categories, ${skills.length} skills, ${interests.length} interests, ${materials.length} materials, ${badges.length} badges`,
  )
}

async function seedQuest(quest: SeedQuest, adminUserId: string) {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: quest.category } })
  const skillRows = await prisma.skill.findMany({ where: { slug: { in: quest.skills } } })
  const materialRows = await prisma.material.findMany({
    where: { slug: { in: quest.materials.map((entry) => entry.slug) } },
  })

  const missingSkill = quest.skills.find((slug) => !skillRows.some((row) => row.slug === slug))
  if (missingSkill) throw new Error(`Quest ${quest.slug} references unknown skill ${missingSkill}`)
  const missingMaterial = quest.materials.find(
    (entry) => !materialRows.some((row) => row.slug === entry.slug),
  )
  if (missingMaterial) {
    throw new Error(`Quest ${quest.slug} references unknown material ${missingMaterial.slug}`)
  }

  // Replace rather than patch: the seed is the source of truth for these rows.
  await prisma.quest.deleteMany({ where: { slug: quest.slug } })

  await prisma.quest.create({
    data: {
      slug: quest.slug,
      categoryId: category.id,
      ageBands: quest.ageBands,
      durationMinutes: quest.durationMinutes,
      difficulty: quest.difficulty,
      setting: quest.setting,
      weather: quest.weather,
      seasons: quest.seasons ?? [],
      minParticipants: quest.minParticipants,
      maxParticipants: quest.maxParticipants,
      requiresAdult: quest.requiresAdult ?? false,
      isPremium: quest.isPremium ?? false,
      imageKey: quest.slug,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      translations: {
        create: (['en', 'nl'] as const).map((locale) => ({
          locale,
          title: quest[locale].title,
          shortDescription: quest[locale].shortDescription,
          story: quest[locale].story,
          educationalObjective: quest[locale].educationalObjective,
          expectedResult: quest[locale].expectedResult,
          preparation: quest[locale].preparation,
          reflectionQuestions: quest[locale].reflectionQuestions,
        })),
      },
      skills: { create: skillRows.map((skill) => ({ skillId: skill.id })) },
      materials: {
        create: quest.materials.map((entry) => ({
          materialId: materialRows.find((row) => row.slug === entry.slug)!.id,
          quantity: entry.quantity ?? null,
          optional: entry.optional ?? false,
        })),
      },
      safety: {
        create: (quest.safety ?? []).map((entry, index) => ({
          position: index,
          severity: entry.severity,
          textEn: entry.en,
          textNl: entry.nl,
        })),
      },
      steps: {
        create: quest.steps.map((step, index) => ({
          position: index,
          estimatedMinutes: step.minutes,
          requiresAdult: step.requiresAdult ?? false,
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

  const created = await prisma.quest.findUniqueOrThrow({ where: { slug: quest.slug } })
  await prisma.questVersion.create({
    data: {
      questId: created.id,
      version: 1,
      snapshot: { source: 'seed', slug: quest.slug },
      changeNote: 'Seeded',
      changedByUserId: adminUserId,
    },
  })
}

async function seedUsers() {
  const [parentHash, adminHash, contentHash] = await Promise.all([
    hashPassword(DEMO.parentPassword),
    hashPassword(DEMO.adminPassword),
    hashPassword(DEMO.contentPassword),
  ])

  const admin = await prisma.user.upsert({
    where: { email: DEMO.adminEmail },
    create: {
      email: DEMO.adminEmail,
      passwordHash: adminHash,
      displayName: 'Platform Admin',
      role: 'PLATFORM_ADMIN',
      emailVerifiedAt: new Date(),
      locale: 'nl',
    },
    update: { passwordHash: adminHash, role: 'PLATFORM_ADMIN', deletedAt: null },
  })

  const contentAdmin = await prisma.user.upsert({
    where: { email: DEMO.contentEmail },
    create: {
      email: DEMO.contentEmail,
      passwordHash: contentHash,
      displayName: 'Content Redactie',
      role: 'CONTENT_ADMIN',
      emailVerifiedAt: new Date(),
      locale: 'nl',
    },
    update: { passwordHash: contentHash, role: 'CONTENT_ADMIN', deletedAt: null },
  })

  const parent = await prisma.user.upsert({
    where: { email: DEMO.parentEmail },
    create: {
      email: DEMO.parentEmail,
      passwordHash: parentHash,
      displayName: 'Sanne de Vries',
      role: 'PARENT',
      emailVerifiedAt: new Date(),
      locale: 'nl',
    },
    update: { passwordHash: parentHash, deletedAt: null },
  })

  return { admin, contentAdmin, parent }
}

async function seedDemoFamily(parentId: string) {
  // Rebuild the demo family from scratch so re-seeding is deterministic.
  const existing = await prisma.familyMembership.findMany({ where: { userId: parentId } })
  if (existing.length > 0) {
    await prisma.family.deleteMany({ where: { id: { in: existing.map((row) => row.familyId) } } })
  }

  const family = await prisma.family.create({
    data: {
      name: 'Familie de Vries',
      locale: 'nl',
      environment: 'SUBURB',
      preferredDuration: 60,
      preferredDifficulty: 'MEDIUM',
      preferredSetting: 'BOTH',
      prefersFamilyActivity: true,
      adultCount: 2,
      requireParentApproval: true,
      onboardingCompletedAt: new Date(),
      memberships: { create: { userId: parentId, role: 'OWNER' } },
      subscription: {
        create: {
          plan: 'FAMILY_PREMIUM',
          status: 'ACTIVE',
          provider: process.env.PAYMENT_DRIVER ?? 'mock',
          providerSubscriptionId: 'mock_sub_demo',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    },
  })

  const interestBySlug = new Map(
    (await prisma.interest.findMany()).map((interest) => [interest.slug, interest.id]),
  )
  const pickInterests = (slugs: string[]) =>
    slugs.flatMap((slug) => {
      const id = interestBySlug.get(slug)
      return id ? [{ interestId: id }] : []
    })

  const noor = await prisma.childProfile.create({
    data: {
      familyId: family.id,
      nickname: 'Noor',
      ageBand: 'AGE_6_8',
      avatarKey: 'otter',
      interests: { create: pickInterests(['animals', 'drawing', 'baking']) },
    },
  })

  const sem = await prisma.childProfile.create({
    data: {
      familyId: family.id,
      nickname: 'Sem',
      ageBand: 'AGE_12_15',
      avatarKey: 'badger',
      interests: { create: pickInterests(['building', 'computers', 'money', 'sports']) },
    },
  })

  return { family, children: [noor, sem] }
}

async function seedActivity(familyId: string, parentId: string, childIds: string[]) {
  const quests = await prisma.quest.findMany({
    where: { slug: { in: ['leaf-detective', 'density-tower', 'story-in-six-objects', 'sew-a-button'] } },
    include: { translations: true },
  })
  const bySlug = new Map(quests.map((quest) => [quest.slug, quest]))
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const completed = [
    { slug: 'leaf-detective', days: 12, minutes: 50, note: 'Noor vond een blad zo groot als haar hoofd.' },
    { slug: 'density-tower', days: 6, minutes: 35, note: null },
    { slug: 'story-in-six-objects', days: 2, minutes: 45, note: 'De sok werd een ruimteschip.' },
  ]

  for (const entry of completed) {
    const quest = bySlug.get(entry.slug)
    if (!quest) continue
    const translation = quest.translations.find((row) => row.locale === 'nl')
    await prisma.questCompletion.create({
      data: {
        familyId,
        questId: quest.id,
        status: 'APPROVED',
        startedAt: daysAgo(entry.days),
        finishedAt: daysAgo(entry.days),
        approvedAt: daysAgo(entry.days),
        approvedByUserId: parentId,
        startedByUserId: parentId,
        offlineMinutes: entry.minutes,
        familyNote: entry.note,
        locale: 'nl',
        participants: { create: childIds.map((id) => ({ childProfileId: id })) },
        reflections: {
          create: (translation?.reflectionQuestions ?? []).slice(0, 2).map((question, index) => ({
            position: index,
            question,
            answer: index === 0 ? 'Dat viel echt tegen, maar het lukte.' : 'We willen dit nog een keer doen.',
          })),
        },
      },
    })
  }

  // One completion waiting for a parent to approve it.
  const pendingQuest = bySlug.get('sew-a-button')
  if (pendingQuest) {
    await prisma.questCompletion.create({
      data: {
        familyId,
        questId: pendingQuest.id,
        status: 'PENDING_APPROVAL',
        startedAt: daysAgo(1),
        finishedAt: daysAgo(1),
        startedByUserId: parentId,
        offlineMinutes: 25,
        locale: 'nl',
        participants: { create: [{ childProfileId: childIds[1] ?? childIds[0]! }] },
      },
    })
  }

  const favouriteSlugs = ['insect-hotel', 'budget-family-meal', 'grandparent-interview']
  const favourites = await prisma.quest.findMany({ where: { slug: { in: favouriteSlugs } } })
  for (const quest of favourites) {
    await prisma.favouriteQuest.create({ data: { familyId, questId: quest.id } })
  }

  const plannedSlugs = ['bridge-that-carries-five-kilos', 'flatbread-from-scratch', 'secret-act-of-kindness']
  const planned = await prisma.quest.findMany({ where: { slug: { in: plannedSlugs } } })
  const monday = startOfWeek(new Date())
  for (const [index, quest] of planned.entries()) {
    await prisma.plannedQuest.create({
      data: {
        familyId,
        questId: quest.id,
        scheduledFor: addDays(monday, index * 2 + 1),
        timeOfDay: index === 0 ? 'AFTERNOON' : 'MORNING',
        status: 'PLANNED',
      },
    })
  }

  const { evaluateBadgesForFamily } = await import('../src/modules/progress/badges')
  await evaluateBadgesForFamily({ familyId })
}

function startOfWeek(date: Date): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = (copy.getUTCDay() + 6) % 7
  copy.setUTCDate(copy.getUTCDate() - day)
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

async function main() {
  console.log('Seeding Questly…')

  await seedTaxonomy()

  const { admin, contentAdmin, parent } = await seedUsers()
  console.log(`  users: ${[admin, contentAdmin, parent].length} demo accounts`)

  for (const quest of seedQuests) {
    await seedQuest(quest, contentAdmin.id)
  }
  const published = await prisma.quest.count({ where: { status: 'PUBLISHED' } })
  const premium = await prisma.quest.count({ where: { status: 'PUBLISHED', isPremium: true } })
  console.log(`  quests: ${published} published (${premium} premium, ${published - premium} free)`)

  const { family, children } = await seedDemoFamily(parent.id)
  await seedActivity(
    family.id,
    parent.id,
    children.map((child) => child.id),
  )
  console.log(`  demo family: "${family.name}" with ${children.length} child profiles`)

  console.log('\nDevelopment accounts (never use these in production):')
  console.log(`  parent        ${DEMO.parentEmail} / ${DEMO.parentPassword}`)
  console.log(`  content admin ${DEMO.contentEmail} / ${DEMO.contentPassword}`)
  console.log(`  platform admin ${DEMO.adminEmail} / ${DEMO.adminPassword}`)
  console.log('\nDone.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

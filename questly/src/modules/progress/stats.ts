import { prisma } from '@/lib/db'
import type { Locale } from '@/modules/localisation'

/**
 * Family dashboard figures.
 *
 * `offlineMinutes` is what the family typed in, and the UI is required to label
 * it as self-reported. Questly makes no claim about total device use.
 */

export type CategoryProgress = {
  slug: string
  name: string
  icon: string
  colorToken: string
  completed: number
  total: number
}

export type SkillProgress = {
  slug: string
  name: string
  points: number
}

export type ChildProgress = {
  id: string
  nickname: string
  avatarKey: string
  ageBand: string
  completed: number
  categories: number
}

export type FamilyStats = {
  completedCount: number
  pendingCount: number
  inProgressCount: number
  plannedCount: number
  favouriteCount: number
  reportedOfflineMinutes: number
  categories: CategoryProgress[]
  skills: SkillProgress[]
  children: ChildProgress[]
  categoriesExplored: number
  categoriesTotal: number
}

export async function getFamilyStats(familyId: string, locale: Locale): Promise<FamilyStats> {
  const pick = (row: { nameEn: string; nameNl: string }) => (locale === 'nl' ? row.nameNl : row.nameEn)

  const [completions, pendingCount, inProgressCount, plannedCount, favouriteCount, categories, skills, children] =
    await Promise.all([
      prisma.questCompletion.findMany({
        where: { familyId, status: 'APPROVED' },
        include: {
          quest: { include: { category: true, skills: { include: { skill: true } } } },
          participants: true,
        },
      }),
      prisma.questCompletion.count({ where: { familyId, status: 'PENDING_APPROVAL' } }),
      prisma.questCompletion.count({ where: { familyId, status: 'IN_PROGRESS' } }),
      prisma.plannedQuest.count({ where: { familyId, status: 'PLANNED' } }),
      prisma.favouriteQuest.count({ where: { familyId } }),
      prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.skill.findMany({ orderBy: { slug: 'asc' } }),
      prisma.childProfile.findMany({
        where: { familyId, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      }),
    ])

  const perCategory = new Map<string, number>()
  const perSkill = new Map<string, number>()
  const perChild = new Map<string, { completed: number; categories: Set<string> }>()
  let reportedOfflineMinutes = 0

  for (const completion of completions) {
    reportedOfflineMinutes += completion.offlineMinutes
    const categoryId = completion.quest.categoryId
    perCategory.set(categoryId, (perCategory.get(categoryId) ?? 0) + 1)

    for (const link of completion.quest.skills) {
      perSkill.set(link.skillId, (perSkill.get(link.skillId) ?? 0) + link.weight)
    }

    for (const participant of completion.participants) {
      const entry = perChild.get(participant.childProfileId) ?? {
        completed: 0,
        categories: new Set<string>(),
      }
      entry.completed += 1
      entry.categories.add(categoryId)
      perChild.set(participant.childProfileId, entry)
    }
  }

  const questCountsByCategory = await prisma.quest.groupBy({
    by: ['categoryId'],
    where: { status: 'PUBLISHED' },
    _count: { _all: true },
  })
  const totalByCategory = new Map(
    questCountsByCategory.map((row) => [row.categoryId, row._count._all]),
  )

  return {
    completedCount: completions.length,
    pendingCount,
    inProgressCount,
    plannedCount,
    favouriteCount,
    reportedOfflineMinutes,
    categories: categories.map((category) => ({
      slug: category.slug,
      name: pick(category),
      icon: category.icon,
      colorToken: category.colorToken,
      completed: perCategory.get(category.id) ?? 0,
      total: totalByCategory.get(category.id) ?? 0,
    })),
    skills: skills
      .map((skill) => ({ slug: skill.slug, name: pick(skill), points: perSkill.get(skill.id) ?? 0 }))
      .sort((a, b) => b.points - a.points),
    children: children.map((child) => ({
      id: child.id,
      nickname: child.nickname,
      avatarKey: child.avatarKey,
      ageBand: child.ageBand,
      completed: perChild.get(child.id)?.completed ?? 0,
      categories: perChild.get(child.id)?.categories.size ?? 0,
    })),
    categoriesExplored: perCategory.size,
    categoriesTotal: categories.length,
  }
}

export async function listFamilyMemories(familyId: string) {
  return prisma.questCompletion.findMany({
    where: { familyId, status: 'APPROVED', OR: [{ familyNote: { not: null } }, { evidence: { some: {} } }] },
    include: {
      quest: { include: { translations: true, category: true } },
      evidence: { select: { id: true, caption: true, createdAt: true } },
      participants: { include: { childProfile: { select: { id: true, nickname: true } } } },
    },
    orderBy: { finishedAt: 'desc' },
    take: 30,
  })
}

export async function listPendingApprovals(familyId: string) {
  return prisma.questCompletion.findMany({
    where: { familyId, status: 'PENDING_APPROVAL' },
    include: {
      quest: { include: { translations: true, category: true } },
      participants: { include: { childProfile: { select: { id: true, nickname: true } } } },
    },
    orderBy: { finishedAt: 'desc' },
  })
}

export async function listCompletions(familyId: string, take = 20) {
  return prisma.questCompletion.findMany({
    where: { familyId, status: { in: ['APPROVED', 'PENDING_APPROVAL'] } },
    include: {
      quest: { include: { translations: true, category: true } },
      participants: { include: { childProfile: { select: { id: true, nickname: true } } } },
    },
    orderBy: { finishedAt: 'desc' },
    take,
  })
}

export async function getInProgressCompletion(familyId: string) {
  return prisma.questCompletion.findFirst({
    where: { familyId, status: 'IN_PROGRESS' },
    include: { quest: { include: { translations: true } } },
    orderBy: { startedAt: 'desc' },
  })
}

import "server-only";
import { prisma } from "@/lib/db";
import { pickText, type AppLocale } from "@/modules/i18n";
import { grantUrls } from "@/modules/media";

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

/**
 * Everything the family dashboard needs, in one place.
 *
 * `offlineMinutes` is the sum of what families reported themselves. It is
 * labelled as an estimate everywhere it appears - Questly cannot measure real
 * screen time and does not claim to.
 */
export async function getDashboard(params: { familyId: string; locale: AppLocale }) {
  const { familyId, locale } = params;

  const [completions, planned, favourites, children, awarded, categories] = await Promise.all([
    prisma.questCompletion.findMany({
      where: { familyId, status: { in: ["APPROVED", "AWAITING_APPROVAL", "REJECTED"] } },
      orderBy: [{ finishedAt: "desc" }],
      take: 100,
      include: {
        quest: { include: { category: true, translations: true, skills: { include: { skill: true } } } },
        participants: { include: { childProfile: { select: { id: true, nickname: true, avatarKey: true } } } },
        evidence: { where: { deletedAt: null }, select: { id: true, mimeType: true, createdAt: true } },
        reflections: { select: { id: true, prompt: true, answer: true } },
      },
    }),
    prisma.plannedQuest.findMany({
      where: { familyId, completedAt: null, scheduledFor: { gte: startOfToday() } },
      orderBy: { scheduledFor: "asc" },
      take: 10,
      include: { quest: { include: { category: true, translations: true } } },
    }),
    prisma.favouriteQuest.findMany({
      where: { familyId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { quest: { include: { category: true, translations: true } } },
    }),
    prisma.childProfile.findMany({ where: { familyId, deletedAt: null }, orderBy: { createdAt: "asc" } }),
    prisma.awardedBadge.findMany({
      where: { familyId },
      orderBy: { awardedAt: "desc" },
      include: { badge: true, childProfile: { select: { id: true, nickname: true } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const approved = completions.filter((c) => c.status === "APPROVED");
  const awaiting = completions.filter((c) => c.status === "AWAITING_APPROVAL");

  const offlineMinutes = approved.reduce((total, c) => total + c.minutesSpent, 0);

  const exploredCategoryIds = new Set(approved.map((c) => c.quest.categoryId));
  const categoryProgress = categories.map((category) => ({
    slug: category.slug,
    name: pickText(locale, category.nameNl, category.nameEn),
    colorToken: category.colorToken,
    icon: category.icon,
    completed: approved.filter((c) => c.quest.categoryId === category.id).length,
    explored: exploredCategoryIds.has(category.id),
  }));

  const skillTally = new Map<string, { slug: string; name: string; count: number }>();
  for (const completion of approved) {
    for (const link of completion.quest.skills) {
      const key = link.skill.slug;
      const entry = skillTally.get(key) ?? {
        slug: key,
        name: pickText(locale, link.skill.nameNl, link.skill.nameEn),
        count: 0,
      };
      entry.count += 1;
      skillTally.set(key, entry);
    }
  }

  const perChild = children.map((child) => {
    const theirs = approved.filter((c) => c.participants.some((p) => p.childProfileId === child.id));
    return {
      id: child.id,
      nickname: child.nickname,
      avatarKey: child.avatarKey,
      ageBand: child.ageBand,
      completed: theirs.length,
      minutes: theirs.reduce((total, c) => total + c.minutesSpent, 0),
      badges: awarded.filter((a) => a.childProfileId === child.id).length,
    };
  });

  const memories = approved
    .filter((c) => c.evidence.length > 0 || c.familyNote)
    .slice(0, 12)
    .map((c) => ({
      completionId: c.id,
      questTitle: title(c.quest.translations, locale),
      finishedAt: c.finishedAt,
      note: c.familyNote,
      images: grantUrls(c.evidence, familyId),
    }));

  return {
    counts: {
      completed: approved.length,
      awaiting: awaiting.length,
      planned: planned.length,
      favourites: favourites.length,
      badges: awarded.length,
      categoriesExplored: exploredCategoryIds.size,
      categoriesTotal: categories.length,
    },
    offlineMinutes,
    completions: approved.slice(0, 10).map((c) => ({
      id: c.id,
      slug: c.quest.slug,
      title: title(c.quest.translations, locale),
      categoryName: pickText(locale, c.quest.category.nameNl, c.quest.category.nameEn),
      finishedAt: c.finishedAt,
      minutesSpent: c.minutesSpent,
      participants: c.participants.map((p) => p.childProfile),
    })),
    awaiting: awaiting.map((c) => ({
      id: c.id,
      slug: c.quest.slug,
      title: title(c.quest.translations, locale),
      finishedAt: c.finishedAt,
    })),
    planned: planned.map((p) => ({
      id: p.id,
      slug: p.quest.slug,
      title: title(p.quest.translations, locale),
      scheduledFor: p.scheduledFor,
      categoryName: pickText(locale, p.quest.category.nameNl, p.quest.category.nameEn),
    })),
    favourites: favourites.map((f) => ({
      id: f.id,
      slug: f.quest.slug,
      title: title(f.quest.translations, locale),
      categoryName: pickText(locale, f.quest.category.nameNl, f.quest.category.nameEn),
    })),
    categoryProgress,
    skills: [...skillTally.values()].sort((a, b) => b.count - a.count),
    perChild,
    badges: awarded.map((a) => ({
      id: a.id,
      slug: a.badge.slug,
      name: pickText(locale, a.badge.nameNl, a.badge.nameEn),
      description: pickText(locale, a.badge.descriptionNl, a.badge.descriptionEn),
      icon: a.badge.icon,
      awardedAt: a.awardedAt,
      childNickname: a.childProfile?.nickname ?? null,
    })),
    memories,
  };
}

function title(translations: { locale: "NL" | "EN"; title: string }[], locale: AppLocale): string {
  const wanted = locale === "en" ? "EN" : "NL";
  return translations.find((t) => t.locale === wanted)?.title ?? translations[0]?.title ?? "";
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

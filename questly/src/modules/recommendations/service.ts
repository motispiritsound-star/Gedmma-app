import "server-only";
import { prisma } from "@/lib/db";
import type { AppLocale } from "@/modules/i18n";
import { getEntitlements } from "@/modules/subscriptions";
import { listQuests } from "@/modules/quests/service";
import { recommend } from "./engine";
import { recommendationEnhancer } from "./ai-provider";
import { currentWeather } from "./weather";
import type { RecommendationContext, ScoredQuest } from "./types";

const RECENT_WINDOW = 5;

export async function buildContext(familyId: string, now = new Date()): Promise<RecommendationContext> {
  const [family, children, completions, { season, weather }] = await Promise.all([
    prisma.family.findUniqueOrThrow({ where: { id: familyId }, include: { preference: true } }),
    prisma.childProfile.findMany({
      where: { familyId, deletedAt: null },
      include: { interests: { include: { interest: { include: { category: true } } } } },
    }),
    prisma.questCompletion.findMany({
      where: { familyId, status: { in: ["APPROVED", "AWAITING_APPROVAL"] } },
      orderBy: { finishedAt: "desc" },
      take: 40,
      include: { quest: { include: { category: true, skills: { include: { skill: true } } } } },
    }),
    currentWeather(now),
  ]);

  const interestCategorySlugs: string[] = [];
  const interestNamesByCategory: Record<string, string> = {};
  for (const child of children) {
    for (const link of child.interests) {
      const category = link.interest.category;
      if (!category) continue;
      if (!interestCategorySlugs.includes(category.slug)) interestCategorySlugs.push(category.slug);
      interestNamesByCategory[category.slug] ??= link.interest.nameNl;
    }
  }

  const recent = completions.slice(0, RECENT_WINDOW);

  return {
    ageBands: [...new Set(children.map((c) => c.ageBand))],
    interestCategorySlugs,
    interestNamesByCategory,
    completedQuestSlugs: completions.map((c) => c.quest.slug),
    recentCategorySlugs: [...new Set(recent.map((c) => c.quest.category.slug))],
    recentSkillSlugs: [...new Set(recent.flatMap((c) => c.quest.skills.map((s) => s.skill.slug)))],
    preferredDurationMinutes: family.preference?.preferredDurationMinutes ?? 60,
    preferredDifficulty: family.preference?.preferredDifficulty ?? "EASY",
    settingPreference: family.preference?.settingPreference ?? "BOTH",
    availableMaterialSlugs: family.preference?.availableMaterialSlugs ?? [],
    familySize: children.length + 1,
    season,
    weather,
  };
}

/**
 * Localised interest names for the reason text. `buildContext` fills the map
 * with Dutch names because it does not know the request locale; this refreshes
 * them once the locale is known.
 */
async function localiseInterestNames(context: RecommendationContext, locale: AppLocale): Promise<void> {
  if (locale !== "en") return;
  const categories = await prisma.category.findMany({
    where: { slug: { in: context.interestCategorySlugs } },
    select: { slug: true, nameEn: true },
  });
  for (const category of categories) context.interestNamesByCategory[category.slug] = category.nameEn;
}

export async function getRecommendations(params: {
  familyId: string;
  locale: AppLocale;
  limit?: number;
  now?: Date;
}): Promise<ScoredQuest[]> {
  const now = params.now ?? new Date();
  const [context, entitlements] = await Promise.all([
    buildContext(params.familyId, now),
    getEntitlements(params.familyId),
  ]);
  await localiseInterestNames(context, params.locale);

  const { items } = await listQuests({ filters: {}, locale: params.locale, entitlements, take: 300 });
  const ranked = recommend(items, context, params.limit ?? 6);
  return recommendationEnhancer().enhance(ranked, context);
}

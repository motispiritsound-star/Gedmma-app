import type { Season } from "@prisma/client";
import type { QuestSummary } from "@/modules/quests/types";
import type { ReasonCode, RecommendationContext, Reason, ScoredQuest } from "./types";

/**
 * Deterministic scoring. Every signal is additive and bounded, so a change in
 * one dimension can never silently dominate the ranking, and the same input
 * always produces the same output - which is what makes it testable and what
 * lets the interface explain itself to a parent.
 */
export const WEIGHTS = {
  ageBand: 40,
  ageBandMismatch: -1000,
  interest: 22,
  duration: 14,
  difficulty: 10,
  setting: 10,
  weather: 8,
  season: 6,
  newCategory: 12,
  newSkill: 9,
  materials: 7,
  familySize: 5,
  alreadyCompleted: -60,
  notDoneYet: 4,
  premiumLocked: -25,
} as const;

/**
 * How informative each reason is to a parent, lowest number first. A quest
 * always collects more reasons than fit on a card, so the specific ones
 * ("develops a skill you have not practised") must win over the generic ones
 * ("suits the age band") when the list is trimmed.
 */
const REASON_PRIORITY: Record<ReasonCode, number> = {
  interest: 1,
  newSkill: 2,
  newCategory: 3,
  weather: 4,
  season: 5,
  materials: 6,
  ageBand: 7,
  duration: 8,
  difficulty: 9,
  setting: 10,
  familySize: 11,
  notDoneYet: 12,
};

const MAX_REASONS = 3;

function topReasons(reasons: Reason[]): Reason[] {
  return [...reasons]
    .sort((a, b) => REASON_PRIORITY[a.code] - REASON_PRIORITY[b.code])
    .slice(0, MAX_REASONS);
}

export function seasonFor(date: Date): Season {
  const month = date.getUTCMonth() + 1;
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  if (month >= 9 && month <= 11) return "AUTUMN";
  return "WINTER";
}

function durationCloseness(questMinutes: number, preferredMinutes: number): number {
  if (questMinutes <= preferredMinutes) return 1;
  const overrun = (questMinutes - preferredMinutes) / preferredMinutes;
  return Math.max(0, 1 - overrun);
}

const DIFFICULTY_ORDER = { EASY: 0, MEDIUM: 1, CHALLENGING: 2 } as const;

export function scoreQuest(quest: QuestSummary, context: RecommendationContext): ScoredQuest {
  const reasons: Reason[] = [];
  let score = 0;

  // Age band is a hard requirement, not a preference: an unsuitable quest must
  // never surface for a six-year-old because it scored well elsewhere.
  const matchingAgeBands = quest.ageBands.filter((band) => context.ageBands.includes(band));
  if (context.ageBands.length > 0 && matchingAgeBands.length === 0) {
    return { quest, score: WEIGHTS.ageBandMismatch, reasons: [] };
  }
  if (matchingAgeBands.length > 0) {
    score += WEIGHTS.ageBand;
    reasons.push({ code: "ageBand" });
  }

  if (context.interestCategorySlugs.includes(quest.category.slug)) {
    score += WEIGHTS.interest;
    reasons.push({
      code: "interest",
      params: { interest: context.interestNamesByCategory[quest.category.slug] ?? quest.category.name },
    });
  }

  const closeness = durationCloseness(quest.durationMinutes, context.preferredDurationMinutes);
  score += Math.round(WEIGHTS.duration * closeness);
  if (closeness === 1) reasons.push({ code: "duration", params: { minutes: String(quest.durationMinutes) } });

  const difficultyGap = Math.abs(DIFFICULTY_ORDER[quest.difficulty] - DIFFICULTY_ORDER[context.preferredDifficulty]);
  score += Math.round(WEIGHTS.difficulty * (1 - difficultyGap / 2));
  if (difficultyGap === 0) reasons.push({ code: "difficulty" });

  if (
    context.settingPreference === "BOTH" ||
    quest.setting === "BOTH" ||
    quest.setting === context.settingPreference
  ) {
    score += WEIGHTS.setting;
    if (context.settingPreference !== "BOTH" && quest.setting === context.settingPreference) {
      reasons.push({ code: "setting", params: { setting: quest.setting } });
    }
  }

  if (quest.weather === "ANY" || quest.weather === context.weather) {
    score += WEIGHTS.weather;
    if (quest.weather !== "ANY") reasons.push({ code: "weather", params: { weather: quest.weather } });
  }

  if (quest.seasons.includes(context.season)) {
    score += WEIGHTS.season;
    if (quest.seasons.length < 4) reasons.push({ code: "season", params: { season: context.season } });
  }

  if (!context.recentCategorySlugs.includes(quest.category.slug)) {
    score += WEIGHTS.newCategory;
    reasons.push({ code: "newCategory", params: { category: quest.category.name } });
  }

  const freshSkill = quest.skills.find((skill) => !context.recentSkillSlugs.includes(skill.slug));
  if (freshSkill) {
    score += WEIGHTS.newSkill;
    reasons.push({ code: "newSkill", params: { skill: freshSkill.name } });
  }

  const required = quest.materials.filter((m) => !m.optional);
  if (required.length === 0) {
    score += WEIGHTS.materials;
  } else if (
    context.availableMaterialSlugs.length > 0 &&
    required.every((m) => context.availableMaterialSlugs.includes(m.slug))
  ) {
    score += WEIGHTS.materials;
    reasons.push({ code: "materials" });
  }

  if (quest.minParticipants <= context.familySize && context.familySize <= quest.maxParticipants) {
    score += WEIGHTS.familySize;
  }

  if (context.completedQuestSlugs.includes(quest.slug)) {
    score += WEIGHTS.alreadyCompleted;
  } else {
    score += WEIGHTS.notDoneYet;
    reasons.push({ code: "notDoneYet" });
  }

  if (!quest.accessible) score += WEIGHTS.premiumLocked;

  return { quest, score, reasons: topReasons(reasons) };
}

/**
 * Ranks quests and diversifies the head of the list: at most two quests from
 * the same category in the top results, so a family is never funnelled into
 * one theme.
 */
export function recommend(
  quests: QuestSummary[],
  context: RecommendationContext,
  limit = 6,
): ScoredQuest[] {
  const scored = quests
    .map((quest) => scoreQuest(quest, context))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.quest.slug.localeCompare(b.quest.slug));

  const perCategory = new Map<string, number>();
  const picked: ScoredQuest[] = [];
  const overflow: ScoredQuest[] = [];

  for (const entry of scored) {
    const slug = entry.quest.category.slug;
    const used = perCategory.get(slug) ?? 0;
    if (used < 2 && picked.length < limit) {
      perCategory.set(slug, used + 1);
      picked.push(entry);
    } else {
      overflow.push(entry);
    }
  }

  return [...picked, ...overflow].slice(0, limit);
}

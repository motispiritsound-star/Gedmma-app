import type { AgeBand, Difficulty, Season, Setting, WeatherSuitability } from "@prisma/client";
import type { QuestSummary } from "@/modules/quests/types";

export type ReasonCode =
  | "ageBand"
  | "interest"
  | "duration"
  | "difficulty"
  | "setting"
  | "weather"
  | "season"
  | "newCategory"
  | "newSkill"
  | "materials"
  | "familySize"
  | "notDoneYet";

export type Reason = { code: ReasonCode; params?: Record<string, string> };

export type RecommendationContext = {
  ageBands: AgeBand[];
  /** Category slugs derived from each child's interests. */
  interestCategorySlugs: string[];
  /** Human-readable interest names keyed by category slug, for the reason text. */
  interestNamesByCategory: Record<string, string>;
  completedQuestSlugs: string[];
  recentCategorySlugs: string[];
  recentSkillSlugs: string[];
  preferredDurationMinutes: number;
  preferredDifficulty: Difficulty;
  settingPreference: Setting;
  availableMaterialSlugs: string[];
  familySize: number;
  season: Season;
  weather: WeatherSuitability;
};

export type ScoredQuest = {
  quest: QuestSummary;
  score: number;
  reasons: Reason[];
};

import type {
  AgeBand,
  Difficulty,
  QuestStatus,
  SafetySeverity,
  Season,
  Setting,
  WeatherSuitability,
} from "@prisma/client";

export type QuestSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  imageKey: string;
  ageBands: AgeBand[];
  durationMinutes: number;
  difficulty: Difficulty;
  setting: Setting;
  weather: WeatherSuitability;
  seasons: Season[];
  minParticipants: number;
  maxParticipants: number;
  isPremium: boolean;
  requiresAdultSupervision: boolean;
  safetyLevel: SafetySeverity;
  status: QuestStatus;
  category: { slug: string; name: string; colorToken: string; icon: string };
  skills: { slug: string; name: string }[];
  materials: { slug: string; name: string; optional: boolean; quantity: string | null }[];
  /** False when the family's plan does not include this quest. */
  accessible: boolean;
};

export type QuestStepView = {
  id: string;
  position: number;
  title: string;
  body: string;
  tip: string | null;
  durationMinutes: number | null;
  requiresParent: boolean;
};

export type QuestDetail = QuestSummary & {
  story: string;
  educationalObjective: string;
  expectedResult: string;
  preparation: string[];
  audioScript: string | null;
  steps: QuestStepView[];
  safetyInstructions: { id: string; severity: SafetySeverity; text: string }[];
  reflectionQuestions: { id: string; position: number; text: string }[];
};

export type QuestFilters = {
  ageBand?: AgeBand;
  maxDurationMinutes?: number;
  setting?: Setting;
  weather?: WeatherSuitability;
  participants?: number;
  categorySlug?: string;
  skillSlug?: string;
  difficulty?: Difficulty;
  materialSlug?: string;
  access?: "free" | "premium";
  search?: string;
};

export type LocalisedQuestText = {
  title: string;
  summary: string;
  story: string;
  educationalObjective: string;
  expectedResult: string;
  preparation: string[];
  audioScript?: string;
};

export type LocalisedStepText = { title: string; body: string; tip?: string };

export type QuestStepSeed = {
  durationMinutes?: number;
  requiresParent?: boolean;
  nl: LocalisedStepText;
  en: LocalisedStepText;
};

export type QuestSeed = {
  slug: string;
  categorySlug: string;
  ageBands: ("AGE_6_8" | "AGE_9_11" | "AGE_12_15")[];
  seasons?: ("SPRING" | "SUMMER" | "AUTUMN" | "WINTER")[];
  durationMinutes: number;
  difficulty: "EASY" | "MEDIUM" | "CHALLENGING";
  setting: "INDOOR" | "OUTDOOR" | "BOTH";
  weather?: "ANY" | "DRY" | "RAIN_FRIENDLY" | "WARM" | "COLD";
  minParticipants: number;
  maxParticipants: number;
  isPremium?: boolean;
  requiresAdultSupervision?: boolean;
  safetyLevel?: "INFO" | "WARNING" | "CRITICAL";
  skillSlugs: string[];
  materials: { slug: string; quantity?: string; optional?: boolean }[];
  nl: LocalisedQuestText;
  en: LocalisedQuestText;
  steps: QuestStepSeed[];
  safety: { severity: "INFO" | "WARNING" | "CRITICAL"; nl: string; en: string }[];
  reflections: { nl: string; en: string }[];
};

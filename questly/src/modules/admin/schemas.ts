import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.");

export const questTranslationSchema = z.object({
  title: z.string().trim().min(3).max(120),
  summary: z.string().trim().min(10).max(400),
  story: z.string().trim().min(10).max(4000),
  educationalObjective: z.string().trim().min(5).max(600),
  expectedResult: z.string().trim().min(5).max(600),
  preparation: z.array(z.string().trim().min(1).max(200)).max(10).default([]),
  audioScript: z.string().trim().max(4000).optional(),
});

export const questStepSchema = z.object({
  position: z.coerce.number().int().min(1).max(30),
  durationMinutes: z.coerce.number().int().min(1).max(240).optional(),
  requiresParent: z.coerce.boolean().default(false),
  nl: z.object({
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(5).max(2000),
    tip: z.string().trim().max(400).optional(),
  }),
  en: z.object({
    title: z.string().trim().min(2).max(120),
    body: z.string().trim().min(5).max(2000),
    tip: z.string().trim().max(400).optional(),
  }),
});

export const safetyInstructionSchema = z.object({
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  textNl: z.string().trim().min(3).max(400),
  textEn: z.string().trim().min(3).max(400),
});

export const reflectionQuestionSchema = z.object({
  textNl: z.string().trim().min(3).max(300),
  textEn: z.string().trim().min(3).max(300),
});

export const questUpsertSchema = z.object({
  slug: slugSchema,
  categorySlug: z.string().trim().min(1),
  ageBands: z.array(z.enum(["AGE_6_8", "AGE_9_11", "AGE_12_15"])).min(1, "Choose at least one age band."),
  seasons: z.array(z.enum(["SPRING", "SUMMER", "AUTUMN", "WINTER"])).min(1).default(["SPRING", "SUMMER", "AUTUMN", "WINTER"]),
  durationMinutes: z.coerce.number().int().min(10).max(480),
  difficulty: z.enum(["EASY", "MEDIUM", "CHALLENGING"]),
  setting: z.enum(["INDOOR", "OUTDOOR", "BOTH"]),
  weather: z.enum(["ANY", "DRY", "RAIN_FRIENDLY", "WARM", "COLD"]).default("ANY"),
  minParticipants: z.coerce.number().int().min(1).max(20),
  maxParticipants: z.coerce.number().int().min(1).max(40),
  isPremium: z.coerce.boolean().default(false),
  requiresAdultSupervision: z.coerce.boolean().default(false),
  safetyLevel: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
  imageKey: z.string().trim().max(60).default("default"),
  skillSlugs: z.array(z.string().trim().min(1)).max(10).default([]),
  materials: z
    .array(z.object({ slug: z.string().trim().min(1), quantity: z.string().trim().max(60).optional(), optional: z.coerce.boolean().default(false) }))
    .max(20)
    .default([]),
  nl: questTranslationSchema,
  en: questTranslationSchema,
  steps: z.array(questStepSchema).min(1, "Add at least one step.").max(20),
  safetyInstructions: z.array(safetyInstructionSchema).max(10).default([]),
  reflectionQuestions: z.array(reflectionQuestionSchema).min(1, "Add at least one reflection question.").max(5),
  changeNote: z.string().trim().max(280).optional(),
}).refine((v) => v.maxParticipants >= v.minParticipants, {
  message: "Maximum participants must be at least the minimum.",
  path: ["maxParticipants"],
});

export type QuestUpsertInput = z.infer<typeof questUpsertSchema>;

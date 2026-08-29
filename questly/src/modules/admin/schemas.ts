import { z } from 'zod'

const localeText = z.object({
  title: z.string().trim().min(3).max(120),
  shortDescription: z.string().trim().min(10).max(280),
  story: z.string().trim().min(20).max(4000),
  educationalObjective: z.string().trim().min(10).max(600),
  expectedResult: z.string().trim().min(5).max(600),
  preparation: z.array(z.string().trim().min(1).max(200)).max(12).default([]),
  reflectionQuestions: z.array(z.string().trim().min(3).max(300)).max(5).default([]),
})

const stepSchema = z.object({
  position: z.number().int().min(0).max(30),
  estimatedMinutes: z.number().int().min(1).max(180),
  requiresAdult: z.boolean().default(false),
  en: z.object({
    title: z.string().trim().min(2).max(120),
    instruction: z.string().trim().min(5).max(2000),
    audioScript: z.string().trim().max(2000).optional().nullable(),
  }),
  nl: z.object({
    title: z.string().trim().min(2).max(120),
    instruction: z.string().trim().min(5).max(2000),
    audioScript: z.string().trim().max(2000).optional().nullable(),
  }),
})

const safetySchema = z.object({
  position: z.number().int().min(0).max(20),
  severity: z.enum(['INFO', 'CAUTION', 'ADULT_REQUIRED']),
  textEn: z.string().trim().min(5).max(400),
  textNl: z.string().trim().min(5).max(400),
})

export const questInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase words separated by hyphens.'),
  categorySlug: z.string().trim().min(2),
  ageBands: z.array(z.enum(['AGE_6_8', 'AGE_9_11', 'AGE_12_15'])).min(1, 'Pick at least one age band.'),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  difficulty: z.enum(['EASY', 'MEDIUM', 'CHALLENGING']),
  setting: z.enum(['INDOOR', 'OUTDOOR', 'BOTH']),
  weather: z.array(z.enum(['ANY', 'DRY', 'RAIN_FRIENDLY', 'SNOW', 'WARM'])).default(['ANY']),
  seasons: z.array(z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'])).default([]),
  minParticipants: z.coerce.number().int().min(1).max(20),
  maxParticipants: z.coerce.number().int().min(1).max(40),
  requiresAdult: z.coerce.boolean().default(false),
  isPremium: z.coerce.boolean().default(false),
  imageKey: z.string().trim().min(1).max(80).default('quest-default'),
  skillSlugs: z.array(z.string().trim()).max(8).default([]),
  materials: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        quantity: z.string().trim().max(60).optional().nullable(),
        optional: z.boolean().default(false),
      }),
    )
    .max(20)
    .default([]),
  safety: z.array(safetySchema).max(10).default([]),
  steps: z.array(stepSchema).min(1, 'A quest needs at least one step.').max(20),
  en: localeText,
  nl: localeText,
  changeNote: z.string().trim().max(280).optional(),
})

export type QuestInput = z.infer<typeof questInputSchema>

/** The quest editor posts JSON; this parses the raw form payload. */
export const questFormSchema = z.object({
  payload: z.string().min(2),
})

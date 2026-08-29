import { z } from 'zod'

export const completionSubmissionSchema = z.object({
  completionId: z.cuid(),
  childProfileIds: z.array(z.cuid()).min(1, 'Pick at least one child profile.').max(10),
  offlineMinutes: z.coerce.number().int().min(0).max(600),
  familyNote: z.string().trim().max(2000).optional().or(z.literal('')),
  reflections: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        answer: z.string().trim().max(1000),
      }),
    )
    .max(5)
    .default([]),
})

export const plannedQuestSchema = z.object({
  questId: z.cuid(),
  scheduledFor: z.iso.date(),
  timeOfDay: z.enum(['MORNING', 'AFTERNOON', 'EVENING']).optional(),
  note: z.string().trim().max(280).optional().or(z.literal('')),
})

export type CompletionSubmission = z.infer<typeof completionSubmissionSchema>
export type PlannedQuestInput = z.infer<typeof plannedQuestSchema>

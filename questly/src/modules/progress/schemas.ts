import { z } from "zod";

export const startQuestSchema = z.object({
  questSlug: z.string().trim().min(1),
});

export const completionSchema = z.object({
  completionId: z.string().trim().min(1),
  minutesSpent: z.coerce.number().int().min(0).max(1440),
  childProfileIds: z.array(z.string().trim().min(1)).min(1, "Select at least one child profile."),
  familyNote: z.string().trim().max(2000).optional().default(""),
  reflections: z
    .array(z.object({ questionId: z.string().trim().min(1).optional(), prompt: z.string().trim().min(1), answer: z.string().trim().max(2000) }))
    .max(5)
    .default([]),
});

export const approvalSchema = z.object({
  completionId: z.string().trim().min(1),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional(),
});

export const plannedQuestSchema = z.object({
  questSlug: z.string().trim().min(1),
  scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  timeOfDay: z.enum(["MORNING", "AFTERNOON", "EVENING"]).optional(),
  note: z.string().trim().max(280).optional(),
  childProfileIds: z.array(z.string().trim().min(1)).max(10).default([]),
});

export type CompletionInput = z.infer<typeof completionSchema>;
export type ApprovalInput = z.infer<typeof approvalSchema>;
export type PlannedQuestInput = z.infer<typeof plannedQuestSchema>;

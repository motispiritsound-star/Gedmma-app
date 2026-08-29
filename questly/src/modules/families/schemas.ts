import { z } from "zod";

export const familySettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter a family name.").max(80),
  locale: z.enum(["nl", "en"]),
  environment: z.enum(["CITY", "SUBURB", "RURAL"]),
  requireParentApproval: z.coerce.boolean().default(true),
});

export const familyPreferenceSchema = z.object({
  preferredDurationMinutes: z.coerce.number().int().min(15).max(240),
  preferredDifficulty: z.enum(["EASY", "MEDIUM", "CHALLENGING"]),
  settingPreference: z.enum(["INDOOR", "OUTDOOR", "BOTH"]),
  participationStyle: z.enum(["FAMILY", "INDIVIDUAL", "BOTH"]),
  availableMaterialSlugs: z.array(z.string().trim().min(1)).max(40).default([]),
});

export type FamilySettingsInput = z.infer<typeof familySettingsSchema>;
export type FamilyPreferenceInput = z.infer<typeof familyPreferenceSchema>;

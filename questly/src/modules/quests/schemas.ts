import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const questFilterSchema = z.object({
  ageBand: z.enum(["AGE_6_8", "AGE_9_11", "AGE_12_15"]).optional().catch(undefined),
  maxDurationMinutes: z.coerce.number().int().min(15).max(480).optional().catch(undefined),
  setting: z.enum(["INDOOR", "OUTDOOR", "BOTH"]).optional().catch(undefined),
  weather: z.enum(["ANY", "DRY", "RAIN_FRIENDLY", "WARM", "COLD"]).optional().catch(undefined),
  participants: z.coerce.number().int().min(1).max(20).optional().catch(undefined),
  categorySlug: optionalString.catch(undefined),
  skillSlug: optionalString.catch(undefined),
  difficulty: z.enum(["EASY", "MEDIUM", "CHALLENGING"]).optional().catch(undefined),
  materialSlug: optionalString.catch(undefined),
  access: z.enum(["free", "premium"]).optional().catch(undefined),
  search: optionalString.catch(undefined),
});

/** Parses untrusted query parameters into filters, dropping anything invalid. */
export function parseQuestFilters(params: Record<string, string | string[] | undefined>) {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const result = questFilterSchema.safeParse(flat);
  return result.success ? result.data : {};
}

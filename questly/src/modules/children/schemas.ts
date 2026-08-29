import { z } from "zod";

export const AVATARS = ["fox", "owl", "otter", "bear", "hedgehog", "heron", "beetle", "seal"] as const;
export type Avatar = (typeof AVATARS)[number];

/**
 * A nickname, never a legal name. The pattern blocks addresses, URLs and other
 * identifying strings a child might be tempted to type in.
 */
export const nicknameSchema = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(24, "Keep the nickname short.")
  .regex(/^[\p{L}\p{N} '\-]+$/u, "Use letters, numbers, spaces, apostrophes and hyphens only.")
  .refine((v) => !/\d{4,}/.test(v), "Do not put numbers like a year or postcode in a nickname.");

export const childProfileSchema = z.object({
  nickname: nicknameSchema,
  ageBand: z.enum(["AGE_6_8", "AGE_9_11", "AGE_12_15"]),
  avatarKey: z.enum(AVATARS).default("fox"),
  interestSlugs: z.array(z.string().trim().min(1)).max(20).default([]),
});

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

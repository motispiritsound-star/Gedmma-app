import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email("Enter a valid email address.")
  .transform((v) => v.toLowerCase());

/**
 * Length beats composition rules (NIST SP 800-63B): 12 characters minimum, no
 * forced symbol classes, but obvious throwaway passwords are rejected.
 */
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(200, "That password is too long.")
  .refine((v) => !/^(?:password|questly|welkom|welcome)\d*!?$/i.test(v.trim()), "Choose a less predictable password.");

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Enter your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
  familyName: z.string().trim().min(2, "Enter a family name.").max(80),
  locale: z.enum(["nl", "en"]).default("nl"),
  consent: z
    .union([z.literal("on"), z.literal("true"), z.boolean()])
    .refine((v) => v === "on" || v === "true" || v === true, "Parental consent is required."),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email('Enter a valid email address');

/**
 * Length beats composition rules for real-world strength; we block the handful
 * of passwords that show up in every breach corpus instead.
 */
const WEAK = new Set(['wachtwoord123', 'password1234', '123456789012', 'skillpass123']);

export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(200)
  .refine((value) => !WEAK.has(value.toLowerCase()), 'This password is too easy to guess');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().min(2).max(80),
  familyName: z.string().trim().min(2).max(80),
  locale: z.enum(['nl', 'en']).default('nl'),
  cityId: z.string().cuid().optional(),
  acceptedTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms to continue' }) }),
  parentalConsent: z.literal(true, {
    errorMap: () => ({ message: 'Parental consent is required to create child profiles' }),
  }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const verifyEmailSchema = z.object({ token: z.string().min(10) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

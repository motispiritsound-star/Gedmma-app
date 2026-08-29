import { z } from 'zod'

/** Shared validation schemas for the authentication module. */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .pipe(z.email('Enter a valid e-mail address.'))

/**
 * NIST-style policy: length over composition rules. 12 characters minimum,
 * with a short deny-list of the passwords attackers try first.
 */
const COMMON_PASSWORDS = new Set([
  'password1234',
  'wachtwoord12',
  '123456789012',
  'qwertyuiop12',
  'questly12345',
  'welkom123456',
])

export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(200, 'That password is too long.')
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), 'Choose a less common password.')

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, 'Enter your name.').max(80),
  email: emailSchema,
  password: passwordSchema,
  familyName: z.string().trim().min(2, 'Enter a family name.').max(80),
  locale: z.enum(['nl', 'en']).default('nl'),
  consent: z.literal(true, 'Parental consent is required.'),
})

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(200),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type SignInInput = z.infer<typeof signInSchema>

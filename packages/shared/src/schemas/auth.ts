import { z } from 'zod';
import { USER_ROLES } from '../enums.js';
import { CURRENT_AGREEMENTS } from '../legal.js';
import { isDutchMobile, normalizeDutchPhone } from '../phone.js';
import { localeSchema } from './common.js';

/** Accepts any local spelling and hands the API a normalised E.164 number. */
export const dutchMobileSchema = z
  .string()
  .min(9)
  .max(20)
  .refine(isDutchMobile, { message: 'phone_invalid_mobile' })
  .transform(normalizeDutchPhone);

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'otp_invalid_format');

export const requestOtpSchema = z.object({
  phone: dutchMobileSchema,
  locale: localeSchema.optional(),
});

/**
 * What the client says the account holder agreed to. Sent on every sign-in
 * because the client cannot know whether the account already exists; the API
 * requires it when creating one, and otherwise records it only if it is newer
 * than what is already on file.
 *
 * The versions are sent rather than assumed so the record says which text the
 * person actually saw. A client running an old build agreeing to the current
 * terms would be a record of something that never happened.
 */
export const agreementsSchema = z.object({
  terms: z.string().min(4).max(20),
  privacy: z.string().min(4).max(20),
  /**
   * The holder states they are old enough. Nothing verifies this, and the
   * privacy statement says as much rather than implying a check.
   */
  confirmedMinimumAge: z.literal(true),
});

export const verifyOtpSchema = z.object({
  phone: dutchMobileSchema,
  code: otpCodeSchema,
  /** Sent on first sign-in so the account is created with the right role. */
  role: z.enum(USER_ROLES).exclude(['ADMIN']).optional(),
  deviceToken: z.string().max(255).optional(),
  agreements: agreementsSchema.optional(),
});

/**
 * Optional consent, the Article 6(1)(a) kind: off unless asked for, and
 * withdrawable without losing the account. Kept apart from the agreements
 * above precisely because those are not consent.
 */
export const marketingConsentSchema = z.object({
  optIn: z.boolean(),
});

/** The versions this build of the client will send. */
export const CLIENT_AGREEMENTS = {
  terms: CURRENT_AGREEMENTS.TERMS,
  privacy: CURRENT_AGREEMENTS.PRIVACY,
  confirmedMinimumAge: true,
} as const;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2).max(60).optional(),
  lastName: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().email().max(160).optional().or(z.literal('')),
  locale: localeSchema.optional(),
  cityId: z.string().optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

export type AgreementsInput = z.infer<typeof agreementsSchema>;
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

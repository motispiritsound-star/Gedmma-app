import { z } from 'zod';
import { USER_ROLES } from '../enums.js';
import { isMoroccanMobile, normalizeMoroccanPhone } from '../phone.js';
import { localeSchema } from './common.js';

/** Accepts any local spelling and hands the API a normalised E.164 number. */
export const moroccanMobileSchema = z
  .string()
  .min(9)
  .max(20)
  .refine(isMoroccanMobile, { message: 'phone_invalid_mobile' })
  .transform(normalizeMoroccanPhone);

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'otp_invalid_format');

export const requestOtpSchema = z.object({
  phone: moroccanMobileSchema,
  locale: localeSchema.optional(),
});

export const verifyOtpSchema = z.object({
  phone: moroccanMobileSchema,
  code: otpCodeSchema,
  /** Sent on first sign-in so the account is created with the right role. */
  role: z.enum(USER_ROLES).exclude(['ADMIN']).optional(),
  deviceToken: z.string().max(255).optional(),
});

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

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

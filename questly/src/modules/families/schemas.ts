import { z } from 'zod'

export const AGE_BANDS = ['AGE_6_8', 'AGE_9_11', 'AGE_12_15'] as const
export const AVATAR_KEYS = [
  'fox',
  'owl',
  'otter',
  'hedgehog',
  'badger',
  'heron',
  'squirrel',
  'deer',
] as const

/**
 * A child profile stores a nickname, not a name. The regex keeps out e-mail
 * addresses and URLs, which are the two things people paste in by accident.
 */
export const nicknameSchema = z
  .string()
  .trim()
  .min(2, 'A nickname needs at least two characters.')
  .max(24, 'Keep the nickname short.')
  .refine((value) => !value.includes('@'), 'Please do not use an e-mail address.')
  .refine((value) => !/https?:\/\//i.test(value), 'Please do not use a link.')

export const childProfileSchema = z.object({
  nickname: nicknameSchema,
  ageBand: z.enum(AGE_BANDS),
  avatarKey: z.enum(AVATAR_KEYS).default('fox'),
  interestIds: z.array(z.cuid()).max(20).default([]),
})

export const familyPreferencesSchema = z.object({
  name: z.string().trim().min(2).max(80),
  environment: z.enum(['CITY', 'SUBURB', 'RURAL']),
  preferredDuration: z.coerce.number().int().min(10).max(240),
  preferredDifficulty: z.enum(['EASY', 'MEDIUM', 'CHALLENGING']),
  preferredSetting: z.enum(['INDOOR', 'OUTDOOR', 'BOTH']),
  prefersFamilyActivity: z.coerce.boolean(),
  adultCount: z.coerce.number().int().min(1).max(6),
  requireParentApproval: z.coerce.boolean(),
  locale: z.enum(['nl', 'en']),
})

export type ChildProfileInput = z.infer<typeof childProfileSchema>
export type FamilyPreferencesInput = z.infer<typeof familyPreferencesSchema>

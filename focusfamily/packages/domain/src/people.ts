import { z } from 'zod';

/**
 * Roles. `admin` is a *platform* role for the internal back office; it is
 * deliberately not a family role and can never read family content.
 */
export const familyRoles = ['guardian', 'child'] as const;
export type FamilyRole = (typeof familyRoles)[number];

export const platformRoles = ['member', 'support_admin'] as const;
export type PlatformRole = (typeof platformRoles)[number];

export const locales = ['nl', 'en'] as const;
export type Locale = (typeof locales)[number];

/**
 * Age bands drive the tone and the amount of choice a child gets, never a
 * different amount of surveillance.
 */
export const ageBands = ['8-10', '11-13', '14-17', 'adult'] as const;
export type AgeBand = (typeof ageBands)[number];

export function ageBandFor(age: number): AgeBand {
  if (age >= 18) return 'adult';
  if (age >= 14) return '14-17';
  if (age >= 11) return '11-13';
  return '8-10';
}

export const MIN_CHILD_AGE = 8;
export const MAX_CHILD_AGE = 17;

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string().min(1).max(60),
  locale: z.enum(locales).default('nl'),
  platformRole: z.enum(platformRoles).default('member'),
  createdAt: z.coerce.date(),
});
export type User = z.infer<typeof userSchema>;

export const familySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(80),
  locale: z.enum(locales).default('nl'),
  timeZone: z.string().min(1).max(64).default('Europe/Amsterdam'),
  /** Start of the neutral seven-day baseline. Null until onboarding finishes. */
  baselineStartedAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date(),
});
export type Family = z.infer<typeof familySchema>;

export const membershipSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  userId: z.string(),
  role: z.enum(familyRoles),
  displayName: z.string().min(1).max(60),
  /** Guardians see everything about the family agreement; so do children. */
  joinedAt: z.coerce.date(),
  removedAt: z.coerce.date().nullable().default(null),
});
export type Membership = z.infer<typeof membershipSchema>;

export const childProfileSchema = z.object({
  id: z.string(),
  membershipId: z.string(),
  familyId: z.string(),
  /** Year of birth only. We do not need the exact date to pick a tone. */
  birthYear: z.number().int().min(1990).max(2100),
  ageBand: z.enum(ageBands),
  /** A child can always read their own record; this flag is about editing. */
  canEditOwnAgreements: z.boolean().default(true),
  linkedByUserId: z.string(),
  linkedAt: z.coerce.date(),
});
export type ChildProfile = z.infer<typeof childProfileSchema>;

export function childAge(profile: Pick<ChildProfile, 'birthYear'>, now: Date): number {
  return now.getFullYear() - profile.birthYear;
}

export const deviceSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  memberId: z.string(),
  label: z.string().min(1).max(60),
  platform: z.enum(['ios', 'android', 'web', 'unknown']),
  /** Which adapter is actually in charge, so the UI never over-promises. */
  adapter: z.enum(['ios_screen_time', 'android_usage', 'mock', 'none']),
  osVersion: z.string().max(32).nullable().default(null),
  registeredAt: z.coerce.date(),
  lastSeenAt: z.coerce.date().nullable().default(null),
});
export type Device = z.infer<typeof deviceSchema>;

/** The actor shape every permission check takes. */
export interface Actor {
  readonly userId: string;
  readonly familyId: string | null;
  readonly role: FamilyRole | null;
  readonly platformRole: PlatformRole;
  readonly ageBand: AgeBand;
}

export function guardianActor(userId: string, familyId: string): Actor {
  return { userId, familyId, role: 'guardian', platformRole: 'member', ageBand: 'adult' };
}

export function childActor(userId: string, familyId: string, ageBand: AgeBand): Actor {
  return { userId, familyId, role: 'child', platformRole: 'member', ageBand };
}

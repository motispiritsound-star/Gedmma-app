import type { SubscriptionPlan } from '@/generated/prisma/client'

/**
 * Plan entitlements live in one place so a feature check is never a scattered
 * `if (plan === 'FAMILY_PREMIUM')`.
 */
export type PlanEntitlements = {
  maxChildProfiles: number
  /** Free plans see a rotating subset of the free quests. */
  questAccess: 'rotating-free' | 'full-library'
  freeQuestRotationSize: number
  weeklyPlanner: boolean
  personalisedRecommendations: boolean
  certificates: boolean
  memoryCollection: boolean
  priceCents: number
}

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlan, PlanEntitlements> = {
  FREE: {
    maxChildProfiles: 1,
    questAccess: 'rotating-free',
    freeQuestRotationSize: 8,
    weeklyPlanner: false,
    personalisedRecommendations: false,
    certificates: false,
    memoryCollection: false,
    priceCents: 0,
  },
  FAMILY_PREMIUM: {
    maxChildProfiles: 5,
    questAccess: 'full-library',
    freeQuestRotationSize: 0,
    weeklyPlanner: true,
    personalisedRecommendations: true,
    certificates: true,
    memoryCollection: true,
    priceCents: 799,
  },
  // Placeholder only. See FUTURE_MODULES.md - the school environment is not
  // built in the MVP; the plan exists so the data model does not need changing.
  SCHOOL: {
    maxChildProfiles: 40,
    questAccess: 'full-library',
    freeQuestRotationSize: 0,
    weeklyPlanner: true,
    personalisedRecommendations: true,
    certificates: true,
    memoryCollection: true,
    priceCents: 0,
  },
}

export function entitlementsFor(plan: SubscriptionPlan | null | undefined): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan ?? 'FREE']
}

/**
 * Deterministic rotation of the free quest selection, keyed on the ISO week.
 * Every family sees the same free quests in a given week, and the set changes
 * without anyone having to run a job.
 */
export function isoWeekKey(date = new Date()): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNumber = (target.getUTCDay() + 6) % 7
  target.setUTCDate(target.getUTCDate() - dayNumber + 3)
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4))
  const week =
    1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
  return target.getUTCFullYear() * 100 + week
}

/**
 * Picks the rotating free selection from a list of free quest ids.
 * Pure and deterministic, so the same input always yields the same output.
 */
export function rotatingFreeSelection(
  freeQuestIds: readonly string[],
  size: number,
  weekKey = isoWeekKey(),
): string[] {
  if (freeQuestIds.length <= size) return [...freeQuestIds]
  const ordered = [...freeQuestIds].sort()
  const offset = weekKey % ordered.length
  const out: string[] = []
  for (let i = 0; i < size; i += 1) {
    out.push(ordered[(offset + i) % ordered.length] as string)
  }
  return out
}

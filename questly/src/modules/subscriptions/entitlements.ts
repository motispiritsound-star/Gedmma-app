import type { SubscriptionPlan } from "@prisma/client";

export type Entitlements = {
  plan: SubscriptionPlan;
  maxChildProfiles: number;
  /** ROTATING: a weekly subset of the free quests. FULL: everything published. */
  libraryAccess: "ROTATING" | "FULL";
  rotationSize: number;
  weeklyPlanner: boolean;
  personalisedRecommendations: boolean;
  certificates: boolean;
  familyMemories: boolean;
};

export const ENTITLEMENTS: Record<SubscriptionPlan, Entitlements> = {
  FREE: {
    plan: "FREE",
    maxChildProfiles: 1,
    libraryAccess: "ROTATING",
    rotationSize: 12,
    weeklyPlanner: false,
    personalisedRecommendations: false,
    certificates: false,
    familyMemories: false,
  },
  FAMILY_PREMIUM: {
    plan: "FAMILY_PREMIUM",
    maxChildProfiles: 5,
    libraryAccess: "FULL",
    rotationSize: 0,
    weeklyPlanner: true,
    personalisedRecommendations: true,
    certificates: true,
    familyMemories: true,
  },
  // Placeholder only. The school environment is out of scope for the MVP;
  // see FUTURE_MODULES.md (FocusSchool).
  SCHOOL: {
    plan: "SCHOOL",
    maxChildProfiles: 40,
    libraryAccess: "FULL",
    rotationSize: 0,
    weeklyPlanner: true,
    personalisedRecommendations: true,
    certificates: true,
    familyMemories: true,
  },
};

export function entitlementsFor(plan: SubscriptionPlan): Entitlements {
  return ENTITLEMENTS[plan] ?? ENTITLEMENTS.FREE;
}

/** ISO week number, used as the deterministic seed of the free rotation. */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function seededScore(seed: string, value: string): number {
  let hash = 2166136261;
  const input = `${seed}:${value}`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash;
}

/**
 * The free plan's rotating selection. Deterministic for a given week so the
 * same family sees a stable list all week, and no one can refresh for a better
 * roll - rotation is a fairness device, not a slot machine.
 */
export function rotatingSelection(slugs: readonly string[], weekKey: string, size: number): string[] {
  return [...slugs]
    .sort((a, b) => seededScore(weekKey, a) - seededScore(weekKey, b) || a.localeCompare(b))
    .slice(0, size);
}

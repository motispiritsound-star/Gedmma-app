import { z } from 'zod';

/**
 * Branded identifiers. They are plain strings at runtime but do not
 * interchange at compile time, which stops "pass the family id where a member
 * id was expected" bugs in the permission layer.
 */
declare const brand: unique symbol;
export type Branded<T extends string> = string & { readonly [brand]: T };

export type UserId = Branded<'UserId'>;
export type FamilyId = Branded<'FamilyId'>;
export type MembershipId = Branded<'MembershipId'>;
export type ChildProfileId = Branded<'ChildProfileId'>;
export type DeviceId = Branded<'DeviceId'>;
export type AgreementId = Branded<'AgreementId'>;
export type AgreementRuleId = Branded<'AgreementRuleId'>;
export type FocusScheduleId = Branded<'FocusScheduleId'>;
export type FocusSessionId = Branded<'FocusSessionId'>;
export type GoalId = Branded<'GoalId'>;
export type CheckInId = Branded<'CheckInId'>;
export type SubscriptionId = Branded<'SubscriptionId'>;

const idPattern = /^[A-Za-z0-9_-]{1,64}$/;

export const idSchema = z.string().regex(idPattern, 'id_format');

export function brandId<T extends string>(value: string): Branded<T> {
  return value as Branded<T>;
}

/** URL-safe, sortable-ish id. Not a security token; see `api/security` for those. */
export function createId(prefix: string, random: () => number = Math.random): string {
  const time = Date.now().toString(36);
  let tail = '';
  for (let i = 0; i < 10; i += 1) {
    tail += Math.floor(random() * 36).toString(36);
  }
  return `${prefix}_${time}${tail}`;
}

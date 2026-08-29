import { DomainError } from './errors.js';
import type { Actor } from './people.js';

/**
 * Capabilities the product will never ship, in any tier, for any role.
 *
 * They are listed explicitly rather than merely omitted so that the ban is
 * testable: `can()` denies them for every actor including support admins, and
 * a unit test asserts that the list is a subset of nothing the API exposes.
 */
export const FORBIDDEN_CAPABILITIES = Object.freeze([
  'message.read',
  'message.metadata.read',
  'browsing.history.read',
  'browsing.content.inspect',
  'keystroke.capture',
  'screenshot.capture',
  'microphone.capture',
  'camera.capture',
  'location.precise.track',
  'contacts.read',
  'photos.read',
  'remote.device.control',
  'covert.monitoring.enable',
  'child.data.sell',
  'child.behavioural.advertising',
] as const);

export type ForbiddenCapability = (typeof FORBIDDEN_CAPABILITIES)[number];

const forbiddenSet: ReadonlySet<string> = new Set<string>(FORBIDDEN_CAPABILITIES);

export function isForbiddenCapability(action: string): action is ForbiddenCapability {
  return forbiddenSet.has(action);
}

/** Everything the product *does* allow, grouped by area. */
export const permissions = Object.freeze([
  // family & membership
  'family.create',
  'family.read',
  'family.update',
  'family.invite_guardian',
  'family.remove_member',
  'child.link',
  'child.profile.read',
  'child.profile.update',
  // consent & measurement
  'consent.grant',
  'consent.withdraw',
  'consent.history.read',
  'measurement.read',
  'measurement.enable',
  'measurement.disable',
  'usage.summary.read',
  'usage.summary.self_report',
  // agreements
  'agreement.read',
  'agreement.create',
  'agreement.update',
  'agreement.propose_change',
  'agreement.activate',
  // focus
  'focus.schedule.read',
  'focus.schedule.create',
  'focus.schedule.update',
  'focus.session.start',
  'focus.session.read',
  // check-ins
  'checkin.create_self',
  'checkin.read_self',
  'checkin.read_family_aggregate',
  // goals & celebration
  'goal.read',
  'goal.create',
  'goal.contribute',
  'achievement.read',
  // content
  'education.read',
  'activity.read',
  // account & rights
  'notification.preference.update',
  'export.request',
  'deletion.request',
  'subscription.read',
  'subscription.manage',
  // back office (never family content)
  'admin.metrics.read',
  'admin.support_ticket.read',
] as const);

export type Permission = (typeof permissions)[number];

const guardianPermissions: ReadonlySet<Permission> = new Set<Permission>([
  'family.create',
  'family.read',
  'family.update',
  'family.invite_guardian',
  'family.remove_member',
  'child.link',
  'child.profile.read',
  'child.profile.update',
  'consent.grant',
  'consent.withdraw',
  'consent.history.read',
  'measurement.read',
  'measurement.enable',
  'measurement.disable',
  'usage.summary.read',
  'usage.summary.self_report',
  'agreement.read',
  'agreement.create',
  'agreement.update',
  'agreement.propose_change',
  'agreement.activate',
  'focus.schedule.read',
  'focus.schedule.create',
  'focus.schedule.update',
  'focus.session.start',
  'focus.session.read',
  'checkin.create_self',
  'checkin.read_self',
  'checkin.read_family_aggregate',
  'goal.read',
  'goal.create',
  'goal.contribute',
  'achievement.read',
  'education.read',
  'activity.read',
  'notification.preference.update',
  'export.request',
  'deletion.request',
  'subscription.read',
  'subscription.manage',
]);

/**
 * Children are participants, not subjects. They can read every rule that
 * applies to them or to anyone else, propose changes, run focus sessions and
 * withdraw their assent. They cannot unilaterally activate an agreement or
 * link another child, and they cannot read a sibling's private check-ins.
 */
const childPermissions: ReadonlySet<Permission> = new Set<Permission>([
  'family.read',
  'child.profile.read',
  // A young person gives their own assent; a guardian's yes is never enough.
  'consent.grant',
  'consent.withdraw',
  'consent.history.read',
  'measurement.read',
  'usage.summary.read',
  'usage.summary.self_report',
  'agreement.read',
  'agreement.propose_change',
  'focus.schedule.read',
  'focus.session.start',
  'focus.session.read',
  'checkin.create_self',
  'checkin.read_self',
  'goal.read',
  'goal.contribute',
  'achievement.read',
  'education.read',
  'activity.read',
  'notification.preference.update',
  'export.request',
]);

/** Older children get one extra lever: co-authoring the agreement text. */
const olderChildExtras: ReadonlySet<Permission> = new Set<Permission>(['agreement.update']);

const supportAdminPermissions: ReadonlySet<Permission> = new Set<Permission>([
  'admin.metrics.read',
  'admin.support_ticket.read',
]);

export interface PermissionContext {
  /** The family the resource belongs to, when the resource has one. */
  readonly familyId?: string | null;
  /** The member the resource is about, for "self only" rules. */
  readonly subjectUserId?: string | null;
}

export interface PermissionDecision {
  readonly allowed: boolean;
  readonly reasonKey: string;
}

const ALLOW: PermissionDecision = { allowed: true, reasonKey: 'authz.allowed' };

function deny(reasonKey: string): PermissionDecision {
  return { allowed: false, reasonKey };
}

/**
 * The single authorisation entry point. Every transport calls this; nothing
 * re-implements role checks locally.
 */
export function decide(
  actor: Actor,
  action: string,
  context: PermissionContext = {},
): PermissionDecision {
  if (isForbiddenCapability(action)) {
    // Not "you lack the role" - the capability does not exist in this product.
    return deny('authz.capability_not_offered');
  }
  if (!(permissions as readonly string[]).includes(action)) {
    return deny('authz.unknown_action');
  }
  const permission = action as Permission;

  if (permission.startsWith('admin.')) {
    return actor.platformRole === 'support_admin'
      ? ALLOW
      : deny('authz.admin_only');
  }
  // Support admins are back-office only: no family content, ever.
  if (actor.platformRole === 'support_admin' && actor.role === null) {
    return deny('authz.admin_has_no_family_access');
  }

  if (permission === 'family.create') {
    return actor.role === null || actor.role === 'guardian'
      ? ALLOW
      : deny('authz.guardian_only');
  }

  if (context.familyId != null && actor.familyId !== context.familyId) {
    return deny('authz.other_family');
  }

  if (actor.role === 'guardian') {
    return guardianPermissions.has(permission) ? ALLOW : deny('authz.not_permitted');
  }

  if (actor.role === 'child') {
    const allowed =
      childPermissions.has(permission) ||
      (actor.ageBand === '14-17' && olderChildExtras.has(permission));
    if (!allowed) return deny('authz.child_not_permitted');
    if (
      (permission === 'checkin.read_self' ||
        permission === 'checkin.create_self' ||
        permission === 'export.request' ||
        permission === 'consent.grant' ||
        permission === 'consent.withdraw') &&
      context.subjectUserId != null &&
      context.subjectUserId !== actor.userId
    ) {
      return deny('authz.self_only');
    }
    return ALLOW;
  }

  if (actor.platformRole === 'support_admin') {
    return supportAdminPermissions.has(permission) ? ALLOW : deny('authz.admin_only');
  }

  return deny('authz.no_membership');
}

export function can(actor: Actor, action: string, context: PermissionContext = {}): boolean {
  return decide(actor, action, context).allowed;
}

export function assertCan(
  actor: Actor,
  action: string,
  context: PermissionContext = {},
): void {
  const decision = decide(actor, action, context);
  if (!decision.allowed) {
    throw DomainError.forbidden(decision.reasonKey, { action });
  }
}

/**
 * What each member sees on the transparency screen: every capability that is
 * active for them, and the full list of capabilities the product refuses.
 */
export function transparencyReport(actor: Actor): {
  allowed: Permission[];
  neverOffered: readonly ForbiddenCapability[];
} {
  return {
    allowed: permissions.filter((permission) => can(actor, permission)),
    neverOffered: FORBIDDEN_CAPABILITIES,
  };
}

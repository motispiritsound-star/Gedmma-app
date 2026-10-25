import type { UserRole } from '@prisma/client';

/**
 * Role separation, stated once.
 *
 * The rule that matters commercially: CONTENT_EDITOR and CONTENT_APPROVER have
 * no permission that touches a family, an address or an order. An editor
 * working on a story literally cannot look up where a child lives.
 */
export const PERMISSIONS = {
  'catalogue.read': ['PARENT', 'CONTENT_EDITOR', 'CONTENT_APPROVER', 'OPS', 'SUPPORT', 'ADMIN'],

  'family.read': ['PARENT', 'SUPPORT', 'ADMIN'],
  'family.write': ['PARENT', 'ADMIN'],
  'address.read': ['PARENT', 'OPS', 'SUPPORT', 'ADMIN'],
  'address.write': ['PARENT', 'ADMIN'],
  'order.read.own': ['PARENT', 'ADMIN'],
  'order.read.all': ['OPS', 'SUPPORT', 'ADMIN'],
  'order.write': ['PARENT', 'ADMIN'],
  'subscription.manage': ['PARENT', 'ADMIN'],
  'progress.read.own': ['PARENT', 'ADMIN'],
  'activation.claim': ['PARENT', 'ADMIN'],

  'inventory.read': ['OPS', 'ADMIN'],
  'inventory.write': ['OPS', 'ADMIN'],
  'shipment.write': ['OPS', 'ADMIN'],
  'activation.mint': ['OPS', 'ADMIN'],

  'content.read': ['CONTENT_EDITOR', 'CONTENT_APPROVER', 'ADMIN'],
  'content.write': ['CONTENT_EDITOR', 'ADMIN'],
  'content.submit': ['CONTENT_EDITOR', 'ADMIN'],
  'content.approve': ['CONTENT_APPROVER', 'ADMIN'],
  'content.publish': ['CONTENT_APPROVER', 'ADMIN'],
  'content.aiDraft': ['CONTENT_EDITOR', 'CONTENT_APPROVER', 'ADMIN'],

  'support.read': ['SUPPORT', 'ADMIN'],
  'support.write': ['SUPPORT', 'ADMIN'],
  'support.create': ['PARENT', 'SUPPORT', 'ADMIN'],

  'audit.read': ['ADMIN'],
  'privacy.manage.own': ['PARENT', 'ADMIN'],
} as const satisfies Record<string, readonly UserRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(roles: readonly UserRole[], permission: Permission): boolean {
  const allowed = PERMISSIONS[permission] as readonly UserRole[];
  return roles.some((role) => allowed.includes(role));
}

export function canAny(roles: readonly UserRole[], permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(roles, permission));
}

/** Roles that may open the content studio at all. */
export const STUDIO_ROLES: readonly UserRole[] = ['CONTENT_EDITOR', 'CONTENT_APPROVER', 'ADMIN'];
/** Roles that may open the operations console at all. */
export const OPS_ROLES: readonly UserRole[] = ['OPS', 'SUPPORT', 'ADMIN'];

export class ForbiddenError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Missing permission: ${permission}`);
    this.name = 'ForbiddenError';
  }
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'UnauthenticatedError';
  }
}

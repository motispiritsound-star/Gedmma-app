import type { ProviderStaffRole, UserRole } from '@prisma/client';
import { prisma } from '../db';
import { AuthorizationError, NotFoundError } from '../errors';
import type { SessionUser } from './session';

/**
 * Permission slugs granted per provider-staff role. Staff may be narrowed
 * further with explicit ProviderStaff.permissions entries.
 */
export const PROVIDER_ROLE_PERMISSIONS: Record<ProviderStaffRole, readonly string[]> = {
  OWNER: [
    'provider:manage',
    'venues:write',
    'activities:write',
    'activities:publish',
    'sessions:write',
    'bookings:read',
    'bookings:checkin',
    'finance:read',
    'staff:manage',
    'messages:send',
    'incidents:write',
  ],
  MANAGER: [
    'venues:write',
    'activities:write',
    'activities:publish',
    'sessions:write',
    'bookings:read',
    'bookings:checkin',
    'finance:read',
    'messages:send',
    'incidents:write',
  ],
  INSTRUCTOR: ['bookings:read', 'bookings:checkin', 'incidents:write'],
};

export interface ProviderContext {
  providerId: string;
  staffId: string;
  role: ProviderStaffRole;
  permissions: readonly string[];
  providerStatus: string;
}

export function isAdmin(user: SessionUser): boolean {
  return user.role === 'ADMIN' || user.role === 'SAFEGUARDING_OFFICER';
}

export function requireRole(user: SessionUser, ...roles: UserRole[]): void {
  if (!roles.includes(user.role)) {
    throw new AuthorizationError(`This action requires one of: ${roles.join(', ')}`);
  }
}

export function requireAdmin(user: SessionUser): void {
  if (!isAdmin(user)) throw new AuthorizationError('Administrator access required');
}

export function requireSafeguardingOfficer(user: SessionUser): void {
  if (user.role !== 'SAFEGUARDING_OFFICER') {
    throw new AuthorizationError('Safeguarding officer access required');
  }
}

/**
 * Tenant guard. Every provider-scoped read or write must go through this so a
 * staff member can never reach another provider's data by guessing an id.
 */
export async function requireProviderAccess(
  user: SessionUser,
  providerId: string,
  permission?: string,
): Promise<ProviderContext> {
  const staff = await prisma.providerStaff.findUnique({
    where: { providerId_userId: { providerId, userId: user.id } },
    include: { provider: { select: { status: true } } },
  });

  if (!staff) {
    // Deliberately identical to the "unknown provider" response: membership of
    // another tenant must not be discoverable by probing ids.
    throw new AuthorizationError('You do not have access to this provider');
  }

  const permissions = staff.permissions.length > 0 ? staff.permissions : PROVIDER_ROLE_PERMISSIONS[staff.role];
  if (permission && !permissions.includes(permission)) {
    throw new AuthorizationError(`Missing permission: ${permission}`);
  }

  return {
    providerId,
    staffId: staff.id,
    role: staff.role,
    permissions,
    providerStatus: staff.provider.status,
  };
}

/** The single provider a staff user belongs to (MVP: one provider per user). */
export async function currentProviderId(user: SessionUser): Promise<string> {
  const staff = await prisma.providerStaff.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });
  if (!staff) throw new NotFoundError('No provider is linked to this account');
  return staff.providerId;
}

/** The family a guardian owns or co-manages. */
export async function requireFamily(user: SessionUser): Promise<string> {
  const membership = await prisma.familyMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });
  if (!membership) throw new NotFoundError('No family is linked to this account');
  return membership.familyId;
}

/** Confirms a child profile belongs to the caller's family before any use. */
export async function requireChildInFamily(familyId: string, childProfileId: string) {
  const child = await prisma.childProfile.findFirst({ where: { id: childProfileId, familyId } });
  if (!child) throw new AuthorizationError('This child profile does not belong to your family');
  return child;
}

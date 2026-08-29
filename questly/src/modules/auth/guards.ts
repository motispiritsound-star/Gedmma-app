import { redirect } from 'next/navigation'
import { forbidden, unauthenticated } from '@/lib/errors'
import { entitlementsFor, type PlanEntitlements } from '@/modules/subscriptions/plans'
import { getAuthContext, type AuthContext } from './session'
import type { Family, UserRole } from '@/generated/prisma/client'

export type FamilyContext = AuthContext & {
  family: Family
  entitlements: PlanEntitlements
}

/** Throws when nobody is signed in. Use inside API routes and server actions. */
export async function requireUser(): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) throw unauthenticated()
  return context
}

/** Throws unless the caller belongs to a family. */
export async function requireFamily(): Promise<FamilyContext> {
  const context = await requireUser()
  if (!context.family) throw forbidden('This account is not linked to a family.')
  return {
    ...context,
    family: context.family,
    entitlements: entitlementsFor(context.subscription?.plan),
  }
}

export async function requireRole(...roles: UserRole[]): Promise<AuthContext> {
  const context = await requireUser()
  if (!roles.includes(context.user.role)) throw forbidden()
  return context
}

export const requireAdmin = () => requireRole('CONTENT_ADMIN', 'PLATFORM_ADMIN')
export const requirePlatformAdmin = () => requireRole('PLATFORM_ADMIN')

/**
 * Page-level variants. These redirect rather than throw, which is what a user
 * landing on a protected URL should experience.
 */
export async function requireUserPage(returnTo = '/home'): Promise<AuthContext> {
  const context = await getAuthContext()
  if (!context) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`)
  return context
}

export async function requireFamilyPage(returnTo = '/home'): Promise<FamilyContext> {
  const context = await requireUserPage(returnTo)
  if (!context.family) redirect('/onboarding')
  return {
    ...context,
    family: context.family,
    entitlements: entitlementsFor(context.subscription?.plan),
  }
}

export async function requireOnboardedFamilyPage(returnTo = '/home'): Promise<FamilyContext> {
  const context = await requireFamilyPage(returnTo)
  if (!context.family.onboardingCompletedAt) redirect('/onboarding')
  return context
}

export async function requireAdminPage(): Promise<AuthContext> {
  const context = await requireUserPage('/admin')
  if (context.user.role === 'PARENT') redirect('/home')
  return context
}

export function isAdmin(role: UserRole): boolean {
  return role === 'CONTENT_ADMIN' || role === 'PLATFORM_ADMIN'
}

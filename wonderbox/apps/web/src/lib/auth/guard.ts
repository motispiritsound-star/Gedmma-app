import { redirect } from 'next/navigation';
import { currentActor, type Actor } from './session.ts';
import { can, type Permission } from './roles.ts';

/**
 * Page-level guards.
 *
 * `requirePermission` in session.ts throws, which is right for an API route:
 * a fetch wants a 401, not a redirect to an HTML login form. A *page* wants
 * the opposite — someone who follows a bookmark to /play while logged out
 * should land on the login form with somewhere to come back to, not on a
 * stack trace. These wrappers are that difference, in one place.
 */

export async function requireActorPage(next: string): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) redirect(`/login?next=${encodeURIComponent(next)}`);
  return actor;
}

export async function requirePermissionPage(
  permission: Permission,
  next: string,
): Promise<Actor> {
  const actor = await requireActorPage(next);
  // Signed in but not allowed: send them home rather than to a login form they
  // have already filled in. There is nothing here for them.
  if (!can(actor.roles, permission)) redirect('/');
  return actor;
}

/** A parent acting on their own family, on a page. */
export async function requireFamilyPage(next: string): Promise<Actor & { familyId: string }> {
  const actor = await requirePermissionPage('family.read', next);
  if (!actor.familyId) redirect('/');
  return { ...actor, familyId: actor.familyId };
}

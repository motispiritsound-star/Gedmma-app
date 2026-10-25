import { cookies, headers } from 'next/headers';
import type { User, UserRole } from '@prisma/client';
import { prisma } from '../db.ts';
import { env, isProduction } from '../env.ts';
import { hashIp, randomToken, sha256 } from '../crypto.ts';
import { ForbiddenError, UnauthenticatedError, can, type Permission } from './roles.ts';

export const SESSION_COOKIE = 'wb_session';

export interface Actor {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly roles: readonly UserRole[];
  readonly familyId: string | null;
  readonly locale: string;
}

function toActor(user: User): Actor {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: user.roles,
    familyId: user.familyId,
    locale: user.locale,
  };
}

/**
 * Issues a session. The cookie carries a random 256-bit token; the database
 * stores only its SHA-256, so a dump of the sessions table is worthless.
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32);
  const headerBag = await headers();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: sha256(token),
      expiresAt,
      userAgent: headerBag.get('user-agent')?.slice(0, 255) ?? null,
      ipHash: hashIp(clientIp(headerBag), env.SESSION_SECRET),
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    expires: expiresAt,
  });

  await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Resolves the current actor, or null when nobody is logged in. */
export async function currentActor(): Promise<Actor | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return actorFromToken(token);
}

/** Same resolution, but from a raw token — used by the companion API. */
export async function actorFromToken(token: string): Promise<Actor | null> {
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (session.user.deletedAt) return null;
  return toActor(session.user);
}

export async function requireActor(): Promise<Actor> {
  const actor = await currentActor();
  if (!actor) throw new UnauthenticatedError();
  return actor;
}

/** The workhorse: "who is this, and are they allowed to do this?" */
export async function requirePermission(permission: Permission): Promise<Actor> {
  const actor = await requireActor();
  if (!can(actor.roles, permission)) throw new ForbiddenError(permission);
  return actor;
}

/** A parent acting on their own family. Throws if they have no family at all. */
export async function requireFamily(): Promise<Actor & { familyId: string }> {
  const actor = await requirePermission('family.read');
  if (!actor.familyId) throw new ForbiddenError('family.read');
  return { ...actor, familyId: actor.familyId };
}

/**
 * The API-route counterpart of `requireFamily`: returns null instead of
 * throwing, so a route can answer 401 rather than 500. A fetch from the
 * companion wants a status code it can act on, not an HTML error page.
 */
export async function familyActor(): Promise<(Actor & { familyId: string }) | null> {
  const actor = await currentActor();
  if (!actor || !actor.familyId) return null;
  if (!can(actor.roles, 'family.read')) return null;
  return { ...actor, familyId: actor.familyId };
}

export function clientIp(headerBag: Headers): string | null {
  const forwarded = headerBag.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? null;
  return headerBag.get('x-real-ip');
}

/** Housekeeping for the retention job. */
export async function pruneExpiredSessions(now = new Date()): Promise<number> {
  const result = await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  return result.count;
}

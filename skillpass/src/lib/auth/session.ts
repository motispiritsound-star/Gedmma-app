import { cookies, headers } from 'next/headers';
import type { UserRole } from '@prisma/client';
import { prisma } from '../db';
import { env } from '../env';
import { generateToken, hashIp, sha256 } from '../crypto';
import { AuthenticationError } from '../errors';

export const SESSION_COOKIE = 'skillpass_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  locale: 'NL' | 'EN';
  emailVerified: boolean;
}

/**
 * Creates an opaque session token. Only its SHA-256 digest is stored, so a
 * database leak does not hand out live sessions.
 */
export async function createSession(userId: string, meta: { ip?: string | null; userAgent?: string | null } = {}) {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.authSession.create({
    data: {
      tokenHash: sha256(token),
      userId,
      expiresAt,
      ipHash: hashIp(meta.ip, env().SESSION_SECRET),
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
    },
  });
  return { token, expiresAt };
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env().NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', { ...sessionCookieOptions(new Date(0)), expires: new Date(0) });
}

export async function revokeSession(token: string) {
  await prisma.authSession.updateMany({
    where: { tokenHash: sha256(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Resolves a raw session token to a user, or null when it is not usable. */
export async function resolveSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const record = await prisma.authSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: true },
  });
  if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) return null;
  const { user } = record;
  if (user.status === 'SUSPENDED' || user.status === 'DELETED') return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    locale: user.locale,
    emailVerified: user.emailVerifiedAt !== null,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return resolveSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export async function requestMeta() {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  return {
    ip: forwarded?.split(',')[0]?.trim() ?? headerList.get('x-real-ip'),
    userAgent: headerList.get('user-agent'),
  };
}

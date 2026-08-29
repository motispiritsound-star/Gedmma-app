import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { prisma } from '@/lib/db'
import { getEnv, getSessionSecret } from '@/env'
import { hashIp, hashToken, randomToken } from '@/lib/crypto'
import type { Family, FamilyMembership, Subscription, User } from '@/generated/prisma/client'

export const SESSION_COOKIE = 'questly_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export type SessionUser = Omit<User, 'passwordHash'>

export type AuthContext = {
  user: SessionUser
  family: Family | null
  membership: FamilyMembership | null
  subscription: Subscription | null
}

/** Reads the caller's IP from the proxy headers, hashed before any storage. */
export async function requestFingerprint(): Promise<{ ipHash: string | null; userAgent: string | null }> {
  const headerStore = await headers()
  const forwarded = headerStore.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? headerStore.get('x-real-ip') ?? null
  return {
    ipHash: hashIp(ip, getSessionSecret()),
    userAgent: headerStore.get('user-agent'),
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = randomToken(32)
  const { ipHash, userAgent } = await requestFingerprint()
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ipHash,
      userAgent: userAgent?.slice(0, 255) ?? null,
    },
  })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: getEnv().NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
  return token
}

export async function destroySession(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }
  cookieStore.delete(SESSION_COOKIE)
  return token ?? null
}

/**
 * Resolves the signed-in user together with their family, membership and
 * subscription. Memoised per request with React `cache` so a page that renders
 * a dozen server components still issues one query.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          memberships: {
            include: { family: { include: { subscription: true } } },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      },
    },
  })

  if (!session || session.expiresAt <= new Date()) return null
  if (session.user.deletedAt) return null

  const { passwordHash: _passwordHash, memberships, ...user } = session.user
  const membershipRecord = memberships[0]
  if (!membershipRecord) {
    return { user, membership: null, family: null, subscription: null }
  }

  const { family: familyRecord, ...membership } = membershipRecord
  const { subscription, ...family } = familyRecord

  return { user, membership, family, subscription }
})

/** Deletes expired sessions. Called opportunistically on sign-in. */
export async function pruneExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({ where: { expiresAt: { lte: new Date() } } })
  return result.count
}

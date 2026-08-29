import { prisma } from '@/lib/db'
import { getEnv } from '@/env'
import { hashPassword, hashToken, randomToken, verifyPassword } from '@/lib/crypto'
import { conflict, rateLimited, unauthenticated, validationError } from '@/lib/errors'
import { enforceRateLimit } from '@/lib/rate-limit'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'
import { sendEmail } from '@/modules/email'
import { createSession, pruneExpiredSessions, requestFingerprint } from './session'
import type { RegisterInput, SignInInput } from './schemas'
import type { User } from '@/generated/prisma/client'

const MAX_FAILED_LOGINS = 8
const LOCK_DURATION_MS = 15 * 60 * 1000

export type RegisterResult = { userId: string; familyId: string; verificationToken: string }

/**
 * Creates a parent account, their family, a free subscription and an e-mail
 * verification token, in one transaction.
 */
export async function registerParent(input: RegisterInput): Promise<RegisterResult> {
  const { ipHash, userAgent } = await requestFingerprint()

  const limit = await enforceRateLimit('register', ipHash ?? 'anonymous')
  if (!limit.allowed) throw rateLimited()

  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    // Deliberately explicit: e-mail existence is already observable through the
    // sign-in flow, and a vague error here costs far more support time.
    throw conflict('An account with this e-mail address already exists.')
  }

  const passwordHash = await hashPassword(input.password)
  const rawToken = randomToken(32)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        locale: input.locale,
        role: 'PARENT',
      },
    })

    const family = await tx.family.create({
      data: {
        name: input.familyName,
        locale: input.locale,
        memberships: { create: { userId: user.id, role: 'OWNER' } },
        subscription: { create: { plan: 'FREE', status: 'ACTIVE', provider: getEnv().PAYMENT_DRIVER } },
      },
    })

    await tx.verificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        type: 'EMAIL_VERIFICATION',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    return { userId: user.id, familyId: family.id }
  })

  await recordAudit({
    action: AUDIT_ACTIONS.userRegistered,
    entityType: 'user',
    entityId: result.userId,
    actorUserId: result.userId,
    actorRole: 'PARENT',
    ipHash,
    userAgent,
  })

  await sendEmail({
    to: input.email,
    subject: 'Confirm your Questly account',
    body: `Confirm your e-mail address: ${getEnv().APP_URL}/verify-email?token=${rawToken}`,
  })

  await createSession(result.userId)

  return { ...result, verificationToken: rawToken }
}

export async function signIn(input: SignInInput): Promise<User> {
  const { ipHash, userAgent } = await requestFingerprint()

  const limit = await enforceRateLimit('signIn', `${ipHash ?? 'anonymous'}:${input.email}`)
  if (!limit.allowed) throw rateLimited()

  const user = await prisma.user.findUnique({ where: { email: input.email } })

  if (!user) {
    // Spend comparable time on a missing user so timing does not leak existence.
    await verifyPassword(input.password, 'scrypt$16384$8$1$AAAA$AAAA')
    await recordAudit({
      action: AUDIT_ACTIONS.userSignInFailed,
      entityType: 'user',
      ipHash,
      userAgent,
      metadata: { reason: 'unknown_user' },
    })
    throw unauthenticated('That e-mail address and password do not match.')
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw rateLimited('Too many failed attempts. Try again in a few minutes.')
  }

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) {
    const failedLogins = user.failedLogins + 1
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins,
        lockedUntil:
          failedLogins >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_DURATION_MS) : null,
      },
    })
    await recordAudit({
      action: AUDIT_ACTIONS.userSignInFailed,
      entityType: 'user',
      entityId: user.id,
      ipHash,
      userAgent,
      metadata: { reason: 'bad_password', failedLogins },
    })
    throw unauthenticated('That e-mail address and password do not match.')
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLogins: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      // Signing in during the grace period cancels a pending deletion.
      deletedAt: null,
    },
  })

  await createSession(user.id)
  await pruneExpiredSessions()

  await recordAudit({
    action: AUDIT_ACTIONS.userSignedIn,
    entityType: 'user',
    entityId: user.id,
    actorUserId: user.id,
    actorRole: user.role,
    ipHash,
    userAgent,
  })

  return updated
}

export async function verifyEmailToken(rawToken: string): Promise<boolean> {
  const token = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  })
  if (!token || token.usedAt || token.type !== 'EMAIL_VERIFICATION') return false
  if (token.expiresAt <= new Date()) return false

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: token.userId }, data: { emailVerifiedAt: new Date() } }),
  ])

  await recordAudit({
    action: AUDIT_ACTIONS.userEmailVerified,
    entityType: 'user',
    entityId: token.userId,
    actorUserId: token.userId,
  })
  return true
}

export async function issueVerificationToken(userId: string): Promise<string> {
  const rawToken = randomToken(32)
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
  return rawToken
}

export async function changePassword(userId: string, current: string, next: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw unauthenticated()
  if (!(await verifyPassword(current, user.passwordHash))) {
    throw validationError('Your current password is not correct.', { currentPassword: ['incorrect'] })
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(next) },
  })
  // Every other session is invalidated after a password change.
  await prisma.session.deleteMany({ where: { userId } })
}

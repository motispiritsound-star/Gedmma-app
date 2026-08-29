import { describe, expect, it } from 'vitest'
import { prisma } from '@/lib/db'
import { registerParent, signIn } from '@/modules/auth/service'
import { getAuthContext } from '@/modules/auth/session'
import { createChildProfile, listChildProfiles } from '@/modules/families/service'
import { activatePlan } from '@/modules/subscriptions/service'
import { entitlementsFor } from '@/modules/subscriptions/plans'
import { AppError } from '@/lib/errors'
import { createTestFamily, interestIdsBySlug, uniqueEmail } from './helpers'

/** Acceptance criteria 1 and 2. */

describe('parent registration', () => {
  it('creates a user, a family, an owner membership and a free subscription', async () => {
    const email = uniqueEmail('register')
    const result = await registerParent({
      displayName: 'Sanne',
      email,
      password: 'MijnLangeWachtwoord',
      familyName: 'Familie Test',
      locale: 'nl',
      consent: true,
    })

    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } })
    expect(user.email).toBe(email)
    expect(user.role).toBe('PARENT')
    expect(user.emailVerifiedAt).toBeNull()
    expect(user.passwordHash).not.toContain('MijnLangeWachtwoord')

    const family = await prisma.family.findUniqueOrThrow({
      where: { id: result.familyId },
      include: { memberships: true, subscription: true },
    })
    expect(family.name).toBe('Familie Test')
    expect(family.memberships[0]?.role).toBe('OWNER')
    expect(family.memberships[0]?.userId).toBe(result.userId)
    expect(family.subscription?.plan).toBe('FREE')
    expect(family.requireParentApproval).toBe(true)
  })

  it('signs the new parent in immediately', async () => {
    await registerParent({
      displayName: 'Sanne',
      email: uniqueEmail('session'),
      password: 'MijnLangeWachtwoord',
      familyName: 'Familie Sessie',
      locale: 'nl',
      consent: true,
    })
    const context = await getAuthContext()
    expect(context?.family?.name).toBe('Familie Sessie')
  })

  it('refuses a duplicate e-mail address', async () => {
    const email = uniqueEmail('duplicate')
    const input = {
      displayName: 'Eerste',
      email,
      password: 'MijnLangeWachtwoord',
      familyName: 'Familie Een',
      locale: 'nl' as const,
      consent: true as const,
    }
    await registerParent(input)
    await expect(registerParent(input)).rejects.toThrowError(AppError)
  })

  it('issues a verification token that confirms the address', async () => {
    const { userId, verificationToken } = await registerParent({
      displayName: 'Sanne',
      email: uniqueEmail('verify'),
      password: 'MijnLangeWachtwoord',
      familyName: 'Familie Verificatie',
      locale: 'nl',
      consent: true,
    })
    const { verifyEmailToken } = await import('@/modules/auth/service')
    expect(await verifyEmailToken(verificationToken)).toBe(true)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } })
    expect(user.emailVerifiedAt).not.toBeNull()
    // A token may only be used once.
    expect(await verifyEmailToken(verificationToken)).toBe(false)
  })
})

describe('sign in', () => {
  it('accepts the right password and rejects the wrong one', async () => {
    const { email, password } = await createTestFamily()
    const user = await signIn({ email, password })
    expect(user.lastLoginAt).not.toBeNull()
    await expect(signIn({ email, password: 'verkeerdwachtwoord' })).rejects.toThrowError(AppError)
  })

  it('does not reveal whether an address exists', async () => {
    await expect(
      signIn({ email: 'niemand@questly.test', password: 'ietsanders123' }),
    ).rejects.toThrowError(/do not match/)
  })
})

describe('child profiles', () => {
  it('stores a nickname, an age band and interests - and no e-mail address', async () => {
    const { familyId, userId } = await createTestFamily()
    const interestIds = await interestIdsBySlug(['animals', 'drawing'])

    const child = await createChildProfile({
      familyId,
      actorUserId: userId,
      input: { nickname: 'Noor', ageBand: 'AGE_6_8', avatarKey: 'otter', interestIds },
    })

    expect(child.nickname).toBe('Noor')
    expect(child.ageBand).toBe('AGE_6_8')
    expect(Object.keys(child)).not.toContain('email')

    const profiles = await listChildProfiles(familyId)
    expect(profiles).toHaveLength(1)
    expect(profiles[0]?.interests).toHaveLength(2)
  })

  it('enforces the plan limit on the free plan', async () => {
    const { familyId, userId } = await createTestFamily({ premium: false })
    await createChildProfile({
      familyId,
      actorUserId: userId,
      input: { nickname: 'Eerste', ageBand: 'AGE_6_8', avatarKey: 'fox', interestIds: [] },
    })
    expect(entitlementsFor('FREE').maxChildProfiles).toBe(1)
    await expect(
      createChildProfile({
        familyId,
        actorUserId: userId,
        input: { nickname: 'Tweede', ageBand: 'AGE_9_11', avatarKey: 'owl', interestIds: [] },
      }),
    ).rejects.toThrowError(/plan allows/)
  })

  it('allows five profiles once the family upgrades', async () => {
    const { familyId, userId } = await createTestFamily({ premium: false })
    await activatePlan({ familyId, plan: 'FAMILY_PREMIUM', actorUserId: userId })
    for (const nickname of ['Een', 'Twee', 'Drie', 'Vier', 'Vijf']) {
      await createChildProfile({
        familyId,
        actorUserId: userId,
        input: { nickname, ageBand: 'AGE_9_11', avatarKey: 'fox', interestIds: [] },
      })
    }
    expect(await listChildProfiles(familyId)).toHaveLength(5)
  })

  it('rejects a duplicate nickname within the same family', async () => {
    const { familyId, userId } = await createTestFamily()
    const input = {
      nickname: 'Sem',
      ageBand: 'AGE_12_15' as const,
      avatarKey: 'badger' as const,
      interestIds: [],
    }
    await createChildProfile({ familyId, actorUserId: userId, input })
    await expect(createChildProfile({ familyId, actorUserId: userId, input })).rejects.toThrowError(
      /nickname/,
    )
  })

  it('records an audit entry when a child profile is created', async () => {
    const { familyId, userId } = await createTestFamily({ children: [{ nickname: 'Auditkind' }] })
    const entry = await prisma.auditLog.findFirst({
      where: { action: 'child_profile.created', actorUserId: userId },
      orderBy: { createdAt: 'desc' },
    })
    expect(entry).not.toBeNull()
    expect((entry?.metadata as { familyId?: string } | null)?.familyId).toBe(familyId)
  })
})

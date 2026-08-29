import { prisma } from '@/lib/db'
import { conflict, notFound, planLimit } from '@/lib/errors'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'
import { entitlementsFor } from '@/modules/subscriptions/plans'
import type { ChildProfile, Family } from '@/generated/prisma/client'
import type { ChildProfileInput, FamilyPreferencesInput } from './schemas'

export async function getFamilyWithChildren(familyId: string) {
  const family = await prisma.family.findFirst({
    where: { id: familyId, deletedAt: null },
    include: {
      children: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        include: { interests: { include: { interest: true } } },
      },
      subscription: true,
    },
  })
  if (!family) throw notFound('Family not found.')
  return family
}

export async function listChildProfiles(familyId: string) {
  return prisma.childProfile.findMany({
    where: { familyId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: { interests: { include: { interest: true } } },
  })
}

export async function createChildProfile(params: {
  familyId: string
  actorUserId: string
  input: ChildProfileInput
}): Promise<ChildProfile> {
  const subscription = await prisma.subscription.findUnique({ where: { familyId: params.familyId } })
  const entitlements = entitlementsFor(subscription?.plan)

  const existingCount = await prisma.childProfile.count({
    where: { familyId: params.familyId, deletedAt: null },
  })
  if (existingCount >= entitlements.maxChildProfiles) {
    throw planLimit(`Your plan allows ${entitlements.maxChildProfiles} child profile(s).`)
  }

  const duplicate = await prisma.childProfile.findFirst({
    where: { familyId: params.familyId, nickname: params.input.nickname, deletedAt: null },
  })
  if (duplicate) throw conflict('A profile with that nickname already exists.')

  const child = await prisma.childProfile.create({
    data: {
      familyId: params.familyId,
      nickname: params.input.nickname,
      ageBand: params.input.ageBand,
      avatarKey: params.input.avatarKey,
      interests: {
        create: params.input.interestIds.map((interestId) => ({ interestId })),
      },
    },
  })

  await recordAudit({
    action: AUDIT_ACTIONS.childCreated,
    entityType: 'child_profile',
    entityId: child.id,
    actorUserId: params.actorUserId,
    actorRole: 'PARENT',
    metadata: { familyId: params.familyId, ageBand: child.ageBand },
  })

  return child
}

export async function updateChildProfile(params: {
  familyId: string
  childId: string
  actorUserId: string
  input: ChildProfileInput
}): Promise<ChildProfile> {
  const child = await prisma.childProfile.findFirst({
    where: { id: params.childId, familyId: params.familyId, deletedAt: null },
  })
  if (!child) throw notFound('Child profile not found.')

  const updated = await prisma.$transaction(async (tx) => {
    await tx.childInterest.deleteMany({ where: { childProfileId: params.childId } })
    return tx.childProfile.update({
      where: { id: params.childId },
      data: {
        nickname: params.input.nickname,
        ageBand: params.input.ageBand,
        avatarKey: params.input.avatarKey,
        interests: { create: params.input.interestIds.map((interestId) => ({ interestId })) },
      },
    })
  })

  await recordAudit({
    action: AUDIT_ACTIONS.childUpdated,
    entityType: 'child_profile',
    entityId: params.childId,
    actorUserId: params.actorUserId,
    actorRole: 'PARENT',
  })

  return updated
}

/**
 * Soft-deletes a child profile. Completed adventures stay in the family story,
 * so the row is retained with `deletedAt` rather than removed; the hard delete
 * happens with the family, in the account deletion flow.
 */
export async function deleteChildProfile(params: {
  familyId: string
  childId: string
  actorUserId: string
}): Promise<void> {
  const child = await prisma.childProfile.findFirst({
    where: { id: params.childId, familyId: params.familyId, deletedAt: null },
  })
  if (!child) throw notFound('Child profile not found.')

  await prisma.childProfile.update({
    where: { id: params.childId },
    data: { deletedAt: new Date() },
  })

  await recordAudit({
    action: AUDIT_ACTIONS.childDeleted,
    entityType: 'child_profile',
    entityId: params.childId,
    actorUserId: params.actorUserId,
    actorRole: 'PARENT',
  })
}

export async function updateFamilyPreferences(params: {
  familyId: string
  input: FamilyPreferencesInput
  completeOnboarding?: boolean
}): Promise<Family> {
  return prisma.family.update({
    where: { id: params.familyId },
    data: {
      name: params.input.name,
      environment: params.input.environment,
      preferredDuration: params.input.preferredDuration,
      preferredDifficulty: params.input.preferredDifficulty,
      preferredSetting: params.input.preferredSetting,
      prefersFamilyActivity: params.input.prefersFamilyActivity,
      adultCount: params.input.adultCount,
      requireParentApproval: params.input.requireParentApproval,
      locale: params.input.locale,
      ...(params.completeOnboarding ? { onboardingCompletedAt: new Date() } : {}),
    },
  })
}

export async function completeOnboarding(familyId: string): Promise<Family> {
  return prisma.family.update({
    where: { id: familyId },
    data: { onboardingCompletedAt: new Date() },
  })
}

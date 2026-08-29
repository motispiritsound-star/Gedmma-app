import { prisma } from '@/lib/db'
import { getEnv } from '@/env'
import { notFound } from '@/lib/errors'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'
import { purgeFamilyMedia } from '@/modules/media/service'

/**
 * Data subject rights: export and erasure.
 *
 * Export returns everything the family produced, in a shape a human can read.
 * Deletion is a two-phase flow: a request marks the account, and a purge (run
 * by an operator or a scheduled job) removes the data once the grace period has
 * passed. The grace period exists so an accidental or coerced deletion can be
 * undone by simply signing in again.
 */

export async function exportFamilyData(params: { familyId: string; userId: string }) {
  const family = await prisma.family.findUnique({
    where: { id: params.familyId },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              role: true,
              locale: true,
              createdAt: true,
              emailVerifiedAt: true,
            },
          },
        },
      },
      children: { include: { interests: { include: { interest: true } } } },
      subscription: true,
      favourites: { include: { quest: { select: { slug: true } } } },
      planned: { include: { quest: { select: { slug: true } } } },
      badges: { include: { badge: { select: { slug: true, nameEn: true, nameNl: true } } } },
      completions: {
        include: {
          quest: { select: { slug: true } },
          participants: { include: { childProfile: { select: { nickname: true } } } },
          reflections: true,
          evidence: {
            select: { id: true, mimeType: true, sizeBytes: true, caption: true, createdAt: true },
          },
        },
      },
    },
  })
  if (!family) throw notFound('Family not found.')

  await recordAudit({
    action: AUDIT_ACTIONS.userDataExported,
    entityType: 'family',
    entityId: params.familyId,
    actorUserId: params.userId,
    actorRole: 'PARENT',
  })

  return {
    exportedAt: new Date().toISOString(),
    format: 'questly-family-export/1',
    note:
      'Photographs are not embedded in this file. They are listed by id, size and type; ' +
      'ask support for the binary files, or download them from the family memories page.',
    family: {
      id: family.id,
      name: family.name,
      locale: family.locale,
      country: family.country,
      environment: family.environment,
      preferences: {
        preferredDuration: family.preferredDuration,
        preferredDifficulty: family.preferredDifficulty,
        preferredSetting: family.preferredSetting,
        prefersFamilyActivity: family.prefersFamilyActivity,
        adultCount: family.adultCount,
        requireParentApproval: family.requireParentApproval,
      },
      createdAt: family.createdAt,
    },
    parents: family.memberships.map((membership) => ({
      familyRole: membership.role,
      ...membership.user,
    })),
    childProfiles: family.children.map((child) => ({
      nickname: child.nickname,
      ageBand: child.ageBand,
      avatarKey: child.avatarKey,
      interests: child.interests.map((link) => link.interest.slug),
      createdAt: child.createdAt,
      deletedAt: child.deletedAt,
    })),
    subscription: family.subscription,
    favourites: family.favourites.map((favourite) => favourite.quest.slug),
    planned: family.planned.map((planned) => ({
      quest: planned.quest.slug,
      scheduledFor: planned.scheduledFor,
      status: planned.status,
      note: planned.note,
    })),
    badges: family.badges.map((awarded) => ({
      badge: awarded.badge.slug,
      awardedAt: awarded.awardedAt,
    })),
    completions: family.completions.map((completion) => ({
      quest: completion.quest.slug,
      status: completion.status,
      startedAt: completion.startedAt,
      finishedAt: completion.finishedAt,
      reportedOfflineMinutes: completion.offlineMinutes,
      familyNote: completion.familyNote,
      participants: completion.participants.map((participant) => participant.childProfile.nickname),
      reflections: completion.reflections.map((reflection) => ({
        question: reflection.question,
        answer: reflection.answer,
      })),
      photos: completion.evidence,
    })),
  }
}

export type DeletionRequest = {
  scheduledPurgeAt: Date
  graceDays: number
}

export async function requestAccountDeletion(params: {
  userId: string
  familyId: string
}): Promise<DeletionRequest> {
  const graceDays = getEnv().RETENTION_DELETION_GRACE_DAYS
  const now = new Date()

  await prisma.$transaction([
    prisma.user.update({ where: { id: params.userId }, data: { deletedAt: now } }),
    prisma.family.update({ where: { id: params.familyId }, data: { deletedAt: now } }),
    prisma.session.deleteMany({ where: { userId: params.userId } }),
  ])

  await recordAudit({
    action: AUDIT_ACTIONS.userDeletionRequested,
    entityType: 'family',
    entityId: params.familyId,
    actorUserId: params.userId,
    actorRole: 'PARENT',
    metadata: { graceDays },
  })

  return {
    graceDays,
    scheduledPurgeAt: new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000),
  }
}

export async function cancelAccountDeletion(params: {
  userId: string
  familyId: string
}): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({ where: { id: params.userId }, data: { deletedAt: null } }),
    prisma.family.update({ where: { id: params.familyId }, data: { deletedAt: null } }),
  ])
  await recordAudit({
    action: AUDIT_ACTIONS.userDeletionCancelled,
    entityType: 'family',
    entityId: params.familyId,
    actorUserId: params.userId,
    actorRole: 'PARENT',
  })
}

/**
 * Hard-deletes families whose grace period has expired. Intended to be run by
 * `npm run retention:purge` from a scheduled job.
 */
export async function purgeExpiredDeletions(now = new Date()): Promise<{
  familiesPurged: number
  mediaPurged: number
  auditRowsPurged: number
}> {
  const env = getEnv()
  const cutoff = new Date(now.getTime() - env.RETENTION_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000)

  const families = await prisma.family.findMany({
    where: { deletedAt: { not: null, lte: cutoff } },
    select: { id: true, memberships: { select: { userId: true } } },
  })

  let mediaPurged = 0
  for (const family of families) {
    mediaPurged += await purgeFamilyMedia(family.id)
    // Cascades remove children, completions, reflections, evidence rows,
    // favourites, planned quests, badges and the subscription.
    await prisma.family.delete({ where: { id: family.id } })
    await prisma.user.deleteMany({
      where: {
        id: { in: family.memberships.map((membership) => membership.userId) },
        deletedAt: { not: null, lte: cutoff },
      },
    })
  }

  const auditCutoff = new Date(now.getTime() - env.RETENTION_AUDIT_LOG_DAYS * 24 * 60 * 60 * 1000)
  const audit = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } })

  return { familiesPurged: families.length, mediaPurged, auditRowsPurged: audit.count }
}

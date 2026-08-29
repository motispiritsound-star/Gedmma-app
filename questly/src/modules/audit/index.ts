import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { Prisma } from '@/generated/prisma/client'

/**
 * Audit logging for sensitive actions.
 *
 * Anything an administrator does to content or accounts, and anything a parent
 * does that affects retention or billing, is recorded here. Audit entries never
 * contain the contents of a family's private material.
 */

export const AUDIT_ACTIONS = {
  userRegistered: 'user.registered',
  userSignedIn: 'user.signed_in',
  userSignInFailed: 'user.sign_in_failed',
  userSignedOut: 'user.signed_out',
  userEmailVerified: 'user.email_verified',
  userDeletionRequested: 'user.deletion_requested',
  userDeletionCancelled: 'user.deletion_cancelled',
  userDataExported: 'user.data_exported',
  childCreated: 'child_profile.created',
  childUpdated: 'child_profile.updated',
  childDeleted: 'child_profile.deleted',
  evidenceUploaded: 'evidence.uploaded',
  evidenceDeleted: 'evidence.deleted',
  evidenceAccessed: 'evidence.accessed',
  questCreated: 'quest.created',
  questUpdated: 'quest.updated',
  questPublished: 'quest.published',
  questUnpublished: 'quest.unpublished',
  questArchived: 'quest.archived',
  questDuplicated: 'quest.duplicated',
  subscriptionChanged: 'subscription.changed',
  adminViewedFamilies: 'admin.viewed_families',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

export type AuditInput = {
  action: AuditAction
  entityType: string
  entityId?: string | null
  actorUserId?: string | null
  actorRole?: string | null
  metadata?: Prisma.InputJsonValue
  ipHash?: string | null
  userAgent?: string | null
}

/**
 * Records an audit entry. Failures are logged but never bubble up: an audit
 * write must not break the user-facing action it describes.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        metadata: input.metadata,
        ipHash: input.ipHash ?? null,
        userAgent: input.userAgent?.slice(0, 255) ?? null,
      },
    })
  } catch (error) {
    logger.error('audit.write_failed', { action: input.action, error })
  }
}

export async function listAuditLog(options: {
  take?: number
  skip?: number
  action?: string
  entityType?: string
}) {
  const where = {
    ...(options.action ? { action: options.action } : {}),
    ...(options.entityType ? { entityType: options.entityType } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.take ?? 50,
      skip: options.skip ?? 0,
      include: { actor: { select: { id: true, displayName: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ])
  return { items, total }
}

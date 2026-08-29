import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/crypto";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

/**
 * Actions worth keeping a durable record of. Sensitive administrative actions
 * and anything that touches private family data must be listed here.
 */
export const AUDIT_ACTIONS = {
  userRegistered: "user.registered",
  userSignedIn: "user.signed_in",
  userSignInFailed: "user.sign_in_failed",
  userSignedOut: "user.signed_out",
  userEmailVerified: "user.email_verified",
  familyCreated: "family.created",
  familyUpdated: "family.updated",
  childCreated: "child_profile.created",
  childUpdated: "child_profile.updated",
  childDeleted: "child_profile.deleted",
  completionStarted: "completion.started",
  completionSubmitted: "completion.submitted",
  completionApproved: "completion.approved",
  completionRejected: "completion.rejected",
  evidenceUploaded: "evidence.uploaded",
  evidenceViewed: "evidence.viewed",
  evidenceDeleted: "evidence.deleted",
  questCreated: "quest.created",
  questUpdated: "quest.updated",
  questPublished: "quest.published",
  questUnpublished: "quest.unpublished",
  questDuplicated: "quest.duplicated",
  questArchived: "quest.archived",
  subscriptionChanged: "subscription.changed",
  dataExported: "family.data_exported",
  deletionRequested: "account.deletion_requested",
  deletionCancelled: "account.deletion_cancelled",
  adminViewedFamilies: "admin.viewed_families",
  adminViewedAuditLog: "admin.viewed_audit_log",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type AuditInput = {
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  familyId?: string | null;
  ip?: string | null;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Writes an audit entry. Never throws: losing an audit line must not break the
 * user-facing action, but it is always logged so the gap is visible.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        familyId: input.familyId ?? null,
        ipHash: hashIp(input.ip, env().SESSION_SECRET),
        metadata: input.metadata ?? {},
      },
    });
  } catch (error) {
    logger.error("audit.write_failed", { action: input.action, error: String(error) });
  }
}

export async function listAuditLogs(options: { skip?: number; take?: number; action?: string } = {}) {
  const { skip = 0, take = 50, action } = options;
  const where = action ? { action } : {};
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { actor: { select: { id: true, displayName: true, role: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}

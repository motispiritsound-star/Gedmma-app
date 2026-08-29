import type { Prisma, UserRole } from '@prisma/client';
import { prisma } from './db';
import { env } from './env';
import { hashIp } from './crypto';

export interface AuditInput {
  actorUserId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Writes an immutable audit record. Sensitive actions (safeguarding, refunds,
 * verification decisions, data erasure) MUST call this.
 * Never throws: a failed audit write must not mask the caller's own error, but
 * it is surfaced on stderr so it can be alerted on.
 */
export async function audit(input: AuditInput, tx: Prisma.TransactionClient | typeof prisma = prisma): Promise<void> {
  try {
    await tx.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        actorRole: input.actorRole ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
        ipHash: hashIp(input.ip, env().SESSION_SECRET),
        userAgent: input.userAgent?.slice(0, 255) ?? null,
      },
    });
  } catch (error) {
    console.error('[audit] failed to write audit entry', input.action, error);
  }
}

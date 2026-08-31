import type { Db } from './db.ts';
import { prisma } from './db.ts';

export interface AuditEntry {
  actorUserId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipHash?: string | null;
}

/**
 * Writes an audit line. Anything an operator does to someone else's data goes
 * through here — see SECURITY_AND_PRIVACY.md for what is expected to be
 * present when an incident is reconstructed.
 *
 * Never put personal data in `metadata`: ids and enums only.
 */
export async function audit(entry: AuditEntry, db: Db = prisma): Promise<void> {
  await db.auditLog.create({
    data: {
      actorUserId: entry.actorUserId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: (entry.metadata ?? {}) as object,
      ipHash: entry.ipHash ?? null,
    },
  });
}

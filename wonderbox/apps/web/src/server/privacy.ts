import { prisma } from '../lib/db.ts';
import { env } from '../lib/env.ts';
import { audit } from '../lib/audit.ts';
import { NotFoundError } from '../lib/errors.ts';
import type { ConsentType } from '@prisma/client';

/**
 * Consent, export and deletion.
 *
 * The shape of the promise made in SECURITY_AND_PRIVACY.md:
 *   * A parent can see everything held about their family and take it away.
 *   * Deleting removes profiles, listening history and consent evidence.
 *   * Invoices and the audit trail survive, because Dutch bookkeeping law
 *     requires seven years and an incident investigation requires the log.
 *     The user row is anonymised rather than dropped so those records still
 *     point somewhere.
 */

export const POLICY_VERSION = '2026-01';

export async function recordConsent(input: {
  familyId: string;
  childProfileId?: string | null;
  type: ConsentType;
  granted: boolean;
  grantedByUserId: string;
  ipHash?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const existing = await prisma.consentRecord.findFirst({
    where: {
      familyId: input.familyId,
      childProfileId: input.childProfileId ?? null,
      type: input.type,
      revokedAt: null,
    },
  });

  // Revoking is recorded, never erased: the history of what was agreed and
  // when is itself part of the evidence.
  if (existing) {
    await prisma.consentRecord.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
  }

  await prisma.consentRecord.create({
    data: {
      familyId: input.familyId,
      childProfileId: input.childProfileId ?? null,
      type: input.type,
      granted: input.granted,
      policyVersion: POLICY_VERSION,
      grantedByUserId: input.grantedByUserId,
      evidence: { ipHash: input.ipHash ?? null, userAgent: input.userAgent ?? null },
    },
  });

  await audit({
    actorUserId: input.grantedByUserId,
    actorRole: 'PARENT',
    action: input.granted ? 'consent.granted' : 'consent.revoked',
    entityType: 'Family',
    entityId: input.familyId,
    metadata: { type: input.type, policyVersion: POLICY_VERSION },
  });
}

/** True only when an adult has explicitly turned the microphone on. */
export async function speechToTextAllowed(
  familyId: string,
  childProfileId?: string | null,
): Promise<boolean> {
  if (!env.SPEECH_TO_TEXT_ENABLED) return false;
  const consent = await prisma.consentRecord.findFirst({
    where: {
      familyId,
      childProfileId: childProfileId ?? null,
      type: 'SPEECH_TO_TEXT',
      granted: true,
      revokedAt: null,
    },
  });
  return Boolean(consent);
}

export async function consentState(familyId: string) {
  const records = await prisma.consentRecord.findMany({
    where: { familyId, revokedAt: null },
    orderBy: { grantedAt: 'desc' },
  });
  return records;
}

/** Everything held about a family, as a portable JSON document. */
export async function exportFamilyData(familyId: string, actorUserId: string): Promise<unknown> {
  const family = await prisma.family.findUnique({
    where: { id: familyId },
    include: {
      users: {
        select: { id: true, email: true, displayName: true, locale: true, createdAt: true },
      },
      children: true,
      addresses: true,
      subscriptions: { include: { plan: true } },
      orders: { include: { items: true, shipments: true } },
      invoices: true,
      activatedBoxes: { include: { boxProduct: { select: { sku: true, slug: true } } } },
      progressEvents: { orderBy: { occurredAt: 'asc' } },
      parentSummaries: true,
      consentRecords: true,
      supportCases: true,
    },
  });
  if (!family) throw new NotFoundError('Family');

  await audit({
    actorUserId,
    actorRole: 'PARENT',
    action: 'privacy.exported',
    entityType: 'Family',
    entityId: familyId,
  });

  return {
    exportedAt: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
    note:
      'This is every record WonderBox holds about your family. Voice recordings are not listed ' +
      'because none are ever stored.',
    family,
  };
}

export interface DeletionReport {
  readonly progressEvents: number;
  readonly children: number;
  readonly summaries: number;
  readonly activatedBoxes: number;
  readonly sessions: number;
  readonly usersAnonymised: number;
  readonly invoicesRetained: number;
}

/**
 * Honours a deletion request. Personal content goes; financial records stay
 * but are detached from a recognisable person.
 */
export async function deleteFamilyData(
  familyId: string,
  actorUserId: string,
): Promise<DeletionReport> {
  return prisma.$transaction(async (tx) => {
    const invoicesRetained = await tx.invoice.count({ where: { familyId } });

    const progressEvents = await tx.progressEvent.deleteMany({ where: { familyId } });
    const summaries = await tx.parentSummary.deleteMany({ where: { familyId } });
    const children = await tx.childProfile.deleteMany({ where: { familyId } });
    // The boxes themselves are released so the codes cannot be re-claimed.
    await tx.activationCode.updateMany({
      where: { familyId },
      data: { state: 'REVOKED', revokedAt: new Date() },
    });
    const activatedBoxes = await tx.activatedBox.deleteMany({ where: { familyId } });
    await tx.consentRecord.deleteMany({ where: { familyId } });
    await tx.supportCase.updateMany({
      where: { familyId },
      data: { familyId: null, body: '[removed at the family’s request]' },
    });

    const users = await tx.user.findMany({ where: { familyId }, select: { id: true } });
    const sessions = await tx.session.deleteMany({
      where: { userId: { in: users.map((user) => user.id) } },
    });

    for (const user of users) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: `deleted+${user.id}@wonderbox.invalid`,
          displayName: 'Deleted account',
          passwordHash: 'deleted',
          deletedAt: new Date(),
          familyId: null,
        },
      });
    }

    await tx.family.update({
      where: { id: familyId },
      data: { name: 'Deleted family', deletedAt: new Date() },
    });

    await audit(
      {
        actorUserId,
        actorRole: 'PARENT',
        action: 'privacy.deleted',
        entityType: 'Family',
        entityId: familyId,
        metadata: {
          progressEvents: progressEvents.count,
          children: children.count,
          invoicesRetained,
        },
      },
      tx,
    );

    return {
      progressEvents: progressEvents.count,
      children: children.count,
      summaries: summaries.count,
      activatedBoxes: activatedBoxes.count,
      sessions: sessions.count,
      usersAnonymised: users.length,
      invoicesRetained,
    };
  });
}

export interface RetentionReport {
  readonly progressEvents: number;
  readonly auditLogs: number;
  readonly sessions: number;
}

/**
 * The scheduled retention sweep. Progress events older than the configured
 * window are dropped; the ParentSummary rows they fed remain, which is why
 * summaries are snapshotted monthly.
 */
export async function runRetentionSweep(now = new Date()): Promise<RetentionReport> {
  const progressCutoff = new Date(
    now.getTime() - env.PROGRESS_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
  const auditCutoff = new Date(now.getTime() - env.AUDIT_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const progressEvents = await prisma.progressEvent.deleteMany({
    where: { receivedAt: { lt: progressCutoff } },
  });
  const auditLogs = await prisma.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } });
  const sessions = await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });

  return {
    progressEvents: progressEvents.count,
    auditLogs: auditLogs.count,
    sessions: sessions.count,
  };
}

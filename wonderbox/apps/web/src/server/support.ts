import { randomUUID } from 'node:crypto';
import type { SafetySeverity, SupportCase, SupportCaseKind } from '@prisma/client';
import { prisma } from '../lib/db.ts';
import { NotFoundError } from '../lib/errors.ts';
import { audit } from '../lib/audit.ts';

/**
 * Support and safety reporting.
 *
 * A CONTENT_CONCERN or SAFETY_REPORT is escalated on arrival: it is filed at
 * WARNING severity so it sorts above billing questions, and it carries the
 * dialogue node it is about, so a reviewer can hear exactly what a child
 * heard without asking the parent to describe it.
 */

export async function openCase(input: {
  familyId?: string | null;
  reporterUserId?: string | null;
  kind: SupportCaseKind;
  subject: string;
  body: string;
  relatedBoxProductId?: string | null;
  relatedNodeId?: string | null;
}): Promise<SupportCase> {
  const escalated = input.kind === 'SAFETY_REPORT' || input.kind === 'CONTENT_CONCERN';
  const severity: SafetySeverity = escalated ? 'WARNING' : 'INFO';

  const supportCase = await prisma.supportCase.create({
    data: {
      reference: `WB-S-${randomUUID().slice(0, 8).toUpperCase()}`,
      familyId: input.familyId ?? null,
      reporterUserId: input.reporterUserId ?? null,
      kind: input.kind,
      severity,
      subject: input.subject,
      body: input.body,
      relatedBoxProductId: input.relatedBoxProductId ?? null,
      relatedNodeId: input.relatedNodeId ?? null,
      status: escalated ? 'TRIAGED' : 'OPEN',
    },
  });

  await audit({
    actorUserId: input.reporterUserId ?? null,
    action: 'support.caseOpened',
    entityType: 'SupportCase',
    entityId: supportCase.id,
    metadata: { kind: input.kind, severity },
  });
  return supportCase;
}

export async function resolveCase(
  caseId: string,
  actorUserId: string,
  note: string,
): Promise<SupportCase> {
  const existing = await prisma.supportCase.findUnique({ where: { id: caseId } });
  if (!existing) throw new NotFoundError('Support case');
  const updated = await prisma.supportCase.update({
    where: { id: caseId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolutionNote: note,
      assigneeUserId: actorUserId,
    },
  });
  await audit({
    actorUserId,
    actorRole: 'SUPPORT',
    action: 'support.caseResolved',
    entityType: 'SupportCase',
    entityId: caseId,
  });
  return updated;
}

/** The support queue, safety first and oldest first within a severity. */
export async function caseQueue() {
  return prisma.supportCase.findMany({
    where: { status: { in: ['OPEN', 'TRIAGED'] } },
    orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
    include: {
      relatedBox: { include: { translations: true } },
      reporter: { select: { displayName: true } },
    },
    take: 100,
  });
}

export async function casesForFamily(familyId: string) {
  return prisma.supportCase.findMany({
    where: { familyId },
    orderBy: { createdAt: 'desc' },
  });
}

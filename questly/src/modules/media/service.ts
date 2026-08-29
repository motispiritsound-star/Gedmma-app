import "server-only";
import { randomBytes } from "node:crypto";
import type { CompletionEvidence } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { mediaStorage } from "./storage";
import { extensionFor, validateUpload } from "./validation";
import { signMediaUrl } from "./signed-url";

/**
 * Stores an evidence image. Ownership is checked before a single byte is
 * written, and the storage key carries the family id so a stray object can
 * always be traced back and purged.
 */
export async function storeEvidence(params: {
  familyId: string;
  completionId: string;
  userId: string;
  bytes: Buffer;
}): Promise<CompletionEvidence> {
  const completion = await prisma.questCompletion.findFirst({
    where: { id: params.completionId, familyId: params.familyId },
    select: { id: true },
  });
  if (!completion) throw new NotFoundError("Adventure not found.");

  const type = validateUpload(params.bytes, env().MEDIA_MAX_BYTES);
  const key = `families/${params.familyId}/${params.completionId}/${randomBytes(12).toString("hex")}.${extensionFor(type)}`;
  const stored = await mediaStorage().put(key, params.bytes, type);

  const evidence = await prisma.completionEvidence.create({
    data: {
      questCompletionId: params.completionId,
      storageKey: stored.key,
      mimeType: type,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      visibility: "PRIVATE",
      uploadedByUserId: params.userId,
    },
  });

  await recordAudit({
    action: AUDIT_ACTIONS.evidenceUploaded,
    targetType: "completion_evidence",
    targetId: evidence.id,
    actorUserId: params.userId,
    familyId: params.familyId,
    metadata: { sizeBytes: stored.sizeBytes, mimeType: type },
  });

  return evidence;
}

export type EvidenceWithGrant = { id: string; mimeType: string; createdAt: Date; url: string };

/** Builds short-lived URLs for evidence the caller's family owns. */
export function grantUrls(
  evidence: { id: string; mimeType: string; createdAt: Date }[],
  familyId: string,
): EvidenceWithGrant[] {
  const expiresAt = Date.now() + env().MEDIA_URL_TTL_SECONDS * 1000;
  return evidence.map((item) => ({
    id: item.id,
    mimeType: item.mimeType,
    createdAt: item.createdAt,
    url: signMediaUrl({ evidenceId: item.id, familyId, expiresAt }, env().MEDIA_SECRET),
  }));
}

/**
 * Reads evidence bytes for a caller. Throws rather than returning null on a
 * cross-family attempt so the caller cannot distinguish "missing" from
 * "someone else's".
 */
export async function readEvidenceFor(params: {
  evidenceId: string;
  familyId: string;
  userId: string;
}): Promise<{ bytes: Buffer; mimeType: string }> {
  const evidence = await prisma.completionEvidence.findFirst({
    where: { id: params.evidenceId, deletedAt: null },
    include: { completion: { select: { familyId: true } } },
  });
  if (!evidence) throw new NotFoundError("Image not found.");
  if (evidence.completion.familyId !== params.familyId) {
    await recordAudit({
      action: AUDIT_ACTIONS.evidenceViewed,
      targetType: "completion_evidence",
      targetId: params.evidenceId,
      actorUserId: params.userId,
      familyId: params.familyId,
      metadata: { outcome: "denied_cross_family" },
    });
    throw new ForbiddenError("This image belongs to another family.");
  }

  const bytes = await mediaStorage().get(evidence.storageKey);
  if (!bytes) throw new NotFoundError("Image not found.");
  return { bytes, mimeType: evidence.mimeType };
}

export async function deleteEvidence(params: {
  evidenceId: string;
  familyId: string;
  userId: string;
}): Promise<void> {
  const evidence = await prisma.completionEvidence.findFirst({
    where: { id: params.evidenceId },
    include: { completion: { select: { familyId: true } } },
  });
  if (!evidence) throw new NotFoundError("Image not found.");
  if (evidence.completion.familyId !== params.familyId) throw new ForbiddenError();

  await mediaStorage().delete(evidence.storageKey);
  await prisma.completionEvidence.delete({ where: { id: evidence.id } });
  await recordAudit({
    action: AUDIT_ACTIONS.evidenceDeleted,
    targetType: "completion_evidence",
    targetId: evidence.id,
    actorUserId: params.userId,
    familyId: params.familyId,
  });
}

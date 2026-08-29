import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/db'
import { getEnv, getSessionSecret } from '@/env'
import { sha256, sign, verifySignature } from '@/lib/crypto'
import { forbidden, notFound, rateLimited } from '@/lib/errors'
import { enforceRateLimit } from '@/lib/rate-limit'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'
import { getMediaStorage } from './storage'
import { validateImageUpload } from './validation'
import type { CompletionEvidence } from '@/generated/prisma/client'

/**
 * Private family media.
 *
 * Every read goes through two independent checks: a short-lived signed token in
 * the URL *and* a live ownership check against the caller's session. Neither on
 * its own would be enough - the signature stops link guessing, the session
 * check stops a leaked link from working for a stranger.
 */

export type SignedMediaUrl = { url: string; expiresAt: Date }

function tokenPayload(evidenceId: string, familyId: string, expiresAtMs: number): string {
  return `${evidenceId}.${familyId}.${expiresAtMs}`
}

export function signMediaUrl(params: {
  evidenceId: string
  familyId: string
  ttlMinutes?: number
}): SignedMediaUrl {
  const ttl = (params.ttlMinutes ?? getEnv().MEDIA_URL_TTL_MINUTES) * 60 * 1000
  const expiresAtMs = Date.now() + ttl
  const signature = sign(
    tokenPayload(params.evidenceId, params.familyId, expiresAtMs),
    getSessionSecret(),
  )
  return {
    url: `/api/media/${params.evidenceId}?expires=${expiresAtMs}&signature=${signature}`,
    expiresAt: new Date(expiresAtMs),
  }
}

export function verifyMediaSignature(params: {
  evidenceId: string
  familyId: string
  expires: string | null
  signature: string | null
  now?: number
}): boolean {
  if (!params.expires || !params.signature) return false
  const expiresAtMs = Number(params.expires)
  if (!Number.isFinite(expiresAtMs)) return false
  if (expiresAtMs <= (params.now ?? Date.now())) return false
  return verifySignature(
    tokenPayload(params.evidenceId, params.familyId, expiresAtMs),
    params.signature,
    getSessionSecret(),
  )
}

export async function storeEvidence(params: {
  completionId: string
  familyId: string
  userId: string
  data: Buffer
  caption?: string | null
}): Promise<CompletionEvidence> {
  const limit = await enforceRateLimit('upload', params.userId)
  if (!limit.allowed) throw rateLimited('Too many uploads. Try again later.')

  const completion = await prisma.questCompletion.findFirst({
    where: { id: params.completionId, familyId: params.familyId },
  })
  if (!completion) throw notFound('Adventure not found.')

  const validated = validateImageUpload(params.data)
  const storageKey = `families/${params.familyId}/completions/${params.completionId}/${randomUUID()}.${validated.extension}`

  await getMediaStorage().put(storageKey, validated.buffer, validated.contentType)

  const evidence = await prisma.completionEvidence.create({
    data: {
      completionId: params.completionId,
      storageKey,
      mimeType: validated.contentType,
      sizeBytes: validated.sizeBytes,
      checksum: sha256(validated.buffer),
      caption: params.caption?.slice(0, 200) ?? null,
      isPrivate: true,
      uploadedByUserId: params.userId,
    },
  })

  await recordAudit({
    action: AUDIT_ACTIONS.evidenceUploaded,
    entityType: 'completion_evidence',
    entityId: evidence.id,
    actorUserId: params.userId,
    actorRole: 'PARENT',
    metadata: { completionId: params.completionId, sizeBytes: validated.sizeBytes },
  })

  return evidence
}

/**
 * Loads evidence bytes after confirming the requesting family owns them.
 * Administrators do not get an exception here: there is no code path that lets
 * an admin read family media. See SECURITY_AND_PRIVACY.md.
 */
export async function readEvidenceForFamily(params: {
  evidenceId: string
  familyId: string
  userId: string
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const evidence = await prisma.completionEvidence.findUnique({
    where: { id: params.evidenceId },
    include: { completion: { select: { familyId: true } } },
  })
  if (!evidence) throw notFound('That file does not exist.')
  if (evidence.completion.familyId !== params.familyId) throw forbidden()

  const buffer = await getMediaStorage().get(evidence.storageKey)

  await recordAudit({
    action: AUDIT_ACTIONS.evidenceAccessed,
    entityType: 'completion_evidence',
    entityId: evidence.id,
    actorUserId: params.userId,
    actorRole: 'PARENT',
  })

  return { buffer, mimeType: evidence.mimeType }
}

export async function deleteEvidence(params: {
  evidenceId: string
  familyId: string
  userId: string
}): Promise<void> {
  const evidence = await prisma.completionEvidence.findUnique({
    where: { id: params.evidenceId },
    include: { completion: { select: { familyId: true } } },
  })
  if (!evidence) throw notFound('That file does not exist.')
  if (evidence.completion.familyId !== params.familyId) throw forbidden()

  await getMediaStorage().delete(evidence.storageKey)
  await prisma.completionEvidence.delete({ where: { id: evidence.id } })

  await recordAudit({
    action: AUDIT_ACTIONS.evidenceDeleted,
    entityType: 'completion_evidence',
    entityId: evidence.id,
    actorUserId: params.userId,
    actorRole: 'PARENT',
  })
}

/** Removes every stored object belonging to a family. Used by account deletion. */
export async function purgeFamilyMedia(familyId: string): Promise<number> {
  const evidence = await prisma.completionEvidence.findMany({
    where: { completion: { familyId } },
    select: { id: true, storageKey: true },
  })
  const storage = getMediaStorage()
  for (const item of evidence) {
    await storage.delete(item.storageKey)
  }
  return evidence.length
}

import { describe, expect, it } from 'vitest'
import { prisma } from '@/lib/db'
import { startQuest, submitCompletion } from '@/modules/progress/service'
import {
  deleteEvidence,
  purgeFamilyMedia,
  readEvidenceForFamily,
  signMediaUrl,
  storeEvidence,
  verifyMediaSignature,
} from '@/modules/media/service'
import { getMediaStorage } from '@/modules/media/storage'
import { exportFamilyData, requestAccountDeletion, purgeExpiredDeletions } from '@/modules/privacy/service'
import { requireAdmin, requireFamily, requirePlatformAdmin } from '@/modules/auth/guards'
import { signIn } from '@/modules/auth/service'
import { destroySession } from '@/modules/auth/session'
import { AppError } from '@/lib/errors'
import { createTestFamily, fakeJpeg, questBySlug } from './helpers'

/** Acceptance criteria 7 and 8, plus the data-subject rights flows. */

async function familyWithEvidence() {
  const family = await createTestFamily({
    requireParentApproval: false,
    children: [{ nickname: 'Noor' }],
  })
  const quest = await questBySlug('leaf-detective')
  const completion = await startQuest({
    familyId: family.familyId,
    questId: quest.id,
    userId: family.userId,
    locale: 'nl',
  })
  await submitCompletion({
    familyId: family.familyId,
    userId: family.userId,
    input: {
      completionId: completion.id,
      childProfileIds: [family.children[0]!.id],
      offlineMinutes: 40,
      familyNote: 'Een privéherinnering.',
      reflections: [],
    },
  })
  const evidence = await storeEvidence({
    completionId: completion.id,
    familyId: family.familyId,
    userId: family.userId,
    data: fakeJpeg(),
    caption: 'Ons blad',
  })
  return { ...family, completionId: completion.id, evidence }
}

describe('private evidence', () => {
  it('is stored privately, with a checksum and an opaque key', async () => {
    const { evidence } = await familyWithEvidence()
    expect(evidence.isPrivate).toBe(true)
    expect(evidence.mimeType).toBe('image/jpeg')
    expect(evidence.checksum).toMatch(/^[a-f0-9]{64}$/)
    expect(evidence.storageKey).not.toContain('http')
    expect(await getMediaStorage().exists(evidence.storageKey)).toBe(true)
  })

  it('can be read by the family that owns it', async () => {
    const { familyId, userId, evidence } = await familyWithEvidence()
    const file = await readEvidenceForFamily({ evidenceId: evidence.id, familyId, userId })
    expect(file.mimeType).toBe('image/jpeg')
    expect(file.buffer.length).toBeGreaterThan(0)
  })

  it('cannot be read by another family', async () => {
    const owner = await familyWithEvidence()
    const stranger = await createTestFamily()

    await expect(
      readEvidenceForFamily({
        evidenceId: owner.evidence.id,
        familyId: stranger.familyId,
        userId: stranger.userId,
      }),
    ).rejects.toThrowError(AppError)

    await expect(
      readEvidenceForFamily({
        evidenceId: owner.evidence.id,
        familyId: stranger.familyId,
        userId: stranger.userId,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('cannot be deleted by another family', async () => {
    const owner = await familyWithEvidence()
    const stranger = await createTestFamily()
    await expect(
      deleteEvidence({
        evidenceId: owner.evidence.id,
        familyId: stranger.familyId,
        userId: stranger.userId,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' })
    expect(await getMediaStorage().exists(owner.evidence.storageKey)).toBe(true)
  })

  it('signs a URL that only works for the owning family and expires', async () => {
    const owner = await familyWithEvidence()
    const stranger = await createTestFamily()
    const signed = signMediaUrl({ evidenceId: owner.evidence.id, familyId: owner.familyId })
    const url = new URL(signed.url, 'http://localhost')
    const expires = url.searchParams.get('expires')
    const signature = url.searchParams.get('signature')

    expect(
      verifyMediaSignature({
        evidenceId: owner.evidence.id,
        familyId: owner.familyId,
        expires,
        signature,
      }),
    ).toBe(true)

    // The same signature does not work for another family...
    expect(
      verifyMediaSignature({
        evidenceId: owner.evidence.id,
        familyId: stranger.familyId,
        expires,
        signature,
      }),
    ).toBe(false)

    // ...nor for another photograph...
    expect(
      verifyMediaSignature({
        evidenceId: 'some-other-evidence',
        familyId: owner.familyId,
        expires,
        signature,
      }),
    ).toBe(false)

    // ...nor after it has expired.
    expect(
      verifyMediaSignature({
        evidenceId: owner.evidence.id,
        familyId: owner.familyId,
        expires,
        signature,
        now: Number(expires) + 1000,
      }),
    ).toBe(false)
  })

  it('rejects a file that is not really an image', async () => {
    const { familyId, userId, completionId } = await familyWithEvidence()
    await expect(
      storeEvidence({
        completionId,
        familyId,
        userId,
        data: Buffer.from('<?php system($_GET["c"]); ?>'.padEnd(64, ' ')),
      }),
    ).rejects.toThrowError(/JPEG, PNG and WebP/)
  })

  it('removes the stored object when the evidence is deleted', async () => {
    const { familyId, userId, evidence } = await familyWithEvidence()
    await deleteEvidence({ evidenceId: evidence.id, familyId, userId })
    expect(await getMediaStorage().exists(evidence.storageKey)).toBe(false)
    expect(await prisma.completionEvidence.findUnique({ where: { id: evidence.id } })).toBeNull()
  })
})

describe('role-based access control', () => {
  it('refuses admin access to a parent', async () => {
    const { email, password } = await createTestFamily()
    await signIn({ email, password })
    await expect(requireAdmin()).rejects.toMatchObject({ code: 'forbidden' })
    await expect(requirePlatformAdmin()).rejects.toMatchObject({ code: 'forbidden' })
    // ...while ordinary family access still works.
    await expect(requireFamily()).resolves.toBeTruthy()
  })

  it('allows a content admin into the admin area but not platform administration', async () => {
    await signIn({ email: 'redactie@questly.test', password: 'RedactieQuestly2026' })
    await expect(requireAdmin()).resolves.toBeTruthy()
    await expect(requirePlatformAdmin()).rejects.toMatchObject({ code: 'forbidden' })
  })

  it('allows a platform admin everywhere in administration', async () => {
    await signIn({ email: 'admin@questly.test', password: 'BeheerQuestly2026' })
    await expect(requireAdmin()).resolves.toBeTruthy()
    await expect(requirePlatformAdmin()).resolves.toBeTruthy()
  })

  it('refuses everything once the session is destroyed', async () => {
    const { email, password } = await createTestFamily()
    await signIn({ email, password })
    await destroySession()
    await expect(requireFamily()).rejects.toMatchObject({ code: 'unauthenticated' })
  })
})

describe('data export and deletion', () => {
  it('exports the family’s own data without embedding photographs', async () => {
    const { familyId, userId } = await familyWithEvidence()
    const data = await exportFamilyData({ familyId, userId })

    expect(data.family.name).toBe('Testgezin')
    expect(data.childProfiles[0]?.nickname).toBe('Noor')
    expect(data.completions[0]?.familyNote).toBe('Een privéherinnering.')
    expect(data.completions[0]?.photos[0]).toMatchObject({ mimeType: 'image/jpeg' })
    // The binary is referenced, never inlined.
    expect(JSON.stringify(data)).not.toContain('storageKey')
  })

  it('schedules deletion, keeps the data during the grace period, then purges it', async () => {
    const { familyId, userId, evidence } = await familyWithEvidence()

    const request = await requestAccountDeletion({ userId, familyId })
    expect(request.graceDays).toBeGreaterThan(0)

    const family = await prisma.family.findUniqueOrThrow({ where: { id: familyId } })
    expect(family.deletedAt).not.toBeNull()

    // Nothing is removed while the grace period is running.
    await purgeExpiredDeletions()
    expect(await prisma.family.findUnique({ where: { id: familyId } })).not.toBeNull()

    // Once the grace period has passed, everything goes.
    const afterGrace = new Date(Date.now() + (request.graceDays + 1) * 24 * 60 * 60 * 1000)
    const result = await purgeExpiredDeletions(afterGrace)
    expect(result.familiesPurged).toBeGreaterThanOrEqual(1)

    expect(await prisma.family.findUnique({ where: { id: familyId } })).toBeNull()
    expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull()
    expect(await prisma.childProfile.count({ where: { familyId } })).toBe(0)
    expect(await prisma.completionEvidence.findUnique({ where: { id: evidence.id } })).toBeNull()
    expect(await getMediaStorage().exists(evidence.storageKey)).toBe(false)
  })

  it('signing in again cancels a pending deletion', async () => {
    const { familyId, userId, email, password } = await createTestFamily()
    await requestAccountDeletion({ userId, familyId })
    const user = await signIn({ email, password })
    expect(user.deletedAt).toBeNull()
  })

  it('purges every stored object for a family', async () => {
    const { familyId, evidence } = await familyWithEvidence()
    expect(await purgeFamilyMedia(familyId)).toBe(1)
    expect(await getMediaStorage().exists(evidence.storageKey)).toBe(false)
  })
})

describe('audit logging', () => {
  it('records administrative and privacy-sensitive actions', async () => {
    const { familyId, userId } = await familyWithEvidence()
    await exportFamilyData({ familyId, userId })

    const actions = (
      await prisma.auditLog.findMany({ where: { actorUserId: userId }, select: { action: true } })
    ).map((entry) => entry.action)

    expect(actions).toContain('user.registered')
    expect(actions).toContain('child_profile.created')
    expect(actions).toContain('evidence.uploaded')
    expect(actions).toContain('user.data_exported')
  })

  it('stores only a hashed IP address', async () => {
    const { userId } = await createTestFamily()
    const entry = await prisma.auditLog.findFirstOrThrow({
      where: { actorUserId: userId, action: 'user.registered' },
    })
    expect(entry.ipHash).not.toBeNull()
    expect(entry.ipHash).not.toContain('203.0.113')
    expect(entry.ipHash).toMatch(/^[a-f0-9]{32}$/)
  })
})

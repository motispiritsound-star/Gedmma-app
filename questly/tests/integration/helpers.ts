import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/db'
import { registerParent } from '@/modules/auth/service'
import { createChildProfile } from '@/modules/families/service'
import { activatePlan } from '@/modules/subscriptions/service'
import type { ChildProfileInput } from '@/modules/families/schemas'

/** Shared fixtures for the integration suite. */

export function uniqueEmail(prefix = 'parent'): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@questly.test`
}

export async function createTestFamily(options: {
  password?: string
  premium?: boolean
  requireParentApproval?: boolean
  children?: Array<Partial<ChildProfileInput>>
} = {}) {
  const email = uniqueEmail()
  const password = options.password ?? 'AvontuurTesten2026'

  const { userId, familyId } = await registerParent({
    displayName: 'Test Ouder',
    email,
    password,
    familyName: 'Testgezin',
    locale: 'nl',
    consent: true,
  })

  if (options.premium ?? true) {
    await activatePlan({ familyId, plan: 'FAMILY_PREMIUM', actorUserId: userId })
  }

  if (options.requireParentApproval !== undefined) {
    await prisma.family.update({
      where: { id: familyId },
      data: { requireParentApproval: options.requireParentApproval },
    })
  }

  await prisma.family.update({
    where: { id: familyId },
    data: { onboardingCompletedAt: new Date() },
  })

  const children = []
  for (const [index, child] of (options.children ?? []).entries()) {
    children.push(
      await createChildProfile({
        familyId,
        actorUserId: userId,
        input: {
          nickname: child.nickname ?? `Kind${index + 1}`,
          ageBand: child.ageBand ?? 'AGE_9_11',
          avatarKey: child.avatarKey ?? 'fox',
          interestIds: child.interestIds ?? [],
        },
      }),
    )
  }

  return { userId, familyId, email, password, children }
}

export async function questBySlug(slug: string) {
  return prisma.quest.findUniqueOrThrow({ where: { slug } })
}

export async function interestIdsBySlug(slugs: string[]): Promise<string[]> {
  const interests = await prisma.interest.findMany({ where: { slug: { in: slugs } } })
  return interests.map((interest) => interest.id)
}

/** A tiny but structurally valid JPEG for upload tests. */
export function fakeJpeg(): Buffer {
  return Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]),
    Buffer.alloc(256, 0x20),
    Buffer.from([0xff, 0xd9]),
  ])
}

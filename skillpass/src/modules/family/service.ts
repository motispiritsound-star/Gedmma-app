import { z } from 'zod';
import { prisma } from '@/lib/db';
import { audit } from '@/lib/audit';
import { requireChildInFamily } from '@/lib/auth/rbac';
import { ValidationError } from '@/lib/errors';

export const ageBandSchema = z.enum(['AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17']);

export const childProfileSchema = z.object({
  /**
   * Nickname only. A value containing two or more capitalised words looks like
   * a full name, which we refuse to store for a child.
   */
  nickname: z
    .string()
    .trim()
    .min(2, 'Use at least two characters')
    .max(40)
    .refine((value) => value.split(/\s+/).filter(Boolean).length <= 2, 'Use a nickname, not a full name'),
  ageBand: ageBandSchema,
  pronouns: z.string().trim().max(30).optional().or(z.literal('')),
  accessibilityNeeds: z.string().trim().max(500).optional().or(z.literal('')),
  medicalNotes: z.string().trim().max(500).optional().or(z.literal('')),
  preferredLanguages: z.array(z.enum(['NL', 'EN'])).max(2).default(['NL']),
  interestSlugs: z.array(z.string().min(1)).max(12).default([]),
});

export type ChildProfileInput = z.infer<typeof childProfileSchema>;

const MAX_CHILDREN_PER_FAMILY = 10;

export async function listChildren(familyId: string) {
  return prisma.childProfile.findMany({
    where: { familyId, archivedAt: null },
    include: { interests: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createChildProfile(familyId: string, actorUserId: string, input: ChildProfileInput) {
  const count = await prisma.childProfile.count({ where: { familyId, archivedAt: null } });
  if (count >= MAX_CHILDREN_PER_FAMILY) {
    throw new ValidationError(`A family can hold at most ${MAX_CHILDREN_PER_FAMILY} child profiles`);
  }

  const interests = input.interestSlugs.length
    ? await prisma.interest.findMany({ where: { slug: { in: input.interestSlugs } }, select: { id: true } })
    : [];

  const child = await prisma.childProfile.create({
    data: {
      familyId,
      nickname: input.nickname,
      ageBand: input.ageBand,
      pronouns: input.pronouns || null,
      accessibilityNeeds: input.accessibilityNeeds || null,
      medicalNotes: input.medicalNotes || null,
      preferredLanguages: input.preferredLanguages,
      interests: { connect: interests.map((i) => ({ id: i.id })) },
    },
    include: { interests: true },
  });

  await audit({
    actorUserId,
    actorRole: 'GUARDIAN',
    action: 'family.child_created',
    entityType: 'ChildProfile',
    entityId: child.id,
    // Never log the nickname or any note: the audit log is widely readable.
    metadata: { familyId, ageBand: child.ageBand },
  });

  return child;
}

export async function updateChildProfile(
  familyId: string,
  actorUserId: string,
  childProfileId: string,
  input: ChildProfileInput,
) {
  await requireChildInFamily(familyId, childProfileId);
  const interests = input.interestSlugs.length
    ? await prisma.interest.findMany({ where: { slug: { in: input.interestSlugs } }, select: { id: true } })
    : [];

  const child = await prisma.childProfile.update({
    where: { id: childProfileId },
    data: {
      nickname: input.nickname,
      ageBand: input.ageBand,
      pronouns: input.pronouns || null,
      accessibilityNeeds: input.accessibilityNeeds || null,
      medicalNotes: input.medicalNotes || null,
      preferredLanguages: input.preferredLanguages,
      interests: { set: interests.map((i) => ({ id: i.id })) },
    },
    include: { interests: true },
  });

  await audit({
    actorUserId,
    actorRole: 'GUARDIAN',
    action: 'family.child_updated',
    entityType: 'ChildProfile',
    entityId: child.id,
    metadata: { familyId },
  });
  return child;
}

export async function archiveChildProfile(familyId: string, actorUserId: string, childProfileId: string) {
  await requireChildInFamily(familyId, childProfileId);
  await prisma.childProfile.update({ where: { id: childProfileId }, data: { archivedAt: new Date() } });
  await audit({
    actorUserId,
    actorRole: 'GUARDIAN',
    action: 'family.child_archived',
    entityType: 'ChildProfile',
    entityId: childProfileId,
    metadata: { familyId },
  });
}

export async function listInterests() {
  return prisma.interest.findMany({ orderBy: [{ category: 'asc' }, { slug: 'asc' }] });
}

export async function getFamilyOverview(familyId: string) {
  return prisma.family.findUniqueOrThrow({
    where: { id: familyId },
    include: {
      city: true,
      children: { where: { archivedAt: null }, include: { interests: true } },
      memberships: { include: { user: { select: { id: true, displayName: true, email: true } } } },
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
    },
  });
}

import "server-only";
import { Prisma, type AgeBand, type ChildProfile } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/errors";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { getEntitlements } from "@/modules/subscriptions";
import type { ChildProfileInput } from "./schemas";

export type ChildProfileWithInterests = ChildProfile & {
  interests: { interest: { id: string; slug: string; nameNl: string; nameEn: string; emoji: string } }[];
};

export async function listChildren(familyId: string): Promise<ChildProfileWithInterests[]> {
  return prisma.childProfile.findMany({
    where: { familyId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { interests: { include: { interest: true } } },
  });
}

export async function getChild(familyId: string, childId: string): Promise<ChildProfileWithInterests> {
  const child = await prisma.childProfile.findFirst({
    where: { id: childId, familyId, deletedAt: null },
    include: { interests: { include: { interest: true } } },
  });
  if (!child) throw new NotFoundError("Child profile not found.");
  return child;
}

async function resolveInterestIds(slugs: string[]): Promise<string[]> {
  if (slugs.length === 0) return [];
  const interests = await prisma.interest.findMany({ where: { slug: { in: slugs } }, select: { id: true } });
  return interests.map((i) => i.id);
}

export async function createChild(params: {
  familyId: string;
  actorUserId: string;
  input: ChildProfileInput;
}): Promise<ChildProfile> {
  const entitlements = await getEntitlements(params.familyId);
  const current = await prisma.childProfile.count({ where: { familyId: params.familyId, deletedAt: null } });
  if (current >= entitlements.maxChildProfiles) {
    throw new AppError(
      `Your current plan allows ${entitlements.maxChildProfiles} child profile(s).`,
      "child_limit_reached",
      403,
    );
  }

  const interestIds = await resolveInterestIds(params.input.interestSlugs);

  try {
    const child = await prisma.childProfile.create({
      data: {
        familyId: params.familyId,
        nickname: params.input.nickname,
        ageBand: params.input.ageBand,
        avatarKey: params.input.avatarKey,
        interests: { create: interestIds.map((interestId) => ({ interestId })) },
      },
    });

    await recordAudit({
      action: AUDIT_ACTIONS.childCreated,
      targetType: "child_profile",
      targetId: child.id,
      actorUserId: params.actorUserId,
      familyId: params.familyId,
      metadata: { ageBand: child.ageBand },
    });

    return child;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("There is already a profile with this nickname.", "nickname_taken", 409);
    }
    throw error;
  }
}

export async function updateChild(params: {
  familyId: string;
  childId: string;
  actorUserId: string;
  input: ChildProfileInput;
}): Promise<ChildProfile> {
  await getChild(params.familyId, params.childId);
  const interestIds = await resolveInterestIds(params.input.interestSlugs);

  try {
    const child = await prisma.$transaction(async (tx) => {
      await tx.childInterest.deleteMany({ where: { childProfileId: params.childId } });
      return tx.childProfile.update({
        where: { id: params.childId },
        data: {
          nickname: params.input.nickname,
          ageBand: params.input.ageBand,
          avatarKey: params.input.avatarKey,
          interests: { create: interestIds.map((interestId) => ({ interestId })) },
        },
      });
    });

    await recordAudit({
      action: AUDIT_ACTIONS.childUpdated,
      targetType: "child_profile",
      targetId: child.id,
      actorUserId: params.actorUserId,
      familyId: params.familyId,
    });

    return child;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("There is already a profile with this nickname.", "nickname_taken", 409);
    }
    throw error;
  }
}

/**
 * Soft deletion: participation history stays intact so the family's own record
 * of what they did together is not silently rewritten. The nickname is
 * scrambled immediately so no identifying text survives.
 */
export async function deleteChild(params: { familyId: string; childId: string; actorUserId: string }): Promise<void> {
  const child = await getChild(params.familyId, params.childId);
  await prisma.$transaction([
    prisma.childInterest.deleteMany({ where: { childProfileId: child.id } }),
    prisma.childProfile.update({
      where: { id: child.id },
      data: { deletedAt: new Date(), nickname: `deleted-${child.id.slice(-8)}` },
    }),
  ]);

  await recordAudit({
    action: AUDIT_ACTIONS.childDeleted,
    targetType: "child_profile",
    targetId: child.id,
    actorUserId: params.actorUserId,
    familyId: params.familyId,
  });
}

export function ageBandsFor(children: { ageBand: AgeBand }[]): AgeBand[] {
  return [...new Set(children.map((c) => c.ageBand))];
}

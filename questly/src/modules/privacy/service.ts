import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { NotFoundError } from "@/lib/errors";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { mediaStorage } from "@/modules/media";

/**
 * Complete export of a family's data, in the structure a person can actually
 * read. Evidence is listed by metadata rather than embedded: the bytes stay
 * behind the authenticated media route.
 */
export async function exportFamilyData(params: { familyId: string; userId: string }) {
  const family = await prisma.family.findFirst({
    where: { id: params.familyId, deletedAt: null },
    include: {
      preference: true,
      subscription: true,
      memberships: { include: { user: { select: { id: true, email: true, displayName: true, role: true, createdAt: true } } } },
      children: { include: { interests: { include: { interest: { select: { slug: true, nameNl: true, nameEn: true } } } } } },
      completions: {
        include: {
          quest: { select: { slug: true, translations: { select: { locale: true, title: true } } } },
          participants: { include: { childProfile: { select: { id: true, nickname: true } } } },
          reflections: { select: { prompt: true, answer: true, createdAt: true } },
          evidence: { select: { id: true, mimeType: true, sizeBytes: true, createdAt: true, visibility: true } },
        },
      },
      favourites: { include: { quest: { select: { slug: true } } } },
      plannedQuests: { include: { quest: { select: { slug: true } } } },
      awardedBadges: { include: { badge: { select: { slug: true, nameNl: true, nameEn: true } } } },
    },
  });
  if (!family) throw new NotFoundError("Family not found.");

  await recordAudit({
    action: AUDIT_ACTIONS.dataExported,
    targetType: "family",
    targetId: family.id,
    actorUserId: params.userId,
    familyId: family.id,
  });

  return {
    exportedAt: new Date().toISOString(),
    format: "questly-family-export/1",
    notice:
      "This file contains your family's data. Photo files are not embedded; download them from the app while your account is active.",
    family: {
      id: family.id,
      name: family.name,
      locale: family.locale,
      country: family.country,
      environment: family.environment,
      requireParentApproval: family.requireParentApproval,
      createdAt: family.createdAt,
    },
    parents: family.memberships.map((m) => ({ familyRole: m.role, ...m.user })),
    preferences: family.preference,
    subscription: family.subscription
      ? {
          plan: family.subscription.plan,
          status: family.subscription.status,
          provider: family.subscription.provider,
          currentPeriodEnd: family.subscription.currentPeriodEnd,
        }
      : null,
    children: family.children.map((child) => ({
      id: child.id,
      nickname: child.nickname,
      ageBand: child.ageBand,
      avatarKey: child.avatarKey,
      createdAt: child.createdAt,
      deletedAt: child.deletedAt,
      interests: child.interests.map((i) => i.interest.slug),
    })),
    completions: family.completions.map((completion) => ({
      id: completion.id,
      questSlug: completion.quest.slug,
      questTitles: completion.quest.translations,
      status: completion.status,
      startedAt: completion.startedAt,
      finishedAt: completion.finishedAt,
      approvedAt: completion.approvedAt,
      minutesSpent: completion.minutesSpent,
      familyNote: completion.familyNote,
      participants: completion.participants.map((p) => p.childProfile),
      reflections: completion.reflections,
      evidence: completion.evidence,
    })),
    favourites: family.favourites.map((f) => f.quest.slug),
    plannedQuests: family.plannedQuests.map((p) => ({ questSlug: p.quest.slug, scheduledFor: p.scheduledFor, note: p.note })),
    badges: family.awardedBadges.map((b) => ({ slug: b.badge.slug, awardedAt: b.awardedAt, childProfileId: b.childProfileId })),
  };
}

export async function requestAccountDeletion(params: { userId: string; familyId: string | null; reason?: string }) {
  const graceDays = env().RETENTION_DELETION_GRACE_DAYS;
  const scheduledPurgeAt = new Date(Date.now() + graceDays * 24 * 3600_000);

  const existing = await prisma.accountDeletionRequest.findFirst({
    where: { userId: params.userId, cancelledAt: null, purgedAt: null },
  });
  if (existing) return existing;

  const request = await prisma.accountDeletionRequest.create({
    data: {
      userId: params.userId,
      familyId: params.familyId,
      reason: params.reason ?? null,
      scheduledPurgeAt,
    },
  });

  await recordAudit({
    action: AUDIT_ACTIONS.deletionRequested,
    targetType: "user",
    targetId: params.userId,
    actorUserId: params.userId,
    familyId: params.familyId,
    metadata: { scheduledPurgeAt: scheduledPurgeAt.toISOString(), graceDays },
  });

  return request;
}

export async function cancelAccountDeletion(userId: string) {
  await prisma.accountDeletionRequest.updateMany({
    where: { userId, cancelledAt: null, purgedAt: null },
    data: { cancelledAt: new Date() },
  });
  await recordAudit({ action: AUDIT_ACTIONS.deletionCancelled, targetType: "user", targetId: userId, actorUserId: userId });
}

export async function pendingDeletion(userId: string) {
  return prisma.accountDeletionRequest.findFirst({
    where: { userId, cancelledAt: null, purgedAt: null },
    orderBy: { requestedAt: "desc" },
  });
}

/**
 * Hard deletion. Removes stored media first (the only data outside the
 * database), then the family row - cascades take care of everything below it.
 * Audit entries survive with the actor detached, so the record that a deletion
 * happened is not itself deleted.
 */
export async function purgeFamily(familyId: string): Promise<void> {
  const evidence = await prisma.completionEvidence.findMany({
    where: { completion: { familyId } },
    select: { storageKey: true },
  });
  const storage = mediaStorage();
  for (const item of evidence) {
    await storage.delete(item.storageKey).catch(() => undefined);
  }

  const memberships = await prisma.familyMembership.findMany({ where: { familyId }, select: { userId: true } });
  await prisma.family.delete({ where: { id: familyId } });
  await prisma.user.deleteMany({ where: { id: { in: memberships.map((m) => m.userId) }, role: "PARENT" } });
}

/** Runs due purges. Intended to be triggered by a scheduled job. */
export async function runDuePurges(now = new Date()): Promise<number> {
  const due = await prisma.accountDeletionRequest.findMany({
    where: { cancelledAt: null, purgedAt: null, scheduledPurgeAt: { lte: now } },
  });
  for (const request of due) {
    if (request.familyId) await purgeFamily(request.familyId);
    await prisma.accountDeletionRequest.updateMany({ where: { id: request.id }, data: { purgedAt: new Date() } });
  }
  return due.length;
}

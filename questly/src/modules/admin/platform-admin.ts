import "server-only";
import { prisma } from "@/lib/db";

/**
 * Family and user overviews for platform administrators.
 *
 * These queries deliberately select counts and coarse attributes only. A
 * platform administrator can see that a family exists and which plan it is on;
 * they cannot read family notes, reflections or evidence from here. Reaching
 * private media requires a separate, audited support flow that is out of scope
 * for the MVP - see SECURITY_AND_PRIVACY.md.
 */
export async function listFamiliesForAdmin(params: { skip?: number; take?: number } = {}) {
  const [items, total] = await Promise.all([
    prisma.family.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      select: {
        id: true,
        name: true,
        locale: true,
        environment: true,
        createdAt: true,
        onboardingCompletedAt: true,
        subscription: { select: { plan: true, status: true, provider: true, currentPeriodEnd: true } },
        _count: { select: { children: true, completions: true, memberships: true } },
      },
    }),
    prisma.family.count({ where: { deletedAt: null } }),
  ]);
  return { items, total };
}

export async function listUsersForAdmin(params: { skip?: number; take?: number } = {}) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip: params.skip ?? 0,
      take: params.take ?? 50,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: { deletedAt: null } }),
  ]);
  return { items, total };
}

export async function subscriptionOverview() {
  const [byPlan, recent] = await Promise.all([
    prisma.subscription.groupBy({ by: ["plan", "status"], _count: { _all: true } }),
    prisma.subscription.findMany({
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        id: true,
        plan: true,
        status: true,
        provider: true,
        currentPeriodEnd: true,
        updatedAt: true,
        family: { select: { id: true, name: true } },
      },
    }),
  ]);
  return { byPlan, recent };
}

export async function platformCounts() {
  const [families, users, children, quests, published, completions] = await Promise.all([
    prisma.family.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.childProfile.count({ where: { deletedAt: null } }),
    prisma.quest.count(),
    prisma.quest.count({ where: { status: "PUBLISHED" } }),
    prisma.questCompletion.count({ where: { status: "APPROVED" } }),
  ]);
  return { families, users, children, quests, published, completions };
}

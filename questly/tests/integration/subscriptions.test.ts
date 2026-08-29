import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { activatePremium, cancelPremium, getEntitlements, getSubscription, startUpgrade } from "@/modules/subscriptions";
import { accessibleQuestSlugs } from "@/modules/quests/service";
import { planQuest } from "@/modules/progress";
import { cleanupFamily, makeFamily, type TestFamily } from "../helpers";

const created: TestFamily[] = [];

async function newFamily(options: { premium?: boolean } = {}): Promise<TestFamily> {
  const family = await makeFamily(options);
  created.push(family);
  return family;
}

afterAll(async () => {
  for (const family of created) await cleanupFamily(family);
});

describe("plans without Stripe credentials", () => {
  it("upgrades a family through the mock provider", async () => {
    const family = await newFamily({ premium: false });
    expect((await getSubscription(family.familyId)).plan).toBe("FREE");

    const upgrade = await startUpgrade({
      familyId: family.familyId,
      userId: family.userId,
      email: family.email,
      appUrl: "http://localhost:3000",
    });
    expect(upgrade.simulated).toBe(true);

    await activatePremium({ familyId: family.familyId, actorUserId: family.userId });
    const entitlements = await getEntitlements(family.familyId);
    expect(entitlements.plan).toBe("FAMILY_PREMIUM");
    expect(entitlements.weeklyPlanner).toBe(true);
  });

  it("downgrades back to free", async () => {
    const family = await newFamily();
    await cancelPremium({ familyId: family.familyId, actorUserId: family.userId });
    expect((await getEntitlements(family.familyId)).plan).toBe("FREE");
  });

  it("treats a cancelled subscription as free", async () => {
    const family = await newFamily();
    await prisma.subscription.update({ where: { familyId: family.familyId }, data: { status: "CANCELED" } });
    expect((await getEntitlements(family.familyId)).plan).toBe("FREE");
  });
});

describe("library access", () => {
  it("limits the free plan to a rotating subset of the free quests", async () => {
    const free = await accessibleQuestSlugs(await getEntitlements((await newFamily({ premium: false })).familyId));
    expect(free).not.toBeNull();
    expect(free!.size).toBe(12);

    const premiumSlugs = await prisma.quest.findMany({
      where: { status: "PUBLISHED", isPremium: true },
      select: { slug: true },
    });
    for (const quest of premiumSlugs) {
      expect(free!.has(quest.slug)).toBe(false);
    }
  });

  it("gives premium families the whole library", async () => {
    const family = await newFamily();
    expect(await accessibleQuestSlugs(await getEntitlements(family.familyId))).toBeNull();
  });
});

describe("planner entitlement", () => {
  it("is refused on the free plan and allowed on premium", async () => {
    const free = await newFamily({ premium: false });
    await expect(
      planQuest({
        familyId: free.familyId,
        userId: free.userId,
        input: { questSlug: "leaf-detective", scheduledFor: "2026-09-01", childProfileIds: [] },
      }),
    ).rejects.toThrowError(/Family Premium/);

    const premium = await newFamily();
    await expect(
      planQuest({
        familyId: premium.familyId,
        userId: premium.userId,
        input: { questSlug: "leaf-detective", scheduledFor: "2026-09-01", childProfileIds: [] },
      }),
    ).resolves.toBeUndefined();
  });

  it("refuses the same quest twice on the same day", async () => {
    const family = await newFamily();
    const input = { questSlug: "insect-hotel", scheduledFor: "2026-09-02", childProfileIds: [] };
    await planQuest({ familyId: family.familyId, userId: family.userId, input });
    await expect(planQuest({ familyId: family.familyId, userId: family.userId, input })).rejects.toThrowError(
      /already planned/,
    );
  });
});

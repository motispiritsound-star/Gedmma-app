import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { registerParent } from "@/modules/auth/service";
import { createChild, listChildren } from "@/modules/children";
import { completeOnboarding, getPreference, updatePreference } from "@/modules/families";
import { getRecommendations } from "@/modules/recommendations";
import { decideCompletion, getCompletion, startQuest, submitCompletion, toggleFavourite } from "@/modules/progress";
import { getEntitlements } from "@/modules/subscriptions";
import { addChild, cleanupFamily, makeFamily, type TestFamily } from "../helpers";

const created: TestFamily[] = [];

async function newFamily(options: { premium?: boolean } = {}): Promise<TestFamily> {
  const family = await makeFamily(options);
  created.push(family);
  return family;
}

afterAll(async () => {
  for (const family of created) await cleanupFamily(family);
});

describe("a parent can register and create a family", () => {
  it("creates the user, the family, the owner membership and a free subscription", async () => {
    const email = `journey-${Date.now()}@questly.test`;
    const result = await registerParent(
      {
        displayName: "Nieuwe Ouder",
        email,
        password: "EenHeelLangWachtwoord1",
        familyName: "Familie Test",
        locale: "nl",
        consent: true,
      },
      null,
    );

    const family = await prisma.family.findUniqueOrThrow({
      where: { id: result.familyId },
      include: { memberships: true, subscription: true, preference: true },
    });

    expect(family.name).toBe("Familie Test");
    expect(family.memberships).toHaveLength(1);
    expect(family.memberships[0]?.userId).toBe(result.userId);
    expect(family.memberships[0]?.role).toBe("OWNER");
    expect(family.subscription?.plan).toBe("FREE");
    expect(family.preference).not.toBeNull();

    const user = await prisma.user.findUniqueOrThrow({ where: { id: result.userId } });
    expect(user.role).toBe("PARENT");
    expect(user.passwordHash).not.toContain("EenHeelLangWachtwoord1");

    await prisma.family.delete({ where: { id: result.familyId } });
    await prisma.user.delete({ where: { id: result.userId } });
  });

  it("refuses a second account for the same email address", async () => {
    const family = await newFamily();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: family.userId } });

    await expect(
      registerParent(
        {
          displayName: "Duplicate",
          email: user.email,
          password: "EenHeelLangWachtwoord1",
          familyName: "Duplicate",
          locale: "nl",
          consent: true,
        },
        null,
      ),
    ).rejects.toThrowError(/already exists/);
  });
});

describe("a parent can add a child profile", () => {
  it("stores a nickname, age band and interests, and no identifying data", async () => {
    const family = await newFamily();
    const child = await createChild({
      familyId: family.familyId,
      actorUserId: family.userId,
      input: { nickname: "Pip", ageBand: "AGE_6_8", avatarKey: "otter", interestSlugs: ["animals", "drawing"] },
    });

    const stored = await prisma.childProfile.findUniqueOrThrow({
      where: { id: child.id },
      include: { interests: { include: { interest: true } } },
    });

    expect(stored.nickname).toBe("Pip");
    expect(stored.ageBand).toBe("AGE_6_8");
    expect(stored.interests.map((link) => link.interest.slug).sort()).toEqual(["animals", "drawing"]);
    expect(Object.keys(stored)).not.toContain("email");
    expect(Object.keys(stored)).not.toContain("dateOfBirth");
  });

  it("enforces the plan's child profile limit", async () => {
    const family = await newFamily({ premium: false });
    const entitlements = await getEntitlements(family.familyId);
    expect(entitlements.maxChildProfiles).toBe(1);

    await addChild(family, { nickname: "Eerste" });
    await expect(addChild(family, { nickname: "Tweede" })).rejects.toThrowError(AppError);
  });
});

describe("recommendations respect the child's age band", () => {
  it("only suggests quests for the age bands present in the family", async () => {
    const family = await newFamily();
    await addChild(family, { nickname: "Kleintje", ageBand: "AGE_6_8", interestSlugs: ["animals"] });
    await completeOnboarding(family.familyId);

    const results = await getRecommendations({ familyId: family.familyId, locale: "nl", limit: 8 });

    expect(results.length).toBeGreaterThan(0);
    for (const entry of results) {
      expect(entry.quest.ageBands).toContain("AGE_6_8");
    }
  });

  it("explains each recommendation in human-readable reasons", async () => {
    const family = await newFamily();
    await addChild(family, { nickname: "Uitlegger", ageBand: "AGE_9_11", interestSlugs: ["experiments"] });

    const results = await getRecommendations({ familyId: family.familyId, locale: "nl", limit: 5 });
    expect(results.every((entry) => entry.reasons.length > 0)).toBe(true);
  });

  it("respects the family's duration preference", async () => {
    const family = await newFamily();
    await addChild(family, { nickname: "Kort", ageBand: "AGE_9_11" });
    await updatePreference({
      familyId: family.familyId,
      input: {
        preferredDurationMinutes: 30,
        preferredDifficulty: "EASY",
        settingPreference: "BOTH",
        participationStyle: "BOTH",
        availableMaterialSlugs: [],
      },
    });

    const results = await getRecommendations({ familyId: family.familyId, locale: "nl", limit: 3 });
    const average = results.reduce((total, entry) => total + entry.quest.durationMinutes, 0) / results.length;
    expect(average).toBeLessThanOrEqual(75);
  });
});

describe("a family can start and complete a quest", () => {
  it("walks the whole journey and awards a badge", async () => {
    const family = await newFamily();
    const child = await addChild(family, { nickname: "Avonturier", ageBand: "AGE_9_11" });

    const completion = await startQuest({
      familyId: family.familyId,
      userId: family.userId,
      questSlug: "leaf-detective",
    });
    expect(completion.status).toBe("IN_PROGRESS");

    const resumed = await startQuest({
      familyId: family.familyId,
      userId: family.userId,
      questSlug: "leaf-detective",
    });
    expect(resumed.id).toBe(completion.id);

    const result = await submitCompletion({
      familyId: family.familyId,
      userId: family.userId,
      input: {
        completionId: completion.id,
        minutesSpent: 50,
        childProfileIds: [child.id],
        familyNote: "Een prive notitie",
        reflections: [{ prompt: "Wat vond je het mooist?", answer: "De eik." }],
      },
    });

    expect(result.awaitingApproval).toBe(true);
    expect(result.completion.status).toBe("AWAITING_APPROVAL");
    expect(result.badges).toHaveLength(0);

    const decided = await decideCompletion({
      familyId: family.familyId,
      userId: family.userId,
      input: { completionId: completion.id, decision: "approve" },
    });

    expect(decided.completion.status).toBe("APPROVED");
    expect(decided.badges.map((award) => award.badge.slug)).toContain("first-adventure");

    const stored = await getCompletion(family.familyId, completion.id);
    expect(stored.minutesSpent).toBe(50);
    expect(stored.participants.map((p) => p.childProfileId)).toEqual([child.id]);
    expect(stored.reflections[0]?.answer).toBe("De eik.");
    expect(stored.familyNote).toBe("Een prive notitie");
  });

  it("approves immediately when the family turned parent approval off", async () => {
    const family = await newFamily();
    const child = await addChild(family, { nickname: "Zelfstandig", ageBand: "AGE_12_15" });
    await prisma.family.update({ where: { id: family.familyId }, data: { requireParentApproval: false } });

    const completion = await startQuest({
      familyId: family.familyId,
      userId: family.userId,
      questSlug: "price-detective",
    });
    const result = await submitCompletion({
      familyId: family.familyId,
      userId: family.userId,
      input: {
        completionId: completion.id,
        minutesSpent: 40,
        childProfileIds: [child.id],
        familyNote: "",
        reflections: [],
      },
    });

    expect(result.awaitingApproval).toBe(false);
    expect(result.completion.status).toBe("APPROVED");
  });

  it("refuses child profiles from another family", async () => {
    const family = await newFamily();
    const other = await newFamily();
    const otherChild = await addChild(other, { nickname: "Vreemde" });

    const completion = await startQuest({
      familyId: family.familyId,
      userId: family.userId,
      questSlug: "leaf-detective",
    });

    await expect(
      submitCompletion({
        familyId: family.familyId,
        userId: family.userId,
        input: {
          completionId: completion.id,
          minutesSpent: 20,
          childProfileIds: [otherChild.id],
          familyNote: "",
          reflections: [],
        },
      }),
    ).rejects.toThrowError(/does not belong to your family/);
  });

  it("refuses to start a premium quest on the free plan", async () => {
    const family = await newFamily({ premium: false });
    await expect(
      startQuest({ familyId: family.familyId, userId: family.userId, questSlug: "bridge-of-five-kilos" }),
    ).rejects.toThrowError(/Family Premium/);
  });
});

describe("badges", () => {
  it("awards a badge only once, even when the condition is met again", async () => {
    const family = await newFamily();
    const child = await addChild(family, { nickname: "Herhaler", ageBand: "AGE_9_11" });
    await prisma.family.update({ where: { id: family.familyId }, data: { requireParentApproval: false } });

    for (const slug of ["leaf-detective", "sound-map-walk"]) {
      const completion = await startQuest({ familyId: family.familyId, userId: family.userId, questSlug: slug });
      await submitCompletion({
        familyId: family.familyId,
        userId: family.userId,
        input: {
          completionId: completion.id,
          minutesSpent: 30,
          childProfileIds: [child.id],
          familyNote: "",
          reflections: [],
        },
      });
    }

    const awarded = await prisma.awardedBadge.findMany({
      where: { familyId: family.familyId, badge: { slug: "first-adventure" } },
    });
    expect(awarded).toHaveLength(1);
  });
});

describe("favourites and preferences", () => {
  it("toggles a favourite on and off", async () => {
    const family = await newFamily();
    expect(await toggleFavourite({ familyId: family.familyId, questSlug: "insect-hotel" })).toEqual({
      favourited: true,
    });
    expect(await toggleFavourite({ familyId: family.familyId, questSlug: "insect-hotel" })).toEqual({
      favourited: false,
    });
  });

  it("creates default preferences on demand", async () => {
    const family = await newFamily();
    const preference = await getPreference(family.familyId);
    expect(preference.preferredDurationMinutes).toBeGreaterThan(0);
    expect(await listChildren(family.familyId)).toEqual([]);
  });
});

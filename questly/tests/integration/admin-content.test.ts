import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  createQuest,
  duplicateQuest,
  getAdminQuest,
  listAdminQuests,
  listQuestVersions,
  questStatistics,
  setQuestStatus,
  updateQuest,
  type QuestUpsertInput,
} from "@/modules/admin";
import { getQuestBySlug, listQuests } from "@/modules/quests";
import { entitlementsFor } from "@/modules/subscriptions";
import { AUDIT_ACTIONS } from "@/modules/audit";

const slugs: string[] = [];

function draft(slug: string, overrides: Partial<QuestUpsertInput> = {}): QuestUpsertInput {
  return {
    slug,
    categorySlug: "science",
    ageBands: ["AGE_9_11"],
    seasons: ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
    durationMinutes: 45,
    difficulty: "EASY",
    setting: "INDOOR",
    weather: "ANY",
    minParticipants: 1,
    maxParticipants: 4,
    isPremium: false,
    requiresAdultSupervision: false,
    safetyLevel: "INFO",
    imageKey: "default",
    skillSlugs: ["curiosity"],
    materials: [{ slug: "paper", optional: false }],
    nl: {
      title: "Testquest",
      summary: "Een korte samenvatting voor de test.",
      story: "Een verhaal dat lang genoeg is om te valideren.",
      educationalObjective: "Het kind leert testen.",
      expectedResult: "Een geslaagde test.",
      preparation: ["Leg papier klaar"],
    },
    en: {
      title: "Test quest",
      summary: "A short summary for the test.",
      story: "A story that is long enough to validate.",
      educationalObjective: "The child learns to test.",
      expectedResult: "A passing test.",
      preparation: ["Lay out paper"],
    },
    steps: [
      {
        position: 1,
        requiresParent: false,
        nl: { title: "Stap een", body: "Doe het eerste ding." },
        en: { title: "Step one", body: "Do the first thing." },
      },
    ],
    safetyInstructions: [{ severity: "INFO", textNl: "Wees voorzichtig.", textEn: "Be careful." }],
    reflectionQuestions: [{ textNl: "Wat ging goed?", textEn: "What went well?" }],
    ...overrides,
  };
}

async function admin() {
  return prisma.user.findFirstOrThrow({ where: { role: "PLATFORM_ADMIN" } });
}

afterAll(async () => {
  await prisma.quest.deleteMany({ where: { slug: { in: slugs } } });
});

describe("an admin can create and publish a quest", () => {
  it("creates it as a draft that families cannot see yet", async () => {
    const actor = await admin();
    const slug = `admin-created-${Date.now()}`;
    slugs.push(slug);

    const quest = await createQuest({ input: draft(slug), actorUserId: actor.id });
    expect(quest.status).toBe("DRAFT");

    const published = await listQuests({
      filters: { search: "Testquest" },
      locale: "nl",
      entitlements: entitlementsFor("FAMILY_PREMIUM"),
    });
    expect(published.items.map((item) => item.slug)).not.toContain(slug);

    await setQuestStatus({ questId: quest.id, status: "PUBLISHED", actorUserId: actor.id });

    const detail = await getQuestBySlug({
      slug,
      locale: "nl",
      entitlements: entitlementsFor("FAMILY_PREMIUM"),
    });
    expect(detail.title).toBe("Testquest");
    expect(detail.steps).toHaveLength(1);
    expect(detail.reflectionQuestions).toHaveLength(1);
    expect(detail.safetyInstructions).toHaveLength(1);
  });

  it("stores both translations and renders each one", async () => {
    const actor = await admin();
    const slug = `admin-translations-${Date.now()}`;
    slugs.push(slug);

    const quest = await createQuest({ input: draft(slug), actorUserId: actor.id });
    await setQuestStatus({ questId: quest.id, status: "PUBLISHED", actorUserId: actor.id });

    const dutch = await getQuestBySlug({ slug, locale: "nl", entitlements: entitlementsFor("FAMILY_PREMIUM") });
    const english = await getQuestBySlug({ slug, locale: "en", entitlements: entitlementsFor("FAMILY_PREMIUM") });

    expect(dutch.title).toBe("Testquest");
    expect(english.title).toBe("Test quest");
    expect(dutch.steps[0]?.title).toBe("Stap een");
    expect(english.steps[0]?.title).toBe("Step one");
    expect(dutch.safetyInstructions[0]?.text).toBe("Wees voorzichtig.");
    expect(english.safetyInstructions[0]?.text).toBe("Be careful.");
  });

  it("rejects content that does not validate, whichever caller sends it", async () => {
    const actor = await admin();
    await expect(createQuest({ input: draft("Not A Slug"), actorUserId: actor.id })).rejects.toThrowError(
      /Invalid quest content/,
    );
    await expect(
      createQuest({ input: draft(`admin-nosteps-${Date.now()}`, { steps: [] }), actorUserId: actor.id }),
    ).rejects.toThrowError(/Invalid quest content/);
  });

  it("refuses a duplicate slug", async () => {
    const actor = await admin();
    const slug = `admin-duplicate-${Date.now()}`;
    slugs.push(slug);
    await createQuest({ input: draft(slug), actorUserId: actor.id });
    await expect(createQuest({ input: draft(slug), actorUserId: actor.id })).rejects.toThrowError(/already exists/);
  });
});

describe("content versioning", () => {
  it("records a version for every content change", async () => {
    const actor = await admin();
    const slug = `admin-versioned-${Date.now()}`;
    slugs.push(slug);

    const quest = await createQuest({ input: draft(slug), actorUserId: actor.id });
    await updateQuest({
      questId: quest.id,
      input: draft(slug, { nl: { ...draft(slug).nl, title: "Aangepaste titel" }, changeNote: "Titel bijgewerkt" }),
      actorUserId: actor.id,
    });

    const versions = await listQuestVersions(quest.id);
    expect(versions).toHaveLength(2);
    expect(versions[0]?.version).toBe(2);
    expect(versions[0]?.changeNote).toBe("Titel bijgewerkt");

    const reloaded = await getAdminQuest(slug);
    expect(reloaded.version).toBe(2);
    expect(reloaded.translations.find((row) => row.locale === "NL")?.title).toBe("Aangepaste titel");
  });

  it("duplicates a quest as a new draft with a free slug", async () => {
    const actor = await admin();
    const slug = `admin-source-${Date.now()}`;
    slugs.push(slug);

    const source = await createQuest({ input: draft(slug), actorUserId: actor.id });
    const copy = await duplicateQuest({ questId: source.id, actorUserId: actor.id });
    slugs.push(copy.slug);

    expect(copy.slug).toBe(`${slug}-copy`);
    expect(copy.status).toBe("DRAFT");

    const detail = await getAdminQuest(copy.slug);
    expect(detail.steps).toHaveLength(1);
    expect(detail.translations).toHaveLength(2);
  });

  it("unpublishes and archives", async () => {
    const actor = await admin();
    const slug = `admin-archive-${Date.now()}`;
    slugs.push(slug);

    const quest = await createQuest({ input: draft(slug), actorUserId: actor.id });
    await setQuestStatus({ questId: quest.id, status: "PUBLISHED", actorUserId: actor.id });
    const archived = await setQuestStatus({ questId: quest.id, status: "ARCHIVED", actorUserId: actor.id });

    expect(archived.status).toBe("ARCHIVED");
    expect(archived.archivedAt).not.toBeNull();

    const list = await listAdminQuests({ status: "ARCHIVED" });
    expect(list.map((item) => item.slug)).toContain(slug);
  });
});

describe("audit logging", () => {
  it("records sensitive administrative actions", async () => {
    const actor = await admin();
    const slug = `admin-audited-${Date.now()}`;
    slugs.push(slug);

    const quest = await createQuest({ input: draft(slug), actorUserId: actor.id });
    await setQuestStatus({ questId: quest.id, status: "PUBLISHED", actorUserId: actor.id });

    const entries = await prisma.auditLog.findMany({ where: { targetId: quest.id }, orderBy: { createdAt: "asc" } });
    const actions = entries.map((entry) => entry.action);
    expect(actions).toContain(AUDIT_ACTIONS.questCreated);
    expect(actions).toContain(AUDIT_ACTIONS.questPublished);
    expect(entries.every((entry) => entry.actorUserId === actor.id)).toBe(true);
  });
});

describe("statistics", () => {
  it("returns aggregate counts without exposing family identifiers", async () => {
    const stats = await questStatistics();
    expect(stats.byStatus.length).toBeGreaterThan(0);
    const serialised = JSON.stringify(stats);
    expect(serialised).not.toContain("familyId");
    expect(serialised).not.toContain("@questly.test");
  });
});

describe("the seeded library", () => {
  it("ships at least thirty published quests across ten categories", async () => {
    const published = await prisma.quest.count({ where: { status: "PUBLISHED" } });
    expect(published).toBeGreaterThanOrEqual(30);

    const categories = await prisma.category.findMany({
      select: { slug: true, _count: { select: { quests: true } } },
    });
    expect(categories).toHaveLength(10);
    for (const category of categories) {
      expect(category._count.quests, `category ${category.slug}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("gives every seeded quest both translations, steps, safety notes and reflections", async () => {
    const quests = await prisma.quest.findMany({
      where: { status: "PUBLISHED" },
      include: {
        translations: true,
        steps: { include: { translations: true } },
        safetyInstructions: true,
        reflectionQuestions: true,
        skills: true,
        materials: true,
      },
    });

    for (const quest of quests) {
      const locales = quest.translations.map((row) => row.locale).sort();
      expect(locales, `translations for ${quest.slug}`).toEqual(["EN", "NL"]);
      expect(quest.steps.length, `steps for ${quest.slug}`).toBeGreaterThan(0);
      expect(quest.safetyInstructions.length, `safety for ${quest.slug}`).toBeGreaterThan(0);
      expect(quest.reflectionQuestions.length, `reflections for ${quest.slug}`).toBeGreaterThan(0);
      expect(quest.skills.length, `skills for ${quest.slug}`).toBeGreaterThan(0);
      for (const step of quest.steps) {
        expect(step.translations.map((row) => row.locale).sort(), `step ${quest.slug}#${step.position}`).toEqual([
          "EN",
          "NL",
        ]);
      }
    }
  });
});

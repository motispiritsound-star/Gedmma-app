/**
 * Repeatable seed. Safe to run more than once: everything is upserted by its
 * natural key, and the demo family is rebuilt from scratch each time.
 *
 * Development credentials are printed at the end. They are deliberately obvious
 * and must never be used in a production configuration - see README.md.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";
import { hashPassword } from "../src/lib/crypto";
import { BADGES, CATEGORIES, INTERESTS, MATERIALS, QUESTS, SKILLS, type QuestSeed } from "./seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEMO = {
  parentEmail: "ouder@questly.test",
  parentPassword: "QuestlyDemo!2026",
  adminEmail: "admin@questly.test",
  adminPassword: "QuestlyAdmin!2026",
  contentEmail: "redactie@questly.test",
  contentPassword: "QuestlyRedactie!2026",
} as const;

async function seedTaxonomy() {
  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { ...category, sortOrder: index },
      update: { ...category, sortOrder: index },
    });
  }

  for (const skill of SKILLS) {
    await prisma.skill.upsert({ where: { slug: skill.slug }, create: skill, update: skill });
  }

  for (const material of MATERIALS) {
    const data = { ...material, commonlyAvailable: material.commonlyAvailable ?? true };
    await prisma.material.upsert({ where: { slug: material.slug }, create: data, update: data });
  }

  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  for (const [index, interest] of INTERESTS.entries()) {
    const category = categories.find((c) => c.slug === interest.categorySlug);
    const data = {
      slug: interest.slug,
      nameNl: interest.nameNl,
      nameEn: interest.nameEn,
      emoji: interest.emoji,
      sortOrder: index,
      categoryId: category?.id ?? null,
    };
    await prisma.interest.upsert({ where: { slug: interest.slug }, create: data, update: data });
  }

  const skills = await prisma.skill.findMany({ select: { id: true, slug: true } });
  for (const badge of BADGES) {
    const data = {
      slug: badge.slug,
      nameNl: badge.nameNl,
      nameEn: badge.nameEn,
      descriptionNl: badge.descriptionNl,
      descriptionEn: badge.descriptionEn,
      icon: badge.icon,
      scope: badge.scope,
      criteria: badge.criteria,
      threshold: badge.threshold,
      categoryId: badge.categorySlug ? (categories.find((c) => c.slug === badge.categorySlug)?.id ?? null) : null,
      skillId: badge.skillSlug ? (skills.find((s) => s.slug === badge.skillSlug)?.id ?? null) : null,
    };
    await prisma.badge.upsert({ where: { slug: badge.slug }, create: data, update: data });
  }
}

async function seedQuest(quest: QuestSeed, authorId: string) {
  const category = await prisma.category.findUniqueOrThrow({ where: { slug: quest.categorySlug } });
  const skills = await prisma.skill.findMany({ where: { slug: { in: quest.skillSlugs } } });
  const materials = await prisma.material.findMany({ where: { slug: { in: quest.materials.map((m) => m.slug) } } });

  const missingSkills = quest.skillSlugs.filter((slug) => !skills.some((s) => s.slug === slug));
  const missingMaterials = quest.materials.filter((m) => !materials.some((row) => row.slug === m.slug));
  if (missingSkills.length > 0) throw new Error(`Quest ${quest.slug} references unknown skills: ${missingSkills.join(", ")}`);
  if (missingMaterials.length > 0) {
    throw new Error(`Quest ${quest.slug} references unknown materials: ${missingMaterials.map((m) => m.slug).join(", ")}`);
  }

  const scalars = {
    categoryId: category.id,
    status: "PUBLISHED" as const,
    ageBands: quest.ageBands,
    seasons: quest.seasons ?? (["SPRING", "SUMMER", "AUTUMN", "WINTER"] as const),
    durationMinutes: quest.durationMinutes,
    difficulty: quest.difficulty,
    setting: quest.setting,
    weather: quest.weather ?? ("ANY" as const),
    minParticipants: quest.minParticipants,
    maxParticipants: quest.maxParticipants,
    isPremium: quest.isPremium ?? false,
    requiresAdultSupervision: quest.requiresAdultSupervision ?? false,
    safetyLevel: quest.safetyLevel ?? ("INFO" as const),
    imageKey: quest.slug,
    publishedAt: new Date(),
    createdById: authorId,
  };

  const nested = {
    translations: {
      create: [
        { locale: "NL" as const, ...quest.nl, audioScript: quest.nl.audioScript ?? null },
        { locale: "EN" as const, ...quest.en, audioScript: quest.en.audioScript ?? null },
      ],
    },
    skills: { create: skills.map((skill) => ({ skillId: skill.id })) },
    materials: {
      create: quest.materials.map((material) => ({
        materialId: materials.find((row) => row.slug === material.slug)!.id,
        quantity: material.quantity ?? null,
        optional: material.optional ?? false,
      })),
    },
    steps: {
      create: quest.steps.map((step, index) => ({
        position: index + 1,
        durationMinutes: step.durationMinutes ?? null,
        requiresParent: step.requiresParent ?? false,
        translations: {
          create: [
            { locale: "NL" as const, title: step.nl.title, body: step.nl.body, tip: step.nl.tip ?? null },
            { locale: "EN" as const, title: step.en.title, body: step.en.body, tip: step.en.tip ?? null },
          ],
        },
      })),
    },
    safetyInstructions: {
      create: quest.safety.map((entry, index) => ({
        position: index + 1,
        severity: entry.severity,
        textNl: entry.nl,
        textEn: entry.en,
      })),
    },
    reflectionQuestions: {
      create: quest.reflections.map((entry, index) => ({ position: index + 1, textNl: entry.nl, textEn: entry.en })),
    },
  };

  // Replace children explicitly: nested `create` cannot update in place.
  const existing = await prisma.quest.findUnique({ where: { slug: quest.slug }, select: { id: true } });
  if (existing) {
    await prisma.$transaction([
      prisma.questTranslation.deleteMany({ where: { questId: existing.id } }),
      prisma.questStep.deleteMany({ where: { questId: existing.id } }),
      prisma.questSkill.deleteMany({ where: { questId: existing.id } }),
      prisma.questMaterial.deleteMany({ where: { questId: existing.id } }),
      prisma.safetyInstruction.deleteMany({ where: { questId: existing.id } }),
      prisma.reflectionQuestion.deleteMany({ where: { questId: existing.id } }),
    ]);
    return prisma.quest.update({ where: { id: existing.id }, data: { ...scalars, ...nested } });
  }

  return prisma.quest.create({ data: { slug: quest.slug, ...scalars, ...nested } });
}

async function upsertUser(params: {
  email: string;
  password: string;
  displayName: string;
  role: "PARENT" | "CONTENT_ADMIN" | "PLATFORM_ADMIN";
}) {
  const passwordHash = await hashPassword(params.password);
  return prisma.user.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      passwordHash,
      displayName: params.displayName,
      role: params.role,
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash, displayName: params.displayName, role: params.role, emailVerifiedAt: new Date() },
  });
}

async function seedDemoFamily(parentId: string) {
  // Rebuild from scratch so repeated seeding never doubles the demo history.
  const previous = await prisma.familyMembership.findFirst({ where: { userId: parentId }, select: { familyId: true } });
  if (previous) await prisma.family.delete({ where: { id: previous.familyId } });

  const family = await prisma.family.create({
    data: {
      name: "Familie de Vries",
      locale: "NL",
      environment: "SUBURB",
      requireParentApproval: true,
      onboardingCompletedAt: new Date(),
      memberships: { create: { userId: parentId, role: "OWNER" } },
      preference: {
        create: {
          preferredDurationMinutes: 60,
          preferredDifficulty: "MEDIUM",
          settingPreference: "BOTH",
          participationStyle: "FAMILY",
          availableMaterialSlugs: ["paper", "pencils", "scissors", "tape", "cardboard", "notebook", "string", "jar", "water"],
        },
      },
      subscription: {
        create: {
          plan: "FAMILY_PREMIUM",
          status: "ACTIVE",
          provider: "MOCK",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600_000),
        },
      },
    },
  });

  const interests = await prisma.interest.findMany({ select: { id: true, slug: true } });
  const interestId = (slug: string) => interests.find((i) => i.slug === slug)!.id;

  const noor = await prisma.childProfile.create({
    data: {
      familyId: family.id,
      nickname: "Noor",
      ageBand: "AGE_6_8",
      avatarKey: "fox",
      interests: { create: [{ interestId: interestId("animals") }, { interestId: interestId("drawing") }, { interestId: interestId("outdoors") }] },
    },
  });

  const sam = await prisma.childProfile.create({
    data: {
      familyId: family.id,
      nickname: "Sam",
      ageBand: "AGE_12_15",
      avatarKey: "owl",
      interests: { create: [{ interestId: interestId("experiments") }, { interestId: interestId("money-and-ideas") }, { interestId: interestId("sport") }] },
    },
  });

  return { family, children: [noor, sam] as const };
}

async function seedDemoHistory(params: {
  familyId: string;
  parentId: string;
  children: readonly { id: string }[];
}) {
  const day = 24 * 3600_000;
  const plan: { slug: string; minutes: number; daysAgo: number; childIndexes: number[]; note: string }[] = [
    { slug: "leaf-detective", minutes: 50, daysAgo: 21, childIndexes: [0], note: "Noor vond een blad zo groot als haar hand." },
    { slug: "no-bake-energy-balls", minutes: 35, daysAgo: 14, childIndexes: [0, 1], note: "De eerste lading was te plakkerig, de tweede precies goed." },
    { slug: "paper-plane-lab", minutes: 45, daysAgo: 9, childIndexes: [0, 1], note: "Het smalle vliegtuigje won met bijna twee meter verschil." },
    { slug: "secret-act-of-kindness", minutes: 25, daysAgo: 4, childIndexes: [0], note: "" },
  ];

  for (const entry of plan) {
    const quest = await prisma.quest.findUniqueOrThrow({
      where: { slug: entry.slug },
      include: { reflectionQuestions: { orderBy: { position: "asc" } } },
    });
    const finishedAt = new Date(Date.now() - entry.daysAgo * day);

    await prisma.questCompletion.create({
      data: {
        familyId: params.familyId,
        questId: quest.id,
        status: "APPROVED",
        startedAt: new Date(finishedAt.getTime() - entry.minutes * 60_000),
        finishedAt,
        approvedAt: finishedAt,
        approvedByUserId: params.parentId,
        minutesSpent: entry.minutes,
        familyNote: entry.note || null,
        participants: { create: entry.childIndexes.map((index) => ({ childProfileId: params.children[index]!.id })) },
        reflections: {
          create: quest.reflectionQuestions.slice(0, 1).map((question) => ({
            reflectionQuestionId: question.id,
            prompt: question.textNl,
            answer: "Dat we het samen deden was het leukste.",
          })),
        },
      },
    });
  }

  // One completion left awaiting approval, so the dashboard shows that state.
  const awaiting = await prisma.quest.findUniqueOrThrow({ where: { slug: "sound-map-walk" } });
  await prisma.questCompletion.create({
    data: {
      familyId: params.familyId,
      questId: awaiting.id,
      status: "AWAITING_APPROVAL",
      startedAt: new Date(Date.now() - 2 * day),
      finishedAt: new Date(Date.now() - 2 * day),
      minutesSpent: 40,
      participants: { create: [{ childProfileId: params.children[1]!.id }] },
    },
  });

  const favouriteSlugs = ["insect-hotel", "bridge-of-five-kilos", "family-time-capsule"];
  for (const slug of favouriteSlugs) {
    const quest = await prisma.quest.findUniqueOrThrow({ where: { slug } });
    await prisma.favouriteQuest.create({ data: { familyId: params.familyId, questId: quest.id } });
  }

  const plannedSlugs: { slug: string; inDays: number }[] = [
    { slug: "insect-hotel", inDays: 2 },
    { slug: "soup-from-leftovers", inDays: 4 },
    { slug: "interview-a-grandparent", inDays: 6 },
  ];
  for (const planned of plannedSlugs) {
    const quest = await prisma.quest.findUniqueOrThrow({ where: { slug: planned.slug } });
    const date = new Date(Date.now() + planned.inDays * day);
    await prisma.plannedQuest.create({
      data: {
        familyId: params.familyId,
        questId: quest.id,
        scheduledFor: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
        timeOfDay: "AFTERNOON",
        createdByUserId: params.parentId,
        children: { create: params.children.map((child) => ({ childProfileId: child.id })) },
      },
    });
  }
}

async function awardSeedBadges(familyId: string) {
  const { evaluateBadges } = await import("../src/modules/progress/badges");
  await evaluateBadges({ familyId });
}

async function main() {
  console.log("Seeding taxonomy...");
  await seedTaxonomy();

  console.log("Seeding accounts...");
  const admin = await upsertUser({
    email: DEMO.adminEmail,
    password: DEMO.adminPassword,
    displayName: "Platformbeheerder",
    role: "PLATFORM_ADMIN",
  });
  await upsertUser({
    email: DEMO.contentEmail,
    password: DEMO.contentPassword,
    displayName: "Contentredacteur",
    role: "CONTENT_ADMIN",
  });
  const parent = await upsertUser({
    email: DEMO.parentEmail,
    password: DEMO.parentPassword,
    displayName: "Iris de Vries",
    role: "PARENT",
  });

  console.log(`Seeding ${QUESTS.length} quests...`);
  for (const quest of QUESTS) await seedQuest(quest, admin.id);

  console.log("Seeding demo family...");
  const { family, children } = await seedDemoFamily(parent.id);
  await seedDemoHistory({ familyId: family.id, parentId: parent.id, children });
  await awardSeedBadges(family.id);

  const counts = {
    quests: await prisma.quest.count(),
    categories: await prisma.category.count(),
    skills: await prisma.skill.count(),
    badges: await prisma.badge.count(),
    awarded: await prisma.awardedBadge.count(),
    completions: await prisma.questCompletion.count(),
    planned: await prisma.plannedQuest.count(),
  };

  console.log("\nSeed complete:", counts);
  console.log("\nDevelopment accounts (never use these in production):");
  console.log(`  Parent          ${DEMO.parentEmail} / ${DEMO.parentPassword}`);
  console.log(`  Platform admin  ${DEMO.adminEmail} / ${DEMO.adminPassword}`);
  console.log(`  Content admin   ${DEMO.contentEmail} / ${DEMO.contentPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });

export type { Prisma };

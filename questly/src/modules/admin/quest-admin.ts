import "server-only";
import { Prisma, type Quest } from "@prisma/client";
import { prisma } from "@/lib/db";
import { AppError, NotFoundError } from "@/lib/errors";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit";
import { detailInclude } from "@/modules/quests/service";
import { questUpsertSchema, type QuestUpsertInput } from "./schemas";

export type AdminQuestRow = Prisma.QuestGetPayload<{ include: typeof detailInclude }>;

export async function listAdminQuests(params: { status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"; search?: string } = {}) {
  const where: Prisma.QuestWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { slug: { contains: params.search, mode: "insensitive" } },
      { translations: { some: { title: { contains: params.search, mode: "insensitive" } } } },
    ];
  }

  return prisma.quest.findMany({
    where,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      category: true,
      translations: true,
      _count: { select: { completions: true, favourites: true } },
    },
  });
}

export async function getAdminQuest(slug: string): Promise<AdminQuestRow> {
  const quest = await prisma.quest.findUnique({ where: { slug }, include: detailInclude });
  if (!quest) throw new NotFoundError("Quest not found.");
  return quest;
}

/**
 * Re-validates at the module boundary. The server action already parses the
 * form, but this service is also reachable from the seed and from tests, and a
 * malformed slug or an empty step list must never reach the database.
 */
function validate(input: QuestUpsertInput): QuestUpsertInput {
  const parsed = questUpsertSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new AppError(
      `Invalid quest content: ${issue?.path.join(".") || "input"} ${issue?.message ?? ""}`.trim(),
      "invalid_quest",
      422,
    );
  }
  return parsed.data;
}

async function resolveIds(input: QuestUpsertInput) {
  const [category, skills, materials] = await Promise.all([
    prisma.category.findUnique({ where: { slug: input.categorySlug }, select: { id: true } }),
    prisma.skill.findMany({ where: { slug: { in: input.skillSlugs } }, select: { id: true, slug: true } }),
    prisma.material.findMany({ where: { slug: { in: input.materials.map((m) => m.slug) } }, select: { id: true, slug: true } }),
  ]);
  if (!category) throw new AppError("Unknown category.", "unknown_category");
  return { categoryId: category.id, skills, materials };
}

function translationData(input: QuestUpsertInput) {
  return [
    { locale: "NL" as const, ...input.nl, audioScript: input.nl.audioScript ?? null },
    { locale: "EN" as const, ...input.en, audioScript: input.en.audioScript ?? null },
  ];
}

/** Full content snapshot, stored on every write so changes are auditable. */
async function writeVersion(questId: string, version: number, changedByUserId: string, changeNote?: string) {
  const snapshot = await prisma.quest.findUniqueOrThrow({ where: { id: questId }, include: detailInclude });
  await prisma.questVersion.create({
    data: {
      questId,
      version,
      changedByUserId,
      changeNote: changeNote ?? null,
      snapshot: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
    },
  });
}

export async function createQuest(params: { input: QuestUpsertInput; actorUserId: string }): Promise<Quest> {
  params = { ...params, input: validate(params.input) };
  const { categoryId, skills, materials } = await resolveIds(params.input);

  try {
    const quest = await prisma.quest.create({
      data: {
        slug: params.input.slug,
        categoryId,
        status: "DRAFT",
        ageBands: params.input.ageBands,
        seasons: params.input.seasons,
        durationMinutes: params.input.durationMinutes,
        difficulty: params.input.difficulty,
        setting: params.input.setting,
        weather: params.input.weather,
        minParticipants: params.input.minParticipants,
        maxParticipants: params.input.maxParticipants,
        isPremium: params.input.isPremium,
        requiresAdultSupervision: params.input.requiresAdultSupervision,
        safetyLevel: params.input.safetyLevel,
        imageKey: params.input.imageKey,
        createdById: params.actorUserId,
        translations: { create: translationData(params.input) },
        skills: { create: skills.map((s) => ({ skillId: s.id })) },
        materials: {
          create: params.input.materials
            .map((m) => ({ material: materials.find((row) => row.slug === m.slug), quantity: m.quantity ?? null, optional: m.optional }))
            .filter((m): m is { material: { id: string; slug: string }; quantity: string | null; optional: boolean } => Boolean(m.material))
            .map((m) => ({ materialId: m.material.id, quantity: m.quantity, optional: m.optional })),
        },
        steps: {
          create: params.input.steps.map((step) => ({
            position: step.position,
            durationMinutes: step.durationMinutes ?? null,
            requiresParent: step.requiresParent,
            translations: {
              create: [
                { locale: "NL" as const, title: step.nl.title, body: step.nl.body, tip: step.nl.tip ?? null },
                { locale: "EN" as const, title: step.en.title, body: step.en.body, tip: step.en.tip ?? null },
              ],
            },
          })),
        },
        safetyInstructions: {
          create: params.input.safetyInstructions.map((s, index) => ({ position: index + 1, ...s })),
        },
        reflectionQuestions: {
          create: params.input.reflectionQuestions.map((q, index) => ({ position: index + 1, ...q })),
        },
      },
    });

    await writeVersion(quest.id, 1, params.actorUserId, params.input.changeNote ?? "Created");
    await recordAudit({
      action: AUDIT_ACTIONS.questCreated,
      targetType: "quest",
      targetId: quest.id,
      actorUserId: params.actorUserId,
      metadata: { slug: quest.slug },
    });
    return quest;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("A quest with this slug already exists.", "slug_taken", 409);
    }
    throw error;
  }
}

export async function updateQuest(params: {
  questId: string;
  input: QuestUpsertInput;
  actorUserId: string;
}): Promise<Quest> {
  params = { ...params, input: validate(params.input) };
  const existing = await prisma.quest.findUnique({ where: { id: params.questId }, select: { id: true, version: true } });
  if (!existing) throw new NotFoundError("Quest not found.");
  const { categoryId, skills, materials } = await resolveIds(params.input);

  const quest = await prisma.$transaction(async (tx) => {
    await tx.questTranslation.deleteMany({ where: { questId: params.questId } });
    await tx.questStep.deleteMany({ where: { questId: params.questId } });
    await tx.questSkill.deleteMany({ where: { questId: params.questId } });
    await tx.questMaterial.deleteMany({ where: { questId: params.questId } });
    await tx.safetyInstruction.deleteMany({ where: { questId: params.questId } });
    await tx.reflectionQuestion.deleteMany({ where: { questId: params.questId } });

    return tx.quest.update({
      where: { id: params.questId },
      data: {
        slug: params.input.slug,
        categoryId,
        ageBands: params.input.ageBands,
        seasons: params.input.seasons,
        durationMinutes: params.input.durationMinutes,
        difficulty: params.input.difficulty,
        setting: params.input.setting,
        weather: params.input.weather,
        minParticipants: params.input.minParticipants,
        maxParticipants: params.input.maxParticipants,
        isPremium: params.input.isPremium,
        requiresAdultSupervision: params.input.requiresAdultSupervision,
        safetyLevel: params.input.safetyLevel,
        imageKey: params.input.imageKey,
        version: existing.version + 1,
        translations: { create: translationData(params.input) },
        skills: { create: skills.map((s) => ({ skillId: s.id })) },
        materials: {
          create: params.input.materials
            .map((m) => ({ material: materials.find((row) => row.slug === m.slug), quantity: m.quantity ?? null, optional: m.optional }))
            .filter((m): m is { material: { id: string; slug: string }; quantity: string | null; optional: boolean } => Boolean(m.material))
            .map((m) => ({ materialId: m.material.id, quantity: m.quantity, optional: m.optional })),
        },
        steps: {
          create: params.input.steps.map((step) => ({
            position: step.position,
            durationMinutes: step.durationMinutes ?? null,
            requiresParent: step.requiresParent,
            translations: {
              create: [
                { locale: "NL" as const, title: step.nl.title, body: step.nl.body, tip: step.nl.tip ?? null },
                { locale: "EN" as const, title: step.en.title, body: step.en.body, tip: step.en.tip ?? null },
              ],
            },
          })),
        },
        safetyInstructions: { create: params.input.safetyInstructions.map((s, index) => ({ position: index + 1, ...s })) },
        reflectionQuestions: { create: params.input.reflectionQuestions.map((q, index) => ({ position: index + 1, ...q })) },
      },
    });
  });

  await writeVersion(quest.id, quest.version, params.actorUserId, params.input.changeNote);
  await recordAudit({
    action: AUDIT_ACTIONS.questUpdated,
    targetType: "quest",
    targetId: quest.id,
    actorUserId: params.actorUserId,
    metadata: { slug: quest.slug, version: quest.version },
  });
  return quest;
}

export async function setQuestStatus(params: {
  questId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  actorUserId: string;
}): Promise<Quest> {
  const quest = await prisma.quest.update({
    where: { id: params.questId },
    data: {
      status: params.status,
      publishedAt: params.status === "PUBLISHED" ? new Date() : null,
      archivedAt: params.status === "ARCHIVED" ? new Date() : null,
    },
  });

  const action =
    params.status === "PUBLISHED"
      ? AUDIT_ACTIONS.questPublished
      : params.status === "ARCHIVED"
        ? AUDIT_ACTIONS.questArchived
        : AUDIT_ACTIONS.questUnpublished;

  await recordAudit({ action, targetType: "quest", targetId: quest.id, actorUserId: params.actorUserId, metadata: { slug: quest.slug } });
  return quest;
}

export async function duplicateQuest(params: { questId: string; actorUserId: string }): Promise<Quest> {
  const source = await prisma.quest.findUnique({ where: { id: params.questId }, include: detailInclude });
  if (!source) throw new NotFoundError("Quest not found.");

  const base = `${source.slug}-copy`;
  let slug = base;
  for (let n = 2; await prisma.quest.findUnique({ where: { slug }, select: { id: true } }); n += 1) {
    slug = `${base}-${n}`;
  }

  const copy = await prisma.quest.create({
    data: {
      slug,
      categoryId: source.categoryId,
      status: "DRAFT",
      ageBands: source.ageBands,
      seasons: source.seasons,
      durationMinutes: source.durationMinutes,
      difficulty: source.difficulty,
      setting: source.setting,
      weather: source.weather,
      minParticipants: source.minParticipants,
      maxParticipants: source.maxParticipants,
      isPremium: source.isPremium,
      requiresAdultSupervision: source.requiresAdultSupervision,
      safetyLevel: source.safetyLevel,
      imageKey: source.imageKey,
      createdById: params.actorUserId,
      translations: {
        create: source.translations.map((t) => ({
          locale: t.locale,
          title: `${t.title} (copy)`,
          summary: t.summary,
          story: t.story,
          educationalObjective: t.educationalObjective,
          expectedResult: t.expectedResult,
          preparation: t.preparation,
          audioScript: t.audioScript,
        })),
      },
      skills: { create: source.skills.map((s) => ({ skillId: s.skillId, weight: s.weight })) },
      materials: { create: source.materials.map((m) => ({ materialId: m.materialId, quantity: m.quantity, optional: m.optional })) },
      steps: {
        create: source.steps.map((step) => ({
          position: step.position,
          durationMinutes: step.durationMinutes,
          requiresParent: step.requiresParent,
          translations: { create: step.translations.map((t) => ({ locale: t.locale, title: t.title, body: t.body, tip: t.tip })) },
        })),
      },
      safetyInstructions: {
        create: source.safetyInstructions.map((s) => ({ position: s.position, severity: s.severity, textNl: s.textNl, textEn: s.textEn })),
      },
      reflectionQuestions: {
        create: source.reflectionQuestions.map((q) => ({ position: q.position, textNl: q.textNl, textEn: q.textEn })),
      },
    },
  });

  await writeVersion(copy.id, 1, params.actorUserId, `Duplicated from ${source.slug}`);
  await recordAudit({
    action: AUDIT_ACTIONS.questDuplicated,
    targetType: "quest",
    targetId: copy.id,
    actorUserId: params.actorUserId,
    metadata: { from: source.slug, to: copy.slug },
  });
  return copy;
}

export async function listQuestVersions(questId: string) {
  return prisma.questVersion.findMany({
    where: { questId },
    orderBy: { version: "desc" },
    select: { id: true, version: true, changeNote: true, createdAt: true, changedBy: { select: { displayName: true } } },
  });
}

/** Aggregate, privacy-safe statistics: counts only, never family identifiers. */
export async function questStatistics() {
  const [byStatus, completions, topQuests, categories] = await Promise.all([
    prisma.quest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.questCompletion.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.questCompletion.groupBy({
      by: ["questId"],
      where: { status: "APPROVED" },
      _count: { _all: true },
      orderBy: { _count: { questId: "desc" } },
      take: 10,
    }),
    prisma.category.findMany({ select: { id: true, slug: true, nameNl: true, nameEn: true, _count: { select: { quests: true } } } }),
  ]);

  const questTitles = await prisma.quest.findMany({
    where: { id: { in: topQuests.map((q) => q.questId) } },
    select: { id: true, slug: true, translations: { where: { locale: "NL" }, select: { title: true } } },
  });

  return {
    byStatus,
    completions,
    categories,
    topQuests: topQuests.map((row) => {
      const quest = questTitles.find((q) => q.id === row.questId);
      return { slug: quest?.slug ?? row.questId, title: quest?.translations[0]?.title ?? "", count: row._count._all };
    }),
  };
}

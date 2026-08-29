import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { pickText, toDbLocale, type AppLocale } from "@/modules/i18n";
import { isoWeekKey, rotatingSelection, type Entitlements } from "@/modules/subscriptions/entitlements";
import type { QuestDetail, QuestFilters, QuestSummary } from "./types";

const summaryInclude = {
  category: true,
  translations: true,
  skills: { include: { skill: true } },
  materials: { include: { material: true } },
} satisfies Prisma.QuestInclude;

const detailInclude = {
  ...summaryInclude,
  steps: { include: { translations: true }, orderBy: { position: "asc" } },
  safetyInstructions: { orderBy: { position: "asc" } },
  reflectionQuestions: { orderBy: { position: "asc" } },
} satisfies Prisma.QuestInclude;

type QuestRow = Prisma.QuestGetPayload<{ include: typeof summaryInclude }>;
type QuestDetailRow = Prisma.QuestGetPayload<{ include: typeof detailInclude }>;

function translationFor<T extends { locale: "NL" | "EN" }>(rows: T[], locale: AppLocale): T | undefined {
  const wanted = toDbLocale(locale);
  return rows.find((r) => r.locale === wanted) ?? rows.find((r) => r.locale === "NL") ?? rows[0];
}

function toSummary(row: QuestRow, locale: AppLocale, accessibleSlugs: Set<string> | null): QuestSummary {
  const translation = translationFor(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    title: translation?.title ?? row.slug,
    summary: translation?.summary ?? "",
    imageKey: row.imageKey,
    ageBands: row.ageBands,
    durationMinutes: row.durationMinutes,
    difficulty: row.difficulty,
    setting: row.setting,
    weather: row.weather,
    seasons: row.seasons,
    minParticipants: row.minParticipants,
    maxParticipants: row.maxParticipants,
    isPremium: row.isPremium,
    requiresAdultSupervision: row.requiresAdultSupervision,
    safetyLevel: row.safetyLevel,
    status: row.status,
    category: {
      slug: row.category.slug,
      name: pickText(locale, row.category.nameNl, row.category.nameEn),
      colorToken: row.category.colorToken,
      icon: row.category.icon,
    },
    skills: row.skills.map((s) => ({ slug: s.skill.slug, name: pickText(locale, s.skill.nameNl, s.skill.nameEn) })),
    materials: row.materials.map((m) => ({
      slug: m.material.slug,
      name: pickText(locale, m.material.nameNl, m.material.nameEn),
      optional: m.optional,
      quantity: m.quantity,
    })),
    accessible: accessibleSlugs === null ? true : accessibleSlugs.has(row.slug),
  };
}

function toDetail(row: QuestDetailRow, locale: AppLocale, accessibleSlugs: Set<string> | null): QuestDetail {
  const translation = translationFor(row.translations, locale);
  return {
    ...toSummary(row, locale, accessibleSlugs),
    story: translation?.story ?? "",
    educationalObjective: translation?.educationalObjective ?? "",
    expectedResult: translation?.expectedResult ?? "",
    preparation: translation?.preparation ?? [],
    audioScript: translation?.audioScript ?? null,
    steps: row.steps.map((step) => {
      const stepTranslation = translationFor(step.translations, locale);
      return {
        id: step.id,
        position: step.position,
        title: stepTranslation?.title ?? `Step ${step.position}`,
        body: stepTranslation?.body ?? "",
        tip: stepTranslation?.tip ?? null,
        durationMinutes: step.durationMinutes,
        requiresParent: step.requiresParent,
      };
    }),
    safetyInstructions: row.safetyInstructions.map((s) => ({
      id: s.id,
      severity: s.severity,
      text: pickText(locale, s.textNl, s.textEn),
    })),
    reflectionQuestions: row.reflectionQuestions.map((q) => ({
      id: q.id,
      position: q.position,
      text: pickText(locale, q.textNl, q.textEn),
    })),
  };
}

export function buildWhere(filters: QuestFilters, includeUnpublished = false): Prisma.QuestWhereInput {
  const where: Prisma.QuestWhereInput = includeUnpublished ? {} : { status: "PUBLISHED" };

  if (filters.ageBand) where.ageBands = { has: filters.ageBand };
  if (filters.maxDurationMinutes) where.durationMinutes = { lte: filters.maxDurationMinutes };
  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.setting && filters.setting !== "BOTH") where.setting = { in: [filters.setting, "BOTH"] };
  if (filters.weather && filters.weather !== "ANY") where.weather = { in: [filters.weather, "ANY"] };
  if (filters.participants) {
    where.minParticipants = { lte: filters.participants };
    where.maxParticipants = { gte: filters.participants };
  }
  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.skillSlug) where.skills = { some: { skill: { slug: filters.skillSlug } } };
  if (filters.materialSlug) where.materials = { some: { material: { slug: filters.materialSlug } } };
  if (filters.access === "free") where.isPremium = false;
  if (filters.access === "premium") where.isPremium = true;
  if (filters.search) {
    where.translations = {
      some: {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { summary: { contains: filters.search, mode: "insensitive" } },
        ],
      },
    };
  }

  return where;
}

/**
 * Which published quests this family may actually start.
 * `null` means "everything" and skips the extra query.
 */
export async function accessibleQuestSlugs(
  entitlements: Entitlements,
  now = new Date(),
): Promise<Set<string> | null> {
  if (entitlements.libraryAccess === "FULL") return null;
  const free = await prisma.quest.findMany({
    where: { status: "PUBLISHED", isPremium: false },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });
  const selection = rotatingSelection(
    free.map((q) => q.slug),
    isoWeekKey(now),
    entitlements.rotationSize,
  );
  return new Set(selection);
}

export async function listQuests(params: {
  filters: QuestFilters;
  locale: AppLocale;
  entitlements: Entitlements;
  skip?: number;
  take?: number;
  includeUnpublished?: boolean;
}): Promise<{ items: QuestSummary[]; total: number }> {
  const where = buildWhere(params.filters, params.includeUnpublished);
  const [rows, total, accessible] = await Promise.all([
    prisma.quest.findMany({
      where,
      include: summaryInclude,
      orderBy: [{ difficulty: "asc" }, { durationMinutes: "asc" }, { slug: "asc" }],
      skip: params.skip ?? 0,
      take: params.take ?? 60,
    }),
    prisma.quest.count({ where }),
    accessibleQuestSlugs(params.entitlements),
  ]);

  return { items: rows.map((row) => toSummary(row, params.locale, accessible)), total };
}

export async function getQuestBySlug(params: {
  slug: string;
  locale: AppLocale;
  entitlements: Entitlements;
  includeUnpublished?: boolean;
}): Promise<QuestDetail> {
  const row = await prisma.quest.findFirst({
    where: { slug: params.slug, ...(params.includeUnpublished ? {} : { status: "PUBLISHED" }) },
    include: detailInclude,
  });
  if (!row) throw new NotFoundError("Quest not found.");
  const accessible = await accessibleQuestSlugs(params.entitlements);
  return toDetail(row, params.locale, accessible);
}

export async function getQuestById(params: {
  id: string;
  locale: AppLocale;
  entitlements: Entitlements;
  includeUnpublished?: boolean;
}): Promise<QuestDetail> {
  const row = await prisma.quest.findFirst({
    where: { id: params.id, ...(params.includeUnpublished ? {} : { status: "PUBLISHED" }) },
    include: detailInclude,
  });
  if (!row) throw new NotFoundError("Quest not found.");
  const accessible = await accessibleQuestSlugs(params.entitlements);
  return toDetail(row, params.locale, accessible);
}

export async function listCategories(locale: AppLocale) {
  const rows = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: pickText(locale, row.nameNl, row.nameEn),
    description: pickText(locale, row.descriptionNl, row.descriptionEn),
    colorToken: row.colorToken,
    icon: row.icon,
  }));
}

export async function listSkills(locale: AppLocale) {
  const rows = await prisma.skill.findMany({ orderBy: { slug: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: pickText(locale, row.nameNl, row.nameEn),
    description: pickText(locale, row.descriptionNl, row.descriptionEn),
    icon: row.icon,
  }));
}

export async function listMaterials(locale: AppLocale) {
  const rows = await prisma.material.findMany({ orderBy: { slug: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: pickText(locale, row.nameNl, row.nameEn),
    commonlyAvailable: row.commonlyAvailable,
  }));
}

export async function listInterests(locale: AppLocale) {
  const rows = await prisma.interest.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: pickText(locale, row.nameNl, row.nameEn),
    emoji: row.emoji,
    categoryId: row.categoryId,
  }));
}

export { toDetail as questRowToDetail, toSummary as questRowToSummary, detailInclude, summaryInclude };

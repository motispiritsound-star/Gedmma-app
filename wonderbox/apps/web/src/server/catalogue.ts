import { prisma } from '../lib/db.ts';
import type { Locale } from '../lib/i18n/locale.ts';
import { text, textList } from '../lib/i18n/localised.ts';
import { sellableBoxes } from './inventory.ts';

/**
 * Read models for the storefront. These are the only place the parent-facing
 * pages touch the database, so a page cannot accidentally select a column it
 * has no business rendering.
 */

/** Most serious first: a parent should meet the warnings before the notes. */
const SEVERITY_ORDER: Record<string, number> = { WARNING: 3, CAUTION: 2, INFO: 1 };

export interface CatalogueEntry {
  readonly id: string;
  readonly slug: string;
  readonly sku: string;
  readonly name: string;
  readonly tagline: string;
  readonly themeName: string;
  readonly themeColor: string;
  readonly ageMin: number;
  readonly ageMax: number;
  readonly priceCents: number;
  readonly currency: string;
  readonly chapterCount: number;
  readonly experimentCount: number;
  readonly inStock: boolean;
}

export async function catalogue(locale: Locale): Promise<CatalogueEntry[]> {
  const products = await prisma.boxProduct.findMany({
    where: { status: 'ACTIVE' },
    orderBy: [{ curriculumIndex: 'asc' }, { sku: 'asc' }],
    include: {
      theme: true,
      translations: true,
      journey: { include: { chapters: { include: { _count: { select: { experiments: true } } } } } },
    },
  });

  const stock = await Promise.all(products.map((product) => sellableBoxes(product.id)));

  return products.map((product, index) => {
    const translation =
      product.translations.find((candidate) => candidate.locale === locale) ??
      product.translations.find((candidate) => candidate.locale === 'en') ??
      product.translations[0];
    const chapters = product.journey?.chapters ?? [];
    return {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: translation?.name ?? product.sku,
      tagline: translation?.tagline ?? '',
      themeName: text(product.theme.name, locale, product.theme.slug),
      themeColor: product.theme.colorToken,
      ageMin: product.ageMin,
      ageMax: product.ageMax,
      priceCents: product.priceCents,
      currency: product.currency,
      chapterCount: chapters.length,
      experimentCount: chapters.reduce((total, chapter) => total + chapter._count.experiments, 0),
      inStock: (stock[index] ?? 0) > 0,
    };
  });
}

export interface BoxDetail extends CatalogueEntry {
  readonly description: string;
  readonly materials: readonly { name: string; quantity: number; note: string }[];
  readonly safety: readonly { id: string; severity: string; text: string; requiresAdult: boolean }[];
  readonly chapters: readonly {
    id: string;
    title: string;
    intro: string;
    estimatedMinutes: number;
    experiments: readonly { title: string; objective: string; steps: readonly string[] }[];
  }[];
  readonly availableLocales: readonly string[];
}

export async function boxDetail(slug: string, locale: Locale): Promise<BoxDetail | null> {
  const product = await prisma.boxProduct.findUnique({
    where: { slug },
    include: {
      theme: true,
      translations: true,
      safetyInstructions: true,
      kitComponents: { include: { inventoryItem: true } },
      journey: {
        include: {
          chapters: {
            orderBy: { orderIndex: 'asc' },
            include: { experiments: { include: { safetyInstructions: true } } },
          },
        },
      },
    },
  });
  if (!product || product.status !== 'ACTIVE') return null;

  const translation =
    product.translations.find((candidate) => candidate.locale === locale) ??
    product.translations.find((candidate) => candidate.locale === 'en') ??
    product.translations[0];
  const chapters = product.journey?.chapters ?? [];
  const available = await sellableBoxes(product.id);

  // The same instruction is reachable twice — once as a property of the box and
  // once through the experiment it guards — so collapse by id before rendering.
  const safety = [
    ...new Map(
      [
        ...product.safetyInstructions,
        ...chapters.flatMap((chapter) =>
          chapter.experiments.flatMap((experiment) => experiment.safetyInstructions),
        ),
      ].map((instruction) => [instruction.id, instruction]),
    ).values(),
  ].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: translation?.name ?? product.sku,
    tagline: translation?.tagline ?? '',
    description: translation?.description ?? '',
    themeName: text(product.theme.name, locale, product.theme.slug),
    themeColor: product.theme.colorToken,
    ageMin: product.ageMin,
    ageMax: product.ageMax,
    priceCents: product.priceCents,
    currency: product.currency,
    chapterCount: chapters.length,
    experimentCount: chapters.reduce((total, chapter) => total + chapter.experiments.length, 0),
    inStock: available > 0,
    availableLocales: product.translations.map((candidate) => candidate.locale),
    materials: product.kitComponents.map((component) => ({
      name: component.inventoryItem.name,
      quantity: component.quantity,
      note: text(component.note, locale, ''),
    })),
    safety: safety.map((instruction) => ({
      id: instruction.id,
      severity: instruction.severity,
      text: text(instruction.text, locale, instruction.code),
      requiresAdult: instruction.requiresAdult,
    })),
    chapters: chapters.map((chapter) => ({
      id: chapter.id,
      title: text(chapter.title, locale, chapter.key),
      intro: text(chapter.intro, locale, ''),
      estimatedMinutes: chapter.estimatedMinutes,
      experiments: chapter.experiments.map((experiment) => ({
        title: text(experiment.title, locale, experiment.key),
        objective: text(experiment.objective, locale, ''),
        steps: textList(experiment.steps, locale),
      })),
    })),
  };
}

export async function plans(locale: Locale) {
  const rows = await prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { priceCents: 'asc' },
  });
  return rows.map((plan) => ({
    id: plan.id,
    code: plan.code,
    name: text(plan.name, locale, plan.code),
    description: text(plan.description, locale, ''),
    priceCents: plan.priceCents,
    currency: plan.currency,
    intervalMonths: plan.intervalMonths,
    ageBand: plan.ageBand,
  }));
}

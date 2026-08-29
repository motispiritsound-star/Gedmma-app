import type { PrismaClient } from '@prisma/client';
import { PROVINCE_NAMES, type Locale, type Province } from '@buurklus/shared';

/**
 * Serves the catalog already collapsed to one language, so the app never has to
 * carry three copies of every label or decide which one to render.
 */
export class CatalogService {
  constructor(private readonly prisma: PrismaClient) {}

  private static pick(row: { nameNl: string; nameEn: string }, locale: Locale) {
    return locale === 'en' ? row.nameEn : row.nameNl;
  }

  async categories(locale: Locale) {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });

    const byId = new Map(rows.map((row) => [row.id, row]));
    return rows
      .filter((row) => row.parentId === null)
      .map((parent) => ({
        id: parent.id,
        slug: parent.slug,
        name: CatalogService.pick(parent, locale),
        icon: parent.icon,
        typicalBudgetMinCents: parent.typicalBudgetMinCents,
        typicalBudgetMaxCents: parent.typicalBudgetMaxCents,
        children: rows
          .filter((row) => row.parentId === parent.id)
          .map((child) => ({
            id: child.id,
            slug: child.slug,
            name: CatalogService.pick(child, locale),
            icon: child.icon,
            typicalBudgetMinCents: child.typicalBudgetMinCents ?? parent.typicalBudgetMinCents,
            typicalBudgetMaxCents: child.typicalBudgetMaxCents ?? parent.typicalBudgetMaxCents,
          })),
        parentName: parent.parentId ? CatalogService.pick(byId.get(parent.parentId)!, locale) : null,
      }));
  }

  async cities(locale: Locale) {
    const rows = await this.prisma.city.findMany({
      where: { isActive: true },
      orderBy: [{ population: 'desc' }, { nameNl: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: CatalogService.pick(row, locale),
      province: row.province,
      provinceName: PROVINCE_NAMES[row.province as Province][locale],
      lat: row.lat,
      lng: row.lng,
    }));
  }

  async plans(locale: Locale) {
    const rows = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
    });

    return rows.map((row) => {
      const perks = (row.perks as Record<string, string[]>)[locale] ?? [];
      return {
        id: row.id,
        slug: row.slug,
        name: CatalogService.pick(row, locale),
        tagline: locale === 'en' ? row.taglineEn : row.taglineNl,
        monthlyPriceCents: row.monthlyPriceCents,
        yearlyPriceCents: row.yearlyPriceCents,
        monthlyCredits: row.monthlyCredits,
        maxCategories: row.maxCategories,
        maxCities: row.maxCities,
        featured: row.featured,
        leadHeadStartMinutes: row.leadHeadStartMinutes,
        teamSeats: row.teamSeats,
        perks,
      };
    });
  }
}

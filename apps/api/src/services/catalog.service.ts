import type { PrismaClient } from '@prisma/client';
import { REGION_NAMES, type Locale, type Region } from '@khidma/shared';

/**
 * Serves the catalog already collapsed to one language, so the app never has to
 * carry three copies of every label or decide which one to render.
 */
export class CatalogService {
  constructor(private readonly prisma: PrismaClient) {}

  private static pick(row: { nameFr: string; nameAr: string; nameEn: string }, locale: Locale) {
    return locale === 'ar' ? row.nameAr : locale === 'en' ? row.nameEn : row.nameFr;
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
        typicalBudgetMinCentimes: parent.typicalBudgetMinCentimes,
        typicalBudgetMaxCentimes: parent.typicalBudgetMaxCentimes,
        children: rows
          .filter((row) => row.parentId === parent.id)
          .map((child) => ({
            id: child.id,
            slug: child.slug,
            name: CatalogService.pick(child, locale),
            icon: child.icon,
            typicalBudgetMinCentimes: child.typicalBudgetMinCentimes ?? parent.typicalBudgetMinCentimes,
            typicalBudgetMaxCentimes: child.typicalBudgetMaxCentimes ?? parent.typicalBudgetMaxCentimes,
          })),
        parentName: parent.parentId ? CatalogService.pick(byId.get(parent.parentId)!, locale) : null,
      }));
  }

  async cities(locale: Locale) {
    const rows = await this.prisma.city.findMany({
      where: { isActive: true },
      orderBy: [{ population: 'desc' }, { nameFr: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: CatalogService.pick(row, locale),
      region: row.region,
      regionName: REGION_NAMES[row.region as Region][locale],
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
        tagline: locale === 'ar' ? row.taglineAr : locale === 'en' ? row.taglineEn : row.taglineFr,
        monthlyPriceCentimes: row.monthlyPriceCentimes,
        yearlyPriceCentimes: row.yearlyPriceCentimes,
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

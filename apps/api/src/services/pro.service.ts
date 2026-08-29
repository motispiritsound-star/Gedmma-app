import type { Prisma, PrismaClient } from '@prisma/client';
import type { SearchProsInput, UpsertProProfileInput } from '@buurklus/shared';
import { AppError } from '../lib/errors.js';
import { cursorArgs, toPage } from '../lib/pagination.js';
import { SubscriptionService } from './subscription.service.js';

export const PUBLIC_PRO_SELECT = {
  id: true,
  displayName: true,
  bio: true,
  logoUrl: true,
  websiteUrl: true,
  portfolioUrls: true,
  yearsExperience: true,
  teamSize: true,
  legalForm: true,
  serviceRadiusKm: true,
  verificationStatus: true,
  verifiedAt: true,
  ratingAverage: true,
  ratingCount: true,
  jobsWon: true,
  medianResponseMinutes: true,
  createdAt: true,
  // The KvK number is public information — anyone can look the business up in
  // the register — and showing it is a strong trust signal. The VAT id and the
  // IBAN are not public, and never leave here.
  kvk: true,
  baseCity: { select: { slug: true, nameNl: true, nameEn: true } },
  trades: {
    select: {
      isPrimary: true,
      category: { select: { slug: true, nameNl: true, nameEn: true, icon: true } },
    },
  },
  coverage: { select: { city: { select: { slug: true, nameNl: true, nameEn: true } } } },
} satisfies Prisma.ProProfileSelect;

export class ProService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly subscriptions: SubscriptionService,
  ) {}

  /**
   * Creates or replaces a professional profile. Trades and coverage are
   * capped by the pro's current plan; a pro with no subscription yet is
   * checked against the entry-level limits so onboarding can complete before
   * they pay.
   */
  async upsert(userId: string, input: UpsertProProfileInput) {
    const [baseCity, categories, cities] = await Promise.all([
      this.prisma.city.findUnique({ where: { slug: input.baseCitySlug } }),
      this.prisma.category.findMany({ where: { slug: { in: input.categorySlugs } } }),
      this.prisma.city.findMany({ where: { slug: { in: input.citySlugs } } }),
    ]);

    if (!baseCity) throw new AppError('not_found', { details: { field: 'baseCitySlug' } });
    if (categories.length !== input.categorySlugs.length) {
      throw new AppError('not_found', { details: { field: 'categorySlugs' } });
    }
    if (cities.length !== input.citySlugs.length) {
      throw new AppError('not_found', { details: { field: 'citySlugs' } });
    }

    const existing = await this.prisma.proProfile.findUnique({ where: { userId } });
    const limits = existing ? await this.planLimits(existing.id) : await this.entryLevelLimits();

    if (categories.length > limits.maxCategories) throw new AppError('plan_limit_categories');
    if (limits.maxCities != null && cities.length > limits.maxCities) {
      throw new AppError('plan_limit_cities');
    }

    const data = {
      displayName: input.displayName,
      legalForm: input.legalForm,
      bio: input.bio,
      yearsExperience: input.yearsExperience,
      teamSize: input.teamSize,
      baseCityId: baseCity.id,
      serviceRadiusKm: input.serviceRadiusKm,
      logoUrl: input.logoUrl,
      websiteUrl: input.websiteUrl || null,
      portfolioUrls: input.portfolioUrls,
      kvk: input.kvk,
      vatId: input.vatId ?? null,
      iban: input.iban ?? null,
      documentUrls: input.documentUrls,
    };

    return this.prisma.$transaction(async (tx) => {
      const profile = existing
        ? await tx.proProfile.update({ where: { id: existing.id }, data })
        : await tx.proProfile.create({ data: { ...data, userId, verificationStatus: 'PENDING' } });

      // A profile edit replaces the whole set rather than diffing it: the app
      // always submits the complete selection.
      await tx.proTrade.deleteMany({ where: { proId: profile.id } });
      await tx.proTrade.createMany({
        data: categories.map((category, index) => ({
          proId: profile.id,
          categoryId: category.id,
          isPrimary: index === 0,
        })),
      });

      await tx.proCoverage.deleteMany({ where: { proId: profile.id } });
      await tx.proCoverage.createMany({
        data: cities.map((city) => ({ proId: profile.id, cityId: city.id })),
      });

      if (!existing) {
        await tx.user.update({ where: { id: userId }, data: { role: 'PRO' } });
      }

      return profile;
    });
  }

  async getPublic(proId: string) {
    const pro = await this.prisma.proProfile.findUnique({
      where: { id: proId },
      select: PUBLIC_PRO_SELECT,
    });
    if (!pro) throw new AppError('not_found');
    return pro;
  }

  async getOwn(userId: string) {
    const pro = await this.prisma.proProfile.findUnique({
      where: { userId },
      select: {
        ...PUBLIC_PRO_SELECT,
        userId: true,
        vatId: true,
        iban: true,
        documentUrls: true,
        verificationNotes: true,
        quotesSent: true,
      },
    });
    if (!pro) throw new AppError('pro_profile_required');
    return pro;
  }

  /** Customer-facing directory search. */
  async search(input: SearchProsInput) {
    const where: Prisma.ProProfileWhereInput = {
      ...(input.verifiedOnly ? { verificationStatus: 'VERIFIED' } : {}),
      ...(input.minRating != null ? { ratingAverage: { gte: input.minRating } } : {}),
      ...(input.categorySlug ? { trades: { some: { category: { slug: input.categorySlug } } } } : {}),
      ...(input.citySlug ? { coverage: { some: { city: { slug: input.citySlug } } } } : {}),
      ...(input.query
        ? {
            OR: [
              { displayName: { contains: input.query, mode: 'insensitive' } },
              { bio: { contains: input.query, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.proProfile.findMany({
      where,
      // Verified and better-rated businesses first; ties broken by volume.
      orderBy: [
        { verificationStatus: 'asc' },
        { ratingAverage: 'desc' },
        { ratingCount: 'desc' },
      ],
      select: PUBLIC_PRO_SELECT,
      ...cursorArgs(input.cursor, input.limit),
    });
    return toPage(rows, input.limit);
  }

  async requireProfileId(userId: string): Promise<string> {
    const pro = await this.prisma.proProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!pro) throw new AppError('pro_profile_required');
    return pro.id;
  }

  private async planLimits(proId: string) {
    const subscription = await this.subscriptions.current(proId);
    if (subscription && SubscriptionService.grantsAccess(subscription)) {
      return {
        maxCategories: subscription.plan.maxCategories,
        maxCities: subscription.plan.maxCities,
      };
    }
    return this.entryLevelLimits();
  }

  private async entryLevelLimits() {
    const entry = await this.prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      select: { maxCategories: true, maxCities: true },
    });
    return entry ?? { maxCategories: 2, maxCities: 1 };
  }
}

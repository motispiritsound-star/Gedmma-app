import type { Prisma, PrismaClient } from '@prisma/client';
import {
  JOB_LIFETIME_DAYS,
  JOB_MAX_QUOTES,
  type CreateJobInput,
  type ListLeadsInput,
  type UpdateJobInput,
  eurosToCents,
  distanceKm,
  leadDelayMinutes,
} from '@buurklus/shared';
import { AppError } from '../lib/errors.js';
import { generateJobReference } from '../lib/crypto.js';
import { cursorArgs, toPage } from '../lib/pagination.js';

/** Fields a professional may see before the customer awards them the job. */
export const LEAD_SAFE_JOB_SELECT = {
  id: true,
  reference: true,
  title: true,
  description: true,
  district: true,
  urgency: true,
  status: true,
  propertyType: true,
  preferredStartDate: true,
  budgetMinCents: true,
  budgetMaxCents: true,
  photoUrls: true,
  quoteCount: true,
  viewCount: true,
  publishedAt: true,
  expiresAt: true,
  createdAt: true,
  category: { select: { id: true, slug: true, nameNl: true, nameEn: true, icon: true } },
  city: { select: { id: true, slug: true, nameNl: true, nameEn: true, lat: true, lng: true } },
  customer: { select: { id: true, firstName: true, avatarUrl: true } },
} satisfies Prisma.JobSelect;

export class JobService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(customerId: string, input: CreateJobInput) {
    const [category, city] = await Promise.all([
      this.prisma.category.findUnique({ where: { slug: input.categorySlug } }),
      this.prisma.city.findUnique({ where: { slug: input.citySlug } }),
    ]);
    if (!category || !category.isActive) throw new AppError('not_found', { details: { field: 'categorySlug' } });
    if (!city || !city.isActive) throw new AppError('not_found', { details: { field: 'citySlug' } });

    const now = new Date();
    return this.prisma.job.create({
      data: {
        reference: generateJobReference(),
        customerId,
        categoryId: category.id,
        cityId: city.id,
        title: input.title,
        description: input.description,
        district: input.district,
        addressLine: input.addressLine,
        lat: input.coordinates?.lat,
        lng: input.coordinates?.lng,
        propertyType: input.propertyType,
        urgency: input.urgency,
        preferredStartDate: input.preferredStartDate,
        budgetMinCents: input.budgetMinEur != null ? eurosToCents(input.budgetMinEur) : null,
        budgetMaxCents: input.budgetMaxEur != null ? eurosToCents(input.budgetMaxEur) : null,
        photoUrls: input.photoUrls,
        contactPhone: input.contactPhone,
        status: 'OPEN',
        publishedAt: now,
        expiresAt: new Date(now.getTime() + JOB_LIFETIME_DAYS * 86_400_000),
      },
      select: LEAD_SAFE_JOB_SELECT,
    });
  }

  /** The customer's own view, which includes the address and every quote. */
  async getForCustomer(jobId: string, customerId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        category: true,
        city: true,
        quotes: {
          orderBy: { createdAt: 'asc' },
          include: {
            pro: {
              select: {
                id: true,
                displayName: true,
                logoUrl: true,
                ratingAverage: true,
                ratingCount: true,
                yearsExperience: true,
                verificationStatus: true,
                jobsWon: true,
                medianResponseMinutes: true,
                baseCity: { select: { slug: true, nameNl: true, nameEn: true } },
              },
            },
          },
        },
      },
    });
    if (!job) throw new AppError('not_found');
    if (job.customerId !== customerId) throw new AppError('forbidden');
    return job;
  }

  /**
   * The professional's view. The street address and the customer's phone are
   * withheld unless this pro has been awarded the job.
   */
  async getForPro(jobId: string, proId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        ...LEAD_SAFE_JOB_SELECT,
        customerId: true,
        addressLine: true,
        lat: true,
        lng: true,
        contactPhone: true,
        awardedQuoteId: true,
        quotes: { where: { proId }, take: 1 },
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, avatarUrl: true } },
      },
    });
    if (!job) throw new AppError('not_found');

    const myQuote = job.quotes[0] ?? null;
    const isAwardedToMe = myQuote != null && job.awardedQuoteId === myQuote.id;

    return {
      ...job,
      addressLine: isAwardedToMe ? job.addressLine : null,
      lat: isAwardedToMe ? job.lat : null,
      lng: isAwardedToMe ? job.lng : null,
      customer: isAwardedToMe
        ? job.customer
        : { id: job.customer.id, firstName: job.customer.firstName, avatarUrl: job.customer.avatarUrl },
      contactPhone: isAwardedToMe ? (job.contactPhone ?? job.customer.phone) : null,
      myQuote,
      isAwardedToMe,
      quotes: undefined,
    };
  }

  async listForCustomer(customerId: string, params: { status?: Prisma.JobWhereInput['status']; cursor?: string; limit: number }) {
    const rows = await this.prisma.job.findMany({
      where: { customerId, ...(params.status ? { status: params.status } : {}) },
      orderBy: { createdAt: 'desc' },
      select: { ...LEAD_SAFE_JOB_SELECT, addressLine: true, awardedQuoteId: true },
      ...cursorArgs(params.cursor, params.limit),
    });
    return toPage(rows, params.limit);
  }

  /**
   * The lead feed. Defaults to the pro's own trades and coverage, honours the
   * plan's head start, and never shows a job that is closed or already full.
   */
  async listLeads(params: {
    proId: string;
    planHeadStartMinutes: number;
    filters: ListLeadsInput;
  }) {
    const { proId, filters } = params;
    const pro = await this.prisma.proProfile.findUnique({
      where: { id: proId },
      include: {
        trades: { select: { categoryId: true, category: { select: { slug: true, parentId: true } } } },
        coverage: { select: { cityId: true, city: { select: { slug: true } } } },
        baseCity: { select: { lat: true, lng: true } },
      },
    });
    if (!pro) throw new AppError('pro_profile_required');

    const categoryIds = await this.resolveCategoryIds(pro.trades.map((t) => t.categoryId), filters.categorySlugs);
    const cityIds = await this.resolveCityIds(pro.coverage.map((c) => c.cityId), filters.citySlugs);

    if (categoryIds.length === 0 || cityIds.length === 0) {
      return { items: [], nextCursor: null };
    }

    // Everything published before this instant has been released to this plan.
    const releasedBefore = new Date(Date.now() - leadDelayMinutes(params.planHeadStartMinutes) * 60_000);

    const where: Prisma.JobWhereInput = {
      status: { in: ['OPEN', 'QUOTED'] },
      categoryId: { in: categoryIds },
      cityId: { in: cityIds },
      publishedAt: { lte: releasedBefore },
      expiresAt: { gt: new Date() },
      quoteCount: { lt: JOB_MAX_QUOTES },
      ...(filters.urgency ? { urgency: filters.urgency } : {}),
      ...(filters.minBudgetEur != null
        ? { budgetMaxCents: { gte: eurosToCents(filters.minBudgetEur) } }
        : {}),
      ...(filters.hideQuoted ? { quotes: { none: { proId } } } : {}),
    };

    const orderBy: Prisma.JobOrderByWithRelationInput =
      filters.sort === 'BUDGET' ? { budgetMaxCents: 'desc' } : { publishedAt: 'desc' };

    const rows = await this.prisma.job.findMany({
      where,
      orderBy,
      select: { ...LEAD_SAFE_JOB_SELECT, quotes: { where: { proId }, select: { id: true, status: true } } },
      ...cursorArgs(filters.cursor, filters.limit),
    });

    const page = toPage(rows, filters.limit);
    const origin = pro.baseCity;

    const items = page.items.map((job) => ({
      ...job,
      myQuote: job.quotes[0] ?? null,
      quotes: undefined,
      distanceKm:
        job.city.lat != null && job.city.lng != null
          ? Math.round(distanceKm(origin, { lat: job.city.lat, lng: job.city.lng }))
          : null,
    }));

    // NEAREST is applied in memory over the current page: city coordinates are
    // coarse, so a full geo query would not buy accuracy worth the index cost.
    if (filters.sort === 'NEAREST') {
      items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }

    return { items, nextCursor: page.nextCursor };
  }

  async update(jobId: string, customerId: string, input: UpdateJobInput) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError('not_found');
    if (job.customerId !== customerId) throw new AppError('forbidden');
    if (job.status !== 'OPEN' && job.status !== 'QUOTED') throw new AppError('job_not_open');

    return this.prisma.job.update({
      where: { id: jobId },
      data: {
        title: input.title,
        description: input.description,
        urgency: input.urgency,
        preferredStartDate: input.preferredStartDate,
        budgetMinCents:
          input.budgetMinEur === null ? null : input.budgetMinEur != null ? eurosToCents(input.budgetMinEur) : undefined,
        budgetMaxCents:
          input.budgetMaxEur === null ? null : input.budgetMaxEur != null ? eurosToCents(input.budgetMaxEur) : undefined,
        photoUrls: input.photoUrls,
      },
      select: LEAD_SAFE_JOB_SELECT,
    });
  }

  async incrementView(jobId: string) {
    await this.prisma.job.updateMany({ where: { id: jobId }, data: { viewCount: { increment: 1 } } });
  }

  async markCompleted(jobId: string, customerId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new AppError('not_found');
    if (job.customerId !== customerId) throw new AppError('forbidden');
    if (job.status !== 'AWARDED') throw new AppError('conflict');

    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      select: LEAD_SAFE_JOB_SELECT,
    });
  }

  private async resolveCategoryIds(proCategoryIds: string[], slugs?: string[]) {
    if (!slugs || slugs.length === 0) return proCategoryIds;
    const filtered = await this.prisma.category.findMany({
      where: { slug: { in: slugs }, id: { in: proCategoryIds } },
      select: { id: true },
    });
    return filtered.map((row) => row.id);
  }

  private async resolveCityIds(proCityIds: string[], slugs?: string[]) {
    if (!slugs || slugs.length === 0) return proCityIds;
    const filtered = await this.prisma.city.findMany({
      where: { slug: { in: slugs }, id: { in: proCityIds } },
      select: { id: true },
    });
    return filtered.map((row) => row.id);
  }
}

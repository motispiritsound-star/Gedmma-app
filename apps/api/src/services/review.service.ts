import type { PrismaClient } from '@prisma/client';
import type { CreateReviewInput } from '@khidma/shared';
import { AppError } from '../lib/errors.js';
import { cursorArgs, toPage } from '../lib/pagination.js';
import type { NotificationService } from './notification.service.js';

export class ReviewService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Only the customer who awarded a completed job may review it, and only once.
   * That constraint is what keeps the ratings on Khidma worth reading.
   */
  async create(params: { jobId: string; authorId: string; input: CreateReviewInput }) {
    const job = await this.prisma.job.findUnique({
      where: { id: params.jobId },
      include: { awardedQuote: { select: { proId: true } }, review: { select: { id: true } } },
    });
    if (!job) throw new AppError('not_found');
    if (job.customerId !== params.authorId) throw new AppError('forbidden');
    if (job.review) throw new AppError('review_already_exists');
    if (job.status !== 'COMPLETED' || !job.awardedQuote) {
      throw new AppError('review_requires_completed_job');
    }

    const proId = job.awardedQuote.proId;

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          jobId: job.id,
          proId,
          authorId: params.authorId,
          rating: params.input.rating,
          qualityRating: params.input.qualityRating,
          punctualityRating: params.input.punctualityRating,
          priceRating: params.input.priceRating,
          communicationRating: params.input.communicationRating,
          comment: params.input.comment,
        },
      });

      // Recompute the aggregate from the rows rather than nudging a running
      // average, so a deleted or hidden review can never leave it wrong.
      const stats = await tx.review.aggregate({
        where: { proId, isPublished: true },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.proProfile.update({
        where: { id: proId },
        data: {
          ratingAverage: Math.round((stats._avg.rating ?? 0) * 100) / 100,
          ratingCount: stats._count._all,
        },
      });

      return created;
    });

    await this.notifications.notifyPro(proId, {
      type: 'REVIEW_RECEIVED',
      params: { jobTitle: job.title },
      deepLink: `khidma://pro/reviews`,
    });

    return review;
  }

  async listForPro(proId: string, params: { cursor?: string; limit: number }) {
    const rows = await this.prisma.review.findMany({
      where: { proId, isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { firstName: true, avatarUrl: true } },
        job: { select: { title: true, category: { select: { slug: true, nameFr: true, nameAr: true, nameEn: true } } } },
      },
      ...cursorArgs(params.cursor, params.limit),
    });
    return toPage(rows, params.limit);
  }

  /** The pro's single public right of reply to a review. */
  async reply(params: { reviewId: string; proId: string; body: string }) {
    const review = await this.prisma.review.findUnique({ where: { id: params.reviewId } });
    if (!review) throw new AppError('not_found');
    if (review.proId !== params.proId) throw new AppError('forbidden');
    if (review.proReply) throw new AppError('conflict');

    return this.prisma.review.update({
      where: { id: review.id },
      data: { proReply: params.body, proRepliedAt: new Date() },
    });
  }
}

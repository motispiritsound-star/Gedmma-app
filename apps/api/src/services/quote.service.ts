import type { Prisma, PrismaClient } from '@prisma/client';
import {
  JOB_MAX_QUOTES,
  eurosToCents,
  leadDelayMinutes,
  type CreateQuoteInput,
} from '@buurklus/shared';
import { AppError } from '../lib/errors.js';
import { cursorArgs, toPage } from '../lib/pagination.js';
import { SubscriptionService } from './subscription.service.js';
import type { NotificationService } from './notification.service.js';

export class QuoteService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly subscriptions: SubscriptionService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Sends a quote on a job. This is the single moment where a professional
   * spends money on Buurklus, so it is done in one transaction: check the job is
   * still open, spend a credit, write the quote, and open the conversation.
   */
  async submit(params: { proId: string; jobId: string; input: CreateQuoteInput }) {
    const subscription = await this.subscriptions.requireAccess(params.proId);

    const job = await this.prisma.job.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        customerId: true,
        status: true,
        quoteCount: true,
        publishedAt: true,
        expiresAt: true,
        title: true,
        reference: true,
        categoryId: true,
        cityId: true,
      },
    });
    if (!job) throw new AppError('not_found');

    const now = new Date();
    if (job.status !== 'OPEN' && job.status !== 'QUOTED') throw new AppError('job_not_open');
    if (job.expiresAt && job.expiresAt < now) throw new AppError('job_not_open');
    if (job.quoteCount >= JOB_MAX_QUOTES) throw new AppError('job_quote_limit_reached');

    // The pro must also cover this job's trade and city, or the feed filters
    // could be bypassed by posting a job id directly.
    await this.assertCoverage(params.proId, job.categoryId, job.cityId);

    if (job.publishedAt) {
      const releasedAt = new Date(
        job.publishedAt.getTime() + leadDelayMinutes(subscription.plan.leadHeadStartMinutes) * 60_000,
      );
      if (releasedAt > now) throw new AppError('lead_not_released');
    }

    const existing = await this.prisma.quote.findUnique({
      where: { jobId_proId: { jobId: job.id, proId: params.proId } },
    });
    if (existing) throw new AppError('job_already_quoted');

    const responseMinutes = job.publishedAt
      ? Math.max(0, Math.round((now.getTime() - job.publishedAt.getTime()) / 60_000))
      : null;

    const quote = await this.prisma.$transaction(async (tx) => {
      // Re-read inside the transaction so a job filling up concurrently is caught.
      const guard = await tx.job.updateMany({
        where: {
          id: job.id,
          status: { in: ['OPEN', 'QUOTED'] },
          quoteCount: { lt: JOB_MAX_QUOTES },
        },
        data: { quoteCount: { increment: 1 }, status: 'QUOTED' },
      });
      if (guard.count === 0) throw new AppError('job_quote_limit_reached');

      const created = await tx.quote.create({
        data: {
          jobId: job.id,
          proId: params.proId,
          amountCents: eurosToCents(params.input.amountEur),
          isEstimate: params.input.isEstimate,
          message: params.input.message,
          estimatedDurationDays: params.input.estimatedDurationDays,
          canStartOn: params.input.canStartOn,
          includesSiteVisit: params.input.includesSiteVisit,
          validUntil: new Date(now.getTime() + params.input.validityDays * 86_400_000),
          responseMinutes,
        },
      });

      await this.subscriptions.consumeCredit(tx, {
        proId: params.proId,
        subscriptionId: subscription.id,
        quoteId: created.id,
      });

      // Quoting opens a thread so the customer can ask questions before deciding.
      await tx.conversation.upsert({
        where: { jobId_proId: { jobId: job.id, proId: params.proId } },
        create: { jobId: job.id, proId: params.proId, quoteId: created.id, customerUnread: 0 },
        update: { quoteId: created.id },
      });

      await tx.proProfile.update({
        where: { id: params.proId },
        data: { quotesSent: { increment: 1 } },
      });

      return created;
    });

    await this.updateMedianResponseTime(params.proId);
    await this.notifications.notify({
      userId: job.customerId,
      type: 'JOB_NEW_QUOTE',
      params: { jobTitle: job.title, jobReference: job.reference },
      deepLink: `buurklus://jobs/${job.id}`,
    });

    return quote;
  }

  /**
   * The customer picks a quote. The job moves to AWARDED, the other quotes are
   * rejected, and only now does the winning pro get the address and phone.
   */
  async accept(params: { jobId: string; quoteId: string; customerId: string }) {
    const job = await this.prisma.job.findUnique({
      where: { id: params.jobId },
      include: { quotes: true },
    });
    if (!job) throw new AppError('not_found');
    if (job.customerId !== params.customerId) throw new AppError('forbidden');
    if (job.status !== 'OPEN' && job.status !== 'QUOTED') throw new AppError('job_not_open');

    const quote = job.quotes.find((row) => row.id === params.quoteId);
    if (!quote) throw new AppError('not_found');
    if (quote.status !== 'PENDING') throw new AppError('quote_not_pending');
    if (quote.validUntil < new Date()) throw new AppError('quote_expired');

    const losers = job.quotes.filter((row) => row.id !== quote.id && row.status === 'PENDING');

    await this.prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id: quote.id }, data: { status: 'ACCEPTED' } });
      if (losers.length > 0) {
        await tx.quote.updateMany({
          where: { id: { in: losers.map((row) => row.id) } },
          data: { status: 'REJECTED', rejectedReason: 'job_awarded_elsewhere' },
        });
      }
      await tx.job.update({
        where: { id: job.id },
        data: { status: 'AWARDED', awardedQuoteId: quote.id, awardedAt: new Date() },
      });
      await tx.proProfile.update({ where: { id: quote.proId }, data: { jobsWon: { increment: 1 } } });
    });

    // Losing pros keep their credit: they did the work of quoting, and the
    // marketplace charges for the lead, not for winning it.
    await this.notifications.notifyPro(quote.proId, {
      type: 'JOB_AWARDED',
      params: { jobTitle: job.title, jobReference: job.reference },
      deepLink: `buurklus://quotes/${quote.id}`,
    });
    for (const loser of losers) {
      await this.notifications.notifyPro(loser.proId, {
        type: 'QUOTE_REJECTED',
        params: { jobTitle: job.title, jobReference: job.reference },
        deepLink: `buurklus://quotes/${loser.id}`,
      });
    }

    return this.prisma.quote.findUniqueOrThrow({
      where: { id: quote.id },
      include: { pro: { select: { id: true, displayName: true, user: { select: { phone: true } } } } },
    });
  }

  async reject(params: { jobId: string; quoteId: string; customerId: string; reason?: string }) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: params.quoteId },
      include: { job: { select: { id: true, customerId: true, title: true, reference: true } } },
    });
    if (!quote || quote.jobId !== params.jobId) throw new AppError('not_found');
    if (quote.job.customerId !== params.customerId) throw new AppError('forbidden');
    if (quote.status !== 'PENDING') throw new AppError('quote_not_pending');

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'REJECTED', rejectedReason: params.reason },
    });

    await this.notifications.notifyPro(quote.proId, {
      type: 'QUOTE_REJECTED',
      params: { jobTitle: quote.job.title, jobReference: quote.job.reference },
      deepLink: `buurklus://quotes/${quote.id}`,
    });

    return updated;
  }

  /** A pro pulls their quote. The credit is not refunded — the lead was used. */
  async withdraw(params: { quoteId: string; proId: string }) {
    const quote = await this.prisma.quote.findUnique({ where: { id: params.quoteId } });
    if (!quote) throw new AppError('not_found');
    if (quote.proId !== params.proId) throw new AppError('forbidden');
    if (quote.status !== 'PENDING') throw new AppError('quote_not_pending');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.quote.update({
        where: { id: quote.id },
        data: { status: 'WITHDRAWN' },
      });
      await tx.job.update({
        where: { id: quote.jobId },
        data: { quoteCount: { decrement: 1 } },
      });
      return updated;
    });
  }

  /**
   * The customer cancels the job. Every pending quote is refunded a credit,
   * because the lead never had a chance to convert.
   */
  async cancelJob(params: { jobId: string; customerId: string; reason?: string }) {
    const job = await this.prisma.job.findUnique({
      where: { id: params.jobId },
      include: { quotes: { where: { status: 'PENDING' } } },
    });
    if (!job) throw new AppError('not_found');
    if (job.customerId !== params.customerId) throw new AppError('forbidden');
    if (job.status === 'CANCELLED' || job.status === 'COMPLETED') throw new AppError('conflict');

    const refundTargets = await Promise.all(
      job.quotes.map(async (quote) => ({
        quote,
        subscription: await this.subscriptions.current(quote.proId),
      })),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.job.update({
        where: { id: job.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: params.reason },
      });
      if (job.quotes.length > 0) {
        await tx.quote.updateMany({
          where: { jobId: job.id, status: 'PENDING' },
          data: { status: 'REJECTED', rejectedReason: 'job_cancelled' },
        });
      }
      for (const { quote, subscription } of refundTargets) {
        if (!subscription) continue;
        await this.subscriptions.refundCredit(tx, {
          proId: quote.proId,
          subscriptionId: subscription.id,
          quoteId: quote.id,
          note: 'Demande annulée par le client',
        });
      }
    });

    for (const { quote } of refundTargets) {
      await this.notifications.notifyPro(quote.proId, {
        type: 'JOB_CANCELLED',
        params: { jobTitle: job.title, jobReference: job.reference },
        deepLink: `buurklus://quotes/${quote.id}`,
      });
    }

    return { cancelled: true, refundedCredits: refundTargets.filter((t) => t.subscription).length };
  }

  async listForPro(proId: string, params: { status?: Prisma.QuoteWhereInput['status']; cursor?: string; limit: number }) {
    const rows = await this.prisma.quote.findMany({
      where: { proId, ...(params.status ? { status: params.status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            reference: true,
            title: true,
            status: true,
            urgency: true,
            awardedQuoteId: true,
            city: { select: { slug: true, nameNl: true, nameEn: true } },
            category: { select: { slug: true, nameNl: true, nameEn: true, icon: true } },
            customer: { select: { firstName: true, avatarUrl: true } },
          },
        },
      },
      ...cursorArgs(params.cursor, params.limit),
    });
    return toPage(rows, params.limit);
  }

  private async assertCoverage(proId: string, categoryId: string, cityId: string) {
    const [trade, coverage] = await Promise.all([
      this.prisma.proTrade.findUnique({ where: { proId_categoryId: { proId, categoryId } } }),
      this.prisma.proCoverage.findUnique({ where: { proId_cityId: { proId, cityId } } }),
    ]);
    if (!trade || !coverage) throw new AppError('forbidden');
  }

  /** Keeps the "usually replies in X" figure on the pro's profile current. */
  private async updateMedianResponseTime(proId: string) {
    const rows = await this.prisma.quote.findMany({
      where: { proId, responseMinutes: { not: null } },
      select: { responseMinutes: true },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    if (rows.length === 0) return;

    const values = rows
      .map((row) => row.responseMinutes as number)
      .sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const median =
      values.length % 2 === 0
        ? Math.round(((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2)
        : (values[middle] ?? 0);

    await this.prisma.proProfile.update({
      where: { id: proId },
      data: { medianResponseMinutes: median },
    });
  }
}

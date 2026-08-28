import type { FastifyPluginAsync } from 'fastify';
import {
  listLeadsSchema,
  listMyQuotesSchema,
  paginationSchema,
  searchProsSchema,
  upsertProProfileSchema,
} from '@khidma/shared';
import { z } from 'zod';
import { SubscriptionService } from '../services/subscription.service.js';
import { localizeAll, withLocalizedNames } from '../lib/localize.js';

const proRoutes: FastifyPluginAsync = async (app) => {
  const proOnly = app.requireRole('PRO', 'ADMIN');

  /** Resolves the caller's pro profile id, falling back to a lookup. */
  const proIdOf = async (userId: string, cached?: string) =>
    cached ?? (await app.services.pros.requireProfileId(userId));

  // --- Public directory ----------------------------------------------------

  app.get('/', async (request) => {
    const query = searchProsSchema.parse(request.query);
    return app.services.pros.search(query);
  });

  app.get('/:proId', async (request) => {
    const { proId } = z.object({ proId: z.string().min(1) }).parse(request.params);
    return { pro: await app.services.pros.getPublic(proId) };
  });

  app.get('/:proId/reviews', async (request) => {
    const { proId } = z.object({ proId: z.string().min(1) }).parse(request.params);
    const query = paginationSchema.parse(request.query);
    return app.services.reviews.listForPro(proId, query);
  });

  // --- The signed-in professional -----------------------------------------

  /**
   * Creating a profile also starts the free trial, so a new professional can
   * quote on their first day without entering card details.
   */
  app.put('/me', { onRequest: [app.authenticate] }, async (request) => {
    const body = upsertProProfileSchema.parse(request.body);
    const existing = await app.prisma.proProfile.findUnique({
      where: { userId: request.currentUser!.sub },
      select: { id: true },
    });

    const profile = await app.services.pros.upsert(request.currentUser!.sub, body);

    if (!existing) {
      await app.services.subscriptions.startTrial(profile.id).catch((error) => {
        // A pro who somehow already had a subscription keeps it; the profile
        // save itself must not fail because of that.
        app.log.warn({ err: error, proId: profile.id }, 'trial not started');
      });
    }

    return { pro: await app.services.pros.getOwn(request.currentUser!.sub) };
  });

  app.get('/me/profile', { onRequest: [proOnly] }, async (request) => {
    return { pro: await app.services.pros.getOwn(request.currentUser!.sub) };
  });

  app.get('/me/dashboard', { onRequest: [proOnly] }, async (request) => {
    const proId = await proIdOf(request.currentUser!.sub, request.currentUser!.proId);
    const subscription = await app.services.subscriptions.current(proId);

    const [pendingQuotes, wonQuotes, unreadMessages] = await Promise.all([
      app.prisma.quote.count({ where: { proId, status: 'PENDING' } }),
      app.prisma.quote.count({ where: { proId, status: 'ACCEPTED' } }),
      app.prisma.conversation.aggregate({ where: { proId }, _sum: { proUnread: true } }),
    ]);

    return {
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            period: subscription.period,
            planSlug: subscription.plan.slug,
            planName: subscription.plan.nameFr,
            creditsRemaining: subscription.creditsRemaining,
            monthlyCredits: subscription.plan.monthlyCredits,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialEndsAt: subscription.trialEndsAt,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            grantsAccess: SubscriptionService.grantsAccess(subscription),
          }
        : null,
      stats: {
        pendingQuotes,
        wonQuotes,
        unreadMessages: unreadMessages._sum.proUnread ?? 0,
      },
    };
  });

  /** The lead feed: open jobs matching this pro's trades, cities and plan. */
  app.get('/me/leads', { onRequest: [proOnly] }, async (request) => {
    const filters = listLeadsSchema.parse(request.query);
    const proId = await proIdOf(request.currentUser!.sub, request.currentUser!.proId);
    const subscription = await app.services.subscriptions.requireAccess(proId);

    const page = await app.services.jobs.listLeads({
      proId,
      planHeadStartMinutes: subscription.plan.leadHeadStartMinutes,
      filters,
    });
    return { ...page, items: localizeAll(page.items, request.locale) };
  });

  app.get('/me/quotes', { onRequest: [proOnly] }, async (request) => {
    const query = listMyQuotesSchema.parse(request.query);
    const proId = await proIdOf(request.currentUser!.sub, request.currentUser!.proId);
    const page = await app.services.quotes.listForPro(proId, query);
    // Each quote embeds its job, whose category and city need collapsing too.
    return {
      ...page,
      items: page.items.map((quote) => ({
        ...quote,
        job: withLocalizedNames(quote.job, request.locale),
      })),
    };
  });

  app.post('/me/quotes/:quoteId/withdraw', { onRequest: [proOnly] }, async (request) => {
    const { quoteId } = z.object({ quoteId: z.string().min(1) }).parse(request.params);
    const proId = await proIdOf(request.currentUser!.sub, request.currentUser!.proId);
    return { quote: await app.services.quotes.withdraw({ quoteId, proId }) };
  });

  app.post('/me/reviews/:reviewId/reply', { onRequest: [proOnly] }, async (request) => {
    const { reviewId } = z.object({ reviewId: z.string().min(1) }).parse(request.params);
    const body = z.object({ body: z.string().trim().min(5).max(1000) }).parse(request.body);
    const proId = await proIdOf(request.currentUser!.sub, request.currentUser!.proId);
    return { review: await app.services.reviews.reply({ reviewId, proId, body: body.body }) };
  });
};

export default proRoutes;

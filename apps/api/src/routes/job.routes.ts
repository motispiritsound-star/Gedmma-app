import type { FastifyPluginAsync } from 'fastify';
import {
  cancelJobSchema,
  createJobSchema,
  createQuoteSchema,
  createReviewSchema,
  listMyJobsSchema,
  rejectQuoteSchema,
  updateJobSchema,
} from '@khidma/shared';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { localizeAll, withLocalizedNames } from '../lib/localize.js';

const jobRoutes: FastifyPluginAsync = async (app) => {
  const anySignedInUser = app.requireRole('CUSTOMER', 'PRO', 'ADMIN');

  /**
   * Anyone signed in may post a job — a professional hiring another trade is a
   * normal case, so posting is not restricted to the CUSTOMER role.
   */
  app.post('/', { onRequest: [anySignedInUser] }, async (request, reply) => {
    const body = createJobSchema.parse(request.body);
    const job = await app.services.jobs.create(request.currentUser!.sub, body);
    reply.code(201);
    return { job: withLocalizedNames(job, request.locale) };
  });

  app.get('/mine', { onRequest: [app.authenticate] }, async (request) => {
    const query = listMyJobsSchema.parse(request.query);
    const page = await app.services.jobs.listForCustomer(request.currentUser!.sub, {
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    });
    return { ...page, items: localizeAll(page.items, request.locale) };
  });

  /**
   * Resolves to the customer view or the pro view. Ownership is checked first,
   * because a professional who posted a job for their own premises is its
   * customer and must see their own address, not the redacted lead view.
   */
  app.get('/:jobId', { onRequest: [app.authenticate] }, async (request) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const user = request.currentUser!;

    const owner = await app.prisma.job.findUnique({
      where: { id: jobId },
      select: { customerId: true },
    });
    if (!owner) throw new AppError('not_found');

    if (owner.customerId === user.sub) {
      return {
        job: withLocalizedNames(await app.services.jobs.getForCustomer(jobId, user.sub), request.locale),
        viewer: 'CUSTOMER' as const,
      };
    }

    if (user.proId) {
      const job = await app.services.jobs.getForPro(jobId, user.proId);
      await app.services.jobs.incrementView(jobId);
      return { job: withLocalizedNames(job, request.locale), viewer: 'PRO' as const };
    }

    // Not the owner and not a professional: nothing to show.
    throw new AppError('forbidden');
  });

  app.patch('/:jobId', { onRequest: [app.authenticate] }, async (request) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const body = updateJobSchema.parse(request.body);
    const job = await app.services.jobs.update(jobId, request.currentUser!.sub, body);
    return { job: withLocalizedNames(job, request.locale) };
  });

  app.post('/:jobId/cancel', { onRequest: [app.authenticate] }, async (request) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const body = cancelJobSchema.parse(request.body ?? {});
    return app.services.quotes.cancelJob({
      jobId,
      customerId: request.currentUser!.sub,
      reason: body.reason,
    });
  });

  app.post('/:jobId/complete', { onRequest: [app.authenticate] }, async (request) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const job = await app.services.jobs.markCompleted(jobId, request.currentUser!.sub);
    return { job: withLocalizedNames(job, request.locale) };
  });

  // --- Quotes on a job -----------------------------------------------------

  app.post('/:jobId/quotes', { onRequest: [app.requireRole('PRO', 'ADMIN')] }, async (request, reply) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const body = createQuoteSchema.parse(request.body);
    const proId = request.currentUser!.proId ?? (await app.services.pros.requireProfileId(request.currentUser!.sub));

    const quote = await app.services.quotes.submit({ proId, jobId, input: body });
    const subscription = await app.services.subscriptions.current(proId);
    reply.code(201);
    return { quote, creditsRemaining: subscription?.creditsRemaining ?? 0 };
  });

  app.post('/:jobId/quotes/:quoteId/accept', { onRequest: [app.authenticate] }, async (request) => {
    const params = z.object({ jobId: z.string().min(1), quoteId: z.string().min(1) }).parse(request.params);
    const quote = await app.services.quotes.accept({
      jobId: params.jobId,
      quoteId: params.quoteId,
      customerId: request.currentUser!.sub,
    });
    return { quote };
  });

  app.post('/:jobId/quotes/:quoteId/reject', { onRequest: [app.authenticate] }, async (request) => {
    const params = z.object({ jobId: z.string().min(1), quoteId: z.string().min(1) }).parse(request.params);
    const body = rejectQuoteSchema.parse(request.body ?? {});
    return { quote: await app.services.quotes.reject({ ...params, customerId: request.currentUser!.sub, reason: body.reason }) };
  });

  // --- Review --------------------------------------------------------------

  app.post('/:jobId/review', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const body = createReviewSchema.parse(request.body);
    const review = await app.services.reviews.create({
      jobId,
      authorId: request.currentUser!.sub,
      input: body,
    });
    reply.code(201);
    return { review };
  });
};

export default jobRoutes;

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

const jobRoutes: FastifyPluginAsync = async (app) => {
  const customerOnly = app.requireRole('CUSTOMER', 'PRO', 'ADMIN');

  /**
   * Anyone signed in may post a job — a professional hiring another trade is a
   * normal case, so posting is not restricted to the CUSTOMER role.
   */
  app.post('/', { onRequest: [customerOnly] }, async (request, reply) => {
    const body = createJobSchema.parse(request.body);
    const job = await app.services.jobs.create(request.currentUser!.sub, body);
    reply.code(201);
    return { job };
  });

  app.get('/mine', { onRequest: [app.authenticate] }, async (request) => {
    const query = listMyJobsSchema.parse(request.query);
    return app.services.jobs.listForCustomer(request.currentUser!.sub, {
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    });
  });

  /** Resolves to the customer view or the pro view depending on who asks. */
  app.get('/:jobId', { onRequest: [app.authenticate] }, async (request) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const user = request.currentUser!;

    if (user.proId) {
      const job = await app.services.jobs.getForPro(jobId, user.proId);
      await app.services.jobs.incrementView(jobId);
      return { job, viewer: 'PRO' as const };
    }

    return { job: await app.services.jobs.getForCustomer(jobId, user.sub), viewer: 'CUSTOMER' as const };
  });

  app.patch('/:jobId', { onRequest: [app.authenticate] }, async (request) => {
    const { jobId } = z.object({ jobId: z.string().min(1) }).parse(request.params);
    const body = updateJobSchema.parse(request.body);
    return { job: await app.services.jobs.update(jobId, request.currentUser!.sub, body) };
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
    return { job: await app.services.jobs.markCompleted(jobId, request.currentUser!.sub) };
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

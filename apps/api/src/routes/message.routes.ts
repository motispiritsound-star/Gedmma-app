import type { FastifyPluginAsync } from 'fastify';
import { paginationSchema, sendMessageSchema } from '@buurklus/shared';
import { z } from 'zod';

const messageRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { onRequest: [app.authenticate] }, async (request) => {
    const query = paginationSchema.parse(request.query);
    const user = request.currentUser!;
    // A professional sees the threads on their quotes; everyone else sees the
    // threads on the jobs they posted.
    const proId = user.role === 'PRO' ? user.proId ?? (await app.services.pros.requireProfileId(user.sub)) : undefined;
    return app.services.messages.listConversations({ userId: user.sub, proId, ...query });
  });

  app.get('/:conversationId/messages', { onRequest: [app.authenticate] }, async (request) => {
    const { conversationId } = z.object({ conversationId: z.string().min(1) }).parse(request.params);
    const query = paginationSchema.parse(request.query);
    return app.services.messages.listMessages({
      conversationId,
      userId: request.currentUser!.sub,
      ...query,
    });
  });

  app.post('/:conversationId/messages', { onRequest: [app.authenticate] }, async (request, reply) => {
    const { conversationId } = z.object({ conversationId: z.string().min(1) }).parse(request.params);
    const body = sendMessageSchema.parse(request.body);
    const message = await app.services.messages.send({
      conversationId,
      senderId: request.currentUser!.sub,
      input: body,
    });
    reply.code(201);
    return { message };
  });
};

export default messageRoutes;

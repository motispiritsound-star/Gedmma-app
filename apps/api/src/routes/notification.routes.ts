import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', { onRequest: [app.authenticate] }, async (request) => {
    const notifications = await app.services.notifications.list(request.currentUser!.sub);
    return {
      notifications,
      unreadCount: notifications.filter((row) => row.readAt === null).length,
    };
  });

  app.post('/read', { onRequest: [app.authenticate] }, async (request) => {
    const body = z.object({ ids: z.array(z.string()).max(200).optional() }).parse(request.body ?? {});
    await app.services.notifications.markRead(request.currentUser!.sub, body.ids);
    return { ok: true };
  });
};

export default notificationRoutes;

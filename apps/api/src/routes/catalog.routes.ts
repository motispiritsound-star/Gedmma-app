import type { FastifyPluginAsync } from 'fastify';

/**
 * Public, cacheable reference data. The app fetches this once per language and
 * keeps it, so a customer can browse trades before signing in.
 */
const catalogRoutes: FastifyPluginAsync = async (app) => {
  app.get('/categories', async (request, reply) => {
    reply.header('cache-control', 'public, max-age=3600');
    return { categories: await app.services.catalog.categories(request.locale) };
  });

  app.get('/cities', async (request, reply) => {
    reply.header('cache-control', 'public, max-age=3600');
    return { cities: await app.services.catalog.cities(request.locale) };
  });

  app.get('/plans', async (request, reply) => {
    reply.header('cache-control', 'public, max-age=600');
    return { plans: await app.services.catalog.plans(request.locale) };
  });
};

export default catalogRoutes;

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { signupSchema } from '@buurklus/shared';

/**
 * The website's registration page posts here. Public and unauthenticated by
 * necessity — the whole point is that the person does not have an account yet.
 *
 * That makes rate limiting the only thing standing between this and a mailing
 * list somebody else fills for us, so it is tighter than anywhere else in the
 * API, and the schema carries a honeypot the service drops silently.
 */
const signupRoutes: FastifyPluginAsync = async (app) => {
  app.post('/', {
    config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    handler: async (request, reply) => {
      const body = signupSchema.parse(request.body);
      const result = await app.services.signups.register(body, {
        locale: request.locale,
        // Recorded with the consent: an email address that turns up on a
        // mailing list is worth nothing without evidence of who asked.
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

      request.log.info({ role: body.role, repeat: result.alreadyRegistered }, 'signup registered');
      reply.code(201);
      return result;
    },
  });

  /**
   * Off the list, on request. Takes the address rather than a token because
   * there is no account to sign in to, and answers the same either way so it
   * cannot be used to find out who is on the list.
   */
  app.post('/unsubscribe', {
    config: { rateLimit: { max: 5, timeWindow: '10 minutes' } },
    handler: async (request) => {
      const body = z.object({ email: z.string().trim().email().max(160) }).parse(request.body);
      await app.services.signups.unsubscribe(body.email);
      return { ok: true };
    },
  });

  /** How many are waiting, by side. Named nobody, so it can be public. */
  app.get('/counts', async () => {
    const counts = await app.services.signups.counts();
    return { customers: counts.customers, pros: counts.pros };
  });
};

export default signupRoutes;

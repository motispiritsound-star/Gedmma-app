import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { DEFAULT_LOCALE, resolveLocale, type Locale, type UserRole } from '@khidma/shared';
import { AppError } from '../lib/errors.js';
import { env } from '../env.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  /** Present for professionals, so routes can skip a lookup for the common case. */
  proId?: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    /** Rejects the request unless a valid access token is present. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Rejects unless the caller holds one of the given roles. */
    requireRole: (
      ...roles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    /** Language chosen by the client, used for error messages and catalogs. */
    locale: Locale;
    currentUser?: AccessTokenPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifyJwt, {
    secret: env().JWT_ACCESS_SECRET,
    sign: { expiresIn: env().ACCESS_TOKEN_TTL },
  });

  /**
   * Language resolution order: an explicit `X-Khidma-Locale` header set by the
   * app, then `Accept-Language`, then French.
   */
  app.addHook('onRequest', async (request) => {
    const header = request.headers['x-khidma-locale'];
    const explicit = Array.isArray(header) ? header[0] : header;
    request.locale = explicit
      ? resolveLocale(explicit)
      : resolveLocale(request.headers['accept-language'] ?? DEFAULT_LOCALE);
  });

  app.decorate('authenticate', async (request: FastifyRequest) => {
    try {
      await request.jwtVerify();
    } catch {
      throw new AppError('unauthorized');
    }
    request.currentUser = request.user;
  });

  app.decorate(
    'requireRole',
    (...roles: UserRole[]) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        await app.authenticate(request, reply);
        if (!request.currentUser || !roles.includes(request.currentUser.role)) {
          throw new AppError('forbidden');
        }
      },
  );
};

export default fp(authPlugin, { name: 'khidma-auth' });

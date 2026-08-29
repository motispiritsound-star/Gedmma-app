import {
  DomainError,
  HTTP_STATUS_BY_CODE,
  FORBIDDEN_CAPABILITIES,
  translate,
  type Locale,
} from '@focusfamily/domain';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import type { Config } from './config.js';
import { createServices, loadSession, type Services } from './context.js';
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  RateLimiter,
  SECURITY_HEADERS,
  parseCookies,
  safeEquals,
} from './security.js';
import { hashToken } from './security.js';
import { registerAccountRoutes } from './routes/account.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAgreementRoutes } from './routes/agreements.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCheckInRoutes } from './routes/checkins.js';
import { registerContentRoutes } from './routes/content.js';
import { registerFamilyRoutes } from './routes/family.js';
import { registerFocusRoutes } from './routes/focus.js';
import { registerGoalRoutes } from './routes/goals.js';
import { registerReviewRoutes } from './routes/review.js';
import type { PrismaClient } from '@focusfamily/db';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export interface BuildAppOptions {
  readonly config: Config;
  readonly prisma?: PrismaClient;
  readonly logger?: boolean;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const services: Services = createServices(options.config, options.prisma);
  const app = Fastify({
    logger: options.logger ?? options.config.NODE_ENV !== 'test',
    // A family agreement is text, not a file upload.
    bodyLimit: 256 * 1024,
    trustProxy: options.config.isProduction,
  });

  app.decorate('services', services);

  const signInLimiter = new RateLimiter(10, 5 * 60_000);
  const writeLimiter = new RateLimiter(300, 60_000);
  app.decorate('signInLimiter', signInLimiter);

  /* ------------------------------- headers ------------------------------- */

  app.addHook('onSend', async (request, reply, payload) => {
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      reply.header(name, value);
    }
    const origin = request.headers.origin;
    if (origin && services.config.allowedOrigins.includes(origin)) {
      reply.header('access-control-allow-origin', origin);
      reply.header('access-control-allow-credentials', 'true');
      reply.header('vary', 'origin');
      reply.header('access-control-allow-headers', `content-type,${CSRF_HEADER}`);
      reply.header('access-control-allow-methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    }
    return payload;
  });

  app.options('/*', async (request, reply) => {
    const origin = request.headers.origin;
    if (!origin || !services.config.allowedOrigins.includes(origin)) {
      return reply.code(403).send({ error: 'origin_not_allowed' });
    }
    return reply.code(204).send();
  });

  /* -------------------------- session and CSRF --------------------------- */

  app.addHook('preHandler', async (request, reply) => {
    request.session = await loadSession(request, services);

    if (SAFE_METHODS.has(request.method)) return;

    // Cross-site write attempts are rejected before anything is looked up.
    const origin = request.headers.origin;
    if (origin && !services.config.allowedOrigins.includes(origin)) {
      return reply.code(403).send({ error: 'origin_not_allowed' });
    }

    const limited = writeLimiter.check(request.ip);
    if (!limited.allowed) {
      return reply
        .code(429)
        .header('retry-after', String(limited.retryAfterSeconds))
        .send({ error: 'rate_limited' });
    }

    // Double-submit CSRF: the header must match the readable cookie, and the
    // cookie's hash must match the one stored with the session.
    if (request.session) {
      const cookies = parseCookies(request.headers.cookie);
      const cookieToken = cookies[CSRF_COOKIE];
      const headerToken = request.headers[CSRF_HEADER];
      const provided = Array.isArray(headerToken) ? headerToken[0] : headerToken;
      if (
        !cookieToken ||
        !provided ||
        !safeEquals(cookieToken, provided) ||
        !safeEquals(hashToken(cookieToken), request.session.csrfHash)
      ) {
        return reply.code(403).send({ error: 'csrf_failed' });
      }
    }
    return undefined;
  });

  /* ------------------------------ error shape ---------------------------- */

  app.setErrorHandler((error, request, reply) => {
    const locale: Locale = request.session?.locale ?? 'nl';
    if (error instanceof DomainError) {
      return reply.code(HTTP_STATUS_BY_CODE[error.code]).send({
        error: error.code,
        messageKey: error.messageKey,
        message: translate(locale, error.messageKey),
        details: error.details,
      });
    }
    if (error instanceof ZodError) {
      return reply.code(422).send({
        error: 'invalid_input',
        messageKey: 'validation.failed',
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        })),
      });
    }
    if ((error as { statusCode?: number }).statusCode === 400) {
      return reply.code(400).send({ error: 'bad_request', messageKey: 'validation.failed' });
    }
    request.log.error({ err: error }, 'unhandled error');
    return reply.code(500).send({ error: 'internal_error', messageKey: 'error.unexpected' });
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.code(404).send({ error: 'not_found', messageKey: 'error.not_found' }),
  );

  /* --------------------------------- routes ------------------------------ */

  app.get('/health', async () => ({ status: 'ok' }));

  /**
   * A machine-readable statement of what this API will never do. It is served
   * publicly so an auditor - or a curious teenager - can check the claim
   * without taking our word for it.
   */
  app.get('/capabilities', async () => ({
    neverOffered: FORBIDDEN_CAPABILITIES,
    dataSources: ['self_reported', 'app_observed', 'os_verified', 'simulated'],
    note:
      'FocusFamily has no endpoint that returns message content, browsing data, ' +
      'keystrokes, screenshots or precise location. See PRIVACY_MODEL.md.',
  }));

  await registerAuthRoutes(app, services);
  await registerFamilyRoutes(app, services);
  await registerAgreementRoutes(app, services);
  await registerFocusRoutes(app, services);
  await registerCheckInRoutes(app, services);
  await registerGoalRoutes(app, services);
  await registerReviewRoutes(app, services);
  await registerContentRoutes(app, services);
  await registerAccountRoutes(app, services);
  await registerAdminRoutes(app, services);

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
    signInLimiter: RateLimiter;
  }
}

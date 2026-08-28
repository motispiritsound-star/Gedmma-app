import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { DEFAULT_LOCALE } from '@buurklus/shared';
import { corsOrigins, env, type Env } from './env.js';
import authPlugin from './plugins/auth.js';
import servicesPlugin from './plugins/services.js';
import authRoutes from './routes/auth.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import jobRoutes from './routes/job.routes.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import privacyRoutes from './routes/privacy.routes.js';
import signupRoutes from './routes/signup.routes.js';
import proRoutes from './routes/pro.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import { AppError, errorMessage } from './lib/errors.js';

export async function buildApp(config: Env = env()): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      config.NODE_ENV === 'test'
        ? false
        : {
            level: config.NODE_ENV === 'production' ? 'info' : 'debug',
            // Never log the body of an OTP request: it carries a phone number.
            redact: ['req.headers.authorization', 'req.body.code', 'req.body.phone'],
          },
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: corsOrigins(config.CORS_ORIGINS),
    credentials: true,
    allowedHeaders: ['content-type', 'authorization', 'x-buurklus-locale', 'x-buurklus-platform'],
  });
  // The whole test suite runs from one address, so IP-based limiting would
  // throttle it. The abuse controls that actually matter — the OTP resend
  // cooldown and the hourly cap per number — live in AuthService and stay on.
  if (config.NODE_ENV !== 'test') {
    await app.register(rateLimit, {
      global: true,
      max: 300,
      timeWindow: '1 minute',
      // Limits follow the account when there is one, so a shared 4G NAT in a
      // busy neighbourhood does not throttle everyone behind it at once.
      keyGenerator: (request) => request.currentUser?.sub ?? request.ip,
    });
  }

  await app.register(authPlugin);
  await app.register(servicesPlugin);

  app.setErrorHandler((error, request, reply) => {
    const locale = request.locale ?? DEFAULT_LOCALE;

    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: { code: error.code, message: error.localizedMessage(locale), details: error.details },
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'validation_failed',
          message: errorMessage('validation_failed', locale),
          // Field paths and the zod message code, so the app can highlight the
          // offending input without parsing prose.
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            code: issue.message,
          })),
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = unique constraint, P2025 = record not found.
      if (error.code === 'P2002') {
        return reply.code(409).send({
          error: { code: 'conflict', message: errorMessage('conflict', locale) },
        });
      }
      if (error.code === 'P2025') {
        return reply.code(404).send({
          error: { code: 'not_found', message: errorMessage('not_found', locale) },
        });
      }
    }

    // Past the branches above, TypeScript has narrowed `error` to `unknown`;
    // the remaining cases are Fastify's own errors, which carry a status code.
    const status = (error as { statusCode?: number }).statusCode;

    if (status === 429) {
      return reply.code(429).send({
        error: { code: 'rate_limited', message: errorMessage('rate_limited', locale) },
      });
    }

    request.log.error({ err: error }, 'unhandled error');
    return reply.code(status != null && status < 500 ? status : 500).send({
      error: { code: 'internal_error', message: errorMessage('internal_error', locale) },
    });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send({
      error: { code: 'not_found', message: errorMessage('not_found', request.locale ?? DEFAULT_LOCALE) },
    }),
  );

  app.get('/health', async () => {
    await app.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', service: 'buurklus-api', time: new Date().toISOString() };
  });

  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(catalogRoutes, { prefix: '/v1/catalog' });
  await app.register(jobRoutes, { prefix: '/v1/jobs' });
  await app.register(proRoutes, { prefix: '/v1/pros' });
  await app.register(subscriptionRoutes, { prefix: '/v1/subscriptions' });
  await app.register(messageRoutes, { prefix: '/v1/conversations' });
  await app.register(notificationRoutes, { prefix: '/v1/notifications' });
  await app.register(privacyRoutes, { prefix: '/v1/privacy' });
  await app.register(signupRoutes, { prefix: '/v1/signups' });

  return app;
}

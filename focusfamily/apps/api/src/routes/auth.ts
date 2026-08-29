import {
  MIN_PASSWORD_LENGTH,
  hashPassword,
  passwordIssues,
  verifyPassword,
} from '@focusfamily/db';
import { DomainError, transparencyReport } from '@focusfamily/domain';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { audit, newId, requireSession, type Services } from '../context.js';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_DAYS,
  clearCookie,
  createToken,
  csrfCookieOptions,
  hashToken,
  serializeCookie,
  sessionCookieOptions,
} from '../security.js';

const credentialsSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

const registerSchema = credentialsSchema.extend({
  displayName: z.string().min(1).max(60),
  locale: z.enum(['nl', 'en']).default('nl'),
});

export async function registerAuthRoutes(
  app: FastifyInstance,
  services: Services,
): Promise<void> {
  const secure = services.config.isProduction;
  const cookieOptions = { secure, domain: services.config.COOKIE_DOMAIN };

  async function issueSession(
    userId: string,
    userAgent: string | undefined,
  ): Promise<{ cookies: string[] }> {
    const token = createToken();
    const csrf = createToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
    await services.prisma.authSession.create({
      data: {
        id: newId('ses'),
        userId,
        tokenHash: hashToken(token),
        csrfHash: hashToken(csrf),
        expiresAt,
        userAgent: userAgent?.slice(0, 200) ?? null,
      },
    });
    return {
      cookies: [
        serializeCookie(SESSION_COOKIE, token, sessionCookieOptions(cookieOptions)),
        serializeCookie(CSRF_COOKIE, csrf, csrfCookieOptions(cookieOptions)),
      ],
    };
  }

  /**
   * Creating an account creates a guardian. Children never sign up on their
   * own; they are linked by a guardian and given their own credentials.
   */
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const issues = passwordIssues(body.password);
    if (issues.length > 0) {
      throw DomainError.invalid('password.rejected', {
        issues,
        minLength: MIN_PASSWORD_LENGTH,
      });
    }
    const email = body.email.toLowerCase();
    const existing = await services.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Same shape and timing as success would be better still; at minimum we
      // do not say whether the address is known on the sign-in path.
      throw new DomainError('conflict', 'auth.email_in_use');
    }
    const user = await services.prisma.user.create({
      data: {
        id: newId('usr'),
        email,
        passwordHash: await hashPassword(body.password),
        displayName: body.displayName,
        locale: body.locale,
      },
    });
    const { cookies } = await issueSession(user.id, request.headers['user-agent']);
    await audit(services, { actorUserId: user.id, action: 'auth.signed_in' });
    reply.header('set-cookie', cookies);
    return reply.code(201).send({
      user: { id: user.id, displayName: user.displayName, locale: user.locale },
    });
  });

  app.post('/auth/sign-in', async (request, reply) => {
    const body = credentialsSchema.parse(request.body);
    const limited = app.signInLimiter.check(`${request.ip}:${body.email.toLowerCase()}`);
    if (!limited.allowed) {
      return reply
        .code(429)
        .header('retry-after', String(limited.retryAfterSeconds))
        .send({ error: 'rate_limited', messageKey: 'auth.too_many_attempts' });
    }
    const user = await services.prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    const ok =
      user?.passwordHash != null && (await verifyPassword(body.password, user.passwordHash));
    if (!user || !ok) {
      await audit(services, { action: 'auth.sign_in_failed' });
      // Deliberately identical for "no such account" and "wrong password".
      throw DomainError.forbidden('auth.invalid_credentials');
    }
    const { cookies } = await issueSession(user.id, request.headers['user-agent']);
    await audit(services, { actorUserId: user.id, action: 'auth.signed_in' });
    reply.header('set-cookie', cookies);
    return reply.send({
      user: { id: user.id, displayName: user.displayName, locale: user.locale },
    });
  });

  app.post('/auth/sign-out', async (request, reply) => {
    const session = request.session;
    if (session) {
      await services.prisma.authSession.update({
        where: { id: session.sessionId },
        data: { revokedAt: new Date() },
      });
    }
    reply.header('set-cookie', [
      clearCookie(SESSION_COOKIE, secure),
      clearCookie(CSRF_COOKIE, secure),
    ]);
    return reply.code(204).send();
  });

  /** Who am I, what may I do, and what does this product refuse to do. */
  app.get('/auth/me', async (request) => {
    const session = requireSession(request);
    const membership = session.actor.familyId
      ? await services.prisma.membership.findFirst({
          where: {
            familyId: session.actor.familyId,
            userId: session.actor.userId,
            removedAt: null,
          },
          include: { family: true, childProfile: true },
        })
      : null;

    return {
      user: {
        id: session.actor.userId,
        displayName: session.displayName,
        locale: session.locale,
        platformRole: session.actor.platformRole,
      },
      membership: membership
        ? {
            id: membership.id,
            role: membership.role,
            familyId: membership.familyId,
            familyName: membership.family.name,
            ageBand: session.actor.ageBand,
          }
        : null,
      permissions: transparencyReport(session.actor),
    };
  });
}

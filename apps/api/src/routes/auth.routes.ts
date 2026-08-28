import type { FastifyPluginAsync } from 'fastify';
import {
  refreshTokenSchema,
  requestOtpSchema,
  updateProfileSchema,
  verifyOtpSchema,
} from '@buurklus/shared';
import { z } from 'zod';
import { env } from '../env.js';
import { AppError } from '../lib/errors.js';

/** Parses a `15m` / `60d` style duration into milliseconds. */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const amount = Number(match[1]);
  const unit = match[2] as 's' | 'm' | 'h' | 'd';
  const multipliers = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;
  return amount * multipliers[unit];
}

const authRoutes: FastifyPluginAsync = async (app) => {
  const refreshTtlMs = parseDuration(env().REFRESH_TOKEN_TTL);

  const signAccessToken = (user: { id: string; role: string }, proId?: string) =>
    app.jwt.sign({ sub: user.id, role: user.role as never, ...(proId ? { proId } : {}) });

  app.post('/otp/request', {
    config: { rateLimit: { max: 10, timeWindow: '10 minutes' } },
    handler: async (request) => {
      const body = requestOtpSchema.parse(request.body);
      const result = await app.services.auth.requestOtp(
        body.phone,
        body.locale ?? request.locale,
        request.ip,
      );
      return { ok: true, ...result };
    },
  });

  app.post('/otp/verify', {
    config: { rateLimit: { max: 15, timeWindow: '10 minutes' } },
    handler: async (request) => {
      const body = verifyOtpSchema.parse(request.body);
      const user = await app.services.auth.verifyOtp({
        phone: body.phone,
        code: body.code,
        role: body.role,
        locale: request.locale,
        agreements: body.agreements,
        // Recorded with the agreement: in a dispute about whether someone
        // accepted the terms, "from this address, in this browser" is the only
        // thing separating a real acceptance from a claimed one.
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });

      if (body.deviceToken) {
        const platform = String(request.headers['x-buurklus-platform'] ?? 'unknown');
        await app.services.auth.registerDevice(user.id, body.deviceToken, platform);
      }

      const refreshToken = await app.services.auth.issueRefreshToken(
        user.id,
        refreshTtlMs,
        request.headers['user-agent'],
      );

      return {
        accessToken: signAccessToken(user, user.proProfile?.id),
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatarUrl: user.avatarUrl,
          locale: user.locale,
          role: user.role,
          cityId: user.cityId,
          hasProProfile: user.proProfile != null,
          proVerificationStatus: user.proProfile?.verificationStatus ?? null,
        },
      };
    },
  });

  app.post('/refresh', async (request) => {
    const body = refreshTokenSchema.parse(request.body);
    const { user, token } = await app.services.auth.rotateRefreshToken(
      body.refreshToken,
      refreshTtlMs,
      request.headers['user-agent'],
    );
    const pro = await app.prisma.proProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    return { accessToken: signAccessToken(user, pro?.id), refreshToken: token };
  });

  app.post('/logout', async (request) => {
    const body = refreshTokenSchema.partial().parse(request.body ?? {});
    if (body.refreshToken) await app.services.auth.revokeRefreshToken(body.refreshToken);
    return { ok: true };
  });

  app.get('/me', { onRequest: [app.authenticate] }, async (request) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.currentUser!.sub },
      include: {
        city: { select: { slug: true, nameNl: true, nameEn: true } },
        proProfile: { select: { id: true, displayName: true, verificationStatus: true } },
      },
    });
    if (!user) throw new AppError('not_found');

    return {
      id: user.id,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      role: user.role,
      city: user.city,
      pro: user.proProfile,
      createdAt: user.createdAt,
    };
  });

  app.patch('/me', { onRequest: [app.authenticate] }, async (request) => {
    const body = updateProfileSchema.parse(request.body);
    const city = body.cityId
      ? await app.prisma.city.findFirst({
          where: { OR: [{ id: body.cityId }, { slug: body.cityId }] },
          select: { id: true },
        })
      : null;

    const user = await app.services.auth.updateProfile(request.currentUser!.sub, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email === '' ? null : body.email,
      locale: body.locale,
      avatarUrl: body.avatarUrl,
      ...(city ? { city: { connect: { id: city.id } } } : {}),
    });

    return { id: user.id, firstName: user.firstName, lastName: user.lastName, locale: user.locale };
  });

  app.post('/devices', { onRequest: [app.authenticate] }, async (request) => {
    const body = z
      .object({ token: z.string().min(8).max(255), platform: z.enum(['ios', 'android', 'web']) })
      .parse(request.body);
    await app.services.auth.registerDevice(request.currentUser!.sub, body.token, body.platform);
    return { ok: true };
  });

  app.delete('/sessions', { onRequest: [app.authenticate] }, async (request) => {
    await app.services.auth.revokeAllForUser(request.currentUser!.sub);
    return { ok: true };
  });
};

export default authRoutes;

import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  CURRENT_AGREEMENTS,
  DATA_REQUEST_DEADLINE_DAYS,
  LEGAL_DOCUMENTS,
  MINIMUM_AGE,
  RETENTION,
  marketingConsentSchema,
} from '@buurklus/shared';
import { env } from '../env.js';
import { AppError } from '../lib/errors.js';

/** Marks a token as good for one thing only. */
const EXPORT_PURPOSE = 'data-export';
const EXPORT_LINK_TTL_SECONDS = 300;

const exportQuerySchema = z.object({ t: z.string().min(20).max(4000) });

/**
 * The endpoints behind a person's rights over their own data. Every one of
 * them acts on the caller's own account and nobody else's -- the user id comes
 * from the access token, never from the request body, so there is no parameter
 * an attacker could point at someone else's record.
 */
const privacyRoutes: FastifyPluginAsync = async (app) => {
  const signedIn = app.requireRole('CUSTOMER', 'PRO', 'ADMIN');

  /**
   * What the current build asks people to agree to, and how long things are
   * kept. Public and unauthenticated: someone deciding whether to sign up is
   * exactly the person who should be able to read it first.
   */
  app.get('/policy', async (request) => ({
    agreements: CURRENT_AGREEMENTS,
    documents: LEGAL_DOCUMENTS,
    minimumAge: MINIMUM_AGE,
    dataRequestDeadlineDays: DATA_REQUEST_DEADLINE_DAYS,
    retention: RETENTION.map((rule) => ({
      key: rule.key,
      days: rule.days,
      reason: rule.reason[request.locale],
    })),
  }));

  /**
   * Article 15 and 20: a copy of everything, in a portable format.
   *
   * Sent as a download rather than a JSON body so the app can hand it straight
   * to the share sheet, and rate-limited because an export is by definition
   * the most sensitive response this API produces -- one leaked access token
   * should not be worth a full dossier on every retry.
   */
  app.get('/me/export', {
    onRequest: [signedIn],
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
    handler: async (request, reply) => {
      const data = await app.services.privacy.exportAccount(request.currentUser!.sub);
      const stamp = new Date().toISOString().slice(0, 10);
      reply
        .header('content-type', 'application/json; charset=utf-8')
        .header('content-disposition', `attachment; filename="buurklus-gegevens-${stamp}.json"`)
        // An export must never sit in a proxy or a browser cache.
        .header('cache-control', 'no-store');
      return data;
    },
  });

  /**
   * A URL the phone can hand to the operating system so the export lands in
   * Files or Drive like any other download.
   *
   * The app cannot simply open the authenticated endpoint: a browser started
   * by Linking.openURL carries no Authorization header. So it asks for a token
   * that stands in for one, scoped to this single purpose and good for five
   * minutes. It is not an access token -- `purpose` is checked below, and an
   * access token presented here is rejected -- so a URL that ends up in a
   * browser history or a proxy log is a five-minute window on one file rather
   * than a session.
   */
  app.post('/me/export-link', {
    onRequest: [signedIn],
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    handler: async (request) => {
      const token = app.jwt.sign(
        { sub: request.currentUser!.sub, role: request.currentUser!.role, purpose: EXPORT_PURPOSE },
        { expiresIn: `${EXPORT_LINK_TTL_SECONDS}s` },
      );
      return {
        url: `${env().PUBLIC_API_URL}/v1/privacy/export?t=${encodeURIComponent(token)}`,
        expiresInSeconds: EXPORT_LINK_TTL_SECONDS,
      };
    },
  });

  /**
   * The download the link above points at. Unauthenticated in the usual sense
   * -- the token in the query string is the credential -- so the first thing
   * it does is prove the token was minted for this and nothing else.
   */
  app.get('/export', {
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
    handler: async (request, reply) => {
      const { t } = exportQuerySchema.parse(request.query);

      let payload: { sub?: string; purpose?: string };
      try {
        payload = app.jwt.verify(t);
      } catch {
        throw new AppError('unauthorized');
      }
      // An access token would otherwise work here, which would turn every
      // leaked bearer token into a one-request dossier.
      if (payload.purpose !== EXPORT_PURPOSE || !payload.sub) throw new AppError('unauthorized');

      const data = await app.services.privacy.exportAccount(payload.sub);
      const stamp = new Date().toISOString().slice(0, 10);
      reply
        .header('content-type', 'application/json; charset=utf-8')
        .header('content-disposition', `attachment; filename="buurklus-gegevens-${stamp}.json"`)
        .header('cache-control', 'no-store');
      return data;
    },
  });

  /**
   * Article 17. Irreversible, and the response says so rather than pretending
   * there is an undo. The client is expected to have asked twice already.
   */
  app.post('/me/delete', {
    onRequest: [signedIn],
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    handler: async (request, reply) => {
      const result = await app.services.privacy.eraseAccount(request.currentUser!.sub);
      request.log.info({ userId: result.id }, 'account erased on request');
      reply.code(200);
      return { erased: true, anonymisedAt: result.anonymisedAt, reversible: false };
    },
  });

  /** Article 6(1)(a) consent, and Article 7(3): withdrawing it is one call. */
  app.get('/me/marketing-consent', { onRequest: [signedIn] }, async (request) => {
    const user = await app.prisma.user.findUniqueOrThrow({
      where: { id: request.currentUser!.sub },
      select: { marketingOptInAt: true },
    });
    return { optIn: user.marketingOptInAt !== null, since: user.marketingOptInAt };
  });

  app.put('/me/marketing-consent', { onRequest: [signedIn] }, async (request) => {
    const body = marketingConsentSchema.parse(request.body);
    return app.services.privacy.setMarketingConsent(request.currentUser!.sub, body.optIn);
  });
};

export default privacyRoutes;

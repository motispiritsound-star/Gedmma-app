import type { FastifyPluginAsync } from 'fastify';
import {
  cancelSubscriptionSchema,
  paymentCallbackSchema,
  startSubscriptionSchema,
} from '@khidma/shared';
import { SubscriptionService } from '../services/subscription.service.js';
import { AppError } from '../lib/errors.js';

const subscriptionRoutes: FastifyPluginAsync = async (app) => {
  const proOnly = app.requireRole('PRO', 'ADMIN');

  app.get('/me', { onRequest: [proOnly] }, async (request) => {
    const proId = request.currentUser!.proId ?? (await app.services.pros.requireProfileId(request.currentUser!.sub));
    const subscription = await app.services.subscriptions.current(proId);
    return {
      subscription,
      grantsAccess: SubscriptionService.grantsAccess(subscription),
    };
  });

  app.post('/', { onRequest: [proOnly] }, async (request) => {
    const body = startSubscriptionSchema.parse(request.body);
    const proId = request.currentUser!.proId ?? (await app.services.pros.requireProfileId(request.currentUser!.sub));
    const user = await app.prisma.user.findUniqueOrThrow({
      where: { id: request.currentUser!.sub },
      select: { phone: true },
    });

    const result = await app.services.subscriptions.subscribe({
      proId,
      planSlug: body.planSlug,
      period: body.period,
      method: body.paymentMethod,
      returnUrl: body.returnUrl,
      customerPhone: user.phone,
    });

    return {
      redirectUrl: result.checkout.redirectUrl,
      payment: {
        reference: result.payment.reference,
        grossCentimes: result.payment.grossCentimes,
        netCentimes: result.payment.netCentimes,
        vatCentimes: result.payment.vatCentimes,
        status: result.payment.status,
      },
      subscription: result.subscription,
    };
  });

  app.post('/cancel', { onRequest: [proOnly] }, async (request) => {
    const body = cancelSubscriptionSchema.parse(request.body ?? {});
    const proId = request.currentUser!.proId ?? (await app.services.pros.requireProfileId(request.currentUser!.sub));
    return { subscription: await app.services.subscriptions.cancel(proId, body.atPeriodEnd, body.reason) };
  });

  app.get('/me/credits', { onRequest: [proOnly] }, async (request) => {
    const proId = request.currentUser!.proId ?? (await app.services.pros.requireProfileId(request.currentUser!.sub));
    return { entries: await app.services.subscriptions.creditHistory(proId) };
  });

  app.get('/me/invoices', { onRequest: [proOnly] }, async (request) => {
    const proId = request.currentUser!.proId ?? (await app.services.pros.requireProfileId(request.currentUser!.sub));
    return { invoices: await app.services.subscriptions.invoices(proId) };
  });

  /**
   * Gateway callback. Unauthenticated by design — the gateway has no token —
   * so the signature is what proves the call is genuine.
   */
  app.post('/callback', {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    handler: async (request, reply) => {
      const body = paymentCallbackSchema.parse(request.body);
      const { signature, ...payload } = body;

      // The signature is the only proof this call came from the gateway, so it
      // is checked before any money or credit changes hands.
      const signedPayload = Object.fromEntries(
        Object.entries(payload).map(([key, value]) => [key, String(value)]),
      );
      if (!app.services.payments.verifyCallbackSignature(signedPayload, signature)) {
        request.log.warn({ reference: body.reference }, 'rejected payment callback: bad signature');
        throw new AppError('forbidden');
      }

      if (body.status === 'PAID') {
        await app.services.subscriptions.settlePayment(body.reference, body.providerRef);
      } else {
        await app.services.subscriptions.failPayment(body.reference, 'gateway_declined');
      }

      request.log.info({ reference: payload.reference, status: body.status }, 'payment callback');
      reply.code(200);
      return { ok: true };
    },
  });
};

export default subscriptionRoutes;

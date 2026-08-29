import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { env } from '../env.js';
import { createSmsAdapter } from '../adapters/sms.js';
import { createPaymentAdapter, type PaymentAdapter } from '../adapters/payments.js';
import { AuthService } from '../services/auth.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { JobService } from '../services/job.service.js';
import { MessageService } from '../services/message.service.js';
import { NotificationService } from '../services/notification.service.js';
import { PrivacyService } from '../services/privacy.service.js';
import { ProService } from '../services/pro.service.js';
import { QuoteService } from '../services/quote.service.js';
import { ReviewService } from '../services/review.service.js';
import { SignupService } from '../services/signup.service.js';
import { SubscriptionService } from '../services/subscription.service.js';

export interface Services {
  auth: AuthService;
  catalog: CatalogService;
  jobs: JobService;
  messages: MessageService;
  notifications: NotificationService;
  privacy: PrivacyService;
  pros: ProService;
  quotes: QuoteService;
  reviews: ReviewService;
  signups: SignupService;
  subscriptions: SubscriptionService;
  /** Exposed so the gateway callback route can verify its signature. */
  payments: PaymentAdapter;
}

declare module 'fastify' {
  interface FastifyInstance {
    services: Services;
    prisma: typeof prisma;
  }
}

/** Wires the object graph once and hangs it off the Fastify instance. */
const servicesPlugin: FastifyPluginAsync = async (app) => {
  const config = env();
  const sms = createSmsAdapter(config, app.log);
  const payments = createPaymentAdapter(config);

  const notifications = new NotificationService(prisma, app.log);
  const subscriptions = new SubscriptionService(prisma, payments);

  const services: Services = {
    auth: new AuthService(prisma, sms, config.NODE_ENV === 'production'),
    catalog: new CatalogService(prisma),
    jobs: new JobService(prisma),
    messages: new MessageService(prisma, notifications),
    notifications,
    privacy: new PrivacyService(prisma, notifications),
    pros: new ProService(prisma, subscriptions),
    quotes: new QuoteService(prisma, subscriptions, notifications),
    reviews: new ReviewService(prisma, notifications),
    signups: new SignupService(prisma),
    subscriptions,
    payments,
  };

  app.decorate('services', services);
  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
};

export default fp(servicesPlugin, { name: 'buurklus-services' });

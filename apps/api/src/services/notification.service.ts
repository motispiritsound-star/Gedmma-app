import type { NotificationType, PrismaClient } from '@prisma/client';
import { DEFAULT_LOCALE, type Locale } from '@buurklus/shared';
import type { FastifyBaseLogger } from 'fastify';

export interface NotificationParams {
  jobTitle?: string;
  jobReference?: string;
  proName?: string;
  customerName?: string;
  amount?: string;
  days?: number;
  credits?: number;
}

type Template = (params: NotificationParams) => { title: string; body: string };

/**
 * Notification copy lives here rather than in the app, so the text a user sees
 * in their notification centre stays stable even after they change language or
 * update the app. Rendered at send time in the recipient's language.
 */
const COPY: Record<NotificationType, Record<Locale, Template>> = {
  JOB_NEW_QUOTE: {
    nl: (p) => ({ title: 'Nieuwe offerte ontvangen', body: `Je hebt een offerte gekregen voor “${p.jobTitle}”.` }),
    en: (p) => ({ title: 'New quote received', body: `You received a quote for “${p.jobTitle}”.` }),
  },
  JOB_AWARDED: {
    nl: (p) => ({ title: 'Offerte geaccepteerd', body: `Je offerte voor “${p.jobTitle}” is geaccepteerd. De contactgegevens van de klant zijn nu zichtbaar.` }),
    en: (p) => ({ title: 'Quote accepted', body: `Your quote for “${p.jobTitle}” was accepted. The customer’s contact details are now visible.` }),
  },
  JOB_CANCELLED: {
    nl: (p) => ({ title: 'Klus ingetrokken', body: `De klant heeft “${p.jobTitle}” ingetrokken. Je offerte is teruggestort.` }),
    en: (p) => ({ title: 'Job cancelled', body: `The customer cancelled “${p.jobTitle}”. Your quote has been refunded.` }),
  },
  QUOTE_REJECTED: {
    nl: (p) => ({ title: 'Offerte niet gekozen', body: `Je offerte voor “${p.jobTitle}” is niet gekozen.` }),
    en: (p) => ({ title: 'Quote not selected', body: `Your quote for “${p.jobTitle}” was not selected.` }),
  },
  NEW_LEAD: {
    nl: (p) => ({ title: 'Nieuwe klus bij je in de buurt', body: `${p.jobTitle} — reageer snel, dat scheelt.` }),
    en: (p) => ({ title: 'New job near you', body: `${p.jobTitle} — reply quickly to improve your chances.` }),
  },
  NEW_MESSAGE: {
    nl: (p) => ({ title: 'Nieuw bericht', body: `${p.customerName ?? p.proName ?? 'Je contactpersoon'} heeft je een bericht gestuurd.` }),
    en: (p) => ({ title: 'New message', body: `${p.customerName ?? p.proName ?? 'Your contact'} sent you a message.` }),
  },
  REVIEW_RECEIVED: {
    nl: (p) => ({ title: 'Nieuwe beoordeling', body: `${p.customerName ?? 'Een klant'} heeft “${p.jobTitle}” beoordeeld.` }),
    en: (p) => ({ title: 'New review', body: `${p.customerName ?? 'A customer'} reviewed “${p.jobTitle}”.` }),
  },
  SUBSCRIPTION_EXPIRING: {
    nl: (p) => ({ title: 'Je abonnement loopt bijna af', body: `Nog ${p.days} dag(en). Verleng om klussen te blijven ontvangen.` }),
    en: (p) => ({ title: 'Your subscription expires soon', body: `${p.days} day(s) left. Renew to keep receiving jobs.` }),
  },
  SUBSCRIPTION_RENEWED: {
    nl: (p) => ({ title: 'Abonnement verlengd', body: `Er zijn ${p.credits} offertes aan je account toegevoegd.` }),
    en: (p) => ({ title: 'Subscription renewed', body: `${p.credits} quotes have been added to your account.` }),
  },
  CREDITS_LOW: {
    nl: (p) => ({ title: 'Bijna door je offertes heen', body: `Je hebt nog ${p.credits} offertes deze maand.` }),
    en: (p) => ({ title: 'Running low on quotes', body: `You have ${p.credits} quotes left this month.` }),
  },
  PRO_VERIFIED: {
    nl: () => ({ title: 'Profiel geverifieerd', body: 'Je bedrijf is geverifieerd via de KvK. Klanten zien nu het vinkje bij je profiel.' }),
    en: () => ({ title: 'Profile verified', body: 'Your business is verified against the Chamber of Commerce. Customers now see the badge on your profile.' }),
  },
};

export class NotificationService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async notify(params: {
    userId: string;
    type: NotificationType;
    params?: NotificationParams;
    deepLink?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: params.userId },
      select: { locale: true },
    });
    const locale = (user?.locale ?? DEFAULT_LOCALE) as Locale;
    const rendered = COPY[params.type][locale](params.params ?? {});

    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: rendered.title,
        body: rendered.body,
        deepLink: params.deepLink,
        payload: (params.params ?? {}) as object,
      },
    });

    await this.push(params.userId, rendered);
    return notification;
  }

  /** Convenience wrapper: resolves a pro profile id to its owning user. */
  async notifyPro(
    proId: string,
    params: { type: NotificationType; params?: NotificationParams; deepLink?: string },
  ) {
    const pro = await this.prisma.proProfile.findUnique({
      where: { id: proId },
      select: { userId: true },
    });
    if (!pro) return null;
    return this.notify({ userId: pro.userId, ...params });
  }

  async list(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(userId: string, ids?: string[]) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    });
  }

  /**
   * Delivery to the device. Wired to Expo push in a later iteration; for now the
   * row in `notifications` is the source of truth and the app polls it.
   */
  private async push(userId: string, rendered: { title: string; body: string }) {
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId },
      select: { token: true, platform: true },
    });
    if (devices.length === 0) return;
    this.logger.debug({ userId, devices: devices.length, rendered }, '[push] pending delivery');
  }
}

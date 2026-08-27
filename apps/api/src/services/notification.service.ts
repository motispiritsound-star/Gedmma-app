import type { NotificationType, PrismaClient } from '@prisma/client';
import { DEFAULT_LOCALE, type Locale } from '@khidma/shared';
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
    fr: (p) => ({ title: 'Nouveau devis reçu', body: `Vous avez reçu un devis pour « ${p.jobTitle} ».` }),
    ar: (p) => ({ title: 'عرض سعر جديد', body: `توصلت بعرض سعر لطلب «${p.jobTitle}».` }),
    en: (p) => ({ title: 'New quote received', body: `You received a quote for “${p.jobTitle}”.` }),
  },
  JOB_AWARDED: {
    fr: (p) => ({ title: 'Devis accepté', body: `Votre devis pour « ${p.jobTitle} » a été accepté. Les coordonnées du client sont maintenant visibles.` }),
    ar: (p) => ({ title: 'تم قبول عرضك', body: `تم قبول عرضك لطلب «${p.jobTitle}». يمكنك الآن الاطلاع على معلومات الاتصال بالعميل.` }),
    en: (p) => ({ title: 'Quote accepted', body: `Your quote for “${p.jobTitle}” was accepted. The customer’s contact details are now visible.` }),
  },
  JOB_CANCELLED: {
    fr: (p) => ({ title: 'Demande annulée', body: `Le client a annulé « ${p.jobTitle} ». Votre crédit a été remboursé.` }),
    ar: (p) => ({ title: 'تم إلغاء الطلب', body: `ألغى العميل «${p.jobTitle}». تم إرجاع رصيدك.` }),
    en: (p) => ({ title: 'Job cancelled', body: `The customer cancelled “${p.jobTitle}”. Your credit has been refunded.` }),
  },
  QUOTE_REJECTED: {
    fr: (p) => ({ title: 'Devis non retenu', body: `Votre devis pour « ${p.jobTitle} » n'a pas été retenu.` }),
    ar: (p) => ({ title: 'لم يتم اختيار عرضك', body: `لم يتم اختيار عرضك لطلب «${p.jobTitle}».` }),
    en: (p) => ({ title: 'Quote not selected', body: `Your quote for “${p.jobTitle}” was not selected.` }),
  },
  NEW_LEAD: {
    fr: (p) => ({ title: 'Nouvelle demande près de chez vous', body: `${p.jobTitle} — répondez vite pour maximiser vos chances.` }),
    ar: (p) => ({ title: 'طلب جديد بالقرب منك', body: `${p.jobTitle} — سارع بالرد لزيادة فرصك.` }),
    en: (p) => ({ title: 'New job near you', body: `${p.jobTitle} — reply quickly to improve your chances.` }),
  },
  NEW_MESSAGE: {
    fr: (p) => ({ title: 'Nouveau message', body: `${p.customerName ?? p.proName ?? 'Votre contact'} vous a écrit.` }),
    ar: (p) => ({ title: 'رسالة جديدة', body: `${p.customerName ?? p.proName ?? 'مراسلك'} أرسل لك رسالة.` }),
    en: (p) => ({ title: 'New message', body: `${p.customerName ?? p.proName ?? 'Your contact'} sent you a message.` }),
  },
  REVIEW_RECEIVED: {
    fr: (p) => ({ title: 'Nouvel avis', body: `${p.customerName ?? 'Un client'} a laissé un avis sur « ${p.jobTitle} ».` }),
    ar: (p) => ({ title: 'تقييم جديد', body: `${p.customerName ?? 'أحد العملاء'} ترك تقييمًا حول «${p.jobTitle}».` }),
    en: (p) => ({ title: 'New review', body: `${p.customerName ?? 'A customer'} reviewed “${p.jobTitle}”.` }),
  },
  SUBSCRIPTION_EXPIRING: {
    fr: (p) => ({ title: 'Votre abonnement expire bientôt', body: `Il reste ${p.days} jour(s). Renouvelez pour continuer à recevoir des demandes.` }),
    ar: (p) => ({ title: 'اشتراكك على وشك الانتهاء', body: `تبقى ${p.days} يوم/أيام. جدّد اشتراكك لمواصلة تلقي الطلبات.` }),
    en: (p) => ({ title: 'Your subscription expires soon', body: `${p.days} day(s) left. Renew to keep receiving jobs.` }),
  },
  SUBSCRIPTION_RENEWED: {
    fr: (p) => ({ title: 'Abonnement renouvelé', body: `${p.credits} devis ont été ajoutés à votre compte.` }),
    ar: (p) => ({ title: 'تم تجديد الاشتراك', body: `تمت إضافة ${p.credits} عرض سعر إلى حسابك.` }),
    en: (p) => ({ title: 'Subscription renewed', body: `${p.credits} quotes have been added to your account.` }),
  },
  CREDITS_LOW: {
    fr: (p) => ({ title: 'Bientôt à court de devis', body: `Il vous reste ${p.credits} devis ce mois-ci.` }),
    ar: (p) => ({ title: 'رصيدك على وشك النفاد', body: `تبقى لك ${p.credits} عرض سعر هذا الشهر.` }),
    en: (p) => ({ title: 'Running low on quotes', body: `You have ${p.credits} quotes left this month.` }),
  },
  PRO_VERIFIED: {
    fr: () => ({ title: 'Profil vérifié', body: 'Votre entreprise est vérifiée. Le badge est maintenant visible par les clients.' }),
    ar: () => ({ title: 'تم توثيق ملفك', body: 'تم توثيق شركتك. أصبحت الشارة ظاهرة للعملاء.' }),
    en: () => ({ title: 'Profile verified', body: 'Your business is verified. The badge is now visible to customers.' }),
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

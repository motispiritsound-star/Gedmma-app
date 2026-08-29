import type { NotificationCategory, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { emailProvider } from '@/lib/adapters/email';
import { fromDbLocale } from '@/lib/i18n';

export interface NotificationInput {
  userId: string;
  category: NotificationCategory;
  titleNl: string;
  titleEn: string;
  bodyNl: string;
  bodyEn: string;
  link?: string;
  /** Only transactional categories are ever emailed. */
  email?: boolean;
}

/**
 * Categories that may be emailed. Engagement nudges ("your friends are
 * booking!", streaks, re-engagement drips) are deliberately absent: SkillPass
 * does not send notifications designed to manufacture urgency.
 */
const TRANSACTIONAL: NotificationCategory[] = [
  'ACCOUNT',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'WAITLIST_PROMOTED',
  'SESSION_REMINDER',
  'PROVIDER_VERIFICATION',
  'PROVIDER_ANNOUNCEMENT',
  'INCIDENT',
  'SAFEGUARDING',
];

export async function notify(input: NotificationInput, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  const notification = await tx.notification.create({
    data: {
      userId: input.userId,
      channel: 'IN_APP',
      category: input.category,
      titleNl: input.titleNl,
      titleEn: input.titleEn,
      bodyNl: input.bodyNl,
      bodyEn: input.bodyEn,
      link: input.link ?? null,
      sentAt: new Date(),
    },
  });

  const wantsEmail = input.email !== false && TRANSACTIONAL.includes(input.category);
  if (!wantsEmail) return notification;

  const user = await tx.user.findUnique({ where: { id: input.userId }, select: { email: true, locale: true, status: true } });
  if (!user || user.status === 'DELETED') return notification;

  const locale = fromDbLocale(user.locale);
  await tx.notification.create({
    data: {
      userId: input.userId,
      channel: 'EMAIL',
      category: input.category,
      titleNl: input.titleNl,
      titleEn: input.titleEn,
      bodyNl: input.bodyNl,
      bodyEn: input.bodyEn,
      link: input.link ?? null,
      sentAt: new Date(),
    },
  });

  await emailProvider().send({
    to: user.email,
    subject: locale === 'nl' ? input.titleNl : input.titleEn,
    text: `${locale === 'nl' ? input.bodyNl : input.bodyEn}${input.link ? `\n\n${input.link}` : ''}`,
    tag: input.category,
  });

  return notification;
}

export async function listNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId, channel: 'IN_APP' },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, channel: 'IN_APP', readAt: null } });
}

export async function markRead(userId: string, notificationId?: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null, ...(notificationId ? { id: notificationId } : {}) },
    data: { readAt: new Date() },
  });
}

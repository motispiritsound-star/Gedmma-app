import type { PrismaClient } from '@prisma/client';
import type { SendMessageInput } from '@buurklus/shared';
import { AppError } from '../lib/errors.js';
import { cursorArgs, toPage } from '../lib/pagination.js';
import type { NotificationService } from './notification.service.js';

/**
 * Every conversation is anchored to a job and a professional, so a thread only
 * ever exists between two people who already have a reason to talk.
 */
export class MessageService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly notifications: NotificationService,
  ) {}

  async listConversations(params: { userId: string; proId?: string; cursor?: string; limit: number }) {
    const rows = await this.prisma.conversation.findMany({
      where: params.proId
        ? { proId: params.proId }
        : { job: { customerId: params.userId } },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        job: {
          select: {
            id: true,
            reference: true,
            title: true,
            status: true,
            customerId: true,
            customer: { select: { firstName: true, avatarUrl: true } },
          },
        },
        pro: { select: { id: true, displayName: true, logoUrl: true, userId: true } },
        quote: { select: { id: true, amountCents: true, status: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      ...cursorArgs(params.cursor, params.limit),
    });
    return toPage(rows, params.limit);
  }

  async listMessages(params: { conversationId: string; userId: string; cursor?: string; limit: number }) {
    const conversation = await this.requireParticipant(params.conversationId, params.userId);

    const rows = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, firstName: true, avatarUrl: true } } },
      ...cursorArgs(params.cursor, params.limit),
    });

    // Opening the thread clears this side's unread counter.
    const isCustomer = conversation.job.customerId === params.userId;
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: isCustomer ? { customerUnread: 0 } : { proUnread: 0 },
    });

    return { conversation, ...toPage(rows, params.limit) };
  }

  async send(params: { conversationId: string; senderId: string; input: SendMessageInput }) {
    const conversation = await this.requireParticipant(params.conversationId, params.senderId);
    const isCustomer = conversation.job.customerId === params.senderId;

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: conversation.id,
          senderId: params.senderId,
          body: params.input.body,
          attachmentUrls: params.input.attachmentUrls,
        },
        include: { sender: { select: { id: true, firstName: true, avatarUrl: true } } },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: created.createdAt,
          ...(isCustomer ? { proUnread: { increment: 1 } } : { customerUnread: { increment: 1 } }),
        },
      });

      return created;
    });

    const recipientId = isCustomer ? conversation.pro.userId : conversation.job.customerId;
    await this.notifications.notify({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      params: isCustomer
        ? { customerName: conversation.job.customer.firstName ?? undefined }
        : { proName: conversation.pro.displayName },
      deepLink: `buurklus://conversations/${conversation.id}`,
    });

    return message;
  }

  private async requireParticipant(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        job: { select: { id: true, customerId: true, title: true, customer: { select: { firstName: true } } } },
        pro: { select: { id: true, userId: true, displayName: true, logoUrl: true } },
      },
    });
    if (!conversation) throw new AppError('not_found');

    const isParticipant =
      conversation.job.customerId === userId || conversation.pro.userId === userId;
    if (!isParticipant) throw new AppError('forbidden');

    return conversation;
  }
}

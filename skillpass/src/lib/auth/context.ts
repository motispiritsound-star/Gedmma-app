import { prisma } from '../db';
import { getCurrentUser, type SessionUser } from './session';

export interface ViewerContext {
  user: SessionUser | null;
  familyId: string | null;
  providerId: string | null;
  unreadNotifications: number;
}

/**
 * Everything a page layout needs about the caller in one query batch. Pages
 * must not derive family/provider ids from the URL — they come from here.
 */
export async function viewerContext(): Promise<ViewerContext> {
  const user = await getCurrentUser();
  if (!user) return { user: null, familyId: null, providerId: null, unreadNotifications: 0 };

  const [membership, staff, unread] = await Promise.all([
    prisma.familyMembership.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } }),
    prisma.providerStaff.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } }),
    prisma.notification.count({ where: { userId: user.id, channel: 'IN_APP', readAt: null } }),
  ]);

  return {
    user,
    familyId: membership?.familyId ?? null,
    providerId: staff?.providerId ?? null,
    unreadNotifications: unread,
  };
}

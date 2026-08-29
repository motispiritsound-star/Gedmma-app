import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';

export interface PlatformStats {
  guardians: number;
  children: number;
  providers: { total: number; approved: number; pending: number };
  activities: { total: number; published: number };
  sessions: { upcoming: number };
  bookings: { total: number; confirmed: number; completed: number; cancelled: number };
  attendance: { attended: number; absent: number; attendanceRate: number | null };
  credits: { granted: number; spent: number; outstanding: number };
  revenueCents: number;
  openIncidents: number;
  openSafeguardingCases: number;
}

export async function platformStats(user: SessionUser): Promise<PlatformStats> {
  requireAdmin(user);

  const [
    guardians,
    children,
    providerTotal,
    providerApproved,
    providerPending,
    activityTotal,
    activityPublished,
    upcomingSessions,
    bookingTotal,
    bookingConfirmed,
    bookingCompleted,
    bookingCancelled,
    attended,
    absent,
    grants,
    spend,
    payments,
    openIncidents,
    openCases,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'GUARDIAN', status: { not: 'DELETED' } } }),
    prisma.childProfile.count({ where: { archivedAt: null } }),
    prisma.provider.count(),
    prisma.provider.count({ where: { status: 'APPROVED' } }),
    prisma.provider.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.activity.count(),
    prisma.activity.count({ where: { status: 'PUBLISHED' } }),
    prisma.session.count({ where: { status: 'SCHEDULED', startsAt: { gte: new Date() } } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.booking.count({ where: { status: { in: ['CANCELLED_BY_GUARDIAN', 'CANCELLED_BY_PROVIDER'] } } }),
    prisma.attendance.count({ where: { status: 'ATTENDED' } }),
    prisma.attendance.count({ where: { status: 'ABSENT' } }),
    prisma.creditLedgerEntry.aggregate({ where: { delta: { gt: 0 } }, _sum: { delta: true } }),
    prisma.creditLedgerEntry.aggregate({ where: { delta: { lt: 0 } }, _sum: { delta: true } }),
    prisma.payment.aggregate({ where: { status: { in: ['SUCCEEDED', 'PARTIALLY_REFUNDED'] } }, _sum: { amountCents: true } }),
    prisma.incident.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] } } }),
    prisma.safeguardingCase.count({ where: { status: { not: 'CLOSED' } } }),
  ]);

  const granted = grants._sum.delta ?? 0;
  const spent = Math.abs(spend._sum.delta ?? 0);
  const checked = attended + absent;

  return {
    guardians,
    children,
    providers: { total: providerTotal, approved: providerApproved, pending: providerPending },
    activities: { total: activityTotal, published: activityPublished },
    sessions: { upcoming: upcomingSessions },
    bookings: { total: bookingTotal, confirmed: bookingConfirmed, completed: bookingCompleted, cancelled: bookingCancelled },
    attendance: {
      attended,
      absent,
      attendanceRate: checked > 0 ? Number(((attended / checked) * 100).toFixed(1)) : null,
    },
    credits: { granted, spent, outstanding: granted - spent },
    revenueCents: payments._sum.amountCents ?? 0,
    openIncidents,
    openSafeguardingCases: openCases,
  };
}

export async function auditTrail(user: SessionUser, filter: { action?: string; entityType?: string; limit?: number } = {}) {
  requireAdmin(user);
  return prisma.auditLog.findMany({
    where: {
      ...(filter.action ? { action: { contains: filter.action } } : {}),
      ...(filter.entityType ? { entityType: filter.entityType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: filter.limit ?? 100,
    include: { actor: { select: { displayName: true, email: true, role: true } } },
  });
}

export async function refundQueue(user: SessionUser) {
  requireAdmin(user);
  return prisma.payment.findMany({
    where: { status: { in: ['SUCCEEDED', 'PARTIALLY_REFUNDED'] } },
    orderBy: { paidAt: 'desc' },
    take: 50,
    include: {
      refunds: true,
      family: { select: { id: true, name: true } },
      subscription: { include: { plan: { select: { nameNl: true, nameEn: true } } } },
    },
  });
}

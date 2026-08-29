import { prisma } from '@/lib/db';
import { requireProviderAccess } from '@/lib/auth/rbac';
import type { SessionUser } from '@/lib/auth/session';
import { calculatePayout } from '@/modules/billing/payouts';

export interface ProviderDashboard {
  provider: {
    id: string;
    displayName: string;
    status: string;
    commissionBps: number;
  };
  counts: { activities: number; published: number; upcomingSessions: number; confirmedBookings: number };
  utilisation: { seatsOffered: number; seatsTaken: number; percentage: number | null };
  revenue: { grossCents: number; commissionCents: number; netCents: number; currency: string; attendedBookings: number };
  upcoming: {
    sessionId: string;
    activityTitleNl: string;
    activityTitleEn: string;
    startsAt: Date;
    endsAt: Date;
    seatsTaken: number;
    totalSeats: number;
    waitlist: number;
  }[];
}

/** Everything on this dashboard is scoped to the caller's own provider. */
export async function providerDashboard(user: SessionUser, providerId: string): Promise<ProviderDashboard> {
  await requireProviderAccess(user, providerId, 'bookings:read');

  const provider = await prisma.provider.findUniqueOrThrow({ where: { id: providerId } });

  const [activities, published, sessions, confirmedBookings] = await Promise.all([
    prisma.activity.count({ where: { providerId } }),
    prisma.activity.count({ where: { providerId, status: 'PUBLISHED' } }),
    prisma.session.findMany({
      where: { activity: { providerId }, status: 'SCHEDULED', startsAt: { gte: new Date() } },
      orderBy: { startsAt: 'asc' },
      take: 25,
      include: {
        capacity: true,
        activity: { include: { translations: true } },
        _count: { select: { waitlist: true } },
      },
    }),
    prisma.booking.count({ where: { status: 'CONFIRMED', session: { activity: { providerId } } } }),
  ]);

  const seatsOffered = sessions.reduce((sum, s) => sum + (s.capacity?.totalSeats ?? 0), 0);
  const seatsTaken = sessions.reduce((sum, s) => sum + (s.capacity?.seatsTaken ?? 0), 0);

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const payout = await calculatePayout(providerId, periodStart, periodEnd);

  return {
    provider: {
      id: provider.id,
      displayName: provider.displayName,
      status: provider.status,
      commissionBps: provider.commissionBps,
    },
    counts: { activities, published, upcomingSessions: sessions.length, confirmedBookings },
    utilisation: {
      seatsOffered,
      seatsTaken,
      percentage: seatsOffered > 0 ? Number(((seatsTaken / seatsOffered) * 100).toFixed(1)) : null,
    },
    revenue: {
      grossCents: payout.grossCents,
      commissionCents: payout.commissionCents,
      netCents: payout.netCents,
      currency: payout.currency,
      attendedBookings: payout.attendedBookings,
    },
    upcoming: sessions.map((s) => ({
      sessionId: s.id,
      activityTitleNl: s.activity.translations.find((t) => t.locale === 'NL')?.title ?? s.activity.slug,
      activityTitleEn: s.activity.translations.find((t) => t.locale === 'EN')?.title ?? s.activity.slug,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      seatsTaken: s.capacity?.seatsTaken ?? 0,
      totalSeats: s.capacity?.totalSeats ?? 0,
      waitlist: s._count.waitlist,
    })),
  };
}

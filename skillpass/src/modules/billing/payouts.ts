import { prisma } from '@/lib/db';
import { audit } from '@/lib/audit';
import { paymentProvider } from '@/lib/adapters/payments';
import type { SessionUser } from '@/lib/auth/session';

export interface PayoutPreview {
  providerId: string;
  providerName: string;
  attendedBookings: number;
  grossCents: number;
  commissionCents: number;
  netCents: number;
  currency: string;
  commissionBps: number;
}

/**
 * Provider earnings for a period. The MVP settles on ATTENDED bookings only:
 * a seat that nobody turned up for does not generate a payout, which keeps the
 * incentive on real delivery. Amounts are estimates until a payout is created.
 */
export async function calculatePayout(providerId: string, periodStart: Date, periodEnd: Date): Promise<PayoutPreview> {
  const provider = await prisma.provider.findUniqueOrThrow({ where: { id: providerId } });

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      attendance: { status: 'ATTENDED' },
      session: { activity: { providerId }, startsAt: { gte: periodStart, lt: periodEnd } },
    },
    include: { session: { include: { activity: { select: { listPriceCents: true, currency: true } } } } },
  });

  const grossCents = bookings.reduce((sum, b) => sum + b.session.activity.listPriceCents, 0);
  const commissionCents = Math.round((grossCents * provider.commissionBps) / 10_000);

  return {
    providerId,
    providerName: provider.displayName,
    attendedBookings: bookings.length,
    grossCents,
    commissionCents,
    netCents: grossCents - commissionCents,
    currency: bookings[0]?.session.activity.currency ?? 'EUR',
    commissionBps: provider.commissionBps,
  };
}

export async function createPayout(admin: SessionUser, providerId: string, periodStart: Date, periodEnd: Date) {
  const preview = await calculatePayout(providerId, periodStart, periodEnd);
  const provider = await prisma.provider.findUniqueOrThrow({ where: { id: providerId } });

  const existing = await prisma.payout.findUnique({
    where: { providerId_periodStart_periodEnd: { providerId, periodStart, periodEnd } },
  });
  if (existing) return existing;

  const result = await paymentProvider().createPayout({
    providerAccountRef: provider.payoutAccountRef ?? `mock_acct_${provider.slug}`,
    amount: { amountCents: preview.netCents, currency: preview.currency },
    periodStart,
    periodEnd,
    description: `SkillPass payout ${provider.displayName}`,
  });

  const payout = await prisma.payout.create({
    data: {
      providerId,
      periodStart,
      periodEnd,
      grossCents: preview.grossCents,
      commissionCents: preview.commissionCents,
      netCents: preview.netCents,
      currency: preview.currency,
      status: result.status,
      externalRef: result.externalRef,
      paidAt: result.status === 'PAID' ? new Date() : null,
    },
  });

  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.payout_created',
    entityType: 'Payout',
    entityId: payout.id,
    metadata: { providerId, netCents: preview.netCents },
  });

  return payout;
}

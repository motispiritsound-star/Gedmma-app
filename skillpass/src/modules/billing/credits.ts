import type { CreditEntryType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { InsufficientCreditsError } from '@/lib/errors';

export interface LedgerPosting {
  familyId: string;
  type: CreditEntryType;
  /** Positive adds credits, negative consumes them. Never zero. */
  delta: number;
  description: string;
  idempotencyKey: string;
  subscriptionId?: string | null;
  bookingId?: string | null;
  periodStart?: Date | null;
  periodEnd?: Date | null;
}

type Client = Prisma.TransactionClient | typeof prisma;

/** Balance is derived, never stored on the family row. */
export async function creditBalance(familyId: string, client: Client = prisma): Promise<number> {
  const latest = await client.creditLedgerEntry.findFirst({
    where: { familyId },
    orderBy: { createdAt: 'desc' },
    select: { balanceAfter: true },
  });
  return latest?.balanceAfter ?? 0;
}

/** Authoritative recomputation used by tests and reconciliation jobs. */
export async function recomputeBalance(familyId: string, client: Client = prisma): Promise<number> {
  const result = await client.creditLedgerEntry.aggregate({ where: { familyId }, _sum: { delta: true } });
  return result._sum.delta ?? 0;
}

/**
 * Appends a ledger entry. Runs inside the caller's transaction so a booking and
 * its deduction commit or fail together. The (familyId, idempotencyKey) unique
 * index makes a retried call a no-op rather than a double charge.
 */
export async function postLedgerEntry(posting: LedgerPosting, client: Client) {
  if (posting.delta === 0) throw new Error('A ledger entry must move a non-zero number of credits');

  const existing = await client.creditLedgerEntry.findUnique({
    where: { familyId_idempotencyKey: { familyId: posting.familyId, idempotencyKey: posting.idempotencyKey } },
  });
  if (existing) return existing;

  const current = await creditBalance(posting.familyId, client);
  const balanceAfter = current + posting.delta;
  if (balanceAfter < 0) {
    throw new InsufficientCreditsError(Math.abs(posting.delta), current);
  }

  return client.creditLedgerEntry.create({
    data: {
      familyId: posting.familyId,
      subscriptionId: posting.subscriptionId ?? null,
      bookingId: posting.bookingId ?? null,
      type: posting.type,
      delta: posting.delta,
      balanceAfter,
      description: posting.description,
      idempotencyKey: posting.idempotencyKey,
      periodStart: posting.periodStart ?? null,
      periodEnd: posting.periodEnd ?? null,
    },
  });
}

export async function listLedger(familyId: string, limit = 100) {
  return prisma.creditLedgerEntry.findMany({
    where: { familyId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { booking: { select: { reference: true } } },
  });
}

/**
 * Grants the monthly allowance for a subscription period. Idempotent per
 * (subscription, period) so a retried billing run cannot double-grant.
 */
export async function grantMonthlyCredits(subscriptionId: string, client: Client = prisma) {
  const subscription = await client.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!subscription?.familyId || subscription.plan.monthlyCredits <= 0) return null;
  if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') return null;

  return postLedgerEntry(
    {
      familyId: subscription.familyId,
      subscriptionId: subscription.id,
      type: 'MONTHLY_GRANT',
      delta: subscription.plan.monthlyCredits,
      description: `Monthly credits — ${subscription.plan.slug}`,
      idempotencyKey: `grant:${subscription.id}:${subscription.currentPeriodStart.toISOString()}`,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    },
    client,
  );
}

import type { Plan, Prisma, PrismaClient, Subscription } from '@prisma/client';
import {
  GRACE_PERIOD_DAYS,
  TRIAL_CREDITS,
  TRIAL_DURATION_DAYS,
  addBillingPeriod,
  applyVat,
  type BillingPeriod,
  type PaymentMethod,
} from '@khidma/shared';
import { AppError } from '../lib/errors.js';
import { invoiceReference } from '../lib/crypto.js';
import type { PaymentAdapter } from '../adapters/payments.js';

/** Transaction client, so callers can compose these calls into their own. */
type Tx = Prisma.TransactionClient;

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

const ACTIVE_STATUSES = ['TRIALING', 'ACTIVE'] as const;

export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly payments: PaymentAdapter,
  ) {}

  /** The subscription that governs a pro's access right now, if any. */
  async current(proId: string): Promise<SubscriptionWithPlan | null> {
    return this.prisma.subscription.findFirst({
      where: { proId, status: { in: [...ACTIVE_STATUSES, 'PAST_DUE'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * A subscription grants access while it is trialing or active, and for a
   * short grace period after a failed renewal so a card problem does not cut a
   * business off from its leads mid-week.
   */
  static grantsAccess(subscription: SubscriptionWithPlan | null, now = new Date()): boolean {
    if (!subscription) return false;
    if (subscription.status === 'TRIALING' || subscription.status === 'ACTIVE') {
      return subscription.currentPeriodEnd > now;
    }
    if (subscription.status === 'PAST_DUE') {
      const graceEnd = new Date(
        subscription.currentPeriodEnd.getTime() + GRACE_PERIOD_DAYS * 86_400_000,
      );
      return graceEnd > now;
    }
    return false;
  }

  async requireAccess(proId: string): Promise<SubscriptionWithPlan> {
    const subscription = await this.current(proId);
    if (!SubscriptionService.grantsAccess(subscription)) {
      throw new AppError('subscription_required');
    }
    return subscription as SubscriptionWithPlan;
  }

  /** Starts the free trial that every new professional account gets once. */
  async startTrial(proId: string, planSlug = 'pro'): Promise<SubscriptionWithPlan> {
    const existing = await this.prisma.subscription.findFirst({ where: { proId } });
    if (existing) throw new AppError('conflict');

    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { slug: planSlug } });
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 86_400_000);

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          proId,
          planId: plan.id,
          status: 'TRIALING',
          period: 'MONTHLY',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd,
          trialEndsAt: trialEnd,
          creditsRemaining: TRIAL_CREDITS,
        },
        include: { plan: true },
      });
      await this.recordCredit(tx, {
        proId,
        subscriptionId: subscription.id,
        delta: TRIAL_CREDITS,
        balanceAfter: TRIAL_CREDITS,
        reason: 'TRIAL_GRANT',
      });
      return subscription;
    });
  }

  /**
   * Subscribes a pro to a paid plan, or switches an existing subscription onto
   * a new one. Returns the checkout session the app should send them to; with
   * the mock adapter, or an offline method, no redirect is produced.
   */
  async subscribe(params: {
    proId: string;
    planSlug: string;
    period: BillingPeriod;
    method: PaymentMethod;
    returnUrl?: string;
    customerPhone: string;
  }) {
    const plan = await this.prisma.plan.findUnique({ where: { slug: params.planSlug } });
    if (!plan || !plan.isActive) throw new AppError('not_found');

    const netCentimes =
      params.period === 'YEARLY' ? plan.yearlyPriceCentimes : plan.monthlyPriceCentimes;
    const vat = applyVat(netCentimes);
    const now = new Date();

    const existing = await this.prisma.subscription.findFirst({
      where: { proId: params.proId, status: { in: [...ACTIVE_STATUSES, 'PAST_DUE'] } },
      orderBy: { createdAt: 'desc' },
    });

    const subscription = existing
      ? await this.prisma.subscription.update({
          where: { id: existing.id },
          data: { planId: plan.id, period: params.period, cancelAtPeriodEnd: false },
        })
      : await this.prisma.subscription.create({
          data: {
            proId: params.proId,
            planId: plan.id,
            status: 'PAST_DUE',
            period: params.period,
            currentPeriodStart: now,
            currentPeriodEnd: now,
            creditsRemaining: 0,
          },
        });

    const reference = await this.nextInvoiceReference();
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        reference,
        netCentimes: vat.netCentimes,
        vatCentimes: vat.vatCentimes,
        grossCentimes: vat.grossCentimes,
        vatRate: vat.vatRate,
        method: params.method,
        status: 'PENDING',
      },
    });

    const checkout = await this.payments.createCheckout({
      reference,
      grossCentimes: vat.grossCentimes,
      method: params.method,
      period: params.period,
      planSlug: plan.slug,
      returnUrl: params.returnUrl,
      customerPhone: params.customerPhone,
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: checkout.providerRef },
    });

    if (checkout.settledImmediately) {
      const activated = await this.settlePayment(reference, checkout.providerRef);
      return { checkout, payment: activated.payment, subscription: activated.subscription };
    }

    return { checkout, payment, subscription };
  }

  /**
   * Marks an invoice paid and opens the billing period it covers: the plan's
   * credits are granted and the period end is pushed forward.
   */
  async settlePayment(reference: string, providerRef: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { reference },
        include: { subscription: { include: { plan: true } } },
      });
      if (!payment) throw new AppError('not_found');
      if (payment.status === 'PAID') {
        // The gateway retries callbacks; settling twice must not grant credits twice.
        return { payment, subscription: payment.subscription };
      }

      const now = new Date();
      const subscription = payment.subscription;
      const plan = subscription.plan;
      // A renewal extends from the current period end; a lapsed one restarts now.
      const periodStart = subscription.currentPeriodEnd > now ? subscription.currentPeriodEnd : now;
      const periodEnd = addBillingPeriod(periodStart, subscription.period);
      const grantedCredits =
        subscription.period === 'YEARLY' ? plan.monthlyCredits * 12 : plan.monthlyCredits;

      const paidPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', paidAt: now, providerRef },
      });

      const balanceAfter = subscription.creditsRemaining + grantedCredits;
      const updated = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          creditsRemaining: balanceAfter,
        },
        include: { plan: true },
      });

      await this.recordCredit(tx, {
        proId: subscription.proId,
        subscriptionId: subscription.id,
        delta: grantedCredits,
        balanceAfter,
        reason: 'PLAN_GRANT',
        note: `${plan.slug} · ${subscription.period.toLowerCase()}`,
      });

      return { payment: paidPayment, subscription: updated };
    });
  }

  async failPayment(reference: string, failureReason: string) {
    const payment = await this.prisma.payment.findUnique({ where: { reference } });
    if (!payment) throw new AppError('not_found');
    if (payment.status === 'PAID') return payment;

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason },
    });
  }

  async cancel(proId: string, atPeriodEnd: boolean, reason?: string) {
    const subscription = await this.current(proId);
    if (!subscription) throw new AppError('not_found');

    return this.prisma.subscription.update({
      where: { id: subscription.id },
      data: atPeriodEnd
        ? { cancelAtPeriodEnd: true, cancelReason: reason }
        : {
            status: 'CANCELLED',
            cancelAtPeriodEnd: false,
            cancelledAt: new Date(),
            cancelReason: reason,
            creditsRemaining: 0,
          },
      include: { plan: true },
    });
  }

  /**
   * Spends one lead credit. Runs as a conditional update so two quotes sent at
   * the same moment cannot both take the last credit.
   */
  async consumeCredit(tx: Tx, params: { proId: string; subscriptionId: string; quoteId: string }) {
    const spent = await tx.subscription.updateMany({
      where: { id: params.subscriptionId, creditsRemaining: { gt: 0 } },
      data: { creditsRemaining: { decrement: 1 } },
    });
    if (spent.count === 0) throw new AppError('no_credits_remaining');

    const subscription = await tx.subscription.findUniqueOrThrow({
      where: { id: params.subscriptionId },
      select: { creditsRemaining: true },
    });

    await this.recordCredit(tx, {
      proId: params.proId,
      subscriptionId: params.subscriptionId,
      delta: -1,
      balanceAfter: subscription.creditsRemaining,
      reason: 'QUOTE_SUBMITTED',
      quoteId: params.quoteId,
    });

    return subscription.creditsRemaining;
  }

  /** Gives a credit back — used when a customer cancels before awarding. */
  async refundCredit(tx: Tx, params: { proId: string; subscriptionId: string; quoteId: string; note?: string }) {
    const subscription = await tx.subscription.update({
      where: { id: params.subscriptionId },
      data: { creditsRemaining: { increment: 1 } },
      select: { creditsRemaining: true },
    });

    await this.recordCredit(tx, {
      proId: params.proId,
      subscriptionId: params.subscriptionId,
      delta: 1,
      balanceAfter: subscription.creditsRemaining,
      reason: 'QUOTE_REFUND',
      quoteId: params.quoteId,
      note: params.note,
    });
  }

  async creditHistory(proId: string, limit = 50) {
    return this.prisma.creditLedgerEntry.findMany({
      where: { proId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async invoices(proId: string) {
    return this.prisma.payment.findMany({
      where: { subscription: { proId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async recordCredit(
    tx: Tx,
    entry: {
      proId: string;
      subscriptionId?: string;
      delta: number;
      balanceAfter: number;
      reason: Prisma.CreditLedgerEntryCreateInput['reason'];
      quoteId?: string;
      note?: string;
    },
  ) {
    await tx.creditLedgerEntry.create({
      data: {
        proId: entry.proId,
        subscriptionId: entry.subscriptionId,
        delta: entry.delta,
        balanceAfter: entry.balanceAfter,
        reason: entry.reason,
        quoteId: entry.quoteId,
        note: entry.note,
      },
    });
  }

  private async nextInvoiceReference(): Promise<string> {
    const year = new Date().getUTCFullYear();
    const count = await this.prisma.payment.count({
      where: { reference: { startsWith: `KH-${year}-` } },
    });
    return invoiceReference(year, count + 1);
  }
}

import type { Plan, Prisma, PrismaClient, Subscription } from '@prisma/client';
import {
  GRACE_PERIOD_DAYS,
  TRIAL_CREDITS,
  TRIAL_DURATION_DAYS,
  addBillingPeriod,
  applyVat,
  type BillingPeriod,
  type PaymentMethod,
} from '@buurklus/shared';
import { AppError } from '../lib/errors.js';
import { invoiceReference } from '../lib/crypto.js';
import { billingSnapshot } from './privacy.service.js';
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

  /** A plan nobody is billed for. Read from the price, not from a flag. */
  static isFree(plan: Plan): boolean {
    return plan.monthlyPriceCents === 0 && plan.yearlyPriceCents === 0;
  }

  /** The subscription that governs a pro's access right now, if any. */
  async current(proId: string): Promise<SubscriptionWithPlan | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { proId, status: { in: [...ACTIVE_STATUSES, 'PAST_DUE'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!subscription) return null;
    return this.rollFreePeriod(subscription);
  }

  /**
   * A free subscription has no invoice to renew it, so its month rolls over
   * here, the first time anyone looks at it after it lapses. Doing it lazily
   * means no scheduler has to be running for the platform to keep working.
   *
   * The update is conditional on the period end we read, so two requests
   * arriving at the same moment cannot both grant a month of credits: the
   * second matches no row and simply re-reads what the first wrote.
   */
  private async rollFreePeriod(
    subscription: SubscriptionWithPlan,
    now = new Date(),
  ): Promise<SubscriptionWithPlan> {
    if (!SubscriptionService.isFree(subscription.plan)) return subscription;
    if (subscription.currentPeriodEnd > now) return subscription;

    const periodEnd = addBillingPeriod(now, 'MONTHLY');
    const credits = subscription.plan.monthlyCredits;

    const rolled = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.subscription.updateMany({
        where: { id: subscription.id, currentPeriodEnd: subscription.currentPeriodEnd },
        data: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          // The quota is a monthly allowance, not a balance to hoard: unused
          // credits do not roll over, so one dormant account cannot come back
          // with a year of quota and flood every open job.
          creditsRemaining: credits,
        },
      });
      if (claimed.count === 0) return null;

      await this.recordCredit(tx, {
        proId: subscription.proId,
        subscriptionId: subscription.id,
        delta: credits - subscription.creditsRemaining,
        balanceAfter: credits,
        reason: 'PLAN_GRANT',
        note: `${subscription.plan.slug} · gratis maand`,
      });
      return true;
    });

    if (!rolled) {
      return this.prisma.subscription.findUniqueOrThrow({
        where: { id: subscription.id },
        include: { plan: true },
      });
    }

    return {
      ...subscription,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      creditsRemaining: credits,
    };
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

  /**
   * Puts a new professional account on a plan. Which plan is a question for
   * the database, not a hardcoded slug: today the cheapest active plan is free
   * and nobody trials anything, and when the paid tiers are switched back on
   * the same call starts a trial again without being rewritten.
   *
   * A free plan gets an active month with the plan's own quota; a paid plan
   * gets the trial. Either way the professional can start working immediately
   * and is never asked for payment details to sign up.
   */
  async startInitialSubscription(proId: string, planSlug?: string): Promise<SubscriptionWithPlan> {
    const existing = await this.prisma.subscription.findFirst({ where: { proId } });
    if (existing) throw new AppError('conflict');

    const plan = planSlug
      ? await this.prisma.plan.findUniqueOrThrow({ where: { slug: planSlug } })
      : ((await this.prisma.plan.findFirst({
          where: { isActive: true, featured: true },
          orderBy: { position: 'asc' },
        })) ??
        (await this.prisma.plan.findFirstOrThrow({
          where: { isActive: true },
          orderBy: { position: 'asc' },
        })));

    const free = SubscriptionService.isFree(plan);
    const now = new Date();
    const periodEnd = free
      ? addBillingPeriod(now, 'MONTHLY')
      : new Date(now.getTime() + TRIAL_DURATION_DAYS * 86_400_000);
    const credits = free ? plan.monthlyCredits : TRIAL_CREDITS;

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          proId,
          planId: plan.id,
          status: free ? 'ACTIVE' : 'TRIALING',
          period: 'MONTHLY',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          // Only a trial ends on a date the professional needs to know about.
          trialEndsAt: free ? null : periodEnd,
          creditsRemaining: credits,
        },
        include: { plan: true },
      });
      await this.recordCredit(tx, {
        proId,
        subscriptionId: subscription.id,
        delta: credits,
        balanceAfter: credits,
        reason: free ? 'PLAN_GRANT' : 'TRIAL_GRANT',
        note: free ? `${plan.slug} · gratis maand` : undefined,
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
    // Nothing to charge for, so there is nothing to check out. Sending a zero
    // euro order to the payment provider would fail there instead of here.
    if (SubscriptionService.isFree(plan)) throw new AppError('validation_failed');

    const netCents =
      params.period === 'YEARLY' ? plan.yearlyPriceCents : plan.monthlyPriceCents;
    const vat = applyVat(netCents);
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
    // Frozen onto the invoice rather than read through the relations at print
    // time: an invoice has to stay legible for seven years, including after
    // the account behind it has exercised its right to erasure.
    const biller = await this.prisma.proProfile.findUniqueOrThrow({
      where: { id: params.proId },
      select: { displayName: true, kvk: true, vatId: true },
    });
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        reference,
        netCents: vat.netCents,
        vatCents: vat.vatCents,
        grossCents: vat.grossCents,
        vatRate: vat.vatRate,
        method: params.method,
        status: 'PENDING',
        billingSnapshot: billingSnapshot(biller),
      },
    });

    const checkout = await this.payments.createCheckout({
      reference,
      grossCents: vat.grossCents,
      method: params.method,
      period: params.period,
      planSlug: plan.slug,
      returnUrl: params.returnUrl,
      customerPhone: params.customerPhone,
      // Shown on the customer's bank statement and in the provider's dashboard.
      description: `Buurklus ${plan.nameNl} — ${params.period === 'YEARLY' ? 'jaarabonnement' : 'maandabonnement'}`,
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
      where: { reference: { startsWith: `BK-${year}-` } },
    });
    return invoiceReference(year, count + 1);
  }
}

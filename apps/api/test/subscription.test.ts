import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PLAN, PLANS, TRIAL_CREDITS, applyVat, eurosToCents } from '@buurklus/shared';
import {
  auth,
  createPro,
  createTestApp,
  prisma,
  resetTransactionalData,
  sellPaidPlans,
} from './helpers.js';

/** Credits a pro is holding right now, before whatever the test does next. */
async function creditsOf(proId: string) {
  const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId } });
  return subscription.creditsRemaining;
}

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(resetTransactionalData);

describe('signing up as a professional', () => {
  it('opens a free subscription, with no trial and no card', async () => {
    const pro = await createPro(app, { phone: '0614000001' });

    const subscription = await prisma.subscription.findFirstOrThrow({
      where: { proId: pro.proId },
      include: { plan: true },
    });
    expect(subscription.plan.slug).toBe(DEFAULT_PLAN.slug);
    expect(subscription.plan.monthlyPriceCents).toBe(0);
    expect(subscription.status).toBe('ACTIVE');
    expect(subscription.creditsRemaining).toBe(DEFAULT_PLAN.monthlyCredits);
    // Nothing runs out, so there is no date to warn anybody about.
    expect(subscription.trialEndsAt).toBeNull();

    const entry = await prisma.creditLedgerEntry.findFirstOrThrow({
      where: { proId: pro.proId, reason: 'PLAN_GRANT' },
    });
    expect(entry.delta).toBe(DEFAULT_PLAN.monthlyCredits);
    expect(entry.balanceAfter).toBe(DEFAULT_PLAN.monthlyCredits);

    // And the professional can work straight away.
    const dashboard = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/dashboard',
      headers: auth(pro.accessToken),
    });
    expect(dashboard.json().subscription.grantsAccess).toBe(true);
  });

  it('rolls the free month over instead of cutting access off', async () => {
    const pro = await createPro(app, { phone: '0614000002' });
    const before = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });

    // Spend some of the quota, then move the period into the past.
    await prisma.subscription.update({
      where: { id: before.id },
      data: { creditsRemaining: 3, currentPeriodEnd: new Date(Date.now() - 60_000) },
    });

    const dashboard = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/dashboard',
      headers: auth(pro.accessToken),
    });
    expect(dashboard.json().subscription.grantsAccess).toBe(true);

    const after = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(after.status).toBe('ACTIVE');
    expect(after.creditsRemaining).toBe(DEFAULT_PLAN.monthlyCredits);
    expect(after.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
  });

  it('rolls a lapsed month over exactly once, however many requests arrive', async () => {
    const pro = await createPro(app, { phone: '0614000003' });
    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { creditsRemaining: 0, currentPeriodEnd: new Date(Date.now() - 60_000) },
    });

    await Promise.all(
      Array.from({ length: 5 }, () =>
        app.inject({
          method: 'GET',
          url: '/v1/subscriptions/me',
          headers: auth(pro.accessToken),
        }),
      ),
    );

    const after = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(after.creditsRemaining).toBe(DEFAULT_PLAN.monthlyCredits);
    // One grant at sign-up, one for the new month, and nothing else.
    expect(
      await prisma.creditLedgerEntry.count({ where: { proId: pro.proId, reason: 'PLAN_GRANT' } }),
    ).toBe(2);
  });

  it('refuses to raise an invoice for a plan that costs nothing', async () => {
    const pro = await createPro(app, { phone: '0614000004' });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: auth(pro.accessToken),
      payload: { planSlug: DEFAULT_PLAN.slug, period: 'MONTHLY', paymentMethod: 'IDEAL' },
    });
    expect(response.statusCode).toBe(400);
  });

  it('sells no paid plan while Buurklus is free', async () => {
    const pro = await createPro(app, { phone: '0614000005' });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: auth(pro.accessToken),
      payload: { planSlug: 'vakman', period: 'MONTHLY', paymentMethod: 'IDEAL' },
    });
    expect(response.statusCode).toBe(404);

    // And the app is never shown a price it cannot act on.
    const plans = await app.inject({ method: 'GET', url: '/v1/catalog/plans' });
    const slugs = (plans.json().plans as Array<{ slug: string }>).map((plan) => plan.slug);
    expect(slugs).toEqual([DEFAULT_PLAN.slug]);
  });

  it('still starts a trial when the plan it lands on is a paid one', async () => {
    // The day the paid tiers come back, sign-up has to keep working. Nothing
    // here is reachable through the API today, so it goes through the service.
    const pro = await createPro(app, { phone: '0614000006' });
    await prisma.creditLedgerEntry.deleteMany({ where: { proId: pro.proId } });
    await prisma.subscription.deleteMany({ where: { proId: pro.proId } });

    const subscription = await app.services.subscriptions.startInitialSubscription(
      pro.proId,
      'vakman',
    );
    expect(subscription.status).toBe('TRIALING');
    expect(subscription.creditsRemaining).toBe(TRIAL_CREDITS);
    expect(subscription.trialEndsAt).not.toBeNull();
  });
});

describe('subscribing to a paid plan', () => {
  it('raises an invoice with 21% Dutch VAT and grants the plan credits', async () => {
    const pro = await createPro(app, { phone: '0614000010' });
    await sellPaidPlans();
    const plan = PLANS.find((row) => row.slug === 'vakman')!;
    const before = await creditsOf(pro.proId);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: auth(pro.accessToken),
      payload: { planSlug: 'vakman', period: 'MONTHLY', paymentMethod: 'IDEAL' },
    });
    expect(response.statusCode).toBe(200);

    const expected = applyVat(eurosToCents(plan.monthlyPriceEur));
    const payment = response.json().payment;
    expect(payment.netCents).toBe(expected.netCents);
    expect(payment.vatCents).toBe(expected.vatCents);
    expect(payment.grossCents).toBe(expected.grossCents);
    expect(payment.reference).toMatch(/^BK-\d{4}-\d{6}$/);

    // The mock gateway settles at once, so the plan's credits are already in.
    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(subscription.status).toBe('ACTIVE');
    expect(subscription.creditsRemaining).toBe(before + plan.monthlyCredits);
    expect(subscription.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
  });

  it('bills a year at ten months and grants twelve months of credits', async () => {
    const pro = await createPro(app, { phone: '0614000020' });
    await sellPaidPlans();
    const plan = PLANS.find((row) => row.slug === 'zzp')!;
    const before = await creditsOf(pro.proId);

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: auth(pro.accessToken),
      payload: { planSlug: 'zzp', period: 'YEARLY', paymentMethod: 'IDEAL' },
    });

    expect(response.json().payment.netCents).toBe(eurosToCents(plan.monthlyPriceEur * 10));

    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(subscription.creditsRemaining).toBe(before + plan.monthlyCredits * 12);
  });

  it('rejects an unknown plan', async () => {
    const pro = await createPro(app, { phone: '0614000030' });
    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: auth(pro.accessToken),
      payload: { planSlug: 'platina', period: 'MONTHLY' },
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('the payment callback', () => {
  it('grants credits exactly once even if the gateway retries', async () => {
    const pro = await createPro(app, { phone: '0614000040' });
    await sellPaidPlans();
    const before = await creditsOf(pro.proId);

    // Create a pending invoice by hand: the mock gateway would settle instantly.
    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    const plan = await prisma.plan.findUniqueOrThrow({ where: { slug: 'vakman' } });
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { planId: plan.id, status: 'PAST_DUE' },
    });
    const vat = applyVat(plan.monthlyPriceCents);
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        reference: 'BK-2026-009999',
        netCents: vat.netCents,
        vatCents: vat.vatCents,
        grossCents: vat.grossCents,
        method: 'IDEAL',
        status: 'PENDING',
      },
    });

    const callback = {
      reference: payment.reference,
      providerRef: 'cmi_ref_1',
      status: 'PAID' as const,
      amountCents: vat.grossCents,
      signature: 'mock-signature',
    };

    const first = await app.inject({ method: 'POST', url: '/v1/subscriptions/callback', payload: callback });
    const retry = await app.inject({ method: 'POST', url: '/v1/subscriptions/callback', payload: callback });

    expect(first.statusCode).toBe(200);
    expect(retry.statusCode).toBe(200);

    const after = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(after.status).toBe('ACTIVE');
    expect(after.creditsRemaining).toBe(before + plan.monthlyCredits);

    // Sign-up granted the free month; the invoice grants exactly one more.
    expect(
      await prisma.creditLedgerEntry.count({ where: { proId: pro.proId, reason: 'PLAN_GRANT' } }),
    ).toBe(2);
  });

  it('marks a declined payment as failed without granting anything', async () => {
    const pro = await createPro(app, { phone: '0614000050' });
    await sellPaidPlans();
    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    const grantsBefore = await prisma.creditLedgerEntry.count({
      where: { proId: pro.proId, reason: 'PLAN_GRANT' },
    });
    const payment = await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        reference: 'BK-2026-009998',
        netCents: 59_900,
        vatCents: 11_980,
        grossCents: 71_880,
        method: 'IDEAL',
        status: 'PENDING',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions/callback',
      payload: {
        reference: payment.reference,
        providerRef: 'cmi_ref_2',
        status: 'FAILED',
        amountCents: 71_880,
        signature: 'mock-signature',
      },
    });
    expect(response.statusCode).toBe(200);

    const after = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    expect(after.status).toBe('FAILED');
    expect(
      await prisma.creditLedgerEntry.count({ where: { proId: pro.proId, reason: 'PLAN_GRANT' } }),
    ).toBe(grantsBefore);
  });
});

describe('cancelling', () => {
  it('keeps access to the end of the paid period by default', async () => {
    const pro = await createPro(app, { phone: '0614000060', planSlug: 'vakman' });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions/cancel',
      headers: auth(pro.accessToken),
      payload: { atPeriodEnd: true, reason: 'Trop cher pour le moment' },
    });
    expect(response.statusCode).toBe(200);

    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(subscription.cancelAtPeriodEnd).toBe(true);
    expect(subscription.status).toBe('ACTIVE');

    // Still able to work until the period runs out.
    const dashboard = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/dashboard',
      headers: auth(pro.accessToken),
    });
    expect(dashboard.json().subscription.grantsAccess).toBe(true);
  });

  it('ends access immediately when asked to', async () => {
    const pro = await createPro(app, { phone: '0614000070', planSlug: 'vakman' });

    await app.inject({
      method: 'POST',
      url: '/v1/subscriptions/cancel',
      headers: auth(pro.accessToken),
      payload: { atPeriodEnd: false },
    });

    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(subscription.status).toBe('CANCELLED');
    expect(subscription.creditsRemaining).toBe(0);

    const leads = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/leads',
      headers: auth(pro.accessToken),
    });
    expect(leads.statusCode).toBe(402);
    expect(leads.json().error.code).toBe('subscription_required');
  });
});

describe('plan limits', () => {
  it('refuses more trades than the plan allows', async () => {
    const pro = await createPro(app, { phone: '0614000080', planSlug: 'zzp' });

    const response = await app.inject({
      method: 'PUT',
      url: '/v1/pros/me',
      headers: auth(pro.accessToken),
      payload: {
        displayName: 'Testbedrijf',
        legalForm: 'BV',
        bio: 'Testbedrijf met een compleet team en ruime ervaring in binnen- en buitenwerk.',
        yearsExperience: 10,
        baseCitySlug: 'utrecht',
        // The zzp plan allows two trades.
        categorySlugs: ['binnenschilderwerk', 'lekkage', 'riool-ontstoppen'],
        citySlugs: ['utrecht'],
        kvk: '99614000080'.slice(-8),
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().error.code).toBe('plan_limit_categories');
  });
});

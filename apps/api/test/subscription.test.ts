import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PLANS, TRIAL_CREDITS, applyVat, eurosToCents } from '@buurklus/shared';
import { auth, createPro, createTestApp, prisma, resetTransactionalData } from './helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(resetTransactionalData);

describe('the free trial', () => {
  it('starts automatically when a professional completes their profile', async () => {
    const pro = await createPro(app, { phone: '0614000001' });

    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(subscription.status).toBe('TRIALING');
    expect(subscription.creditsRemaining).toBe(TRIAL_CREDITS);
    expect(subscription.trialEndsAt).not.toBeNull();

    const entry = await prisma.creditLedgerEntry.findFirstOrThrow({
      where: { proId: pro.proId, reason: 'TRIAL_GRANT' },
    });
    expect(entry.delta).toBe(TRIAL_CREDITS);
    expect(entry.balanceAfter).toBe(TRIAL_CREDITS);
  });
});

describe('subscribing to a paid plan', () => {
  it('raises an invoice with 21% Dutch VAT and grants the plan credits', async () => {
    const pro = await createPro(app, { phone: '0614000010' });
    const plan = PLANS.find((row) => row.slug === 'vakman')!;

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
    expect(subscription.creditsRemaining).toBe(TRIAL_CREDITS + plan.monthlyCredits);
    expect(subscription.currentPeriodEnd.getTime()).toBeGreaterThan(Date.now());
  });

  it('bills a year at ten months and grants twelve months of credits', async () => {
    const pro = await createPro(app, { phone: '0614000020' });
    const plan = PLANS.find((row) => row.slug === 'zzp')!;

    const response = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: auth(pro.accessToken),
      payload: { planSlug: 'zzp', period: 'YEARLY', paymentMethod: 'IDEAL' },
    });

    expect(response.json().payment.netCents).toBe(eurosToCents(plan.monthlyPriceEur * 10));

    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(subscription.creditsRemaining).toBe(TRIAL_CREDITS + plan.monthlyCredits * 12);
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
    expect(after.creditsRemaining).toBe(TRIAL_CREDITS + plan.monthlyCredits);

    expect(
      await prisma.creditLedgerEntry.count({ where: { proId: pro.proId, reason: 'PLAN_GRANT' } }),
    ).toBe(1);
  });

  it('marks a declined payment as failed without granting anything', async () => {
    const pro = await createPro(app, { phone: '0614000050' });
    const subscription = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
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
    ).toBe(0);
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

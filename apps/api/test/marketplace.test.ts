import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  VALID_JOB,
  auth,
  createPro,
  createTestApp,
  prisma,
  resetTransactionalData,
  signIn,
} from './helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(resetTransactionalData);

/** Backdates publication so a job clears every plan's head start. */
async function releaseToAllPlans(jobId: string) {
  await prisma.job.update({
    where: { id: jobId },
    data: { publishedAt: new Date(Date.now() - 60 * 60_000) },
  });
}

async function postJob(token: string, overrides: Record<string, unknown> = {}) {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/jobs',
    headers: auth(token),
    payload: { ...VALID_JOB, ...overrides },
  });
  expect(response.statusCode).toBe(201);
  return response.json().job as { id: string; reference: string };
}

const QUOTE = {
  amountMad: 4500,
  message:
    "Bonjour, je peux intervenir dès lundi prochain. Le prix comprend la peinture, le rebouchage et la protection du sol.",
  estimatedDurationDays: 2,
  validityDays: 14,
};

describe('posting a job', () => {
  it('creates an open job with a quotable reference', async () => {
    const customer = await signIn(app, '0613000001');
    const job = await postJob(customer.accessToken);

    expect(job.reference).toMatch(/^KH-[A-Z0-9]{6}$/);

    const stored = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(stored.status).toBe('OPEN');
    expect(stored.budgetMinCentimes).toBe(300_000);
    expect(stored.budgetMaxCentimes).toBe(600_000);
    expect(stored.expiresAt).not.toBeNull();
  });

  it('refuses a description too short to quote against', async () => {
    const customer = await signIn(app, '0613000002');
    const response = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: auth(customer.accessToken),
      payload: { ...VALID_JOB, description: 'Peinture salon' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.details[0].path).toBe('description');
  });
});

describe('the lead feed', () => {
  it('shows a pro only the trades and cities they cover', async () => {
    const customer = await signIn(app, '0613000010');
    const matching = await postJob(customer.accessToken);
    const otherCity = await postJob(customer.accessToken, { citySlug: 'agadir' });
    const otherTrade = await postJob(customer.accessToken, { categorySlug: 'debouchage' });
    await Promise.all([matching, otherCity, otherTrade].map((job) => releaseToAllPlans(job.id)));

    const pro = await createPro(app, {
      phone: '0613000011',
      categorySlugs: ['peinture-interieure'],
      citySlugs: ['casablanca'],
      planSlug: 'artisan',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/leads',
      headers: auth(pro.accessToken),
    });
    expect(response.statusCode).toBe(200);

    const ids = (response.json().items as Array<{ id: string }>).map((row) => row.id);
    expect(ids).toEqual([matching.id]);
  });

  it('holds a new lead back from a lower tier until its head start elapses', async () => {
    const customer = await signIn(app, '0613000020');
    const job = await postJob(customer.accessToken);

    // Published just now: only the top tier's head start has run down.
    const artisan = await createPro(app, {
      phone: '0613000021',
      planSlug: 'artisan',
      displayName: 'Artisan indépendant',
    });
    const entreprise = await createPro(app, {
      phone: '0613000022',
      planSlug: 'entreprise',
      displayName: 'Grande entreprise',
    });

    const artisanFeed = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/leads',
      headers: auth(artisan.accessToken),
    });
    const entrepriseFeed = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/leads',
      headers: auth(entreprise.accessToken),
    });

    expect((artisanFeed.json().items as unknown[]).length).toBe(0);
    expect((entrepriseFeed.json().items as Array<{ id: string }>)[0]?.id).toBe(job.id);

    // Quoting is blocked too, so the feed cannot simply be bypassed by id.
    const early = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(artisan.accessToken),
      payload: QUOTE,
    });
    expect(early.statusCode).toBe(403);
    expect(early.json().error.code).toBe('lead_not_released');

    // Once the head start has elapsed, the same pro sees it.
    await releaseToAllPlans(job.id);
    const later = await app.inject({
      method: 'GET',
      url: '/v1/pros/me/leads',
      headers: auth(artisan.accessToken),
    });
    expect((later.json().items as Array<{ id: string }>)[0]?.id).toBe(job.id);
  });

  it('hides the street address until the job is awarded', async () => {
    const customer = await signIn(app, '0613000030');
    const job = await postJob(customer.accessToken, {
      addressLine: '12 rue Ibn Batouta, Maârif',
      coordinates: { lat: 33.5731, lng: -7.5898 },
    });
    await releaseToAllPlans(job.id);

    const pro = await createPro(app, { phone: '0613000031', planSlug: 'artisan' });

    const before = await app.inject({
      method: 'GET',
      url: `/v1/jobs/${job.id}`,
      headers: auth(pro.accessToken),
    });
    expect(before.json().job.addressLine).toBeNull();
    expect(before.json().job.contactPhone).toBeNull();
    expect(before.json().job.customer.phone).toBeUndefined();

    const quote = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });
    expect(quote.statusCode).toBe(201);

    await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes/${quote.json().quote.id}/accept`,
      headers: auth(customer.accessToken),
    });

    const after = await app.inject({
      method: 'GET',
      url: `/v1/jobs/${job.id}`,
      headers: auth(pro.accessToken),
    });
    expect(after.json().job.addressLine).toBe('12 rue Ibn Batouta, Maârif');
    expect(after.json().job.contactPhone).toBe('+212613000030');
  });
});

describe('quoting and lead credits', () => {
  it('spends one credit per quote and records it in the ledger', async () => {
    const customer = await signIn(app, '0613000040');
    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);

    const pro = await createPro(app, { phone: '0613000041', planSlug: 'artisan' });
    const before = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });

    const response = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().creditsRemaining).toBe(before.creditsRemaining - 1);

    const entry = await prisma.creditLedgerEntry.findFirstOrThrow({
      where: { proId: pro.proId, reason: 'QUOTE_SUBMITTED' },
    });
    expect(entry.delta).toBe(-1);
    expect(entry.balanceAfter).toBe(before.creditsRemaining - 1);
  });

  it('refuses a second quote from the same professional', async () => {
    const customer = await signIn(app, '0613000050');
    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);
    const pro = await createPro(app, { phone: '0613000051', planSlug: 'artisan' });

    const first = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });
    const second = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe('job_already_quoted');

    // The rejected attempt must not have cost a second credit.
    expect(
      await prisma.creditLedgerEntry.count({
        where: { proId: pro.proId, reason: 'QUOTE_SUBMITTED' },
      }),
    ).toBe(1);
  });

  it('stops a professional who has run out of credits', async () => {
    const customer = await signIn(app, '0613000060');
    const pro = await createPro(app, { phone: '0613000061', planSlug: 'artisan' });

    await prisma.subscription.updateMany({
      where: { proId: pro.proId },
      data: { creditsRemaining: 0 },
    });

    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);

    const response = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });
    expect(response.statusCode).toBe(402);
    expect(response.json().error.code).toBe('no_credits_remaining');
    expect(await prisma.quote.count({ where: { proId: pro.proId } })).toBe(0);
  });

  it('requires a subscription before quoting', async () => {
    const customer = await signIn(app, '0613000070');
    const pro = await createPro(app, { phone: '0613000071' });

    // Expire the trial that profile creation granted.
    await prisma.subscription.updateMany({
      where: { proId: pro.proId },
      data: { status: 'EXPIRED', currentPeriodEnd: new Date(Date.now() - 86_400_000) },
    });

    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);

    const response = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });
    expect(response.statusCode).toBe(402);
    expect(response.json().error.code).toBe('subscription_required');
  });
});

describe('awarding and reviewing', () => {
  it('runs the full flow: quote, award, complete, review', async () => {
    const customer = await signIn(app, '0613000080');
    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);

    const winner = await createPro(app, {
      phone: '0613000081',
      displayName: 'Peinture El Amrani',
      planSlug: 'pro',
    });
    const loser = await createPro(app, {
      phone: '0613000082',
      displayName: 'Décoration Atlas',
      planSlug: 'pro',
    });

    const winningQuote = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(winner.accessToken),
      payload: QUOTE,
    });
    const losingQuote = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(loser.accessToken),
      payload: { ...QUOTE, amountMad: 5200 },
    });
    expect(winningQuote.statusCode).toBe(201);
    expect(losingQuote.statusCode).toBe(201);

    // The customer sees both offers with the professional attached.
    const detail = await app.inject({
      method: 'GET',
      url: `/v1/jobs/${job.id}`,
      headers: auth(customer.accessToken),
    });
    expect(detail.json().viewer).toBe('CUSTOMER');
    expect(detail.json().job.quotes).toHaveLength(2);

    const accepted = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes/${winningQuote.json().quote.id}/accept`,
      headers: auth(customer.accessToken),
    });
    expect(accepted.statusCode).toBe(200);

    const awardedJob = await prisma.job.findUniqueOrThrow({ where: { id: job.id } });
    expect(awardedJob.status).toBe('AWARDED');
    expect(awardedJob.awardedQuoteId).toBe(winningQuote.json().quote.id);

    const rejected = await prisma.quote.findUniqueOrThrow({
      where: { id: losingQuote.json().quote.id },
    });
    expect(rejected.status).toBe('REJECTED');

    // A losing pro keeps their credit: Khidma charges for the lead, not the win.
    const loserSubscription = await prisma.subscription.findFirstOrThrow({
      where: { proId: loser.proId },
    });
    expect(
      await prisma.creditLedgerEntry.count({
        where: { proId: loser.proId, reason: 'QUOTE_REFUND' },
      }),
    ).toBe(0);
    expect(loserSubscription.creditsRemaining).toBeGreaterThan(0);

    // A review is only possible once the work is marked complete.
    const tooEarly = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/review`,
      headers: auth(customer.accessToken),
      payload: { rating: 5, comment: 'Travail impeccable et équipe très ponctuelle.' },
    });
    expect(tooEarly.statusCode).toBe(409);
    expect(tooEarly.json().error.code).toBe('review_requires_completed_job');

    await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/complete`,
      headers: auth(customer.accessToken),
    });

    const review = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/review`,
      headers: auth(customer.accessToken),
      payload: {
        rating: 5,
        qualityRating: 5,
        punctualityRating: 4,
        comment: 'Travail impeccable et équipe très ponctuelle. Je recommande.',
      },
    });
    expect(review.statusCode).toBe(201);

    const profile = await prisma.proProfile.findUniqueOrThrow({ where: { id: winner.proId } });
    expect(profile.ratingCount).toBe(1);
    expect(profile.ratingAverage).toBe(5);
    expect(profile.jobsWon).toBe(1);

    // And only once.
    const duplicate = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/review`,
      headers: auth(customer.accessToken),
      payload: { rating: 1, comment: 'Je change d’avis finalement, ce n’était pas terrible.' },
    });
    expect(duplicate.statusCode).toBe(409);
  });

  it('refunds every pending quote when the customer cancels', async () => {
    const customer = await signIn(app, '0613000090');
    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);

    const pro = await createPro(app, { phone: '0613000091', planSlug: 'artisan' });
    await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });

    const spent = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });

    const cancelled = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/cancel`,
      headers: auth(customer.accessToken),
      payload: { reason: 'Travaux reportés' },
    });
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json().refundedCredits).toBe(1);

    const refunded = await prisma.subscription.findFirstOrThrow({ where: { proId: pro.proId } });
    expect(refunded.creditsRemaining).toBe(spent.creditsRemaining + 1);

    const entry = await prisma.creditLedgerEntry.findFirstOrThrow({
      where: { proId: pro.proId, reason: 'QUOTE_REFUND' },
    });
    expect(entry.delta).toBe(1);
  });

  it('shows a professional their own posted job as its customer', async () => {
    // A tradesperson hiring another trade for their own premises is a normal
    // case, and they must see their own address rather than the lead view.
    const pro = await createPro(app, { phone: '0613000200', planSlug: 'artisan' });

    const posted = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: auth(pro.accessToken),
      payload: {
        ...VALID_JOB,
        categorySlug: 'debouchage',
        addressLine: '8 rue des Artisans, Derb Omar',
      },
    });
    expect(posted.statusCode).toBe(201);

    const detail = await app.inject({
      method: 'GET',
      url: `/v1/jobs/${posted.json().job.id}`,
      headers: auth(pro.accessToken),
    });

    expect(detail.json().viewer).toBe('CUSTOMER');
    expect(detail.json().job.addressLine).toBe('8 rue des Artisans, Derb Omar');
  });

  it('lets only the customer who posted the job award it', async () => {
    const customer = await signIn(app, '0613000100');
    const stranger = await signIn(app, '0613000101');
    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);

    const pro = await createPro(app, { phone: '0613000102', planSlug: 'artisan' });
    const quote = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes/${quote.json().quote.id}/accept`,
      headers: auth(stranger.accessToken),
    });
    expect(response.statusCode).toBe(403);
  });
});

describe('messaging', () => {
  it('opens a thread when a quote is sent and delivers messages both ways', async () => {
    const customer = await signIn(app, '0613000110');
    const job = await postJob(customer.accessToken);
    await releaseToAllPlans(job.id);
    const pro = await createPro(app, { phone: '0613000111', planSlug: 'artisan' });

    await app.inject({
      method: 'POST',
      url: `/v1/jobs/${job.id}/quotes`,
      headers: auth(pro.accessToken),
      payload: QUOTE,
    });

    const threads = await app.inject({
      method: 'GET',
      url: '/v1/conversations',
      headers: auth(customer.accessToken),
    });
    const conversationId = threads.json().items[0].id as string;
    expect(conversationId).toBeTruthy();

    const sent = await app.inject({
      method: 'POST',
      url: `/v1/conversations/${conversationId}/messages`,
      headers: auth(customer.accessToken),
      payload: { body: 'Bonjour, la peinture est-elle comprise dans le prix ?' },
    });
    expect(sent.statusCode).toBe(201);

    const proView = await app.inject({
      method: 'GET',
      url: `/v1/conversations/${conversationId}/messages`,
      headers: auth(pro.accessToken),
    });
    expect(proView.json().items[0].body).toBe('Bonjour, la peinture est-elle comprise dans le prix ?');

    // Someone with no part in the job cannot read it.
    const stranger = await signIn(app, '0613000112');
    const denied = await app.inject({
      method: 'GET',
      url: `/v1/conversations/${conversationId}/messages`,
      headers: auth(stranger.accessToken),
    });
    expect(denied.statusCode).toBe(403);
  });
});

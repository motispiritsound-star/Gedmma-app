import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ANONYMISED,
  CLIENT_AGREEMENTS,
  CURRENT_AGREEMENTS,
  MINIMUM_AGE,
  retentionCutoff,
} from '@buurklus/shared';
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

/** Requests a code and returns it, without verifying. */
async function requestCode(phone: string) {
  await prisma.otpChallenge.deleteMany({
    where: { phone: `+31${phone.replace(/^0/, '')}` },
  });
  const response = await app.inject({
    method: 'POST',
    url: '/v1/auth/otp/request',
    payload: { phone },
  });
  return response.json().debugCode as string;
}

describe('agreeing to the terms', () => {
  it('will not create an account without a record of what was agreed', async () => {
    const code = await requestCode('0615000001');
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/verify',
      payload: { phone: '0615000001', code },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('agreements_required');
    expect(await prisma.user.count({ where: { phone: '+31615000001' } })).toBe(0);
  });

  it('records the version, the moment and the address', async () => {
    const session = await signIn(app, '0615000002');

    const records = await prisma.agreementRecord.findMany({ where: { userId: session.userId } });
    // Sorted here rather than in the query: Postgres orders an enum by the
    // order it was declared in, which is not the order this reads in.
    expect(records.map((row) => row.document).sort()).toEqual(['PRIVACY', 'TERMS']);
    expect(records.every((row) => row.ip !== null)).toBe(true);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    expect(user.termsVersion).toBe(CURRENT_AGREEMENTS.TERMS);
    expect(user.privacyVersion).toBe(CURRENT_AGREEMENTS.PRIVACY);
    expect(user.ageConfirmedAt).not.toBeNull();
  });

  it('does not write a row for every sign-in', async () => {
    const session = await signIn(app, '0615000003');
    await signIn(app, '0615000003');
    await signIn(app, '0615000003');

    // Three sign-ins, one agreement each for terms and privacy: a row per
    // sign-in would bury the moments that matter in duplicates.
    expect(await prisma.agreementRecord.count({ where: { userId: session.userId } })).toBe(2);
  });

  it('writes a new row when the wording changes', async () => {
    const session = await signIn(app, '0615000004');

    const code = await requestCode('0615000004');
    await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/verify',
      payload: {
        phone: '0615000004',
        code,
        agreements: { ...CLIENT_AGREEMENTS, terms: '2027-01-01' },
      },
    });

    const terms = await prisma.agreementRecord.findMany({
      where: { userId: session.userId, document: 'TERMS' },
      orderBy: { acceptedAt: 'asc' },
    });
    expect(terms.map((row) => row.version)).toEqual([CURRENT_AGREEMENTS.TERMS, '2027-01-01']);
    // The privacy statement did not change, so it did not gain a row.
    expect(await prisma.agreementRecord.count({
      where: { userId: session.userId, document: 'PRIVACY' },
    })).toBe(1);
  });

  it('refuses a sign-up that does not confirm the minimum age', async () => {
    const code = await requestCode('0615000005');
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/verify',
      payload: {
        phone: '0615000005',
        code,
        agreements: { ...CLIENT_AGREEMENTS, confirmedMinimumAge: false },
      },
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('the public policy endpoint', () => {
  it('states the versions, the age and every retention period', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/privacy/policy' });
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.agreements).toEqual(CURRENT_AGREEMENTS);
    expect(body.minimumAge).toBe(MINIMUM_AGE);
    // Every rule carries the reason it exists: a retention period without one
    // is the first thing a supervisory authority asks about.
    for (const rule of body.retention as Array<{ key: string; days: number; reason: string }>) {
      expect(rule.days, rule.key).toBeGreaterThan(0);
      expect(rule.reason.length, rule.key).toBeGreaterThan(20);
    }
  });

  it('answers in the language that was asked for', async () => {
    const english = await app.inject({
      method: 'GET',
      url: '/v1/privacy/policy',
      headers: { 'x-buurklus-locale': 'en' },
    });
    const rule = (english.json().retention as Array<{ key: string; reason: string }>).find(
      (row) => row.key === 'invoice',
    );
    expect(rule?.reason).toContain('seven years');
  });
});

describe('taking your data with you', () => {
  it('hands back the account, its jobs and its agreements', async () => {
    const session = await signIn(app, '0615000010');
    await app.inject({
      method: 'PATCH',
      url: '/v1/auth/me',
      headers: auth(session.accessToken),
      payload: { firstName: 'Sanne', lastName: 'de Vries' },
    });
    await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: auth(session.accessToken),
      payload: VALID_JOB,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/privacy/me/export',
      headers: auth(session.accessToken),
    });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['cache-control']).toBe('no-store');

    const body = response.json();
    expect(body.account.firstName).toBe('Sanne');
    expect(body.account.agreements).toHaveLength(2);
    expect(body.jobs).toHaveLength(1);
    expect(body.jobs[0].title).toBe(VALID_JOB.title);
  });

  it('never puts a session token in the file', async () => {
    const session = await signIn(app, '0615000011');
    const response = await app.inject({
      method: 'GET',
      url: '/v1/privacy/me/export',
      headers: auth(session.accessToken),
    });

    // An export is a file people email to themselves. A token hash in it would
    // turn the exercise of a right into a credential leak.
    const raw = response.body;
    expect(raw).not.toContain('tokenHash');
    expect(raw).not.toContain(session.refreshToken);
  });

  it('exports one account and not the one next to it', async () => {
    const mine = await signIn(app, '0615000012');
    const theirs = await signIn(app, '0615000013');
    await app.inject({
      method: 'PATCH',
      url: '/v1/auth/me',
      headers: auth(theirs.accessToken),
      payload: { firstName: 'Joost' },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/privacy/me/export',
      headers: auth(mine.accessToken),
    });
    expect(response.json().account.id).toBe(mine.userId);
    expect(response.body).not.toContain('Joost');
  });
});

describe('erasing an account', () => {
  it('empties everything identifying and leaves the account unusable', async () => {
    const session = await signIn(app, '0615000020');
    await app.inject({
      method: 'PATCH',
      url: '/v1/auth/me',
      headers: auth(session.accessToken),
      payload: { firstName: 'Sanne', lastName: 'de Vries', email: 'sanne@example.nl' },
    });
    const job = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: auth(session.accessToken),
      payload: { ...VALID_JOB, addressLine: 'Oudegracht 12', contactPhone: '0612345678' },
    });
    const jobId = job.json().job.id as string;

    const response = await app.inject({
      method: 'POST',
      url: '/v1/privacy/me/delete',
      headers: auth(session.accessToken),
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().reversible).toBe(false);

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    expect(user.anonymisedAt).not.toBeNull();
    expect(user.firstName).toBeNull();
    expect(user.lastName).toBeNull();
    expect(user.email).toBeNull();
    // The sign-in identifier is gone, so nobody can ever sign in as them again.
    expect(user.phone).not.toContain('615000020');

    const erasedJob = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(erasedJob.title).toBe(ANONYMISED);
    expect(erasedJob.description).toBe(ANONYMISED);
    expect(erasedJob.addressLine).toBeNull();
    expect(erasedJob.contactPhone).toBeNull();
    // The category and municipality stay: they identify nobody and they are
    // what the marketplace is measured by.
    expect(erasedJob.categoryId).toBe(job.json().job.categoryId ?? erasedJob.categoryId);
    expect(erasedJob.cityId).toBeTruthy();
  });

  it('signs every device out', async () => {
    const session = await signIn(app, '0615000021');
    await app.inject({
      method: 'POST',
      url: '/v1/privacy/me/delete',
      headers: auth(session.accessToken),
    });

    expect(await prisma.refreshToken.count({ where: { userId: session.userId } })).toBe(0);
    const refreshed = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: session.refreshToken },
    });
    expect(refreshed.statusCode).toBe(401);
  });

  it('strips a professional profile without dropping the invoice trail', async () => {
    const pro = await createPro(app, { phone: '0615000022' });
    const before = await prisma.proProfile.findUniqueOrThrow({ where: { id: pro.proId } });
    const subscriptions = await prisma.subscription.count({ where: { proId: pro.proId } });
    expect(subscriptions).toBe(1);

    await app.inject({
      method: 'POST',
      url: '/v1/privacy/me/delete',
      headers: auth(pro.accessToken),
    });

    const after = await prisma.proProfile.findUniqueOrThrow({ where: { id: pro.proId } });
    expect(after.displayName).toBe(ANONYMISED);
    expect(after.iban).toBeNull();
    expect(after.vatId).toBeNull();
    expect(after.kvk).not.toBe(before.kvk);

    // The subscription and its ledger survive: a cascading delete here would
    // take a seven-year fiscal record with it.
    expect(await prisma.subscription.count({ where: { proId: pro.proId } })).toBe(1);
    expect(
      await prisma.creditLedgerEntry.count({ where: { proId: pro.proId } }),
    ).toBeGreaterThan(0);
  });

  it('refuses to erase the same account twice', async () => {
    const session = await signIn(app, '0615000023');
    const first = await app.inject({
      method: 'POST',
      url: '/v1/privacy/me/delete',
      headers: auth(session.accessToken),
    });
    expect(first.statusCode).toBe(200);

    // The access token outlives the erasure until it expires, so a repeat is
    // reachable and must not run the whole thing again.
    const second = await app.inject({
      method: 'POST',
      url: '/v1/privacy/me/delete',
      headers: auth(session.accessToken),
    });
    expect(second.statusCode).toBe(409);
  });
});

describe('marketing consent', () => {
  it('is off until it is asked for, and can be withdrawn again', async () => {
    const session = await signIn(app, '0615000030');
    const initial = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    expect(initial.marketingOptInAt).toBeNull();

    const on = await app.inject({
      method: 'PUT',
      url: '/v1/privacy/me/marketing-consent',
      headers: auth(session.accessToken),
      payload: { optIn: true },
    });
    expect(on.json().optIn).toBe(true);

    const off = await app.inject({
      method: 'PUT',
      url: '/v1/privacy/me/marketing-consent',
      headers: auth(session.accessToken),
      payload: { optIn: false },
    });
    expect(off.json().optIn).toBe(false);

    // Withdrawing costs nothing else: the account still works.
    const me = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: auth(session.accessToken),
    });
    expect(me.statusCode).toBe(200);
  });
});

describe('the retention sweep', () => {
  it('clears sign-in codes older than a day', async () => {
    await prisma.otpChallenge.create({
      data: {
        phone: '+31615000040',
        codeHash: 'x'.repeat(64),
        expiresAt: new Date(Date.now() - 86_400_000),
        createdAt: new Date(Date.now() - 3 * 86_400_000),
      },
    });
    await requestCode('0615000041');

    const result = await app.services.privacy.sweep();
    expect(result.otpChallenges).toBe(1);
    // Today's code is untouched: someone is in the middle of signing in.
    expect(await prisma.otpChallenge.count({ where: { phone: '+31615000041' } })).toBe(1);
  });

  it('strips a job that finished two years ago', async () => {
    const session = await signIn(app, '0615000042');
    const posted = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: auth(session.accessToken),
      payload: { ...VALID_JOB, addressLine: 'Oudegracht 12' },
    });
    const jobId = posted.json().job.id as string;
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED', updatedAt: new Date(retentionCutoff('closedJob').getTime() - 1) },
    });

    const result = await app.services.privacy.sweep();
    expect(result.anonymisedJobs).toBe(1);

    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.addressLine).toBeNull();
    expect(job.title).toBe(ANONYMISED);

    // Running again finds nothing left to do rather than rewriting the row.
    expect((await app.services.privacy.sweep()).anonymisedJobs).toBe(0);
  });

  it('leaves an open job alone however old it is', async () => {
    const session = await signIn(app, '0615000043');
    const posted = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      headers: auth(session.accessToken),
      payload: VALID_JOB,
    });
    const jobId = posted.json().job.id as string;
    await prisma.job.update({
      where: { id: jobId },
      data: { updatedAt: new Date('2020-01-01') },
    });

    await app.services.privacy.sweep();
    const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
    expect(job.title).toBe(VALID_JOB.title);
  });

  it('warns a dormant account before erasing it, and not the other way round', async () => {
    const session = await signIn(app, '0615000044');
    const longAgo = new Date(retentionCutoff('inactiveAccount').getTime() - 86_400_000);
    await prisma.user.update({ where: { id: session.userId }, data: { lastSeenAt: longAgo } });

    const first = await app.services.privacy.sweep();
    expect(first.inactiveWarned).toBe(1);
    expect(first.inactiveErased).toBe(0);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: session.userId } })).anonymisedAt,
    ).toBeNull();

    // A sweep the next night must not erase them: the notice period has not run.
    expect((await app.services.privacy.sweep()).inactiveErased).toBe(0);

    // Once it has, they go.
    await prisma.notification.updateMany({
      where: { userId: session.userId, type: 'ACCOUNT_INACTIVE' },
      data: { createdAt: new Date(Date.now() - 31 * 86_400_000) },
    });
    const later = await app.services.privacy.sweep();
    expect(later.inactiveErased).toBe(1);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: session.userId } })).anonymisedAt,
    ).not.toBeNull();
  });

  it('does not purge the warning it depends on', async () => {
    const session = await signIn(app, '0615000045');
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'ACCOUNT_INACTIVE',
        title: 'x',
        body: 'y',
        createdAt: new Date(retentionCutoff('notification').getTime() - 86_400_000),
      },
    });
    await prisma.notification.create({
      data: {
        userId: session.userId,
        type: 'NEW_MESSAGE',
        title: 'x',
        body: 'y',
        createdAt: new Date(retentionCutoff('notification').getTime() - 86_400_000),
      },
    });

    const result = await app.services.privacy.sweep();
    expect(result.notifications).toBe(1);
    // Purging this would restart the notice period every quarter, and nobody
    // dormant would ever actually be erased.
    expect(
      await prisma.notification.count({
        where: { userId: session.userId, type: 'ACCOUNT_INACTIVE' },
      }),
    ).toBe(1);
  });
});

describe('the export download link', () => {
  it('lets the phone hand the file to the operating system', async () => {
    const session = await signIn(app, '0615000050');
    const link = await app.inject({
      method: 'POST',
      url: '/v1/privacy/me/export-link',
      headers: auth(session.accessToken),
    });
    expect(link.statusCode).toBe(200);

    const url = new URL(link.json().url as string);
    const download = await app.inject({
      method: 'GET',
      url: `${url.pathname}${url.search}`,
    });
    expect(download.statusCode).toBe(200);
    expect(download.json().account.id).toBe(session.userId);
  });

  it('refuses an access token at the download, and the link everywhere else', async () => {
    const session = await signIn(app, '0615000051');
    const link = await app.inject({
      method: 'POST',
      url: '/v1/privacy/me/export-link',
      headers: auth(session.accessToken),
    });
    const token = new URL(link.json().url as string).searchParams.get('t')!;

    // A normal session token must not double as a download link: it would
    // make every bearer token worth a full dossier in one GET.
    const wrongWay = await app.inject({
      method: 'GET',
      url: `/v1/privacy/export?t=${encodeURIComponent(session.accessToken)}`,
    });
    expect(wrongWay.statusCode).toBe(401);

    // And the download token must not open the rest of the API: it travels in
    // a URL, through browser history and proxy logs.
    const asSession = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: auth(token),
    });
    expect(asSession.statusCode).toBe(401);
  });

  it('turns down a token it did not sign', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/v1/privacy/export?t=${'a'.repeat(40)}`,
    });
    expect(response.statusCode).toBe(401);
  });
});

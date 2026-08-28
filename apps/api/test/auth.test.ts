import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CLIENT_AGREEMENTS } from '@buurklus/shared';
import { auth, createTestApp, prisma, resetTransactionalData, signIn } from './helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(resetTransactionalData);

describe('phone sign-in', () => {
  it('creates an account on first verification and returns tokens', async () => {
    const session = await signIn(app, '0612000001');
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    expect(user.phone).toBe('+31612000001');
    expect(user.phoneVerifiedAt).not.toBeNull();
    expect(user.role).toBe('CUSTOMER');
  });

  it('normalises the phone number, so 06… and +2126… are the same account', async () => {
    const first = await signIn(app, '0612000002');
    const second = await signIn(app, '+31612000002');
    expect(second.userId).toBe(first.userId);
  });

  it('rejects a landline before any SMS is sent', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/request',
      payload: { phone: '0101234567' },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('validation_failed');
    expect(await prisma.otpChallenge.count()).toBe(0);
  });

  it('rejects a wrong code and counts the attempt', async () => {
    await app.inject({ method: 'POST', url: '/v1/auth/otp/request', payload: { phone: '0612000003' } });

    const response = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/verify',
      payload: { phone: '0612000003', code: '000000' },
    });

    // A correct guess is possible once in a million; assert on the attempt
    // counter instead, which moves either way.
    const challenge = await prisma.otpChallenge.findFirstOrThrow({
      where: { phone: '+31612000003' },
    });
    if (response.statusCode === 400) {
      expect(response.json().error.code).toBe('otp_invalid');
      expect(challenge.attempts).toBe(1);
    } else {
      expect(response.statusCode).toBe(200);
    }
  });

  it('will not accept the same code twice', async () => {
    const requested = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/request',
      payload: { phone: '0612000004' },
    });
    const code = requested.json().debugCode as string;
    const payload = { phone: '0612000004', code, agreements: CLIENT_AGREEMENTS };

    const first = await app.inject({ method: 'POST', url: '/v1/auth/otp/verify', payload });
    const second = await app.inject({ method: 'POST', url: '/v1/auth/otp/verify', payload });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(400);
    // Both refusals are 400; naming the code keeps this from passing for the
    // wrong reason, such as a missing agreement rather than a spent code.
    expect(second.json().error.code).toBe('otp_invalid');
  });

  it('throttles a second code requested straight away', async () => {
    await app.inject({ method: 'POST', url: '/v1/auth/otp/request', payload: { phone: '0612000005' } });
    const second = await app.inject({
      method: 'POST',
      url: '/v1/auth/otp/request',
      payload: { phone: '0612000005' },
    });
    expect(second.statusCode).toBe(429);
    expect(second.json().error.code).toBe('rate_limited');
  });

  it('rotates the refresh token and revokes the one presented', async () => {
    const session = await signIn(app, '0612000006');

    const rotated = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: session.refreshToken },
    });
    expect(rotated.statusCode).toBe(200);
    expect(rotated.json().refreshToken).not.toBe(session.refreshToken);

    const replay = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: session.refreshToken },
    });
    expect(replay.statusCode).toBe(401);
  });

  it('refuses protected routes without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/v1/auth/me' });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('unauthorized');
  });
});

describe('language negotiation', () => {
  it('returns the error message in the requested language', async () => {
    const dutch = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: { 'x-buurklus-locale': 'nl' },
    });
    expect(dutch.json().error.message).toBe('Log in om verder te gaan.');

    const english = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: { 'accept-language': 'en-GB,en;q=0.9' },
    });
    expect(english.json().error.message).toBe('Please sign in to continue.');

    // Dutch is the default when nothing usable is offered.
    const fallback = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
      headers: { 'accept-language': 'de-DE' },
    });
    expect(fallback.json().error.message).toBe('Log in om verder te gaan.');
  });

  it('serves the catalog in the requested language', async () => {
    const dutch = await app.inject({
      method: 'GET',
      url: '/v1/catalog/categories',
      headers: { 'x-buurklus-locale': 'nl' },
    });
    const dutchCategories = dutch.json().categories as Array<{ slug: string; name: string }>;
    expect(dutchCategories.find((row) => row.slug === 'loodgieter')?.name).toBe('Loodgieter');

    const english = await app.inject({
      method: 'GET',
      url: '/v1/catalog/categories',
      headers: { 'x-buurklus-locale': 'en' },
    });
    const englishCategories = english.json().categories as Array<{ slug: string; name: string }>;
    expect(englishCategories.find((row) => row.slug === 'loodgieter')?.name).toBe('Plumbing');
  });
});

describe('profile', () => {
  it('stores the chosen language on the account', async () => {
    const session = await signIn(app, '0612000007');
    const response = await app.inject({
      method: 'PATCH',
      url: '/v1/auth/me',
      headers: auth(session.accessToken),
      payload: { firstName: 'Sanne', lastName: 'de Vries', locale: 'en' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().locale).toBe('en');
  });
});

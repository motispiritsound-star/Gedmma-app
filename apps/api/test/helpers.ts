import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';
import { loadEnv } from '../src/env.js';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://buurklus:buurklus@localhost:5432/buurklus_test?schema=public';

export const testEnv = () => {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  return loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    JWT_ACCESS_SECRET: 'test-access-secret-that-is-long-enough-000000',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-long-enough-00000',
    SMS_PROVIDER: 'log',
    PAYMENT_PROVIDER: 'mock',
    CORS_ORIGINS: '*',
  });
};

export const prisma = new PrismaClient({ datasources: { db: { url: TEST_DATABASE_URL } } });

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp(testEnv());
  await app.ready();
  return app;
}

/**
 * Clears everything a test creates, leaving the seeded catalog in place.
 * Ordered so foreign keys are satisfied without disabling constraints.
 */
export async function resetTransactionalData() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      credit_ledger_entries, payments, subscriptions,
      messages, conversations, reviews, quotes, jobs,
      pro_coverage, pro_trades, pro_profiles,
      notifications, device_tokens, refresh_tokens, otp_challenges, users
    RESTART IDENTITY CASCADE
  `);
}

interface SignInResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

/**
 * Runs the real OTP flow, reading the code back out of the debug field.
 * Prior challenges for the number are cleared first: the sixty-second resend
 * cooldown is real behaviour with its own test, and would otherwise block any
 * test that signs the same phone in twice.
 */
export async function signIn(
  app: FastifyInstance,
  phone: string,
  role: 'CUSTOMER' | 'PRO' = 'CUSTOMER',
): Promise<SignInResult> {
  await prisma.otpChallenge.deleteMany({
    where: { phone: phone.startsWith('+') ? phone : `+31${phone.replace(/^0/, '')}` },
  });

  const requested = await app.inject({
    method: 'POST',
    url: '/v1/auth/otp/request',
    payload: { phone },
  });
  if (requested.statusCode !== 200) {
    throw new Error(`OTP request failed: ${requested.statusCode} ${requested.body}`);
  }
  const code = requested.json().debugCode as string;

  const verified = await app.inject({
    method: 'POST',
    url: '/v1/auth/otp/verify',
    payload: { phone, code, role },
  });
  if (verified.statusCode !== 200) {
    throw new Error(`OTP verify failed: ${verified.statusCode} ${verified.body}`);
  }
  const body = verified.json();
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    userId: body.user.id,
  };
}

export const auth = (token: string) => ({ authorization: `Bearer ${token}` });

/**
 * A KvK number identifies exactly one business, and the column is unique, so
 * each test professional needs its own. Derived from the phone number to stay
 * stable across runs.
 */
export function testKvk(phone: string): string {
  return phone.replace(/\D/g, '').slice(-8).padStart(8, '9');
}

/** Creates a complete professional: profile, trades, coverage and a paid plan. */
export async function createPro(
  app: FastifyInstance,
  options: {
    phone: string;
    displayName?: string;
    categorySlugs?: string[];
    citySlugs?: string[];
    planSlug?: string;
  },
) {
  const session = await signIn(app, options.phone, 'PRO');

  const profileResponse = await app.inject({
    method: 'PUT',
    url: '/v1/pros/me',
    headers: auth(session.accessToken),
    payload: {
      displayName: options.displayName ?? 'Testbedrijf',
      legalForm: 'BV',
      bio: 'Testbedrijf met een compleet team en ruime ervaring in binnen- en buitenwerk.',
      yearsExperience: 10,
      teamSize: 4,
      baseCitySlug: options.citySlugs?.[0] ?? 'utrecht',
      serviceRadiusKm: 50,
      categorySlugs: options.categorySlugs ?? ['binnenschilderwerk'],
      citySlugs: options.citySlugs ?? ['utrecht'],
      kvk: testKvk(options.phone),
    },
  });
  if (profileResponse.statusCode !== 200) {
    throw new Error(`Pro profile failed: ${profileResponse.statusCode} ${profileResponse.body}`);
  }

  // The token issued before the profile existed carries no proId; sign in
  // again so subsequent calls take the fast path.
  const refreshed = await signIn(app, options.phone, 'PRO');

  if (options.planSlug) {
    const subscribed = await app.inject({
      method: 'POST',
      url: '/v1/subscriptions',
      headers: auth(refreshed.accessToken),
      payload: { planSlug: options.planSlug, period: 'MONTHLY', paymentMethod: 'IDEAL' },
    });
    if (subscribed.statusCode !== 200) {
      throw new Error(`Subscribe failed: ${subscribed.statusCode} ${subscribed.body}`);
    }
  }

  const proId = (await prisma.proProfile.findUniqueOrThrow({ where: { userId: refreshed.userId } })).id;
  return { ...refreshed, proId };
}

export const VALID_JOB = {
  categorySlug: 'binnenschilderwerk',
  title: 'Woonkamer van 25 m² schilderen',
  description:
    'Woonkamer van 25 m² opnieuw schilderen in gebroken wit, muren en plafond. Rond de kozijnen moet wat gestuct worden. Graag doordeweeks, het liefst in de ochtend.',
  citySlug: 'utrecht',
  urgency: 'WITHIN_WEEK' as const,
  budgetMinEur: 800,
  budgetMaxEur: 1600,
};

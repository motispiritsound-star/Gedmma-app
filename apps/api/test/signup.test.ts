import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { retentionCutoff } from '@buurklus/shared';
import { createTestApp, prisma, resetTransactionalData } from './helpers.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await createTestApp();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await resetTransactionalData();
  await prisma.signup.deleteMany();
});

const post = (payload: unknown) =>
  app.inject({ method: 'POST', url: '/v1/signups', payload });

const CUSTOMER = {
  role: 'CUSTOMER' as const,
  email: 'sanne@example.nl',
  citySlug: 'utrecht',
  consent: true,
};

const PRO = {
  role: 'PRO' as const,
  email: 'joost@example.nl',
  name: 'Schildersbedrijf Bakker',
  citySlug: 'utrecht',
  categorySlugs: ['binnenschilderwerk'],
  kvk: '30123456',
  consent: true,
};

describe('registering interest', () => {
  it('records a customer with the consent that came with the address', async () => {
    const response = await post(CUSTOMER);
    expect(response.statusCode).toBe(201);

    const row = await prisma.signup.findFirstOrThrow({ where: { email: CUSTOMER.email } });
    expect(row.role).toBe('CUSTOMER');
    expect(row.consentAt).not.toBeNull();
    // An email address collected to be emailed later rests on consent, and
    // consent you cannot evidence is consent you do not have.
    expect(row.ip).not.toBeNull();
    expect(row.cityId).not.toBeNull();
  });

  it('records a professional with their trades and KvK number', async () => {
    expect((await post(PRO)).statusCode).toBe(201);

    const row = await prisma.signup.findFirstOrThrow({ where: { email: PRO.email } });
    expect(row.role).toBe('PRO');
    expect(row.kvk).toBe('30123456');
    expect(row.categorySlugs).toEqual(['binnenschilderwerk']);
    expect(row.name).toBe('Schildersbedrijf Bakker');
  });

  it('will not take a professional without a KvK number', async () => {
    const response = await post({ ...PRO, kvk: '' });
    expect(response.statusCode).toBe(400);
    expect(await prisma.signup.count()).toBe(0);
  });

  it('will not take anyone who has not ticked the box', async () => {
    // A pre-ticked box or an implied agreement is not consent, so the API
    // refuses the request rather than inferring one.
    expect((await post({ ...CUSTOMER, consent: false })).statusCode).toBe(400);
    const { consent, ...withoutConsent } = CUSTOMER;
    void consent;
    expect((await post(withoutConsent)).statusCode).toBe(400);
    expect(await prisma.signup.count()).toBe(0);
  });

  it('rejects an address that is not one', async () => {
    expect((await post({ ...CUSTOMER, email: 'sanne@' })).statusCode).toBe(400);
  });

  it('refuses a municipality or a trade that does not exist', async () => {
    expect((await post({ ...CUSTOMER, citySlug: 'atlantis' })).statusCode).toBe(404);
    expect((await post({ ...PRO, categorySlugs: ['tijdreizen'] })).statusCode).toBe(404);
  });

  it('lets the same person sign up as both sides of the marketplace', async () => {
    // A painter hires a plumber like anyone else.
    expect((await post({ ...CUSTOMER, email: 'both@example.nl' })).statusCode).toBe(201);
    expect((await post({ ...PRO, email: 'both@example.nl' })).statusCode).toBe(201);
    expect(await prisma.signup.count({ where: { email: 'both@example.nl' } })).toBe(2);
  });

  it('treats a repeat submission as the same person, not a second one', async () => {
    await post(CUSTOMER);
    const again = await post({ ...CUSTOMER, name: 'Sanne de Vries' });

    expect(again.statusCode).toBe(201);
    expect(again.json().alreadyRegistered).toBe(true);
    expect(await prisma.signup.count()).toBe(1);
    // Someone who fills the form in twice because they were not sure it went
    // through gets their details updated, not an error.
    expect((await prisma.signup.findFirstOrThrow()).name).toBe('Sanne de Vries');
  });

  it('normalises the address so two spellings are one entry', async () => {
    await post({ ...CUSTOMER, email: '  Sanne@Example.NL ' });
    const rows = await prisma.signup.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.email).toBe('sanne@example.nl');
  });

  it('normalises a phone number when one is given, and works without one', async () => {
    await post({ ...CUSTOMER, phone: '06 12345678' });
    expect((await prisma.signup.findFirstOrThrow()).phone).toBe('+31612345678');

    await post({ ...CUSTOMER, email: 'nophone@example.nl', phone: '' });
    const without = await prisma.signup.findFirstOrThrow({
      where: { email: 'nophone@example.nl' },
    });
    expect(without.phone).toBeNull();
  });

  it('swallows a bot without telling it why', async () => {
    // The honeypot field is invisible to a person and irresistible to a form
    // filler. Answering "rejected" would teach it which field to leave alone.
    const response = await post({ ...CUSTOMER, website: 'https://example.com/seo' });
    expect(response.statusCode).toBe(201);
    expect(await prisma.signup.count()).toBe(0);
  });
});

describe('the waiting list itself', () => {
  it('counts both sides without naming anybody', async () => {
    await post(CUSTOMER);
    await post({ ...CUSTOMER, email: 'two@example.nl' });
    await post(PRO);

    const response = await app.inject({ method: 'GET', url: '/v1/signups/counts' });
    expect(response.json()).toEqual({ customers: 2, pros: 1 });
    expect(response.body).not.toContain('example.nl');
  });

  it('takes someone off the list, and says the same for an address that was never on it', async () => {
    await post(CUSTOMER);

    const known = await app.inject({
      method: 'POST',
      url: '/v1/signups/unsubscribe',
      payload: { email: CUSTOMER.email },
    });
    const unknown = await app.inject({
      method: 'POST',
      url: '/v1/signups/unsubscribe',
      payload: { email: 'never@example.nl' },
    });

    // Identical answers: a different one would turn this into a way to test
    // whether an address is on the list.
    expect(known.statusCode).toBe(unknown.statusCode);
    expect(known.body).toBe(unknown.body);
    expect((await prisma.signup.findFirstOrThrow()).unsubscribedAt).not.toBeNull();
  });

  it('lets someone who unsubscribed sign up again', async () => {
    await post(CUSTOMER);
    await app.inject({
      method: 'POST',
      url: '/v1/signups/unsubscribe',
      payload: { email: CUSTOMER.email },
    });
    await post(CUSTOMER);

    expect((await prisma.signup.findFirstOrThrow()).unsubscribedAt).toBeNull();
  });
});

describe('sweeping the waiting list', () => {
  it('deletes an unsubscribe once it has been honoured for a month', async () => {
    await post(CUSTOMER);
    await prisma.signup.updateMany({
      data: { unsubscribedAt: new Date(Date.now() - 31 * 86_400_000) },
    });

    expect((await app.services.privacy.sweep()).signups).toBe(1);
    expect(await prisma.signup.count()).toBe(0);
  });

  it('keeps a recent unsubscribe, so the request stays auditable', async () => {
    await post(CUSTOMER);
    await prisma.signup.updateMany({ data: { unsubscribedAt: new Date() } });

    expect((await app.services.privacy.sweep()).signups).toBe(0);
    expect(await prisma.signup.count()).toBe(1);
  });

  it('starts the two-year clock when someone was invited, not when they signed up', async () => {
    await post(CUSTOMER);
    // Signed up long ago but never told anything: the clock has not started,
    // which is the whole point of measuring from the invitation.
    await prisma.signup.updateMany({ data: { createdAt: new Date('2020-01-01') } });
    expect((await app.services.privacy.sweep()).signups).toBe(0);

    await prisma.signup.updateMany({
      data: { invitedAt: new Date(retentionCutoff('signup').getTime() - 86_400_000) },
    });
    expect((await app.services.privacy.sweep()).signups).toBe(1);
  });
});

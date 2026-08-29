import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { Client, buildTestApp, seedDemo } from './helpers.js';

let app: FastifyInstance;
let prisma: PrismaClient;
let demo: Awaited<ReturnType<typeof seedDemo>>;

beforeAll(async () => {
  const built = await buildTestApp();
  app = built.app;
  prisma = built.prisma;
  demo = await seedDemo(prisma);
});

afterAll(async () => {
  await app.close();
});

describe('sign-in and sessions', () => {
  it('signs a guardian in and reports what they may do', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    expect(client.hasSession).toBe(true);

    const me = await client.get('/auth/me');
    expect(me.statusCode).toBe(200);
    const body = me.json();
    expect(body.membership.role).toBe('guardian');
    expect(body.permissions.allowed).toContain('agreement.activate');
    expect(body.permissions.neverOffered).toContain('message.read');
  });

  it('gives the same answer for a wrong password and an unknown address', async () => {
    const client = new Client(app);
    const wrongPassword = await client.post('/auth/sign-in', {
      email: 'noor@focusfamily.test',
      password: 'not-the-password',
    });
    const unknown = await client.post('/auth/sign-in', {
      email: 'nobody@focusfamily.test',
      password: 'not-the-password',
    });
    expect(wrongPassword.statusCode).toBe(403);
    expect(unknown.statusCode).toBe(403);
    expect(wrongPassword.json().messageKey).toBe(unknown.json().messageKey);
  });

  it('refuses a write without a matching CSRF token', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const withoutToken = await client.post('/checkins', { mood: 4, conflict: 'none' }, { csrf: null });
    expect(withoutToken.statusCode).toBe(403);
    expect(withoutToken.json().error).toBe('csrf_failed');

    const wrongToken = await client.post('/checkins', { mood: 4, conflict: 'none' }, { csrf: 'nope' });
    expect(wrongToken.statusCode).toBe(403);
  });

  it('refuses a write from an origin that is not allowed', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.post(
      '/checkins',
      { mood: 4, conflict: 'none' },
      { origin: 'https://evil.example' },
    );
    expect(response.statusCode).toBe(403);
    expect(response.json().error).toBe('origin_not_allowed');
  });

  it('signs out and stops accepting the old cookie', async () => {
    const client = new Client(app);
    await client.signIn('lena@focusfamily.test');
    expect((await client.get('/auth/me')).statusCode).toBe(200);
    expect((await client.post('/auth/sign-out')).statusCode).toBe(204);
    expect((await client.get('/auth/me')).statusCode).toBe(403);
  });

  it('rejects a short password on registration', async () => {
    const client = new Client(app);
    const response = await client.post('/auth/register', {
      email: 'new@focusfamily.test',
      password: 'short',
      displayName: 'New',
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().details.issues).toContain('password.too_short');
  });
});

describe('consent', () => {
  it('shows a family member their own consent history with the exact wording', async () => {
    const client = new Client(app);
    await client.signIn('lena@focusfamily.test');
    const response = await client.get('/consent');
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.ageBand).toBe('14-17');
    expect(body.history.length).toBeGreaterThan(0);
    expect(body.history[0].statementKey).toMatch(/^consent\.statement\./);
  });

  it('will not let a guardian switch on a measurement a teenager has not agreed to', async () => {
    const guardian = new Client(app);
    await guardian.signIn('noor@focusfamily.test');

    const family = await guardian.get('/family');
    const osSource = family
      .json()
      .measurements.find(
        (source: { userId: string | null; label: { kind: string } }) =>
          source.userId === demo.users.lena && source.label.kind === 'os_verified',
      );
    expect(osSource).toBeTruthy();

    const attempt = await guardian.patch('/measurements', {
      sourceId: osSource.id,
      enabled: true,
    });
    expect(attempt.statusCode).toBe(451);
    expect(attempt.json().messageKey).toBe('consent.missing_child_assent');
  });

  it('lets the teenager give her own assent, after which it may be switched on', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const assent = await lena.post('/consent', {
      subjectUserId: demo.users.lena,
      scope: 'measurement.os_verified',
      decision: 'granted',
    });
    expect(assent.statusCode).toBe(201);

    const guardian = new Client(app);
    await guardian.signIn('noor@focusfamily.test');
    const family = await guardian.get('/family');
    const osSource = family
      .json()
      .measurements.find(
        (source: { userId: string | null; label: { kind: string } }) =>
          source.userId === demo.users.lena && source.label.kind === 'os_verified',
      );
    const enabled = await guardian.patch('/measurements', {
      sourceId: osSource.id,
      enabled: true,
    });
    expect(enabled.statusCode).toBe(200);
    expect(enabled.json().enabled).toBe(true);
  });

  it('switches the measurement off again the moment she withdraws', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const withdrawal = await lena.post('/consent', {
      subjectUserId: demo.users.lena,
      scope: 'measurement.os_verified',
      decision: 'withdrawn',
    });
    expect(withdrawal.statusCode).toBe(201);

    const source = await prisma.measurementSource.findFirst({
      where: { familyId: demo.familyId, userId: demo.users.lena, kind: 'os_verified' },
    });
    expect(source?.enabled).toBe(false);
    expect(source?.disabledAt).not.toBeNull();
  });

  it('does not let a child consent on behalf of a sibling', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.post('/consent', {
      subjectUserId: demo.users.tijn,
      scope: 'measurement.os_verified',
      decision: 'granted',
    });
    expect(response.statusCode).toBe(403);
  });

  it('keeps the withdrawal in the history rather than deleting it', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const history = (await lena.get('/consent')).json().history as Array<{
      scope: string;
      decision: string;
    }>;
    const osEntries = history.filter((entry) => entry.scope === 'measurement.os_verified');
    expect(osEntries.map((entry) => entry.decision)).toContain('withdrawn');
    expect(osEntries.map((entry) => entry.decision)).toContain('granted');
  });
});

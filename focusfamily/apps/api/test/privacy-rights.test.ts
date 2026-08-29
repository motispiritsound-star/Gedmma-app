import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { FORBIDDEN_CAPABILITIES, NOT_COLLECTED } from '@focusfamily/domain';
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

describe('there is no way to reach message or browsing content', () => {
  it('publishes the list of capabilities it refuses to offer', async () => {
    const client = new Client(app);
    const response = await client.get('/capabilities');
    expect(response.statusCode).toBe(200);
    expect(response.json().neverOffered).toEqual([...FORBIDDEN_CAPABILITIES]);
  });

  it('has no route whose path suggests reading private content', () => {
    const routes = app.printRoutes({ commonPrefix: false });
    expect(routes).not.toMatch(
      /message|sms|chat|browsing|history|keylog|screenshot|location|contacts|photos/i,
    );
  });

  it('returns 404 for the endpoints a monitoring app would have', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    for (const path of [
      `/messages/${demo.users.lena}`,
      `/browsing/${demo.users.lena}`,
      `/location/${demo.users.lena}`,
      `/devices/${demo.users.lena}/screenshots`,
      `/keystrokes/${demo.users.lena}`,
    ]) {
      const response = await client.get(path);
      expect(response.statusCode, path).toBe(404);
    }
  });

  it('does not let a guardian read a child private check-in note', async () => {
    const guardian = new Client(app);
    await guardian.signIn('noor@focusfamily.test');
    const direct = await guardian.get(`/checkins/${demo.users.lena}`);
    expect(direct.statusCode).toBe(403);
    expect(direct.json().messageKey).toBe('checkin.private_to_the_author');

    const aggregate = await guardian.get('/checkins/family');
    expect(aggregate.statusCode).toBe(200);
    const shared = aggregate.json().shared as Array<{ note: string | null }>;
    // Only notes the author actively shared come back.
    expect(shared.some((entry) => entry.note?.includes('Groepsapp'))).toBe(false);
    expect(JSON.stringify(aggregate.json())).not.toContain('Groepsapp');
  });

  it('never stores a per-app breakdown, only coarse categories', async () => {
    const rows = await prisma.usageSummary.findMany({ where: { familyId: demo.familyId } });
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      for (const key of Object.keys(row.minutesByCategory as Record<string, number>)) {
        expect([
          'social',
          'video',
          'games',
          'creation',
          'school',
          'communication',
          'other',
        ]).toContain(key);
      }
    }
  });
});

describe('data source labels', () => {
  it('labels every measurement source with a provenance and a confidence', async () => {
    const client = new Client(app);
    await client.signIn('lena@focusfamily.test');
    const response = await client.get('/measurements/explained');
    expect(response.statusCode).toBe(200);
    for (const source of response.json().sources as Array<{
      label: { kind: string; confidence: string; labelKey: string; explanationKey: string };
    }>) {
      expect(['self_reported', 'app_observed', 'os_verified', 'simulated']).toContain(
        source.label.kind,
      );
      expect(source.label.labelKey).toMatch(/^source\./);
      expect(source.label.explanationKey).toMatch(/^source\./);
    }
  });

  it('caps simulated data at low confidence in the seeded demo', async () => {
    const simulated = await prisma.usageSummary.findMany({
      where: { familyId: demo.familyId, source: 'simulated' },
    });
    expect(simulated.length).toBeGreaterThan(0);
    expect(simulated.every((row) => row.confidence === 'low')).toBe(true);
  });

  it('holds no OS-verified rows in the demo, because no phone reported anything', async () => {
    const osVerified = await prisma.usageSummary.count({
      where: { familyId: demo.familyId, source: 'os_verified' },
    });
    expect(osVerified).toBe(0);

    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const review = await client.get('/review/week');
    expect(review.json().review.dataNote.noteKey).toBe('review.data_note.no_os_data');
  });
});

describe('export and deletion', () => {
  it('exports everything a person holds, and says what was never collected', async () => {
    const client = new Client(app);
    await client.signIn('lena@focusfamily.test');
    const response = await client.post('/account/export', { scope: 'self' });
    expect(response.statusCode).toBe(201);
    const bundle = response.json().bundle;
    expect(bundle.subject.userId).toBe(demo.users.lena);
    expect(bundle.notCollected).toEqual([...NOT_COLLECTED]);
    expect(Object.keys(bundle.sections)).toContain('consentRecords');
    expect(Object.keys(bundle.sections)).toContain('focusSessions');
    expect(bundle.sections.checkIns.length).toBeGreaterThan(0);
  });

  it('does not let a child export the whole family', async () => {
    const client = new Client(app);
    await client.signIn('lena@focusfamily.test');
    const response = await client.post('/account/export', { scope: 'family' });
    expect(response.statusCode).toBe(403);
  });

  it('lets a guardian export the family bundle', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.post('/account/export', { scope: 'family' });
    expect(response.statusCode).toBe(201);
    expect(response.json().bundle.scope).toBe('family');
    expect(response.json().bundle.sections.memberships.length).toBe(4);
  });

  it('schedules deletion with a grace period you can cancel', async () => {
    const client = new Client(app);
    await client.signIn('sam@focusfamily.test');
    const created = await client.post('/account/deletion', { scope: 'self' });
    expect(created.statusCode).toBe(201);
    expect(created.json().graceDays).toBe(7);

    const tooSoon = await client.post(
      `/account/deletion/${created.json().request.id}/execute`,
    );
    expect(tooSoon.statusCode).toBe(409);
    expect(tooSoon.json().messageKey).toBe('deletion.still_in_grace_period');

    const cancelled = await client.delete(`/account/deletion/${created.json().request.id}`);
    expect(cancelled.statusCode).toBe(200);
    expect(cancelled.json().request.status).toBe('cancelled');
  });

  it('really deletes once the grace period has passed', async () => {
    const client = new Client(app);
    await client.post('/auth/register', {
      email: 'leaving@focusfamily.test',
      password: 'a-long-enough-password',
      displayName: 'Leaving',
    });
    await client.post('/families', { name: 'Familie Vertrek', displayName: 'Leaving' });
    const created = await client.post('/account/deletion', { scope: 'family' });
    const requestId = created.json().request.id;
    await prisma.deletionRequest.update({
      where: { id: requestId },
      data: { executeAfter: new Date(Date.now() - 1000) },
    });

    const executed = await client.post(`/account/deletion/${requestId}/execute`);
    expect(executed.statusCode).toBe(200);
    const remaining = await prisma.family.findFirst({ where: { name: 'Familie Vertrek' } });
    expect(remaining).toBeNull();
  });

  it('writes an audit entry for every consent and export action', async () => {
    const actions = await prisma.auditLog.findMany({
      where: { familyId: demo.familyId },
      select: { action: true },
    });
    const names = actions.map((row) => row.action);
    expect(names).toContain('export.requested');
    expect(names).toContain('consent.granted');
  });
});

describe('admin restrictions', () => {
  it('gives support staff aggregate counts only', async () => {
    const client = new Client(app);
    await client.signIn('support@focusfamily.test');
    const response = await client.get('/admin/metrics');
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.families).toBeGreaterThan(0);
    expect(JSON.stringify(body)).not.toContain('Familie De Vries');
    expect(JSON.stringify(body)).not.toContain(demo.users.lena);
  });

  it('does not let support staff open family content', async () => {
    const client = new Client(app);
    await client.signIn('support@focusfamily.test');
    for (const path of ['/family', '/agreements', '/checkins/family', '/review/week']) {
      const response = await client.get(path);
      expect([403, 404], path).toContain(response.statusCode);
    }
  });

  it('does not let a guardian open the back office', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.get('/admin/metrics');
    expect(response.statusCode).toBe(403);
    expect(response.json().messageKey).toBe('authz.admin_only');
  });
});

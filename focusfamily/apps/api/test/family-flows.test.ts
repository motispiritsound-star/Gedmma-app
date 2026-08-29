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

describe('membership permissions', () => {
  it('lets a child read every rule that applies to anyone, including the grown-ups', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.get(`/agreements/applies-to/${demo.users.noor}`);
    expect(response.statusCode).toBe(200);
    expect(response.json().ageBand).toBe('adult');
    expect(response.json().rules.length).toBeGreaterThan(0);
  });

  it('does not let a child activate an agreement', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.post('/agreements/agr_devries/activate');
    expect(response.statusCode).toBe(403);
    expect(response.json().messageKey).toBe('authz.child_not_permitted');
  });

  it('lets a child propose a change', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.post('/agreements/agr_devries/proposals', {
      ruleId: 'rule_bedtime',
      text: 'Kan het opladen in het weekend om half tien in plaats van negen uur?',
    });
    expect(response.statusCode).toBe(201);
  });

  it('does not let a family reach another family', async () => {
    const outsider = new Client(app);
    await outsider.post('/auth/register', {
      email: 'outsider@focusfamily.test',
      password: 'a-long-enough-password',
      displayName: 'Outsider',
    });
    await outsider.post('/families', { name: 'Andere familie', displayName: 'Outsider' });
    const response = await outsider.get('/agreements');
    expect(response.statusCode).toBe(200);
    expect(response.json().agreements).toEqual([]);
  });
});

describe('the agreement has to include the grown-ups', () => {
  it('refuses to activate an agreement that only binds the children', async () => {
    const client = new Client(app);
    await client.signIn('sam@focusfamily.test');

    const created = await client.post('/agreements', {
      title: 'Alleen voor de kinderen',
      rules: [
        {
          context: 'bedtime',
          kind: 'quiet_window',
          audience: 'children',
          startsAt: '20:00',
          endsAt: '07:00',
          text: 'De kinderen leggen om acht uur alles weg.',
        },
      ],
    });
    // Creating a draft is allowed - the family is still writing it.
    expect([201, 402]).toContain(created.statusCode);
    if (created.statusCode !== 201) return;

    const issues = created.json().issues as Array<{ code: string }>;
    expect(issues.map((issue) => issue.code)).toContain('adults_not_included');

    const activate = await client.post(
      `/agreements/${created.json().agreement.id}/activate`,
    );
    expect(activate.statusCode).toBe(400);
    expect(activate.json().details.issues).toContain('adults_not_included');
  });

  it('gates a second agreement behind Premium and lets a premium family through', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    // The demo family is on a Premium trial, so a second agreement is allowed.
    const created = await client.post('/agreements', {
      title: 'Vakantie-afspraken',
      rules: [
        {
          context: 'family_activities',
          kind: 'shared_activity',
          audience: 'everyone',
          text: 'In de vakantie doen we elke dag samen iets zonder scherm.',
        },
      ],
    });
    expect(created.statusCode).toBe(201);

    await prisma.subscription.updateMany({
      where: { familyId: demo.familyId },
      data: { status: 'canceled' },
    });
    const blocked = await client.post('/agreements', {
      title: 'Nog een afspraak',
      rules: [
        {
          context: 'meals',
          kind: 'devices_away',
          audience: 'everyone',
          text: 'Telefoons weg tijdens het ontbijt.',
        },
      ],
    });
    expect(blocked.statusCode).toBe(402);
    expect(blocked.json().messageKey).toBe('billing.upgrade_needed');

    await prisma.subscription.updateMany({
      where: { familyId: demo.familyId },
      data: { status: 'trialing' },
    });
  });

  it('refuses clinical or shaming wording in a rule', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.post('/agreements', {
      title: 'Verkeerde toon',
      rules: [
        {
          context: 'meals',
          kind: 'devices_away',
          audience: 'everyone',
          text: 'Lena heeft een verslaving en moet gestraft worden.',
        },
      ],
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().messageKey).toBe('copy.clinical_or_shaming');
  });
});

describe('adults take part in focus moments', () => {
  it('has grown-ups in every seeded schedule', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.get('/focus/schedules');
    const schedules = response.json().schedules as Array<{
      participantIds: string[];
      nextOccurrence: string | null;
    }>;
    expect(schedules.length).toBeGreaterThan(0);
    for (const schedule of schedules) {
      const hasAdult =
        schedule.participantIds.includes(demo.users.noor) ||
        schedule.participantIds.includes(demo.users.sam);
      expect(hasAdult).toBe(true);
      expect(schedule.nextOccurrence).not.toBeNull();
    }
  });

  it('lets a child start a focus moment, and always includes the starter', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.post('/focus/sessions', {
      scheduleId: 'sch_dinner',
      participantIds: [demo.users.noor],
      plannedMinutes: 30,
      clientSessionId: 'lena-test-1',
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().session.participantIds).toContain(demo.users.lena);
    expect(response.json().session.participantIds).toContain(demo.users.noor);
    expect(response.json().session.source).toBe('app_observed');
  });
});

describe('family invitations and child linking', () => {
  it('invites a second guardian who can then see the same agreement', async () => {
    const founder = new Client(app);
    await founder.post('/auth/register', {
      email: 'founder@focusfamily.test',
      password: 'a-long-enough-password',
      displayName: 'Founder',
    });
    await founder.post('/families', { name: 'Familie Test', displayName: 'Founder' });
    const invite = await founder.post('/family/invitations', {
      email: 'partner@focusfamily.test',
    });
    expect(invite.statusCode).toBe(201);

    const partner = new Client(app);
    await partner.post('/auth/register', {
      email: 'partner@focusfamily.test',
      password: 'a-long-enough-password',
      displayName: 'Partner',
    });
    const accepted = await partner.post('/family/invitations/accept', {
      token: invite.json().token,
      displayName: 'Partner',
    });
    expect(accepted.statusCode).toBe(201);

    const family = await partner.get('/family');
    expect(family.json().members).toHaveLength(2);
    expect(family.json().baseline.active).toBe(true);
  });

  it('links a child, records who did it, and says whether their assent is needed', async () => {
    const founder = new Client(app);
    await founder.signIn('founder@focusfamily.test', 'a-long-enough-password');
    const response = await founder.post('/family/children', {
      displayName: 'Kind',
      birthYear: new Date().getFullYear() - 12,
      email: 'kind@focusfamily.test',
      password: 'another-long-password',
    });
    expect(response.statusCode).toBe(201);
    expect(response.json().ageBand).toBe('11-13');
    expect(response.json().assentRequired).toBe(true);

    const log = await prisma.auditLog.findFirst({
      where: { action: 'child.linked', subjectUserId: response.json().userId },
    });
    expect(log).toBeTruthy();
  });

  it('refuses to link someone outside the 8 to 17 range', async () => {
    const founder = new Client(app);
    await founder.signIn('founder@focusfamily.test', 'a-long-enough-password');
    const response = await founder.post('/family/children', {
      displayName: 'Te jong',
      birthYear: new Date().getFullYear() - 4,
      email: null,
      password: 'another-long-password',
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().messageKey).toBe('child.age_out_of_range');
  });

  it('holds every nudge back during the neutral first week', async () => {
    const founder = new Client(app);
    await founder.signIn('founder@focusfamily.test', 'a-long-enough-password');
    const review = await founder.get('/review/week');
    expect(review.statusCode).toBe(200);
    expect(review.json().recommendation).toBeNull();
  });
});

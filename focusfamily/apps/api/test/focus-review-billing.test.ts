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

describe('the local timer reconciles after being offline', () => {
  it('accepts a queue of events recorded with no connection', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const start = new Date(Date.now() - 40 * 60_000);

    const created = await client.post('/focus/sessions', {
      scheduleId: 'sch_dinner',
      participantIds: [demo.users.lena],
      plannedMinutes: 30,
      clientSessionId: 'offline-1',
      startedAt: start.toISOString(),
    });
    expect(created.statusCode).toBe(201);
    const sessionId = created.json().session.id;

    const synced = await client.post(`/focus/sessions/${sessionId}/sync`, {
      events: [
        {
          id: 'offline-1-pause',
          type: 'pause',
          at: new Date(start.getTime() + 10 * 60_000).toISOString(),
          reason: 'someone_needed_me',
          recordedOffline: true,
        },
        {
          id: 'offline-1-resume',
          type: 'resume',
          at: new Date(start.getTime() + 13 * 60_000).toISOString(),
          recordedOffline: true,
        },
        {
          id: 'offline-1-done',
          type: 'complete',
          at: new Date(start.getTime() + 33 * 60_000).toISOString(),
          recordedOffline: true,
        },
      ],
    });
    expect(synced.statusCode).toBe(200);
    const body = synced.json();
    expect(body.applied).toHaveLength(3);
    expect(body.progress.status).toBe('completed');
    expect(body.progress.focusedMinutes).toBe(30);
    expect(body.progress.reasons).toEqual(['someone_needed_me']);
    expect(body.counted).toBe(true);
  });

  it('is idempotent when the same start is retried', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const again = await client.post('/focus/sessions', {
      scheduleId: 'sch_dinner',
      participantIds: [demo.users.lena],
      plannedMinutes: 30,
      clientSessionId: 'offline-1',
    });
    expect(again.statusCode).toBe(200);
    expect(again.json().reused).toBe(true);
    const count = await prisma.focusSession.count({ where: { id: 'fs_offline-1' } });
    expect(count).toBe(1);
  });

  it('collapses a retried upload instead of double counting', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const replay = await client.post('/focus/sessions/fs_offline-1/sync', {
      events: [
        {
          id: 'offline-1-done',
          type: 'complete',
          at: new Date().toISOString(),
          recordedOffline: true,
        },
      ],
    });
    expect(replay.json().duplicates).toEqual(['offline-1-done']);
    expect(replay.json().applied).toEqual([]);
    const events = await prisma.focusSessionEvent.count({
      where: { sessionId: 'fs_offline-1' },
    });
    expect(events).toBe(4);
  });

  it('clamps a device clock that runs into next year', async () => {
    const client = new Client(app);
    await client.signIn('sam@focusfamily.test');
    const created = await client.post('/focus/sessions', {
      participantIds: [demo.users.tijn],
      plannedMinutes: 20,
      clientSessionId: 'skewed-1',
    });
    const id = created.json().session.id;
    const synced = await client.post(`/focus/sessions/${id}/sync`, {
      events: [
        { id: 'skew-done', type: 'complete', at: '2031-01-01T00:00:00.000Z' },
      ],
    });
    expect(synced.json().clampedToServerTime).toBe(true);
  });

  it('will not let a non-participant sync someone else session', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.post('/focus/sessions/fs_skewed-1/sync', {
      events: [{ id: 'nope', type: 'abandon', at: new Date().toISOString() }],
    });
    expect(response.statusCode).toBe(403);
    expect(response.json().messageKey).toBe('focus.not_a_participant');
  });
});

describe('the weekly review', () => {
  it('reads as a conversation with no score anywhere in it', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.get('/review/week');
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(JSON.stringify(body.review)).not.toMatch(/"score"|"grade"|"rank"|"streak"/i);
    expect(body.review.wentWell.length).toBeGreaterThan(0);
    expect(body.review.conversationStarters).toContain('review.talk.one_change');
    expect(body.review.adultParticipation.totalFocusSessions).toBeGreaterThan(0);
  });

  it('labels every figure with where it came from', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const figures = (await client.get('/review/week')).json().review.figures as Array<{
      source: { kind: string; labelKey: string };
    }>;
    for (const figure of figures) {
      expect(figure.source.labelKey).toMatch(/^source\./);
    }
  });

  it('offers exactly one explainable suggestion, from fixed rules', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const body = (await client.get('/review/week')).json();
    expect(body.recommendationEngine).toBe('deterministic_rules_v1');
    expect(body.aiAdvisorEnabled).toBe(false);
    if (body.recommendation) {
      expect(body.recommendation.reasonKey).toBeTruthy();
      expect(body.recommendation.evidence.length).toBeGreaterThan(0);
      for (const item of body.recommendation.evidence) {
        expect(item.label.labelKey).toMatch(/^source\./);
      }
    }
  });
});

describe('goals and celebration', () => {
  it('counts a contribution from anyone and celebrates once the target is met', async () => {
    const client = new Client(app);
    await client.signIn('sam@focusfamily.test');
    const before = (await client.get('/goals')).json();
    expect(before.goals[0].progress.achieved).toBe(3);
    expect(before.goals[0].progress.reached).toBe(true);
    expect(before.goals[0].celebration.visibility).toBe('family_private');
    expect(before.goals[0].progress.adultsTookPart).toBe(true);
    expect(before.momentum.lostAnything).toBe(false);
  });

  it('lets a child log a contribution too', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.post('/goals/goal_dinners/contributions', { amount: 1 });
    expect(response.statusCode).toBe(201);
    expect(response.json().progress.contributorIds).toContain(demo.users.lena);
  });
});

describe('notifications and quiet hours', () => {
  it('previews exactly which notifications would arrive right now', async () => {
    const client = new Client(app);
    await client.signIn('lena@focusfamily.test');
    const response = await client.get('/notifications/preferences');
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.preference.quietHoursEnabled).toBe(true);
    expect(body.previewNow.account_security.deliver).toBe(true);
    expect(body.previewNow.checkin_invite.deliver).toBe(false);
  });

  it('saves a change and honours a switched-off category', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const saved = await client.patch('/notifications/preferences', {
      enabledCategories: ['account_security'],
      quietHoursStart: '22:00',
      quietHoursEnd: '06:30',
      quietHoursEnabled: true,
      channel: 'push',
    });
    expect(saved.statusCode).toBe(200);
    const reloaded = (await client.get('/notifications/preferences')).json();
    expect(reloaded.preference.enabledCategories).toEqual(['account_security']);
    expect(reloaded.previewNow.celebration.deliver).toBe(false);
  });
});

describe('plans and payment', () => {
  it('runs a mock checkout end to end and says it is test mode', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const checkout = await client.post('/billing/checkout', { plan: 'family_premium' });
    expect(checkout.statusCode).toBe(201);
    expect(checkout.json().testMode).toBe(true);
    expect(checkout.json().checkout.provider).toBe('mock');

    const confirmed = await client.post('/billing/confirm', {
      sessionId: checkout.json().checkout.id,
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json().subscription.plan).toBe('family_premium');
    expect(confirmed.json().subscription.status).toBe('active');
  });

  it('accepts an employer or school code without telling the sponsor anything', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.post('/billing/sponsor-code', { code: 'SCHOOL-DEMO-2026' });
    expect(response.statusCode).toBe(200);
    expect(response.json().subscription.plan).toBe('sponsored');
    expect(response.json().subscription.sponsorName).toBe('Deelnemende school');
    // Nothing about the family is stored on the sponsor side; there is no such table.
    expect(Object.keys(response.json().subscription)).not.toContain('members');
  });

  it('does not let a child change the plan', async () => {
    const lena = new Client(app);
    await lena.signIn('lena@focusfamily.test');
    const response = await lena.post('/billing/checkout', { plan: 'family_premium' });
    expect(response.statusCode).toBe(403);
  });
});

describe('offline activities and the library', () => {
  it('suggests activities the youngest child can join', async () => {
    const client = new Client(app);
    await client.signIn('noor@focusfamily.test');
    const response = await client.get('/activities');
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.activities.length).toBeGreaterThan(0);
    expect(body.questly).toEqual({ status: 'planned', connected: false });
    for (const activity of body.activities) {
      expect(activity.minAge).toBeLessThanOrEqual(body.age);
      expect(activity.title.nl).toBeTruthy();
      expect(activity.title.en).toBeTruthy();
    }
  });

  it('serves the parent library in both languages without signing in', async () => {
    const client = new Client(app);
    const list = await client.get('/education');
    expect(list.statusCode).toBe(200);
    expect(list.json().articles.length).toBe(6);

    const article = await client.get('/education/slaap-en-de-oplader');
    expect(article.json().article.body.nl.length).toBeGreaterThan(2);
    expect(article.json().article.body.en.length).toBe(
      article.json().article.body.nl.length,
    );
    expect(article.json().article.sourceNote.nl).toBeTruthy();
  });
});

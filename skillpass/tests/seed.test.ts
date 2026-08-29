import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { setAutoTruncate } from './helpers';

/**
 * Runs the real seed script against the test database and checks that it
 * produces the launch dataset the product needs, in both languages.
 */
describe('development seed', () => {
  beforeAll(() => {
    // The seed builds the whole dataset once; keep it for every test in here.
    setAutoTruncate(false);
    execFileSync('node', ['--experimental-strip-types', 'prisma/seed.ts'], {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: env().TEST_DATABASE_URL! },
    });
  }, 120_000);

  afterAll(() => {
    setAutoTruncate(true);
  });

  it('creates one launch city and keeps room for more', async () => {
    const launch = await prisma.city.findMany({ where: { isLaunchCity: true } });
    expect(launch).toHaveLength(1);
    expect(launch[0]?.slug).toBe('utrecht');
    expect(await prisma.city.count()).toBeGreaterThan(1);
  });

  it('creates twelve providers, most of them approved and one awaiting review', async () => {
    expect(await prisma.provider.count()).toBe(12);
    expect(await prisma.provider.count({ where: { status: 'APPROVED' } })).toBe(11);
    expect(await prisma.provider.count({ where: { status: 'PENDING_REVIEW' } })).toBe(1);
    // Every provider has a venue in the launch city and a verification record.
    expect(await prisma.venue.count()).toBe(12);
    expect(await prisma.providerVerification.count()).toBe(48);
  });

  it('creates at least thirty activities across at least ten categories', async () => {
    expect(await prisma.activity.count()).toBeGreaterThanOrEqual(30);
    const grouped = await prisma.activity.groupBy({ by: ['category'], _count: true });
    expect(grouped.length).toBeGreaterThanOrEqual(10);
  });

  it('gives every activity a Dutch and an English translation', async () => {
    const activities = await prisma.activity.findMany({ include: { translations: true } });
    for (const activity of activities) {
      const locales = activity.translations.map((t) => t.locale).sort();
      expect(locales, `${activity.slug} is not bilingual`).toEqual(['EN', 'NL']);
      for (const translation of activity.translations) {
        expect(translation.title.length).toBeGreaterThan(3);
        expect(translation.description.length).toBeGreaterThan(40);
      }
    }
  });

  it('schedules sessions with capacity, both past and upcoming', async () => {
    expect(await prisma.session.count({ where: { startsAt: { gte: new Date() } } })).toBeGreaterThan(0);
    expect(await prisma.session.count({ where: { startsAt: { lt: new Date() } } })).toBeGreaterThan(0);
    expect(await prisma.capacity.count()).toBe(await prisma.session.count());
  });

  it('creates the documented demo accounts', async () => {
    for (const email of [
      'guardian@skillpass.local',
      'guardian2@skillpass.local',
      'provider@skillpass.local',
      'instructor@skillpass.local',
      'admin@skillpass.local',
      'safeguarding@skillpass.local',
    ]) {
      const user = await prisma.user.findUnique({ where: { emailNormalised: email } });
      expect(user, `${email} is missing`).not.toBeNull();
      expect(user?.emailVerifiedAt).not.toBeNull();
    }

    expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(1);
    expect(await prisma.user.count({ where: { role: 'SAFEGUARDING_OFFICER' } })).toBe(1);
  });

  it('gives the demo family two children, a subscription, credits and bookings', async () => {
    const family = await prisma.family.findFirstOrThrow({
      include: { children: true, subscriptions: true, bookings: true, ledger: true },
    });

    expect(family.children).toHaveLength(2);
    expect(family.subscriptions.some((s) => s.status === 'ACTIVE')).toBe(true);
    expect(family.bookings.length).toBeGreaterThanOrEqual(2);

    // The ledger balance is consistent with the sum of its entries.
    const sum = family.ledger.reduce((total, entry) => total + entry.delta, 0);
    const latest = family.ledger.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    expect(latest?.balanceAfter).toBe(sum);
    expect(sum).toBeGreaterThan(0);
  });

  it('creates a reviewable attended booking, a waitlist entry and an open incident', async () => {
    expect(await prisma.attendance.count({ where: { status: 'ATTENDED' } })).toBeGreaterThanOrEqual(1);
    expect(await prisma.review.count({ where: { status: 'PUBLISHED' } })).toBeGreaterThanOrEqual(1);
    expect(await prisma.waitlistEntry.count({ where: { status: 'WAITING' } })).toBeGreaterThanOrEqual(1);
    expect(await prisma.incident.count({ where: { status: { not: 'CLOSED' } } })).toBeGreaterThanOrEqual(1);
    expect(await prisma.safeguardingCase.count()).toBeGreaterThanOrEqual(1);
  });

  it('publishes nothing for the provider that is still awaiting verification', async () => {
    const pending = await prisma.provider.findFirstOrThrow({
      where: { status: 'PENDING_REVIEW' },
      include: { activities: true },
    });
    expect(pending.activities.length).toBeGreaterThan(0);
    expect(pending.activities.every((activity) => activity.status !== 'PUBLISHED')).toBe(true);
  });
});

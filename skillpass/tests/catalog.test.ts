import { describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db';
import { searchActivities, searchSchema, recommendForFamily } from '@/modules/catalog/search';
import { createActivity, createSession as createSessionRow, familyMaySeeExactLocation, getActivityDetail, publishActivity } from '@/modules/catalog/activities';
import { approveProvider, createProviderApplication, providerOnboardingSchema, verificationQueue } from '@/modules/catalog/providers';
import { providerDashboard } from '@/modules/catalog/dashboard';
import { sessionRoster } from '@/modules/booking/service';
import {
  createActivity as makeActivity,
  createChild,
  createCity,
  createGuardianWithFamily,
  createProvider,
  createSession,
  createUser,
  sessionUser,
} from './helpers';

const emptySearch = searchSchema.parse({});

describe('age-appropriate search', () => {
  it('only returns activities whose age range contains the requested band', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });

    const younger = await makeActivity({ provider, minAgeBand: 'AGE_6_8', maxAgeBand: 'AGE_9_11', titleNl: 'Jonger' });
    const older = await makeActivity({ provider, minAgeBand: 'AGE_12_14', maxAgeBand: 'AGE_15_17', titleNl: 'Ouder' });
    const wide = await makeActivity({ provider, minAgeBand: 'AGE_6_8', maxAgeBand: 'AGE_15_17', titleNl: 'Breed' });

    for (const activity of [younger, older, wide]) {
      await createSession({ activityId: activity.id, totalSeats: 5 });
    }

    const results = await searchActivities({ ...emptySearch, ageBand: 'AGE_6_8' }, 'NL');
    const ids = results.items.map((item) => item.id);

    expect(ids).toContain(younger.id);
    expect(ids).toContain(wide.id);
    expect(ids).not.toContain(older.id);
  });

  it('filters on category, credits, language, accessibility and trial availability', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });

    const cheap = await makeActivity({ provider, category: 'MUSIC', creditCost: 1 });
    const pricey = await makeActivity({ provider, category: 'MUSIC', creditCost: 8 });
    const sports = await makeActivity({ provider, category: 'SPORTS', creditCost: 1 });
    await prisma.activity.update({ where: { id: cheap.id }, data: { trialAvailable: true, wheelchairAccessible: true } });

    for (const activity of [cheap, pricey, sports]) await createSession({ activityId: activity.id });

    expect((await searchActivities({ ...emptySearch, category: 'MUSIC' }, 'NL')).items.map((i) => i.id).sort()).toEqual(
      [cheap.id, pricey.id].sort(),
    );
    expect((await searchActivities({ ...emptySearch, maxCredits: 2 }, 'NL')).items.map((i) => i.id).sort()).toEqual(
      [cheap.id, sports.id].sort(),
    );
    expect((await searchActivities({ ...emptySearch, trialAvailable: true }, 'NL')).items.map((i) => i.id)).toEqual([cheap.id]);
    expect((await searchActivities({ ...emptySearch, wheelchairAccessible: true }, 'NL')).items.map((i) => i.id)).toEqual([
      cheap.id,
    ]);
    expect((await searchActivities({ ...emptySearch, language: 'EN' }, 'NL')).items).toHaveLength(3);
  });

  it('never returns unpublished activities or activities of unapproved providers', async () => {
    const city = await createCity();
    const approved = await createProvider({ slug: 'approved', cityId: city.id, status: 'APPROVED' });
    const pending = await createProvider({ slug: 'pending', cityId: city.id, status: 'PENDING_REVIEW' });

    const visible = await makeActivity({ provider: approved, titleNl: 'Zichtbaar' });
    const draft = await makeActivity({ provider: approved, published: false, titleNl: 'Concept' });
    // Even if a row is marked PUBLISHED, an unapproved provider stays hidden.
    const hidden = await makeActivity({ provider: pending, titleNl: 'Verborgen' });

    for (const activity of [visible, draft, hidden]) await createSession({ activityId: activity.id });

    const ids = (await searchActivities(emptySearch, 'NL')).items.map((item) => item.id);
    expect(ids).toEqual([visible.id]);
  });

  it('excludes activities whose only sessions are in the past', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await makeActivity({ provider });
    await createSession({ activityId: activity.id, startsInHours: -48 });

    expect((await searchActivities(emptySearch, 'NL')).items).toHaveLength(0);
  });

  it('shows only approximate coordinates in results', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    await prisma.venue.update({
      where: { id: provider.venueId },
      data: { latitude: 52.0937, longitude: 5.1237, approxLatitude: 52.095, approxLongitude: 5.125 },
    });
    const activity = await makeActivity({ provider });
    await createSession({ activityId: activity.id });

    const item = (await searchActivities(emptySearch, 'NL')).items[0]!;
    expect(item.approxLatitude).not.toBe(52.0937);
    expect(Object.keys(item)).not.toContain('addressLine1');
  });
});

describe('translations', () => {
  it('returns the requested locale and falls back when a locale is missing', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await makeActivity({ provider, titleNl: 'Turnen voor beginners', titleEn: 'Gymnastics for beginners' });
    await createSession({ activityId: activity.id });

    expect((await searchActivities(emptySearch, 'NL')).items[0]?.title).toBe('Turnen voor beginners');
    expect((await searchActivities(emptySearch, 'EN')).items[0]?.title).toBe('Gymnastics for beginners');

    const detailNl = await getActivityDetail(activity.slug, 'NL');
    const detailEn = await getActivityDetail(activity.slug, 'EN');
    expect(detailNl.translation?.title).toBe('Turnen voor beginners');
    expect(detailEn.translation?.title).toBe('Gymnastics for beginners');

    await prisma.activityTranslation.deleteMany({ where: { activityId: activity.id, locale: 'EN' } });
    const fallback = await getActivityDetail(activity.slug, 'EN');
    expect(fallback.translation?.locale).toBe('NL');
  });

  it('refuses to publish an activity that is not available in both languages', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await makeActivity({ provider, published: false });
    await prisma.activityTranslation.deleteMany({ where: { activityId: activity.id, locale: 'EN' } });

    await expect(publishActivity(provider.owner, provider.providerId, activity.id)).rejects.toThrow(/Dutch and an English/);
  });
});

describe('exact location disclosure', () => {
  it('is withheld until the family has a confirmed booking', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const activity = await makeActivity({ provider });
    const session = await createSession({ activityId: activity.id, totalSeats: 3 });
    const { family } = await createGuardianWithFamily();
    const child = await createChild(family.id);

    expect(await familyMaySeeExactLocation(family.id, activity.id)).toBe(false);
    expect((await getActivityDetail(activity.slug, 'NL')).location.exact).toBe(false);

    await prisma.booking.create({
      data: {
        reference: 'BK-TEST0001',
        familyId: family.id,
        childProfileId: child.id,
        sessionId: session.id,
        createdById: (await prisma.familyMembership.findFirstOrThrow({ where: { familyId: family.id } })).userId,
        status: 'CONFIRMED',
        creditsCharged: 2,
      },
    });

    expect(await familyMaySeeExactLocation(family.id, activity.id)).toBe(true);
    const detail = await getActivityDetail(activity.slug, 'NL', { exactLocation: true });
    expect(detail.location.exact).toBe(true);
    expect(detail.location).toHaveProperty('addressLine1');
  });
});

describe('provider approval gates publication', () => {
  it('blocks publishing until an administrator has approved the provider', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'pending', cityId: city.id, status: 'PENDING_REVIEW' });
    const activity = await makeActivity({ provider, published: false });

    await expect(publishActivity(provider.owner, provider.providerId, activity.id)).rejects.toMatchObject({
      code: 'forbidden',
    });

    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));
    await prisma.providerVerification.createMany({
      data: [
        { providerId: provider.providerId, documentType: 'CHAMBER_OF_COMMERCE', decision: 'APPROVED' },
        { providerId: provider.providerId, documentType: 'LIABILITY_INSURANCE', decision: 'APPROVED' },
      ],
    });
    await approveProvider(admin, provider.providerId);

    const published = await publishActivity(provider.owner, provider.providerId, activity.id);
    expect(published.status).toBe('PUBLISHED');
    expect(published.publishedAt).not.toBeNull();
  });

  it('refuses to approve a provider with an outstanding verification item', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'pending', cityId: city.id, status: 'PENDING_REVIEW' });
    const admin = sessionUser(await createUser({ email: 'admin@test.local', role: 'ADMIN' }));

    await prisma.providerVerification.createMany({
      data: [
        { providerId: provider.providerId, documentType: 'CHAMBER_OF_COMMERCE', decision: 'APPROVED' },
        { providerId: provider.providerId, documentType: 'VOG_DECLARATION', decision: 'PENDING' },
      ],
    });

    await expect(approveProvider(admin, provider.providerId)).rejects.toThrow(/verification item/);
  });

  it('creates a verification checklist when a provider applies and never auto-verifies it', async () => {
    const applicant = sessionUser(await createUser({ email: 'applicant@test.local', role: 'GUARDIAN' }));
    const input = providerOnboardingSchema.parse({
      legalName: 'Nieuwe Club V.O.F.',
      displayName: 'Nieuwe Club',
      description: 'Wij bieden wekelijkse sportlessen aan voor kinderen van 6 tot 12 jaar in Utrecht.',
      chamberOfCommerceNo: '12345678',
      contactPersonName: 'Aanvrager',
      contactEmail: 'info@nieuweclub.local',
      vogDeclared: true,
    });

    const provider = await createProviderApplication(applicant, input);
    expect(provider.status).toBe('PENDING_REVIEW');

    const checklist = await prisma.providerVerification.findMany({ where: { providerId: provider.id } });
    expect(checklist).toHaveLength(4);
    expect(checklist.every((item) => item.decision === 'PENDING')).toBe(true);

    expect((await verificationQueue()).map((p) => p.id)).toContain(provider.id);
  });
});

describe('provider tenant isolation', () => {
  it('refuses every provider-scoped read and write across tenants', async () => {
    const city = await createCity();
    const alpha = await createProvider({ slug: 'alpha', cityId: city.id });
    const beta = await createProvider({ slug: 'beta', cityId: city.id });

    const betaActivity = await makeActivity({ provider: beta });
    const betaSession = await createSession({ activityId: betaActivity.id, totalSeats: 3 });

    // Alpha's owner may not read Beta's dashboard, roster or sessions.
    await expect(providerDashboard(alpha.owner, beta.providerId)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(sessionRoster(alpha.owner, beta.providerId, betaSession.id)).rejects.toMatchObject({ code: 'forbidden' });
    // …nor smuggle Beta's session in under Alpha's own provider id.
    await expect(sessionRoster(alpha.owner, alpha.providerId, betaSession.id)).rejects.toMatchObject({ code: 'forbidden' });
    await expect(publishActivity(alpha.owner, beta.providerId, betaActivity.id)).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('refuses to attach an activity to a venue owned by another provider', async () => {
    const city = await createCity();
    const alpha = await createProvider({ slug: 'alpha', cityId: city.id });
    const beta = await createProvider({ slug: 'beta', cityId: city.id });

    await expect(
      createActivity(alpha.owner, alpha.providerId, {
        venueId: beta.venueId,
        category: 'SPORTS',
        level: 'ALL_LEVELS',
        minAgeBand: 'AGE_6_8',
        maxAgeBand: 'AGE_9_11',
        creditCost: 2,
        listPriceCents: 1200,
        languages: ['NL'],
        wheelchairAccessible: false,
        sensoryFriendly: false,
        trialAvailable: false,
        equipmentProvided: true,
        cancellationHours: 24,
        interestSlugs: [],
        translations: [
          {
            locale: 'NL',
            title: 'Poging',
            summary: 'Een samenvatting.',
            description: 'Een beschrijving die lang genoeg is om de validatie te passeren zonder problemen.',
          },
          {
            locale: 'EN',
            title: 'Attempt',
            summary: 'A summary.',
            description: 'A description that is long enough to pass validation without any problems at all.',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('refuses to create a session on another provider’s activity', async () => {
    const city = await createCity();
    const alpha = await createProvider({ slug: 'alpha', cityId: city.id });
    const beta = await createProvider({ slug: 'beta', cityId: city.id });
    const betaActivity = await makeActivity({ provider: beta });

    await expect(
      createSessionRow(alpha.owner, alpha.providerId, {
        activityId: betaActivity.id,
        startsAt: new Date(Date.now() + 86_400_000).toISOString(),
        endsAt: new Date(Date.now() + 90_000_000).toISOString(),
        totalSeats: 5,
        waitlistLimit: 5,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('enforces permissions within a provider: an instructor cannot publish', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const instructorUser = await createUser({ email: 'instructor@test.local', role: 'PROVIDER_STAFF' });
    await prisma.providerStaff.create({
      data: { providerId: provider.providerId, userId: instructorUser.id, role: 'INSTRUCTOR' },
    });
    const activity = await makeActivity({ provider, published: false });

    await expect(
      publishActivity(sessionUser(instructorUser), provider.providerId, activity.id),
    ).rejects.toThrow(/Missing permission: activities:publish/);
  });
});

describe('recommendations', () => {
  it('ranks matching interests above generic matches and explains why', async () => {
    const city = await createCity();
    const provider = await createProvider({ slug: 'club', cityId: city.id });
    const interest = await prisma.interest.create({
      data: { slug: 'coding', labelNl: 'Programmeren', labelEn: 'Coding', category: 'TECHNOLOGY' },
    });

    const tech = await makeActivity({ provider, category: 'TECHNOLOGY', minAgeBand: 'AGE_9_11', maxAgeBand: 'AGE_9_11' });
    const other = await makeActivity({ provider, category: 'SPORTS', minAgeBand: 'AGE_9_11', maxAgeBand: 'AGE_9_11' });
    await createSession({ activityId: tech.id });
    await createSession({ activityId: other.id });

    const { family } = await createGuardianWithFamily();
    const child = await createChild(family.id, { ageBand: 'AGE_9_11' });
    await prisma.childProfile.update({ where: { id: child.id }, data: { interests: { connect: { id: interest.id } } } });

    const recommendations = await recommendForFamily(family.id, 'NL', 5);
    expect(recommendations[0]?.id).toBe(tech.id);
    expect(recommendations[0]?.reasons).toContain('interest:TECHNOLOGY');
    expect(recommendations[0]?.reasons).toContain('age:AGE_9_11');
  });

  it('returns nothing for a family without children', async () => {
    const { family } = await createGuardianWithFamily();
    expect(await recommendForFamily(family.id, 'NL')).toEqual([]);
  });
});

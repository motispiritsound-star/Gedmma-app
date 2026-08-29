/**
 * Development seed for SkillPass.
 *
 *   npm run db:seed
 *
 * Wipes the configured database and rebuilds a realistic launch region:
 * one city, twelve providers, thirty-two bilingual activities, sessions,
 * a demo family with two children, bookings, attendance, a review, a payment,
 * an open incident and the platform staff accounts.
 *
 * Development credentials are printed at the end and documented in README.md.
 */
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';
import { hashPassword } from '../src/lib/crypto.ts';
import { ACTIVITIES, INTERESTS, PROVIDERS } from './seed-data.ts';

loadDotenv({ override: false, quiet: true });

const prisma = new PrismaClient();

/** Shared password for every demo account. Development only. */
const DEMO_PASSWORD = 'SkillPass!2026';

function at(daysFromNow: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

/** ~500 m grid, matching src/lib/adapters/geo/approximate(). */
function approximate(latitude: number, longitude: number) {
  const grid = 0.005;
  return {
    approxLatitude: Math.round(latitude / grid) * grid,
    approxLongitude: Math.round(longitude / grid) * grid,
  };
}

function reference(prefix: string): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 8; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}-${out}`;
}

async function reset() {
  // Order matters only for readability; TRUNCATE ... CASCADE handles the rest.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog", "Notification", "ProviderMessage", "SafeguardingCase", "Incident",
      "Review", "Favourite", "Attendance", "WaitlistEntry", "Booking",
      "CreditLedgerEntry", "Refund", "Payment", "Payout", "WebhookEvent",
      "Subscription", "SubscriptionPlan", "Capacity", "Session",
      "ActivityTranslation", "Activity", "MediaAsset", "ProviderVerification",
      "ProviderStaff", "Venue", "Provider", "ChildProfile", "Interest",
      "FamilyMembership", "Family", "Consent", "EmailToken", "AuthSession",
      "User", "City"
    RESTART IDENTITY CASCADE;
  `);
}

async function main() {
  console.log('· resetting database');
  await reset();

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log('· cities');
  const utrecht = await prisma.city.create({
    data: {
      slug: 'utrecht',
      name: 'Utrecht',
      countryCode: 'NL',
      currency: 'EUR',
      timezone: 'Europe/Amsterdam',
      defaultLocale: 'NL',
      latitude: 52.0907,
      longitude: 5.1214,
      isLaunchCity: true,
    },
  });
  // A second city proves the model is multi-city; it has no providers yet.
  await prisma.city.create({
    data: {
      slug: 'amsterdam',
      name: 'Amsterdam',
      countryCode: 'NL',
      currency: 'EUR',
      timezone: 'Europe/Amsterdam',
      defaultLocale: 'NL',
      latitude: 52.3676,
      longitude: 4.9041,
      isLaunchCity: false,
    },
  });

  console.log('· interests');
  await prisma.interest.createMany({
    data: INTERESTS.map((interest) => ({
      slug: interest.slug,
      labelNl: interest.nl,
      labelEn: interest.en,
      category: interest.category,
    })),
  });
  const interestBySlug = new Map((await prisma.interest.findMany()).map((i) => [i.slug, i.id]));

  console.log('· subscription plans');
  await prisma.subscriptionPlan.createMany({
    data: [
      {
        slug: 'free-discovery',
        tier: 'FREE_DISCOVERY',
        audience: 'GUARDIAN',
        nameNl: 'Gratis ontdekken',
        nameEn: 'Free Discovery',
        descriptionNl: 'Blader door alle activiteiten en bewaar favorieten. Boeken kan met losse credits.',
        descriptionEn: 'Browse every activity and save favourites. Book with individually purchased credits.',
        priceCents: 0,
        monthlyCredits: 0,
        rolloverLimit: 0,
        commissionBps: 1500,
      },
      {
        slug: 'family-monthly',
        tier: 'FAMILY_MONTHLY',
        audience: 'GUARDIAN',
        nameNl: 'Gezin maandelijks',
        nameEn: 'Family Monthly',
        descriptionNl: '8 credits per maand voor het hele gezin. Maandelijks opzegbaar.',
        descriptionEn: '8 credits per month for the whole family. Cancel monthly.',
        priceCents: 2995,
        monthlyCredits: 8,
        rolloverLimit: 4,
        commissionBps: 1500,
        trialDays: 14,
      },
      {
        slug: 'family-monthly-plus',
        tier: 'FAMILY_MONTHLY',
        audience: 'GUARDIAN',
        nameNl: 'Gezin plus',
        nameEn: 'Family Plus',
        descriptionNl: '18 credits per maand voor gezinnen met meerdere kinderen.',
        descriptionEn: '18 credits per month for families with several children.',
        priceCents: 4995,
        monthlyCredits: 18,
        rolloverLimit: 9,
        commissionBps: 1500,
      },
      {
        slug: 'provider-pro',
        tier: 'PROVIDER_PRO',
        audience: 'PROVIDER',
        nameNl: 'Aanbieder Pro',
        nameEn: 'Provider Pro',
        descriptionNl: 'Lagere commissie (10%), uitgebreide statistieken en voorrang in de verificatiewachtrij.',
        descriptionEn: 'Lower commission (10%), extended statistics and priority in the verification queue.',
        priceCents: 1900,
        monthlyCredits: 0,
        commissionBps: 1000,
      },
    ],
  });

  console.log('· platform staff');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@skillpass.local',
      emailNormalised: 'admin@skillpass.local',
      passwordHash,
      displayName: 'Platform Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
      locale: 'NL',
      emailVerifiedAt: new Date(),
    },
  });
  const officer = await prisma.user.create({
    data: {
      email: 'safeguarding@skillpass.local',
      emailNormalised: 'safeguarding@skillpass.local',
      passwordHash,
      displayName: 'Safeguarding Officer',
      role: 'SAFEGUARDING_OFFICER',
      status: 'ACTIVE',
      locale: 'EN',
      emailVerifiedAt: new Date(),
    },
  });

  console.log('· providers, venues and staff');
  const providerBySlug = new Map<string, { id: string; venueId: string; ownerId: string }>();

  for (const seed of PROVIDERS) {
    const owner = await prisma.user.create({
      data: {
        email: `owner.${seed.slug}@skillpass.local`,
        emailNormalised: `owner.${seed.slug}@skillpass.local`,
        passwordHash,
        displayName: seed.contactPersonName,
        role: 'PROVIDER_STAFF',
        status: 'ACTIVE',
        locale: 'NL',
        emailVerifiedAt: new Date(),
      },
    });

    const approved = !seed.pending;
    const provider = await prisma.provider.create({
      data: {
        slug: seed.slug,
        legalName: seed.legalName,
        displayName: seed.displayName,
        description: seed.descriptionNl,
        chamberOfCommerceNo: seed.kvk,
        contactPersonName: seed.contactPersonName,
        contactEmail: seed.contactEmail,
        contactPhone: '+31 30 555 0100',
        websiteUrl: `https://${seed.slug}.local`,
        status: approved ? 'APPROVED' : 'PENDING_REVIEW',
        approvedAt: approved ? new Date() : null,
        liabilityInsurer: 'Onderlinge Verzekering Sport',
        liabilityPolicyNo: `POL-${seed.kvk}`,
        insuranceExpiresAt: at(300, 12),
        safeguardingPolicyUrl: `https://${seed.slug}.local/veiligheid`,
        vogDeclared: true,
        payoutAccountRef: `mock_acct_${seed.slug}`,
        commissionBps: 1500,
      },
    });

    await prisma.providerStaff.create({
      data: { providerId: provider.id, userId: owner.id, role: 'OWNER', vogVerifiedAt: approved ? new Date() : null },
    });

    const documentTypes = ['CHAMBER_OF_COMMERCE', 'LIABILITY_INSURANCE', 'VOG_DECLARATION', 'SAFEGUARDING_POLICY'] as const;
    for (const documentType of documentTypes) {
      await prisma.providerVerification.create({
        data: {
          providerId: provider.id,
          documentType,
          reference: documentType === 'CHAMBER_OF_COMMERCE' ? seed.kvk : `${documentType}-${seed.kvk}`,
          decision: approved ? 'APPROVED' : 'PENDING',
          reviewerId: approved ? admin.id : null,
          reviewerNote: approved ? 'Documents checked manually against the submitted evidence.' : null,
          decidedAt: approved ? new Date() : null,
          expiresAt: at(360, 12),
        },
      });
    }

    const venue = await prisma.venue.create({
      data: {
        providerId: provider.id,
        name: seed.venueName,
        addressLine1: seed.addressLine1,
        postalCode: seed.postalCode,
        cityId: utrecht.id,
        latitude: seed.latitude,
        longitude: seed.longitude,
        ...approximate(seed.latitude, seed.longitude),
        wheelchairAccessible: seed.wheelchairAccessible,
        accessibilityNotes: seed.wheelchairAccessible
          ? 'Toegankelijk via de hoofdingang; aangepast toilet aanwezig.'
          : 'Er is een drempel bij de ingang en geen lift naar de eerste verdieping.',
      },
    });

    providerBySlug.set(seed.slug, { id: provider.id, venueId: venue.id, ownerId: owner.id });
  }

  // The first provider also gets a manager and an instructor so provider-side
  // permissions and attendance recording can be demonstrated.
  const flagship = providerBySlug.get('sportclub-de-vechtstroom')!;
  const managerUser = await prisma.user.create({
    data: {
      email: 'provider@skillpass.local',
      emailNormalised: 'provider@skillpass.local',
      passwordHash,
      displayName: 'Rachid Bouzid',
      role: 'PROVIDER_STAFF',
      status: 'ACTIVE',
      locale: 'NL',
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.providerStaff.create({
    data: { providerId: flagship.id, userId: managerUser.id, role: 'MANAGER', vogVerifiedAt: new Date() },
  });

  const instructorUser = await prisma.user.create({
    data: {
      email: 'instructor@skillpass.local',
      emailNormalised: 'instructor@skillpass.local',
      passwordHash,
      displayName: 'Fleur Bosman',
      role: 'PROVIDER_STAFF',
      status: 'ACTIVE',
      locale: 'NL',
      emailVerifiedAt: new Date(),
    },
  });
  const instructorStaff = await prisma.providerStaff.create({
    data: { providerId: flagship.id, userId: instructorUser.id, role: 'INSTRUCTOR', vogVerifiedAt: new Date() },
  });

  console.log('· activities, translations and sessions');
  let activityCount = 0;
  let sessionCount = 0;
  const sessionsByActivitySlug = new Map<string, { id: string; startsAt: Date }[]>();

  for (const [index, seed] of ACTIVITIES.entries()) {
    const provider = providerBySlug.get(seed.providerSlug);
    if (!provider) throw new Error(`Unknown provider ${seed.providerSlug}`);
    const providerSeed = PROVIDERS.find((p) => p.slug === seed.providerSlug)!;
    const publishable = !providerSeed.pending;

    const slug = `${seed.providerSlug}-${seed.nl.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}`.slice(0, 90);

    const activity = await prisma.activity.create({
      data: {
        providerId: provider.id,
        venueId: provider.venueId,
        instructorId: seed.providerSlug === 'sportclub-de-vechtstroom' ? instructorStaff.id : null,
        slug,
        category: seed.category,
        level: seed.level,
        status: publishable ? 'PUBLISHED' : 'PENDING_REVIEW',
        publishedAt: publishable ? new Date() : null,
        minAgeBand: seed.minAgeBand,
        maxAgeBand: seed.maxAgeBand,
        creditCost: seed.creditCost,
        listPriceCents: seed.listPriceCents,
        currency: 'EUR',
        languages: seed.languages,
        wheelchairAccessible: seed.wheelchairAccessible ?? false,
        sensoryFriendly: seed.sensoryFriendly ?? false,
        trialAvailable: seed.trialAvailable ?? false,
        equipmentProvided: seed.equipmentProvided ?? true,
        cancellationHours: seed.cancellationHours ?? 24,
        interests: {
          connect: seed.interests
            .map((interestSlug) => interestBySlug.get(interestSlug))
            .filter((id): id is string => Boolean(id))
            .map((id) => ({ id })),
        },
        translations: {
          create: [
            {
              locale: 'NL',
              title: seed.nl.title,
              summary: seed.nl.summary,
              description: seed.nl.description,
              whatToBring: seed.nl.whatToBring ?? null,
              safetyNotes: seed.nl.safetyNotes ?? null,
              cancellationTerms: `Kosteloos annuleren tot ${seed.cancellationHours ?? 24} uur voor aanvang. Daarna worden de credits niet teruggestort.`,
            },
            {
              locale: 'EN',
              title: seed.en.title,
              summary: seed.en.summary,
              description: seed.en.description,
              whatToBring: seed.en.whatToBring ?? null,
              safetyNotes: seed.en.safetyNotes ?? null,
              cancellationTerms: `Free cancellation up to ${seed.cancellationHours ?? 24} hours before the start. After that credits are not returned.`,
            },
          ],
        },
      },
    });
    activityCount += 1;

    // Two sessions in the past (so attendance and reviews exist) and six ahead.
    const weekday = index % 5; // spread across Mon–Fri
    const hour = 15 + (index % 3);
    const offsets = [-14, -7, 2, 9, 16, 23, 30, 37].map((d) => d + weekday);
    const created: { id: string; startsAt: Date }[] = [];

    for (const offset of offsets) {
      const startsAt = at(offset, hour);
      const endsAt = at(offset, hour + 1, 30);
      const isPast = offset < 0;
      const session = await prisma.session.create({
        data: {
          activityId: activity.id,
          startsAt,
          endsAt,
          status: isPast ? 'COMPLETED' : 'SCHEDULED',
          capacity: { create: { totalSeats: seed.seats, waitlistLimit: 10 } },
        },
      });
      created.push({ id: session.id, startsAt });
      sessionCount += 1;
    }
    sessionsByActivitySlug.set(seed.providerSlug + '::' + seed.nl.title, created);
  }

  console.log('· demo family');
  const guardian = await prisma.user.create({
    data: {
      email: 'guardian@skillpass.local',
      emailNormalised: 'guardian@skillpass.local',
      passwordHash,
      displayName: 'Fatima Haddad',
      phone: '+31 6 1234 5678',
      role: 'GUARDIAN',
      status: 'ACTIVE',
      locale: 'NL',
      emailVerifiedAt: new Date(),
    },
  });
  const coGuardian = await prisma.user.create({
    data: {
      email: 'guardian2@skillpass.local',
      emailNormalised: 'guardian2@skillpass.local',
      passwordHash,
      displayName: 'Youssef Haddad',
      role: 'GUARDIAN',
      status: 'ACTIVE',
      locale: 'EN',
      emailVerifiedAt: new Date(),
    },
  });

  const family = await prisma.family.create({
    data: {
      name: 'Familie Haddad',
      cityId: utrecht.id,
      locale: 'NL',
      currency: 'EUR',
      memberships: {
        create: [
          { userId: guardian.id, role: 'OWNER' },
          { userId: coGuardian.id, role: 'CO_GUARDIAN' },
        ],
      },
    },
  });

  await prisma.consent.createMany({
    data: [
      { userId: guardian.id, type: 'TERMS_OF_SERVICE', granted: true, version: '2026-01' },
      { userId: guardian.id, type: 'PRIVACY_POLICY', granted: true, version: '2026-01' },
      { userId: guardian.id, type: 'CHILD_DATA_PROCESSING', granted: true, version: '2026-01' },
      { userId: guardian.id, type: 'MARKETING_EMAIL', granted: false, version: '2026-01' },
    ],
  });

  const nour = await prisma.childProfile.create({
    data: {
      familyId: family.id,
      nickname: 'Nour',
      ageBand: 'AGE_9_11',
      pronouns: 'zij/haar',
      preferredLanguages: ['NL', 'EN'],
      accessibilityNeeds: 'Heeft baat bij een rustige, prikkelarme ruimte.',
      interests: {
        connect: ['drawing', 'ceramics', 'experiments', 'hiphop']
          .map((s) => interestBySlug.get(s))
          .filter((id): id is string => Boolean(id))
          .map((id) => ({ id })),
      },
    },
  });

  const sami = await prisma.childProfile.create({
    data: {
      familyId: family.id,
      nickname: 'Sami',
      ageBand: 'AGE_12_14',
      pronouns: 'hij/hem',
      preferredLanguages: ['NL'],
      medicalNotes: 'Pinda-allergie. EpiPen zit in de rugzak.',
      interests: {
        connect: ['coding', '3d-printing', 'climbing', 'baking']
          .map((s) => interestBySlug.get(s))
          .filter((id): id is string => Boolean(id))
          .map((id) => ({ id })),
      },
    },
  });

  console.log('· subscription, payment and credits');
  const plan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { slug: 'family-monthly-plus' } });
  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: {
      planId: plan.id,
      familyId: family.id,
      status: 'ACTIVE',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      externalRef: 'mock_cs_seeded_family',
    },
  });

  await prisma.payment.create({
    data: {
      familyId: family.id,
      subscriptionId: subscription.id,
      purpose: 'SUBSCRIPTION',
      amountCents: plan.priceCents,
      currency: 'EUR',
      status: 'SUCCEEDED',
      provider: 'mock',
      externalRef: 'mock_cs_seeded_family',
      paidAt: periodStart,
    },
  });

  let balance = 0;
  async function postCredits(input: {
    type: 'MONTHLY_GRANT' | 'SIGNUP_BONUS' | 'BOOKING_DEDUCTION' | 'CANCELLATION_REFUND' | 'ADMIN_ADJUSTMENT';
    delta: number;
    description: string;
    idempotencyKey: string;
    bookingId?: string;
  }) {
    balance += input.delta;
    return prisma.creditLedgerEntry.create({
      data: {
        familyId: family.id,
        subscriptionId: subscription.id,
        bookingId: input.bookingId ?? null,
        type: input.type,
        delta: input.delta,
        balanceAfter: balance,
        description: input.description,
        idempotencyKey: input.idempotencyKey,
        periodStart,
        periodEnd,
      },
    });
  }

  await postCredits({
    type: 'MONTHLY_GRANT',
    delta: plan.monthlyCredits,
    description: `Monthly credits — ${plan.slug}`,
    idempotencyKey: `grant:${subscription.id}:${periodStart.toISOString()}`,
  });
  await postCredits({
    type: 'SIGNUP_BONUS',
    delta: 4,
    description: 'Welcome bonus for the launch region',
    idempotencyKey: `bonus:${family.id}:launch`,
  });

  console.log('· bookings, attendance and a review');
  const ceramics = await prisma.activity.findFirstOrThrow({
    where: { slug: { contains: 'keramiek' } },
    include: { sessions: { orderBy: { startsAt: 'asc' } } },
  });
  const microscope = await prisma.activity.findFirstOrThrow({
    where: { slug: { contains: 'waterdiertjes' } },
    include: { sessions: { orderBy: { startsAt: 'asc' } } },
  });
  const microbit = await prisma.activity.findFirstOrThrow({
    where: { slug: { contains: 'micro-bit' } },
    include: { sessions: { orderBy: { startsAt: 'asc' } } },
  });

  // 1. A past session Nour attended — this is the reviewable booking.
  const pastSession = microscope.sessions[0]!;
  const attendedBooking = await prisma.booking.create({
    data: {
      reference: reference('BK'),
      familyId: family.id,
      childProfileId: nour.id,
      sessionId: pastSession.id,
      createdById: guardian.id,
      status: 'COMPLETED',
      creditsCharged: microscope.creditCost,
    },
  });
  await prisma.capacity.update({ where: { sessionId: pastSession.id }, data: { seatsTaken: { increment: 1 } } });
  await postCredits({
    type: 'BOOKING_DEDUCTION',
    delta: -microscope.creditCost,
    description: `Booking ${attendedBooking.reference}`,
    idempotencyKey: `booking:${attendedBooking.id}:charge`,
    bookingId: attendedBooking.id,
  });
  await prisma.attendance.create({
    data: {
      bookingId: attendedBooking.id,
      sessionId: pastSession.id,
      childProfileId: nour.id,
      status: 'ATTENDED',
      checkedInAt: pastSession.startsAt,
    },
  });
  await prisma.review.create({
    data: {
      bookingId: attendedBooking.id,
      activityId: microscope.id,
      familyId: family.id,
      authorId: guardian.id,
      rating: 5,
      title: 'Enthousiast thuisgekomen',
      body:
        'De begeleiders namen echt de tijd om uit te leggen hoe een microscoop werkt. Kleine groep, duidelijke uitleg en er was aandacht voor kinderen die het spannend vinden. Wij komen zeker terug.',
      status: 'PUBLISHED',
    },
  });

  // 2. An upcoming confirmed booking for Sami.
  const upcomingSession = microbit.sessions.find((s) => s.startsAt > new Date())!;
  const upcomingBooking = await prisma.booking.create({
    data: {
      reference: reference('BK'),
      familyId: family.id,
      childProfileId: sami.id,
      sessionId: upcomingSession.id,
      createdById: guardian.id,
      status: 'CONFIRMED',
      creditsCharged: microbit.creditCost,
    },
  });
  await prisma.capacity.update({ where: { sessionId: upcomingSession.id }, data: { seatsTaken: { increment: 1 } } });
  await postCredits({
    type: 'BOOKING_DEDUCTION',
    delta: -microbit.creditCost,
    description: `Booking ${upcomingBooking.reference}`,
    idempotencyKey: `booking:${upcomingBooking.id}:charge`,
    bookingId: upcomingBooking.id,
  });
  await prisma.attendance.create({
    data: {
      bookingId: upcomingBooking.id,
      sessionId: upcomingSession.id,
      childProfileId: sami.id,
      status: 'EXPECTED',
    },
  });

  // 3. A full session with Nour on the waitlist, so promotion can be demoed.
  const ceramicsSession = ceramics.sessions.find((s) => s.startsAt > new Date())!;
  await prisma.capacity.update({
    where: { sessionId: ceramicsSession.id },
    data: { seatsTaken: (await prisma.capacity.findUniqueOrThrow({ where: { sessionId: ceramicsSession.id } })).totalSeats },
  });
  await prisma.waitlistEntry.create({
    data: {
      sessionId: ceramicsSession.id,
      familyId: family.id,
      childProfileId: nour.id,
      position: 1,
      status: 'WAITING',
    },
  });

  await prisma.favourite.createMany({
    data: [
      { familyId: family.id, userId: guardian.id, activityId: ceramics.id, childProfileId: nour.id },
      { familyId: family.id, userId: guardian.id, activityId: microbit.id, childProfileId: sami.id },
    ],
  });

  console.log('· incident and safeguarding case');
  const incident = await prisma.incident.create({
    data: {
      reference: reference('INC'),
      providerId: flagship.id,
      reporterId: guardian.id,
      category: 'INJURY',
      severity: 'MEDIUM',
      status: 'OPEN',
      summary: 'Verstuikte enkel tijdens de turnles',
      details:
        'Tijdens de landing op de mat verstapte een kind zich. De begeleider heeft direct gekoeld en de ouder gebeld. Graag terugkoppeling over de matdikte bij de kast.',
      occurredAt: at(-3, 16),
    },
  });
  const safeguardingIncident = await prisma.incident.create({
    data: {
      reference: reference('INC'),
      providerId: flagship.id,
      reporterId: managerUser.id,
      category: 'SAFEGUARDING',
      severity: 'HIGH',
      status: 'ESCALATED',
      summary: 'Zorgmelding over toezicht in de kleedkamer',
      details:
        'Een ouder meldde dat er tijdens het omkleden geen tweede volwassene aanwezig was. Volgens ons vierogenprincipe moet dat wel. Graag beoordeling door de safeguarding officer.',
      occurredAt: at(-5, 17),
    },
  });
  await prisma.safeguardingCase.create({
    data: {
      reference: reference('SG'),
      incidentId: safeguardingIncident.id,
      officerId: officer.id,
      status: 'INVESTIGATING',
      caseNotes:
        'Aanbieder om rooster en aanwezigheidslijst gevraagd. Vierogenprincipe wordt opnieuw met alle staf doorgenomen voor de volgende les.',
    },
  });

  await prisma.notification.create({
    data: {
      userId: guardian.id,
      channel: 'IN_APP',
      category: 'BOOKING_CONFIRMED',
      titleNl: 'Boeking bevestigd',
      titleEn: 'Booking confirmed',
      bodyNl: `Sami is ingeschreven voor Programmeren met micro:bit. Referentie ${upcomingBooking.reference}.`,
      bodyEn: `Sami is booked for Coding with the micro:bit. Reference ${upcomingBooking.reference}.`,
      link: '/nl/bookings',
      sentAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      actorRole: 'ADMIN',
      action: 'seed.completed',
      entityType: 'System',
      metadata: { providers: PROVIDERS.length, activities: activityCount, sessions: sessionCount },
    },
  });

  const counts = {
    cities: await prisma.city.count(),
    interests: await prisma.interest.count(),
    providers: await prisma.provider.count(),
    activities: activityCount,
    sessions: sessionCount,
    users: await prisma.user.count(),
  };

  console.log('\nSeed complete:', counts);
  console.log(`
Development accounts (password for all: ${DEMO_PASSWORD})
  guardian@skillpass.local       Guardian with two children, active subscription
  guardian2@skillpass.local      Co-guardian on the same family
  provider@skillpass.local       Provider MANAGER at Sportclub De Vechtstroom
  instructor@skillpass.local     Provider INSTRUCTOR (check-in only)
  owner.<provider-slug>@skillpass.local   Owner of each seeded provider
  admin@skillpass.local          Platform administrator
  safeguarding@skillpass.local   Safeguarding officer
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

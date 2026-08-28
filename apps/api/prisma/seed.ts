/**
 * Seeds the catalog tables from @buurklus/shared, then — outside production —
 * a small set of demo accounts, jobs and quotes so the app has something to
 * show on first run. Safe to re-run: everything is upserted by slug or phone.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import {
  CATEGORIES,
  CITIES,
  PLANS,
  SUPPORTED_LOCALES,
  TRIAL_CREDITS,
  TRIAL_DURATION_DAYS,
  eurosToCents,
  normalizeDutchPhone,
} from '@buurklus/shared';

const prisma = new PrismaClient();

async function seedCities() {
  for (const city of CITIES) {
    const data = {
      nameNl: city.name.nl,
      nameEn: city.name.en,
      province: city.province,
      lat: city.lat,
      lng: city.lng,
      population: city.population,
    };
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: { slug: city.slug, ...data },
      update: data,
    });
  }
  console.log(`  gemeenten:   ${CITIES.length}`);
}

async function seedCategories() {
  // Two passes: roots first, so a child can always resolve its parent id.
  const ordered = [...CATEGORIES].sort(
    (a, b) => Number(a.parentSlug != null) - Number(b.parentSlug != null),
  );

  for (const [index, category] of ordered.entries()) {
    const parent = category.parentSlug
      ? await prisma.category.findUnique({ where: { slug: category.parentSlug } })
      : null;

    const data = {
      nameNl: category.name.nl,
      nameEn: category.name.en,
      icon: category.icon,
      parentId: parent?.id ?? null,
      position: index,
      typicalBudgetMinCents: category.typicalBudgetEur
        ? eurosToCents(category.typicalBudgetEur.min)
        : null,
      typicalBudgetMaxCents: category.typicalBudgetEur
        ? eurosToCents(category.typicalBudgetEur.max)
        : null,
    };

    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug, ...data },
      update: data,
    });
  }
  console.log(`  vakgebieden: ${CATEGORIES.length}`);
}

async function seedPlans() {
  for (const [index, plan] of PLANS.entries()) {
    // Perks are stored keyed by locale so the API can serve one language.
    const perks = Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [locale, plan.perks.map((perk) => perk[locale])]),
    ) as Prisma.InputJsonValue;

    const data = {
      nameNl: plan.name.nl,
      nameEn: plan.name.en,
      taglineNl: plan.tagline.nl,
      taglineEn: plan.tagline.en,
      monthlyPriceCents: eurosToCents(plan.monthlyPriceEur),
      yearlyPriceCents: eurosToCents(plan.yearlyPriceEur),
      monthlyCredits: plan.monthlyCredits,
      maxCategories: plan.maxCategories,
      maxCities: plan.maxCities,
      featured: plan.featured,
      leadHeadStartMinutes: plan.leadHeadStartMinutes,
      teamSeats: plan.teamSeats,
      perks,
      position: index,
    };

    await prisma.plan.upsert({
      where: { slug: plan.slug },
      create: { slug: plan.slug, ...data },
      update: data,
    });
  }
  console.log(`  pakketten:   ${PLANS.length}`);
}

/** Same reference format the API generates, so demo rows look real. */
function jobReference(index: number): string {
  return `BK-DEMO${index.toString().padStart(2, '0')}`;
}

async function seedDemoData() {
  const utrecht = await prisma.city.findUniqueOrThrow({ where: { slug: 'utrecht' } });
  const amersfoort = await prisma.city.findUniqueOrThrow({ where: { slug: 'amersfoort' } });
  const painting = await prisma.category.findUniqueOrThrow({
    where: { slug: 'binnenschilderwerk' },
  });
  const leak = await prisma.category.findUniqueOrThrow({ where: { slug: 'lekkage' } });
  const vakmanPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: 'vakman' } });

  const customer = await prisma.user.upsert({
    where: { phone: normalizeDutchPhone('0600000001') },
    create: {
      phone: normalizeDutchPhone('0600000001'),
      phoneVerifiedAt: new Date(),
      firstName: 'Sanne',
      lastName: 'de Vries',
      locale: 'nl',
      role: 'CUSTOMER',
      cityId: utrecht.id,
    },
    update: {},
  });

  const proUser = await prisma.user.upsert({
    where: { phone: normalizeDutchPhone('0600000002') },
    create: {
      phone: normalizeDutchPhone('0600000002'),
      phoneVerifiedAt: new Date(),
      firstName: 'Joost',
      lastName: 'Bakker',
      locale: 'nl',
      role: 'PRO',
      cityId: utrecht.id,
    },
    update: {},
  });

  const pro = await prisma.proProfile.upsert({
    where: { userId: proUser.id },
    create: {
      userId: proUser.id,
      displayName: 'Schildersbedrijf Bakker',
      legalForm: 'BV',
      bio: 'Schildersbedrijf uit Utrecht, achttien jaar ervaring met binnen- en buitenschilderwerk voor particulieren en VvE’s.',
      yearsExperience: 18,
      teamSize: 6,
      baseCityId: utrecht.id,
      serviceRadiusKm: 45,
      kvk: '30123456',
      vatId: 'NL123456789B01',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date(),
      ratingAverage: 4.7,
      ratingCount: 34,
      quotesSent: 96,
      jobsWon: 41,
      medianResponseMinutes: 42,
    },
    update: {},
  });

  await prisma.proTrade.createMany({
    data: [
      { proId: pro.id, categoryId: painting.id, isPrimary: true },
      { proId: pro.id, categoryId: leak.id, isPrimary: false },
    ],
    skipDuplicates: true,
  });
  await prisma.proCoverage.createMany({
    data: [
      { proId: pro.id, cityId: utrecht.id },
      { proId: pro.id, cityId: amersfoort.id },
    ],
    skipDuplicates: true,
  });

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DURATION_DAYS * 86_400_000);
  const existingSubscription = await prisma.subscription.findFirst({ where: { proId: pro.id } });
  if (!existingSubscription) {
    const subscription = await prisma.subscription.create({
      data: {
        proId: pro.id,
        planId: vakmanPlan.id,
        status: 'TRIALING',
        period: 'MONTHLY',
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        trialEndsAt: trialEnd,
        creditsRemaining: TRIAL_CREDITS,
      },
    });
    await prisma.creditLedgerEntry.create({
      data: {
        proId: pro.id,
        subscriptionId: subscription.id,
        delta: TRIAL_CREDITS,
        balanceAfter: TRIAL_CREDITS,
        reason: 'TRIAL_GRANT',
        note: `Gratis proefperiode van ${TRIAL_DURATION_DAYS} dagen`,
      },
    });
  }

  const demoJobs = [
    {
      reference: jobReference(1),
      categoryId: painting.id,
      cityId: utrecht.id,
      title: 'Woonkamer en hal schilderen, samen 40 m²',
      description:
        'Woonkamer van 30 m² en hal van 10 m² opnieuw schilderen in gebroken wit. De muren zijn in goede staat, rond de kozijnen moet wat gestuct worden. Verf mag door de schilder geleverd worden. Graag doordeweeks.',
      district: 'Wittevrouwen',
      urgency: 'WITHIN_WEEK' as const,
      propertyType: 'TUSSENWONING' as const,
      budgetMinCents: eurosToCents(800),
      budgetMaxCents: eurosToCents(1600),
    },
    {
      reference: jobReference(2),
      categoryId: leak.id,
      cityId: amersfoort.id,
      title: 'Lekkage onder de gootsteen',
      description:
        'Sinds twee dagen lekt het onder de gootsteen zodra de kraan openstaat. Het keukenkastje begint te zwellen. Ik zoek iemand die snel langs kan komen om het te bekijken en te verhelpen.',
      district: 'Soesterkwartier',
      urgency: 'URGENT' as const,
      propertyType: 'APPARTEMENT' as const,
      budgetMinCents: eurosToCents(90),
      budgetMaxCents: eurosToCents(400),
    },
  ];

  for (const job of demoJobs) {
    await prisma.job.upsert({
      where: { reference: job.reference },
      create: {
        ...job,
        customerId: customer.id,
        status: 'OPEN',
        publishedAt: now,
        expiresAt: new Date(now.getTime() + 30 * 86_400_000),
      },
      update: {},
    });
  }

  console.log('  demo:        1 klant, 1 vakman, 2 open klussen');
  console.log('               inloggen met 0600000001 (klant) of 0600000002 (vakman)');
}

async function main() {
  console.log('Buurklus vullen…');
  await seedCities();
  await seedCategories();
  await seedPlans();

  if (process.env.NODE_ENV !== 'production' && process.env.SKIP_DEMO_SEED !== 'true') {
    await seedDemoData();
  }
  console.log('Klaar.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

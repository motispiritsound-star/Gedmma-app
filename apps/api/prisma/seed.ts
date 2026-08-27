/**
 * Seeds the catalog tables from @khidma/shared, then — outside production —
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
  dirhamsToCentimes,
  normalizeMoroccanPhone,
} from '@khidma/shared';

const prisma = new PrismaClient();

async function seedCities() {
  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: {
        slug: city.slug,
        nameFr: city.name.fr,
        nameAr: city.name.ar,
        nameEn: city.name.en,
        region: city.region,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
      },
      update: {
        nameFr: city.name.fr,
        nameAr: city.name.ar,
        nameEn: city.name.en,
        region: city.region,
        lat: city.lat,
        lng: city.lng,
        population: city.population,
      },
    });
  }
  console.log(`  cities:     ${CITIES.length}`);
}

async function seedCategories() {
  // Two passes: roots first, so a child can always resolve its parent id.
  const ordered = [...CATEGORIES].sort((a, b) => Number(a.parentSlug != null) - Number(b.parentSlug != null));

  for (const [index, category] of ordered.entries()) {
    const parent = category.parentSlug
      ? await prisma.category.findUnique({ where: { slug: category.parentSlug } })
      : null;

    const data = {
      nameFr: category.name.fr,
      nameAr: category.name.ar,
      nameEn: category.name.en,
      icon: category.icon,
      parentId: parent?.id ?? null,
      position: index,
      typicalBudgetMinCentimes: category.typicalBudgetMad
        ? dirhamsToCentimes(category.typicalBudgetMad.min)
        : null,
      typicalBudgetMaxCentimes: category.typicalBudgetMad
        ? dirhamsToCentimes(category.typicalBudgetMad.max)
        : null,
    };

    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug, ...data },
      update: data,
    });
  }
  console.log(`  categories: ${CATEGORIES.length}`);
}

async function seedPlans() {
  for (const [index, plan] of PLANS.entries()) {
    // Perks are stored keyed by locale so the API can serve one language.
    const perks = Object.fromEntries(
      SUPPORTED_LOCALES.map((locale) => [locale, plan.perks.map((perk) => perk[locale])]),
    ) as Prisma.InputJsonValue;

    const data = {
      nameFr: plan.name.fr,
      nameAr: plan.name.ar,
      nameEn: plan.name.en,
      taglineFr: plan.tagline.fr,
      taglineAr: plan.tagline.ar,
      taglineEn: plan.tagline.en,
      monthlyPriceCentimes: dirhamsToCentimes(plan.monthlyPriceMad),
      yearlyPriceCentimes: dirhamsToCentimes(plan.yearlyPriceMad),
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
  console.log(`  plans:      ${PLANS.length}`);
}

/** Same reference format the API generates, so demo rows look real. */
function jobReference(index: number): string {
  return `KH-DEMO${index.toString().padStart(2, '0')}`;
}

async function seedDemoData() {
  const casablanca = await prisma.city.findUniqueOrThrow({ where: { slug: 'casablanca' } });
  const rabat = await prisma.city.findUniqueOrThrow({ where: { slug: 'rabat' } });
  const painting = await prisma.category.findUniqueOrThrow({ where: { slug: 'peinture-interieure' } });
  const plumbing = await prisma.category.findUniqueOrThrow({ where: { slug: 'fuite-eau' } });
  const proPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: 'pro' } });

  const customer = await prisma.user.upsert({
    where: { phone: normalizeMoroccanPhone('0600000001') },
    create: {
      phone: normalizeMoroccanPhone('0600000001'),
      phoneVerifiedAt: new Date(),
      firstName: 'Salma',
      lastName: 'Benali',
      locale: 'fr',
      role: 'CUSTOMER',
      cityId: casablanca.id,
    },
    update: {},
  });

  const proUser = await prisma.user.upsert({
    where: { phone: normalizeMoroccanPhone('0600000002') },
    create: {
      phone: normalizeMoroccanPhone('0600000002'),
      phoneVerifiedAt: new Date(),
      firstName: 'Youssef',
      lastName: 'El Amrani',
      locale: 'fr',
      role: 'PRO',
      cityId: casablanca.id,
    },
    update: {},
  });

  const pro = await prisma.proProfile.upsert({
    where: { userId: proUser.id },
    create: {
      userId: proUser.id,
      displayName: 'Peinture El Amrani',
      legalForm: 'SARL',
      bio: "Entreprise de peinture et décoration basée à Casablanca, 18 ans d'expérience sur des chantiers résidentiels et de bureaux.",
      yearsExperience: 18,
      teamSize: 6,
      baseCityId: casablanca.id,
      serviceRadiusKm: 45,
      ice: '001234567000012',
      rc: '482913',
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
      { proId: pro.id, categoryId: plumbing.id, isPrimary: false },
    ],
    skipDuplicates: true,
  });
  await prisma.proCoverage.createMany({
    data: [
      { proId: pro.id, cityId: casablanca.id },
      { proId: pro.id, cityId: rabat.id },
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
        planId: proPlan.id,
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
        note: `Essai gratuit de ${TRIAL_DURATION_DAYS} jours`,
      },
    });
  }

  const demoJobs = [
    {
      reference: jobReference(1),
      categoryId: painting.id,
      cityId: casablanca.id,
      title: 'Peindre un salon et un couloir de 40 m²',
      description:
        "Salon de 30 m² et couloir de 10 m² à repeindre en blanc mat. Les murs sont en bon état, un léger rebouchage sera nécessaire près des fenêtres. Je fournis la peinture si nécessaire. Intervention souhaitée en semaine.",
      district: 'Maârif',
      urgency: 'WITHIN_WEEK' as const,
      budgetMinCentimes: dirhamsToCentimes(3000),
      budgetMaxCentimes: dirhamsToCentimes(6000),
    },
    {
      reference: jobReference(2),
      categoryId: plumbing.id,
      cityId: rabat.id,
      title: "Fuite d'eau sous l'évier de la cuisine",
      description:
        "Une fuite s'est déclarée sous l'évier depuis deux jours, l'eau coule dès que le robinet est ouvert. Le meuble commence à gonfler. Je cherche quelqu'un qui puisse passer rapidement pour diagnostiquer et réparer.",
      district: 'Agdal',
      urgency: 'URGENT' as const,
      budgetMinCentimes: dirhamsToCentimes(300),
      budgetMaxCentimes: dirhamsToCentimes(1200),
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

  console.log('  demo:       1 customer, 1 pro, 2 open jobs');
  console.log('              sign in with 0600000001 (client) or 0600000002 (pro)');
}

async function main() {
  console.log('Seeding Khidma…');
  await seedCities();
  await seedCategories();
  await seedPlans();

  if (process.env.NODE_ENV !== 'production' && process.env.SKIP_DEMO_SEED !== 'true') {
    await seedDemoData();
  }
  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

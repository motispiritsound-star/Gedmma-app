import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';
import type { SessionUser } from '@/lib/auth/session';
import type { ActivityCategory, AgeBand, ProviderStatus, UserRole } from '@prisma/client';

const TABLES = [
  'AuditLog',
  'Notification',
  'ProviderMessage',
  'SafeguardingCase',
  'Incident',
  'Review',
  'Favourite',
  'Attendance',
  'WaitlistEntry',
  'Booking',
  'CreditLedgerEntry',
  'Refund',
  'Payment',
  'Payout',
  'WebhookEvent',
  'Subscription',
  'SubscriptionPlan',
  'Capacity',
  'Session',
  'ActivityTranslation',
  'Activity',
  'MediaAsset',
  'ProviderVerification',
  'ProviderStaff',
  'Venue',
  'Provider',
  'ChildProfile',
  'Interest',
  'FamilyMembership',
  'Family',
  'Consent',
  'EmailToken',
  'AuthSession',
  'User',
  'City',
];

/**
 * Per-test truncation is on by default. A file that installs its own fixture
 * once (the seed test) turns it off so the shared beforeEach does not wipe it.
 */
let autoTruncate = true;

export function setAutoTruncate(enabled: boolean): void {
  autoTruncate = enabled;
}

export function isAutoTruncateEnabled(): boolean {
  return autoTruncate;
}

export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE;`,
  );
}

export function sessionUser(user: {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}): SessionUser {
  return { ...user, locale: 'NL', emailVerified: true };
}

export async function createUser(options: {
  email: string;
  role?: UserRole;
  displayName?: string;
  password?: string;
}) {
  return prisma.user.create({
    data: {
      email: options.email,
      emailNormalised: options.email.toLowerCase(),
      passwordHash: await hashPassword(options.password ?? 'CorrectHorseBattery1'),
      displayName: options.displayName ?? options.email.split('@')[0]!,
      role: options.role ?? 'GUARDIAN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
}

export async function createGuardianWithFamily(email = 'guardian@test.local') {
  const user = await createUser({ email, role: 'GUARDIAN' });
  const family = await prisma.family.create({
    data: { name: `Family ${email}`, memberships: { create: { userId: user.id, role: 'OWNER' } } },
  });
  return { user, family, viewer: sessionUser(user) };
}

export async function createCity(slug = 'utrecht') {
  return prisma.city.create({
    data: { slug, name: 'Utrecht', countryCode: 'NL', latitude: 52.0907, longitude: 5.1214, isLaunchCity: true },
  });
}

export interface ProviderFixture {
  providerId: string;
  venueId: string;
  ownerId: string;
  owner: SessionUser;
  staffId: string;
}

export async function createProvider(options: {
  slug: string;
  cityId: string;
  status?: ProviderStatus;
  ownerEmail?: string;
}): Promise<ProviderFixture> {
  const owner = await createUser({
    email: options.ownerEmail ?? `owner.${options.slug}@test.local`,
    role: 'PROVIDER_STAFF',
  });

  const provider = await prisma.provider.create({
    data: {
      slug: options.slug,
      legalName: `${options.slug} B.V.`,
      displayName: options.slug,
      description: 'A seeded test provider offering activities for children.',
      contactPersonName: 'Test Contact',
      contactEmail: `contact.${options.slug}@test.local`,
      status: options.status ?? 'APPROVED',
      approvedAt: (options.status ?? 'APPROVED') === 'APPROVED' ? new Date() : null,
      commissionBps: 1500,
    },
  });

  const staff = await prisma.providerStaff.create({
    data: { providerId: provider.id, userId: owner.id, role: 'OWNER' },
  });

  const venue = await prisma.venue.create({
    data: {
      providerId: provider.id,
      name: `${options.slug} venue`,
      addressLine1: 'Teststraat 1',
      postalCode: '3511 AA',
      cityId: options.cityId,
      latitude: 52.09,
      longitude: 5.12,
      approxLatitude: 52.09,
      approxLongitude: 5.12,
    },
  });

  return {
    providerId: provider.id,
    venueId: venue.id,
    ownerId: owner.id,
    owner: sessionUser(owner),
    staffId: staff.id,
  };
}

export async function createActivity(options: {
  provider: ProviderFixture;
  category?: ActivityCategory;
  minAgeBand?: AgeBand;
  maxAgeBand?: AgeBand;
  creditCost?: number;
  published?: boolean;
  titleNl?: string;
  titleEn?: string;
  slug?: string;
}) {
  const published = options.published ?? true;
  return prisma.activity.create({
    data: {
      providerId: options.provider.providerId,
      venueId: options.provider.venueId,
      slug: options.slug ?? `activity-${Math.random().toString(36).slice(2, 10)}`,
      category: options.category ?? 'SPORTS',
      status: published ? 'PUBLISHED' : 'DRAFT',
      publishedAt: published ? new Date() : null,
      minAgeBand: options.minAgeBand ?? 'AGE_6_8',
      maxAgeBand: options.maxAgeBand ?? 'AGE_15_17',
      creditCost: options.creditCost ?? 2,
      listPriceCents: 1500,
      languages: ['NL', 'EN'],
      translations: {
        create: [
          {
            locale: 'NL',
            title: options.titleNl ?? 'Testactiviteit',
            summary: 'Een korte Nederlandse samenvatting.',
            description: 'Een volledige Nederlandse beschrijving van deze testactiviteit voor kinderen.',
          },
          {
            locale: 'EN',
            title: options.titleEn ?? 'Test activity',
            summary: 'A short English summary.',
            description: 'A full English description of this test activity for children.',
          },
        ],
      },
    },
  });
}

export async function createSession(options: {
  activityId: string;
  totalSeats?: number;
  startsInHours?: number;
  waitlistLimit?: number;
}) {
  const startsAt = new Date(Date.now() + (options.startsInHours ?? 72) * 3_600_000);
  const endsAt = new Date(startsAt.getTime() + 90 * 60_000);
  return prisma.session.create({
    data: {
      activityId: options.activityId,
      startsAt,
      endsAt,
      capacity: { create: { totalSeats: options.totalSeats ?? 1, waitlistLimit: options.waitlistLimit ?? 10 } },
    },
    include: { capacity: true },
  });
}

export async function createChild(familyId: string, options: { nickname?: string; ageBand?: AgeBand } = {}) {
  return prisma.childProfile.create({
    data: {
      familyId,
      nickname: options.nickname ?? 'Kiddo',
      ageBand: options.ageBand ?? 'AGE_9_11',
      preferredLanguages: ['NL'],
    },
  });
}

/** Grants credits directly through the ledger, bypassing the payment flow. */
export async function grantCredits(familyId: string, amount: number, key = `test-grant-${Math.random()}`) {
  const latest = await prisma.creditLedgerEntry.findFirst({
    where: { familyId },
    orderBy: { createdAt: 'desc' },
    select: { balanceAfter: true },
  });
  return prisma.creditLedgerEntry.create({
    data: {
      familyId,
      type: 'ADMIN_ADJUSTMENT',
      delta: amount,
      balanceAfter: (latest?.balanceAfter ?? 0) + amount,
      description: 'Test credits',
      idempotencyKey: key,
    },
  });
}

export async function createPlan(options: { slug: string; priceCents: number; monthlyCredits: number }) {
  return prisma.subscriptionPlan.create({
    data: {
      slug: options.slug,
      tier: options.priceCents === 0 ? 'FREE_DISCOVERY' : 'FAMILY_MONTHLY',
      audience: 'GUARDIAN',
      nameNl: `Plan ${options.slug}`,
      nameEn: `Plan ${options.slug}`,
      descriptionNl: 'Testabonnement.',
      descriptionEn: 'Test subscription.',
      priceCents: options.priceCents,
      monthlyCredits: options.monthlyCredits,
    },
  });
}

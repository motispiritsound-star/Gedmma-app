import { z } from 'zod';
import type { Locale as DbLocale } from '@prisma/client';
import { prisma } from '@/lib/db';
import { audit } from '@/lib/audit';
import { AuthorizationError, NotFoundError, ValidationError } from '@/lib/errors';
import { requireProviderAccess } from '@/lib/auth/rbac';
import { slugify } from '@/lib/slug';
import type { SessionUser } from '@/lib/auth/session';

const translationSchema = z.object({
  locale: z.enum(['NL', 'EN']),
  title: z.string().trim().min(4).max(120),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(40).max(4000),
  whatToBring: z.string().trim().max(500).optional().or(z.literal('')),
  safetyNotes: z.string().trim().max(1000).optional().or(z.literal('')),
  cancellationTerms: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const activitySchema = z.object({
  venueId: z.string().cuid(),
  instructorId: z.string().cuid().optional().or(z.literal('')),
  category: z.enum([
    'SPORTS',
    'MUSIC',
    'COOKING',
    'ART',
    'CRAFTS',
    'TECHNOLOGY',
    'NATURE',
    'THEATRE',
    'PRACTICAL_SKILLS',
    'DANCE',
    'LANGUAGES',
    'SCIENCE',
  ]),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).default('ALL_LEVELS'),
  minAgeBand: z.enum(['AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17']),
  maxAgeBand: z.enum(['AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17']),
  creditCost: z.coerce.number().int().min(1).max(20),
  listPriceCents: z.coerce.number().int().min(0).max(50_000),
  languages: z.array(z.enum(['NL', 'EN'])).min(1).default(['NL']),
  wheelchairAccessible: z.boolean().default(false),
  sensoryFriendly: z.boolean().default(false),
  trialAvailable: z.boolean().default(false),
  equipmentProvided: z.boolean().default(true),
  cancellationHours: z.coerce.number().int().min(0).max(336).default(24),
  interestSlugs: z.array(z.string()).max(10).default([]),
  /** Both NL and EN are required: the marketplace is bilingual by contract. */
  translations: z.array(translationSchema).min(2).max(2),
});

export type ActivityInput = z.infer<typeof activitySchema>;

function assertBilingual(translations: ActivityInput['translations']) {
  const locales = new Set(translations.map((t) => t.locale));
  if (!locales.has('NL') || !locales.has('EN')) {
    throw new ValidationError('An activity needs both a Dutch and an English translation');
  }
}

export async function createActivity(user: SessionUser, providerId: string, input: ActivityInput) {
  await requireProviderAccess(user, providerId, 'activities:write');
  assertBilingual(input.translations);

  // The venue must belong to the same provider — never trust a submitted id.
  const venue = await prisma.venue.findFirst({ where: { id: input.venueId, providerId } });
  if (!venue) throw new AuthorizationError('That venue does not belong to your organisation');

  const order = ['AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17'];
  if (order.indexOf(input.minAgeBand) > order.indexOf(input.maxAgeBand)) {
    throw new ValidationError('The minimum age band must not be higher than the maximum');
  }

  const nlTitle = input.translations.find((t) => t.locale === 'NL')?.title ?? 'activity';
  const baseSlug = slugify(`${nlTitle}-${Math.random().toString(36).slice(2, 7)}`);

  const interests = input.interestSlugs.length
    ? await prisma.interest.findMany({ where: { slug: { in: input.interestSlugs } }, select: { id: true } })
    : [];

  const activity = await prisma.activity.create({
    data: {
      providerId,
      venueId: input.venueId,
      instructorId: input.instructorId || null,
      slug: baseSlug,
      category: input.category,
      level: input.level,
      status: 'DRAFT',
      minAgeBand: input.minAgeBand,
      maxAgeBand: input.maxAgeBand,
      creditCost: input.creditCost,
      listPriceCents: input.listPriceCents,
      languages: input.languages,
      wheelchairAccessible: input.wheelchairAccessible,
      sensoryFriendly: input.sensoryFriendly,
      trialAvailable: input.trialAvailable,
      equipmentProvided: input.equipmentProvided,
      cancellationHours: input.cancellationHours,
      interests: { connect: interests.map((i) => ({ id: i.id })) },
      translations: {
        create: input.translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          summary: t.summary,
          description: t.description,
          whatToBring: t.whatToBring || null,
          safetyNotes: t.safetyNotes || null,
          cancellationTerms: t.cancellationTerms || null,
        })),
      },
    },
    include: { translations: true },
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'provider.activity_created',
    entityType: 'Activity',
    entityId: activity.id,
    metadata: { providerId },
  });
  return activity;
}

/**
 * Publication gate. An activity can only become visible when the provider has
 * been approved by a human administrator; this is the single choke point.
 */
export async function publishActivity(user: SessionUser, providerId: string, activityId: string) {
  const context = await requireProviderAccess(user, providerId, 'activities:publish');

  if (context.providerStatus !== 'APPROVED') {
    throw new AuthorizationError('Activities can only be published after your organisation has been verified');
  }

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, providerId },
    include: { translations: true },
  });
  if (!activity) throw new NotFoundError('Activity not found');
  const locales = new Set(activity.translations.map((t) => t.locale));
  if (!locales.has('NL') || !locales.has('EN')) {
    throw new ValidationError('Add both a Dutch and an English description before publishing');
  }

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'provider.activity_published',
    entityType: 'Activity',
    entityId: activityId,
    metadata: { providerId },
  });
  return updated;
}

export async function unpublishActivity(user: SessionUser, providerId: string, activityId: string) {
  await requireProviderAccess(user, providerId, 'activities:publish');
  const activity = await prisma.activity.findFirst({ where: { id: activityId, providerId } });
  if (!activity) throw new NotFoundError('Activity not found');
  return prisma.activity.update({ where: { id: activityId }, data: { status: 'DRAFT' } });
}

export const sessionSchema = z
  .object({
    activityId: z.string().cuid(),
    startsAt: z.string(),
    endsAt: z.string(),
    totalSeats: z.coerce.number().int().min(1).max(200),
    waitlistLimit: z.coerce.number().int().min(0).max(200).default(20),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    message: 'The session must end after it starts',
    path: ['endsAt'],
  });

export async function createSession(user: SessionUser, providerId: string, input: z.infer<typeof sessionSchema>) {
  await requireProviderAccess(user, providerId, 'sessions:write');
  const activity = await prisma.activity.findFirst({ where: { id: input.activityId, providerId } });
  if (!activity) throw new AuthorizationError('That activity does not belong to your organisation');

  const session = await prisma.session.create({
    data: {
      activityId: input.activityId,
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      capacity: { create: { totalSeats: input.totalSeats, waitlistLimit: input.waitlistLimit } },
    },
    include: { capacity: true },
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'provider.session_created',
    entityType: 'Session',
    entityId: session.id,
    metadata: { providerId, activityId: input.activityId },
  });
  return session;
}

/** Public activity detail. Only the coarse location unless `exactLocation`. */
export async function getActivityDetail(idOrSlug: string, locale: DbLocale, options: { exactLocation?: boolean } = {}) {
  const activity = await prisma.activity.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: {
      provider: true,
      venue: { include: { city: true } },
      instructor: { include: { user: { select: { displayName: true } } } },
      translations: true,
      interests: true,
      sessions: {
        where: { status: 'SCHEDULED', startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        include: { capacity: true, _count: { select: { waitlist: true } } },
      },
      reviews: {
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { author: { select: { displayName: true } } },
      },
    },
  });
  if (!activity) throw new NotFoundError('Activity not found');

  const translation = activity.translations.find((t) => t.locale === locale) ?? activity.translations[0];
  const ratings = activity.reviews.map((r) => r.rating);

  return {
    ...activity,
    translation,
    averageRating: ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : null,
    location: options.exactLocation
      ? {
          exact: true as const,
          name: activity.venue.name,
          addressLine1: activity.venue.addressLine1,
          postalCode: activity.venue.postalCode,
          city: activity.venue.city.name,
          latitude: activity.venue.latitude,
          longitude: activity.venue.longitude,
        }
      : {
          exact: false as const,
          name: activity.venue.name,
          city: activity.venue.city.name,
          latitude: activity.venue.approxLatitude,
          longitude: activity.venue.approxLongitude,
        },
  };
}

/** True when the viewer's family holds a confirmed booking for this activity. */
export async function familyMaySeeExactLocation(familyId: string | null, activityId: string): Promise<boolean> {
  if (!familyId) return false;
  const booking = await prisma.booking.findFirst({
    where: { familyId, status: { in: ['CONFIRMED', 'COMPLETED'] }, session: { activityId } },
    select: { id: true },
  });
  return booking !== null;
}

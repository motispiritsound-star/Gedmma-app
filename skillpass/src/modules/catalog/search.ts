import type { ActivityCategory, AgeBand, Locale as DbLocale, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { approximate, distanceKm } from '@/lib/adapters/geo';
import { ageBandsInRange } from '@/lib/i18n/labels';

export const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z
    .enum([
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
    ])
    .optional(),
  ageBand: z.enum(['AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17']).optional(),
  maxCredits: z.coerce.number().int().positive().max(100).optional(),
  language: z.enum(['NL', 'EN']).optional(),
  wheelchairAccessible: z.coerce.boolean().optional(),
  sensoryFriendly: z.coerce.boolean().optional(),
  trialAvailable: z.coerce.boolean().optional(),
  dateFrom: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dateTo: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(200).optional(),
  citySlug: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
});

export type SearchInput = z.infer<typeof searchSchema>;

export interface SearchResultItem {
  id: string;
  slug: string;
  category: ActivityCategory;
  level: string;
  creditCost: number;
  listPriceCents: number;
  currency: string;
  minAgeBand: AgeBand;
  maxAgeBand: AgeBand;
  languages: DbLocale[];
  wheelchairAccessible: boolean;
  sensoryFriendly: boolean;
  trialAvailable: boolean;
  title: string;
  summary: string;
  providerName: string;
  providerSlug: string;
  venueName: string;
  cityName: string;
  /** Coarse coordinates only — the exact venue is revealed after booking. */
  approxLatitude: number;
  approxLongitude: number;
  distanceKm: number | null;
  nextSessionAt: Date | null;
  seatsLeft: number | null;
  averageRating: number | null;
  reviewCount: number;
}

function parseDate(value: string | undefined, endOfDay = false): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value.length === 10 ? `${value}T${endOfDay ? '23:59:59' : '00:00:00'}.000Z` : value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Discovery query. Only PUBLISHED activities belonging to APPROVED providers
 * are ever visible; that filter lives here so no caller can forget it.
 */
export async function searchActivities(input: SearchInput, locale: DbLocale) {
  const from = parseDate(input.dateFrom) ?? new Date();
  const to = parseDate(input.dateTo, true);

  const where: Prisma.ActivityWhereInput = {
    status: 'PUBLISHED',
    provider: { status: 'APPROVED' },
    ...(input.category ? { category: input.category } : {}),
    ...(input.maxCredits ? { creditCost: { lte: input.maxCredits } } : {}),
    ...(input.language ? { languages: { has: input.language } } : {}),
    ...(input.wheelchairAccessible ? { wheelchairAccessible: true } : {}),
    ...(input.sensoryFriendly ? { sensoryFriendly: true } : {}),
    ...(input.trialAvailable ? { trialAvailable: true } : {}),
    ...(input.citySlug ? { venue: { city: { slug: input.citySlug } } } : {}),
    sessions: {
      some: {
        status: 'SCHEDULED',
        startsAt: { gte: from, ...(to ? { lte: to } : {}) },
      },
    },
    ...(input.q
      ? {
          translations: {
            some: {
              OR: [
                { title: { contains: input.q, mode: 'insensitive' } },
                { summary: { contains: input.q, mode: 'insensitive' } },
                { description: { contains: input.q, mode: 'insensitive' } },
              ],
            },
          },
        }
      : {}),
  };

  // Age matching: the child's band must sit inside [minAgeBand, maxAgeBand].
  if (input.ageBand) {
    const order: AgeBand[] = ['AGE_6_8', 'AGE_9_11', 'AGE_12_14', 'AGE_15_17'];
    const index = order.indexOf(input.ageBand);
    where.AND = [
      { minAgeBand: { in: order.slice(0, index + 1) } },
      { maxAgeBand: { in: order.slice(index) } },
    ];
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      provider: { select: { displayName: true, slug: true } },
      venue: { include: { city: { select: { name: true, slug: true } } } },
      translations: true,
      reviews: { where: { status: 'PUBLISHED' }, select: { rating: true } },
      sessions: {
        where: { status: 'SCHEDULED', startsAt: { gte: from, ...(to ? { lte: to } : {}) } },
        orderBy: { startsAt: 'asc' },
        take: 1,
        include: { capacity: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const origin =
    input.latitude !== undefined && input.longitude !== undefined
      ? { latitude: input.latitude, longitude: input.longitude }
      : null;

  let items: SearchResultItem[] = activities.map((activity) => {
    const translation =
      activity.translations.find((t) => t.locale === locale) ?? activity.translations[0];
    const nextSession = activity.sessions[0];
    const ratings = activity.reviews.map((r) => r.rating);
    const coarse = approximate({ latitude: activity.venue.latitude, longitude: activity.venue.longitude });
    return {
      id: activity.id,
      slug: activity.slug,
      category: activity.category,
      level: activity.level,
      creditCost: activity.creditCost,
      listPriceCents: activity.listPriceCents,
      currency: activity.currency,
      minAgeBand: activity.minAgeBand,
      maxAgeBand: activity.maxAgeBand,
      languages: activity.languages,
      wheelchairAccessible: activity.wheelchairAccessible,
      sensoryFriendly: activity.sensoryFriendly,
      trialAvailable: activity.trialAvailable,
      title: translation?.title ?? activity.slug,
      summary: translation?.summary ?? '',
      providerName: activity.provider.displayName,
      providerSlug: activity.provider.slug,
      venueName: activity.venue.name,
      cityName: activity.venue.city.name,
      approxLatitude: coarse.latitude,
      approxLongitude: coarse.longitude,
      distanceKm: origin ? Number(distanceKm(origin, coarse).toFixed(1)) : null,
      nextSessionAt: nextSession?.startsAt ?? null,
      seatsLeft: nextSession?.capacity
        ? Math.max(0, nextSession.capacity.totalSeats - nextSession.capacity.seatsTaken)
        : null,
      averageRating: ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : null,
      reviewCount: ratings.length,
    };
  });

  if (origin && input.radiusKm) {
    items = items.filter((item) => item.distanceKm !== null && item.distanceKm <= input.radiusKm!);
  }
  if (origin) {
    items.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  } else {
    items.sort((a, b) => (a.nextSessionAt?.getTime() ?? Infinity) - (b.nextSessionAt?.getTime() ?? Infinity));
  }

  const total = items.length;
  const start = (input.page - 1) * input.perPage;
  return {
    total,
    page: input.page,
    perPage: input.perPage,
    pageCount: Math.max(1, Math.ceil(total / input.perPage)),
    items: items.slice(start, start + input.perPage),
  };
}

/**
 * Deterministic recommendations — no opaque scoring model. Weights are fixed
 * and explainable so a parent can be told exactly why something is suggested.
 */
export async function recommendForFamily(familyId: string, locale: DbLocale, limit = 6) {
  const children = await prisma.childProfile.findMany({
    where: { familyId, archivedAt: null },
    include: { interests: true },
  });
  if (children.length === 0) return [] as (SearchResultItem & { reasons: string[] })[];

  const booked = await prisma.booking.findMany({
    where: { familyId },
    select: { session: { select: { activityId: true } } },
  });
  const bookedActivityIds = new Set(booked.map((b) => b.session.activityId));

  const scored: (SearchResultItem & { reasons: string[]; score: number })[] = [];

  for (const child of children) {
    const { items } = await searchActivities(
      { ageBand: child.ageBand, page: 1, perPage: 50 } as SearchInput,
      locale,
    );
    const childInterests = new Set(child.interests.map((i) => i.category));
    for (const item of items) {
      if (bookedActivityIds.has(item.id)) continue;
      const reasons: string[] = [];
      let score = 1;
      if (childInterests.has(item.category)) {
        score += 4;
        reasons.push(`interest:${item.category}`);
      }
      score += 1;
      reasons.push(`age:${child.ageBand}`);
      if (item.trialAvailable) {
        score += 1;
        reasons.push('trial_available');
      }
      if (child.accessibilityNeeds && item.wheelchairAccessible) {
        score += 1;
        reasons.push('accessible');
      }
      if (item.averageRating && item.averageRating >= 4.5) {
        score += 1;
        reasons.push('highly_rated');
      }
      const existing = scored.find((s) => s.id === item.id);
      if (existing) {
        if (score > existing.score) Object.assign(existing, { ...item, score, reasons });
      } else {
        scored.push({ ...item, score, reasons });
      }
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || (a.nextSessionAt?.getTime() ?? 0) - (b.nextSessionAt?.getTime() ?? 0))
    .slice(0, limit);
}

import { z } from 'zod';
import { prisma } from '@/lib/db';
import { audit } from '@/lib/audit';
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import type { SessionUser } from '@/lib/auth/session';

export const reviewSchema = z.object({
  bookingId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal('')),
  body: z.string().trim().min(20, 'Tell other parents a little more').max(2000),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

/** Patterns that would expose a child in public review text. */
const IMAGE_MARKUP = /(<img|!\[[^\]]*\]\(|data:image\/|https?:\S+\.(png|jpe?g|gif|webp))/i;

/**
 * Reviews are written by a guardian about an activity, never about a child.
 * We refuse text that names the child on the booking or embeds an image, and
 * the model has no field to attach media in the first place.
 */
export function assertReviewContentSafe(body: string, title: string | undefined, childNickname: string) {
  const haystack = `${title ?? ''} ${body}`.toLowerCase();
  if (IMAGE_MARKUP.test(`${title ?? ''} ${body}`)) {
    throw new ValidationError('Images are not allowed in reviews. Please describe the activity in words.');
  }
  const nickname = childNickname.trim().toLowerCase();
  if (nickname.length >= 3) {
    const pattern = new RegExp(`\\b${nickname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(haystack)) {
      throw new ValidationError('Please do not include your child’s name in a public review.');
    }
  }
}

/**
 * Only a guardian of the family that booked, and only once attendance has been
 * recorded as ATTENDED by the provider, may write a review.
 */
export async function createReview(user: SessionUser, familyId: string, input: ReviewInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { attendance: true, session: { select: { activityId: true } }, childProfile: { select: { nickname: true } } },
  });
  if (!booking) throw new NotFoundError('Booking not found');
  if (booking.familyId !== familyId) throw new AuthorizationError('You can only review your own bookings');
  if (user.role !== 'GUARDIAN') throw new AuthorizationError('Only guardians can write reviews');

  if (!booking.attendance || booking.attendance.status !== 'ATTENDED') {
    throw new ValidationError('You can review once the provider has recorded attendance');
  }

  const existing = await prisma.review.findUnique({ where: { bookingId: booking.id } });
  if (existing) throw new ConflictError('already_reviewed', 'You have already reviewed this session');

  assertReviewContentSafe(input.body, input.title || undefined, booking.childProfile.nickname);

  const review = await prisma.review.create({
    data: {
      bookingId: booking.id,
      activityId: booking.session.activityId,
      familyId,
      authorId: user.id,
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      status: 'PUBLISHED',
    },
  });

  await audit({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'review.created',
    entityType: 'Review',
    entityId: review.id,
    metadata: { activityId: booking.session.activityId, rating: input.rating },
  });

  return review;
}

export async function moderateReview(admin: SessionUser, reviewId: string, status: 'PUBLISHED' | 'HIDDEN' | 'REMOVED', note: string) {
  const review = await prisma.review.update({
    where: { id: reviewId },
    data: { status, moderationNote: note },
  });
  await audit({
    actorUserId: admin.id,
    actorRole: admin.role,
    action: 'admin.review_moderated',
    entityType: 'Review',
    entityId: reviewId,
    metadata: { status, note },
  });
  return review;
}

export async function listActivityReviews(activityId: string, limit = 20) {
  return prisma.review.findMany({
    where: { activityId, status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { author: { select: { displayName: true } } },
  });
}

export async function toggleFavourite(user: SessionUser, familyId: string, activityId: string, childProfileId?: string) {
  const existing = await prisma.favourite.findFirst({
    where: { familyId, activityId, childProfileId: childProfileId ?? null },
  });
  if (existing) {
    await prisma.favourite.delete({ where: { id: existing.id } });
    return { favourited: false };
  }
  await prisma.favourite.create({
    data: { familyId, userId: user.id, activityId, childProfileId: childProfileId ?? null },
  });
  return { favourited: true };
}

export async function listFavourites(familyId: string) {
  return prisma.favourite.findMany({
    where: { familyId },
    orderBy: { createdAt: 'desc' },
    include: {
      activity: {
        include: {
          translations: true,
          provider: { select: { displayName: true } },
          venue: { include: { city: { select: { name: true } } } },
        },
      },
      childProfile: { select: { nickname: true } },
    },
  });
}

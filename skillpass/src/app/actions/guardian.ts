'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser, requestMeta } from '@/lib/auth/session';
import { requireFamily } from '@/lib/auth/rbac';
import { AppError } from '@/lib/errors';
import { consumeRateLimit } from '@/lib/rate-limit';
import { bookSession, cancelBooking, joinWaitlist } from '@/modules/booking/service';
import { childProfileSchema, createChildProfile } from '@/modules/family/service';
import { createReview, reviewSchema, toggleFavourite } from '@/modules/reviews/service';
import { startSubscription } from '@/modules/billing/subscriptions';
import { markRead } from '@/modules/notifications/service';

export interface ActionState {
  error?: string;
  success?: string;
}

function fail(error: unknown): ActionState {
  if (error instanceof AppError) return { error: error.message };
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: { message: string }[] }).issues;
    return { error: issues[0]?.message ?? 'Please check the form' };
  }
  console.error('[action] unexpected failure', error);
  return { error: 'Something went wrong. Please try again.' };
}

export async function addChildAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const familyId = await requireFamily(user);
    const parsed = childProfileSchema.parse({
      nickname: formData.get('nickname'),
      ageBand: formData.get('ageBand'),
      pronouns: formData.get('pronouns') ?? '',
      accessibilityNeeds: formData.get('accessibilityNeeds') ?? '',
      medicalNotes: formData.get('medicalNotes') ?? '',
      preferredLanguages: formData.getAll('preferredLanguages').map(String),
      interestSlugs: formData.getAll('interests').map(String),
    });
    await createChildProfile(familyId, user.id, parsed);
    revalidatePath('/[locale]/family', 'page');
    return { success: 'child_created' };
  } catch (error) {
    return fail(error);
  }
}

export async function bookSessionAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const familyId = await requireFamily(user);
    const meta = await requestMeta();
    consumeRateLimit('booking', meta.ip ?? user.id);

    await bookSession(user, familyId, {
      sessionId: String(formData.get('sessionId')),
      childProfileId: String(formData.get('childProfileId')),
    });
    revalidatePath('/[locale]/bookings', 'page');
    return { success: 'booked' };
  } catch (error) {
    return fail(error);
  }
}

export async function joinWaitlistAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const familyId = await requireFamily(user);
    await joinWaitlist(user, familyId, String(formData.get('sessionId')), String(formData.get('childProfileId')));
    revalidatePath('/[locale]/bookings', 'page');
    return { success: 'waitlisted' };
  } catch (error) {
    return fail(error);
  }
}

export async function cancelBookingAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const familyId = await requireFamily(user);
    await cancelBooking(user, familyId, String(formData.get('bookingId')), {
      reason: String(formData.get('reason') ?? 'guardian_cancelled'),
    });
    revalidatePath('/[locale]/bookings', 'page');
    return { success: 'cancelled' };
  } catch (error) {
    return fail(error);
  }
}

export async function reviewAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const familyId = await requireFamily(user);
    const meta = await requestMeta();
    consumeRateLimit('review', meta.ip ?? user.id);

    const parsed = reviewSchema.parse({
      bookingId: formData.get('bookingId'),
      rating: formData.get('rating'),
      title: formData.get('title') ?? '',
      body: formData.get('body'),
    });
    await createReview(user, familyId, parsed);
    revalidatePath('/[locale]/bookings', 'page');
    return { success: 'reviewed' };
  } catch (error) {
    return fail(error);
  }
}

export async function toggleFavouriteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const familyId = await requireFamily(user);
  await toggleFavourite(user, familyId, String(formData.get('activityId')));
  revalidatePath('/[locale]/favourites', 'page');
}

export async function subscribeAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const familyId = await requireFamily(user);
  const locale = (String(formData.get('locale') ?? 'nl') === 'en' ? 'en' : 'nl') as 'nl' | 'en';
  const result = await startSubscription(user, familyId, String(formData.get('planSlug')), locale);
  redirect(result.redirectUrl);
}

export async function markNotificationsReadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = formData.get('notificationId');
  await markRead(user.id, id ? String(id) : undefined);
  revalidatePath('/[locale]/notifications', 'page');
}

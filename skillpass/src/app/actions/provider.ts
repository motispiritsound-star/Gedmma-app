'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { currentProviderId } from '@/lib/auth/rbac';
import { AppError } from '@/lib/errors';
import { createProviderApplication, providerOnboardingSchema } from '@/modules/catalog/providers';
import { publishActivity, unpublishActivity } from '@/modules/catalog/activities';
import { recordAttendance } from '@/modules/booking/service';
import type { ActionState } from './guardian';

function fail(error: unknown): ActionState {
  if (error instanceof AppError) return { error: error.message };
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues: { message: string }[] }).issues;
    return { error: issues[0]?.message ?? 'Please check the form' };
  }
  console.error('[provider action] unexpected failure', error);
  return { error: 'Something went wrong. Please try again.' };
}

export async function providerOnboardingAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const locale = String(formData.get('locale') ?? 'nl');
  try {
    const user = await requireUser();
    const parsed = providerOnboardingSchema.parse({
      legalName: formData.get('legalName'),
      displayName: formData.get('displayName'),
      description: formData.get('description'),
      chamberOfCommerceNo: formData.get('chamberOfCommerceNo') ?? '',
      vatNumber: formData.get('vatNumber') ?? '',
      contactPersonName: formData.get('contactPersonName'),
      contactEmail: formData.get('contactEmail'),
      contactPhone: formData.get('contactPhone') ?? '',
      websiteUrl: formData.get('websiteUrl') ?? '',
      liabilityInsurer: formData.get('liabilityInsurer') ?? '',
      liabilityPolicyNo: formData.get('liabilityPolicyNo') ?? '',
      insuranceExpiresAt: formData.get('insuranceExpiresAt') ?? '',
      safeguardingPolicyUrl: formData.get('safeguardingPolicyUrl') ?? '',
      vogDeclared: formData.get('vogDeclared') === 'on',
    });
    await createProviderApplication(user, parsed);
  } catch (error) {
    return fail(error);
  }
  redirect(`/${locale}/provider`);
}

export async function publishActivityAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const providerId = await currentProviderId(user);
    const activityId = String(formData.get('activityId'));
    if (formData.get('intent') === 'unpublish') {
      await unpublishActivity(user, providerId, activityId);
    } else {
      await publishActivity(user, providerId, activityId);
    }
    revalidatePath('/[locale]/provider', 'page');
    return { success: 'published' };
  } catch (error) {
    return fail(error);
  }
}

export async function attendanceAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireUser();
    const providerId = await currentProviderId(user);
    await recordAttendance(user, providerId, {
      bookingId: String(formData.get('bookingId')),
      status: String(formData.get('status')) as 'ATTENDED' | 'ABSENT' | 'EXCUSED',
    });
    revalidatePath('/[locale]/provider/sessions/[sessionId]', 'page');
    return { success: 'recorded' };
  } catch (error) {
    return fail(error);
  }
}

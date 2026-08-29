'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { requireFamily } from '@/modules/auth/guards'
import { checkbox, text, textList, toFormState, type FormState } from '@/lib/form'
import { childProfileSchema, familyPreferencesSchema } from '@/modules/families/schemas'
import {
  completeOnboarding,
  createChildProfile,
  deleteChildProfile,
  updateChildProfile,
  updateFamilyPreferences,
} from '@/modules/families/service'
import { LOCALE_COOKIE } from '@/modules/localisation'
import { requestAccountDeletion, cancelAccountDeletion } from '@/modules/privacy/service'
import { destroySession } from '@/modules/auth/session'
import { validationError } from '@/lib/errors'

function readChildInput(formData: FormData) {
  return childProfileSchema.parse({
    nickname: text(formData, 'nickname'),
    ageBand: text(formData, 'ageBand'),
    avatarKey: text(formData, 'avatarKey') || 'fox',
    interestIds: textList(formData, 'interestIds'),
  })
}

export async function createChildAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const context = await requireFamily()
    await createChildProfile({
      familyId: context.family.id,
      actorUserId: context.user.id,
      input: readChildInput(formData),
    })
    revalidatePath('/children')
    revalidatePath('/home')
    return { status: 'success' }
  } catch (error) {
    return toFormState(error)
  }
}

export async function updateChildAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const context = await requireFamily()
    await updateChildProfile({
      familyId: context.family.id,
      childId: text(formData, 'childId'),
      actorUserId: context.user.id,
      input: readChildInput(formData),
    })
    revalidatePath('/children')
    revalidatePath('/home')
    return { status: 'success' }
  } catch (error) {
    return toFormState(error)
  }
}

export async function deleteChildAction(childId: string): Promise<void> {
  const context = await requireFamily()
  await deleteChildProfile({ familyId: context.family.id, childId, actorUserId: context.user.id })
  revalidatePath('/children')
}

export async function updateFamilyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const context = await requireFamily()
    const input = familyPreferencesSchema.parse({
      name: text(formData, 'name'),
      environment: text(formData, 'environment'),
      preferredDuration: text(formData, 'preferredDuration'),
      preferredDifficulty: text(formData, 'preferredDifficulty'),
      preferredSetting: text(formData, 'preferredSetting'),
      prefersFamilyActivity: checkbox(formData, 'prefersFamilyActivity'),
      adultCount: text(formData, 'adultCount'),
      requireParentApproval: checkbox(formData, 'requireParentApproval'),
      locale: text(formData, 'locale') || context.family.locale,
    })

    await updateFamilyPreferences({ familyId: context.family.id, input })

    const cookieStore = await cookies()
    cookieStore.set(LOCALE_COOKIE, input.locale, { path: '/', maxAge: 365 * 24 * 60 * 60 })

    revalidatePath('/settings')
    revalidatePath('/home')
    return { status: 'success' }
  } catch (error) {
    return toFormState(error)
  }
}

export async function finishOnboardingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const context = await requireFamily()
    const input = familyPreferencesSchema.parse({
      name: text(formData, 'name') || context.family.name,
      environment: text(formData, 'environment'),
      preferredDuration: text(formData, 'preferredDuration'),
      preferredDifficulty: text(formData, 'preferredDifficulty'),
      preferredSetting: text(formData, 'preferredSetting'),
      prefersFamilyActivity: checkbox(formData, 'prefersFamilyActivity'),
      adultCount: text(formData, 'adultCount'),
      requireParentApproval: checkbox(formData, 'requireParentApproval'),
      locale: text(formData, 'locale') || context.family.locale,
    })
    await updateFamilyPreferences({ familyId: context.family.id, input, completeOnboarding: true })
    await completeOnboarding(context.family.id)
  } catch (error) {
    return toFormState(error)
  }
  redirect('/home')
}

export async function requestDeletionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const context = await requireFamily()
    if (text(formData, 'confirm').trim().toUpperCase() !== 'DELETE') {
      // The message shown to the parent is rendered by the form in their own
      // language; this string is only ever a fallback.
      throw validationError('Type DELETE to confirm.', { confirm: ['confirmation_missing'] })
    }
    await requestAccountDeletion({ userId: context.user.id, familyId: context.family.id })
    await destroySession()
  } catch (error) {
    return toFormState(error)
  }
  redirect('/?deletion=requested')
}

export async function cancelDeletionAction(): Promise<void> {
  const context = await requireFamily()
  await cancelAccountDeletion({ userId: context.user.id, familyId: context.family.id })
  revalidatePath('/settings')
}

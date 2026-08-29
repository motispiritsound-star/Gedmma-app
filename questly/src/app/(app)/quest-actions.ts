'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireFamily } from '@/modules/auth/guards'
import { resolveLocale } from '@/modules/localisation/server'
import { toFormState, type FormState } from '@/lib/form'
import {
  abandonQuest,
  planQuest,
  removePlannedQuest,
  startQuest,
  toggleFavourite,
  updatePlannedQuest,
} from '@/modules/progress/service'
import { plannedQuestSchema } from '@/modules/progress/schemas'
import { approveCompletion } from '@/modules/progress/service'
import { planLimit } from '@/lib/errors'

export async function startQuestAction(questId: string): Promise<void> {
  const context = await requireFamily()
  const locale = await resolveLocale()
  const completion = await startQuest({
    familyId: context.family.id,
    questId,
    userId: context.user.id,
    locale,
  })
  redirect(`/adventure/${completion.id}`)
}

export async function toggleFavouriteAction(questId: string): Promise<boolean> {
  const context = await requireFamily()
  const result = await toggleFavourite({ familyId: context.family.id, questId })
  revalidatePath('/dashboard')
  return result
}

export async function planQuestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const context = await requireFamily()
    if (!context.entitlements.weeklyPlanner) {
      throw planLimit('Weekly planning is part of Family Premium.')
    }
    const input = plannedQuestSchema.parse({
      questId: formData.get('questId'),
      scheduledFor: formData.get('scheduledFor'),
      timeOfDay: formData.get('timeOfDay') || undefined,
      note: formData.get('note') ?? '',
    })
    await planQuest({ familyId: context.family.id, input })
    revalidatePath('/planner')
    return { status: 'success' }
  } catch (error) {
    return toFormState(error)
  }
}

export async function updatePlannedQuestAction(
  plannedId: string,
  status: 'PLANNED' | 'DONE' | 'SKIPPED',
): Promise<void> {
  const context = await requireFamily()
  await updatePlannedQuest({ familyId: context.family.id, plannedId, status })
  revalidatePath('/planner')
}

export async function removePlannedQuestAction(plannedId: string): Promise<void> {
  const context = await requireFamily()
  await removePlannedQuest({ familyId: context.family.id, plannedId })
  revalidatePath('/planner')
}

export async function abandonQuestAction(completionId: string): Promise<void> {
  const context = await requireFamily()
  await abandonQuest({ completionId, familyId: context.family.id })
  redirect('/home')
}

export async function approveCompletionAction(completionId: string): Promise<void> {
  const context = await requireFamily()
  await approveCompletion({ completionId, familyId: context.family.id, userId: context.user.id })
  revalidatePath('/dashboard')
  revalidatePath('/home')
}

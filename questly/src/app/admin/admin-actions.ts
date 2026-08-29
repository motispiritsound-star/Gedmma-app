'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/modules/auth/guards'
import { toFormState, type FormState } from '@/lib/form'
import { questInputSchema } from '@/modules/admin/schemas'
import {
  createQuest,
  duplicateQuest,
  setQuestStatus,
  updateQuest,
} from '@/modules/admin/quests'
import type { QuestStatus } from '@/generated/prisma/client'

/**
 * The quest editor posts its whole state as one JSON payload, which keeps the
 * nested structure (translations, steps, materials, safety) intact instead of
 * flattening it into dotted form field names.
 */
function parsePayload(formData: FormData) {
  const raw = formData.get('payload')
  if (typeof raw !== 'string') throw new Error('Missing payload')
  return questInputSchema.parse(JSON.parse(raw))
}

export async function createQuestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let questId: string
  try {
    const context = await requireAdmin()
    const quest = await createQuest({
      input: parsePayload(formData),
      actorUserId: context.user.id,
      actorRole: context.user.role,
    })
    questId = quest.id
    revalidatePath('/admin/quests')
  } catch (error) {
    return toFormState(error)
  }
  redirect(`/admin/quests/${questId}`)
}

export async function updateQuestAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const context = await requireAdmin()
    const questId = String(formData.get('questId'))
    await updateQuest({
      questId,
      input: parsePayload(formData),
      actorUserId: context.user.id,
      actorRole: context.user.role,
    })
    revalidatePath('/admin/quests')
    revalidatePath(`/admin/quests/${questId}`)
    return { status: 'success' }
  } catch (error) {
    return toFormState(error)
  }
}

export async function setQuestStatusAction(questId: string, status: QuestStatus): Promise<void> {
  const context = await requireAdmin()
  await setQuestStatus({
    questId,
    status,
    actorUserId: context.user.id,
    actorRole: context.user.role,
  })
  revalidatePath('/admin/quests')
  revalidatePath(`/admin/quests/${questId}`)
}

export async function duplicateQuestAction(questId: string): Promise<void> {
  const context = await requireAdmin()
  const copy = await duplicateQuest({
    questId,
    actorUserId: context.user.id,
    actorRole: context.user.role,
  })
  revalidatePath('/admin/quests')
  redirect(`/admin/quests/${copy.id}`)
}

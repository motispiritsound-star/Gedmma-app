'use server'

import { revalidatePath } from 'next/cache'
import { requireFamily } from '@/modules/auth/guards'
import { toFormState, text, type FormState } from '@/lib/form'
import { completionSubmissionSchema } from '@/modules/progress/schemas'
import { submitCompletion } from '@/modules/progress/service'
import { storeEvidence, deleteEvidence } from '@/modules/media/service'
import { validationError } from '@/lib/errors'
import { getEnv } from '@/env'

export async function submitCompletionAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const context = await requireFamily()

    const questions = formData.getAll('reflectionQuestion').map(String)
    const answers = formData.getAll('reflectionAnswer').map(String)

    const input = completionSubmissionSchema.parse({
      completionId: text(formData, 'completionId'),
      childProfileIds: formData.getAll('childProfileIds').map(String),
      offlineMinutes: text(formData, 'offlineMinutes'),
      familyNote: text(formData, 'familyNote'),
      reflections: questions.map((question, index) => ({
        question,
        answer: answers[index] ?? '',
      })),
    })

    const result = await submitCompletion({
      familyId: context.family.id,
      userId: context.user.id,
      input,
    })

    // The photograph is optional and handled after the completion is stored, so
    // a failed upload never loses the rest of the family's answers.
    const photo = formData.get('photo')
    if (photo instanceof File && photo.size > 0) {
      const maxBytes = getEnv().MEDIA_MAX_UPLOAD_BYTES
      if (photo.size > maxBytes) {
        throw validationError(`Images may be at most ${Math.round(maxBytes / 1024 / 1024)} MB.`)
      }
      await storeEvidence({
        completionId: input.completionId,
        familyId: context.family.id,
        userId: context.user.id,
        data: Buffer.from(await photo.arrayBuffer()),
        caption: text(formData, 'photoCaption') || null,
      })
    }

    revalidatePath('/home')
    revalidatePath('/dashboard')
    revalidatePath(`/adventure/${input.completionId}/complete`)

    return {
      status: 'success',
      data: {
        requiresApproval: String(result.requiresApproval),
        badges: result.badges.map((badge) => badge.badge.slug).join(','),
      },
    }
  } catch (error) {
    return toFormState(error)
  }
}

export async function deleteEvidenceAction(evidenceId: string): Promise<void> {
  const context = await requireFamily()
  await deleteEvidence({ evidenceId, familyId: context.family.id, userId: context.user.id })
  revalidatePath('/dashboard')
}

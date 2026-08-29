'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Callout } from '@/components/ui/States'
import { controlClassName } from '@/components/ui/Field'
import { firstError, idleState } from '@/lib/form'
import { submitCompletionAction } from '@/app/(app)/completion-actions'

/**
 * The completion form. Uploading a photograph is optional and framed as such:
 * there is no nudge, no reward and no progress bar tied to it.
 */
export function CompletionForm({
  completionId,
  childProfiles,
  reflectionQuestions,
  requiresApproval,
  maxUploadBytes,
  labels,
}: {
  completionId: string
  childProfiles: Array<{ id: string; nickname: string; avatarKey: string }>
  reflectionQuestions: string[]
  requiresApproval: boolean
  maxUploadBytes: number
  labels: {
    who: string
    whoRequired: string
    timeSpent: string
    timeSpentHint: string
    reflectionTitle: string
    note: string
    noteHint: string
    evidence: string
    evidenceHint: string
    submit: string
    submitForApproval: string
    saving: string
    optional: string
    minutes: string
  }
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(submitCompletionAction, idleState)

  useEffect(() => {
    if (state.status === 'success') router.refresh()
  }, [state.status, router])

  return (
    <form action={action} className="space-y-6" encType="multipart/form-data" noValidate>
      <input type="hidden" name="completionId" value={completionId} />

      {state.status === 'error' && state.message ? (
        <Callout tone="danger" role="alert">
          {state.message}
        </Callout>
      ) : null}

      <fieldset className="q-card p-6">
        <legend className="px-1 font-semibold">{labels.who}</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {childProfiles.map((child) => (
            <label
              key={child.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-full border border-line-strong px-3.5 py-2 has-checked:border-moss-500 has-checked:bg-moss-50"
            >
              <input
                type="checkbox"
                name="childProfileIds"
                value={child.id}
                defaultChecked={childProfiles.length === 1}
                className="size-4 accent-moss-600"
              />
              <Avatar avatarKey={child.avatarKey} size={28} />
              <span className="font-medium">{child.nickname}</span>
            </label>
          ))}
        </div>
        {firstError(state, 'childProfileIds') ? (
          <p className="mt-2 text-sm font-medium text-danger-600">{labels.whoRequired}</p>
        ) : null}
      </fieldset>

      <div className="q-card p-6">
        <label htmlFor="offlineMinutes" className="font-semibold">
          {labels.timeSpent}
        </label>
        <p id="offlineMinutes-hint" className="mt-1 text-sm text-ink-soft">
          {labels.timeSpentHint}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            id="offlineMinutes"
            name="offlineMinutes"
            type="number"
            min={0}
            max={600}
            step={5}
            defaultValue={45}
            aria-describedby="offlineMinutes-hint"
            className={`${controlClassName} max-w-32`}
          />
          <span className="text-ink-soft">{labels.minutes}</span>
        </div>
      </div>

      {reflectionQuestions.length > 0 ? (
        <fieldset className="q-card p-6">
          <legend className="px-1 font-semibold">{labels.reflectionTitle}</legend>
          <div className="mt-3 space-y-4">
            {reflectionQuestions.slice(0, 2).map((question, index) => (
              <div key={question} className="flex flex-col gap-1.5">
                <input type="hidden" name="reflectionQuestion" value={question} />
                <label htmlFor={`reflection-${index}`} className="text-sm font-medium">
                  {question}
                </label>
                <textarea
                  id={`reflection-${index}`}
                  name="reflectionAnswer"
                  rows={2}
                  className={controlClassName}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="q-card p-6">
        <label htmlFor="familyNote" className="font-semibold">
          {labels.note}{' '}
          <span className="font-normal text-ink-muted">({labels.optional})</span>
        </label>
        <p id="familyNote-hint" className="mt-1 text-sm text-ink-soft">
          {labels.noteHint}
        </p>
        <textarea
          id="familyNote"
          name="familyNote"
          rows={3}
          aria-describedby="familyNote-hint"
          className={`${controlClassName} mt-3`}
        />
      </div>

      <div className="q-card p-6">
        <label htmlFor="photo" className="font-semibold">
          {labels.evidence}
        </label>
        <p id="photo-hint" className="mt-1 text-sm text-ink-soft">
          {labels.evidenceHint}
        </p>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-describedby="photo-hint"
          className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-moss-50 file:px-4 file:py-2 file:font-semibold file:text-moss-700"
        />
        <p className="mt-2 text-xs text-ink-muted">
          JPEG, PNG, WebP · max {Math.round(maxUploadBytes / 1024 / 1024)} MB
        </p>
      </div>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? labels.saving : requiresApproval ? labels.submitForApproval : labels.submit}
      </Button>
    </form>
  )
}

'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { controlClassName } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { idleState } from '@/lib/form'
import { planQuestAction } from '@/app/(app)/quest-actions'

/**
 * Native `<dialog>` so focus trapping, Escape and the backdrop come from the
 * platform rather than from hand-written JavaScript.
 */
export function PlanQuestDialog({
  questId,
  questSlug,
  onClose,
  labels,
}: {
  questId: string
  questSlug: string
  onClose: () => void
  labels: { title: string; submit: string }
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const router = useRouter()
  const [state, action, pending] = useActionState(planQuestAction, idleState)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (state.status === 'success') {
      router.refresh()
      onClose()
    }
  }, [state.status, onClose, router])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="plan-dialog-title"
      className="w-[min(28rem,92vw)] rounded-2xl border border-line bg-paper-raised p-6 text-ink backdrop:bg-ink/40"
    >
      <h2 id="plan-dialog-title" className="text-lg font-semibold">
        {labels.title}
      </h2>

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="questId" value={questId} />
        <input type="hidden" name="questSlug" value={questSlug} />

        {state.status === 'error' ? (
          <Callout tone="danger" role="alert">
            {state.message}
          </Callout>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-date" className="text-sm font-semibold">
            Datum / Date
          </label>
          <input
            id="plan-date"
            type="date"
            name="scheduledFor"
            required
            defaultValue={today}
            min={today}
            className={controlClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-time" className="text-sm font-semibold">
            Dagdeel / Time of day
          </label>
          <select id="plan-time" name="timeOfDay" className={controlClassName} defaultValue="">
            <option value="">—</option>
            <option value="MORNING">Ochtend / Morning</option>
            <option value="AFTERNOON">Middag / Afternoon</option>
            <option value="EVENING">Avond / Evening</option>
          </select>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => dialogRef.current?.close()}>
            ✕
          </Button>
          <Button type="submit" disabled={pending}>
            {labels.submit}
          </Button>
        </div>
      </form>
    </dialog>
  )
}

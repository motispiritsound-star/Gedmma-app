'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { controlClassName } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { firstError, idleState } from '@/lib/form'
import { requestDeletionAction } from '@/app/(app)/family-actions'

export function DeleteAccountForm({
  labels,
}: {
  labels: { confirmLabel: string; confirmError: string; button: string; saving: string }
}) {
  const [state, action, pending] = useActionState(requestDeletionAction, idleState)

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.status === 'error' ? (
        <Callout tone="danger" role="alert">
          {firstError(state, 'confirm') ? labels.confirmError : state.message}
        </Callout>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-semibold">
          {labels.confirmLabel}
        </label>
        <input
          id="confirm"
          name="confirm"
          type="text"
          autoComplete="off"
          required
          aria-invalid={Boolean(firstError(state, 'confirm'))}
          className={`${controlClassName} max-w-56`}
        />
      </div>

      <Button type="submit" variant="danger" disabled={pending}>
        {pending ? labels.saving : labels.button}
      </Button>
    </form>
  )
}

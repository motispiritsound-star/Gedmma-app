'use client'

import { useActionState } from 'react'
import { signInAction } from '../auth-actions'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { firstError, idleState } from '@/lib/form'

export function SignInForm({
  next,
  labels,
}: {
  next: string
  labels: { email: string; password: string; submit: string; submitting: string }
}) {
  const [state, action, pending] = useActionState(signInAction, idleState)

  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.status === 'error' && state.message ? (
        <Callout tone="danger" role="alert">
          {state.message}
        </Callout>
      ) : null}

      <Field label={labels.email} error={firstError(state, 'email')} required>
        {(props) => (
          <input {...props} type="email" name="email" autoComplete="email" inputMode="email" />
        )}
      </Field>

      <Field label={labels.password} error={firstError(state, 'password')} required>
        {(props) => <input {...props} type="password" name="password" autoComplete="current-password" />}
      </Field>

      <Button type="submit" fullWidth size="lg" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>
    </form>
  )
}

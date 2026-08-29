'use client'

import { useActionState } from 'react'
import { registerAction } from '../auth-actions'
import { Button } from '@/components/ui/Button'
import { CheckboxRow, Field } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { firstError, idleState } from '@/lib/form'

export function RegisterForm({
  labels,
}: {
  labels: {
    displayName: string
    familyName: string
    familyNameHint: string
    email: string
    password: string
    passwordHint: string
    consent: string
    submit: string
    submitting: string
  }
}) {
  const [state, action, pending] = useActionState(registerAction, idleState)

  return (
    <form action={action} className="mt-6 space-y-5" noValidate>
      {state.status === 'error' && state.message ? (
        <Callout tone="danger" role="alert">
          {state.message}
        </Callout>
      ) : null}

      <Field label={labels.displayName} error={firstError(state, 'displayName')} required>
        {(props) => <input {...props} type="text" name="displayName" autoComplete="name" />}
      </Field>

      <Field
        label={labels.familyName}
        hint={labels.familyNameHint}
        error={firstError(state, 'familyName')}
        required
      >
        {(props) => <input {...props} type="text" name="familyName" autoComplete="off" />}
      </Field>

      <Field label={labels.email} error={firstError(state, 'email')} required>
        {(props) => <input {...props} type="email" name="email" autoComplete="email" />}
      </Field>

      <Field
        label={labels.password}
        hint={labels.passwordHint}
        error={firstError(state, 'password')}
        required
      >
        {(props) => (
          <input {...props} type="password" name="password" autoComplete="new-password" minLength={12} />
        )}
      </Field>

      <div>
        <CheckboxRow name="consent" label={labels.consent} />
        {firstError(state, 'consent') ? (
          <p className="mt-1 text-sm font-medium text-danger-600">{firstError(state, 'consent')}</p>
        ) : null}
      </div>

      <Button type="submit" fullWidth size="lg" disabled={pending}>
        {pending ? labels.submitting : labels.submit}
      </Button>
    </form>
  )
}

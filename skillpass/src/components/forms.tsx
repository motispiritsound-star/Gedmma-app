'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/app/actions/guardian';

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Small wrapper so every mutating form reports its own error inline and
 * disables itself while pending, without repeating the boilerplate.
 */
export function ActionForm({
  action,
  children,
  className = '',
  submitLabel,
  pendingLabel,
  successLabel,
  variant = 'primary',
}: {
  action: Action;
  children?: React.ReactNode;
  className?: string;
  submitLabel: string;
  pendingLabel: string;
  successLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});
  const buttonClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary';

  return (
    <form action={formAction} className={className}>
      {children}
      {state.error ? (
        <p role="alert" className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.success && successLabel ? (
        <p role="status" className="mt-2 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successLabel}
        </p>
      ) : null}
      <button type="submit" className={`${buttonClass} mt-3`} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

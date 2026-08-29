'use client'

import { useId } from 'react'
import type { ReactNode, ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

const CONTROL =
  'w-full rounded-xl border border-line-strong bg-paper-raised px-3.5 py-2.5 text-ink ' +
  'placeholder:text-ink-muted transition focus:border-moss-500 ' +
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:bg-danger-50'

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  required?: boolean
  children: (props: {
    id: string
    'aria-describedby': string | undefined
    'aria-invalid': boolean
    required: boolean
    className: string
  }) => ReactNode
  className?: string
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-ember-600" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error),
        required: Boolean(required),
        className: CONTROL,
      })}
      {error ? (
        <p id={errorId} className="text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput(props: ComponentPropsWithoutRef<'input'>) {
  return <input {...props} className={cn(CONTROL, props.className)} />
}

export function TextArea(props: ComponentPropsWithoutRef<'textarea'>) {
  return <textarea {...props} className={cn(CONTROL, 'min-h-28', props.className)} />
}

export function SelectInput(props: ComponentPropsWithoutRef<'select'>) {
  return <select {...props} className={cn(CONTROL, 'pr-8', props.className)} />
}

export function CheckboxRow({
  label,
  hint,
  ...props
}: ComponentPropsWithoutRef<'input'> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        aria-describedby={hintId}
        {...props}
        className="mt-1 size-5 shrink-0 rounded border-line-strong accent-moss-600"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
        {hint ? (
          <p id={hintId} className="text-sm text-ink-soft">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export { CONTROL as controlClassName }

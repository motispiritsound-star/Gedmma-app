import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Empty, loading and error states, so no screen ever renders as a blank box. */

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="q-card flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon ? <div className="text-moss-300">{icon}</div> : null}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div
      role="alert"
      className="q-card flex flex-col items-center gap-3 border-danger-500/25 bg-danger-50 px-6 py-10 text-center"
    >
      <h3 className="text-lg font-semibold text-danger-600">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-ink-soft">{description}</p> : null}
      {action}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-paper-sunken', className)}
    />
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 py-8">
      <span className="q-visually-hidden">{label}</span>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

type CalloutTone = 'info' | 'warning' | 'success' | 'danger'

const CALLOUT_TONES: Record<CalloutTone, string> = {
  info: 'border-dusk-100 bg-dusk-50 text-dusk-700',
  warning: 'border-ember-100 bg-ember-50 text-ember-700',
  success: 'border-success-600/25 bg-success-50 text-success-600',
  danger: 'border-danger-500/25 bg-danger-50 text-danger-600',
}

export function Callout({
  tone = 'info',
  title,
  children,
  className,
  role,
}: {
  tone?: CalloutTone
  title?: ReactNode
  children: ReactNode
  className?: string
  role?: 'status' | 'alert'
}) {
  return (
    <div role={role} className={cn('rounded-xl border p-4 text-sm', CALLOUT_TONES[tone], className)}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="[&_a]:underline">{children}</div>
    </div>
  )
}

export function ProgressBar({
  value,
  max,
  label,
  tone = 'moss',
}: {
  value: number
  max: number
  label: string
  tone?: 'moss' | 'ember' | 'dusk'
}) {
  const safeMax = Math.max(1, max)
  const percentage = Math.min(100, Math.round((value / safeMax) * 100))
  const fill = tone === 'ember' ? 'bg-ember-500' : tone === 'dusk' ? 'bg-dusk-500' : 'bg-moss-500'
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
      className="h-2.5 w-full overflow-hidden rounded-full bg-paper-sunken"
    >
      <div className={cn('h-full rounded-full transition-[width]', fill)} style={{ width: `${percentage}%` }} />
    </div>
  )
}

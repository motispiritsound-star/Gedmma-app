import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'moss' | 'ember' | 'dusk' | 'berry' | 'sun' | 'danger' | 'success'

const TONES: Record<Tone, string> = {
  neutral: 'bg-paper-sunken text-ink-soft border-line-strong',
  moss: 'bg-moss-50 text-moss-700 border-moss-200',
  ember: 'bg-ember-50 text-ember-700 border-ember-100',
  dusk: 'bg-dusk-50 text-dusk-700 border-dusk-100',
  berry: 'bg-berry-100 text-berry-600 border-berry-100',
  sun: 'bg-sun-100 text-sun-600 border-sun-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-500/30',
  success: 'bg-success-50 text-success-600 border-success-600/25',
}

/**
 * A small label. Tone is decorative: the text always carries the meaning, so
 * nothing depends on colour alone.
 */
export function Badge({
  children,
  tone = 'neutral',
  icon,
  className,
}: {
  children: ReactNode
  tone?: Tone
  icon?: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'q-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

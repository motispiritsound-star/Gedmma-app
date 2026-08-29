'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setLocaleAction } from '@/app/actions'
import type { Locale } from '@/modules/localisation'

/**
 * Language switch. Writes a cookie through a server action and refreshes, so
 * server-rendered pages come back in the new language.
 */
export function LocaleSwitcher({
  locale,
  labels,
}: {
  locale: Locale
  labels: { language: string; nl: string; en: string }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const change = (next: Locale) => {
    if (next === locale || pending) return
    startTransition(async () => {
      await setLocaleAction(next)
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label={labels.language}
      className="inline-flex items-center rounded-full border border-line-strong bg-paper-raised p-0.5 text-sm"
    >
      {(['nl', 'en'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => change(option)}
          aria-pressed={locale === option}
          className={
            locale === option
              ? 'rounded-full bg-moss-600 px-3 py-1 font-semibold text-white'
              : 'rounded-full px-3 py-1 font-medium text-ink-soft hover:text-ink'
          }
        >
          {option === 'nl' ? labels.nl : labels.en}
          <span className="q-visually-hidden">
            {option === 'nl' ? ' Nederlands' : ' English'}
          </span>
        </button>
      ))}
    </div>
  )
}

import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { SignOutButton } from '@/components/SignOutButton'
import { Badge } from '@/components/ui/Badge'
import type { Dictionary, Locale } from '@/modules/localisation'

export function AppHeader({
  d,
  locale,
  displayName,
  planLabel,
  emailVerified,
}: {
  d: Dictionary
  locale: Locale
  displayName: string
  planLabel: string
  emailVerified: boolean
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="q-container flex items-center justify-between gap-4 py-3">
        <Link href="/home" className="flex items-center gap-2.5 no-underline">
          <Logo size={28} />
          <span className="font-display text-lg font-semibold">{d.common.appName}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {!emailVerified ? (
            <Link href="/verify-email" className="hidden sm:block">
              <Badge tone="ember">{d.auth.unverifiedBadge}</Badge>
            </Link>
          ) : null}
          <Link href="/settings/subscription" className="hidden no-underline sm:block">
            <Badge tone="moss">{planLabel}</Badge>
          </Link>
          <LocaleSwitcher
            locale={locale}
            labels={{ language: d.common.language, nl: 'NL', en: 'EN' }}
          />
          <span className="hidden text-sm font-medium text-ink-soft md:inline">{displayName}</span>
          <SignOutButton label={d.common.signOut} />
        </div>
      </div>
    </header>
  )
}

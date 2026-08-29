import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { Logo } from '@/components/layout/Logo'
import type { Dictionary, Locale } from '@/modules/localisation'

export function PublicHeader({
  locale,
  d,
  signedIn,
}: {
  locale: Locale
  d: Dictionary
  signedIn: boolean
}) {
  return (
    <header className="border-b border-line bg-paper/85 backdrop-blur">
      <div className="q-container flex flex-wrap items-center justify-between gap-4 py-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Logo />
          <span className="font-display text-xl font-semibold tracking-tight">
            {d.common.appName}
          </span>
        </Link>

        <nav aria-label={d.nav.mainNavigation} className="order-3 w-full sm:order-2 sm:w-auto">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
            <li>
              <Link href="/how-it-works" className="text-ink-soft hover:text-moss-700">
                {d.nav.howItWorks}
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="text-ink-soft hover:text-moss-700">
                {d.nav.pricing}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-ink-soft hover:text-moss-700">
                {d.nav.privacy}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="order-2 flex items-center gap-3 sm:order-3">
          <LocaleSwitcher
            locale={locale}
            labels={{ language: d.common.language, nl: 'NL', en: 'EN' }}
          />
          {signedIn ? (
            <ButtonLink href="/home" size="sm">
              {d.nav.home}
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-ink-soft hover:text-moss-700"
              >
                {d.common.signIn}
              </Link>
              <ButtonLink href="/register" size="sm">
                {d.common.signUp}
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

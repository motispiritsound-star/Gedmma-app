import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import type { Dictionary } from '@/modules/localisation'

export function SiteFooter({ d }: { d: Dictionary }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20 border-t border-line bg-paper-sunken">
      <div className="q-container flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="font-display text-lg font-semibold">{d.common.appName}</span>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{d.common.tagline}</p>
        </div>
        <nav aria-label={d.nav.mainNavigation}>
          <ul className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-x-12">
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
            <li>
              <Link href="/sign-in" className="text-ink-soft hover:text-moss-700">
                {d.common.signIn}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="q-container border-t border-line py-5 text-xs text-ink-muted">
        <p>
          © {year} Questly. Questly does not measure or block device use; only the time you report
          yourself is recorded.
        </p>
      </div>
    </footer>
  )
}

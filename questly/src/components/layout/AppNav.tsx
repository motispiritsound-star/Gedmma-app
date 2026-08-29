'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import {
  IconBook,
  IconCalendar,
  IconChart,
  IconHome,
  IconSettings,
  IconUsers,
} from '@/components/ui/Icons'
import type { Dictionary } from '@/modules/localisation'

const ICONS = {
  home: IconHome,
  library: IconBook,
  planner: IconCalendar,
  dashboard: IconChart,
  children: IconUsers,
  settings: IconSettings,
} as const

type Item = { href: string; key: keyof typeof ICONS; label: string; short: string }

/**
 * Primary navigation. Rendered as a sidebar on large screens and as a bottom
 * bar on phones - the place a parent's thumb already is.
 */
export function AppNav({ d, adminHref }: { d: Dictionary; adminHref: string | null }) {
  const pathname = usePathname()

  const items: Item[] = [
    { href: '/home', key: 'home', label: d.nav.home, short: d.nav.homeShort },
    { href: '/quests', key: 'library', label: d.nav.library, short: d.nav.libraryShort },
    { href: '/planner', key: 'planner', label: d.nav.planner, short: d.nav.plannerShort },
    { href: '/dashboard', key: 'dashboard', label: d.nav.dashboard, short: d.nav.dashboardShort },
    { href: '/children', key: 'children', label: d.nav.children, short: d.nav.childrenShort },
    { href: '/settings', key: 'settings', label: d.nav.settings, short: d.nav.settingsShort },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      {/* Desktop / tablet */}
      <nav aria-label={d.nav.mainNavigation} className="hidden lg:block">
        <ul className="sticky top-24 space-y-1">
          {items.map((item) => {
            const Icon = ICONS[item.key]
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition',
                    active
                      ? 'bg-moss-600 text-white'
                      : 'text-ink-soft hover:bg-moss-50 hover:text-moss-700',
                  )}
                >
                  <Icon size={19} />
                  {item.label}
                </Link>
              </li>
            )
          })}
          {adminHref ? (
            <li className="pt-2">
              <Link
                href={adminHref}
                className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3.5 py-2.5 text-sm font-semibold text-dusk-600 hover:border-dusk-500"
              >
                {d.nav.admin}
              </Link>
            </li>
          ) : null}
        </ul>
      </nav>

      {/* Phone */}
      <nav
        aria-label={d.nav.mainNavigation}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper-raised/95 backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-6 pb-[env(safe-area-inset-bottom)]">
          {items.map((item) => {
            const Icon = ICONS[item.key]
            const active = isActive(item.href)
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  // The full name is the accessible name; the visible label is
                  // shortened so all six fit on the narrowest phone.
                  aria-label={item.label}
                  className={cn(
                    'flex flex-col items-center gap-1 px-0.5 py-2.5 text-[0.6rem] font-semibold',
                    active ? 'text-moss-700' : 'text-ink-muted',
                  )}
                >
                  <Icon size={20} />
                  <span className="w-full truncate text-center">{item.short}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}

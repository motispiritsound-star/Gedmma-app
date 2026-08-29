'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import type { Dictionary } from '@/modules/localisation'

export function AdminNav({ d, isPlatformAdmin }: { d: Dictionary; isPlatformAdmin: boolean }) {
  const pathname = usePathname()

  const items = [
    { href: '/admin', label: d.admin.dashboard, exact: true },
    { href: '/admin/quests', label: d.admin.quests, exact: false },
    ...(isPlatformAdmin
      ? [
          { href: '/admin/users', label: d.admin.users, exact: false },
          { href: '/admin/subscriptions', label: d.admin.subscriptions, exact: false },
          { href: '/admin/audit', label: d.admin.auditLog, exact: false },
        ]
      : []),
  ]

  return (
    <nav aria-label={d.nav.admin}>
      <ul className="flex gap-2 overflow-x-auto lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-xl px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition',
                  active
                    ? 'bg-dusk-600 text-white'
                    : 'text-ink-soft hover:bg-dusk-50 hover:text-dusk-700',
                )}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

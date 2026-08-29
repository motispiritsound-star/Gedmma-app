import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { SignOutButton } from '@/components/SignOutButton'
import { AdminNav } from '@/components/admin/AdminNav'
import { Badge } from '@/components/ui/Badge'
import { getTranslations } from '@/modules/localisation/server'
import { requireAdminPage } from '@/modules/auth/guards'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [{ locale, d }, context] = await Promise.all([getTranslations(), requireAdminPage()])

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="q-container flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5 no-underline">
              <Logo size={28} />
              <span className="font-display text-lg font-semibold">{d.common.appName}</span>
            </Link>
            <Badge tone="dusk">{d.nav.admin}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/home" className="text-sm font-semibold text-ink-soft hover:text-moss-700">
              {d.nav.home}
            </Link>
            <LocaleSwitcher
              locale={locale}
              labels={{ language: d.common.language, nl: 'NL', en: 'EN' }}
            />
            <span className="hidden text-sm text-ink-soft md:inline">
              {context.user.displayName}
            </span>
            <SignOutButton label={d.common.signOut} />
          </div>
        </div>
      </header>

      <div className="q-container grid gap-8 py-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <AdminNav
          d={d}
          isPlatformAdmin={context.user.role === 'PLATFORM_ADMIN'}
        />
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

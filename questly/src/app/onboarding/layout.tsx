import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { SignOutButton } from '@/components/SignOutButton'
import { getTranslations } from '@/modules/localisation/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { locale, d } = await getTranslations()
  return (
    <div className="q-topo min-h-dvh bg-paper">
      <div className="q-container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold">{d.common.appName}</span>
        </Link>
        <div className="flex items-center gap-3">
          <LocaleSwitcher
            locale={locale}
            labels={{ language: d.common.language, nl: 'NL', en: 'EN' }}
          />
          <SignOutButton label={d.common.signOut} />
        </div>
      </div>
      <main id="main" className="q-container pb-16">
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>
    </div>
  )
}

import Link from 'next/link'
import { Logo } from '@/components/layout/Logo'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { getTranslations } from '@/modules/localisation/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { locale, d } = await getTranslations()
  return (
    <div className="q-topo flex min-h-dvh flex-col bg-paper">
      <div className="q-container flex items-center justify-between py-5">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <Logo size={30} />
          <span className="font-display text-xl font-semibold">{d.common.appName}</span>
        </Link>
        <LocaleSwitcher
          locale={locale}
          labels={{ language: d.common.language, nl: 'NL', en: 'EN' }}
        />
      </div>
      <main id="main" className="flex flex-1 items-start justify-center px-5 py-8 sm:items-center">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  )
}

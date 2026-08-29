import { PublicHeader } from '@/components/layout/PublicHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { getTranslations } from '@/modules/localisation/server'
import { getAuthContext } from '@/modules/auth/session'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [{ locale, d }, context] = await Promise.all([getTranslations(), getAuthContext()])
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader locale={locale} d={d} signedIn={Boolean(context)} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter d={d} />
    </div>
  )
}

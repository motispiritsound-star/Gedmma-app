import { AppHeader } from '@/components/layout/AppHeader'
import { AppNav } from '@/components/layout/AppNav'
import { getTranslations } from '@/modules/localisation/server'
import { requireUserPage, isAdmin } from '@/modules/auth/guards'
import { entitlementsFor } from '@/modules/subscriptions/plans'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ locale, d }, context] = await Promise.all([getTranslations(), requireUserPage()])
  const plan = context.subscription?.plan ?? 'FREE'
  const planLabel =
    plan === 'FAMILY_PREMIUM'
      ? d.subscription.planPremium
      : plan === 'SCHOOL'
        ? d.subscription.planSchool
        : d.subscription.planFree
  void entitlementsFor(plan)

  return (
    <div className="min-h-dvh bg-paper">
      <AppHeader
        d={d}
        locale={locale}
        displayName={context.user.displayName}
        planLabel={planLabel}
        emailVerified={Boolean(context.user.emailVerifiedAt)}
      />
      <div className="q-container grid gap-8 py-6 pb-28 lg:grid-cols-[15rem_minmax(0,1fr)] lg:pb-10">
        <AppNav d={d} adminHref={isAdmin(context.user.role) ? '/admin' : null} />
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

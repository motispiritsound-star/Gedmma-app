import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Callout } from '@/components/ui/States'
import { IconCheck } from '@/components/ui/Icons'
import { getTranslations } from '@/modules/localisation/server'
import { formatMoney } from '@/modules/localisation/format'
import { PLAN_ENTITLEMENTS } from '@/modules/subscriptions/plans'
import { getPaymentProvider } from '@/modules/subscriptions/provider'

export const metadata: Metadata = { title: 'Pricing' }

export default async function PricingPage() {
  const { locale, d } = await getTranslations()
  const provider = getPaymentProvider()

  const plans = [
    {
      key: 'FREE' as const,
      name: d.subscription.planFree,
      price: formatMoney(PLAN_ENTITLEMENTS.FREE.priceCents, locale),
      features: d.subscription.featuresFree,
      cta: d.landing.heroPrimary,
      href: '/register',
      highlighted: false,
    },
    {
      key: 'FAMILY_PREMIUM' as const,
      name: d.subscription.planPremium,
      price: formatMoney(PLAN_ENTITLEMENTS.FAMILY_PREMIUM.priceCents, locale),
      features: d.subscription.featuresPremium,
      cta: d.subscription.upgrade,
      href: '/register',
      highlighted: true,
    },
    {
      key: 'SCHOOL' as const,
      name: d.subscription.planSchool,
      price: '—',
      features: d.subscription.featuresSchool,
      cta: null,
      href: null,
      highlighted: false,
    },
  ]

  return (
    <div className="q-container py-14">
      <h1 className="text-3xl font-semibold">{d.nav.pricing}</h1>
      <p className="q-prose mt-3 text-lg text-ink-soft">{d.subscription.subtitle}</p>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <section
            key={plan.key}
            className={
              plan.highlighted
                ? 'q-card border-moss-300 p-6 shadow-[var(--shadow-lifted)]'
                : 'q-card p-6'
            }
            aria-labelledby={`plan-${plan.key}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`plan-${plan.key}`} className="text-xl font-semibold">
                {plan.name}
              </h2>
              {plan.highlighted ? <Badge tone="moss">{d.common.premium}</Badge> : null}
            </div>
            <p className="mt-3 text-3xl font-semibold">
              {plan.price}
              {plan.key === 'FAMILY_PREMIUM' ? (
                <span className="text-base font-normal text-ink-soft">
                  {locale === 'nl' ? ' / maand' : ' / month'}
                </span>
              ) : null}
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-moss-600">
                    <IconCheck size={16} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            {plan.cta && plan.href ? (
              <ButtonLink
                href={plan.href}
                className="mt-6"
                fullWidth
                variant={plan.highlighted ? 'primary' : 'secondary'}
              >
                {plan.cta}
              </ButtonLink>
            ) : (
              <p className="mt-6 text-sm text-ink-muted">{d.subscription.schoolNotice}</p>
            )}
          </section>
        ))}
      </div>

      <Callout tone="info" className="mt-8">
        {provider.isMock ? d.subscription.mockNotice : d.subscription.stripeNotice}
      </Callout>
    </div>
  )
}

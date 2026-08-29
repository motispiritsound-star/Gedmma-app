import type { Metadata } from 'next'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { IconCheck } from '@/components/ui/Icons'
import { SubscriptionActions } from '@/components/family/SubscriptionActions'
import { fill } from '@/modules/localisation'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate, formatMoney } from '@/modules/localisation/format'
import { requireFamilyPage } from '@/modules/auth/guards'
import { getSubscription } from '@/modules/subscriptions/service'
import { PLAN_ENTITLEMENTS } from '@/modules/subscriptions/plans'
import { getPaymentProvider } from '@/modules/subscriptions/provider'

export const metadata: Metadata = { title: 'Subscription' }

export default async function SubscriptionPage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requireFamilyPage('/settings/subscription'),
  ])

  const subscription = await getSubscription(context.family.id)
  const provider = getPaymentProvider()
  const isPremium = subscription.plan === 'FAMILY_PREMIUM'

  const planName =
    subscription.plan === 'FAMILY_PREMIUM'
      ? d.subscription.planPremium
      : subscription.plan === 'SCHOOL'
        ? d.subscription.planSchool
        : d.subscription.planFree

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.subscription.title}</h1>
        <p className="mt-1 text-ink-soft">{d.subscription.subtitle}</p>
      </header>

      <Callout tone="info">
        {provider.isMock ? d.subscription.mockNotice : d.subscription.stripeNotice}
      </Callout>

      <Card>
        <CardHeader
          title={d.subscription.currentPlan}
          action={<Badge tone={isPremium ? 'moss' : 'neutral'}>{planName}</Badge>}
        />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">{d.subscription.currentPlan}</dt>
            <dd className="font-medium">{planName}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Status</dt>
            <dd className="font-medium">{subscription.status}</dd>
          </div>
          {subscription.currentPeriodEnd ? (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">
                {subscription.cancelAtPeriodEnd ? d.subscription.cancel : d.dashboard.planned}
              </dt>
              <dd className="font-medium">{formatDate(subscription.currentPeriodEnd, locale)}</dd>
            </div>
          ) : null}
        </dl>

        {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd ? (
          <Callout tone="warning" className="mt-4">
            {fill(d.subscription.cancelScheduled, {
              date: formatDate(subscription.currentPeriodEnd, locale),
            })}
          </Callout>
        ) : null}

        <div className="mt-5">
          <SubscriptionActions
            isPremium={isPremium}
            cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
            labels={{
              upgrade: d.subscription.upgrade,
              cancel: d.subscription.cancel,
              resume: d.subscription.resume,
            }}
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader
            title={d.subscription.planFree}
            description={formatMoney(PLAN_ENTITLEMENTS.FREE.priceCents, locale)}
          />
          <ul className="space-y-2 text-sm">
            {d.subscription.featuresFree.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 text-moss-600">
                  <IconCheck size={16} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </Card>

        <Card className={isPremium ? 'border-moss-300' : undefined}>
          <CardHeader
            title={d.subscription.planPremium}
            description={`${formatMoney(PLAN_ENTITLEMENTS.FAMILY_PREMIUM.priceCents, locale)}${
              locale === 'nl' ? ' / maand' : ' / month'
            }`}
          />
          <ul className="space-y-2 text-sm">
            {d.subscription.featuresPremium.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 text-moss-600">
                  <IconCheck size={16} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title={d.subscription.planSchool} description={d.subscription.schoolNotice} />
        <ul className="space-y-2 text-sm text-ink-soft">
          {d.subscription.featuresSchool.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

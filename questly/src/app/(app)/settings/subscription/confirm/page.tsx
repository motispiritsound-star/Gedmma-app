import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { IconCheck } from '@/components/ui/Icons'
import { getTranslations } from '@/modules/localisation/server'
import { requireFamilyPage } from '@/modules/auth/guards'
import { activatePlan } from '@/modules/subscriptions/service'
import { getPaymentProvider } from '@/modules/subscriptions/provider'

export const metadata: Metadata = { title: 'Subscription confirmed' }

/**
 * Checkout return page.
 *
 * With the mock provider this is where the plan is actually activated, because
 * there is no webhook to wait for. With Stripe the webhook is authoritative and
 * this page only reports what the subscription now says.
 */
export default async function SubscriptionConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const [{ d }, context, params] = await Promise.all([
    getTranslations(),
    requireFamilyPage('/settings/subscription'),
    searchParams,
  ])

  const provider = getPaymentProvider()
  let activated = false

  if (provider.isMock && params.session_id?.startsWith('mock_cs_')) {
    await activatePlan({
      familyId: context.family.id,
      plan: 'FAMILY_PREMIUM',
      actorUserId: context.user.id,
      providerSubscriptionId: params.session_id,
    })
    activated = true
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card className="text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-moss-600 text-white">
          <IconCheck size={28} />
        </span>
        <h1 className="mt-4 text-2xl font-semibold">
          {activated ? d.subscription.upgraded : d.subscription.title}
        </h1>
        {provider.isMock ? (
          <Callout tone="info" className="mt-4">
            {d.subscription.mockNotice}
          </Callout>
        ) : null}
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink href="/home">{d.nav.home}</ButtonLink>
          <ButtonLink href="/settings/subscription" variant="secondary">
            {d.subscription.manage}
          </ButtonLink>
        </div>
      </Card>
    </div>
  )
}

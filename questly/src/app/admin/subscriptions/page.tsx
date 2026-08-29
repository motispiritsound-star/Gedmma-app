import type { Metadata } from 'next'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate } from '@/modules/localisation/format'
import { requirePlatformAdminPage } from '@/modules/auth/admin-guards'
import { getPaymentProvider } from '@/modules/subscriptions/provider'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Subscriptions' }

export default async function AdminSubscriptionsPage() {
  const [{ locale, d }] = await Promise.all([getTranslations(), requirePlatformAdminPage()])
  const provider = getPaymentProvider()

  const [byPlan, subscriptions] = await Promise.all([
    prisma.subscription.groupBy({ by: ['plan', 'status'], _count: { _all: true } }),
    prisma.subscription.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: { family: { select: { name: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{d.admin.subscriptions}</h1>
      <Callout tone="info">
        {provider.isMock ? d.subscription.mockNotice : d.subscription.stripeNotice}
      </Callout>

      <dl className="grid gap-4 sm:grid-cols-3">
        {byPlan.map((row) => (
          <div key={`${row.plan}-${row.status}`} className="q-card p-5">
            <dt className="text-sm font-semibold text-ink-muted">
              {row.plan} · {row.status}
            </dt>
            <dd className="mt-1 font-display text-3xl font-semibold">{row._count._all}</dd>
          </div>
        ))}
      </dl>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="q-visually-hidden">{d.admin.subscriptions}</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.auth.familyName}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.subscription.currentPlan}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Status
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Provider
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.admin.lastChanged}
              </th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-semibold">{subscription.family.name}</td>
                <td className="px-5 py-3">
                  <Badge tone={subscription.plan === 'FAMILY_PREMIUM' ? 'moss' : 'neutral'}>
                    {subscription.plan}
                  </Badge>
                </td>
                <td className="px-5 py-3">
                  {subscription.status}
                  {subscription.cancelAtPeriodEnd ? ` · ${d.subscription.cancel}` : ''}
                </td>
                <td className="px-5 py-3 text-ink-soft">{subscription.provider}</td>
                <td className="px-5 py-3 text-ink-muted">
                  {formatDate(subscription.updatedAt, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

import type { Metadata } from 'next'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate } from '@/modules/localisation/format'
import { requirePlatformAdminPage } from '@/modules/auth/admin-guards'
import { prisma } from '@/lib/db'
import { AUDIT_ACTIONS, recordAudit } from '@/modules/audit'

export const metadata: Metadata = { title: 'Users and families' }

/**
 * Aggregate view of accounts. Deliberately shows counts and dates only - there
 * is no route from here into a family's notes, reflections or photographs.
 */
export default async function AdminUsersPage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requirePlatformAdminPage(),
  ])

  const families = await prisma.family.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      subscription: true,
      memberships: { include: { user: { select: { email: true, displayName: true, role: true } } } },
      _count: { select: { children: true, completions: true } },
    },
  })

  await recordAudit({
    action: AUDIT_ACTIONS.adminViewedFamilies,
    entityType: 'family',
    actorUserId: context.user.id,
    actorRole: context.user.role,
    metadata: { count: families.length },
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{d.admin.users}</h1>
      <Callout tone="info">{d.admin.aggregateNote}</Callout>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <caption className="q-visually-hidden">{d.admin.users}</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.auth.familyName}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.nav.account}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.nav.children}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.admin.completions}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.subscription.currentPlan}
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.admin.createdBy}
              </th>
            </tr>
          </thead>
          <tbody>
            {families.map((family) => (
              <tr key={family.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-semibold">
                  {family.name}
                  {family.deletedAt ? (
                    <Badge tone="danger" className="ml-2">
                      {d.settings.deleteTitle}
                    </Badge>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {family.memberships.map((membership) => membership.user.email).join(', ')}
                </td>
                <td className="px-5 py-3 tabular-nums">{family._count.children}</td>
                <td className="px-5 py-3 tabular-nums">{family._count.completions}</td>
                <td className="px-5 py-3">
                  <Badge tone={family.subscription?.plan === 'FAMILY_PREMIUM' ? 'moss' : 'neutral'}>
                    {family.subscription?.plan ?? 'FREE'}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-ink-muted">
                  {formatDate(family.createdAt, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

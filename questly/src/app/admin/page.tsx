import type { Metadata } from 'next'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { getTranslations } from '@/modules/localisation/server'
import { requireAdminPage } from '@/modules/auth/guards'
import { questStatistics } from '@/modules/admin/quests'

export const metadata: Metadata = { title: 'Admin dashboard' }

export default async function AdminDashboardPage() {
  const [{ d }] = await Promise.all([getTranslations(), requireAdminPage()])
  const stats = await questStatistics()

  const figures = [
    { label: d.admin.published, value: stats.questsByStatus.PUBLISHED ?? 0 },
    { label: d.admin.draft, value: stats.questsByStatus.DRAFT ?? 0 },
    { label: d.admin.archived, value: stats.questsByStatus.ARCHIVED ?? 0 },
    { label: d.admin.completions, value: stats.completions },
    { label: d.admin.users, value: stats.users },
    { label: d.nav.children, value: stats.childProfiles },
  ]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{d.admin.dashboard}</h1>
        <ButtonLink href="/admin/quests/new">{d.admin.newQuest}</ButtonLink>
      </header>

      <Callout tone="info">{d.admin.aggregateNote}</Callout>

      <dl className="grid gap-4 sm:grid-cols-3">
        {figures.map((figure) => (
          <div key={figure.label} className="q-card p-5">
            <dt className="text-sm font-semibold text-ink-muted">{figure.label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold">{figure.value}</dd>
          </div>
        ))}
      </dl>

      <Card>
        <CardHeader title={d.admin.statistics} description={d.admin.completions} />
        {stats.topQuests.length === 0 ? (
          <p className="text-sm text-ink-soft">—</p>
        ) : (
          <ol className="space-y-2">
            {stats.topQuests.map((quest) => (
              <li
                key={quest.questId}
                className="flex items-center justify-between gap-3 rounded-lg bg-paper-sunken px-4 py-2.5 text-sm"
              >
                <span className="font-medium">{quest.title}</span>
                <span className="font-semibold tabular-nums">{quest.completions}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { controlClassName } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/States'
import { QuestRowActions } from '@/components/admin/QuestRowActions'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate } from '@/modules/localisation/format'
import { requireAdminPage } from '@/modules/auth/guards'
import { listQuestsForAdmin } from '@/modules/admin/quests'
import type { QuestStatus } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Quests' }

const STATUSES: QuestStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED']

export default async function AdminQuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const [{ locale, d }, , params] = await Promise.all([
    getTranslations(),
    requireAdminPage(),
    searchParams,
  ])

  const status = STATUSES.includes(params.status as QuestStatus)
    ? (params.status as QuestStatus)
    : undefined

  const { items, total } = await listQuestsForAdmin({ status, search: params.q, take: 100 })

  const statusTone = (value: QuestStatus) =>
    value === 'PUBLISHED' ? 'success' : value === 'DRAFT' ? 'neutral' : 'ember'
  const statusLabel = (value: QuestStatus) =>
    value === 'PUBLISHED' ? d.admin.published : value === 'DRAFT' ? d.admin.draft : d.admin.archived

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{d.admin.quests}</h1>
        <ButtonLink href="/admin/quests/new">{d.admin.newQuest}</ButtonLink>
      </header>

      <form method="get" className="q-card flex flex-wrap items-end gap-3 p-4">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label htmlFor="admin-q" className="text-sm font-semibold">
            {d.common.search}
          </label>
          <input
            id="admin-q"
            name="q"
            type="search"
            defaultValue={params.q ?? ''}
            className={controlClassName}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-status" className="text-sm font-semibold">
            Status
          </label>
          <select
            id="admin-status"
            name="status"
            defaultValue={params.status ?? ''}
            className={controlClassName}
          >
            <option value="">{d.common.all}</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </div>
        <ButtonLink href="/admin/quests" variant="ghost">
          {d.common.clearFilters}
        </ButtonLink>
        <button type="submit" className="rounded-full bg-moss-600 px-5 py-2.5 font-semibold text-white">
          {d.common.filters}
        </button>
      </form>

      <p className="text-sm text-ink-soft">
        {total} {d.common.results}
      </p>

      {items.length === 0 ? (
        <EmptyState title={d.quest.noResults} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <caption className="q-visually-hidden">{d.admin.quests}</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="px-5 py-3 font-semibold">
                  {d.admin.editQuest}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {d.quest.category}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {d.admin.completions}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  {d.admin.lastChanged}
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  <span className="q-visually-hidden">{d.common.edit}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((quest) => {
                const translation =
                  quest.translations.find((row) => row.locale === locale) ?? quest.translations[0]
                return (
                  <tr key={quest.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/quests/${quest.id}`}
                        className="font-semibold hover:text-moss-700"
                      >
                        {translation?.title ?? quest.slug}
                      </Link>
                      <p className="text-xs text-ink-muted">{quest.slug}</p>
                    </td>
                    <td className="px-5 py-3">
                      {locale === 'nl' ? quest.category.nameNl : quest.category.nameEn}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone(quest.status)}>{statusLabel(quest.status)}</Badge>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{quest._count.completions}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {formatDate(quest.updatedAt, locale)}
                    </td>
                    <td className="px-5 py-3">
                      <QuestRowActions
                        questId={quest.id}
                        status={quest.status}
                        labels={{
                          publish: d.admin.publish,
                          unpublish: d.admin.unpublish,
                          archive: d.admin.archive,
                          restore: d.admin.restore,
                          duplicate: d.common.duplicate,
                        }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

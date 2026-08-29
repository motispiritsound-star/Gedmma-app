import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { controlClassName } from '@/components/ui/Field'
import { ButtonLink } from '@/components/ui/Button'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate } from '@/modules/localisation/format'
import { requirePlatformAdminPage } from '@/modules/auth/admin-guards'
import { listAuditLog } from '@/modules/audit'
import { getEnv } from '@/env'

export const metadata: Metadata = { title: 'Audit log' }

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>
}) {
  const [{ locale, d }, , params] = await Promise.all([
    getTranslations(),
    requirePlatformAdminPage(),
    searchParams,
  ])

  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const pageSize = 50
  const { items, total } = await listAuditLog({
    action: params.action,
    take: pageSize,
    skip: (page - 1) * pageSize,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{d.admin.auditLog}</h1>
      <Callout tone="info">
        {locale === 'nl'
          ? `Auditregels worden ${getEnv().RETENTION_AUDIT_LOG_DAYS} dagen bewaard. IP-adressen staan er alleen gehasht in.`
          : `Audit entries are kept for ${getEnv().RETENTION_AUDIT_LOG_DAYS} days. IP addresses are stored hashed only.`}
      </Callout>

      <form method="get" className="q-card flex flex-wrap items-end gap-3 p-4">
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="audit-action" className="text-sm font-semibold">
            Action
          </label>
          <input
            id="audit-action"
            name="action"
            type="search"
            defaultValue={params.action ?? ''}
            placeholder="quest.published"
            className={controlClassName}
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-moss-600 px-5 py-2.5 font-semibold text-white"
        >
          {d.common.filters}
        </button>
      </form>

      <p className="text-sm text-ink-soft">
        {total} {d.common.results}
      </p>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <caption className="q-visually-hidden">{d.admin.auditLog}</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="px-5 py-3 font-semibold">
                Action
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Entity
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Actor
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                {d.admin.lastChanged}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((entry) => (
              <tr key={entry.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-mono text-xs font-semibold">{entry.action}</td>
                <td className="px-5 py-3 text-ink-soft">
                  {entry.entityType}
                  {entry.entityId ? (
                    <span className="block font-mono text-xs text-ink-muted">{entry.entityId}</span>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-ink-soft">
                  {entry.actor?.displayName ?? '—'}
                  {entry.actorRole ? (
                    <span className="block text-xs text-ink-muted">{entry.actorRole}</span>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-ink-muted">{formatDate(entry.createdAt, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <nav className="flex gap-3" aria-label={d.admin.auditLog}>
        {page > 1 ? (
          <ButtonLink
            href={`/admin/audit?page=${page - 1}${params.action ? `&action=${params.action}` : ''}`}
            variant="secondary"
            size="sm"
          >
            ←
          </ButtonLink>
        ) : null}
        {page * pageSize < total ? (
          <ButtonLink
            href={`/admin/audit?page=${page + 1}${params.action ? `&action=${params.action}` : ''}`}
            variant="secondary"
            size="sm"
          >
            →
          </ButtonLink>
        ) : null}
      </nav>
    </div>
  )
}

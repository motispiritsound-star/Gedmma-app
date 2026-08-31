import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { PrintButton } from '@/components/PrintButton'
import { Logo } from '@/components/layout/Logo'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate, formatDuration } from '@/modules/localisation/format'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import { getFamilyStats } from '@/modules/progress/stats'
import { listAwardedBadges } from '@/modules/progress/badges'

export const metadata: Metadata = { title: 'Certificate', robots: { index: false } }

/**
 * A printable achievement certificate. Rendered as a normal page with print
 * styles rather than a generated PDF, so it needs no extra dependency and stays
 * readable on screen.
 */
export default async function CertificatePage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requireOnboardedFamilyPage('/dashboard/certificate'),
  ])

  if (!context.entitlements.certificates) redirect('/settings/subscription')

  const [stats, badges] = await Promise.all([
    getFamilyStats(context.family.id, locale),
    listAwardedBadges(context.family.id),
  ])

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-2xl print:hidden">
        {/* The button prints; it does not download a file, and it says so. */}
        <PrintButton label={d.dashboard.certificatePrint} />
      </div>

      <article className="q-card q-topo mx-auto max-w-2xl p-3 print:border-0 print:shadow-none">
        {/* A double rule: the outer card, and an inner keyline that makes the
            page read as a certificate rather than as another dashboard panel. */}
        <div className="rounded-xl border border-moss-200 p-8 sm:p-10">
        <div className="flex justify-center">
          <Logo size={44} />
        </div>
        <p className="mt-4 text-center text-sm font-semibold tracking-[0.2em] text-moss-700 uppercase">
          {d.common.appName}
        </p>
        <h1 className="mt-3 text-center font-display text-3xl font-semibold">
          {d.dashboard.certificateFor}
        </h1>
        <p className="mt-2 text-center text-2xl font-semibold">{context.family.name}</p>

        {stats.children.length > 0 ? (
          <>
            <p className="mt-6 text-center text-sm text-ink-muted">
              {d.dashboard.certificateAwardedTo}
            </p>
            <ul className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
              {stats.children.map((child) => (
                <li key={child.id} className="flex items-center gap-2">
                  <Avatar avatarKey={child.avatarKey} size={30} />
                  <span className="font-semibold">{child.nickname}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <dl className="mt-8 grid grid-cols-2 gap-6 text-left sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink-muted">{d.dashboard.completed}</dt>
            <dd className="font-display text-2xl font-semibold">{stats.completedCount}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">{d.dashboard.categoriesExplored}</dt>
            <dd className="font-display text-2xl font-semibold">
              {stats.categoriesExplored}/{stats.categoriesTotal}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-ink-muted">{d.dashboard.offlineTime}</dt>
            <dd className="font-display text-2xl font-semibold">
              {formatDuration(stats.reportedOfflineMinutes, locale)}
            </dd>
          </div>
        </dl>

        {badges.length > 0 ? (
          <>
            <h2 className="mt-8 text-center text-lg font-semibold">{d.dashboard.milestones}</h2>
            <p className="mt-2 text-center text-ink-soft">
              {badges
                .map((entry) => (locale === 'nl' ? entry.badge.nameNl : entry.badge.nameEn))
                .join(' · ')}
            </p>
          </>
        ) : null}

        <p className="mt-10 text-center text-sm text-ink-muted">
          {formatDate(new Date(), locale)}
        </p>
        <p className="mt-1 text-center text-xs text-ink-muted">{d.dashboard.offlineTimeNote}</p>
        </div>
      </article>
    </div>
  )
}

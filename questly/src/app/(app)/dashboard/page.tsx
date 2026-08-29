import type { Metadata } from 'next'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Callout, EmptyState, ProgressBar } from '@/components/ui/States'
import { CategoryIcon, IconStar } from '@/components/ui/Icons'
import { QuestCard } from '@/components/QuestCard'
import { ApproveCompletionButton } from '@/components/adventure/ApproveCompletionButton'
import { EvidenceThumbnail } from '@/components/EvidenceThumbnail'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate, formatDuration } from '@/modules/localisation/format'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import {
  getFamilyStats,
  listFamilyMemories,
  listPendingApprovals,
} from '@/modules/progress/stats'
import { listAwardedBadges } from '@/modules/progress/badges'
import { recommendForFamily } from '@/modules/recommendations/service'
import { ageBandLabel } from '@/modules/quests/labels'
import { signMediaUrl } from '@/modules/media/service'
import type { AgeBand } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Family dashboard' }

export default async function DashboardPage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requireOnboardedFamilyPage('/dashboard'),
  ])

  const [stats, memories, pending, awarded, recommendations] = await Promise.all([
    getFamilyStats(context.family.id, locale),
    context.entitlements.memoryCollection
      ? listFamilyMemories(context.family.id)
      : Promise.resolve([]),
    listPendingApprovals(context.family.id),
    listAwardedBadges(context.family.id),
    recommendForFamily({
      familyId: context.family.id,
      locale,
      entitlements: context.entitlements,
      limit: 3,
    }),
  ])

  const questTitle = (translations: Array<{ locale: string; title: string }>) =>
    translations.find((row) => row.locale === locale)?.title ?? translations[0]?.title ?? ''

  const figures = [
    { label: d.dashboard.completed, value: stats.completedCount },
    { label: d.dashboard.planned, value: stats.plannedCount },
    { label: d.dashboard.favourites, value: stats.favouriteCount },
    {
      label: d.dashboard.offlineTime,
      value: formatDuration(stats.reportedOfflineMinutes, locale),
    },
  ]

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">{d.dashboard.title}</h1>
        <p className="mt-1 text-ink-soft">{d.dashboard.subtitle}</p>
      </header>

      <section aria-label={d.dashboard.title}>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {figures.map((figure) => (
            <div key={figure.label} className="q-card p-5">
              <dt className="text-sm font-semibold text-ink-muted">{figure.label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold">{figure.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-ink-muted">{d.dashboard.offlineTimeNote}</p>
      </section>

      {pending.length > 0 ? (
        <Card>
          <CardHeader title={d.dashboard.pending} />
          <ul className="space-y-3">
            {pending.map((completion) => (
              <li
                key={completion.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper-sunken px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{questTitle(completion.quest.translations)}</p>
                  <p className="text-sm text-ink-soft">
                    {completion.participants.map((p) => p.childProfile.nickname).join(', ')}
                    {completion.finishedAt ? ` · ${formatDate(completion.finishedAt, locale)}` : ''}
                  </p>
                </div>
                <ApproveCompletionButton
                  completionId={completion.id}
                  label={d.completion.approve}
                />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {stats.completedCount === 0 ? (
        <EmptyState
          title={d.dashboard.emptyTitle}
          description={d.dashboard.emptyBody}
          action={<ButtonLink href="/quests">{d.home.exploreLibrary}</ButtonLink>}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={d.dashboard.categoriesExplored}
            description={`${stats.categoriesExplored} ${d.common.of} ${stats.categoriesTotal}`}
          />
          <ul className="space-y-3">
            {stats.categories.map((category) => (
              <li key={category.slug}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <CategoryIcon icon="compass" size={15} aria-hidden="true" />
                    {category.name}
                  </span>
                  <span className="text-ink-muted">
                    {category.completed}/{category.total}
                  </span>
                </div>
                <ProgressBar
                  value={category.completed}
                  max={Math.max(1, category.total)}
                  label={category.name}
                />
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title={d.dashboard.skillProfile} />
            {stats.skills.every((skill) => skill.points === 0) ? (
              <p className="text-sm text-ink-soft">{d.dashboard.emptyBody}</p>
            ) : (
              <ul className="space-y-3">
                {stats.skills.slice(0, 6).map((skill) => (
                  <li key={skill.slug}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{skill.name}</span>
                      <span className="text-ink-muted">{skill.points}</span>
                    </div>
                    <ProgressBar
                      value={skill.points}
                      max={Math.max(4, stats.skills[0]?.points ?? 4)}
                      label={skill.name}
                      tone="dusk"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title={d.dashboard.perChild} />
            <ul className="space-y-3">
              {stats.children.map((child) => (
                <li key={child.id} className="flex items-center gap-3">
                  <Avatar avatarKey={child.avatarKey} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{child.nickname}</p>
                    <p className="text-sm text-ink-soft">
                      {ageBandLabel(child.ageBand as AgeBand, locale)} · {child.completed}{' '}
                      {d.dashboard.completed.toLowerCase()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {context.entitlements.certificates && stats.completedCount > 0 ? (
              <ButtonLink href="/dashboard/certificate" variant="secondary" size="sm" className="mt-4">
                {d.dashboard.certificate}
              </ButtonLink>
            ) : null}
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title={d.dashboard.milestones} />
        {awarded.length === 0 ? (
          <p className="text-sm text-ink-soft">{d.dashboard.emptyBody}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {awarded.map((entry) => (
              <li key={entry.id}>
                <Badge tone="sun" icon={<IconStar size={14} />}>
                  {locale === 'nl' ? entry.badge.nameNl : entry.badge.nameEn}
                  <span className="ml-1 font-normal text-ink-muted">
                    {formatDate(entry.awardedAt, locale)}
                  </span>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title={d.dashboard.memories} description={d.completion.noteHint} />
        {!context.entitlements.memoryCollection ? (
          <Callout tone="info">
            {d.planner.premiumBody}{' '}
            <Link href="/settings/subscription">{d.subscription.upgrade}</Link>
          </Callout>
        ) : memories.length === 0 ? (
          <p className="text-sm text-ink-soft">{d.dashboard.memoriesEmpty}</p>
        ) : (
          <ul className="space-y-4">
            {memories.map((memory) => (
              <li key={memory.id} className="rounded-xl bg-paper-sunken p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{questTitle(memory.quest.translations)}</p>
                  <p className="text-sm text-ink-muted">
                    {memory.finishedAt ? formatDate(memory.finishedAt, locale) : ''}
                  </p>
                </div>
                <p className="text-sm text-ink-soft">
                  {memory.participants.map((p) => p.childProfile.nickname).join(', ')}
                </p>
                {memory.familyNote ? <p className="mt-2">{memory.familyNote}</p> : null}
                {memory.evidence.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-3">
                    {memory.evidence.map((evidence) => (
                      <li key={evidence.id}>
                        <EvidenceThumbnail
                          src={signMediaUrl({
                            evidenceId: evidence.id,
                            familyId: context.family.id,
                          }).url}
                          caption={evidence.caption}
                        />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {recommendations.length > 0 ? (
        <section aria-labelledby="dashboard-recommended">
          <h2 id="dashboard-recommended" className="mb-4 text-xl font-semibold">
            {d.dashboard.recommended}
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((recommendation) => (
              <li key={recommendation.quest.id} className="relative">
                <QuestCard
                  quest={recommendation.quest}
                  locale={locale}
                  d={d}
                  reasons={recommendation.reasons.slice(0, 2)}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

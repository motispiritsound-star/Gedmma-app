import type { Metadata } from 'next'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { QuestCard } from '@/components/QuestCard'
import { EmptyState, Callout } from '@/components/ui/States'
import { IconCompass } from '@/components/ui/Icons'
import { fill } from '@/modules/localisation'
import { getTranslations } from '@/modules/localisation/server'
import { formatShortDate } from '@/modules/localisation/format'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import { recommendForFamily } from '@/modules/recommendations/service'
import { getInProgressCompletion, listPendingApprovals } from '@/modules/progress/stats'
import { listPlannedQuests } from '@/modules/progress/service'

export const metadata: Metadata = { title: 'Home' }

export default async function HomePage() {
  const [{ locale, d }, context] = await Promise.all([
    getTranslations(),
    requireOnboardedFamilyPage(),
  ])

  const now = new Date()
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [recommendations, inProgress, planned, pending] = await Promise.all([
    recommendForFamily({
      familyId: context.family.id,
      locale,
      entitlements: context.entitlements,
      limit: 6,
    }),
    getInProgressCompletion(context.family.id),
    listPlannedQuests({ familyId: context.family.id, from: now, to: weekAhead }),
    listPendingApprovals(context.family.id),
  ])

  const title = (translations: Array<{ locale: string; title: string }>) =>
    translations.find((row) => row.locale === locale)?.title ?? translations[0]?.title ?? ''

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold">
          {fill(d.home.greeting, { name: context.user.displayName.split(' ')[0] ?? '' })}
        </h1>
        <p className="mt-1 text-ink-soft">{d.home.subtitle}</p>
      </header>

      {inProgress ? (
        <Card className="border-ember-100 bg-ember-50">
          <CardHeader
            title={d.home.inProgressTitle}
            description={title(inProgress.quest.translations)}
            action={
              <ButtonLink href={`/adventure/${inProgress.id}`}>{d.home.resume}</ButtonLink>
            }
          />
        </Card>
      ) : null}

      {pending.length > 0 ? (
        <Callout tone="warning" title={d.dashboard.pending}>
          <ul className="mt-1 space-y-1">
            {pending.map((completion) => (
              <li key={completion.id}>
                <Link href={`/adventure/${completion.id}/complete`} className="font-medium">
                  {title(completion.quest.translations)}
                </Link>
              </li>
            ))}
          </ul>
        </Callout>
      ) : null}

      <section aria-labelledby="recommendations">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="recommendations" className="text-xl font-semibold">
            {d.home.recommendedTitle}
          </h2>
          <Link href="/quests" className="text-sm font-semibold text-moss-700 underline">
            {d.home.exploreLibrary}
          </Link>
        </div>

        {recommendations.length === 0 ? (
          <EmptyState
            icon={<IconCompass size={36} />}
            title={d.home.emptyTitle}
            description={d.home.emptyBody}
            action={<ButtonLink href="/children">{d.children.add}</ButtonLink>}
          />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recommendations.map((recommendation) => (
              <li key={recommendation.quest.id} className="relative">
                <QuestCard
                  quest={recommendation.quest}
                  locale={locale}
                  d={d}
                  reasons={recommendation.reasons}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {planned.length > 0 ? (
        <section aria-labelledby="planned">
          <h2 id="planned" className="mb-4 text-xl font-semibold">
            {d.home.plannedTitle}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {planned.map((entry) => (
              <li key={entry.id}>
                <Card className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold">{title(entry.quest.translations)}</p>
                    <p className="text-sm text-ink-soft">
                      {formatShortDate(entry.scheduledFor, locale)}
                    </p>
                  </div>
                  <ButtonLink href={`/quests/${entry.quest.slug}`} size="sm" variant="secondary">
                    {d.common.preview}
                  </ButtonLink>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

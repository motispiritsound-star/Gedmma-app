import type { Metadata } from 'next'
import Link from 'next/link'
import { ButtonLink } from '@/components/ui/Button'
import { Callout } from '@/components/ui/States'
import { PlannerWeek } from '@/components/planner/PlannerWeek'
import { getTranslations } from '@/modules/localisation/server'
import { formatDate, formatShortDate } from '@/modules/localisation/format'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import { listPlannedQuests } from '@/modules/progress/service'
import { listQuests } from '@/modules/quests/queries'

export const metadata: Metadata = { title: 'Weekly planner' }

/** Monday of the week containing `date`, in UTC. */
function startOfWeek(date: Date): Date {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = (copy.getUTCDay() + 6) % 7
  copy.setUTCDate(copy.getUTCDate() - day)
  return copy
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const [{ locale, d }, context, params] = await Promise.all([
    getTranslations(),
    requireOnboardedFamilyPage('/planner'),
    searchParams,
  ])

  if (!context.entitlements.weeklyPlanner) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">{d.planner.title}</h1>
        <Callout tone="info" title={d.planner.premiumTitle}>
          {d.planner.premiumBody}{' '}
          <Link href="/settings/subscription">{d.subscription.upgrade}</Link>
        </Callout>
        <ButtonLink href="/settings/subscription">{d.subscription.upgrade}</ButtonLink>
      </div>
    )
  }

  const offset = Number(params.week ?? '0')
  const weekOffset = Number.isFinite(offset) ? Math.max(-8, Math.min(8, offset)) : 0
  const monday = addDays(startOfWeek(new Date()), weekOffset * 7)
  const sunday = addDays(monday, 6)

  const [planned, library] = await Promise.all([
    listPlannedQuests({ familyId: context.family.id, from: monday, to: sunday }),
    listQuests({
      filters: { access: 'all' },
      locale,
      entitlements: context.entitlements,
      take: 100,
    }),
  ])

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(monday, index)
    const iso = date.toISOString().slice(0, 10)
    return {
      iso,
      entries: planned
        .filter((entry) => entry.scheduledFor.toISOString().slice(0, 10) === iso)
        .map((entry) => ({
          id: entry.id,
          status: entry.status,
          timeOfDay: entry.timeOfDay,
          questSlug: entry.quest.slug,
          title:
            entry.quest.translations.find((row) => row.locale === locale)?.title ??
            entry.quest.translations[0]?.title ??
            entry.quest.slug,
          category: entry.quest.category.slug,
        })),
    }
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{d.planner.title}</h1>
          <p className="mt-1 text-ink-soft">
            <span className="font-medium text-ink">
              {formatShortDate(monday, locale)} – {formatDate(sunday, locale)}
            </span>{' '}
            · {d.planner.subtitle}
          </p>
        </div>
        <nav aria-label={d.planner.title} className="flex items-center gap-2">
          <ButtonLink href={`/planner?week=${weekOffset - 1}`} variant="secondary" size="sm">
            ← {d.planner.previousWeek}
          </ButtonLink>
          <ButtonLink href="/planner" variant="ghost" size="sm">
            {d.planner.thisWeek}
          </ButtonLink>
          <ButtonLink href={`/planner?week=${weekOffset + 1}`} variant="secondary" size="sm">
            {d.planner.nextWeek} →
          </ButtonLink>
        </nav>
      </header>

      <PlannerWeek
        days={days}
        locale={locale}
        todayIso={new Date().toISOString().slice(0, 10)}
        quests={library.items.map((quest) => ({ id: quest.id, title: quest.title }))}
        labels={{
          nothingPlanned: d.planner.nothingPlanned,
          addToDay: d.planner.addToDay,
          choose: d.planner.choose,
          markDone: d.planner.markDoneShort,
          skip: d.planner.skip,
          remove: d.planner.remove,
          planned: d.planner.planned,
          done: d.planner.done,
          skipped: d.planner.skipped,
          save: d.common.save,
          cancel: d.common.cancel,
          today: d.planner.today,
        }}
      />
    </div>
  )
}

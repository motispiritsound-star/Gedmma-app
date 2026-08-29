import type { Metadata } from 'next'
import { QuestCard } from '@/components/QuestCard'
import { QuestFilters } from '@/components/QuestFilters'
import { EmptyState } from '@/components/ui/States'
import { IconCompass } from '@/components/ui/Icons'
import { getTranslations } from '@/modules/localisation/server'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import { listCategories, listQuests, listSkills } from '@/modules/quests/queries'
import type { QuestFilters as Filters } from '@/modules/quests/types'
import { ALL_AGE_BANDS, ALL_DIFFICULTIES } from '@/modules/quests/labels'
import type { AgeBand, Difficulty, Setting, WeatherSuitability } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Quest library' }

type SearchParams = Record<string, string | string[] | undefined>

function readAll(params: SearchParams, key: string): string[] {
  const value = params[key]
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function parseFilters(params: SearchParams): Filters {
  const ageBands = readAll(params, 'age').filter((value): value is AgeBand =>
    (ALL_AGE_BANDS as string[]).includes(value),
  )
  const difficulty = readAll(params, 'difficulty').filter((value): value is Difficulty =>
    (ALL_DIFFICULTIES as string[]).includes(value),
  )
  const setting = params.setting
  const weather = params.weather
  const duration = Number(params.duration)
  const participants = Number(params.participants)

  return {
    ageBands: ageBands.length ? ageBands : undefined,
    categorySlugs: readAll(params, 'category').length ? readAll(params, 'category') : undefined,
    skillSlugs: readAll(params, 'skill').length ? readAll(params, 'skill') : undefined,
    difficulty: difficulty.length ? difficulty : undefined,
    maxDurationMinutes: Number.isFinite(duration) && duration > 0 ? duration : undefined,
    setting:
      setting === 'INDOOR' || setting === 'OUTDOOR' ? (setting as Setting) : undefined,
    weather:
      typeof weather === 'string' && weather !== '' && weather !== 'ALL'
        ? (weather as WeatherSuitability)
        : undefined,
    participants: Number.isFinite(participants) && participants > 0 ? participants : undefined,
    onlyCommonMaterials: params.materials === 'common',
    access: params.access === 'free' ? 'free' : 'all',
    search: typeof params.q === 'string' && params.q.trim() ? params.q.trim() : undefined,
  }
}

export default async function QuestLibraryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const [{ locale, d }, context, params] = await Promise.all([
    getTranslations(),
    requireOnboardedFamilyPage('/quests'),
    searchParams,
  ])

  const filters = parseFilters(params)
  const [categories, skills, result] = await Promise.all([
    listCategories(locale),
    listSkills(locale),
    listQuests({ filters, locale, entitlements: context.entitlements, take: 60 }),
  ])

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.library.title}</h1>
        <p className="mt-1 text-ink-soft">{d.library.subtitle}</p>
      </header>

      <QuestFilters
        d={d}
        locale={locale}
        categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
        skills={skills.map((skill) => ({ slug: skill.slug, name: skill.name }))}
        values={params}
      />

      <p className="text-sm text-ink-soft" role="status" aria-live="polite">
        {result.total} {d.common.results}
      </p>

      {result.items.length === 0 ? (
        <EmptyState
          icon={<IconCompass size={36} />}
          title={d.quest.noResults}
          description={d.quest.noResultsBody}
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {result.items.map((quest) => (
            <li key={quest.id} className="relative">
              <QuestCard quest={quest} locale={locale} d={d} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

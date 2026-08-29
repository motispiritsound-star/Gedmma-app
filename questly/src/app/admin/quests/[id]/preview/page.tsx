import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { QuestCard } from '@/components/QuestCard'
import { QuestIllustration } from '@/components/QuestIllustration'
import { getTranslations } from '@/modules/localisation/server'
import { formatDuration } from '@/modules/localisation/format'
import { requireAdminPage } from '@/modules/auth/guards'
import { getQuestById, toCardView, toDetailView } from '@/modules/quests/queries'
import { severityLabel } from '@/modules/quests/labels'
import type { Locale } from '@/modules/localisation'

export const metadata: Metadata = { title: 'Quest preview', robots: { index: false } }

/**
 * Side-by-side preview in both languages, so an editor can see exactly what a
 * family sees before publishing - including a draft that is not live yet.
 */
export default async function QuestPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ d }, , { id }] = await Promise.all([
    getTranslations(),
    requireAdminPage(),
    params,
  ])

  const quest = await getQuestById(id)
  if (!quest) notFound()

  const locales: Locale[] = ['nl', 'en']

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{d.common.preview}</h1>
        <Link href={`/admin/quests/${quest.id}`} className="font-semibold text-moss-700 underline">
          {d.admin.editQuest}
        </Link>
      </header>

      {quest.status !== 'PUBLISHED' ? (
        <Callout tone="warning">
          {quest.status} — {d.admin.aggregateNote}
        </Callout>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {locales.map((previewLocale) => {
          const card = toCardView(quest, previewLocale)
          const detail = toDetailView(quest, previewLocale)
          return (
            <section key={previewLocale} className="space-y-4" aria-label={previewLocale}>
              <Badge tone="dusk">{previewLocale === 'nl' ? 'Nederlands' : 'English'}</Badge>
              <QuestCard quest={card} locale={previewLocale} d={d} />
              <Card className="p-0">
                <QuestIllustration
                  imageKey={detail.imageKey}
                  colorToken={detail.category.colorToken}
                  icon={detail.category.icon}
                />
                <div className="space-y-4 p-5">
                  <h2 className="text-xl font-semibold">{detail.title}</h2>
                  <p className="text-ink-soft">{detail.story}</p>
                  <h3 className="font-semibold">{d.quest.objective}</h3>
                  <p className="text-sm text-ink-soft">{detail.educationalObjective}</p>
                  <h3 className="font-semibold">{d.quest.preparation}</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                    {detail.preparation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <h3 className="font-semibold">{d.quest.steps}</h3>
                  <ol className="space-y-3 text-sm">
                    {detail.steps.map((step, index) => (
                      <li key={step.id}>
                        <p className="font-semibold">
                          {index + 1}. {step.title}{' '}
                          <span className="font-normal text-ink-muted">
                            ({formatDuration(step.estimatedMinutes, previewLocale)})
                          </span>
                        </p>
                        <p className="text-ink-soft">{step.instruction}</p>
                      </li>
                    ))}
                  </ol>
                  {detail.safety.length > 0 ? (
                    <>
                      <h3 className="font-semibold">{d.quest.safety}</h3>
                      <ul className="space-y-1 text-sm text-ink-soft">
                        {detail.safety.map((item) => (
                          <li key={item.id}>
                            <strong>{severityLabel(item.severity, previewLocale)}:</strong>{' '}
                            {item.text}
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  <h3 className="font-semibold">{d.quest.reflection}</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                    {detail.reflectionQuestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </Card>
            </section>
          )
        })}
      </div>
    </div>
  )
}

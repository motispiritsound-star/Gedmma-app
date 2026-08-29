import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { QuestIllustration } from '@/components/QuestIllustration'
import { QuestActions } from '@/components/QuestActions'
import {
  IconClock,
  IconLock,
  IconShield,
  IconUsers,
  IconWarning,
  CategoryIcon,
} from '@/components/ui/Icons'
import { getTranslations } from '@/modules/localisation/server'
import { formatDuration } from '@/modules/localisation/format'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import { getQuestDetail } from '@/modules/quests/queries'
import { ageBandLabel, difficultyLabel, settingLabel, severityLabel } from '@/modules/quests/labels'
import { isAppError } from '@/lib/errors'
import { prisma } from '@/lib/db'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const quest = await prisma.quest.findUnique({
    where: { slug },
    include: { translations: true },
  })
  const title = quest?.translations.find((row) => row.locale === 'en')?.title
  return { title: title ?? 'Adventure' }
}

export default async function QuestDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ locale, d }, context, { slug }] = await Promise.all([
    getTranslations(),
    requireOnboardedFamilyPage(),
    params,
  ])

  let quest
  try {
    quest = await getQuestDetail({ slug, locale, entitlements: context.entitlements })
  } catch (error) {
    if (isAppError(error) && error.code === 'not_found') notFound()
    throw error
  }

  const [favourite, inProgress] = await Promise.all([
    prisma.favouriteQuest.findUnique({
      where: { familyId_questId: { familyId: context.family.id, questId: quest.id } },
    }),
    prisma.questCompletion.findFirst({
      where: { familyId: context.family.id, questId: quest.id, status: 'IN_PROGRESS' },
    }),
  ])

  const totalStepMinutes = quest.steps.reduce((sum, step) => sum + step.estimatedMinutes, 0)

  return (
    <article className="space-y-8">
      <header className="q-card overflow-hidden">
        <QuestIllustration
          imageKey={quest.imageKey}
          colorToken={quest.category.colorToken}
          icon={quest.category.icon}
          height={180}
        />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="moss" icon={<CategoryIcon icon={quest.category.icon} size={14} />}>
              {quest.category.name}
            </Badge>
            {quest.isPremium ? (
              <Badge tone="sun" icon={<IconLock size={13} />}>
                {d.common.premium}
              </Badge>
            ) : (
              <Badge tone="neutral">{d.common.free}</Badge>
            )}
            {quest.requiresAdult ? (
              <Badge tone="ember" icon={<IconShield size={13} />}>
                {d.quest.safetyAdult}
              </Badge>
            ) : null}
          </div>

          <h1 className="text-3xl font-semibold">{quest.title}</h1>
          <p className="q-prose text-lg text-ink-soft">{quest.shortDescription}</p>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="font-semibold text-ink-muted">{d.quest.duration}</dt>
              <dd className="mt-0.5 flex items-center gap-1.5">
                <IconClock size={15} aria-hidden="true" />
                {formatDuration(quest.durationMinutes, locale)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">{d.quest.ageBand}</dt>
              <dd className="mt-0.5">
                {quest.ageBands.map((band) => ageBandLabel(band, locale)).join(' · ')}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">{d.quest.difficulty}</dt>
              <dd className="mt-0.5">{difficultyLabel(quest.difficulty, locale)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">{d.quest.setting}</dt>
              <dd className="mt-0.5">{settingLabel(quest.setting, locale)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-muted">{d.quest.participants}</dt>
              <dd className="mt-0.5 flex items-center gap-1.5">
                <IconUsers size={15} aria-hidden="true" />
                {quest.minParticipants}
                {quest.maxParticipants > quest.minParticipants ? `-${quest.maxParticipants}` : ''}
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <dt className="font-semibold text-ink-muted">{d.quest.skills}</dt>
              <dd className="mt-0.5">{quest.skills.map((skill) => skill.name).join(' · ')}</dd>
            </div>
          </dl>

          {quest.locked ? (
            <Callout tone="warning" title={d.quest.premiumOnly}>
              {d.quest.premiumBody}
            </Callout>
          ) : null}

          <QuestActions
            questId={quest.id}
            questSlug={quest.slug}
            locked={quest.locked}
            isFavourite={Boolean(favourite)}
            inProgressId={inProgress?.id ?? null}
            canPlan={context.entitlements.weeklyPlanner}
            labels={{
              start: d.quest.startQuest,
              continue: d.quest.continueQuest,
              addFavourite: d.quest.addFavourite,
              removeFavourite: d.quest.removeFavourite,
              plan: d.quest.planQuest,
              upgrade: d.subscription.upgrade,
            }}
          />
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-semibold">{d.quest.story}</h2>
            <p className="q-prose mt-3 text-ink-soft">{quest.story}</p>
            <h3 className="mt-6 font-semibold">{d.quest.objective}</h3>
            <p className="q-prose mt-1.5 text-ink-soft">{quest.educationalObjective}</p>
            <h3 className="mt-6 font-semibold">{d.quest.expectedResult}</h3>
            <p className="q-prose mt-1.5 text-ink-soft">{quest.expectedResult}</p>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">{d.quest.steps}</h2>
            {quest.locked ? (
              <p className="mt-3 text-ink-soft">{d.quest.premiumBody}</p>
            ) : (
              <ol className="mt-4 space-y-5">
                {quest.steps.map((step, index) => (
                  <li key={step.id} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-moss-50 font-semibold text-moss-700"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        <span className="q-visually-hidden">
                          {d.quest.step} {index + 1}:{' '}
                        </span>
                        {step.title}
                      </h3>
                      <p className="mt-1 text-ink-soft">{step.instruction}</p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {formatDuration(step.estimatedMinutes, locale)}
                        {step.requiresAdult ? ` · ${d.quest.safetyAdult}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {totalStepMinutes > 0 && !quest.locked ? (
              <p className="mt-5 border-t border-line pt-3 text-sm text-ink-muted">
                {d.quest.duration}: {formatDuration(totalStepMinutes, locale)}
              </p>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-xl font-semibold">{d.quest.reflection}</h2>
            <ul className="mt-3 space-y-2 text-ink-soft">
              {quest.reflectionQuestions.map((question) => (
                <li key={question} className="flex gap-2">
                  <span aria-hidden="true">·</span>
                  {question}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold">{d.quest.preparation}</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {quest.preparation.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true">☐</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold">{d.quest.materials}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {quest.materialsDetailed.map((material) => (
                <li key={material.slug}>
                  {material.name}
                  {material.quantity ? ` — ${material.quantity}` : ''}
                  {material.optional ? ` (${d.common.optional})` : ''}
                </li>
              ))}
            </ul>
          </Card>

          {quest.safety.length > 0 ? (
            <Card className="border-ember-100 bg-ember-50">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ember-700">
                <IconWarning size={18} aria-hidden="true" />
                {d.quest.safety}
              </h2>
              <ul className="mt-3 space-y-3 text-sm">
                {quest.safety.map((item) => (
                  <li key={item.id}>
                    <span className="font-semibold text-ember-700">
                      {severityLabel(item.severity, locale)}:
                    </span>{' '}
                    <span className="text-ink-soft">{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </section>
    </article>
  )
}

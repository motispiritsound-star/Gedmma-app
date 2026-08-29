import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Callout } from '@/components/ui/States'
import { IconStar } from '@/components/ui/Icons'
import { CompletionForm } from '@/components/adventure/CompletionForm'
import { ApproveCompletionButton } from '@/components/adventure/ApproveCompletionButton'
import { getTranslations } from '@/modules/localisation/server'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import { getCompletionForFamily } from '@/modules/progress/service'
import { listChildProfiles } from '@/modules/families/service'
import { prisma } from '@/lib/db'
import { isAppError } from '@/lib/errors'
import { getEnv } from '@/env'

export const metadata: Metadata = { title: 'Complete the adventure' }

export default async function CompletionPage({
  params,
}: {
  params: Promise<{ completionId: string }>
}) {
  const [{ locale, d }, context, { completionId }] = await Promise.all([
    getTranslations(),
    requireOnboardedFamilyPage(),
    params,
  ])

  let completion
  try {
    completion = await getCompletionForFamily(completionId, context.family.id)
  } catch (error) {
    if (isAppError(error) && (error.code === 'not_found' || error.code === 'forbidden')) notFound()
    throw error
  }

  const translation =
    completion.quest.translations.find((row) => row.locale === locale) ??
    completion.quest.translations[0]

  const [children, awarded] = await Promise.all([
    listChildProfiles(context.family.id),
    prisma.awardedBadge.findMany({
      where: { familyId: context.family.id, completionId: completion.id },
      include: { badge: true },
    }),
  ])

  const done = completion.status === 'APPROVED' || completion.status === 'PENDING_APPROVAL'

  if (done) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="q-topo text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-moss-600 text-white">
            <IconStar size={30} />
          </span>
          <h1 className="mt-4 text-3xl font-semibold">{d.completion.successTitle}</h1>
          <p className="mt-2 text-ink-soft">
            {completion.status === 'PENDING_APPROVAL'
              ? d.completion.successApproval
              : d.completion.successBody}
          </p>
          <p className="mt-3 font-semibold">{translation?.title}</p>

          {completion.status === 'PENDING_APPROVAL' ? (
            <div className="mt-6">
              <ApproveCompletionButton completionId={completion.id} label={d.completion.approve} />
            </div>
          ) : null}
        </Card>

        {awarded.length > 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">{d.completion.badgesEarned}</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {awarded.map((entry) => (
                <li key={entry.id}>
                  <Badge tone="sun" icon={<IconStar size={14} />}>
                    {locale === 'nl' ? entry.badge.nameNl : entry.badge.nameEn}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card>
          <h2 className="text-lg font-semibold">{d.completion.who}</h2>
          <p className="mt-2 text-ink-soft">
            {completion.participants.map((entry) => entry.childProfile.nickname).join(', ') || '—'}
          </p>
          {completion.reflections.length > 0 ? (
            <>
              <h2 className="mt-6 text-lg font-semibold">{d.completion.reflectionTitle}</h2>
              <dl className="mt-3 space-y-3">
                {completion.reflections.map((reflection) => (
                  <div key={reflection.id}>
                    <dt className="text-sm font-semibold text-ink-soft">{reflection.question}</dt>
                    <dd className="mt-0.5">{reflection.answer}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
          {completion.familyNote ? (
            <>
              <h2 className="mt-6 text-lg font-semibold">{d.completion.note}</h2>
              <p className="mt-1 text-ink-soft">{completion.familyNote}</p>
            </>
          ) : null}
          {completion.evidence.length > 0 ? (
            <Callout tone="info" className="mt-6">
              {completion.evidence.length} × {d.completion.evidence} —{' '}
              <Link href="/dashboard" className="underline">
                {d.dashboard.memories}
              </Link>
            </Callout>
          ) : null}
        </Card>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/home">{d.completion.backToHome}</ButtonLink>
          <ButtonLink href="/dashboard" variant="secondary">
            {d.nav.dashboard}
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold">{d.completion.title}</h1>
        <p className="mt-1 text-ink-soft">{d.completion.subtitle}</p>
        <p className="mt-3 font-semibold">{translation?.title}</p>
      </header>

      <CompletionForm
        completionId={completion.id}
        childProfiles={children.map((child) => ({
          id: child.id,
          nickname: child.nickname,
          avatarKey: child.avatarKey,
        }))}
        reflectionQuestions={translation?.reflectionQuestions ?? []}
        requiresApproval={context.family.requireParentApproval}
        maxUploadBytes={getEnv().MEDIA_MAX_UPLOAD_BYTES}
        labels={{
          who: d.completion.who,
          whoRequired: d.completion.whoRequired,
          timeSpent: d.completion.timeSpent,
          timeSpentHint: d.completion.timeSpentHint,
          reflectionTitle: d.completion.reflectionTitle,
          note: d.completion.note,
          noteHint: d.completion.noteHint,
          evidence: d.completion.evidence,
          evidenceHint: d.completion.evidenceHint,
          submit: d.completion.submit,
          submitForApproval: d.completion.submitForApproval,
          saving: d.common.saving,
          optional: d.common.optional,
          minutes: d.common.minutes,
        }}
      />
    </div>
  )
}

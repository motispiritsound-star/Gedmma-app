import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { AdventureMode } from '@/components/adventure/AdventureMode'
import { getTranslations } from '@/modules/localisation/server'
import { requireOnboardedFamilyPage } from '@/modules/auth/guards'
import { getCompletionForFamily } from '@/modules/progress/service'
import { getQuestDetail } from '@/modules/quests/queries'
import { isAppError } from '@/lib/errors'

export const metadata: Metadata = { title: 'Adventure Mode' }

export default async function AdventurePage({
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

  if (completion.status !== 'IN_PROGRESS') {
    redirect(`/adventure/${completionId}/complete`)
  }

  const quest = await getQuestDetail({
    slug: completion.quest.slug,
    locale,
    entitlements: context.entitlements,
  })

  return (
    <AdventureMode
      completionId={completion.id}
      quest={quest}
      locale={locale}
      labels={{
        title: d.adventure.title,
        prepareTitle: d.adventure.prepareTitle,
        countdown: d.adventure.countdown,
        checklistTitle: d.adventure.checklistTitle,
        checklistHint: d.adventure.checklistHint,
        putAwayTitle: d.adventure.putAwayTitle,
        putAwayBody: d.adventure.putAwayBody,
        understood: d.adventure.understood,
        stepOf: d.adventure.stepOf,
        timer: d.adventure.timer,
        startTimer: d.adventure.startTimer,
        pauseTimer: d.adventure.pauseTimer,
        resetTimer: d.adventure.resetTimer,
        nextStep: d.adventure.nextStep,
        previousStep: d.adventure.previousStep,
        finishAdventure: d.adventure.finishAdventure,
        abandon: d.adventure.abandon,
        abandonConfirm: d.adventure.abandonConfirm,
        offlineReady: d.adventure.offlineReady,
        offlineUnavailable: d.adventure.offlineUnavailable,
        honestNote: d.adventure.honestNote,
        listen: d.quest.listenToStep,
        stopListening: d.quest.stopListening,
        ttsUnsupported: d.quest.ttsUnsupported,
        materials: d.quest.materials,
        safety: d.quest.safety,
        stepProgress: d.a11y.stepProgress,
      }}
    />
  )
}

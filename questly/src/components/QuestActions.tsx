'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, ButtonLink } from '@/components/ui/Button'
import { IconCalendar, IconHeart } from '@/components/ui/Icons'
import { startQuestAction, toggleFavouriteAction } from '@/app/(app)/quest-actions'
import { PlanQuestDialog } from '@/components/PlanQuestDialog'

export function QuestActions({
  questId,
  questSlug,
  locked,
  isFavourite,
  inProgressId,
  canPlan,
  labels,
}: {
  questId: string
  questSlug: string
  locked: boolean
  isFavourite: boolean
  inProgressId: string | null
  canPlan: boolean
  labels: {
    start: string
    continue: string
    addFavourite: string
    removeFavourite: string
    plan: string
    upgrade: string
  }
}) {
  const router = useRouter()
  const [favourite, setFavourite] = useState(isFavourite)
  const [pending, startTransition] = useTransition()
  const [planOpen, setPlanOpen] = useState(false)

  if (locked) {
    return (
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/settings/subscription" size="lg">
          {labels.upgrade}
        </ButtonLink>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {inProgressId ? (
          <ButtonLink href={`/adventure/${inProgressId}`} size="lg">
            {labels.continue}
          </ButtonLink>
        ) : (
          <Button
            size="lg"
            disabled={pending}
            onClick={() => startTransition(() => startQuestAction(questId))}
          >
            {labels.start}
          </Button>
        )}

        <Button
          variant="secondary"
          aria-pressed={favourite}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const next = await toggleFavouriteAction(questId)
              setFavourite(next)
              router.refresh()
            })
          }
        >
          <IconHeart size={17} />
          {favourite ? labels.removeFavourite : labels.addFavourite}
        </Button>

        {canPlan ? (
          <Button variant="secondary" onClick={() => setPlanOpen(true)}>
            <IconCalendar size={17} />
            {labels.plan}
          </Button>
        ) : null}
      </div>

      {planOpen ? (
        <PlanQuestDialog
          questId={questId}
          questSlug={questSlug}
          onClose={() => setPlanOpen(false)}
          labels={{ title: labels.plan, submit: labels.plan }}
        />
      ) : null}
    </>
  )
}

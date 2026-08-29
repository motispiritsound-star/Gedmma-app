'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import {
  cancelSubscriptionAction,
  resumeSubscriptionAction,
  upgradeAction,
} from '@/app/(app)/subscription-actions'

export function SubscriptionActions({
  isPremium,
  cancelAtPeriodEnd,
  labels,
}: {
  isPremium: boolean
  cancelAtPeriodEnd: boolean
  labels: { upgrade: string; cancel: string; resume: string }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (!isPremium) {
    return (
      <Button size="lg" disabled={pending} onClick={() => startTransition(() => upgradeAction())}>
        {labels.upgrade}
      </Button>
    )
  }

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          if (cancelAtPeriodEnd) await resumeSubscriptionAction()
          else await cancelSubscriptionAction()
          router.refresh()
        })
      }
    >
      {cancelAtPeriodEnd ? labels.resume : labels.cancel}
    </Button>
  )
}

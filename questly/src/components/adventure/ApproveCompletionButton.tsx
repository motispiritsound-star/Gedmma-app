'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { approveCompletionAction } from '@/app/(app)/quest-actions'

export function ApproveCompletionButton({
  completionId,
  label,
}: {
  completionId: string
  label: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await approveCompletionAction(completionId)
          router.refresh()
        })
      }
    >
      {label}
    </Button>
  )
}

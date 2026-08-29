'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { duplicateQuestAction, setQuestStatusAction } from '@/app/admin/admin-actions'
import type { QuestStatus } from '@/generated/prisma/client'

export function QuestRowActions({
  questId,
  status,
  labels,
}: {
  questId: string
  status: QuestStatus
  labels: {
    publish: string
    unpublish: string
    archive: string
    restore: string
    duplicate: string
  }
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const run = (next: QuestStatus) =>
    startTransition(async () => {
      await setQuestStatusAction(questId, next)
      router.refresh()
    })

  return (
    <div className="flex flex-wrap justify-end gap-1">
      {status !== 'PUBLISHED' ? (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run('PUBLISHED')}>
          {labels.publish}
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run('DRAFT')}>
          {labels.unpublish}
        </Button>
      )}
      {status !== 'ARCHIVED' ? (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run('ARCHIVED')}>
          {labels.archive}
        </Button>
      ) : (
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run('DRAFT')}>
          {labels.restore}
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() => startTransition(() => duplicateQuestAction(questId))}
      >
        {labels.duplicate}
      </Button>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/States'
import { ChildProfileForm } from '@/components/family/ChildProfileForm'
import { createChildAction, deleteChildAction, updateChildAction } from '@/app/(app)/family-actions'
import { ageBandLabel } from '@/modules/quests/labels'
import type { Locale } from '@/modules/localisation'
import type { AgeBand } from '@/generated/prisma/client'

type Child = {
  id: string
  nickname: string
  ageBand: string
  avatarKey: string
  interestIds: string[]
}

export function ChildProfileManager({
  childProfiles,
  interests,
  locale,
  canAdd,
  labels,
}: {
  childProfiles: Child[]
  interests: Array<{ id: string; name: string }>
  locale: Locale
  canAdd: boolean
  labels: {
    add: string
    edit: string
    remove: string
    removeConfirm: string
    nickname: string
    nicknameHint: string
    ageBand: string
    avatar: string
    interests: string
    interestsHint: string
    save: string
    cancel: string
    saving: string
    empty: string
  }
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [pending, startTransition] = useTransition()

  const formLabels = {
    nickname: labels.nickname,
    nicknameHint: labels.nicknameHint,
    ageBand: labels.ageBand,
    avatar: labels.avatar,
    interests: labels.interests,
    interestsHint: labels.interestsHint,
    save: labels.save,
    cancel: labels.cancel,
    saving: labels.saving,
  }

  return (
    <div className="space-y-5">
      {childProfiles.length === 0 && !adding ? (
        <EmptyState
          title={labels.empty}
          action={<Button onClick={() => setAdding(true)}>{labels.add}</Button>}
        />
      ) : null}

      <ul className="space-y-4">
        {childProfiles.map((child) => (
          <li key={child.id}>
            <Card>
              {editingId === child.id ? (
                <ChildProfileForm
                  action={updateChildAction}
                  values={child}
                  interests={interests}
                  locale={locale}
                  labels={formLabels}
                  onSuccess={() => {
                    setEditingId(null)
                    router.refresh()
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <Avatar avatarKey={child.avatarKey} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold">{child.nickname}</p>
                    <p className="text-sm text-ink-soft">
                      {ageBandLabel(child.ageBand as AgeBand, locale)} · {child.interestIds.length}{' '}
                      {labels.interests.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(child.id)}>
                      {labels.edit}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm(labels.removeConfirm)) return
                        startTransition(async () => {
                          await deleteChildAction(child.id)
                          router.refresh()
                        })
                      }}
                    >
                      {labels.remove}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </li>
        ))}
      </ul>

      {adding ? (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">{labels.add}</h2>
          <ChildProfileForm
            action={createChildAction}
            interests={interests}
            locale={locale}
            labels={formLabels}
            onSuccess={() => {
              setAdding(false)
              router.refresh()
            }}
            onCancel={() => setAdding(false)}
          />
        </Card>
      ) : childProfiles.length > 0 && canAdd ? (
        <Button onClick={() => setAdding(true)}>{labels.add}</Button>
      ) : null}
    </div>
  )
}

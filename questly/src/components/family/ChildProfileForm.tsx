'use client'

import { useActionState, useEffect } from 'react'
import { Avatar, AVATAR_LABELS } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { controlClassName } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { firstError, idleState, type FormState } from '@/lib/form'
import { AVATAR_KEYS } from '@/modules/families/schemas'
import { ALL_AGE_BANDS, ageBandLabel } from '@/modules/quests/labels'
import type { Locale } from '@/modules/localisation'

export type ChildFormLabels = {
  nickname: string
  nicknameHint: string
  ageBand: string
  avatar: string
  interests: string
  interestsHint: string
  save: string
  cancel: string
  saving: string
}

export type ChildFormValues = {
  id?: string
  nickname?: string
  ageBand?: string
  avatarKey?: string
  interestIds?: string[]
}

/** Shared by onboarding and the child profiles page. */
export function ChildProfileForm({
  action,
  values,
  interests,
  locale,
  labels,
  onSuccess,
  onCancel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  values?: ChildFormValues
  interests: Array<{ id: string; name: string }>
  locale: Locale
  labels: ChildFormLabels
  onSuccess?: () => void
  onCancel?: () => void
}) {
  const [state, formAction, pending] = useActionState(action, idleState)

  useEffect(() => {
    if (state.status === 'success') onSuccess?.()
  }, [state.status, onSuccess])

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {values?.id ? <input type="hidden" name="childId" value={values.id} /> : null}

      {state.status === 'error' && state.message ? (
        <Callout tone="danger" role="alert">
          {state.message}
        </Callout>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nickname" className="text-sm font-semibold">
            {labels.nickname}
          </label>
          <p id="nickname-hint" className="text-sm text-ink-soft">
            {labels.nicknameHint}
          </p>
          <input
            id="nickname"
            name="nickname"
            type="text"
            required
            maxLength={24}
            defaultValue={values?.nickname ?? ''}
            aria-describedby="nickname-hint"
            aria-invalid={Boolean(firstError(state, 'nickname'))}
            className={controlClassName}
          />
          {firstError(state, 'nickname') ? (
            <p className="text-sm font-medium text-danger-600">{firstError(state, 'nickname')}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ageBand" className="text-sm font-semibold">
            {labels.ageBand}
          </label>
          <select
            id="ageBand"
            name="ageBand"
            required
            defaultValue={values?.ageBand ?? 'AGE_6_8'}
            className={controlClassName}
          >
            {ALL_AGE_BANDS.map((band) => (
              <option key={band} value={band}>
                {ageBandLabel(band, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">{labels.avatar}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATAR_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-line-strong p-2 has-checked:border-moss-500 has-checked:bg-moss-50"
            >
              <input
                type="radio"
                name="avatarKey"
                value={key}
                defaultChecked={(values?.avatarKey ?? 'fox') === key}
                className="q-visually-hidden"
              />
              <Avatar avatarKey={key} size={40} />
              <span className="text-xs">{AVATAR_LABELS[key]?.[locale] ?? key}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">{labels.interests}</legend>
        <p className="mt-1 text-sm text-ink-soft">{labels.interestsHint}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {interests.map((interest) => (
            <label
              key={interest.id}
              className="cursor-pointer rounded-full border border-line-strong px-3.5 py-1.5 text-sm has-checked:border-moss-500 has-checked:bg-moss-50 has-checked:font-semibold has-checked:text-moss-700"
            >
              <input
                type="checkbox"
                name="interestIds"
                value={interest.id}
                defaultChecked={values?.interestIds?.includes(interest.id) ?? false}
                className="q-visually-hidden"
              />
              {interest.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {labels.cancel}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

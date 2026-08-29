'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { controlClassName } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { idleState } from '@/lib/form'
import { updateFamilyAction } from '@/app/(app)/family-actions'
import { ALL_DIFFICULTIES, difficultyLabel, environmentLabel } from '@/modules/quests/labels'
import type { Locale } from '@/modules/localisation'

export function FamilySettingsForm({
  locale,
  values,
  labels,
}: {
  locale: Locale
  values: {
    name: string
    environment: string
    adultCount: number
    preferredDuration: number
    preferredDifficulty: string
    preferredSetting: string
    prefersFamilyActivity: boolean
    requireParentApproval: boolean
    locale: string
  }
  labels: {
    familyName: string
    environment: string
    adults: string
    duration: string
    difficulty: string
    setting: string
    familyActivity: string
    approval: string
    approvalHint: string
    language: string
    save: string
    saving: string
    saved: string
  }
}) {
  const [state, action, pending] = useActionState(updateFamilyAction, idleState)

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.status === 'success' ? (
        <Callout tone="success" role="status">
          {labels.saved}
        </Callout>
      ) : null}
      {state.status === 'error' ? (
        <Callout tone="danger" role="alert">
          {state.message}
        </Callout>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-sm font-semibold">
            {labels.familyName}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={values.name}
            className={controlClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="environment" className="text-sm font-semibold">
            {labels.environment}
          </label>
          <select
            id="environment"
            name="environment"
            defaultValue={values.environment}
            className={controlClassName}
          >
            {(['CITY', 'SUBURB', 'RURAL'] as const).map((option) => (
              <option key={option} value={option}>
                {environmentLabel(option, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="adultCount" className="text-sm font-semibold">
            {labels.adults}
          </label>
          <input
            id="adultCount"
            name="adultCount"
            type="number"
            min={1}
            max={6}
            defaultValue={values.adultCount}
            className={controlClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="preferredDuration" className="text-sm font-semibold">
            {labels.duration}
          </label>
          <select
            id="preferredDuration"
            name="preferredDuration"
            defaultValue={String(values.preferredDuration)}
            className={controlClassName}
          >
            {[30, 45, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="preferredDifficulty" className="text-sm font-semibold">
            {labels.difficulty}
          </label>
          <select
            id="preferredDifficulty"
            name="preferredDifficulty"
            defaultValue={values.preferredDifficulty}
            className={controlClassName}
          >
            {ALL_DIFFICULTIES.map((value) => (
              <option key={value} value={value}>
                {difficultyLabel(value, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="preferredSetting" className="text-sm font-semibold">
            {labels.setting}
          </label>
          <select
            id="preferredSetting"
            name="preferredSetting"
            defaultValue={values.preferredSetting}
            className={controlClassName}
          >
            <option value="BOTH">{locale === 'nl' ? 'Maakt niet uit' : 'No preference'}</option>
            <option value="INDOOR">{locale === 'nl' ? 'Binnen' : 'Indoor'}</option>
            <option value="OUTDOOR">{locale === 'nl' ? 'Buiten' : 'Outdoor'}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="locale" className="text-sm font-semibold">
            {labels.language}
          </label>
          <select
            id="locale"
            name="locale"
            defaultValue={values.locale}
            className={controlClassName}
          >
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="prefersFamilyActivity"
          defaultChecked={values.prefersFamilyActivity}
          className="mt-1 size-5 accent-moss-600"
        />
        <span className="text-sm font-medium">{labels.familyActivity}</span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="requireParentApproval"
          defaultChecked={values.requireParentApproval}
          className="mt-1 size-5 accent-moss-600"
        />
        <span>
          <span className="text-sm font-medium">{labels.approval}</span>
          <span className="block text-sm text-ink-soft">{labels.approvalHint}</span>
        </span>
      </label>

      <Button type="submit" disabled={pending}>
        {pending ? labels.saving : labels.save}
      </Button>
    </form>
  )
}

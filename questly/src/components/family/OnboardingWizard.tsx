'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { controlClassName } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { ChildProfileForm } from '@/components/family/ChildProfileForm'
import { createChildAction, finishOnboardingAction } from '@/app/(app)/family-actions'
import { idleState } from '@/lib/form'
import { fill, type Locale } from '@/modules/localisation'
import { ALL_DIFFICULTIES, ageBandLabel, difficultyLabel, environmentLabel } from '@/modules/quests/labels'
import type { AgeBand } from '@/generated/prisma/client'
import { cn } from '@/lib/cn'

type FamilyValues = {
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

type WizardLabels = {
  title: string
  stepFamily: string
  stepChildren: string
  stepPreferences: string
  familyName: string
  familyNameHint: string
  environment: string
  environmentHint: string
  adults: string
  duration: string
  difficulty: string
  setting: string
  familyActivity: string
  approval: string
  approvalHint: string
  addChild: string
  noChildrenYet: string
  finishTitle: string
  goToHome: string
  back: string
  next: string
  saving: string
  nickname: string
  nicknameHint: string
  ageBand: string
  avatar: string
  interests: string
  interestsHint: string
  save: string
  cancel: string
  limitReached: string
}

type Child = {
  id: string
  nickname: string
  ageBand: string
  avatarKey: string
  interestIds: string[]
}

/**
 * Three short steps. Nothing here is a dark pattern: every field has a sensible
 * default, and the only required decision is what to call the family.
 */
export function OnboardingWizard({
  locale,
  family,
  childProfiles,
  interests,
  maxChildProfiles,
  d,
}: {
  locale: Locale
  family: FamilyValues
  childProfiles: Child[]
  interests: Array<{ id: string; name: string }>
  maxChildProfiles: number
  d: WizardLabels
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState(family)
  const [addingChild, setAddingChild] = useState(childProfiles.length === 0)
  const [state, action, pending] = useActionState(finishOnboardingAction, idleState)

  const steps = [d.stepFamily, d.stepChildren, d.stepPreferences]
  const atLimit = childProfiles.length >= maxChildProfiles

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-3xl font-semibold">{d.title}</h1>
        <ol className="mt-5 flex gap-2" aria-label={d.title}>
          {steps.map((label, index) => (
            <li key={label} className="flex-1">
              <div
                aria-current={index === step ? 'step' : undefined}
                className={cn(
                  'rounded-full border px-3 py-2 text-center text-sm font-semibold',
                  index === step
                    ? 'border-moss-600 bg-moss-600 text-white'
                    : index < step
                      ? 'border-moss-200 bg-moss-50 text-moss-700'
                      : 'border-line-strong text-ink-muted',
                )}
              >
                {index + 1}. {label}
              </div>
            </li>
          ))}
        </ol>
      </header>

      {step === 0 ? (
        <Card className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="familyName" className="text-sm font-semibold">
              {d.familyName}
            </label>
            <p id="familyName-hint" className="text-sm text-ink-soft">
              {d.familyNameHint}
            </p>
            <input
              id="familyName"
              type="text"
              value={values.name}
              onChange={(event) => setValues({ ...values, name: event.target.value })}
              aria-describedby="familyName-hint"
              className={controlClassName}
            />
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">{d.environment}</legend>
            <p className="mt-1 text-sm text-ink-soft">{d.environmentHint}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['CITY', 'SUBURB', 'RURAL'] as const).map((option) => (
                <label
                  key={option}
                  className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm has-checked:border-moss-500 has-checked:bg-moss-50 has-checked:font-semibold"
                >
                  <input
                    type="radio"
                    name="environment"
                    value={option}
                    checked={values.environment === option}
                    onChange={() => setValues({ ...values, environment: option })}
                    className="q-visually-hidden"
                  />
                  {environmentLabel(option, locale)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="adultCount" className="text-sm font-semibold">
              {locale === 'nl' ? 'Aantal volwassenen' : 'Number of adults'}
            </label>
            <input
              id="adultCount"
              type="number"
              min={1}
              max={6}
              value={values.adultCount}
              onChange={(event) =>
                setValues({ ...values, adultCount: Number(event.target.value) || 1 })
              }
              className={`${controlClassName} max-w-28`}
            />
          </div>

          <Button onClick={() => setStep(1)} disabled={values.name.trim().length < 2}>
            {d.next}
          </Button>
        </Card>
      ) : null}

      {step === 1 ? (
        <div className="space-y-4">
          {childProfiles.length === 0 ? (
            <Callout tone="info">{d.noChildrenYet}</Callout>
          ) : (
            <ul className="space-y-3">
              {childProfiles.map((child) => (
                <li key={child.id}>
                  <Card className="flex items-center gap-4 py-4">
                    <Avatar avatarKey={child.avatarKey} size={44} />
                    <div>
                      <p className="font-semibold">{child.nickname}</p>
                      <p className="text-sm text-ink-soft">
                        {ageBandLabel(child.ageBand as AgeBand, locale)}
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {atLimit ? (
            <Callout tone="info">{fill(d.limitReached, { limit: maxChildProfiles })}</Callout>
          ) : addingChild ? (
            <Card>
              <h2 className="mb-4 text-lg font-semibold">{d.addChild}</h2>
              <ChildProfileForm
                action={createChildAction}
                interests={interests}
                locale={locale}
                labels={{
                  nickname: d.nickname,
                  nicknameHint: d.nicknameHint,
                  ageBand: d.ageBand,
                  avatar: d.avatar,
                  interests: d.interests,
                  interestsHint: d.interestsHint,
                  save: d.save,
                  cancel: d.cancel,
                  saving: d.saving,
                }}
                onSuccess={() => {
                  setAddingChild(false)
                  router.refresh()
                }}
                onCancel={childProfiles.length > 0 ? () => setAddingChild(false) : undefined}
              />
            </Card>
          ) : (
            <Button variant="secondary" onClick={() => setAddingChild(true)}>
              + {d.addChild}
            </Button>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(0)}>
              {d.back}
            </Button>
            <Button onClick={() => setStep(2)} disabled={childProfiles.length === 0}>
              {d.next}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <Card>
          <form action={action} className="space-y-5">
            <input type="hidden" name="name" value={values.name} />
            <input type="hidden" name="environment" value={values.environment} />
            <input type="hidden" name="adultCount" value={values.adultCount} />
            <input type="hidden" name="locale" value={locale} />

            {state.status === 'error' ? (
              <Callout tone="danger" role="alert">
                {state.message}
              </Callout>
            ) : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="preferredDuration" className="text-sm font-semibold">
                {d.duration}
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
                {d.difficulty}
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
                {d.setting}
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

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="prefersFamilyActivity"
                defaultChecked={values.prefersFamilyActivity}
                className="mt-1 size-5 accent-moss-600"
              />
              <span className="text-sm font-medium">{d.familyActivity}</span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="requireParentApproval"
                defaultChecked={values.requireParentApproval}
                className="mt-1 size-5 accent-moss-600"
              />
              <span>
                <span className="text-sm font-medium">{d.approval}</span>
                <span className="block text-sm text-ink-soft">{d.approvalHint}</span>
              </span>
            </label>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                {d.back}
              </Button>
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? d.saving : d.goToHome}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </div>
  )
}

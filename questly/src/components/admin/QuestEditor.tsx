'use client'

import { useActionState, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { controlClassName } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { idleState, type FormState } from '@/lib/form'
import type { Locale } from '@/modules/localisation'
import {
  ALL_AGE_BANDS,
  ALL_DIFFICULTIES,
  ALL_SEASONS,
  ALL_WEATHER,
  ageBandLabel,
  difficultyLabel,
  seasonLabel,
  weatherLabel,
} from '@/modules/quests/labels'
import { cn } from '@/lib/cn'
import type {
  EditorLocaleText,
  EditorQuest,
  EditorSafety,
} from './quest-editor-types'

export type { EditorLocaleText, EditorQuest, EditorSafety } from './quest-editor-types'

/**
 * The quest editor. All state lives here and is submitted as a single JSON
 * payload, which keeps nested steps and translations intact and makes the
 * server-side Zod schema the single source of truth for what is valid.
 */
export function QuestEditor({
  action,
  questId,
  initial,
  categories,
  skills,
  materials,
  locale,
  labels,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  questId?: string
  initial: EditorQuest
  categories: Array<{ slug: string; name: string }>
  skills: Array<{ slug: string; name: string }>
  materials: Array<{ slug: string; name: string }>
  locale: Locale
  labels: {
    save: string
    saving: string
    saved: string
    slug: string
    category: string
    ageBand: string
    duration: string
    difficulty: string
    setting: string
    weather: string
    participants: string
    skills: string
    materials: string
    safety: string
    steps: string
    translations: string
    imageKey: string
    preview: string
    addStep: string
    removeStep: string
    addSafety: string
    addMaterial: string
    changeNote: string
    premium: string
    requiresAdult: string
    preparation: string
    reflection: string
  }
}) {
  const [quest, setQuest] = useState<EditorQuest>(initial)
  const [tab, setTab] = useState<'nl' | 'en'>(locale)
  const [changeNote, setChangeNote] = useState('')
  const [state, formAction, pending] = useActionState(action, idleState)

  const payload = useMemo(
    () =>
      JSON.stringify({
        ...quest,
        steps: quest.steps.map((step, index) => ({ ...step, position: index })),
        safety: quest.safety.map((entry, index) => ({ ...entry, position: index })),
        changeNote: changeNote || undefined,
      }),
    [quest, changeNote],
  )

  const update = <K extends keyof EditorQuest>(key: K, value: EditorQuest[K]) =>
    setQuest((current) => ({ ...current, [key]: value }))

  const updateText = (localeKey: 'en' | 'nl', field: keyof EditorLocaleText, value: unknown) =>
    setQuest((current) => ({
      ...current,
      [localeKey]: { ...current[localeKey], [field]: value },
    }))

  const toggleInArray = (key: 'ageBands' | 'weather' | 'seasons' | 'skillSlugs', value: string) =>
    setQuest((current) => {
      const list = current[key]
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      }
    })

  const text = quest[tab]

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="payload" value={payload} />
      {questId ? <input type="hidden" name="questId" value={questId} /> : null}

      {state.status === 'error' && state.message ? (
        <Callout tone="danger" role="alert">
          {state.message}
          {state.fieldErrors ? (
            <ul className="mt-2 list-disc pl-5">
              {Object.entries(state.fieldErrors).map(([field, messages]) => (
                <li key={field}>
                  <code>{field}</code>: {messages.join(', ')}
                </li>
              ))}
            </ul>
          ) : null}
        </Callout>
      ) : null}
      {state.status === 'success' ? (
        <Callout tone="success" role="status">
          {labels.saved}
        </Callout>
      ) : null}

      <Card>
        <CardHeader
          title={labels.slug}
          action={
            questId ? (
              <Link
                href={`/admin/quests/${questId}/preview`}
                className="text-sm font-semibold text-moss-700 underline"
              >
                {labels.preview}
              </Link>
            ) : null
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.slug}
            <input
              value={quest.slug}
              onChange={(event) => update('slug', event.target.value)}
              className={controlClassName}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.category}
            <select
              value={quest.categorySlug}
              onChange={(event) => update('categorySlug', event.target.value)}
              className={controlClassName}
              required
            >
              <option value="">—</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.duration}
            <input
              type="number"
              min={5}
              max={600}
              value={quest.durationMinutes}
              onChange={(event) => update('durationMinutes', Number(event.target.value))}
              className={controlClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.difficulty}
            <select
              value={quest.difficulty}
              onChange={(event) => update('difficulty', event.target.value)}
              className={controlClassName}
            >
              {ALL_DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {difficultyLabel(value, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.setting}
            <select
              value={quest.setting}
              onChange={(event) => update('setting', event.target.value)}
              className={controlClassName}
            >
              <option value="BOTH">Indoor / outdoor</option>
              <option value="INDOOR">Indoor</option>
              <option value="OUTDOOR">Outdoor</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.imageKey}
            <input
              value={quest.imageKey}
              onChange={(event) => update('imageKey', event.target.value)}
              className={controlClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.participants} (min)
            <input
              type="number"
              min={1}
              max={20}
              value={quest.minParticipants}
              onChange={(event) => update('minParticipants', Number(event.target.value))}
              className={controlClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.participants} (max)
            <input
              type="number"
              min={1}
              max={40}
              value={quest.maxParticipants}
              onChange={(event) => update('maxParticipants', Number(event.target.value))}
              className={controlClassName}
            />
          </label>
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-semibold">{labels.ageBand}</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {ALL_AGE_BANDS.map((band) => (
              <label key={band} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quest.ageBands.includes(band)}
                  onChange={() => toggleInArray('ageBands', band)}
                  className="size-4 accent-moss-600"
                />
                {ageBandLabel(band, locale)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">{labels.weather}</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {ALL_WEATHER.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quest.weather.includes(value)}
                  onChange={() => toggleInArray('weather', value)}
                  className="size-4 accent-moss-600"
                />
                {weatherLabel(value, locale)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">Seasons</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {ALL_SEASONS.map((value) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={quest.seasons.includes(value)}
                  onChange={() => toggleInArray('seasons', value)}
                  className="size-4 accent-moss-600"
                />
                {seasonLabel(value, locale)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold">{labels.skills}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <label
                key={skill.slug}
                className={cn(
                  'cursor-pointer rounded-full border px-3.5 py-1.5 text-sm',
                  quest.skillSlugs.includes(skill.slug)
                    ? 'border-moss-500 bg-moss-50 font-semibold text-moss-700'
                    : 'border-line-strong',
                )}
              >
                <input
                  type="checkbox"
                  checked={quest.skillSlugs.includes(skill.slug)}
                  onChange={() => toggleInArray('skillSlugs', skill.slug)}
                  className="q-visually-hidden"
                />
                {skill.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={quest.requiresAdult}
              onChange={(event) => update('requiresAdult', event.target.checked)}
              className="size-4 accent-moss-600"
            />
            {labels.requiresAdult}
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={quest.isPremium}
              onChange={(event) => update('isPremium', event.target.checked)}
              className="size-4 accent-moss-600"
            />
            {labels.premium}
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader title={labels.translations} />
        <div role="tablist" aria-label={labels.translations} className="mb-4 flex gap-2">
          {(['nl', 'en'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold',
                tab === value ? 'bg-moss-600 text-white' : 'bg-paper-sunken text-ink-soft',
              )}
            >
              {value === 'nl' ? 'Nederlands' : 'English'}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Title
            <input
              value={text.title}
              onChange={(event) => updateText(tab, 'title', event.target.value)}
              className={controlClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Short description
            <textarea
              rows={2}
              value={text.shortDescription}
              onChange={(event) => updateText(tab, 'shortDescription', event.target.value)}
              className={controlClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Story
            <textarea
              rows={4}
              value={text.story}
              onChange={(event) => updateText(tab, 'story', event.target.value)}
              className={controlClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Educational objective
            <textarea
              rows={2}
              value={text.educationalObjective}
              onChange={(event) => updateText(tab, 'educationalObjective', event.target.value)}
              className={controlClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Expected result
            <textarea
              rows={2}
              value={text.expectedResult}
              onChange={(event) => updateText(tab, 'expectedResult', event.target.value)}
              className={controlClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.preparation} (one per line)
            <textarea
              rows={3}
              value={text.preparation.join('\n')}
              onChange={(event) =>
                updateText(
                  tab,
                  'preparation',
                  event.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                )
              }
              className={controlClassName}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            {labels.reflection} (one per line)
            <textarea
              rows={3}
              value={text.reflectionQuestions.join('\n')}
              onChange={(event) =>
                updateText(
                  tab,
                  'reflectionQuestions',
                  event.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                )
              }
              className={controlClassName}
            />
          </label>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={labels.steps}
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                update('steps', [
                  ...quest.steps,
                  {
                    position: quest.steps.length,
                    estimatedMinutes: 10,
                    requiresAdult: false,
                    en: { title: '', instruction: '' },
                    nl: { title: '', instruction: '' },
                  },
                ])
              }
            >
              + {labels.addStep}
            </Button>
          }
        />
        <ol className="space-y-5">
          {quest.steps.map((step, index) => (
            <li key={index} className="rounded-xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="font-semibold">#{index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    min
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={step.estimatedMinutes}
                      onChange={(event) =>
                        update(
                          'steps',
                          quest.steps.map((item, i) =>
                            i === index
                              ? { ...item, estimatedMinutes: Number(event.target.value) }
                              : item,
                          ),
                        )
                      }
                      className={`${controlClassName} w-20`}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={step.requiresAdult}
                      onChange={(event) =>
                        update(
                          'steps',
                          quest.steps.map((item, i) =>
                            i === index ? { ...item, requiresAdult: event.target.checked } : item,
                          ),
                        )
                      }
                      className="size-4 accent-moss-600"
                    />
                    {labels.requiresAdult}
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={quest.steps.length <= 1}
                    onClick={() =>
                      update(
                        'steps',
                        quest.steps.filter((_, i) => i !== index),
                      )
                    }
                  >
                    {labels.removeStep}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                {(['nl', 'en'] as const).map((localeKey) => (
                  <div key={localeKey} className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                      {localeKey}
                    </p>
                    <input
                      placeholder="Title"
                      value={step[localeKey].title}
                      onChange={(event) =>
                        update(
                          'steps',
                          quest.steps.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  [localeKey]: { ...item[localeKey], title: event.target.value },
                                }
                              : item,
                          ),
                        )
                      }
                      className={controlClassName}
                      aria-label={`Step ${index + 1} title (${localeKey})`}
                    />
                    <textarea
                      rows={3}
                      placeholder="Instruction"
                      value={step[localeKey].instruction}
                      onChange={(event) =>
                        update(
                          'steps',
                          quest.steps.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  [localeKey]: {
                                    ...item[localeKey],
                                    instruction: event.target.value,
                                  },
                                }
                              : item,
                          ),
                        )
                      }
                      className={controlClassName}
                      aria-label={`Step ${index + 1} instruction (${localeKey})`}
                    />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader
          title={labels.materials}
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                update('materials', [
                  ...quest.materials,
                  { slug: materials[0]?.slug ?? '', quantity: '', optional: false },
                ])
              }
            >
              + {labels.addMaterial}
            </Button>
          }
        />
        <ul className="space-y-3">
          {quest.materials.map((material, index) => (
            <li key={index} className="flex flex-wrap items-center gap-3">
              <select
                value={material.slug}
                onChange={(event) =>
                  update(
                    'materials',
                    quest.materials.map((item, i) =>
                      i === index ? { ...item, slug: event.target.value } : item,
                    ),
                  )
                }
                className={`${controlClassName} max-w-64`}
                aria-label={`${labels.materials} ${index + 1}`}
              >
                {materials.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="quantity"
                value={material.quantity ?? ''}
                onChange={(event) =>
                  update(
                    'materials',
                    quest.materials.map((item, i) =>
                      i === index ? { ...item, quantity: event.target.value } : item,
                    ),
                  )
                }
                className={`${controlClassName} max-w-48`}
                aria-label={`quantity ${index + 1}`}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={material.optional}
                  onChange={(event) =>
                    update(
                      'materials',
                      quest.materials.map((item, i) =>
                        i === index ? { ...item, optional: event.target.checked } : item,
                      ),
                    )
                  }
                  className="size-4 accent-moss-600"
                />
                optional
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  update(
                    'materials',
                    quest.materials.filter((_, i) => i !== index),
                  )
                }
              >
                ✕
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader
          title={labels.safety}
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                update('safety', [
                  ...quest.safety,
                  { position: quest.safety.length, severity: 'INFO', textEn: '', textNl: '' },
                ])
              }
            >
              + {labels.addSafety}
            </Button>
          }
        />
        <ul className="space-y-4">
          {quest.safety.map((entry, index) => (
            <li key={index} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <select
                  value={entry.severity}
                  onChange={(event) =>
                    update(
                      'safety',
                      quest.safety.map((item, i) =>
                        i === index
                          ? { ...item, severity: event.target.value as EditorSafety['severity'] }
                          : item,
                      ),
                    )
                  }
                  className={`${controlClassName} max-w-56`}
                  aria-label={`${labels.safety} ${index + 1}`}
                >
                  <option value="INFO">INFO</option>
                  <option value="CAUTION">CAUTION</option>
                  <option value="ADULT_REQUIRED">ADULT_REQUIRED</option>
                </select>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    update(
                      'safety',
                      quest.safety.filter((_, i) => i !== index),
                    )
                  }
                >
                  ✕
                </Button>
              </div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <textarea
                  rows={2}
                  placeholder="Nederlands"
                  value={entry.textNl}
                  onChange={(event) =>
                    update(
                      'safety',
                      quest.safety.map((item, i) =>
                        i === index ? { ...item, textNl: event.target.value } : item,
                      ),
                    )
                  }
                  className={controlClassName}
                  aria-label={`safety ${index + 1} nl`}
                />
                <textarea
                  rows={2}
                  placeholder="English"
                  value={entry.textEn}
                  onChange={(event) =>
                    update(
                      'safety',
                      quest.safety.map((item, i) =>
                        i === index ? { ...item, textEn: event.target.value } : item,
                      ),
                    )
                  }
                  className={controlClassName}
                  aria-label={`safety ${index + 1} en`}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {labels.changeNote}
          <input
            value={changeNote}
            onChange={(event) => setChangeNote(event.target.value)}
            className={controlClassName}
          />
        </label>
        <Button type="submit" size="lg" className="mt-5" disabled={pending}>
          {pending ? labels.saving : labels.save}
        </Button>
      </Card>
    </form>
  )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useId } from 'react'
import { Button } from '@/components/ui/Button'
import { controlClassName } from '@/components/ui/Field'
import type { Dictionary, Locale } from '@/modules/localisation'
import {
  ALL_AGE_BANDS,
  ALL_DIFFICULTIES,
  ALL_WEATHER,
  ageBandLabel,
  difficultyLabel,
  weatherLabel,
} from '@/modules/quests/labels'

/**
 * Library filters. Rendered as a real `<form method="get">` so the page works
 * without JavaScript; the router is only used for the "clear" shortcut.
 */
export function QuestFilters({
  d,
  locale,
  categories,
  skills,
  values,
}: {
  d: Dictionary
  locale: Locale
  categories: Array<{ slug: string; name: string }>
  skills: Array<{ slug: string; name: string }>
  values: Record<string, string | string[] | undefined>
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formId = useId()

  const single = (key: string): string => {
    const value = values[key]
    return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
  }
  const many = (key: string): string[] => {
    const value = values[key]
    return Array.isArray(value) ? value : value ? [value] : []
  }

  const hasFilters = [...searchParams.keys()].length > 0

  return (
    <form method="get" className="q-card p-5" aria-labelledby={`${formId}-heading`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id={`${formId}-heading`} className="text-base font-semibold">
          {d.common.filters}
        </h2>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/quests')}
          >
            {d.common.clearFilters}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-q`} className="text-sm font-semibold">
            {d.common.search}
          </label>
          <input
            id={`${formId}-q`}
            name="q"
            type="search"
            defaultValue={single('q')}
            className={controlClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-category`} className="text-sm font-semibold">
            {d.library.filterCategory}
          </label>
          <select
            id={`${formId}-category`}
            name="category"
            defaultValue={single('category')}
            className={controlClassName}
          >
            <option value="">{d.common.all}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-skill`} className="text-sm font-semibold">
            {d.library.filterSkill}
          </label>
          <select
            id={`${formId}-skill`}
            name="skill"
            defaultValue={single('skill')}
            className={controlClassName}
          >
            <option value="">{d.common.all}</option>
            {skills.map((skill) => (
              <option key={skill.slug} value={skill.slug}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-duration`} className="text-sm font-semibold">
            {d.library.filterDuration}
          </label>
          <select
            id={`${formId}-duration`}
            name="duration"
            defaultValue={single('duration')}
            className={controlClassName}
          >
            <option value="">{d.common.all}</option>
            {[30, 45, 60, 90, 120].map((minutes) => (
              <option key={minutes} value={minutes}>
                ≤ {minutes} {d.common.minutesShort}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-setting`} className="text-sm font-semibold">
            {d.library.filterSetting}
          </label>
          <select
            id={`${formId}-setting`}
            name="setting"
            defaultValue={single('setting')}
            className={controlClassName}
          >
            <option value="">{d.common.all}</option>
            <option value="INDOOR">{d.quest.indoor}</option>
            <option value="OUTDOOR">{d.quest.outdoor}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-weather`} className="text-sm font-semibold">
            {d.library.filterWeather}
          </label>
          <select
            id={`${formId}-weather`}
            name="weather"
            defaultValue={single('weather')}
            className={controlClassName}
          >
            <option value="">{d.common.all}</option>
            {ALL_WEATHER.filter((value) => value !== 'ANY').map((value) => (
              <option key={value} value={value}>
                {weatherLabel(value, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-participants`} className="text-sm font-semibold">
            {d.library.filterParticipants}
          </label>
          <select
            id={`${formId}-participants`}
            name="participants"
            defaultValue={single('participants')}
            className={controlClassName}
          >
            <option value="">{d.common.all}</option>
            {[1, 2, 3, 4, 5, 6].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${formId}-access`} className="text-sm font-semibold">
            {d.library.filterAccess}
          </label>
          <select
            id={`${formId}-access`}
            name="access"
            defaultValue={single('access')}
            className={controlClassName}
          >
            <option value="">{d.library.accessAll}</option>
            <option value="free">{d.library.accessFree}</option>
          </select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">{d.library.filterAge}</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {ALL_AGE_BANDS.map((band) => (
            <label key={band} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="age"
                value={band}
                defaultChecked={many('age').includes(band)}
                className="size-4 accent-moss-600"
              />
              {ageBandLabel(band, locale)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">{d.library.filterDifficulty}</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {ALL_DIFFICULTIES.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="difficulty"
                value={value}
                defaultChecked={many('difficulty').includes(value)}
                className="size-4 accent-moss-600"
              />
              {difficultyLabel(value, locale)}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="materials"
          value="common"
          defaultChecked={single('materials') === 'common'}
          className="size-4 accent-moss-600"
        />
        {d.library.filterMaterials}
      </label>

      <div className="mt-5">
        <Button type="submit">{d.common.filters}</Button>
      </div>
    </form>
  )
}

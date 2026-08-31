'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { controlClassName } from '@/components/ui/Field'
import { Callout } from '@/components/ui/States'
import { idleState, type FormState } from '@/lib/form'
import {
  planQuestAction,
  removePlannedQuestAction,
  updatePlannedQuestAction,
} from '@/app/(app)/quest-actions'
import { formatWeekday, formatShortDate } from '@/modules/localisation/format'
import type { Locale } from '@/modules/localisation'
import { cn } from '@/lib/cn'

type Entry = {
  id: string
  status: 'PLANNED' | 'DONE' | 'SKIPPED'
  timeOfDay: string | null
  questSlug: string
  title: string
  category: string
}

type Labels = {
  nothingPlanned: string
  addToDay: string
  choose: string
  markDone: string
  skip: string
  remove: string
  planned: string
  done: string
  skipped: string
  save: string
  cancel: string
  today: string
}

/**
 * The week as seven rows rather than a grid of cards.
 *
 * A four-column grid wrapped the week into 4 + 3, which reads as nothing in
 * particular, and squeezed the row of actions into a stack of wrapped buttons
 * taller than the adventure it belonged to. A row per day keeps the week in
 * order at every width, and leaves the actions on one line.
 */
export function PlannerWeek({
  days,
  locale,
  quests,
  todayIso,
  labels,
}: {
  days: Array<{ iso: string; entries: Entry[] }>
  locale: Locale
  quests: Array<{ id: string; title: string }>
  todayIso: string
  labels: Labels
}) {
  const router = useRouter()
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<FormState>(idleState)
  const [saving, setSaving] = useState(false)

  /**
   * The server action is called from the submit handler rather than through
   * `useActionState`, so closing the form and refreshing happen in the event
   * that caused them instead of in an effect watching the result.
   */
  async function submitPlan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setSaving(true)
    try {
      const result = await planQuestAction(idleState, formData)
      setState(result)
      if (result.status === 'success') {
        setOpenDay(null)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const run = (action: () => Promise<void>) =>
    startTransition(async () => {
      await action()
      router.refresh()
    })

  const statusTone = (status: Entry['status']) =>
    status === 'DONE' ? 'success' : status === 'SKIPPED' ? 'neutral' : 'moss'
  const statusLabel = (status: Entry['status']) =>
    status === 'DONE' ? labels.done : status === 'SKIPPED' ? labels.skipped : labels.planned

  return (
    <ol className="q-card divide-y divide-line p-0">
      {days.map((day) => {
        const date = new Date(`${day.iso}T00:00:00.000Z`)
        const isToday = day.iso === todayIso
        const isWeekend = [0, 6].includes(date.getUTCDay())

        return (
          <li
            key={day.iso}
            className={cn(
              'grid gap-x-5 gap-y-3 px-5 py-4 sm:grid-cols-[9.5rem_minmax(0,1fr)]',
              isWeekend && 'bg-paper-sunken/60',
            )}
          >
            <div className="flex items-baseline gap-2 sm:block">
              <p
                className={cn(
                  'font-semibold capitalize',
                  isToday ? 'text-moss-700' : 'text-ink',
                )}
              >
                {formatWeekday(date, locale)}
              </p>
              <p className="text-sm text-ink-muted">
                {formatShortDate(date, locale)}
                {isToday ? ` · ${labels.today}` : ''}
              </p>
            </div>

            <div className="min-w-0">
              {day.entries.length === 0 && openDay !== day.iso ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-muted">{labels.nothingPlanned}</p>
                  <Button size="sm" variant="ghost" onClick={() => setOpenDay(day.iso)}>
                    + {labels.addToDay}
                  </Button>
                </div>
              ) : null}

              {day.entries.length > 0 ? (
                <ul className="space-y-2">
                  {day.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-paper-sunken px-3.5 py-2.5"
                    >
                      <Link
                        href={`/quests/${entry.questSlug}`}
                        className="min-w-0 flex-1 font-medium hover:text-moss-700"
                      >
                        {entry.title}
                      </Link>

                      <Badge tone={statusTone(entry.status)}>{statusLabel(entry.status)}</Badge>

                      <div className="flex shrink-0 items-center gap-1">
                        {entry.status === 'PLANNED' ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() => run(() => updatePlannedQuestAction(entry.id, 'DONE'))}
                            >
                              {labels.markDone}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pending}
                              onClick={() =>
                                run(() => updatePlannedQuestAction(entry.id, 'SKIPPED'))
                              }
                            >
                              {labels.skip}
                            </Button>
                          </>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`${labels.remove}: ${entry.title}`}
                          disabled={pending}
                          onClick={() => run(() => removePlannedQuestAction(entry.id))}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.9"
                            strokeLinecap="round"
                            aria-hidden="true"
                          >
                            <path d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {openDay === day.iso ? (
                <form onSubmit={submitPlan} className="mt-3 space-y-2">
                  <input type="hidden" name="scheduledFor" value={day.iso} />
                  {state.status === 'error' ? (
                    <Callout tone="danger" role="alert">
                      {state.message}
                    </Callout>
                  ) : null}
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex min-w-56 flex-1 flex-col gap-1.5">
                      <label htmlFor={`quest-${day.iso}`} className="text-sm font-semibold">
                        {labels.choose}
                      </label>
                      <select
                        id={`quest-${day.iso}`}
                        name="questId"
                        required
                        className={controlClassName}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {labels.choose}
                        </option>
                        {quests.map((quest) => (
                          <option key={quest.id} value={quest.id}>
                            {quest.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" size="sm" disabled={saving}>
                      {labels.save}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setOpenDay(null)}
                    >
                      {labels.cancel}
                    </Button>
                  </div>
                </form>
              ) : day.entries.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() => setOpenDay(day.iso)}
                >
                  + {labels.addToDay}
                </Button>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

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

type Entry = {
  id: string
  status: 'PLANNED' | 'DONE' | 'SKIPPED'
  timeOfDay: string | null
  questSlug: string
  title: string
  category: string
}

export function PlannerWeek({
  days,
  locale,
  quests,
  labels,
}: {
  days: Array<{ iso: string; entries: Entry[] }>
  locale: Locale
  quests: Array<{ id: string; title: string }>
  labels: {
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
  }
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

  const statusTone = (status: Entry['status']) =>
    status === 'DONE' ? 'success' : status === 'SKIPPED' ? 'neutral' : 'moss'
  const statusLabel = (status: Entry['status']) =>
    status === 'DONE' ? labels.done : status === 'SKIPPED' ? labels.skipped : labels.planned

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {days.map((day) => {
        const date = new Date(`${day.iso}T00:00:00.000Z`)
        return (
          <section key={day.iso} className="q-card flex flex-col gap-3 p-4" aria-labelledby={`day-${day.iso}`}>
            <h2 id={`day-${day.iso}`} className="font-semibold">
              <span className="capitalize">{formatWeekday(date, locale)}</span>{' '}
              <span className="font-normal text-ink-muted">{formatShortDate(date, locale)}</span>
            </h2>

            {day.entries.length === 0 ? (
              <p className="text-sm text-ink-muted">{labels.nothingPlanned}</p>
            ) : (
              <ul className="space-y-3">
                {day.entries.map((entry) => (
                  <li key={entry.id} className="rounded-xl bg-paper-sunken p-3">
                    <Link
                      href={`/quests/${entry.questSlug}`}
                      className="font-medium hover:text-moss-700"
                    >
                      {entry.title}
                    </Link>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone(entry.status)}>{statusLabel(entry.status)}</Badge>
                      {entry.status === 'PLANNED' ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await updatePlannedQuestAction(entry.id, 'DONE')
                                router.refresh()
                              })
                            }
                          >
                            {labels.markDone}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await updatePlannedQuestAction(entry.id, 'SKIPPED')
                                router.refresh()
                              })
                            }
                          >
                            {labels.skip}
                          </Button>
                        </>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await removePlannedQuestAction(entry.id)
                            router.refresh()
                          })
                        }
                      >
                        {labels.remove}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {openDay === day.iso ? (
              <form onSubmit={submitPlan} className="space-y-2">
                <input type="hidden" name="scheduledFor" value={day.iso} />
                {state.status === 'error' ? (
                  <Callout tone="danger" role="alert">
                    {state.message}
                  </Callout>
                ) : null}
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
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={saving}>
                    {labels.save}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setOpenDay(null)}>
                    {labels.cancel}
                  </Button>
                </div>
              </form>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                className="mt-auto"
                onClick={() => setOpenDay(day.iso)}
              >
                + {labels.addToDay}
              </Button>
            )}
          </section>
        )
      })}
    </div>
  )
}

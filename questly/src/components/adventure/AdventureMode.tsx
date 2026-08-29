'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Callout, ProgressBar } from '@/components/ui/States'
import { IconCheck, IconShield, IconSpeaker } from '@/components/ui/Icons'
import { AdventureTimer } from '@/components/adventure/AdventureTimer'
import { useSpeech } from '@/components/adventure/useSpeech'
import { abandonQuestAction } from '@/app/(app)/quest-actions'
import { formatDuration } from '@/modules/localisation/format'
import type { Locale } from '@/modules/localisation'
import type { QuestDetailView } from '@/modules/quests/types'
import { cn } from '@/lib/cn'

type Labels = {
  title: string
  prepareTitle: string
  countdown: string
  checklistTitle: string
  checklistHint: string
  putAwayTitle: string
  putAwayBody: string
  understood: string
  stepOf: string
  timer: string
  startTimer: string
  pauseTimer: string
  resetTimer: string
  nextStep: string
  previousStep: string
  finishAdventure: string
  abandon: string
  abandonConfirm: string
  offlineReady: string
  offlineUnavailable: string
  honestNote: string
  listen: string
  stopListening: string
  ttsUnsupported: string
  materials: string
  safety: string
  stepProgress: string
}

type Phase = 'prepare' | 'countdown' | 'putaway' | 'steps'

const COUNTDOWN_SECONDS = 5

const subscribeToNothing = () => () => {}

/** Private browsing and some embedded webviews throw on `localStorage`. */
function storageAvailable(): boolean {
  try {
    const probe = '__questly_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

/**
 * Adventure Mode.
 *
 * The design brief for this screen is unusual: it must be as uninteresting as
 * possible. No feed, no notifications, no reward for staying. It hands over the
 * plan, tells the family to put the device down, and waits patiently for them
 * to come back - whether that is in five minutes or two days.
 */
export function AdventureMode({
  completionId,
  quest,
  locale,
  labels,
}: {
  completionId: string
  quest: QuestDetailView
  locale: Locale
  labels: Labels
}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('prepare')
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [stepIndex, setStepIndex] = useState(0)
  const [pending, startTransition] = useTransition()
  const offlineSaved = useSyncExternalStore(subscribeToNothing, storageAvailable, () => true)
  const speech = useSpeech(locale)

  const storageKey = useMemo(() => `questly:adventure:${completionId}`, [completionId])

  // Restore where the family left off, so closing the app costs nothing. This is
  // a read from an external store on mount, which has no render-time
  // equivalent: the server has no access to this device's localStorage.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return
      const saved = JSON.parse(raw) as { phase?: Phase; stepIndex?: number; checked?: number[] }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted progress
      if (saved.phase) setPhase(saved.phase)
      if (typeof saved.stepIndex === 'number') setStepIndex(saved.stepIndex)
      if (Array.isArray(saved.checked)) setChecked(new Set(saved.checked))
    } catch {
      /* a browser that refuses storage simply gets no resume */
    }
  }, [storageKey])

  // Persist progress. Writing only - no state is derived from the result.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ phase, stepIndex, checked: [...checked], quest }),
      )
    } catch {
      /* storage is a nicety here, never a requirement */
    }
  }, [storageKey, phase, stepIndex, checked, quest])

  // The countdown is two timers, both firing outside the effect body: an
  // interval that ticks the number down, and one timeout that moves on.
  useEffect(() => {
    if (phase !== 'countdown') return
    const interval = window.setInterval(
      () => setCountdown((value) => Math.max(0, value - 1)),
      1000,
    )
    const timeout = window.setTimeout(() => setPhase('putaway'), COUNTDOWN_SECONDS * 1000)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [phase])

  const currentStep = quest.steps[stepIndex]

  const speakCurrentStep = useCallback(() => {
    if (!currentStep) return
    speech.speak(currentStep.audioScript ?? `${currentStep.title}. ${currentStep.instruction}`)
  }, [currentStep, speech])

  const allChecked = quest.preparation.length === 0 || checked.size === quest.preparation.length

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-wide text-moss-700 uppercase">
            {labels.title}
          </p>
          <h1 className="text-2xl font-semibold">{quest.title}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(labels.abandonConfirm)) return
            window.localStorage.removeItem(storageKey)
            startTransition(() => abandonQuestAction(completionId))
          }}
        >
          {labels.abandon}
        </Button>
      </header>

      {phase === 'prepare' ? (
        <section className="q-card p-6" aria-labelledby="prepare-heading">
          <h2 id="prepare-heading" className="text-xl font-semibold">
            {labels.prepareTitle}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">{labels.checklistHint}</p>

          <fieldset className="mt-5">
            <legend className="font-semibold">{labels.checklistTitle}</legend>
            <ul className="mt-3 space-y-2">
              {quest.preparation.map((item, index) => (
                <li key={item}>
                  <label className="flex items-start gap-3 text-ink-soft">
                    <input
                      type="checkbox"
                      checked={checked.has(index)}
                      onChange={(event) => {
                        setChecked((previous) => {
                          const next = new Set(previous)
                          if (event.target.checked) next.add(index)
                          else next.delete(index)
                          return next
                        })
                      }}
                      className="mt-1 size-5 shrink-0 accent-moss-600"
                    />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>

          <div className="mt-6 rounded-xl bg-paper-sunken p-4">
            <h3 className="font-semibold">{labels.materials}</h3>
            <ul className="mt-2 space-y-1 text-sm text-ink-soft">
              {quest.materialsDetailed.map((material) => (
                <li key={material.slug}>
                  {material.name}
                  {material.quantity ? ` — ${material.quantity}` : ''}
                </li>
              ))}
            </ul>
          </div>

          {quest.safety.length > 0 ? (
            <Callout tone="warning" className="mt-4" title={labels.safety}>
              <ul className="space-y-1.5">
                {quest.safety.map((item) => (
                  <li key={item.id} className="flex gap-2">
                    <IconShield size={15} aria-hidden="true" className="mt-0.5 shrink-0" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </Callout>
          ) : null}

          <Button
            size="lg"
            className="mt-6"
            disabled={!allChecked}
            onClick={() => {
              setCountdown(COUNTDOWN_SECONDS)
              setPhase('countdown')
            }}
          >
            {labels.understood}
          </Button>
        </section>
      ) : null}

      {phase === 'countdown' ? (
        <section
          className="q-card q-topo flex flex-col items-center gap-4 p-12 text-center"
          aria-live="polite"
        >
          <p className="text-lg font-semibold">{labels.countdown}</p>
          <p className="font-display text-7xl font-semibold text-moss-600" aria-hidden="true">
            {countdown}
          </p>
          <p className="q-visually-hidden">{countdown}</p>
          <Button variant="ghost" onClick={() => setPhase('putaway')}>
            {labels.understood}
          </Button>
        </section>
      ) : null}

      {phase === 'putaway' ? (
        <section
          className="q-card q-topo flex flex-col items-center gap-5 p-10 text-center"
          aria-labelledby="putaway-heading"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-moss-600 text-white">
            <IconCheck size={32} />
          </span>
          <h2 id="putaway-heading" className="text-2xl font-semibold">
            {labels.putAwayTitle}
          </h2>
          <p className="q-prose text-ink-soft">{labels.putAwayBody}</p>
          <Button size="lg" onClick={() => setPhase('steps')}>
            {labels.understood}
          </Button>
          <p className="max-w-md text-xs text-ink-muted">{labels.honestNote}</p>
        </section>
      ) : null}

      {phase === 'steps' && currentStep ? (
        <section className="space-y-5" aria-labelledby="step-heading">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-ink-soft">
              <span>
                {labels.stepOf
                  .replace('{current}', String(stepIndex + 1))
                  .replace('{total}', String(quest.steps.length))}
              </span>
              <span>{formatDuration(currentStep.estimatedMinutes, locale)}</span>
            </div>
            <ProgressBar
              value={stepIndex + 1}
              max={quest.steps.length}
              label={labels.stepProgress}
            />
          </div>

          <article className="q-card p-6 sm:p-8">
            <h2 id="step-heading" className="text-2xl font-semibold">
              {currentStep.title}
            </h2>
            <p className="q-prose mt-4 text-lg leading-relaxed text-ink-soft">
              {currentStep.instruction}
            </p>

            {currentStep.requiresAdult ? (
              <Callout tone="warning" className="mt-5">
                <span className="flex items-center gap-2">
                  <IconShield size={16} aria-hidden="true" />
                  {labels.safety}
                </span>
              </Callout>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {speech.supported ? (
                <Button
                  variant="secondary"
                  onClick={() => (speech.speaking ? speech.stop() : speakCurrentStep())}
                  aria-pressed={speech.speaking}
                >
                  <IconSpeaker size={17} />
                  {speech.speaking ? labels.stopListening : labels.listen}
                </Button>
              ) : (
                <p className="text-sm text-ink-muted">{labels.ttsUnsupported}</p>
              )}
              <AdventureTimer
                minutes={currentStep.estimatedMinutes}
                labels={{
                  timer: labels.timer,
                  start: labels.startTimer,
                  pause: labels.pauseTimer,
                  reset: labels.resetTimer,
                }}
              />
            </div>
          </article>

          <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={labels.title}>
            <Button
              variant="secondary"
              disabled={stepIndex === 0}
              onClick={() => {
                speech.stop()
                setStepIndex((index) => Math.max(0, index - 1))
              }}
            >
              {labels.previousStep}
            </Button>

            {stepIndex < quest.steps.length - 1 ? (
              <Button
                onClick={() => {
                  speech.stop()
                  setStepIndex((index) => Math.min(quest.steps.length - 1, index + 1))
                }}
              >
                {labels.nextStep}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => {
                  speech.stop()
                  window.localStorage.removeItem(storageKey)
                  router.push(`/adventure/${completionId}/complete`)
                }}
              >
                {labels.finishAdventure}
              </Button>
            )}
          </nav>

          <ol className="flex flex-wrap gap-2" aria-label={labels.stepProgress}>
            {quest.steps.map((step, index) => (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => {
                    speech.stop()
                    setStepIndex(index)
                  }}
                  aria-current={index === stepIndex ? 'step' : undefined}
                  // The visible label is just a number, so the accessible name
                  // spells out which step it is.
                  aria-label={labels.stepOf
                    .replace('{current}', String(index + 1))
                    .replace('{total}', String(quest.steps.length))}
                  className={cn(
                    'size-9 rounded-full border text-sm font-semibold transition',
                    index === stepIndex
                      ? 'border-moss-600 bg-moss-600 text-white'
                      : 'border-line-strong bg-paper-raised text-ink-soft hover:border-moss-500',
                  )}
                >
                  {index + 1}
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <p className="text-center text-xs text-ink-muted" role="status">
        {offlineSaved ? labels.offlineReady : labels.offlineUnavailable}
      </p>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * An optional timer. It counts down without demanding attention: no sound, no
 * notification, and nothing happens if it is ignored.
 */
export function AdventureTimer({
  minutes,
  labels,
}: {
  minutes: number
  labels: { timer: string; start: string; pause: string; reset: string }
}) {
  const total = minutes * 60
  const [remaining, setRemaining] = useState(total)
  const [running, setRunning] = useState(false)
  const interval = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    interval.current = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => {
      if (interval.current) window.clearInterval(interval.current)
    }
  }, [running])

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-2">
      <span className="q-visually-hidden">{labels.timer}</span>
      <output
        aria-live="off"
        className="rounded-full bg-paper-sunken px-3 py-1.5 font-mono text-sm font-semibold tabular-nums"
      >
        {mm}:{ss}
      </output>
      <Button size="sm" variant="ghost" onClick={() => setRunning((value) => !value)}>
        {running ? labels.pause : labels.start}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setRunning(false)
          setRemaining(total)
        }}
      >
        {labels.reset}
      </Button>
    </div>
  )
}

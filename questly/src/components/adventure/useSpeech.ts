'use client'

import { useCallback, useState, useSyncExternalStore } from 'react'
import type { Locale } from '@/modules/localisation'

const BCP47: Record<Locale, string> = { nl: 'nl-NL', en: 'en-GB' }

const subscribeToNothing = () => () => {}
const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/**
 * Wraps the browser's speech synthesis so a step can be read aloud - which is
 * how a six-year-old takes part without reading, and how the screen can be put
 * down while the instruction is still being delivered.
 *
 * Support is read through `useSyncExternalStore` so the server renders "not
 * supported" and the client corrects it during hydration, without an effect
 * that sets state on mount.
 */
export function useSpeech(locale: Locale) {
  const supported = useSyncExternalStore(subscribeToNothing, speechSupported, () => false)
  const [speaking, setSpeaking] = useState(false)

  const speak = useCallback(
    (text: string) => {
      if (!speechSupported()) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = BCP47[locale]
      utterance.rate = 0.95
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
    },
    [locale],
  )

  const stop = useCallback(() => {
    if (!speechSupported()) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { supported, speaking, speak, stop }
}

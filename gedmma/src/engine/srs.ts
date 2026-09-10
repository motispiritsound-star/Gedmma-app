/**
 * Spaced repetition, a simplified SM-2.
 *
 * A word you just met comes back in ten minutes; a word you keep getting right
 * drifts out to days and then weeks. Getting it wrong drops it back to the
 * front of the queue rather than resetting everything you knew about it.
 */

export interface Card {
  id: string
  /** How easy the word is for this learner. 1.3 (hard) … 3.0 (trivial). */
  ease: number
  /** Days until the next review. Below 1 it is a same-session repeat. */
  interval: number
  /** Epoch ms of the next review. */
  due: number
  reps: number
  lapses: number
  /** 0…1, drives the little strength bar in the word list. */
  strength: number
}

export const MINUTE = 60_000
export const DAY = 86_400_000

export const newCard = (id: string, now = Date.now()): Card => ({
  id, ease: 2.4, interval: 0, due: now, reps: 0, lapses: 0, strength: 0,
})

export type Grade = 'fout' | 'moeizaam' | 'goed' | 'makkelijk'

const EASE_DELTA: Record<Grade, number> = {
  fout: -0.25,
  moeizaam: -0.1,
  goed: 0,
  makkelijk: 0.12,
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function review(card: Card, grade: Grade, now = Date.now()): Card {
  const ease = clamp(card.ease + EASE_DELTA[grade], 1.3, 3)

  if (grade === 'fout') {
    return {
      ...card,
      ease,
      interval: 0,
      due: now + 8 * MINUTE,
      reps: card.reps + 1,
      lapses: card.lapses + 1,
      strength: clamp(card.strength - 0.35, 0, 1),
    }
  }

  const grown =
    card.interval < 1 ? (grade === 'makkelijk' ? 1.5 : 1)
    : card.interval < 3 ? card.interval * (grade === 'moeizaam' ? 1.4 : ease)
    : card.interval * ease * (grade === 'moeizaam' ? 0.7 : 1)

  const interval = clamp(Math.round(grown * 10) / 10, 0.007, 240)
  const bump = grade === 'makkelijk' ? 0.3 : grade === 'goed' ? 0.22 : 0.1

  return {
    ...card,
    ease,
    interval,
    due: now + interval * DAY,
    reps: card.reps + 1,
    strength: clamp(card.strength + bump, 0, 1),
  }
}

/** Words that are due, hardest first, capped at `limit`. */
export function dueCards(cards: Card[], now = Date.now(), limit = 20): Card[] {
  return cards
    .filter((c) => c.due <= now)
    .sort((a, b) => a.strength - b.strength || a.due - b.due)
    .slice(0, limit)
}

/** A learner-facing label: how solid a word is right now. */
export function strengthLabel(strength: number): string {
  if (strength >= 0.85) return 'Vastgezet'
  if (strength >= 0.6) return 'Sterk'
  if (strength >= 0.35) return 'Wordt beter'
  if (strength > 0) return 'Wankel'
  return 'Nieuw'
}

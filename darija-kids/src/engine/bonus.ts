import type { Exercise } from './exercises'
import {
  buildDictationRound, buildMarathonRound, buildScribeRound, buildSentenceRound, buildSpeakRound,
} from './exercises'
import { LETTERS } from '../content/alphabet'
import { ALL_SENTENCES } from '../content/sentences'
import { allWords } from '../content/lexicon'
import { getState, letterKey, sentenceKey, type State } from './store'

/**
 * The bonus rounds: what there is to do when there is nothing left to do.
 *
 * A course of seventeen units ends. A language does not, and neither should
 * the app — the week a child finishes the last unit should not be the week
 * they delete it. So every one of these is built out of what they have already
 * met, in a different order every time, and grades the same cards a lesson
 * would. Finishing the course changes what the app is for, not whether it is
 * still worth opening.
 *
 * Each one also has to earn its place by being a *different kind of asking*.
 * Tracing uses a hand, dictation uses only the ears, the marathon takes away
 * the safety of a short round, the forge is about word order, and speaking is
 * the one nobody else makes you do.
 */

export type BonusId = 'schrijven' | 'dictee' | 'marathon' | 'zinnen' | 'spreken'

/** Everything a bonus round is allowed to draw on. */
export interface BonusPool {
  /** Letter ids met, weakest first. */
  letters: string[]
  /** Word ids met, weakest first. */
  words: string[]
  /** Sentence ids met, weakest first. */
  sentences: string[]
  /** The device has speech recognition. */
  canListen: boolean
  /** Tracing is switched on. */
  canWrite: boolean
}

export interface BonusTask {
  id: BonusId
  emoji: string
  /** Gems on finishing, on top of the XP every right answer already pays. */
  gems: number
  /** How many questions it is, so the card can say so before you start. */
  size: number
  /** False while there is too little met yet, or the device cannot do it. */
  ready: (pool: BonusPool) => boolean
  build: (pool: BonusPool, seed: number) => Exercise[]
}

export const BONUS: BonusTask[] = [
  {
    id: 'schrijven',
    emoji: '✍️',
    gems: 5,
    size: 6,
    // Six letters is one lesson of the alphabet unit — early enough that a
    // child can trace before they can read.
    ready: (p) => p.canWrite && p.letters.length >= 4,
    build: (p, seed) => buildScribeRound(p.letters, p.words, seed, 6),
  },
  {
    id: 'dictee',
    emoji: '👂',
    gems: 4,
    size: 8,
    ready: (p) => p.words.length >= 8,
    build: (p, seed) => buildDictationRound(p.words, p.sentences, seed, 8),
  },
  {
    id: 'zinnen',
    emoji: '🧩',
    gems: 4,
    size: 6,
    ready: (p) => p.sentences.length >= 4,
    build: (p, seed) => buildSentenceRound(p.sentences, seed, 6),
  },
  {
    id: 'marathon',
    emoji: '⚡',
    gems: 8,
    size: 30,
    ready: (p) => p.words.length >= 20,
    build: (p, seed) => buildMarathonRound(p.words, p.letters, p.sentences, seed, 30),
  },
  {
    id: 'spreken',
    emoji: '🎤',
    gems: 5,
    size: 6,
    ready: (p) => p.canListen && p.words.length >= 6,
    build: (p, seed) => buildSpeakRound(p.words, seed, 6),
  },
]

export const bonusTask = (id: BonusId): BonusTask =>
  BONUS.find((b) => b.id === id) ?? BONUS[0]!

/**
 * What a bonus round may ask about: everything met, weakest first.
 *
 * Weakest first and then shuffled inside the builder, so a round is both a
 * surprise and the repetition the scheduler was asking for anyway.
 */
export function poolFrom(s: State = getState(), opts: { canListen: boolean } = { canListen: false }): BonusPool {
  const weakestFirst = (ids: string[], key: (id: string) => string): string[] =>
    [...ids].sort((a, b) => (s.extraCards[key(a)]?.strength ?? 0) - (s.extraCards[key(b)]?.strength ?? 0))

  const metLetters = LETTERS.map((l) => l.id).filter((id) => s.extraCards[letterKey(id)])
  const metSentences = ALL_SENTENCES.map((z) => z.id).filter((id) => s.extraCards[sentenceKey(id)])
  const metWords = Object.values(s.cards).sort((a, b) => a.strength - b.strength).map((c) => c.id)

  return {
    letters: weakestFirst(metLetters, letterKey),
    // A brand-new profile has met nothing at all; the alphabet is still the
    // right place to start writing, so let it.
    words: metWords.length ? metWords : allWords.filter((w) => !w.phrase).slice(0, 20).map((w) => w.id),
    sentences: weakestFirst(metSentences, sentenceKey),
    canListen: opts.canListen,
    canWrite: s.settings.schrijven,
  }
}

/**
 * One of them is the bonus of the day.
 *
 * Not random per visit: the same one all day, so "have you done today's bonus
 * yet" is a question with an answer. It walks the list day by day rather than
 * hashing, so two days in a row are never the same one.
 */
export function bonusOfTheDay(day: string, available: BonusId[] = BONUS.map((b) => b.id)): BonusId | null {
  if (!available.length) return null
  const [y, m, d] = day.split('-').map(Number)
  const days = Math.floor(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1) / 86400000)
  return available[days % available.length] ?? null
}

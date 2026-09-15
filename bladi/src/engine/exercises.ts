import type { Lesson, Word } from '../content/types'
import { allWords, word } from '../content/lexicon'
import { mulberry32, pick, seedFrom, shuffle } from './random'

/**
 * Turning a lesson into a round of exercises.
 *
 * A round mixes types on purpose: recognising a word, hearing it, reading the
 * Arabic script, building a sentence and finally producing it from memory. The
 * same word is asked in two different ways before the round ends, which is
 * what makes it stick.
 */

export type ExerciseKind =
  | 'nieuw'            // teaching card, always right
  | 'kies-betekenis'   // Darija → Dutch
  | 'kies-darija'      // Dutch → Darija
  | 'luister'          // audio → written Darija
  | 'script'           // transliteration → Arabic script
  | 'koppel'           // match pairs
  | 'bouw'             // word bank, for sentences
  | 'tik'              // type it
  | 'spreek'           // say it out loud

export interface Exercise {
  id: string
  kind: ExerciseKind
  /** The word being asked. Absent for 'koppel', which asks several at once. */
  wordId: string
  /** Word ids offered as answers, already shuffled. */
  options?: string[]
  /** Scrambled tokens for 'bouw'. */
  tokens?: string[]
  /** Word ids for 'koppel'. */
  pairIds?: string[]
}

export interface RoundOptions {
  /** Word ids the learner has already met, so they skip the teaching card. */
  known?: Set<string>
  /** Hard mode: no teaching cards, more producing, less recognising. */
  toets?: boolean
  max?: number
  seed?: number
  /** The device cannot listen — leave speaking exercises out. */
  allowSpeech?: boolean
}

const distractors = (target: Word, count: number, rnd: () => number): string[] => {
  const sameTopic = allWords.filter((w) => w.topic === target.topic && w.id !== target.id && !!w.phrase === !!target.phrase)
  const rest = allWords.filter((w) => w.topic !== target.topic && w.id !== target.id && !!w.phrase === !!target.phrase)
  const pool = [...shuffle(sameTopic, rnd), ...shuffle(rest, rnd)]
  return pool.slice(0, count).map((w) => w.id)
}

const options = (target: Word, rnd: () => number, count = 4): string[] =>
  shuffle([target.id, ...distractors(target, count - 1, rnd)], rnd)

export const tokenize = (phrase: string): string[] =>
  phrase.split(/\s+/).filter(Boolean)

/** Extra word-bank tiles, so a sentence is not solvable by counting tiles. */
const bankFor = (target: Word, rnd: () => number): string[] => {
  const answer = tokenize(target.tr)
  const noise = shuffle(
    allWords
      .filter((w) => !w.phrase && w.topic === target.topic)
      .flatMap((w) => tokenize(w.tr))
      .filter((t) => !answer.includes(t)),
    rnd,
  ).slice(0, answer.length > 4 ? 2 : 3)
  return shuffle([...answer, ...noise], rnd)
}

export function buildRound(lesson: Lesson, opts: RoundOptions = {}): Exercise[] {
  const { known = new Set<string>(), toets = false, max = toets ? 14 : 13, allowSpeech = true } = opts
  const rnd = mulberry32(opts.seed ?? seedFrom(lesson.id + (toets ? '-toets' : '') + lesson.words.length))
  const words = lesson.words.map(word)
  const out: Exercise[] = []
  let n = 0
  const add = (e: Omit<Exercise, 'id'>) => out.push({ ...e, id: `${lesson.id}-${n++}` })

  // 1. Meet the new words.
  if (!toets) {
    for (const w of words) if (!known.has(w.id)) add({ kind: 'nieuw', wordId: w.id })
  }

  // 2. Recognise them.
  const first = shuffle(words, rnd)
  for (const w of first) {
    if (w.phrase) {
      add({ kind: 'kies-betekenis', wordId: w.id, options: options(w, rnd) })
      continue
    }
    const kind = pick(toets ? (['luister', 'script', 'kies-darija'] as const) : (['kies-betekenis', 'luister', 'script'] as const), rnd)
    add({ kind, wordId: w.id, options: options(w, rnd) })
  }

  // 3. A matching grid breaks up the rhythm.
  const matchable = first.filter((w) => !w.phrase)
  if (matchable.length >= 4) {
    add({ kind: 'koppel', wordId: matchable[0]!.id, pairIds: shuffle(matchable, rnd).slice(0, Math.min(5, matchable.length)).map((w) => w.id) })
  }

  // 4. Produce them.
  for (const w of shuffle(words, rnd)) {
    if (w.phrase) {
      add({ kind: 'bouw', wordId: w.id, tokens: bankFor(w, rnd) })
    } else if (toets || rnd() > 0.45) {
      add({ kind: 'tik', wordId: w.id })
    } else if (allowSpeech && rnd() > 0.6) {
      add({ kind: 'spreek', wordId: w.id })
    } else {
      add({ kind: 'kies-darija', wordId: w.id, options: options(w, rnd) })
    }
  }

  // Teaching cards always survive the cap; the drilling behind them is trimmed.
  const teach = out.filter((e) => e.kind === 'nieuw')
  const drill = out.filter((e) => e.kind !== 'nieuw')
  return [...teach, ...drill.slice(0, Math.max(4, max - teach.length))]
}

/** A review round built from whatever the scheduler says is due. */
export function buildReviewRound(wordIds: string[], seed = Date.now()): Exercise[] {
  const rnd = mulberry32(seed >>> 0)
  const out: Exercise[] = []
  let n = 0
  for (const id of shuffle(wordIds, rnd).slice(0, 12)) {
    const w = word(id)
    const kind: ExerciseKind = w.phrase
      ? pick(['kies-betekenis', 'bouw'] as const, rnd)
      : pick(['kies-betekenis', 'luister', 'kies-darija', 'script', 'tik'] as const, rnd)
    out.push({
      id: `review-${n++}`,
      kind,
      wordId: id,
      options: kind === 'bouw' || kind === 'tik' ? undefined : options(w, rnd),
      tokens: kind === 'bouw' ? bankFor(w, rnd) : undefined,
    })
  }
  return out
}

/* ----------------------------------------------------------------- checking */

/**
 * Learners type Darija in Latin letters, and there is no single right way to
 * do that. So the check is generous with the things people disagree about
 * (3 versus a, doubled letters, apostrophes) and strict about the rest.
 */
export function normalise(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`´]/g, '')
    .replace(/[!?.,;:]/g, '')
    .replace(/7/g, 'h')
    .replace(/9/g, 'q')
    .replace(/2/g, '')
    .replace(/3/g, '')
    .replace(/kh/g, 'x')
    .replace(/gh/g, 'g')
    .replace(/sh|ch/g, 's')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/\s+/g, ' ')
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let last = prev[0]!
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]!
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1))
      last = tmp
    }
  }
  return prev[b.length]!
}

export type Verdict = 'goed' | 'bijna' | 'fout'

/** Accepts the transliteration, the Arabic script, or a near miss of either. */
export function checkTyped(input: string, target: Word): Verdict {
  const raw = input.trim()
  if (!raw) return 'fout'
  if (raw.replace(/\s+/g, '') === target.ar.replace(/\s+/g, '')) return 'goed'

  const got = normalise(raw)
  const want = normalise(target.tr)
  if (got === want) return 'goed'

  const slack = want.length > 8 ? 2 : 1
  return levenshtein(got, want) <= slack ? 'bijna' : 'fout'
}

/** Speech recognition returns whatever it heard; grade it the same way. */
export function checkSpoken(heard: string, target: Word): Verdict {
  const cleaned = heard.replace(/[^\p{L}\p{N}\s]/gu, ' ')
  if (cleaned.includes(target.ar)) return 'goed'
  const best = cleaned
    .split(/\s+/)
    .concat(cleaned)
    .map((part) => checkTyped(part, target))
  if (best.includes('goed')) return 'goed'
  return best.includes('bijna') ? 'bijna' : 'fout'
}

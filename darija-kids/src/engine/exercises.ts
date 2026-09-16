import type { Lesson, Word } from '../content/types'
import { allWords, word } from '../content/lexicon'
import { LETTERS } from '../content/alphabet'
import { ALL_SENTENCES, sentence } from '../content/sentences'
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
  | 'dictee'           // hear it, write it — no meaning on screen
  | 'schrijf'          // trace the word in Arabic script
  | 'spreek'           // say it out loud
  | 'letter-nieuw'     // meet a letter, with its three shapes
  | 'letter-klank'     // name and sound → pick the letter
  | 'letter-naam'      // letter → pick the name
  | 'letter-vorm'      // which shape does this letter take here?
  | 'letter-schrijf'   // trace the letter, in one of its three shapes
  | 'zin-nieuw'        // meet a sentence, read out in full
  | 'zin-bouw'         // build the sentence from a word bank
  | 'zin-betekenis'    // sentence → meaning
  | 'zin-luister'      // audio → the written sentence

export type LetterForm = 'initial' | 'medial' | 'final'

export interface Exercise {
  id: string
  kind: ExerciseKind
  /** The word being asked. Empty for letter and sentence exercises. */
  wordId: string
  /** Word ids offered as answers, already shuffled. */
  options?: string[]
  /** Scrambled tokens for 'bouw' and 'zin-bouw'. */
  tokens?: string[]
  /** Word ids for 'koppel'. */
  pairIds?: string[]
  /** The letter being asked, for every letter- exercise. */
  letterId?: string
  /** Letter ids offered as answers, already shuffled. */
  letterOptions?: string[]
  /** Which of the three shapes 'letter-vorm' and 'letter-schrijf' ask about. */
  form?: LetterForm
  /** The sentence being asked, for every zin- exercise. */
  sentenceId?: string
  /** Sentence ids offered as answers, already shuffled. */
  sentenceOptions?: string[]
}

/** True when this exercise is about a letter rather than a word. */
export const isLetterExercise = (e: Exercise): boolean => e.kind.startsWith('letter-')

/** True when this exercise is traced rather than answered. */
export const isScribeExercise = (e: Exercise): boolean =>
  e.kind === 'schrijf' || e.kind === 'letter-schrijf'

/** True when this exercise is about a whole sentence. */
export const isSentenceExercise = (e: Exercise): boolean => e.kind.startsWith('zin-')

export interface RoundOptions {
  /** Word ids the learner has already met, so they skip the teaching card. */
  known?: Set<string>
  /** Hard mode: no teaching cards, more producing, less recognising.
   *  Defaults to whether the lesson is a checkpoint. */
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

const allSentenceIds = ALL_SENTENCES.map((z) => z.id)

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

/* ----------------------------------------------------------------- letters */

const letterOptions = (id: string, rnd: () => number, count = 4): string[] =>
  shuffle([id, ...shuffle(LETTERS.filter((l) => l.id !== id), rnd).slice(0, count - 1).map((l) => l.id)], rnd)

const FORMS: LetterForm[] = ['initial', 'medial', 'final']

/**
 * A round about the script itself.
 *
 * Four or five letters at a time, each one met, then recognised by its sound,
 * named back, and finally picked out in the shape it takes inside a word —
 * which is the part that turns a row of drawings into reading.
 */
function buildLetterRound(lesson: Lesson, opts: RoundOptions): Exercise[] {
  const { known = new Set<string>(), toets = lesson.kind === 'toets' } = opts
  const ids = lesson.letters ?? []
  const rnd = mulberry32(opts.seed ?? seedFrom(`${lesson.id}-letters-${ids.length}`))
  const out: Exercise[] = []
  let n = 0
  const add = (e: Omit<Exercise, 'id'>) => out.push({ ...e, id: `${lesson.id}-${n++}` })

  if (!toets) {
    for (const id of ids) if (!known.has(id)) add({ kind: 'letter-nieuw', wordId: '', letterId: id })
  }

  for (const id of shuffle(ids, rnd)) {
    add({ kind: 'letter-klank', wordId: '', letterId: id, letterOptions: letterOptions(id, rnd) })
  }

  for (const id of shuffle(ids, rnd)) {
    add({ kind: 'letter-naam', wordId: '', letterId: id, letterOptions: letterOptions(id, rnd) })
  }

  for (const id of shuffle(ids, rnd)) {
    add({
      kind: 'letter-vorm',
      wordId: '',
      letterId: id,
      form: pick(FORMS, rnd),
      letterOptions: letterOptions(id, rnd),
    })
  }

  const teach = out.filter((e) => e.kind === 'letter-nieuw')
  const drill = shuffle(out.filter((e) => e.kind !== 'letter-nieuw'), rnd)
  const max = opts.max ?? (toets ? 16 : 12)
  return [...teach, ...drill.slice(0, Math.max(4, max - teach.length))]
}

/* --------------------------------------------------------------- sentences */

/** Word-bank tiles for a sentence: its own words, plus a few that fit nowhere. */
const sentenceBank = (tr: string, rnd: () => number): string[] => {
  const answer = tokenize(tr)
  const noise = shuffle(
    allWords.filter((w) => !w.phrase).flatMap((w) => tokenize(w.tr)).filter((t) => !answer.includes(t)),
    rnd,
  ).slice(0, answer.length > 4 ? 2 : 3)
  return shuffle([...answer, ...noise], rnd)
}

const sentenceOptionsFor = (id: string, pool: string[], rnd: () => number, count = 3): string[] =>
  shuffle([id, ...shuffle(pool.filter((other) => other !== id), rnd).slice(0, count - 1)], rnd)

/**
 * The last stretch of every lesson: the words it just taught, standing in a
 * sentence. Heard in full first, then rebuilt from a word bank, then matched
 * to its meaning — the same sentence three ways, which is what makes the word
 * order stick rather than the words alone.
 */
function sentenceStage(
  lesson: Lesson,
  ids: string[],
  rnd: () => number,
  known: Set<string>,
  toets: boolean,
): Exercise[] {
  const out: Exercise[] = []
  let n = 0
  const add = (e: Omit<Exercise, 'id'>) => out.push({ ...e, id: `${lesson.id}-zin-${n++}` })
  // Everything a distractor could be drawn from: the other sentences of this
  // lesson first, so the options are about word order rather than topic.
  const pool = ids.length >= 3 ? ids : [...ids, ...allSentenceIds]

  for (const id of shuffle(ids, rnd).slice(0, toets ? 3 : 2)) {
    const zin = sentence(id)
    if (!toets && !known.has(id)) add({ kind: 'zin-nieuw', wordId: '', sentenceId: id })
    add({ kind: 'zin-bouw', wordId: '', sentenceId: id, tokens: sentenceBank(zin.tr, rnd) })
    add({
      kind: toets || rnd() > 0.5 ? 'zin-luister' : 'zin-betekenis',
      wordId: '',
      sentenceId: id,
      sentenceOptions: sentenceOptionsFor(id, pool, rnd),
    })
  }
  return out
}

export function buildRound(lesson: Lesson, opts: RoundOptions = {}): Exercise[] {
  if (lesson.letters?.length) return buildLetterRound(lesson, opts)
  // A checkpoint is a checkpoint even when nobody said so: teaching cards in
  // one would mean handing over the answers.
  const { known = new Set<string>(), toets = lesson.kind === 'toets', max = toets ? 14 : 13, allowSpeech = true } = opts
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
  const sentences = sentenceStage(lesson, lesson.sentences ?? [], rnd, known, toets)
  return [...teach, ...drill.slice(0, Math.max(4, max - teach.length)), ...sentences]
}

/**
 * A review round built from whatever the scheduler says is due — words first,
 * then the sentences they live in, because a sentence is only worth reviewing
 * once its words are back.
 */
export function buildReviewRound(wordIds: string[], seed = Date.now(), sentenceIds: string[] = []): Exercise[] {
  const rnd = mulberry32(seed >>> 0)
  const out: Exercise[] = []
  let n = 0
  for (const id of shuffle(sentenceIds, rnd).slice(0, 4)) {
    const kind: ExerciseKind = pick(['zin-bouw', 'zin-betekenis', 'zin-luister'] as const, rnd)
    out.push({
      id: `review-zin-${n++}`,
      kind,
      wordId: '',
      sentenceId: id,
      tokens: kind === 'zin-bouw' ? sentenceBank(sentence(id).tr, rnd) : undefined,
      sentenceOptions: kind === 'zin-bouw' ? undefined : sentenceOptionsFor(id, allSentenceIds, rnd),
    })
  }
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
  return shuffle(out, rnd)
}

/* -------------------------------------------------------------------- bonus */

/**
 * The bonus rounds.
 *
 * These are not lessons and they never run out: each one is built from
 * whatever the learner has already met, so the day the last unit is finished
 * is the day these become the whole app. They also grade the same cards a
 * lesson would, which is the point — the circle keeps turning instead of
 * closing.
 */

/** Only single words can be traced; a whole phrase will not fit in the square. */
const traceable = (ids: string[]): string[] => ids.filter((id) => !word(id).phrase)

/**
 * Tracing: letters and words, drawn over a ghost of themselves.
 *
 * A letter is asked in one of its three shapes rather than standing alone,
 * because the shape inside a word is the part a child has to feel rather than
 * recognise.
 */
export function buildScribeRound(
  letterIds: string[], wordIds: string[], seed = Date.now(), max = 6,
): Exercise[] {
  const rnd = mulberry32(seed >>> 0)
  const out: Exercise[] = []
  let n = 0
  const letters = shuffle(letterIds, rnd).slice(0, Math.ceil(max / 2))
  const words = shuffle(traceable(wordIds), rnd).slice(0, max - letters.length)
  for (const id of letters) {
    out.push({ id: `schrijf-${n++}`, kind: 'letter-schrijf', wordId: '', letterId: id, form: pick(FORMS, rnd) })
  }
  for (const id of words) out.push({ id: `schrijf-${n++}`, kind: 'schrijf', wordId: id })
  return shuffle(out, rnd)
}

/** Dictation: hear it, write it. Nothing on screen but the speaker. */
export function buildDictationRound(
  wordIds: string[], sentenceIds: string[], seed = Date.now(), max = 8,
): Exercise[] {
  const rnd = mulberry32(seed >>> 0)
  const out: Exercise[] = []
  let n = 0
  for (const id of shuffle(sentenceIds, rnd).slice(0, Math.min(3, Math.floor(max / 3)))) {
    out.push({
      id: `dictee-${n++}`, kind: 'zin-luister', wordId: '', sentenceId: id,
      sentenceOptions: sentenceOptionsFor(id, allSentenceIds, rnd),
    })
  }
  for (const id of shuffle(wordIds, rnd).slice(0, max - out.length)) {
    out.push({ id: `dictee-${n++}`, kind: 'dictee', wordId: id })
  }
  return shuffle(out, rnd)
}

/**
 * The marathon: everything met, every kind of question, in one long run.
 *
 * It does not stop at the first mistake — a child who is having a bad round
 * should not be thrown out of it. What it keeps is the longest run of right
 * answers, and that is the record worth beating.
 */
export function buildMarathonRound(
  wordIds: string[], letterIds: string[], sentenceIds: string[], seed = Date.now(), max = 30,
): Exercise[] {
  const rnd = mulberry32(seed >>> 0)
  const out: Exercise[] = []
  let n = 0

  for (const id of shuffle(sentenceIds, rnd).slice(0, Math.round(max * 0.2))) {
    const kind: ExerciseKind = pick(['zin-bouw', 'zin-betekenis', 'zin-luister'] as const, rnd)
    out.push({
      id: `marathon-${n++}`, kind, wordId: '', sentenceId: id,
      tokens: kind === 'zin-bouw' ? sentenceBank(sentence(id).tr, rnd) : undefined,
      sentenceOptions: kind === 'zin-bouw' ? undefined : sentenceOptionsFor(id, allSentenceIds, rnd),
    })
  }
  for (const id of shuffle(letterIds, rnd).slice(0, Math.round(max * 0.2))) {
    const kind: ExerciseKind = pick(['letter-klank', 'letter-naam', 'letter-vorm'] as const, rnd)
    out.push({
      id: `marathon-${n++}`, kind, wordId: '', letterId: id,
      letterOptions: letterOptions(id, rnd),
      form: kind === 'letter-vorm' ? pick(FORMS, rnd) : undefined,
    })
  }
  for (const id of shuffle(wordIds, rnd).slice(0, max - out.length)) {
    const w = word(id)
    const kind: ExerciseKind = w.phrase
      ? pick(['kies-betekenis', 'bouw'] as const, rnd)
      : pick(['kies-betekenis', 'kies-darija', 'luister', 'script', 'tik', 'dictee'] as const, rnd)
    out.push({
      id: `marathon-${n++}`, kind, wordId: id,
      options: kind === 'bouw' || kind === 'tik' || kind === 'dictee' ? undefined : options(w, rnd),
      tokens: kind === 'bouw' ? bankFor(w, rnd) : undefined,
    })
  }
  return shuffle(out, rnd)
}

/** The sentence forge: build it, hear it, mean it. */
export function buildSentenceRound(sentenceIds: string[], seed = Date.now(), max = 6): Exercise[] {
  const rnd = mulberry32(seed >>> 0)
  let n = 0
  return shuffle(sentenceIds, rnd).slice(0, max).map((id): Exercise => {
    const kind: ExerciseKind = pick(['zin-bouw', 'zin-bouw', 'zin-luister', 'zin-betekenis'] as const, rnd)
    return {
      id: `zinnen-${n++}`, kind, wordId: '', sentenceId: id,
      tokens: kind === 'zin-bouw' ? sentenceBank(sentence(id).tr, rnd) : undefined,
      sentenceOptions: kind === 'zin-bouw' ? undefined : sentenceOptionsFor(id, allSentenceIds, rnd),
    }
  })
}

/** Saying it out loud, for a device that can listen. */
export function buildSpeakRound(wordIds: string[], seed = Date.now(), max = 6): Exercise[] {
  const rnd = mulberry32(seed >>> 0)
  let n = 0
  return shuffle(wordIds, rnd).slice(0, max).map((id): Exercise => ({
    id: `spreken-${n++}`, kind: 'spreek', wordId: id,
  }))
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

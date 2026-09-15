import { describe, expect, it } from 'vitest'
import { DAY, dueCards, newCard, review, strengthLabel } from './srs'
import {
  buildRound, buildReviewRound, checkSpoken, checkTyped, isLetterExercise, isSentenceExercise,
  normalise, tokenize,
} from './exercises'
import { latinise, phoneticOf } from './audio'
import { LESSONS, UNITS } from '../content/curriculum'
import { letter } from '../content/alphabet'
import { sentence } from '../content/sentences'
import { word } from '../content/lexicon'

const now = 1_700_000_000_000

describe('spaced repetition', () => {
  it('brings a new word back within the session, then pushes it out', () => {
    let card = newCard('khobz', now)
    card = review(card, 'goed', now)
    expect(card.interval).toBe(1)

    card = review(card, 'goed', now + DAY)
    expect(card.interval).toBeGreaterThan(1)
    expect(card.strength).toBeGreaterThan(0.4)
  })

  it('sends a wrong answer back to the front without wiping progress', () => {
    let card = newCard('atay', now)
    card = review(card, 'goed', now)
    card = review(card, 'goed', now + DAY)
    const before = card.strength

    card = review(card, 'fout', now + 2 * DAY)
    expect(card.due - (now + 2 * DAY)).toBeLessThan(10 * 60_000)
    expect(card.lapses).toBe(1)
    expect(card.strength).toBeLessThan(before)
    expect(card.strength).toBeGreaterThanOrEqual(0)
  })

  it('keeps ease inside its bounds however badly it goes', () => {
    let card = newCard('sba3', now)
    for (let i = 0; i < 30; i++) card = review(card, 'fout', now)
    expect(card.ease).toBe(1.3)
    for (let i = 0; i < 60; i++) card = review(card, 'makkelijk', now)
    expect(card.ease).toBeLessThanOrEqual(3)
    expect(card.interval).toBeLessThanOrEqual(240)
  })

  it('queues the weakest due words first', () => {
    const strong = { ...newCard('a', now), strength: 0.9, due: now - 1000 }
    const weak = { ...newCard('b', now), strength: 0.1, due: now - 500 }
    const future = { ...newCard('c', now), due: now + DAY }
    expect(dueCards([strong, weak, future], now).map((c) => c.id)).toEqual(['b', 'a'])
  })

  it('labels strength as a key the interface can translate', () => {
    expect(strengthLabel(0)).toBe('nieuw')
    expect(strengthLabel(0.9)).toBe('vastgezet')
  })
})

describe('rounds', () => {
  const lesson = LESSONS.find((l) => l.id === 'eten-1')!

  it('teaches every new word before drilling it', () => {
    const round = buildRound(lesson, { seed: 7 })
    const teaching = round.filter((e) => e.kind === 'nieuw').map((e) => e.wordId)
    expect(new Set(teaching)).toEqual(new Set(lesson.words))
    expect(round.slice(0, teaching.length).every((e) => e.kind === 'nieuw')).toBe(true)
  })

  it('skips the teaching cards for words already known', () => {
    const round = buildRound(lesson, { known: new Set(lesson.words), seed: 7 })
    expect(round.some((e) => e.kind === 'nieuw')).toBe(false)
  })

  it('only ever asks about what the lesson teaches', () => {
    for (const l of LESSONS) {
      for (const e of buildRound(l, { seed: 3 })) {
        if (isLetterExercise(e)) {
          expect(l.letters, `${l.id}/${e.kind}`).toContain(e.letterId)
          for (const id of e.letterOptions ?? []) expect(() => letter(id)).not.toThrow()
        } else if (isSentenceExercise(e)) {
          expect(l.sentences, `${l.id}/${e.kind}`).toContain(e.sentenceId)
          for (const id of e.sentenceOptions ?? []) expect(() => sentence(id)).not.toThrow()
        } else {
          expect(l.words, `${l.id}/${e.kind}`).toContain(e.wordId)
          for (const id of e.options ?? []) expect(() => word(id)).not.toThrow()
          for (const id of e.pairIds ?? []) expect(l.words).toContain(id)
        }
      }
    }
  })

  it('always includes the right answer among the options', () => {
    for (const l of LESSONS.slice(0, 12)) {
      for (const e of buildRound(l, { seed: 11 })) {
        if (isLetterExercise(e)) {
          if (e.letterOptions) expect(e.letterOptions, e.id).toContain(e.letterId)
          continue
        }
        if (isSentenceExercise(e)) {
          if (e.sentenceOptions) expect(e.sentenceOptions, e.id).toContain(e.sentenceId)
          if (e.tokens) {
            for (const t of tokenize(sentence(e.sentenceId!).tr)) expect(e.tokens, e.id).toContain(t)
          }
          continue
        }
        if (e.options) expect(e.options, e.id).toContain(e.wordId)
        if (e.tokens) {
          for (const t of tokenize(word(e.wordId).tr)) expect(e.tokens, e.id).toContain(t)
        }
      }
    }
  })

  it('keeps a round short enough for one sitting', () => {
    for (const l of LESSONS) {
      // Nothing new to teach: what is left is the drilling plus the sentences.
      const round = buildRound(l, { known: new Set([...l.words, ...(l.letters ?? []), ...(l.sentences ?? [])]), seed: 5 })
      expect(round.length, l.id).toBeLessThanOrEqual(20)
      expect(round.length, l.id).toBeGreaterThanOrEqual(4)
    }
  })

  it('ends a word lesson with its sentences, and only at the end', () => {
    for (const l of LESSONS) {
      if (!l.sentences?.length || l.letters?.length) continue
      const round = buildRound(l, { seed: 8 })
      const first = round.findIndex(isSentenceExercise)
      expect(first, l.id).toBeGreaterThan(0)
      expect(round.slice(first).every(isSentenceExercise), l.id).toBe(true)
      // Every sentence it does reach is heard, built and then recognised.
      const built = round.filter((e) => e.kind === 'zin-bouw')
      expect(built.length, l.id).toBeGreaterThan(0)
    }
  })

  it('teaches letters before drilling them, three shapes and all', () => {
    const first = LESSONS.find((l) => l.id === 'hruf-1')!
    const round = buildRound(first, { seed: 4 })
    const teaching = round.filter((e) => e.kind === 'letter-nieuw').map((e) => e.letterId)
    expect(new Set(teaching)).toEqual(new Set(first.letters))
    expect(round.some((e) => e.kind === 'letter-vorm')).toBe(true)
    expect(round.every((e) => e.wordId === '')).toBe(true)
  })

  it('leaves the teaching cards out of the letter checkpoint', () => {
    const toets = LESSONS.find((l) => l.id === 'hruf-toets')!
    const round = buildRound(toets, { seed: 4 })
    expect(round.some((e) => e.kind === 'letter-nieuw')).toBe(false)
    expect(round.length).toBeLessThanOrEqual(16)
  })

  it('drops teaching cards and speaking from a checkpoint', () => {
    const toets = UNITS[0]!.lessons.at(-1)!
    const round = buildRound(toets, { toets: true, seed: 2 })
    expect(round.some((e) => e.kind === 'nieuw')).toBe(false)
    expect(round.length).toBeGreaterThan(4)
  })

  it('builds a review round from due words only', () => {
    const round = buildReviewRound(['khobz', 'atay', 'mesh', 'kelb'], 42)
    expect(round.length).toBe(4)
    for (const e of round) expect(['khobz', 'atay', 'mesh', 'kelb']).toContain(e.wordId)
  })

  it('mixes due sentences into a review round', () => {
    const round = buildReviewRound(['khobz', 'atay'], 42, ['eten-1-a', 'eten-1-b'])
    const zinnen = round.filter(isSentenceExercise)
    expect(zinnen.length).toBe(2)
    for (const e of zinnen) expect(['eten-1-a', 'eten-1-b']).toContain(e.sentenceId)
  })

  it('is deterministic for the same seed', () => {
    const a = buildRound(lesson, { seed: 99 }).map((e) => `${e.kind}:${e.wordId}`)
    const b = buildRound(lesson, { seed: 99 }).map((e) => `${e.kind}:${e.wordId}`)
    expect(a).toEqual(b)
  })
})

describe('checking what the learner typed', () => {
  const khobz = word('khobz')
  const afak = word('afak')
  const phrase = word('shhal-hada')

  it('accepts the exact transliteration and the Arabic script', () => {
    expect(checkTyped('khobz', khobz)).toBe('goed')
    expect(checkTyped('  KHOBZ ', khobz)).toBe('goed')
    expect(checkTyped('خبز', khobz)).toBe('goed')
  })

  it('forgives the ways people write the same sound', () => {
    expect(checkTyped('afak', afak)).toBe('goed')
    expect(checkTyped('3afak', afak)).toBe('goed')
    expect(checkTyped('shhal hada', phrase)).toBe('goed')
    expect(checkTyped('sh7al hada?', phrase)).toBe('goed')
    expect(checkTyped('Sh7al Hada', phrase)).toBe('goed')
  })

  it('calls a small slip “bijna” and a wrong word “fout”', () => {
    expect(checkTyped('khubz', khobz)).toBe('bijna')
    expect(checkTyped('atay', khobz)).toBe('fout')
    expect(checkTyped('', khobz)).toBe('fout')
  })

  it('grades speech the same way, inside a longer sentence', () => {
    expect(checkSpoken('خبز', khobz)).toBe('goed')
    expect(checkSpoken('ana bghit khobz', khobz)).toBe('goed')
    expect(checkSpoken('mesh kelb', khobz)).toBe('fout')
  })

  it('normalises predictably', () => {
    expect(normalise('Ssalamu 3alaykum!')).toBe(normalise('salamu alaykum'))
  })
})

describe('pronunciation fallback', () => {
  // A device with no Arabic voice borrows a European one, and every language
  // spells the same sound differently — so the rewrite depends on the voice.
  it('rewrites the sounds French cannot read as written', () => {
    expect(latinise('shukran')).toBe('choukran')
    expect(latinise('khobz')).toBe('robz')
    expect(latinise('ghali')).toBe('rali')
    expect(latinise('3afak')).toBe('afak')
    expect(latinise('wakha')).toBe('ouara')
    expect(latinise('sh7al')).toBe('chhal')
  })

  it('leaves an ou that is already there alone', () => {
    expect(latinise('jouj')).toBe('jouj')
    expect(latinise('kesksu')).toBe('kesksou')
  })

  it('keeps whole phrases readable', () => {
    expect(latinise('  Ssalamu 3alaykum  ')).toBe('ssalamou alaykoum')
    expect(latinise('')).toBe('')
  })

  it('spells for a German voice the German way', () => {
    expect(latinise('shukran', 'de')).toBe('schukran')
    expect(latinise('khobz', 'de')).toBe('chobs')
    expect(latinise('jouj', 'de')).toBe('schusch')
    expect(latinise('3afak', 'de')).toBe('afak')
  })

  it('spells for a Dutch voice the Dutch way', () => {
    expect(latinise('shukran', 'nl')).toBe('sjoekran')
    expect(latinise('khobz', 'nl')).toBe('chobz')
    expect(latinise('ghali', 'nl')).toBe('gali')
    expect(latinise('jouj', 'nl')).toBe('zjoezj')
  })

  it('picks the ruleset from the voice, not from the interface', () => {
    expect(phoneticOf('de-DE')).toBe('de')
    expect(phoneticOf('fr-CA')).toBe('fr')
    expect(phoneticOf('pt-BR')).toBe('fr')
  })
})

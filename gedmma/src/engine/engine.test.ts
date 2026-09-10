import { describe, expect, it } from 'vitest'
import { DAY, dueCards, newCard, review, strengthLabel } from './srs'
import { buildRound, buildReviewRound, checkSpoken, checkTyped, normalise, tokenize } from './exercises'
import { latinise } from './audio'
import { LESSONS, UNITS } from '../content/curriculum'
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

  it('labels strength for the learner', () => {
    expect(strengthLabel(0)).toBe('Nieuw')
    expect(strengthLabel(0.9)).toBe('Vastgezet')
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

  it('only ever asks about words the lesson teaches', () => {
    for (const l of LESSONS) {
      for (const e of buildRound(l, { seed: 3 })) {
        expect(l.words, `${l.id}/${e.kind}`).toContain(e.wordId)
        for (const id of e.options ?? []) expect(() => word(id)).not.toThrow()
        for (const id of e.pairIds ?? []) expect(l.words).toContain(id)
      }
    }
  })

  it('always includes the right answer among the options', () => {
    for (const l of LESSONS.slice(0, 12)) {
      for (const e of buildRound(l, { seed: 11 })) {
        if (e.options) expect(e.options, e.id).toContain(e.wordId)
        if (e.tokens) {
          for (const t of tokenize(word(e.wordId).tr)) expect(e.tokens, e.id).toContain(t)
        }
      }
    }
  })

  it('keeps a round short enough for one sitting', () => {
    for (const l of LESSONS) {
      const round = buildRound(l, { known: new Set(l.words), seed: 5 })
      expect(round.length, l.id).toBeLessThanOrEqual(14)
      expect(round.length, l.id).toBeGreaterThanOrEqual(4)
    }
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
  // A device with no Arabic voice reads the Latin spelling with a French one,
  // so the spelling has to be rewritten into something French reads roughly
  // right: ch for sh, ou for u and w, a uvular r for kh and gh, no ayn.
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
})

import { describe, expect, it } from 'vitest'
import {
  buildDictationRound, buildMarathonRound, buildScribeRound, buildSentenceRound, buildSpeakRound,
  isLetterExercise, isScribeExercise, isSentenceExercise,
} from './exercises'
import { BONUS, bonusOfTheDay, bonusTask, type BonusId, type BonusPool } from './bonus'
import { countTrace, MASK, scoreTrace } from './scribe'
import { getState, importProgress, mastery, today, type State } from './store'
import { newCard, type Card } from './srs'
import { LETTERS } from '../content/alphabet'
import { ALL_SENTENCES } from '../content/sentences'
import { allWords } from '../content/lexicon'
import { word } from '../content/lexicon'

const pool: BonusPool = {
  letters: LETTERS.slice(0, 12).map((l) => l.id),
  words: allWords.slice(0, 40).map((w) => w.id),
  sentences: ALL_SENTENCES.slice(0, 10).map((z) => z.id),
  canSpeak: true,
  canWrite: true,
}

describe('tracing', () => {
  const trace = (covered: number, target: number, spilled: number, drawn: number) =>
    scoreTrace({ covered, target, spilled, drawn })

  it('passes a line that follows the letter', () => {
    expect(trace(90, 100, 10, 120).verdict).toBe('goed')
  })

  // A six-year-old's finger overshoots the ends and misses the middle of a
  // curve. That is still writing the letter, and it used to come back "bijna".
  it('passes a wobbly but recognisable letter', () => {
    expect(trace(62, 100, 55, 130).verdict).toBe('goed')
  })

  it('calls a half-drawn letter close rather than wrong', () => {
    expect(trace(40, 100, 20, 110).verdict).toBe('bijna')
  })

  it('fails a letter that was barely touched', () => {
    expect(trace(12, 100, 5, 30).verdict).toBe('fout')
  })

  it('fails a scribble that covers everything by covering the whole square', () => {
    // Every pixel of the letter is under ink, but nearly all the ink is
    // nowhere near it — which is what filling the box looks like.
    expect(trace(100, 100, 900, 1000).verdict).toBe('fout')
  })

  it('fails an empty board instead of dividing by nothing', () => {
    const empty = trace(0, 100, 0, 0)
    expect(empty.verdict).toBe('fout')
    expect(Number.isFinite(empty.coverage)).toBe(true)
  })

  it('counts ink against the letter and its margin', () => {
    const size = MASK * MASK * 4
    const glyph = new Uint8ClampedArray(size)
    const allowed = new Uint8ClampedArray(size)
    const ink = new Uint8ClampedArray(size)
    // The letter is the first hundred pixels, the margin the first two
    // hundred, and the line covers fifty of the letter plus fifty far outside.
    for (let i = 0; i < 100; i++) glyph[i * 4 + 3] = 255
    for (let i = 0; i < 200; i++) allowed[i * 4 + 3] = 255
    for (let i = 0; i < 50; i++) ink[i * 4 + 3] = 255
    for (let i = 500; i < 550; i++) ink[i * 4 + 3] = 255

    expect(countTrace(ink, glyph, allowed)).toEqual({ covered: 50, target: 100, spilled: 50, drawn: 100 })
  })
})

describe('bonus rounds', () => {
  it('builds a tracing round of letters and single words only', () => {
    const round = buildScribeRound(pool.letters, pool.words, 7)
    expect(round.length).toBe(6)
    expect(round.every(isScribeExercise)).toBe(true)
    for (const e of round) {
      if (e.kind === 'letter-schrijf') expect(e.form).toBeTruthy()
      // A whole phrase will not fit in the drawing square.
      else expect(word(e.wordId).phrase).toBeFalsy()
    }
  })

  it('gives every dictation question something to say', () => {
    const round = buildDictationRound(pool.words, pool.sentences, 11)
    expect(round.length).toBe(8)
    for (const e of round) {
      if (e.kind === 'dictee') expect(e.wordId).toBeTruthy()
      else expect(e.sentenceId).toBeTruthy()
    }
  })

  it('mixes letters, words and sentences into the marathon', () => {
    const round = buildMarathonRound(pool.words, pool.letters, pool.sentences, 3, 30)
    expect(round.length).toBe(30)
    expect(round.some(isLetterExercise)).toBe(true)
    expect(round.some(isSentenceExercise)).toBe(true)
    expect(round.some((e) => !isLetterExercise(e) && !isSentenceExercise(e))).toBe(true)
  })

  it('never asks the same thing twice in one round', () => {
    for (const round of [
      buildScribeRound(pool.letters, pool.words, 5),
      buildDictationRound(pool.words, pool.sentences, 5),
      buildMarathonRound(pool.words, pool.letters, pool.sentences, 5),
      buildSentenceRound(pool.sentences, 5),
      buildSpeakRound(pool.words, 5),
    ]) {
      const keys = round.map((e) => `${e.wordId}|${e.letterId ?? ''}|${e.sentenceId ?? ''}`)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('is a different round on a different seed', () => {
    const a = buildMarathonRound(pool.words, pool.letters, pool.sentences, 1)
    const b = buildMarathonRound(pool.words, pool.letters, pool.sentences, 2)
    expect(a.map((e) => e.id + e.kind).join()).not.toBe(b.map((e) => e.id + e.kind).join())
  })

  it('builds a round for every task it says is ready', () => {
    for (const task of BONUS) {
      expect(task.ready(pool)).toBe(true)
      const round = task.build(pool, 42)
      expect(round.length).toBeGreaterThan(0)
      expect(new Set(round.map((e) => e.id)).size).toBe(round.length)
    }
  })

  it('closes the tasks a fresh learner cannot do yet', () => {
    const empty: BonusPool = { letters: [], words: [], sentences: [], canSpeak: false, canWrite: true }
    expect(BONUS.filter((b) => b.ready(empty))).toHaveLength(0)
  })

  it('hides tracing when the setting is off', () => {
    expect(bonusTask('schrijven').ready({ ...pool, canWrite: false })).toBe(false)
  })
})

describe('the bonus of the day', () => {
  it('holds all day and moves on tomorrow', () => {
    const ids = BONUS.map((b) => b.id)
    expect(bonusOfTheDay('2026-09-16', ids)).toBe(bonusOfTheDay('2026-09-16', ids))
    expect(bonusOfTheDay('2026-09-16', ids)).not.toBe(bonusOfTheDay('2026-09-17', ids))
  })

  it('walks the whole list rather than favouring one', () => {
    const ids = BONUS.map((b) => b.id)
    const seen = new Set<BonusId>()
    for (let d = 1; d <= ids.length; d++) {
      const day = `2026-09-${String(d).padStart(2, '0')}`
      const pick = bonusOfTheDay(day, ids)
      if (pick) seen.add(pick)
    }
    expect(seen.size).toBe(ids.length)
  })

  it('picks from what is open, and nothing when nothing is', () => {
    expect(bonusOfTheDay('2026-09-16', ['dictee'])).toBe('dictee')
    expect(bonusOfTheDay('2026-09-16', [])).toBeNull()
  })
})

describe('mastery', () => {
  const now = 1_800_000_000_000
  /** Only the two fields `mastery` reads; the rest of a State is irrelevant here. */
  const withCards = (cards: Card[]): State => ({ cards: Object.fromEntries(cards.map((c) => [c.id, c])), extraCards: {} } as unknown as State)
  const card = (id: string, strength: number, due: number): Card => ({ ...newCard(id, now), strength, due })

  it('counts what is strong and not yet due back', () => {
    const level = mastery(withCards([
      card('a', 0.9, now + 86_400_000),
      card('b', 0.2, now + 86_400_000),
      card('c', 0.9, now - 1),
    ]), now)
    expect(level).toEqual({ strong: 1, met: 3, share: 1 / 3 })
  })

  it('slips on its own once a strong card falls due', () => {
    const cards = [card('a', 0.9, now + 1000), card('b', 0.9, now + 2000)]
    expect(mastery(withCards(cards), now).share).toBe(1)
    expect(mastery(withCards(cards), now + 5000).share).toBe(0)
  })

  it('is nothing rather than NaN before anything has been met', () => {
    expect(mastery(withCards([]), now)).toEqual({ strong: 0, met: 0, share: 0 })
  })
})

describe('an older save', () => {
  it('gains the counters this version added instead of turning them into NaN', () => {
    // Exactly what a save written before the bonus existed looks like: quests
    // without a bonus counter, and no bonus block at all.
    const old = JSON.stringify({
      version: 1, quests: { day: '2026-01-01', goed: 4, herhaald: 2, zinnen: 1, lessen: 1, claimed: [] },
      settings: { lang: 'nl' },
    })
    expect(importProgress(old)).toBe(true)
    const s = getState()
    expect(s.quests.bonus).toBe(0)
    expect(s.quests.goed).toBe(4)
    expect(s.bonus).toEqual({ day: today(), today: 0, total: 0, reeks: 0, getekend: 0 })
    // The setting added in the same version has to arrive too, or the writing
    // bonus is switched off for everybody who already had the app.
    expect(s.settings.schrijven).toBe(true)
    expect(s.settings.lang).toBe('nl')
  })
})

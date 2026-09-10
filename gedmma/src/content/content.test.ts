import { describe, expect, it } from 'vitest'
import { UNITS, LESSONS } from './curriculum'
import { allWords, maybeWord, searchWords } from './lexicon'
import { LETTERS } from './alphabet'
import { STORIES } from './stories'

describe('lexicon', () => {
  it('has no duplicate ids', () => {
    const ids = allWords.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every word a script, a transliteration and both meanings', () => {
    for (const w of allWords) {
      expect(w.ar, w.id).not.toBe('')
      expect(w.tr, w.id).not.toBe('')
      expect(w.nl, w.id).not.toBe('')
      expect(w.en, w.id).not.toBe('')
      expect(w.ar, w.id).toMatch(/[؀-ۿݐ-ݿ]/)
    }
  })

  it('marks multi-word entries as phrases', () => {
    // Three entries are several words but one idea, so they are not sentences.
    const compounds = new Set(['bit-n3as', 'ma3endish', 'casablanca'])
    const loose = allWords.filter((w) => w.tr.includes(' ') && !w.phrase && !compounds.has(w.id))
    expect(loose.map((w) => w.id)).toEqual([])
  })

  it('searches on Dutch, transliteration and script', () => {
    expect(searchWords('brood').map((w) => w.id)).toContain('khobz')
    expect(searchWords('atay').map((w) => w.id)).toContain('atay')
    expect(searchWords('خبز').map((w) => w.id)).toContain('khobz')
    expect(searchWords('afak').map((w) => w.id)).toContain('afak')
  })
})

describe('curriculum', () => {
  it('points every lesson at words that exist', () => {
    for (const lesson of LESSONS) {
      for (const id of lesson.words) {
        expect(maybeWord(id), `${lesson.id} → ${id}`).toBeDefined()
      }
    }
  })

  it('gives every unit a checkpoint covering all of its words', () => {
    for (const unit of UNITS) {
      const toets = unit.lessons.at(-1)!
      expect(toets.kind).toBe('toets')
      const taught = new Set(unit.lessons.slice(0, -1).flatMap((l) => l.words))
      expect(new Set(toets.words)).toEqual(taught)
    }
  })

  it('has unique lesson ids and non-empty lessons', () => {
    const ids = LESSONS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of LESSONS) expect(l.words.length, l.id).toBeGreaterThan(2)
  })

  it('teaches a decent share of the lexicon', () => {
    const taught = new Set(LESSONS.flatMap((l) => l.words))
    expect(taught.size).toBeGreaterThan(allWords.length * 0.9)
  })
})

describe('alphabet and stories', () => {
  it('covers the Arabic alphabet plus the Moroccan extras', () => {
    expect(LETTERS.length).toBeGreaterThanOrEqual(31)
    expect(LETTERS.map((l) => l.tr)).toContain('3')
    for (const l of LETTERS) {
      if (l.exampleWordId) expect(maybeWord(l.exampleWordId), l.id).toBeDefined()
    }
  })

  it('keeps every story line translated and every quiz answerable', () => {
    for (const s of STORIES) {
      expect(s.lines.length).toBeGreaterThan(4)
      for (const line of s.lines) {
        expect(line.ar).not.toBe('')
        expect(line.tr).not.toBe('')
        expect(line.nl).not.toBe('')
      }
      for (const q of s.quiz) {
        expect(q.options[q.answer], `${s.id}: ${q.q}`).toBeDefined()
      }
    }
  })
})

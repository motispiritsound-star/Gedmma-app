import { describe, expect, it } from 'vitest'
import { UNITS, LESSONS } from './curriculum'
import { allWords, maybeWord, searchWords } from './lexicon'
import { LETTERS } from './alphabet'
import { LETTER_SPEECH, RESPELLED, SPOKEN, SPOKEN_WORD, letterSpeech, spokenForm } from './pronunciation'
import { strokeOrder } from '../engine/scribe'
import { ALL_SENTENCES, maybeSentence } from './sentences'
import { STORIES } from './stories'
import { HISTORY, cardForCheckpoint, historyById } from './history'
import { historyOf } from './localise'
import { LANGS } from '../i18n/languages'

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
    for (const l of LESSONS) {
      const taught = l.letters?.length ?? l.words.length
      expect(taught, l.id).toBeGreaterThan(2)
    }
  })

  it('opens the path with the alphabet, and teaches every letter once', () => {
    const first = UNITS[0]!
    expect(first.id).toBe('hruf')
    const taught = first.lessons.filter((l) => l.kind === 'letters').flatMap((l) => l.letters ?? [])
    expect(new Set(taught).size).toBe(taught.length)
    expect(new Set(taught)).toEqual(new Set(LETTERS.map((l) => l.id)))
    // And the checkpoint asks about all of them.
    expect(new Set(first.lessons.at(-1)!.letters)).toEqual(new Set(taught))
  })

  it('ends every word lesson with sentences made from its words', () => {
    for (const lesson of LESSONS) {
      if (lesson.kind === 'toets' || lesson.letters?.length) continue
      expect(lesson.sentences?.length, lesson.id).toBeGreaterThanOrEqual(2)
      for (const id of lesson.sentences ?? []) expect(maybeSentence(id), `${lesson.id} → ${id}`).toBeDefined()
    }
  })

  it('writes every sentence out in full, in both source languages', () => {
    const ids = ALL_SENTENCES.map((z) => z.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const z of ALL_SENTENCES) {
      expect(z.ar, z.id).toMatch(/[؀-ۿݐ-ݿ]/)
      expect(z.tr.split(/\s+/).length, z.id).toBeGreaterThan(1)
      expect(z.nl, z.id).not.toBe('')
      expect(z.en, z.id).not.toBe('')
      // The word bank is cut from the Latin spelling, so it may not carry the
      // clitics that the Arabic writes against the next word.
      expect(z.tr, z.id).not.toMatch(/\s$/)
    }
  })

  it('teaches a decent share of the lexicon', () => {
    const taught = new Set(LESSONS.flatMap((l) => l.words))
    expect(taught.size).toBeGreaterThan(allWords.length * 0.9)
  })
})

describe('pronunciation overrides', () => {
  /** Every Arabic token the app ever hands to the voice. */
  const spokenTokens = new Set(
    [...allWords.map((w) => w.ar), ...ALL_SENTENCES.map((z) => z.ar)]
      .flatMap((text) => text.split(/\s+/))
      .map((token) => token.replace(/[؟?!.,]/g, '')),
  )

  const CLITICS = ['وبال', 'وفال', 'ولل', 'وال', 'بال', 'فال', 'كال', 'لل', 'ال', 'و', 'ب', 'ف', 'ل', 'ك']

  it('only overrides words that are actually said somewhere', () => {
    for (const key of Object.keys(SPOKEN_WORD)) {
      const used = [...spokenTokens].some(
        (token) => token === key || CLITICS.some((c) => token === c + key),
      )
      expect(used, `${key} komt in geen enkel woord of zin voor`).toBe(true)
    }
    for (const key of Object.keys(SPOKEN)) {
      expect(spokenTokens.has(key) || allWords.some((w) => w.ar === key), key).toBe(true)
    }
  })

  it('changes the spelling rather than the word', () => {
    // An override may only add diacritics or drop punctuation; if the letters
    // themselves differ, the voice would be saying something else.
    const bare = (s: string) => s.replace(/[\u064b-\u0652\u0670\s]/g, '').replace(/[؟?!.,]/g, '')
    for (const table of [SPOKEN_WORD, SPOKEN]) {
      for (const [written, spoken] of Object.entries(table)) {
        // Unless it is one of the handful that says out loud why it differs.
        if (written in RESPELLED) continue
        expect(bare(spoken), written).toBe(bare(written))
      }
    }
  })

  it('keeps the list of respelled words short and explained', () => {
    // Every entry costs a comment and a reason; a table of them would be the
    // hole the guard above exists to close.
    expect(Object.keys(RESPELLED).length).toBeLessThanOrEqual(8)
    for (const [written, spoken] of Object.entries(RESPELLED)) {
      expect(spoken, written).not.toBe(written)
    }
  })

  it('fixes a word wherever it turns up, prefix and all', () => {
    expect(spokenForm('بسلامة')).toBe('بْسلامة')
    // Inside a sentence, with the "and" Moroccans write against the next word.
    expect(spokenForm('شكرا بزاف وبسلامة')).toBe('شكرا بزاف وبْسلامة')
    // A question mark would make some voices pause mid-sentence.
    expect(spokenForm('شحال هادا؟')).toBe('شْحال هادا')
    // Nothing to fix means nothing changes.
    expect(spokenForm('شكرا')).toBe('شكرا')
  })

  it('says every sentence without leaving a word to the voice’s guess', () => {
    for (const z of ALL_SENTENCES) {
      expect(spokenForm(z.ar), z.id).not.toMatch(/[؟?!]/)
    }
  })
})

describe('alphabet and stories', () => {
  it('covers the Arabic alphabet, and only the Arabic alphabet', () => {
    // Twenty-eight. پ, ڤ and ݣ are Moroccan inventions for loanwords, not
    // letters of the alphabet, and a child taught thirty-one has three to
    // unlearn.
    expect(LETTERS.length).toBe(28)
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

describe('history cards', () => {
  it('has no duplicate ids', () => {
    const ids = HISTORY.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('fills in every field, in Dutch', () => {
    for (const c of HISTORY) {
      expect(c.jaar, c.id).not.toBe('')
      expect(c.titel, c.id).not.toBe('')
      // Long enough to be worth a screen, short enough to read after a test.
      expect(c.body.length, c.id).toBeGreaterThan(120)
      expect(c.body.length, c.id).toBeLessThan(420)
      expect(c.wist.length, c.id).toBeGreaterThan(40)
      expect(c.wist.length, c.id).toBeLessThan(220)
    }
  })

  it('runs in chronological order', () => {
    const years = HISTORY.map((c) => c.vanaf)
    expect(years).toEqual([...years].sort((a, b) => a - b))
  })

  it('is translated into every language', () => {
    for (const { code } of LANGS) {
      for (const card of HISTORY) {
        const c = historyOf(card, code)
        expect(c.titel, `${code}/${card.id}`).not.toBe('')
        expect(c.wist, `${code}/${card.id}`).not.toBe('')
        expect(c.body.length, `${code}/${card.id}`).toBeGreaterThan(100)
        if (code !== 'nl') {
          // A pack that forgot a card would silently fall back to Dutch.
          expect(c.body, `${code}/${card.id}`).not.toBe(card.body)
        }
      }
    }
  })

  it('hands out a card for every checkpoint, for ever', () => {
    expect(cardForCheckpoint(0)).toBe(HISTORY[0])
    expect(cardForCheckpoint(HISTORY.length)).toBe(HISTORY[0])
    for (let n = 0; n < 60; n++) expect(historyById(cardForCheckpoint(n).id)).toBeDefined()
  })
})

describe('how the letters are said', () => {
  it('gives every letter an Arabic name and a borrowed spelling', () => {
    for (const l of LETTERS) {
      const speech = LETTER_SPEECH[l.id]
      expect(speech, l.id).toBeDefined()
      // The name, not the shape: a voice handed one bare glyph says anything.
      expect(speech!.ar.length, l.id).toBeGreaterThan(l.ar.length)
      expect(speech!.base, l.id).toMatch(/^[a-z']+$/)
    }
  })

  it('has a spelling for all six borrowed voices', () => {
    for (const l of LETTERS) {
      const { latin } = letterSpeech(l.id, l.ar, l.name)
      for (const target of ['nl', 'fr', 'de', 'es', 'it', 'en']) {
        expect(latin[target], `${l.id}/${target}`).toBeTruthy()
      }
    }
  })

  it('never says ج as a plain z', () => {
    // The bug this table exists for: "jim" through the Dutch word rules came
    // out "ziem", which is the sound of ز, not of ج.
    const { latin } = letterSpeech('jim', 'ج', 'jim')
    expect(latin.nl).toBe('zjiem')
    expect(latin.nl).not.toMatch(/^z[aeiou]/)
  })

  it('gives the emphatic letters a name of their own', () => {
    const names = LETTERS.map((l) => l.name)
    expect(new Set(names).size, names.join(' ')).toBe(names.length)
  })
})

describe('stroke order', () => {
  /** A tiny painted square, so the order can be checked without a browser. */
  const board = (n: number, blobs: { x: number; y: number; r: number }[]): Uint8ClampedArray => {
    const data = new Uint8ClampedArray(n * n * 4)
    for (const b of blobs) {
      for (let y = b.y - b.r; y <= b.y + b.r; y++) {
        for (let x = b.x - b.r; x <= b.x + b.r; x++) {
          if (x < 0 || y < 0 || x >= n || y >= n) continue
          if ((x - b.x) ** 2 + (y - b.y) ** 2 > b.r ** 2) continue
          data[(y * n + x) * 4 + 3] = 255
        }
      }
    }
    return data
  }

  it('starts at the right-hand end of a wide body', () => {
    const n = 64
    const body = Array.from({ length: 30 }, (_, i) => ({ x: 16 + i, y: 32, r: 3 }))
    const [first] = strokeOrder(board(n, body), n)
    expect(first!.x).toBeGreaterThan(0.6)
  })

  it('starts at the top of a tall body', () => {
    const n = 64
    const body = Array.from({ length: 30 }, (_, i) => ({ x: 32, y: 16 + i, r: 3 }))
    const [first] = strokeOrder(board(n, body), n)
    expect(first!.y).toBeLessThan(0.35)
  })

  it('numbers the dots right to left, after the body', () => {
    const n = 64
    const body = Array.from({ length: 30 }, (_, i) => ({ x: 16 + i, y: 30, r: 3 }))
    const points = strokeOrder(board(n, [...body, { x: 20, y: 48, r: 3 }, { x: 42, y: 48, r: 3 }]), n)
    expect(points).toHaveLength(3)
    // The body first, then the right-hand dot, then the left-hand one.
    expect(points[1]!.x).toBeGreaterThan(points[2]!.x)
  })

  it("shifts a dot's number clear of the dot", () => {
    const n = 64
    const body = Array.from({ length: 30 }, (_, i) => ({ x: 16 + i, y: 30, r: 3 }))
    const points = strokeOrder(board(n, [...body, { x: 30, y: 48, r: 3 }]), n)
    expect(points[1]!.y * n).toBeGreaterThan(48)
  })
})

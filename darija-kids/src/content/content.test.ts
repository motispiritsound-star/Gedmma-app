import { describe, expect, it } from 'vitest'
import { UNITS, LESSONS } from './curriculum'
import { allWords, maybeWord, searchWords } from './lexicon'
import { LETTERS } from './alphabet'
import { LETTER_SPEECH, RESPELLED, SPOKEN, SPOKEN_WORD, letterSpeech, spokenForm } from './pronunciation'
import { ALL_SENTENCES, maybeSentence } from './sentences'
import { STORIES } from './stories'
import { HISTORY, cardForCheckpoint, historyById } from './history'
import { historyOf } from './localise'
import { EIGEN_IDS, eigenVoorkeur, OPNAME_NODIG, OPNIEUW, UITSPRAAK, voorkeurVoor, zwevendeIds } from './eigen'
import { hasClip } from '../engine/clips'
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
    expect(spokenForm('بسلامة')).toBe('بْسْلَامَة')
    // Inside a sentence, with the "and" Moroccans write against the next word.
    expect(spokenForm('شكرا بزاف وبسلامة')).toBe('شكرا بَزَّافْ وبْسْلَامَة')
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

  // "1777" reads the same everywhere; "19e eeuw" does not, and a Dutch
  // century under an English card is the kind of thing nobody reports.
  it('translates a year that is a word, not a number', () => {
    for (const card of HISTORY) {
      if (!/\p{Letter}/u.test(card.jaar)) continue
      for (const { code } of LANGS) {
        if (code === 'nl') continue
        expect(historyOf(card, code).jaar, `${code}/${card.id}`).not.toBe(card.jaar)
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

describe('woorden die een Arabische stem verkeerd leest', () => {
  it('verwijst alleen naar woorden die bestaan', () => {
    expect(zwevendeIds()).toEqual([])
  })

  it('geeft elk woord een stem die de klanken aankan', () => {
    for (const id of EIGEN_IDS) {
      const voorkeur = eigenVoorkeur(
        [...allWords, ...ALL_SENTENCES].find((w) => w.id === id)!.ar,
      )
      expect(voorkeur, id).toBeDefined()
      expect(voorkeur!.length, id).toBe(6)
    }
  })

  // Dutch and German are the only two of the six with خ; French turns it into
  // an r, which is a different letter.
  it('stuurt kh naar een taal die kh kan zeggen', () => {
    expect(voorkeurVoor('khoya')[0]).toBe('nl')
    expect(voorkeurVoor('bezzaf')[0]).toBe('fr')
  })

  // A letter's name is Standard Arabic too, so an Arabic voice is right for it
  // — the list is for Darija's own vocabulary and must not swallow letters.
  it('bevat geen letters', () => {
    const letters = new Set(LETTERS.map((l) => l.id))
    for (const id of EIGEN_IDS) expect(letters.has(id), id).toBe(false)
  })
})

describe('welke stem welk woord zegt', () => {
  it('legt per woord één van de twee wegen vast', () => {
    for (const [id, weg] of Object.entries(UITSPRAAK)) {
      expect(['arabisch', 'geleend'], id).toContain(weg)
    }
  })

  // Een woord dat niet getest is hoort naar de Arabische stem te gaan: dat is
  // de oorspronkelijke weg, en voor het merendeel van de woordenschat de
  // juiste. Stilzwijgend uitwijken naar een geleende stem zou een oordeel zijn
  // dat niemand heeft geveld.
  it('laat een woord zonder oordeel naar de Arabische stem gaan', () => {
    const onbekend = allWords.find((w) => !(w.id in UITSPRAAK))!
    expect(eigenVoorkeur(onbekend.ar)).toBeUndefined()
  })

  it('stuurt alleen de woorden met "geleend" naar een andere stem', () => {
    for (const [id, weg] of Object.entries(UITSPRAAK)) {
      const w = [...allWords, ...ALL_SENTENCES].find((x) => x.id === id)!
      const geleend = eigenVoorkeur(w.ar) !== undefined
      expect(geleend, `${id} staat op "${weg}"`).toBe(weg === 'geleend')
    }
  })
})

describe('wat nog opgenomen moet worden', () => {
  // Zinnen staan er net zo goed op als woorden: een stem die één woord nog
  // haalt, struikelt over een hele zin, en dan is een opname net zo nodig.
  it('verwijst naar bestaande woorden of zinnen', () => {
    const bekend = new Set([...allWords.map((w) => w.id), ...ALL_SENTENCES.map((z) => z.id)])
    for (const id of OPNAME_NODIG) expect(bekend.has(id), id).toBe(true)
  })

  it('noemt geen woord twee keer', () => {
    expect(new Set(OPNAME_NODIG).size).toBe(OPNAME_NODIG.length)
  })

  // Een woord waar geen stem raad mee weet is niet ook nog eens een woord
  // waarvan is vastgelegd welke stem het zegt. Stond het in allebei, dan zou
  // de lijst zeggen dat het goed komt terwijl het wacht op een mens.
  it('staat niet ook als getest genoteerd', () => {
    for (const id of OPNAME_NODIG) expect(UITSPRAAK[id], id).toBeUndefined()
  })

  // Een afgekeurde opname moet wel ergens over gaan: een letter, een woord of
  // een zin die de app kent. Staat er iets op dat nergens bij hoort, dan wacht
  // er iets op een stem wat niemand ooit zal horen.
  it('wijst naar iets dat de app kent', () => {
    const bekend = new Set([
      ...LETTERS.map((l) => l.id),
      ...allWords.map((w) => w.id),
      ...ALL_SENTENCES.map((z) => z.id),
    ])
    for (const id of OPNIEUW) expect(bekend.has(id), id).toBe(true)
  })

  // Afkeuren is pas afkeuren als het bestand ook weg is. Blijft het staan, dan
  // speelt de app de opname af die net is afgewezen en wijst niets daarop.
  it('heeft geen bestand meer voor een afgekeurde opname', () => {
    for (const id of OPNIEUW) expect(hasClip(id), id).toBe(false)
  })
})

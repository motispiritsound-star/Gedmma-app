import { describe, expect, it } from 'vitest'
import { SITE } from './copy'
import { PATHS, SITE_URL, STORE } from './links'
import { LANG_CODES } from '../i18n/languages'
import { CLIPS } from '../engine/clips'
import { allWords } from '../content/lexicon'
import { ALL_SENTENCES } from '../content/sentences'
import { LETTERS } from '../content/alphabet'
import { UNITS } from '../content/curriculum'

/**
 * The website makes claims with numbers in them. A claim is a promise, and a
 * promise that drifts from the course is the kind of thing a reviewer at
 * Apple counts as a misleading listing — so the numbers are checked against
 * the content rather than trusted.
 */
describe('de getallen op de website', () => {
  const counts = {
    opnames: Object.keys(CLIPS).length,
    woorden: allWords.length,
    zinnen: ALL_SENTENCES.length,
    letters: LETTERS.length,
    units: UNITS.length,
  }

  it('kloppen met de cursus zelf', () => {
    expect(counts).toEqual({ opnames: 432, woorden: 304, zinnen: 100, letters: 28, units: 17 })
  })

  for (const lang of LANG_CODES) {
    it(`staan in ${lang} allemaal in de bewijsregel`, () => {
      const line = SITE[lang].heroBewijs
      for (const n of Object.values(counts)) expect(line, lang).toContain(String(n))
    })

    it(`staan in ${lang} allemaal bij de stem`, () => {
      const numbers = SITE[lang].stemPunten.map(([n]) => Number(n))
      expect(numbers, lang).toEqual([counts.opnames, counts.woorden, counts.zinnen, counts.letters])
    })
  }
})

describe('de teksten van de website', () => {
  /** Every leaf of the copy, so an empty string cannot slip through. */
  const leaves = (value: unknown, trail: string[] = []): [string, unknown][] => {
    if (typeof value === 'function') return []
    if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, [...trail, String(i)]))
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([k, v]) => leaves(v, [...trail, k]))
    }
    return [[trail.join('.'), value]]
  }

  for (const lang of LANG_CODES) {
    it(`zijn er voor ${lang} en nergens leeg`, () => {
      const empty = leaves(SITE[lang]).filter(([, v]) => typeof v !== 'string' || v.trim() === '')
      expect(empty, lang).toEqual([])
    })
  }

  it('hebben in elke taal dezelfde sleutels', () => {
    const keys = (lang: (typeof LANG_CODES)[number]) => leaves(SITE[lang]).map(([k]) => k).sort()
    for (const lang of LANG_CODES) expect(keys(lang), lang).toEqual(keys('nl'))
  })

  it('noemen de app nergens bij zijn oude naam', () => {
    for (const lang of LANG_CODES) {
      const all = leaves(SITE[lang]).map(([, v]) => String(v)).join(' ')
      expect(all, lang).not.toMatch(/Darija Kids|Gedmma|Bladi/)
    }
  })
})

describe('de adressen van de website', () => {
  it('beginnen allemaal met een streep', () => {
    for (const lang of LANG_CODES) {
      for (const path of Object.values(PATHS[lang])) expect(path, `${lang} ${path}`).toMatch(/^\//)
    }
  })

  it('komen geen twee keer voor', () => {
    const all = LANG_CODES.flatMap((lang) => Object.values(PATHS[lang]))
    expect(new Set(all).size).toBe(all.length)
  })

  it('houden de winkelpagina’s van de app op hun plek', () => {
    // Deze drie staan in App Store Connect en in de Play Console. Verhuizen
    // betekent daar handmatig aanpassen, dus dat gebeurt niet per ongeluk.
    expect(PATHS.nl.privacy).toBe('/privacy')
    expect(PATHS.nl.terms).toBe('/voorwaarden')
    expect(PATHS.nl.parents).toBe('/ouders')
  })

  it('wijzen naar het echte domein', () => {
    expect(SITE_URL).toBe('https://darijaforkids.eu')
  })

  it('zijn een echte winkel-link of leeg', () => {
    for (const [winkel, url] of Object.entries(STORE)) {
      if (url) expect(url, winkel).toMatch(/^https:\/\//)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { LANG_CODES } from './languages'
import { STRINGS } from './index'

/**
 * Arabisch middenin een zin die van links naar rechts loopt.
 *
 * Een Arabisch fragment leest van rechts naar links, en het sleept de tekens
 * eromheen mee: `3 = ع, 7 = ح, 9 = ق.` kwam op een telefoon terecht
 * als `3 = = 9 ,ح = 7 ,ع ق.` — dezelfde tekens, onleesbaar gerangschikt.
 * In de broncode staat het goed, dus dit vind je nooit door het bestand te
 * lezen. Alleen door ernaar te kijken.
 *
 * De oplossing is een isolatie om elk fragment heen: U+2068 ervoor en U+2069
 * erachter. Dan bepaalt het fragment zijn eigen richting zonder de zin
 * eromheen te beinvloeden.
 */
const ARABISCH = /[؀-ۿ]/
const LATIJN = /[A-Za-z]/

/**
 * Elk aaneengesloten stuk Arabisch, als geheel.
 *
 * Teken voor teken kijken gaat mis: binnen een fragment dat al netjes
 * geisoleerd is, staat elk teken behalve het eerste niet achter een U+2068 en
 * elk teken behalve het laatste niet voor een U+2069. Dan wijst de test een
 * fout aan in tekst die juist goed staat.
 */
const FRAGMENTEN = /[؀-ۿ]+(?:[  ][؀-ۿ]+)*/g

const losFragment = (tekst: string): boolean => {
  for (const treffer of tekst.matchAll(FRAGMENTEN)) {
    const start = treffer.index ?? 0
    const eind = start + treffer[0].length
    if (tekst[start - 1] !== '⁨' || tekst[eind] !== '⁩') return true
  }
  return false
}

const regels = (waarde: unknown, pad: string, uit: [string, string][]): void => {
  if (typeof waarde === 'string') {
    if (ARABISCH.test(waarde) && LATIJN.test(waarde)) uit.push([pad, waarde])
  } else if (Array.isArray(waarde)) {
    waarde.forEach((v, i) => regels(v, `${pad}[${i}]`, uit))
  } else if (waarde && typeof waarde === 'object') {
    for (const [k, v] of Object.entries(waarde)) regels(v, `${pad}.${k}`, uit)
  }
}

describe('Arabisch in een zin die van links naar rechts loopt', () => {
  for (const taal of LANG_CODES) {
    it(`${taal}: elk fragment staat in een isolatie`, () => {
      const gemengd: [string, string][] = []
      regels(STRINGS[taal], taal, gemengd)
      expect(gemengd.filter(([, t]) => losFragment(t)).map(([pad]) => pad)).toEqual([])
    })
  }

  it('ziet een geisoleerd fragment niet aan voor een fout', () => {
    expect(losFragment('brood is ⁨خبز⁩ in het Arabisch')).toBe(false)
  })

  it('vindt een fragment zonder isolatie ook echt', () => {
    expect(losFragment('brood is خبز in het Arabisch')).toBe(true)
  })
})

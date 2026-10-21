import { readFileSync, readdirSync, statSync } from 'node:fs'
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

  /**
   * Niets inline naast een Arabisch woord.
   *
   * `.ar` zet `display: inline-block` -- een Arabische reeks middenin een
   * Nederlandse lijst moet aan het begin van de regel staan en niet door zijn
   * eigen richting naar de rechterrand geduwd worden. Die regel staat buiten
   * elke laag en wint dus van de Tailwind-klasse ernaast; `index.css` zegt er
   * zelf bij dat `block` op zo'n element niets doet.
   *
   * Gevolg: zet je er een knop of een span achter, dan komt die ernaast in
   * plaats van eronder. In het tijdspel stond de uitspraak zo tegen het woord
   * aan geplakt -- "بسلامةbslama - luister", zonder spatie ertussen. Twaalf
   * andere plekken hebben hetzelfde `ar` op een div, maar daar volgt een
   * echt blokelement en gaat het goed.
   *
   * Vandaar dat dit naar de buur kijkt en niet naar de div zelf.
   */
  it('keeps inline neighbours off an Arabic line', () => {
    const wortel = new URL('../', import.meta.url)
    const bestanden: string[] = []
    const loop = (map: URL): void => {
      for (const naam of readdirSync(map)) {
        const pad = new URL(`${naam}`, map)
        if (statSync(pad).isDirectory()) loop(new URL(`${naam}/`, map))
        else if (naam.endsWith('.tsx')) bestanden.push(pad.pathname)
      }
    }
    loop(wortel)
    expect(bestanden.length, 'tsx-bestanden gevonden').toBeGreaterThan(10)

    for (const pad of bestanden) {
      const regels = readFileSync(pad, 'utf8').split('\n')
      regels.forEach((regel, i) => {
        // De klassenlijst uit elkaar halen en op `ar` zoeken als heel woord.
        // Een patroon dat `ar` middenin de lijst probeerde te vinden was hier
        // eerst stuk -- het eiste een spatie of een aanhalingsteken ervoor, en
        // `className="ar mt-2"` heeft daar niets van. De test wees toen nul
        // regels aan en keurde de fout goed die hij moest vangen.
        const klasse = /<(?:div|p|h[1-6])\b[^>]*className=(?:"([^"]*)"|\{`([^`]*)`\})/.exec(regel)
        if (!klasse) return
        const namen = (klasse[1] ?? klasse[2] ?? '').replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)
        if (!namen.includes('ar')) return
        const buur = regels[i + 1] ?? ''
        expect(buur.trimStart(), `${pad.split('/src/')[1]}:${i + 2}`).not.toMatch(/^<(?:button|span|a)\b/)
      })
    }
  })
})

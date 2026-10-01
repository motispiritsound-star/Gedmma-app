/**
 * Is er écht vertaald, of staat er Nederlands in een Franse app?
 *
 * Het typesysteem bewaakt dat elke sleutel bestaat — `Strings = typeof nl`
 * maakt een ontbrekende sleutel een compilerfout. Maar het bewaakt niet dat de
 * waarde iets anders is dan het Nederlands: `titel: 'Woordenboek'` haalt de
 * controle in alle zes de talen.
 *
 * Dat is precies het soort gat waar een winkelbeoordelaar in valt. De app
 * staat in vijf andere talen in de winkel; één Nederlandse zin op een scherm
 * dat hij opent is genoeg voor "incomplete localization".
 *
 * Gemeten: 684 teksten per taal, en nul die nog gelijk zijn aan het
 * Nederlands.
 */
import { describe, expect, it } from 'vitest'
import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it as italiaans } from './it'
import { nl } from './nl'

/**
 * Alles plat, met zijn pad erbij.
 *
 * Functies worden met voorbeeldwaarden aangeroepen: veel teksten zijn een
 * functie van een aantal of een prijs, en juist daar zit de meeste tekst.
 */
function plat(o: unknown, pad = '', uit = new Map<string, string>()): Map<string, string> {
  for (const [k, v] of Object.entries((o ?? {}) as Record<string, unknown>)) {
    const p = pad ? `${pad}.${k}` : k
    if (typeof v === 'string') uit.set(p, v)
    else if (typeof v === 'function') {
      try { uit.set(p, String((v as (...a: unknown[]) => unknown)(3, 'x', 'y', 'z', 'q'))) } catch { /* andere vorm */ }
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => (typeof x === 'string' ? uit.set(`${p}[${i}]`, x) : plat(x, `${p}[${i}]`, uit)))
    } else if (v && typeof v === 'object') plat(v, p, uit)
  }
  return uit
}

const basis = plat(nl)

/**
 * Wat niet meetelt.
 *
 * Een merknaam, een prijs of een los woord dat in twee talen toevallig gelijk
 * is ("Bonus", "Darijaforkids") bewijst niets. Veertien letters is lang genoeg
 * dat toeval onwaarschijnlijk wordt en kort genoeg dat een echte zin eronder
 * valt.
 */
const telt = (v: string): boolean =>
  v.replace(/[^a-zA-Z]/g, '').length >= 14 && !/^[\d\s€%·/|—–-]+$/.test(v)

describe('de vijf andere talen', () => {
  it('kennen evenveel teksten als het Nederlands', () => {
    expect(basis.size).toBeGreaterThan(600)
    for (const [naam, taal] of [['fr', fr], ['de', de], ['es', es], ['it', italiaans], ['en', en]] as const) {
      expect(plat(taal).size, `${naam} heeft niet evenveel teksten`).toBe(basis.size)
    }
  })

  it.each([
    ['Frans', fr],
    ['Duits', de],
    ['Spaans', es],
    ['Italiaans', italiaans],
    ['Engels', en],
  ])('bevatten geen Nederlandse zin meer (%s)', (_naam, taal) => {
    const anders = plat(taal)
    const zelfde: string[] = []
    for (const [p, v] of basis) {
      if (anders.get(p) === v && telt(v)) zelfde.push(`${p}: "${v.slice(0, 48)}"`)
    }
    expect(zelfde, 'deze teksten staan er nog in het Nederlands').toEqual([])
  })
})

/**
 * Het pad is een weg geworden, en dit houdt hem bij zijn eigen taal.
 *
 * Het was een rij rondjes die om en om naar links en rechts schoven, met niets
 * ertussen: wat je zag was een lijst die scheef stond. Nu loopt er weg tussen
 * elke twee lessen, in twee kleuren — groen is wat achter je ligt.
 *
 * Die ene regel is waar deze test over gaat. Een pad waarvan de kleur iets
 * belooft dat niet waar is, is erger dan een pad zonder kleur: dan moet een
 * kind leren dat groen niets betekent. Twee keer stond er groen waar niemand
 * gelopen had — het beginstuk stond hard aan, en het eerste stuk van élke unit
 * ook — en dat is precies wat een volgende verbouwing weer per ongeluk invoert.
 *
 * De maten erbij, want de hele weg hangt eraan: `GAT` en `KNOOP` zijn vaste
 * pixels omdat de titel naast de knoop staat en de rijhoogte dus niet uit de
 * tekst volgt. Wordt dat teruggedraaid, dan sluit geen enkel stuk weg meer aan.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GAT, KNOOP, VERSPRING, verspring } from './Pad'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const pad = lees('./Pad.tsx')
const leren = lees('../pages/Learn.tsx')

describe('de maten waar de weg op staat', () => {
  it('zijn vaste pixels en geen rem', () => {
    expect(GAT).toBe(34)
    expect(KNOOP).toBe(68)
    // Een wortelletter van 24 maakt van `pt-9` 54 pixels terwijl de schuine
    // streep op 34 gerekend is, en dan hangt de weg los van de knoop.
    expect(pad).not.toMatch(/GAT = ['"]/)
  })

  /**
   * Nooit nul en nooit boven de veertig. Bij nul ligt de knoop in het midden en
   * houdt de titel aan weerszijden te weinig over voor het Duits; boven de
   * veertig duwt hij de titel aan de andere kant tegen de rand.
   */
  it('en de verspringing blijft tussen de 22 en de 40', () => {
    for (const v of VERSPRING) {
      expect(Math.abs(v)).toBeGreaterThanOrEqual(22)
      expect(Math.abs(v)).toBeLessThanOrEqual(40)
    }
    expect(VERSPRING).not.toContain(0)
  })

  it('en loopt rond, zodat elke les een plek heeft', () => {
    expect(verspring(0)).toBe(VERSPRING[0])
    expect(verspring(VERSPRING.length)).toBe(VERSPRING[0])
    expect(verspring(74)).toBe(VERSPRING[74 % VERSPRING.length])
  })
})

describe('groen is wat achter je ligt', () => {
  /** Stond hard op groen: op dag één was dat het enige groen op de bladzijde. */
  it('het beginstuk vraagt of er al iets gelopen is', () => {
    expect(pad).toContain('export function Begin({ gelopen }: { gelopen: boolean })')
    expect(pad).not.toMatch(/<Weg van=\{0\} naar=\{0\} gelopen hoogte/)
    expect(leren).toContain('<Begin gelopen={Object.keys(state.lessons).length > 0} />')
  })

  /** En het eerste stuk van een unit kijkt naar de unit ervóór. */
  it('en het eerste stuk van een unit ook', () => {
    expect(leren).not.toContain('kwamVan={i === 0 || isDone(')
    expect(leren).toContain('isDone(laatsteLes(UNITS[ui - 1]!).id, state)')
    /*
      `laatsteLes` en niet `.lessons.at(-1)`, wat hier eerst stond.
      `Array.prototype.at` bestaat pas vanaf Chrome 92, en `minSdkVersion` is
      24: op een Android 7 met een oude WebView valt de app dan om bij het
      openen van het leerpad. `bundelcheck.mjs` ving het vóór het uploaden;
      `oudewebview.test.ts` vangt het nu al tijdens het typen.
    */
    expect(leren).toContain('const laatsteLes = (unit: Unit): Lesson =>')
  })
})

describe('de ring om de plek waar je staat', () => {
  /**
   * De vaste ring draagt de betekenis en de hartslag is versiering. Eerst stond
   * het omgekeerd: in de gewone stand was er alléén de kloppende ring, die van
   * 0,75 naar 0 loopt — dus een bleke vlek die je alleen zag als je wist dat
   * hij er was.
   */
  it('staat er altijd, ook als er niets beweegt', () => {
    expect(leren).toContain('{!rustig && (')
    // De hartslag zit binnen de voorwaarde, de vaste ring erbuiten.
    const blok = leren.slice(leren.indexOf('{hier && ('), leren.indexOf('{hier && (') + 1200)
    expect(blok.indexOf('border-[var(--accent-600)]')).toBeLessThan(blok.indexOf('{!rustig &&'))
  })

  /**
   * 600 in het licht en 400 in het donker. Met 500 haalde saffraan — de kleur
   * waar iedereen mee begint — 2,07 op 1 tegen het papier, waar 3 de norm is
   * voor iets wat geen tekst is. Nagemeten in de browser: 3,07 en 11,19.
   */
  it('en in een tint die je ziet', () => {
    expect(leren).toContain('border-[var(--accent-600)] dark:border-[var(--accent-400)]')
    expect(leren).not.toContain('rounded-full border-4 border-[var(--accent-500)]')
  })
})

describe('de twee dingen die een meting omkeerde', () => {
  /**
   * De pil met de khatim staat op het donkere eind van het verloop van de unit.
   * Een donkere waas daarop zakte hruf — de eerste unit die een kind afrondt —
   * van 3,78 naar 3,03, waar 4,5 de norm is.
   */
  it('de pil bij 100% is wit en niet nacht', () => {
    const pil = leren.slice(leren.indexOf('<Khatim size={13} />') - 400, leren.indexOf('<Khatim size={13} />'))
    expect(pil).toContain('bg-white/30')
    expect(pil).not.toContain('bg-night-950/15')
  })

  /**
   * En de tegelvloer staat niet meer `fixed`. `App.tsx` wikkelt elke bladzijde
   * in een `motion.main` die van `y: 8` naar `0` gaat, en een transform maakt
   * van dat element het anker voor alles wat `fixed` staat — dan verspringt het
   * raster een halve tegel bij elke bladzijdewissel.
   */
  it('en de vloer hangt niet aan een transform', () => {
    expect(leren).toContain('className="zellige pointer-events-none absolute inset-0 -z-10 opacity-60"')
    expect(leren).not.toContain('zellige pointer-events-none fixed')
  })
})

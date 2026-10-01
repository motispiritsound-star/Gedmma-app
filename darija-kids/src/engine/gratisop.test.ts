/**
 * Wanneer de app zegt dat de gratis lessen op zijn.
 *
 * Dat is het enige moment waarop het scorescherm uit zichzelf over geld
 * begint, dus het moet op precies de goede les gebeuren: niet eerder, want
 * dan onderbreek je iemand die nog bezig is, en niet later, want dan loopt
 * hij zonder waarschuwing tegen een slotje aan.
 */
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { UNITS } from '../content/curriculum'
import { GRATIS_LESSEN, gratisDeelOp, getState, setState } from './store'

/** De gratis lessen in de volgorde van het pad, net als `store.ts` ze telt. */
const GRATIS = UNITS.flatMap((u) => u.lessons.slice(0, GRATIS_LESSEN[u.id] ?? 0))

/** Alsof deze lessen gedaan zijn, zonder de rest van de staat aan te raken. */
const gedaan = (ids: string[]) =>
  setState({ lessons: Object.fromEntries(ids.map((id) => [id, { score: 1, at: 0 }])) as never })

beforeEach(() => setState({ lessons: {} as never, unlocked: false }))

describe('de gratis lessen zijn op', () => {
  it('telt er vier: drie stukken alfabet en de eerste les groeten', () => {
    expect(GRATIS).toHaveLength(4)
    expect(GRATIS_LESSEN).toEqual({ hruf: 3, groeten: 1 })
  })

  it('zegt nee zolang er nog één gratis les open staat', () => {
    expect(gratisDeelOp(getState())).toBe(false)
    for (const les of GRATIS.slice(0, -1)) {
      gedaan(GRATIS.slice(0, GRATIS.indexOf(les) + 1).map((l) => l.id))
      expect(gratisDeelOp(getState()), les.id).toBe(false)
    }
  })

  it('zegt ja zodra de laatste gratis les gedaan is', () => {
    gedaan(GRATIS.map((l) => l.id))
    expect(gratisDeelOp(getState())).toBe(true)
  })

  /**
   * Wie betaald heeft, krijgt dit scherm nooit.
   *
   * Hij doet dezelfde vier lessen, en als dit op `unlocked` zou vergeten te
   * kijken, kreeg een betalende klant na les vier de mededeling dat hij moet
   * betalen. Dat is het soort fout dat een terugbetaling oplevert en een
   * beoordeling van één ster.
   */
  it('zegt nooit ja tegen iemand die al betaald heeft', () => {
    gedaan(GRATIS.map((l) => l.id))
    setState({ unlocked: true })
    expect(gratisDeelOp(getState())).toBe(false)
  })

  /**
   * Het telt lessen, geen dagen.
   *
   * De drie gratis dagen horen bij het abonnement en beginnen pas als iemand
   * dat afsluit. In het gratis deel loopt geen klok, en dat moet zo blijven:
   * een proefperiode die in de app wordt bijgehouden is met opnieuw
   * installeren te omzeilen, en hij jaagt iemand weg die er drie weken over
   * doet.
   */
  it('kijkt nergens naar een datum', () => {
    gedaan(GRATIS.map((l) => l.id))
    const vroeg = gratisDeelOp(getState())
    setState({ createdAt: 0 })
    expect(gratisDeelOp(getState())).toBe(vroeg)
  })
})

describe('het scorescherm', () => {
  const bron = readFileSync(new URL('../pages/LessonPlayer.tsx', import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')

  it('toont de mededeling alleen als de gratis lessen op zijn', () => {
    expect(bron).toContain('{gratisOp && (')
    expect(bron).toContain('t.lesson.gratisOpTitel')
  })

  /**
   * Als het pad op is, is "verder op pad" een knop naar een slotje. Dan hoort
   * de bovenste knop te doen wat de lezer nu wil — en de weg terug blijft
   * staan, want een scherm met één uitgang is geen scherm maar een fuik.
   */
  it('wisselt de knoppen om, maar houdt de weg terug', () => {
    expect(bron).toContain("? <Link to=\"/volledig\"")
    expect(bron.match(/t\.lesson\.verderOpPad/g)?.length).toBe(2)
  })
})

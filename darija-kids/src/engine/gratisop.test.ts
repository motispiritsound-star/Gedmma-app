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
import { FREE_LESSONS, GRATIS_LESSEN, GRATIS_LETTERS, GRATIS_WOORDEN, gratisDeelOp, getState, setState } from './store'
import { MIJLPALEN } from './delen'
import { TREDEN, tredeVan } from './tellen'

/** De gratis lessen in de volgorde van het pad, net als `store.ts` ze telt. */
const GRATIS = UNITS.flatMap((u) => u.lessons.slice(0, GRATIS_LESSEN[u.id] ?? 0))

/** Alsof deze lessen gedaan zijn, zonder de rest van de staat aan te raken. */
const gedaan = (ids: string[]) =>
  setState({ lessons: Object.fromEntries(ids.map((id) => [id, { score: 1, at: 0 }])) as never })

beforeEach(() => setState({ lessons: {} as never, unlocked: false }))

describe('de gratis lessen zijn op', () => {
  /*
   * Acht sinds 12 november, en het getal staat hier met opzet letterlijk.
   *
   * Dit is geen bewering over wat juist is maar een rem: het aantal gratis
   * lessen staat ook in winkelteksten in zes talen bij twee winkels, in de
   * licentieovereenkomst, op de review-schermafdrukken, in socialkaarten waar
   * het in de PNG gebakken zit en in de ingesproken tekst van de
   * reclamefilms. Geen daarvan verandert mee met een constante.
   *
   * Dus valt deze test om zodra iemand het getal verzet, met deze lijst in de
   * melding erbij. Zie het verslag van 12 november in docs/STAND.md voor wat
   * er dan allemaal langs moet.
   */
  it('telt er acht: drie stukken alfabet en de hele unit groeten', () => {
    expect(GRATIS).toHaveLength(8)
    expect(GRATIS_LESSEN).toEqual({ hruf: 3, groeten: 5 })
  })

  /*
   * En dit is waarom het er acht zijn en geen vier: de deelkaart.
   *
   * Met vier lessen waren er zeven woorden en was de eerste mijlpaal
   * onbereikbaar voor iedereen die niet betaalde -- de enige lus waarmee deze
   * app uit zichzelf groeit, stond achter de kassa. Zie
   * growth-audit/03-conversion-audit.md.
   */
  it('geeft genoeg woorden om de deelkaart te kunnen halen', () => {
    expect(GRATIS_WOORDEN.size).toBeGreaterThanOrEqual(MIJLPALEN[0])
    // Met speling, anders moet een kind alles beheersen voor één kaart.
    expect(GRATIS_WOORDEN.size - MIJLPALEN[0], 'te krap').toBeGreaterThanOrEqual(5)
  })

  /*
   * En dit is waarom `hruf` op drie van zijn acht lessen blijft staan: anders
   * zijn alle 28 letters gratis, wordt `letterOpSlot` permanent onwaar en
   * staat het hele alfabetscherm open. Zie de aantekening bij GRATIS_WOORDEN.
   */
  it('laat het alfabet voor een deel op slot staan', () => {
    expect(GRATIS_LETTERS.size).toBeLessThan(28)
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
   * Hij doet dezelfde lessen, en als dit op `unlocked` zou vergeten te
   * kijken, kreeg een betalende klant aan het eind van het gratis deel de
   * mededeling dat hij moet betalen. Dat is het soort fout dat een terugbetaling oplevert en een
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
    expect(bron).toContain('{gratisOp ? (')
    expect(bron).toContain('<Link to="/volledig" className="block">')
    expect(bron).toContain("{gratisOp && (\n            <Button variant=\"secondary\" className=\"w-full\" onClick={() => navigate('/leren')}>")
  })

  /**
   * Is het pad níet op, dan begint de bovenste knop meteen de volgende les.
   * Ook dan blijft de weg naar het pad eronder staan: een scherm met één
   * uitgang is geen scherm maar een fuik, en dat gold hier al.
   */
  it('houdt de weg naar het pad ook onder de volgende-lesknop', () => {
    expect(bron).toContain('{!gratisOp && volgende && (')
    expect(bron.match(/t\.lesson\.verderOpPad/g)?.length).toBe(3)
  })
})

/**
 * De trechtermeting moet de muur kunnen zien.
 *
 * `TREDEN` in engine/tellen.ts is een vaste lijst, en `tredeVan` vuurt alleen
 * op een exacte waarde. Staat het aantal gratis lessen daar niet in, dan wordt
 * de belangrijkste stap van de hele trechter -- hoeveel mensen komen tot waar
 * de vraag om geld staat -- nergens geteld. Stil, en pas te merken als je
 * weken later naar een lege kolom kijkt.
 *
 * Deze test bestaat omdat dat bij de wijziging van vier naar acht lessen
 * bijna gebeurde: acht stond niet in TREDEN.
 */
describe('de meting kent de muur', () => {
  it('heeft een trede op precies het aantal gratis lessen', () => {
    expect(TREDEN as readonly number[]).toContain(FREE_LESSONS)
    expect(tredeVan(FREE_LESSONS)).toBe(`les_af:${FREE_LESSONS}`)
  })
})

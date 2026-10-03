/**
 * De plank: zeventien units, zeventien diploma's, en een handtekening eronder.
 *
 * Wat hier vastligt is vooral wát een diploma anders maakt dan een insigne.
 * Een insigne komt eraan en is dan klaar; een diploma is pas af als er iemand
 * zijn naam onder heeft gezet. Dat betekent dat er een halve toestand bestaat
 * — uitgereikt en niet ondertekend — en dat die halve toestand nergens als een
 * fout of een achterstand mag gelden.
 *
 * Twee dingen zijn tijdens het bouwen écht misgegaan en staan hieronder met
 * naam en toenaam:
 *
 * 1. Het uitreiken hing alleen aan het eind van een les. Nagemeten met de
 *    opslag van iemand die zeven units af heeft: die kreeg een plank met
 *    zeventien lege vakken, en het eerste diploma zou pas komen bij de unit die
 *    hij daarná deed. `reikDiplomasUit` loopt nu alle units na en wordt ook bij
 *    het opstarten aangeroepen.
 * 2. De datum op zo'n ingehaald diploma was `Date.now()`. Dan staat er op
 *    zeven diploma's dezelfde datum: die van de dag waarop de app werd
 *    bijgewerkt. Het is nu de dag waarop de laatste les van die unit af was.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { UNITS } from '../content/curriculum'
import {
  aantalDiplomas, aantalOndertekend, diplomaVan, diplomasOpPlank, MAX_NAAM, MAX_WOORD,
  nieuweHandtekeningen, onderteken, ondertekenaars, plankGezien, plankVol, reikDiplomasUit,
  sindsLaatsteHandtekening, sterrenVanUnit, unitAf, wachtOpHandtekening,
} from './diploma'
import { getState, setState, today, type LessonRecord } from './store'

const leeg = () => setState({
  diplomas: {}, diplomaGezien: [], lessons: {}, daily: {},
})

beforeEach(leeg)

const UNIT = UNITS[0]!
const TWEEDE = UNITS[1]!

/** Een unit helemaal afronden, met een score en een tijdstip. */
const rond = (unitId: string, stars = 3, wanneer = Date.UTC(2026, 0, 10)): void => {
  const unit = UNITS.find((u) => u.id === unitId)!
  const uit: Record<string, LessonRecord> = { ...getState().lessons }
  for (const les of unit.lessons) uit[les.id] = { stars, runs: 1, bestScore: 1, lastDone: wanneer }
  setState({ lessons: uit })
}

describe('wanneer een diploma wordt uitgereikt', () => {
  it('niet zolang er nog één les van de unit open staat', () => {
    const unit = UNITS.find((u) => u.id === UNIT.id)!
    const uit: Record<string, LessonRecord> = {}
    for (const les of unit.lessons.slice(0, -1)) {
      uit[les.id] = { stars: 3, runs: 1, bestScore: 1, lastDone: 1 }
    }
    setState({ lessons: uit })
    expect(unitAf(UNIT.id)).toBe(false)
    expect(reikDiplomasUit()).toEqual([])
    expect(diplomaVan(UNIT.id)).toBeNull()
  })

  /** De toets is de laatste les van elke unit, en die telt mee. */
  it('wel zodra ook de toets af is', () => {
    rond(UNIT.id)
    expect(unitAf(UNIT.id)).toBe(true)
    expect(reikDiplomasUit()).toEqual([UNIT.id])
    expect(diplomaVan(UNIT.id)?.getekendOp).toBeNull()
    expect(diplomaVan(UNIT.id)?.door).toBe('')
  })

  /**
   * Twee keer aanroepen mag niets veranderen. `reikDiplomasUit` draait bij elke
   * start én na elke les, dus dit gebeurt tientallen keren per week — en als
   * het de datum zou verzetten, verschuift elk diploma naar vandaag.
   */
  it('en daarna niet nog een keer, met dezelfde datum', () => {
    rond(UNIT.id)
    reikDiplomasUit()
    const eerst = diplomaVan(UNIT.id)!
    expect(reikDiplomasUit()).toEqual([])
    expect(diplomaVan(UNIT.id)).toEqual(eerst)
  })

  /**
   * De fout uit de inleiding, punt 1. Een opslag met zeven afgeronde units
   * hoort zeven diploma's te krijgen, niet nul.
   */
  it('haalt een bestaande opslag in één keer in', () => {
    for (const unit of UNITS.slice(0, 7)) rond(unit.id)
    expect(reikDiplomasUit()).toHaveLength(7)
    expect(aantalDiplomas()).toBe(7)
  })

  /** En punt 2: de datum is die van de laatste les, niet van vandaag. */
  it('zet de datum van de laatste les erop en niet die van vandaag', () => {
    const toen = Date.UTC(2025, 4, 3)
    rond(UNIT.id, 3, toen)
    reikDiplomasUit()
    expect(diplomaVan(UNIT.id)?.op).toBe(toen)
  })

  it('zet de diploma’s in de volgorde van het leerpad', () => {
    rond(TWEEDE.id)
    reikDiplomasUit()
    rond(UNIT.id)
    reikDiplomasUit()
    expect(diplomasOpPlank().map((d) => d.unitId)).toEqual([UNIT.id, TWEEDE.id])
  })

  it('is vol bij alle units en niet eerder', () => {
    for (const unit of UNITS.slice(0, -1)) rond(unit.id)
    reikDiplomasUit()
    expect(plankVol()).toBe(false)
    rond(UNITS[UNITS.length - 1]!.id)
    reikDiplomasUit()
    expect(plankVol()).toBe(true)
    expect(aantalDiplomas()).toBe(UNITS.length)
  })
})

describe('de khatims op een diploma', () => {
  it('telt drie per les en kijkt naar wat er nu staat', () => {
    rond(UNIT.id, 2)
    reikDiplomasUit()
    expect(sterrenVanUnit(UNIT.id)).toEqual({
      gehaald: UNIT.lessons.length * 2,
      max: UNIT.lessons.length * 3,
    })
  })

  /**
   * Een les overdoen en van twee naar drie sterren gaan hoort op het diploma
   * terug te komen. Daarom staat het aantal er niet in opgeslagen: een
   * bewaarde telling zou voor altijd de oude stand houden.
   */
  it('gaat mee omhoog als een les wordt overgedaan', () => {
    rond(UNIT.id, 2)
    reikDiplomasUit()
    rond(UNIT.id, 3)
    expect(sterrenVanUnit(UNIT.id).gehaald).toBe(UNIT.lessons.length * 3)
  })
})

describe('de handtekening', () => {
  beforeEach(() => { rond(UNIT.id); reikDiplomasUit() })

  it('vraagt een naam en weigert een lege', () => {
    expect(onderteken(UNIT.id, '   ')).toBe(false)
    expect(diplomaVan(UNIT.id)?.getekendOp).toBeNull()
    expect(onderteken(UNIT.id, 'mama')).toBe(true)
    expect(diplomaVan(UNIT.id)?.door).toBe('mama')
    expect(diplomaVan(UNIT.id)?.getekendOp).toBeGreaterThan(0)
  })

  /** Een compliment is welkom en niet verplicht: een naam eronder is al iets. */
  it('mag zonder compliment', () => {
    expect(onderteken(UNIT.id, 'baba')).toBe(true)
    expect(diplomaVan(UNIT.id)?.woord).toBe('')
  })

  it('bewaart het compliment zoals het getypt is', () => {
    onderteken(UNIT.id, ' mama ', '  Ik ben trots op je.  ')
    expect(diplomaVan(UNIT.id)?.door).toBe('mama')
    expect(diplomaVan(UNIT.id)?.woord).toBe('Ik ben trots op je.')
  })

  /**
   * De grenzen zijn er voor het papier: langer past niet onder de streep op een
   * vel van 210mm. Afkappen en niet weigeren — een veld dat je niet verder laat
   * typen is zichtbaar, een weigering achteraf niet.
   */
  it('kapt een te lange naam en een te lang compliment af', () => {
    onderteken(UNIT.id, 'x'.repeat(80), 'y'.repeat(400))
    expect(diplomaVan(UNIT.id)?.door).toHaveLength(MAX_NAAM)
    expect(diplomaVan(UNIT.id)?.woord).toHaveLength(MAX_WOORD)
  })

  /** Een typefout in "baba" moet te herstellen zijn. */
  it('mag opnieuw, en zet dan ook de datum opnieuw', () => {
    onderteken(UNIT.id, 'bba', 'eerste')
    const eerst = diplomaVan(UNIT.id)!.getekendOp!
    onderteken(UNIT.id, 'baba', 'tweede')
    expect(diplomaVan(UNIT.id)?.door).toBe('baba')
    expect(diplomaVan(UNIT.id)?.woord).toBe('tweede')
    expect(diplomaVan(UNIT.id)!.getekendOp!).toBeGreaterThanOrEqual(eerst)
  })

  it('kan niet op een unit zonder diploma', () => {
    expect(onderteken(TWEEDE.id, 'mama')).toBe(false)
    expect(onderteken('bestaat-niet', 'mama')).toBe(false)
  })

  it('houdt bij wat er nog op een handtekening wacht', () => {
    rond(TWEEDE.id)
    reikDiplomasUit()
    expect(wachtOpHandtekening()).toEqual([UNIT.id, TWEEDE.id])
    onderteken(UNIT.id, 'mama')
    expect(wachtOpHandtekening()).toEqual([TWEEDE.id])
    expect(aantalOndertekend()).toBe(1)
  })
})

describe('wie er ondertekend hebben', () => {
  /**
   * Dit is waarom de plank een plank is en niet een rij vinkjes: aan het eind
   * staat er wie erbij zaten. "Mama 9× · baba 6×" is een ander soort uitslag
   * dan een percentage.
   */
  it('telt per persoon en zet de meeste vooraan', () => {
    for (const unit of UNITS.slice(0, 4)) rond(unit.id)
    reikDiplomasUit()
    onderteken(UNITS[0]!.id, 'mama')
    onderteken(UNITS[1]!.id, 'mama')
    onderteken(UNITS[2]!.id, 'mama')
    onderteken(UNITS[3]!.id, 'baba')
    expect(ondertekenaars()).toEqual([
      { naam: 'mama', aantal: 3 },
      { naam: 'baba', aantal: 1 },
    ])
  })

  /** "Mama" en "mama" is één persoon; wat er op het scherm komt is de laatste vorm. */
  it('ziet Mama en mama als dezelfde persoon', () => {
    rond(UNITS[0]!.id)
    rond(UNITS[1]!.id)
    reikDiplomasUit()
    onderteken(UNITS[0]!.id, 'Mama')
    onderteken(UNITS[1]!.id, 'mama')
    expect(ondertekenaars()).toEqual([{ naam: 'mama', aantal: 2 }])
  })

  it('noemt niemand zolang er niets ondertekend is', () => {
    rond(UNIT.id)
    reikDiplomasUit()
    expect(ondertekenaars()).toEqual([])
  })
})

describe('wat het kind nog niet gezien heeft', () => {
  /**
   * Het enige wat de app zelf over een handtekening zegt, is een pilletje
   * "nieuw" op de kaart naar de plank. Geen melding: een ouder die 's avonds
   * ondertekent hoort zijn kind niet te laten schrikken, en richtlijn 4.2 van
   * Apple noemt een melding die iets aanprijst met naam en toenaam.
   */
  it('noemt een nieuwe handtekening tot de plank bekeken is', () => {
    rond(UNIT.id)
    reikDiplomasUit()
    expect(nieuweHandtekeningen()).toEqual([])
    onderteken(UNIT.id, 'mama')
    expect(nieuweHandtekeningen()).toEqual([UNIT.id])
    plankGezien()
    expect(nieuweHandtekeningen()).toEqual([])
  })

  /** Een tweede handtekening is weer nieuws, ook op een vak dat al gezien is. */
  it('ziet een tweede handtekening op een ander vak ook', () => {
    rond(UNIT.id)
    rond(TWEEDE.id)
    reikDiplomasUit()
    onderteken(UNIT.id, 'mama')
    plankGezien()
    onderteken(TWEEDE.id, 'baba')
    expect(nieuweHandtekeningen()).toEqual([TWEEDE.id])
  })

  it('een uitgereikt maar niet ondertekend diploma is geen nieuws', () => {
    rond(UNIT.id)
    reikDiplomasUit()
    plankGezien()
    expect(getState().diplomaGezien).toEqual([])
  })
})

describe('wat er sinds de vorige handtekening gebeurd is', () => {
  /**
   * Dit zijn de getallen die een ouder ziet in het paneel waarin hij
   * ondertekent — de enige plek waar de app hem iets vertelt. Hij staat daar
   * en niet in een bericht: vier getallen op donderdagavond wil niemand.
   */
  it('rekent vanaf het begin als er nog nooit ondertekend is', () => {
    setState({
      lessons: {
        a: { stars: 3, runs: 1, bestScore: 1, lastDone: 1000 },
        b: { stars: 3, runs: 1, bestScore: 1, lastDone: 2000 },
      },
      daily: { '2026-01-01': 30, '2026-01-02': 0, '2026-01-03': 12 },
    })
    const uit = sindsLaatsteHandtekening()
    expect(uit.vanaf).toBeNull()
    expect(uit.lessen).toBe(2)
    // De dag met nul XP telt niet als een dag waarop er geoefend is.
    expect(uit.dagen).toBe(2)
    expect(uit.xp).toBe(42)
  })

  it('laat weg wat voor de vorige handtekening gebeurde', () => {
    rond(UNIT.id, 3, 1000)
    reikDiplomasUit()
    onderteken(UNIT.id, 'mama')
    const op = diplomaVan(UNIT.id)!.getekendOp!
    setState({
      lessons: {
        oud: { stars: 3, runs: 1, bestScore: 1, lastDone: op - 10_000 },
        nieuw: { stars: 3, runs: 1, bestScore: 1, lastDone: op + 10_000 },
      },
      daily: { '2000-01-01': 99, [today(new Date(op))]: 25 },
    })
    const uit = sindsLaatsteHandtekening()
    expect(uit.vanaf).toBe(op)
    expect(uit.lessen).toBe(1)
    expect(uit.dagen).toBe(1)
    expect(uit.xp).toBe(25)
  })
})

describe('een opslag van voor deze versie', () => {
  /**
   * `Object.keys(undefined)` werpt, en dat gebeurde op de plank zelf. Precies
   * de fout die `daily`, `cards`, `lessons` en `extraCards` eerder vier keer
   * hebben gemaakt — daarom staat dit veld in dezelfde lijst in `hydrate`.
   */
  it('krijgt een lege plank in plaats van undefined', async () => {
    const { hydrate } = await import('./store')
    const uit = hydrate({ xp: 10 })
    expect(uit.diplomas).toEqual({})
    expect(uit.diplomaGezien).toEqual([])
  })

  it('en een kapotte plank valt terug op leeg zonder de rest mee te nemen', async () => {
    const { hydrate } = await import('./store')
    const uit = hydrate({ xp: 10, diplomas: null as never, diplomaGezien: 'nee' as never })
    expect(uit.diplomas).toEqual({})
    expect(uit.diplomaGezien).toEqual([])
    expect(uit.xp).toBe(10)
  })
})

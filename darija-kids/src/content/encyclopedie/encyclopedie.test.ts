/**
 * De belofte van Marokko 360°, vastgezet.
 *
 * De reeks belooft iets wat de geschiedeniskaarten in `history.ts` niet
 * beloven: elke feitelijke bewering hangt aan een bron die iemand gelezen
 * heeft. Dat is een belofte die je niet aan goede wil kunt overlaten — er
 * komen vijftien delen in zes talen achteraan, en er staat altijd iets half.
 *
 * Deze test is de rem. Hij controleert twee dingen die niet door elkaar mogen
 * lopen: dat de regel klopt (gegeven een hoofdstuk, zegt hij het juiste), en
 * dat de inhoud die er nu staat zich eraan houdt.
 *
 * Dat het proefhoofdstuk op dit moment *niet* publiceerbaar is, is geen fout
 * die weggewerkt moet worden. Het is wat er hoort te gebeuren als niemand de
 * bronnen heeft kunnen openen, en deze test legt dat vast zodat het opvalt
 * wanneer iemand die stand verandert zonder de bronnen te lezen.
 */
import { describe, expect, it } from 'vitest'
import {
  BRONNEN, DELEN, HOOFDSTUKKEN, bronVan, bronnenstand, conceptHoofdstukken, deelVan,
  feiten, publiceerbaar, publiekeHoofdstukken, waaromNietPubliceerbaar,
} from '.'
import type { Hoofdstuk } from './types'
import { LANG_CODES } from '../../i18n/languages'

/** Een hoofdstuk dat aan alles voldoet, om de regel zelf mee te toetsen. */
const gaaf = (): Hoofdstuk => ({
  id: 'proef', deel: 'm1', titel: 'Proef', kort: 'Proef', stand: 'gepubliceerd',
  plaatsTijd: 'nergens, nooit',
  blokken: [{ soort: 'feit', tekst: 'Iets.', bronnen: ['proefbron'], zekerheid: 'vast' }],
  tijdlijn: [{ id: 'p1', wat: 'Iets', jaar: 1, wanneer: '1', zekerheid: 'vast', bronnen: ['proefbron'] }],
  plaatsen: [], personen: [], zekerEnOnzeker: ['Niets.'], verder: [], talen: ['nl'],
})

/* `proefbron` bestaat niet in het register; dat is precies wat eis 2 vangt. */

describe('de regel', () => {
  it('eist een bron bij elk feitelijk blok', () => {
    const h = gaaf()
    h.blokken = [{ soort: 'feit', tekst: 'Iets.', bronnen: [], zekerheid: 'vast' }]
    expect(waaromNietPubliceerbaar(h)).toContain('blok 1: geen bron')
  })

  it('en een bron die werkelijk in het register staat', () => {
    expect(waaromNietPubliceerbaar(gaaf())).toContain('blok 1: bron "proefbron" staat niet in het register')
  })

  /**
   * De eis die er het meest toe doet: een bron waarvan alleen de URL bekend is,
   * draagt niets.
   *
   * Deze toets pakte eerst `unesco-836` als voorbeeld van een bron die nog niet
   * gelezen was. Op 5 oktober is die bron gelezen en viel de toets om — terwijl
   * er niets mis was. Een toets die een momentopname vastlegt, meldt vooruitgang
   * als een storing. Nu zoekt hij zelf een bron die nog op `gevonden` staat, en
   * als die er niet meer is, is dat geen fout maar het doel.
   */
  it('en minstens één bron die gelezen is, niet alleen gevonden', () => {
    const nogNiet = BRONNEN.find((b) => b.stand === 'gevonden')
    if (!nogNiet) {
      expect(bronnenstand().gevonden).toBe(0)
      return
    }
    const h = gaaf()
    h.blokken = [{ soort: 'feit', tekst: 'Iets.', bronnen: [nogNiet.id], zekerheid: 'vast' }]
    h.tijdlijn = []
    expect(waaromNietPubliceerbaar(h).join(' ')).toContain('geen van de bronnen is gelezen')
  })

  it('en bij een betwiste bewering: waarover de discussie gaat', () => {
    const h = gaaf()
    h.blokken = [{ soort: 'feit', tekst: 'Iets.', bronnen: ['unesco-836'], zekerheid: 'betwist' }]
    h.tijdlijn = []
    expect(waaromNietPubliceerbaar(h)).toContain('blok 1: betwist, maar zonder uitleg waarover')
  })

  /** Een jaartal is een bewering. De tijdlijn staat onder dezelfde regels. */
  it('en de tijdlijn telt mee', () => {
    const h = gaaf()
    h.blokken = []
    h.tijdlijn = [{ id: 'p1', wat: 'Iets', jaar: 1, wanneer: '1', zekerheid: 'vast', bronnen: [] }]
    expect(waaromNietPubliceerbaar(h)).toContain('tijdlijn "p1": geen bron')
  })

  it('en "wat weten we zeker" mag niet ontbreken', () => {
    const h = gaaf()
    h.zekerEnOnzeker = []
    expect(waaromNietPubliceerbaar(h)).toContain('geen "wat weten we zeker en waarover bestaat discussie"')
  })

  /**
   * De stand van het hoofdstuk is een tweede slot naast de bronnen. Een
   * hoofdstuk waarvan de bronnen toevallig allemaal gelezen zijn, is daarmee
   * nog niet nagekeken.
   */
  it('en de stand van het hoofdstuk is een eigen slot', () => {
    const h = gaaf()
    h.stand = 'controle'
    expect(publiceerbaar(h)).toBe(false)
  })
})

describe('wat er nu staat', () => {
  /**
   * Niet meer "nul bronnen gelezen", want dat was een momentopname en die is
   * sinds 5 oktober onwaar: het dossier van UNESCO en de projectsite van UCL
   * zijn ingezien. Wat hier hoort te staan is de regel, en die luidt: zolang er
   * één klacht openstaat, komt er niets op de openbare site.
   */
  it('zolang er een klacht openstaat, is een hoofdstuk niet publiceerbaar', () => {
    for (const h of HOOFDSTUKKEN) {
      const open = waaromNietPubliceerbaar(h).length > 0
      expect(publiceerbaar(h), h.id).toBe(!open && h.stand === 'gepubliceerd')
    }
    expect(conceptHoofdstukken().length + HOOFDSTUKKEN.filter(publiceerbaar).length)
      .toBe(HOOFDSTUKKEN.length)
  })

  it('en de openbare site krijgt in geen enkele taal een hoofdstuk', () => {
    for (const lang of LANG_CODES) {
      expect(publiekeHoofdstukken(lang), lang).toEqual([])
    }
  })

  /** Het proefhoofdstuk is wél al helemaal opgebouwd; alleen het lezen mist. */
  it('maar het proefhoofdstuk mist alleen het nalezen', () => {
    const walili = HOOFDSTUKKEN.find((h) => h.id === 'walili')!
    const klachten = waaromNietPubliceerbaar(walili)
    expect(klachten.length).toBeGreaterThan(0)
    // Elke klacht gaat over het lezen, niet over een ontbrekende of onbekende bron.
    for (const k of klachten) expect(k).toContain('geen van de bronnen is gelezen')
  })
})

describe('het register', () => {
  it('heeft geen twee bronnen met hetzelfde id', () => {
    expect(new Set(BRONNEN.map((b) => b.id)).size).toBe(BRONNEN.length)
  })

  /**
   * Een bron zonder beperking bestaat niet. Een erfgoeddossier zegt wat
   * beschermd is, niet wat vaststaat; een opgravingsverslag uit 1960 is iets
   * anders dan een synthese uit 2008. Die zin hoort bij de bron te staan.
   */
  it('en elke bron zegt wat zijn beperking is', () => {
    for (const b of BRONNEN) {
      expect(b.noot.length, b.id).toBeGreaterThan(40)
      expect(b.wie.length, b.id).toBeGreaterThan(2)
      expect(b.titel.length, b.id).toBeGreaterThan(2)
    }
  })

  /** Wie gelezen zegt, zegt ook wanneer. Anders is het een vinkje. */
  it('en een gelezen bron zegt wanneer hij gelezen is', () => {
    for (const b of BRONNEN.filter((x) => x.stand === 'gelezen')) {
      expect(b.gelezenOp, b.id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(b.plek, `${b.id}: waar in de bron staat het?`).toBeTruthy()
    }
  })

  it('en elke bron waar een hoofdstuk naar wijst, bestaat', () => {
    for (const h of HOOFDSTUKKEN) {
      const ids = [...feiten(h).flatMap((b) => b.bronnen), ...h.tijdlijn.flatMap((m) => m.bronnen)]
      for (const id of ids) expect(bronVan(id), `${h.id} -> ${id}`).toBeTruthy()
    }
  })
})

describe('de delen', () => {
  it('zijn vijftien voor Marokko en twee voor al-Andalus', () => {
    expect(DELEN.filter((d) => d.reeks === 'marokko')).toHaveLength(15)
    expect(DELEN.filter((d) => d.reeks === 'andalus')).toHaveLength(2)
  })

  it('en hebben doorlopende nummers binnen hun reeks', () => {
    for (const reeks of ['marokko', 'andalus'] as const) {
      const nrs = DELEN.filter((d) => d.reeks === reeks).map((d) => d.nummer)
      expect(nrs).toEqual([...nrs].sort((a, b) => a - b))
      expect(new Set(nrs).size).toBe(nrs.length)
    }
  })

  /** Een deel zonder afbakening is een titel. `omvat` zegt waarom de grens daar ligt. */
  it('en zeggen alle zeventien waar hun grens ligt', () => {
    for (const d of DELEN) expect(d.omvat.length, d.id).toBeGreaterThan(80)
  })

  it('en elk hoofdstuk hoort bij een deel dat bestaat', () => {
    for (const h of HOOFDSTUKKEN) expect(deelVan(h.deel), h.id).toBeTruthy()
  })
})

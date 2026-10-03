/**
 * De boekenkast: drie reeksen, elk met een eigen bladzijde.
 *
 * Wat hier bewaakt wordt is niet de opmaak maar de belofte. Een reekspagina
 * zegt drie dingen die waar moeten zijn: dat de titels uit de boeken zelf
 * komen, dat er een knop staat als er iets te koop is en geen knop als er
 * niets te koop is, en dat de encyclopedie met zoveel woorden zegt dat er nog
 * niets van gepubliceerd is.
 *
 * Dat laatste is de enige test hier die over tekst gaat, en hij staat er
 * omdat de tekst een bewering doet over de stand van het werk. Zodra er wél
 * een hoofdstuk gepubliceerd is, valt deze test om — en dan hóórt de zin op de
 * bladzijde ook te veranderen.
 */
import { describe, expect, it } from 'vitest'
import { SITE } from './copy'
import { PATHS, reeksPad } from './links'
import { REEKSEN, reeksVan } from './reeksen'
import { SHOP } from './shop'
import { DELEN as BIEBTITELS } from './delen'
import { LANG_CODES } from '../i18n/languages'
import { REEKS as SLEUTELREEKS } from '../content/sleutels'
import { SLEUTEL_VERTALINGEN, sleutelflapIn } from '../content/sleutels-talen'
import { DELEN as PRENTENBOEKEN } from '../content/prentenboek'
import { VERTALINGEN, flapIn } from '../content/prentenboek-talen'
import { DELEN as ENCDELEN } from '../content/encyclopedie/delen'
import { DEEL_VERTALINGEN, encdeelIn } from '../content/encyclopedie/delen-talen'
import { HOOFDSTUKKEN, publiceerbaar } from '../content/encyclopedie'

describe('de reeksen in de kast', () => {
  it('heeft voor elke reeks een eigen, uniek adres', () => {
    const slugs = REEKSEN.map((r) => r.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/)
  })

  it('hangt elke reekspagina onder de boekenpagina van dezelfde taal', () => {
    for (const lang of LANG_CODES) {
      for (const plek of REEKSEN) {
        expect(reeksPad(lang, plek.slug)).toBe(`${PATHS[lang].books}/${plek.slug}`)
      }
    }
  })

  it('wijst alleen naar een winkelsleutel die bestaat', () => {
    for (const plek of REEKSEN) {
      if (plek.koop === null) continue
      expect(SHOP[plek.koop]).toBeDefined()
    }
  })

  it('kent de encyclopedie geen prijs toe', () => {
    expect(reeksVan('marokko360')?.koop).toBeNull()
  })
})

/**
 * De titels op een reekspagina komen uit de boeken en niet uit een lijst die
 * iemand heeft overgeschreven. `delen.ts` legt uit waarom: toen ze wel
 * overgeschreven stonden, liepen er achtenvijftig titels uit elkaar en beloofde
 * de winkel boeken die onder die naam niet bestaan.
 */
describe('de delen op een reekspagina', () => {
  it('leest de flaptekst van De sleutels uit de vertaling zelf', () => {
    for (const [taal, vertaling] of Object.entries(SLEUTEL_VERTALINGEN)) {
      for (const basis of SLEUTELREEKS) {
        const vertaald = vertaling[basis.nummer]
        if (!vertaald) continue
        const deel = sleutelflapIn(taal, basis)
        expect(deel.titel).toBe(vertaald.titel)
        expect(deel.flap).toBe(vertaald.flap)
        expect(deel.waar).toBe(vertaald.waar)
        expect(deel.verteller).toBe(vertaald.verteller)
        expect(deel.echt).toEqual(vertaald.echt)
        expect(deel.verzonnen).toEqual(vertaald.verzonnen)
      }
    }
  })

  it('leest de prentenboeken uit de vertaling zelf', () => {
    for (const [taal, vertaling] of Object.entries(VERTALINGEN)) {
      for (const basis of PRENTENBOEKEN) {
        const vertaald = vertaling[basis.nummer]
        if (!vertaald) continue
        const deel = flapIn(taal, basis.nummer)
        expect(deel.titel).toBe(vertaald.titel)
        expect(deel.waar).toBe(vertaald.waar)
        expect(deel.ondertitel).toBe(vertaald.ondertitel)
      }
    }
  })

  /**
   * Een deel dat in een taal nog niet vertaald is, valt terug op het
   * Nederlands. Zichtbaar onvertaald is beter dan onzichtbaar verkeerd — en
   * vooral: de bladzijde valt er niet van om.
   */
  it('valt terug op het Nederlands in plaats van om te vallen', () => {
    for (const lang of LANG_CODES) {
      expect(() => SLEUTELREEKS.map((d) => sleutelflapIn(lang, d))).not.toThrow()
      expect(() => PRENTENBOEKEN.map((d) => flapIn(lang, d.nummer))).not.toThrow()
      expect(BIEBTITELS[lang].sleutels).toHaveLength(SLEUTELREEKS.length)
      expect(BIEBTITELS[lang].sba).toHaveLength(PRENTENBOEKEN.length)
    }
  })
})

describe('wat de encyclopedie over zichzelf zegt', () => {
  /**
   * De bladzijde zegt: nog geen deel te koop, nog geen hoofdstuk open. Dat is
   * op dit moment waar, en deze test zegt waarom het waar is — geen enkel
   * hoofdstuk haalt `publiceerbaar`, want daarvoor moeten de bronnen eronder
   * gelezen zijn en dat is er nog niet van gekomen.
   */
  it('publiceert nog geen enkel hoofdstuk', () => {
    expect(HOOFDSTUKKEN.length).toBeGreaterThan(0)
    expect(HOOFDSTUKKEN.filter(publiceerbaar)).toHaveLength(0)
  })

  it('zegt dat in alle zes de talen', () => {
    for (const lang of LANG_CODES) {
      expect(SITE[lang].boek360Noot.length).toBeGreaterThan(40)
      expect(SITE[lang].boek360Punten).toHaveLength(3)
    }
  })

  /** Vijftien delen Marokko plus twee al-Andalus, en de kaart telt de eerste. */
  it('telt vijftien delen Marokko en twee al-Andalus', () => {
    expect(ENCDELEN.filter((d) => d.reeks === 'marokko')).toHaveLength(15)
    expect(ENCDELEN.filter((d) => d.reeks === 'andalus')).toHaveLength(2)
  })
})

/**
 * De indeling van de encyclopedie staat op de site in zes talen.
 *
 * Toen de reekspagina er net stond, las een Duitse bezoeker een Duitse
 * inleiding met daaronder zeventien Nederlandse deeltitels. Niet zichtbaar
 * onvertaald maar gewoon stuk — en de enige manier om dat tegen te houden is
 * te eisen dat elke taal alle delen heeft, niet bijna alle.
 */
describe('de indeling van de encyclopedie in zes talen', () => {
  const idsVanDeDelen = ENCDELEN.map((d) => d.id)

  it('heeft in elke taal alle zeventien delen', () => {
    for (const [taal, vertaling] of Object.entries(DEEL_VERTALINGEN)) {
      expect(Object.keys(vertaling).sort(), taal).toEqual([...idsVanDeDelen].sort())
    }
  })

  it('geeft de vertaalde titel en afbakening terug', () => {
    for (const [taal, vertaling] of Object.entries(DEEL_VERTALINGEN)) {
      for (const basis of ENCDELEN) {
        const deel = encdeelIn(taal, basis)
        expect(deel.titel).toBe(vertaling[basis.id]!.titel)
        expect(deel.omvat).toBe(vertaling[basis.id]!.omvat)
        expect(deel.omvat).not.toBe(basis.omvat)
      }
    }
  })

  /** Een thematisch deel heeft geen periode, en dat hoort in elke taal zo. */
  it('houdt dezelfde delen thematisch', () => {
    for (const [taal, vertaling] of Object.entries(DEEL_VERTALINGEN)) {
      for (const basis of ENCDELEN) {
        expect(Boolean(vertaling[basis.id]!.periode), `${taal} ${basis.id}`).toBe(Boolean(basis.periode))
      }
    }
  })

  it('valt terug op het Nederlands voor een taal die er niet is', () => {
    expect(encdeelIn('nl', ENCDELEN[0]!)).toEqual(ENCDELEN[0])
  })
})

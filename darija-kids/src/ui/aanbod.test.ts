/**
 * Het keuzescherm na de taalkeuze, vastgezet op wat het níét mag doen.
 *
 * Het is een paneel dat ongevraagd over de app heen komt en over geld gaat.
 * Dat is precies de vorm die bij Apple onder richtlijn 3.1.2 valt en bij een
 * kinderapp onder 1.3, dus staan hier de drie dingen die het scherm hoe dan
 * ook moet blijven doen.
 *
 * Eén keer gemeten is hier niet genoeg: dit bestand wordt ooit verplaatst,
 * hernoemd of "even opgeschoond", en dan is de vraag niet of de test groen te
 * krijgen is maar of de poort er nog staat.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

const bron = readFileSync(new URL('./Aanbod.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('het keuzescherm na de taalkeuze', () => {
  /**
   * Kopen gebeurt op `/volledig` en nergens anders.
   *
   * Daar staan de ouderpoort, de verplichte voorwaardentekst, de prijs uit de
   * winkel zelf en de knoppen om terug te zetten en op te zeggen. Een tweede
   * koopknop die dat overslaat is geen snelkoppeling maar een gat: een kind
   * dat op dit paneel stuit, komt dan zonder rekensom bij een abonnement.
   */
  it('koopt zelf niets en stuurt naar het scherm met de ouderpoort', () => {
    expect(bron).toContain("nav('/volledig')")
    expect(bron).not.toMatch(/\bsubscribe\s*\(/)
    expect(bron).not.toMatch(/\border\s*\(/)
  })

  /**
   * Vier voorwaarden, en alle vier om een eigen reden.
   *
   * `picked` — niet vóór de taalkeuze, anders staat er een paneel in een taal
   * die de lezer misschien niet spreekt. `gezien` — één keer vragen is vragen,
   * twee keer is zeuren. `unlocked` — wie al betaalt, hoeft niets te kopen.
   * `billingAvailable()` — op de website is er niets te koop, en een knop naar
   * een abonnement dat je er niet kunt afsluiten is erger dan geen knop.
   */
  it('verschijnt alleen als alle vier de voorwaarden kloppen', () => {
    const regel = bron.match(/if \(!picked.*return null/)?.[0] ?? ''
    for (const voorwaarde of ['!picked', 'gezien', 'unlocked', '!billingAvailable()']) {
      expect(regel).toContain(voorwaarde)
    }
  })

  /**
   * Allebei de knoppen onthouden dat er geantwoord is.
   *
   * Vergeet de tweede dat, dan komt het paneel bij elke start terug voor
   * precies de persoon die "nee" zei. Dat is de vorm waar een beoordelaar
   * een app op afwijst en een ouder hem op verwijdert.
   */
  it('zet aanbodGezien, langs welke knop je ook weggaat', () => {
    expect(bron).toContain('aanbodGezien: true')
    // Twee knoppen, allebei via dezelfde sluit() -- dus twee aanroepen.
    expect(bron.match(/sluit\(\)/g)?.length).toBe(2)
  })

  /**
   * De tweede knop is een knop en geen weggemoffeld linkje.
   *
   * Een keuze die je kleiner maakt dan de andere is geen keuze. Hier staat
   * daarom geen `<a>` en geen klein grijs tekstje maar een `<button>` die net
   * als de eerste de volle breedte heeft.
   */
  it('geeft de afslag dezelfde breedte als de koopknop', () => {
    expect(bron).toMatch(/<button[\s\S]*?className="[^"]*w-full/)
  })
})

describe('de teksten van het keuzescherm', () => {
  it('staan in alle zes de talen en zeggen niet twee keer hetzelfde', () => {
    for (const taal of LANG_CODES) {
      const a = STRINGS[taal].aanbod
      expect(a.titel.length, taal).toBeGreaterThan(4)
      expect(a.knop.length, taal).toBeGreaterThan(4)
      expect(a.later(4).length, taal).toBeGreaterThan(4)
      expect(a.knop, taal).not.toBe(a.later(4))
      expect(a.body(3, '€ 5,00'), taal).toContain('3')
      expect(a.body(3, '€ 5,00'), taal).toContain('€ 5,00')
    }
  })

  /**
   * Het welkomscherm moet niet zeggen dat de app na drie dagen stopt.
   *
   * Die zin stond er wel — "je begint gratis, na 3 dagen kost de cursus …" —
   * en hij las als een proefperiode die bij de installatie begint. Dat is niet
   * wat er gebeurt: de gratis lessen verlopen nooit, en de drie dagen horen bij
   * het abonnement en beginnen pas als iemand dat afsluit. De zin heeft die
   * verwarring aantoonbaar veroorzaakt, dus staat hij hier vast.
   */
  it('laten het welkomscherm de proef aan het abonnement hangen', () => {
    for (const taal of LANG_CODES) {
      expect(STRINGS[taal].welcome.gratisDeel(4), taal).toContain('4')
      expect(STRINGS[taal].welcome.plan(3, '€ 5,00'), taal).toContain('3')
    }
  })
})

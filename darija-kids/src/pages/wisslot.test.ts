/**
 * Het slot voor "Alles wissen".
 *
 * Dit was de enige deur van dit soort zonder slot, en dat viel pas op toen
 * iemand de vier ouderschermen naast elkaar legde: een abonnement kopen
 * vraagt om een volwassene, een mailadres achterlaten ook, de app uit gaan
 * ook — maar álles weggooien waren twee tikken. De knop in Instellingen, en
 * dan "Ja" in het venster. Een kind dat op onderzoek is in Instellingen komt
 * daar even makkelijk langs als overal elders, en dan is de voortgang van
 * maanden weg zonder dat er iemand bij was.
 *
 * Een bevestigingsvenster is geen poort. Het vraagt of je het zeker weet, en
 * daar is "ja" het antwoord van wie de knop net indrukte. De poort vraagt iets
 * anders: wie ben je. Dat zijn twee vragen, en ze staan nu allebei.
 *
 * Wat hier vastligt is dat ze in die volgorde staan. Eerst de som, dan de
 * bevestiging — niet omgekeerd, want een venster dat eerst "Weet je het
 * zeker?" vraagt en daarna de som, heeft de bevestiging al binnen voordat er
 * een volwassene langs was.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

const bron = readFileSync(new URL('./Settings.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('wissen vraagt eerst om een volwassene', () => {
  it('de knop opent de poort, niet het venster', () => {
    expect(bron).toContain('onClick={() => (poortAl() ? setConfirmReset(true) : setWisPoort(true))}')
    // En nergens meer de oude, rechtstreekse weg.
    expect(bron).not.toContain('onClick={() => setConfirmReset(true)}')
  })

  it('en de poort staat er met de eigen reden', () => {
    expect(bron).toContain('<OuderPoort')
    expect(bron).toContain('reden="wissen"')
    expect(bron).toContain("import { OuderPoort, poortAl } from '../ui/OuderPoort'")
  })

  /**
   * De bevestiging komt pas als de som goed is. Dat is de hele volgorde, en
   * het is de enige weg die `confirmReset` nog aanzet.
   */
  it('en zet het venster pas open als de som goed is', () => {
    expect(bron).toContain('onGoed={() => { setWisPoort(false); setConfirmReset(true) }}')
    expect(bron.match(/setConfirmReset\(true\)/g) ?? []).toHaveLength(2)
  })

  /**
   * `poortAl()` erbij, zoals bij de andere drie deuren: wie deze keer al een
   * som gemaakt heeft, krijgt hem niet opnieuw. Een poort die tien keer op een
   * avond komt, wordt een poort waar men blind langs klikt.
   */
  it('maar niet twee keer in dezelfde sessie', () => {
    expect(bron).toContain('poortAl()')
  })
})

describe('de zin boven de som', () => {
  it('staat in alle zes de talen', () => {
    for (const code of LANG_CODES) {
      const zin = STRINGS[code].unlock.poortBodyWissen('3 × 4')
      expect(zin, code).toContain('3 × 4')
      expect(zin.length, code).toBeGreaterThan(20)
    }
  })

  /**
   * En zegt waar het over gaat. Een poort die "abonnement" zegt vóór een
   * wisknop leert een ouder om langs de woorden te klikken, en dan bewaakt hij
   * niets meer — dezelfde reden waarom er vijf zinnen zijn in plaats van één.
   */
  it('en is niet dezelfde als die voor geld of mail', () => {
    for (const code of LANG_CODES) {
      const t = STRINGS[code].unlock
      expect(t.poortBodyWissen('3 × 4'), code).not.toBe(t.poortBody('3 × 4'))
      expect(t.poortBodyWissen('3 × 4'), code).not.toBe(t.poortBodyPost('3 × 4'))
    }
  })
})

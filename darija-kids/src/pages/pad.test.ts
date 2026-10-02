/**
 * Het leerpad moet te overzien zijn als je er een eind in zit.
 *
 * Nagemeten met een profiel van veertig afgeronde lessen, de stand van iemand
 * die twee derde van de cursus heeft gedaan: het pad was 10 560px hoog en de
 * volgende les stond op y=8285. Dat is 7 885px scrollen — tien schermen — om
 * te zien waar je bent. Elke sessie opnieuw, en de knop bovenaan zei alleen
 * "Ga verder" zonder te zeggen waarheen.
 *
 * Twee reparaties, allebei hieronder vastgelegd:
 *
 * 1. Een unit die helemaal af is klapt dicht. De kop blijft staan met de
 *    voortgangsbalk, 100% en het aantal lessen; één tik opent hem weer.
 *    Units die bezig of nog dicht zijn blijven open — daar wil je juist zien
 *    wat eraan komt.
 * 2. De kaart bovenaan noemt de les waar "Ga verder" naartoe gaat, met de
 *    unit erachter. Dan weet je waar je bent zonder te scrollen.
 *
 * Gemeten na afloop: 5 056px hoog (−52%), volgende les op y=2781 (−66%),
 * 2 381px scrollen (−70%).
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const bron = readFileSync(new URL('./Learn.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
/** Zonder commentaar, anders toetst een test zijn eigen toelichting. */
const code = bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

describe('een afgeronde unit klapt dicht', () => {
  it('de kop van een vrijgespeelde unit is een echte knop', () => {
    expect(code).toMatch(/<button[^>]*type="button"[^>]*aria-expanded=/)
  })

  /**
   * `toont` is de hele regel: open tenzij de unit af is, en wat de gebruiker
   * daarna zelf koos wint. Zonder de `?? !af` zou een unit die je nooit hebt
   * aangeraakt dichtvallen zodra je hem afmaakt, midden in je sessie.
   */
  it('af = dicht, bezig = open, en de eigen keuze gaat voor', () => {
    expect(code).toMatch(/geopend\[id\]\s*\?\?\s*!af/)
  })

  it('de lessen van een dichte unit staan niet in de pagina', () => {
    expect(code).toMatch(/\{open && uit \? \(/)
  })

  /** Een dichte unit moet nog steeds zeggen hoeveel erin zit. */
  it('een dichte unit toont zijn aantal lessen', () => {
    expect(code).toMatch(/t\.landing\.lessenAantal\(unit\.lessons\.length\)/)
  })
})

describe('de kaart bovenaan zegt waar "Ga verder" naartoe gaat', () => {
  it('zoekt de unit en de les die bij `next` horen', () => {
    expect(code).toMatch(/const volgendeUnit = UNITS\.find\(/)
    expect(code).toMatch(/const volgendeLes = volgendeUnit\?\.lessons\.find\(/)
  })

  it('zet de lestitel en de unit op het scherm', () => {
    expect(code).toMatch(/lessonTitle\(volgendeLes, lang\)/)
    expect(code).toMatch(/volgendeUnit\.title/)
  })

  /**
   * Beide kunnen `undefined` zijn — een lesnummer uit een oud opgeslagen
   * profiel dat niet meer in het curriculum staat, bijvoorbeeld. Dan hoort
   * er niets te staan, geen lege regel met een bolletje.
   */
  it('valt stil als de les niet gevonden wordt', () => {
    expect(code).toMatch(/volgendeUnit\s*&&\s*volgendeLes\s*&&/)
  })
})

// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { maakSom } from './Ouderpoort'

const WORTEL = join(import.meta.dirname, '..', '..')

const bestanden = (map: string): string[] => {
  const uit: string[] = []
  const loop = (pad: string) => {
    for (const naam of readdirSync(pad)) {
      if (naam.startsWith('.') || naam === 'node_modules') continue
      const vol = join(pad, naam)
      if (statSync(vol).isDirectory()) loop(vol)
      else if (/\.tsx?$/.test(naam) && !/\.test\.tsx?$/.test(naam)) uit.push(vol)
    }
  }
  loop(join(WORTEL, map))
  return uit
}

describe('de som van de ouderpoort', () => {
  it('is te zwaar voor hoofdrekenen op zevenjarige leeftijd', () => {
    for (let i = 0; i < 200; i++) {
      const { a, b, antwoord } = maakSom()
      expect(a).toBeGreaterThanOrEqual(6)
      expect(b).toBeGreaterThanOrEqual(6)
      expect(a * b).toBe(antwoord)
      expect(antwoord).toBeGreaterThanOrEqual(36)
    }
  })

  it('is niet altijd dezelfde, dus niet te onthouden', () => {
    const uitkomsten = new Set(Array.from({ length: 200 }, () => maakSom().antwoord))
    expect(uitkomsten.size).toBeGreaterThan(3)
  })
})

describe('wat er achter de poort hoort te zitten', () => {
  /**
   * Niet door de schermen heen klikken maar door de code kijken: elk scherm
   * dat geld of privacy raakt, moet `<Ouderpoort>` gebruiken. Dat is een
   * controle die niet kapotgaat als de knoppen verplaatsen.
   */
  const metPoort = ['Ouders.tsx', 'Abonnement.tsx']

  it('zet de ouderpoort om het ouderoverzicht en om het abonnementsscherm', () => {
    for (const naam of metPoort) {
      const inhoud = readFileSync(join(WORTEL, 'src', 'pages', naam), 'utf8')
      expect(inhoud, `${naam} mist de ouderpoort`).toContain('<Ouderpoort>')
    }
  })

  it('legt nergens buiten de poort een koop vast', () => {
    for (const bestand of bestanden('src')) {
      if (bestand.endsWith('Abonnement.tsx') || bestand.endsWith('abonnement.ts')) continue
      expect(readFileSync(bestand, 'utf8'), bestand).not.toContain('legKoopVast(')
    }
  })

  it('wist nergens buiten de poort gegevens', () => {
    for (const bestand of bestanden('src')) {
      if (bestand.endsWith('Ouders.tsx') || bestand.endsWith('opslag.ts')) continue
      expect(readFileSync(bestand, 'utf8'), bestand).not.toContain('wisAlles(')
    }
  })

  it('heeft geen enkele link naar buiten in het deel van het kind', () => {
    // Winkel-, website- en mailadressen horen achter de poort. In het deel van
    // het kind hoort geen enkele uitgaande link te staan, en voorlopig is dat
    // makkelijk: de app heeft nog geen domein (MERK.domein is leeg).
    for (const bestand of bestanden('src/pages')) {
      if (metPoort.some((n) => bestand.endsWith(n))) continue
      const inhoud = readFileSync(bestand, 'utf8')
      expect(inhoud, `${bestand} opent iets buiten de app`).not.toContain('window.open')
      expect(inhoud, `${bestand} bevat een href naar buiten`).not.toMatch(/href=["'`]https?:/)
      expect(inhoud, `${bestand} bevat een mailto`).not.toContain('mailto:')
    }
  })
})

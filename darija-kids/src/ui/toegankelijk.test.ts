/**
 * Drie dingen die alleen opvallen als je ze meet.
 *
 * Ze zijn alle drie gevonden door de app in Chromium te meten en niet door
 * ernaar te kijken: wie met een muis test, zet nooit een grote letter aan,
 * drukt nooit op Tab en vraagt nooit om minder beweging.
 *
 * - Bij een wortelletter van 24 pixels liep de kopbalk 62 pixels buiten beeld,
 *   op élk scherm. De hele app schoof dan zijwaarts.
 * - Een knop die focus kreeg, kreeg de standaardlijn van de browser: één
 *   pixel, in de kleur van de browser. Op ronde saffraangele knoppen is dat
 *   niet te zien, en dan is de app onbedienbaar met een toetsenbord of met
 *   Schakelbediening.
 * - "Beperk beweging" zette wel de css-animaties stil en niet die van
 *   framer-motion. De zwevende mascotte bleef bewegen voor precies de persoon
 *   die had gevraagd of dat niet hoefde.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('de app bij een grote lettergrootte', () => {
  /**
   * Afbreken in plaats van afkappen.
   *
   * Nagemeten op 390 pixels: bij een wortelletter van 16 is de balk 77 pixels
   * hoog en past alles; bij 20 en 24 zakken de tellers naar een tweede regel
   * en is er op geen van de drie maten zijwaarts te schuiven.
   */
  it('laat de kopbalk afbreken in plaats van buiten beeld lopen', () => {
    const top = lees('./TopBar.tsx')
    expect(top).toContain('flex max-w-5xl flex-wrap items-center')
  })
})

describe('de toetsenbordbediening', () => {
  const css = lees('../index.css')

  it('tekent een eigen focusring, en alleen bij toetsenbordgebruik', () => {
    expect(css).toContain(':focus-visible')
    expect(css).toMatch(/outline: 3px solid var\(--color-zellige-600\)/)
    // `:focus` zou ook bij een vinger een rand achterlaten.
    expect(css).not.toMatch(/\):focus\s*\{/)
  })

  /**
   * Eén ringkleur is altijd ergens onzichtbaar. In de donkere stand staat de
   * zellige-groene ring op een donkere achtergrond, dus daar wordt hij mint.
   */
  it('past de ringkleur aan de donkere stand aan', () => {
    expect(css).toContain('--color-mint-400')
    expect(css).toContain('@media (prefers-color-scheme: dark)')
  })
})

describe('beperkte beweging', () => {
  it('laat framer-motion naar de voorkeur van het toestel luisteren', () => {
    const app = lees('../App.tsx')
    expect(app).toContain('<MotionConfig reducedMotion="user">')
  })

  /**
   * De css-regel blijft staan en dekt alles wat niet door framer-motion komt.
   * Ze vervangen elkaar niet.
   */
  it('houdt de css-regel die de rest stilzet', () => {
    expect(lees('../index.css')).toContain('@media (prefers-reduced-motion: reduce)')
  })
})

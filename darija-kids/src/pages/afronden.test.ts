/**
 * Wat er gebeurt als een les klaar is.
 *
 * Dit is het vaakst gelopen stukje van de hele app: elke les eindigt hier. De
 * grote knop zei "Verder op pad" en bracht je naar /leren, waar je de volgende
 * les nog moest zoeken en aantikken. Twee tikken en wat scrollen voor het
 * enige wat iemand die net een les afmaakte bijna altijd wil.
 *
 * Nu begint de knop die les, en zegt hij welke. Het pad blijft eronder staan
 * voor wie wél wil rondkijken.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { nl } from '../i18n/nl'
import { de } from '../i18n/de'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { fr } from '../i18n/fr'
import { it as italiaans } from '../i18n/it'

const code = readFileSync(new URL('./LessonPlayer.tsx', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

describe('de knop onder het scorescherm', () => {
  it('gaat rechtstreeks naar de volgende les', () => {
    expect(code).toMatch(/navigate\(`\/les\/\$\{volgende\.id\}`\)/)
  })

  it('zegt welke les dat is', () => {
    expect(code).toMatch(/\{t\.lesson\.volgendeLes\}/)
    expect(code).toMatch(/lessonTitle\(volgende, lang\)/)
  })

  /**
   * `nextLesson` geeft de laatst afgeronde les terug als er niets meer open
   * staat. De vergelijking met `lessonId` is dus het signaal "dit was hem" —
   * en dan hoort het pad weer de bovenste knop te zijn, niet een knop die je
   * de les laat overdoen die je net deed.
   */
  it('valt terug op het pad als er geen volgende les is', () => {
    expect(code).toMatch(/volgendeId === lessonId \? undefined : lessonById\(volgendeId\)/)
    expect(code).toMatch(/\) : \(\s*<Button className="w-full" onClick=\{\(\) => navigate\('\/leren'\)\}>\{t\.lesson\.verderOpPad\}<\/Button>/)
  })

  /** Het pad blijft bereikbaar, een knop lager. */
  it('houdt "verder op pad" eronder staan', () => {
    expect(code).toMatch(/\{!gratisOp && volgende && \(/)
  })

  /** Is het gratis deel op, dan gaat de bovenste knop daarover. Dat blijft. */
  it('laat het slot voorgaan', () => {
    expect(code).toMatch(/\{gratisOp \? \(/)
  })

  it('de knop staat in alle zes de talen', () => {
    for (const taal of [nl, fr, de, es, italiaans, en]) {
      expect(taal.lesson.volgendeLes.length).toBeGreaterThan(3)
    }
  })
})

/**
 * En de les zit in een eigen component met de les-id als `key`.
 *
 * Sinds het scorescherm de volgende les meteen kan beginnen, gaat de app van
 * /les/a naar /les/b zonder er iets tussen — en dan blijft deze component
 * gewoon staan, met alles erin: `result`, de gewonnen beloningen, de mijlpaal,
 * het aantal pogingen. Zonder die `key` opent de volgende les met het
 * scorescherm van de vorige erover.
 */
describe('van de ene les naar de volgende', () => {
  it('begint de volgende les met een schone component', () => {
    expect(code).toMatch(/<LesScherm key=\{lessonId\} lessonId=\{lessonId\} \/>/)
    expect(code).toMatch(/function LesScherm\(\{ lessonId \}: \{ lessonId: string \}\)/)
  })

  /** En de binnenkant leest de les niet meer zelf uit het adres. */
  it('leest de les-id maar op één plek', () => {
    expect(code.match(/useParams\(\)/g)).toHaveLength(1)
  })
})

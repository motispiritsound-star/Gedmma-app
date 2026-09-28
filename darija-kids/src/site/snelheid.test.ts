/**
 * De twee dingen die de site snel houden, en die je niet ziet als ze weg zijn.
 *
 * Allebei gemeten en niet bedacht.
 *
 * De letters stonden alleen in een @font-face in de stylesheet, dus de browser
 * ontdekte ze pas nadat hij die had gelezen. Met font-display: swap rendert de
 * kop dan eerst in een systeemletter en wisselt daarna om — en Baloo 2 is
 * breder en hoger, dus bij die wissel schuift alles eronder mee. Gemeten op
 * drie bladzijden: 0,073, 0,113 en 0,089 CLS. Boven de 0,1 rekent Google het
 * een pagina aan. Met de preloads erbij: 0,000 op alle drie.
 *
 * En er stond geen enkele cache-regel, waardoor Netlify terugvalt op
 * `max-age=0, must-revalidate` voor alles. Elke herhaalde bladzijde vroeg dus
 * voor élke plaat opnieuw na of hij nog klopte. Nu heeft 90% van wat de site
 * uitlevert een termijn.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')
const generator = bron('../../scripts/make-site.mjs')

describe('de letters komen op tijd', () => {
  it('worden voorgeladen, allebei', () => {
    for (const letter of ['baloo2-800', 'baloo2-600']) {
      expect(generator, `${letter} wordt niet voorgeladen`)
        .toMatch(new RegExp(`<link rel="preload" href="/fonts/${letter}\\.woff2"`))
    }
  })

  it('krijgen crossorigin mee, anders haalt de browser ze twee keer', () => {
    // Een font wordt altijd anoniem opgehaald. Staat crossorigin niet op de
    // preload, dan telt die als een ander verzoek dan het echte, en dan haal
    // je hem twee keer op in plaats van nul keer extra.
    const regels = generator.match(/<link rel="preload" href="\/fonts\/[^>]*>/g) ?? []
    expect(regels).toHaveLength(2)
    for (const regel of regels) {
      expect(regel, regel).toContain('as="font"')
      expect(regel, regel).toContain('crossorigin')
    }
  })

  it('laat de Arabische letters juist met rust', () => {
    // Die hebben een unicode-range en worden alleen gehaald als er Arabisch
    // op de bladzijde staat. Voorladen zou 103 kB kosten aan iedereen die dat
    // niet ziet.
    expect(generator).not.toMatch(/rel="preload"[^>]*naskh/)
    expect(bron('./site.css')).toContain('unicode-range')
  })
})

describe('het cachebeleid', () => {
  const blok = /_headers'\), `([\s\S]*?)`\)/.exec(generator)?.[1] ?? ''

  it('wordt geschreven bij het bouwen', () => {
    expect(blok, '_headers wordt niet meer geschreven').not.toBe('')
  })

  it('dekt alles wat zwaar is en zelden verandert', () => {
    for (const map of ['/fonts/*', '/reeks/*', '/boeken/*', '/film/*']) {
      expect(blok, `${map} heeft geen termijn`).toContain(map)
    }
  })

  it('houdt de bladzijden zelf juist buiten de cache', () => {
    // Daar staan de prijzen in. Een oude prijs die een dag blijft hangen is
    // erger dan een plaat die een dag oud is.
    expect(blok).not.toMatch(/^\/\*$/m)
    expect(blok).not.toMatch(/\.html/)
  })

  it('zet geen jaar op iets dat opnieuw gemaakt wordt', () => {
    // De platen komen uit `npm run winkel` en veranderen als er redactioneel
    // iets wijzigt; een jaar immutable zou een correctie een jaar tegenhouden.
    const regels = blok.split('\n')
    regels.forEach((regel, i) => {
      if (!/immutable|31536000/.test(regel)) return
      const pad = regels.slice(0, i).reverse().find((r) => r.startsWith('/')) ?? ''
      expect(pad, `${pad} staat een jaar vast maar wordt opnieuw gemaakt`).toBe('/fonts/*')
    })
  })
})

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
import { readFileSync, readdirSync } from 'node:fs'
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

/**
 * Elke map met vaste bestanden hoort een cacheregel te hebben.
 *
 * `/shots` stond er niet in: 1,8 MB aan schermafdrukken, tien keer genoemd op
 * de thuisbladzijde, en bij elk bezoek opnieuw nagevraagd. Precies de dure
 * heenreis die dit bestand wil wegnemen, op de ene bladzijde waarvoor het
 * geschreven is.
 *
 * Dat is geen vergeten regel maar een vorm die vanzelf scheeftrekt: er komt
 * een map bij en `_headers` weet daar niets van. Dus telt de machine ze, op de
 * gebouwde site en niet op een lijstje in de bron.
 */
describe('het cachebeleid van de site', () => {
  const OUT = new URL('../../site/', import.meta.url)

  /** Bestanden die nooit veranderen zonder een nieuwe naam of een nieuwe bouw. */
  const VAST = /\.(webp|png|jpe?g|svg|avif|woff2?|mp4|webm|ico|json)$/i

  it('noemt elke map waar vaste bestanden in staan', () => {
    const headers = readFileSync(new URL('_headers', OUT), 'utf8')
    const geregeld = new Set(
      [...headers.matchAll(/^\/([a-z0-9-]+)\/\*/gm)].map((m) => m[1]!),
    )
    expect(geregeld.size, 'er staat bijna niets in _headers').toBeGreaterThan(3)

    const mist: string[] = []
    for (const map of readdirSync(OUT, { withFileTypes: true })) {
      if (!map.isDirectory() || map.name.startsWith('.')) continue
      const erin = readdirSync(new URL(`${map.name}/`, OUT), { recursive: true, encoding: 'utf8' })
      const vast = erin.filter((f) => VAST.test(f))
      // Een map met een handvol bestanden is de moeite niet; het gaat om de
      // mappen waar een bezoeker echt op wacht.
      if (vast.length >= 5 && !geregeld.has(map.name)) mist.push(`${map.name} (${vast.length} bestanden)`)
    }
    expect(mist, 'deze mappen staan vol met bestanden die nooit veranderen, maar '
      + 'worden bij elk bezoek opnieuw nagevraagd. Zet ze in _headers in '
      + 'scripts/make-site.mjs.').toEqual([])
  })
})

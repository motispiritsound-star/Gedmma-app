/**
 * Een verbergregel die later in hetzelfde bestand wordt overstemd.
 *
 * `@media (max-width: 62rem) { header.top nav a { display: none } }` verbergt
 * het menu op een telefoon. Onderaan het bestand kwam daar deze week
 * `header.top nav a { min-height: 2.75rem; display: flex }` bij, voor het
 * raakvlak van 44 punten.
 *
 * Allebei (0,1,3) — één klasse, drie elementen. Een mediaquery telt niet mee in
 * specificiteit, dus wint wie later staat, en dat was de tweede. Gemeten op de
 * gebouwde site, op 360 punten:
 *
 *   vóór   1 zichtbare link, merk 151px, taalkiezer op x=279, geen zijscroll
 *   erna   8 zichtbare links, merk 0px, taalkiezer op x=642, bladzijde 707px
 *
 * De hele etalage, op elke telefoon en tablet, in alle zes de talen. Het viel
 * niet op omdat je een kop op een breed scherm bekijkt, en daar klopte alles.
 *
 * Deze test kijkt daarom niet naar die ene regel maar naar de vorm van de
 * fout: staat een selector in een `max-width`-blok op `display: none`, dan mag
 * diezelfde selector verderop geen `display` meer zetten. Dat is precies het
 * soort regel dat je toevoegt zonder aan de mediaquery driehonderd regels
 * hoger te denken.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./site.css', import.meta.url), 'utf8')

/** De regels van het blad, elk met de mediaquery waarin hij staat. */
interface Regel { selector: string; body: string; media: string; positie: number }

function lees(bron: string): Regel[] {
  // Commentaar eruit, anders telt een uitgecommentarieerde regel mee.
  const schoon = bron.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length))
  const uit: Regel[] = []
  const stapel: string[] = []
  let i = 0
  let begin = 0
  while (i < schoon.length) {
    const c = schoon[i]
    if (c === '{') {
      const kop = schoon.slice(begin, i).trim()
      if (kop.startsWith('@')) {
        stapel.push(kop)
      } else {
        // Een gewone regel: zoek zijn sluithaak en sla hem op.
        let diepte = 1
        let j = i + 1
        while (j < schoon.length && diepte > 0) {
          if (schoon[j] === '{') diepte += 1
          else if (schoon[j] === '}') diepte -= 1
          j += 1
        }
        for (const sel of kop.split(',')) {
          uit.push({ selector: sel.trim().replace(/\s+/g, ' '), body: schoon.slice(i + 1, j - 1), media: stapel.join(' '), positie: i })
        }
        i = j
        begin = j
        continue
      }
    } else if (c === '}') {
      stapel.pop()
      begin = i + 1
    } else if (c === ';' && stapel.length === 0) {
      begin = i + 1
    }
    i += 1
  }
  return uit
}

const regels = lees(css)

describe('de kopbalk van de website', () => {
  it('leest het blad zonder erin te stikken', () => {
    // Een parser die niets vindt laat alles hieronder vacuüm slagen.
    expect(regels.length).toBeGreaterThan(200)
    expect(regels.some((r) => r.selector === 'header.top nav a')).toBe(true)
    expect(regels.some((r) => r.media.includes('max-width'))).toBe(true)
  })

  it('laat geen verbergregel overstemmen door een latere regel met dezelfde selector', () => {
    const verborgen = regels.filter((r) =>
      r.media.includes('max-width') && /(^|[;\s])display\s*:\s*none/.test(r.body))
    expect(verborgen.length, 'geen enkele verbergregel gevonden — leest de parser wel goed?')
      .toBeGreaterThan(0)

    for (const weg of verborgen) {
      const botst = regels.filter((r) =>
        r.selector === weg.selector
        && r.positie > weg.positie
        && !r.media.includes('max-width')
        && /(^|[;\s])display\s*:/.test(r.body))
      expect(botst.map((r) => r.body.trim().slice(0, 60)),
        `"${weg.selector}" wordt verborgen in ${weg.media}, maar verderop zet dezelfde `
        + 'selector opnieuw een display. Gelijke specificiteit, later in het bestand: '
        + 'die wint, en het menu komt terug. Gebruik opvulling, of zet de regel in een '
        + 'min-width-blok.').toEqual([])
    }
  })

  it('geeft de menulinks hun raakvlak met opvulling en niet met display', () => {
    // De reparatie zelf. Valt deze om, dan is het raakvlak van 44 punten weg
    // of staat het er weer op de manier die de kop sloopte.
    const nav = regels.filter((r) => r.selector === 'header.top nav a' && !r.media)
    expect(nav.length, 'de regel voor de menulinks is weg').toBeGreaterThan(0)
    const alles = nav.map((r) => r.body).join(';')
    expect(alles, 'de menulinks zetten weer een display buiten een mediaquery')
      .not.toMatch(/(^|[;\s])display\s*:/)
    expect(alles, 'de opvulling die het raakvlak maakt is weg').toMatch(/padding-top\s*:/)
  })
})

/**
 * En een var() naar een naam die niet bestaat.
 *
 * De kleuren heten hier Engels: `--line`, `--ink-soft`, `--ink`. De wisblok van
 * deze week vroeg om `--lijn`, `--zacht` en `--inkt`, en die staan nergens.
 *
 * Dat faalt stil en verkeerd. Een `var()` zonder terugval naar een onbekende
 * variabele maakt de hele verklaring ongeldig op het moment van berekenen — de
 * eigenschap valt dan niet terug op wat eromheen staat maar op erven of op zijn
 * beginwaarde. `border-top: 1px solid var(--lijn)` werd dus géén streep, en
 * `color: var(--zacht)` werd volle inkt in plaats van gedempt. De uitkomst is
 * niet "iets minder mooi" maar het omgekeerde van de bedoeling: de knop die je
 * gegevens onomkeerbaar wist stond zonder scheiding en in de opvallendste
 * kleur van de bladzijde, pal onder Uitloggen.
 *
 * Een typefout in een variabelenaam is onzichtbaar tot iemand de bladzijde op
 * het juiste moment opent. Dus telt de machine ze.
 */
describe('de kleuren van het stijlblad', () => {
  const zonderCommentaar = css.replace(/\/\*[\s\S]*?\*\//g, ' ')

  /** Elke naam die ergens wordt gedefinieerd: `--naam:` aan het begin van een regel. */
  const bekend = new Set([...zonderCommentaar.matchAll(/(?:^|[;{]\s*)(--[\w-]+)\s*:/gm)].map((m) => m[1]!))

  it('kent de namen die het bestand zelf opschrijft', () => {
    expect(bekend.size, 'geen enkele variabele gevonden — leest de test wel goed?').toBeGreaterThan(10)
    expect(bekend.has('--ink')).toBe(true)
  })

  it('vraagt nergens om een variabele die niet bestaat', () => {
    const onbekend = new Map<string, number>()
    for (const m of zonderCommentaar.matchAll(/var\(\s*(--[\w-]+)\s*([,)])/g)) {
      const naam = m[1]!
      // Met een terugval erachter is het geen fout maar een keuze:
      // `var(--terra, #c34a2c)` doet het ook zonder --terra.
      if (m[2] === ',') continue
      if (!bekend.has(naam)) onbekend.set(naam, (onbekend.get(naam) ?? 0) + 1)
    }
    expect([...onbekend.keys()],
      'deze namen worden gebruikt maar nergens gezet. Een var() zonder terugval naar '
      + 'een onbekende naam maakt de hele verklaring ongeldig, en dat is stiller en '
      + 'erger dan een verkeerde kleur.').toEqual([])
  })
})

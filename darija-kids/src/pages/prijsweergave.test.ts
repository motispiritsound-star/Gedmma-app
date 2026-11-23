/**
 * Het bedrag dat wordt afgeschreven is het duidelijkste op het scherm.
 *
 * Apple wees versie 1.0 (build 5) af op richtlijn 3.1.2(c):
 *
 *   "The auto-renewable subscription displays the monthly calculated pricing
 *    for the subscription more clearly and conspicuously than the billed
 *    amount."
 *
 * Het jaarplan leidde met € 5,00 per maand, want zo vergelijkt een koper het
 * met het maandplan ernaast. Het jaarbedrag stond er wel, maar eronder en
 * kleiner. Wat Apple eist is niet dát het er staat, maar dat het het
 * duidelijkste prijselement is — in positie én grootte — en dat elke andere
 * prijs daaraan ondergeschikt is, ook een gratis proef of een omrekening.
 *
 * Nagemeten in Chromium, na de wijziging:
 *
 *   € 59,99                    24px, gewicht 800
 *   dat is € 5,00 per maand    12px, gewicht 400, eronder
 *   € 98,87 (doorgestreept)    12px, gewicht 400, eronder
 *
 * Niet alleen op een telefoon. De afwijzingsmail noemt het toestel waarop
 * gekeken is: **iPad Pro 11-inch (M4)**. Daar staan de twee plankaarten naast
 * elkaar in plaats van onder elkaar, en dan herschikt het raster — een meting
 * op 390 breed zegt dus niets over het scherm waar de beoordelaar naar kijkt.
 * Op 834 staand en 1210 liggend gemeten: dezelfde verhouding, 24px/800 boven
 * 12px/400.
 *
 * Deze toets kijkt naar de bron en niet naar de bundel, met opzet: `dist/`
 * staat in .gitignore, dus een test die daaruit leest faalt in CI met ENOENT.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')
const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en'] as const

describe('de prijs die wordt afgeschreven', () => {
  const unlock = bron('./Unlock.tsx')

  it('staat groot op de kaart, ongeacht het plan', () => {
    // De grote regel toont priceOf(option.id) — het bedrag van dát plan. Stond
    // hier ooit `option.id === 'jaar' ? perMaandJaar : ...`, en dat is precies
    // waar 3.1.2(c) over ging.
    const groot = /text-2xl font-extrabold">\s*\{([^}]+)\}/.exec(unlock)?.[1]?.trim()
    expect(groot, 'de grote regel op de plankaart is niet te vinden').toBeTruthy()
    expect(groot, `de grote regel toont "${groot}" in plaats van het afgeschreven bedrag`)
      .toBe('priceOf(option.id)')
  })

  it('zet de omrekening naar een maand eronder, en kleiner', () => {
    const na = unlock.slice(unlock.indexOf('text-2xl font-extrabold'))
    const i = na.indexOf('perMaandBerekend')
    expect(i, 'de omrekening naar een maand staat niet meer onder het jaarbedrag').toBeGreaterThan(-1)
    // Alles tussen het grote bedrag en de omrekening moet klein zijn.
    expect(na.slice(0, i), 'de omrekening staat niet in een kleine regel').toContain('text-xs')
  })

  it('noemt in de ondertitel het bedrag van het gekozen plan', () => {
    // `price` is priceOf(plan); `perMaandJaar` is de omrekening. Die tweede
    // stond hier, en dan opende het scherm met een prijs die niemand betaalt.
    //
    // Het eerste argument staat hier als naam open: dat was `TRIAL_DAYS` toen
    // de proef er nog was en is nu `proefDagen` (nul zonder proef). Wat de
    // toets vasthoudt is het tweede argument -- `price` en niet de omrekening.
    expect(unlock, 'de ondertitel toont niet het afgeschreven bedrag')
      .toMatch(/t\.unlock\.sub\(\w+, price, gezin, jaar\)/)
    expect(unlock, 'de omrekening zit weer in de ondertitel')
      .not.toContain('jaar ? perMaandJaar : price')
  })

  it.each(TALEN)('%s: de ondertitel kiest de juiste eenheid', (taal) => {
    const tekst = bron(`../i18n/${taal}.ts`)
    // `sub()` heeft sinds het vervallen van de proef twee takken: met `dagen`
    // en zonder. Daarom niet de eerste regel na de `=>` lezen maar het hele
    // lichaam, tot de volgende sleutel op dezelfde inspringing -- en dan elke
    // tekst erin nalopen. Een tak die het bedrag of de eenheid vergeet is
    // precies de afwijzing van build 5, ook als de andere tak klopt.
    const lichaam = /sub: \(dagen[\s\S]*?\n    \w+:/.exec(tekst)?.[0]
    expect(lichaam, `${taal}: sub() is niet te vinden`).toBeTruthy()
    const takken = lichaam!.match(/`[^`]*`/g) ?? []
    expect(takken.length, `${taal}: sub() geeft geen tekst terug`).toBeGreaterThan(0)
    for (const tak of takken) {
      // Zonder `jaar` in de tekst staat er "per maand" onder een jaarbedrag.
      expect(tak, `${taal}: deze tak maakt geen onderscheid tussen jaar en maand: ${tak}`)
        .toMatch(/\$\{jaar \?/)
      // En zonder `prijs` staat het afgeschreven bedrag er helemaal niet.
      expect(tak, `${taal}: deze tak noemt het afgeschreven bedrag niet: ${tak}`)
        .toContain('${prijs}')
    }
  })

  it.each(TALEN)('%s: de omrekening leest als een rekensom', (taal) => {
    const tekst = bron(`../i18n/${taal}.ts`)
    expect(tekst, `${taal}: perMaandBerekend ontbreekt`).toContain('perMaandBerekend:')
    expect(tekst, `${taal}: jaarVooruit ontbreekt`).toContain('jaarVooruit:')
  })
})

/**
 * En dezelfde regel op de winkelafbeelding, want die gaat naar dezelfde
 * beoordelaar.
 *
 * `AANBOD` in `scripts/make-screenshots.mjs` is de ene opname die iets
 * verkoopt in plaats van iets toont: een kop, twee prijsblokken en een
 * voetregel, met de prijs in het beeld gebakken. Daar is dezelfde fout twee
 * keer gemaakt. Eerst stond er `groot: '€ 5,00 p/m'` met `klein: 'bij een
 * jaarabonnement'` — de omrekening groot en het afgeschreven bedrag nergens.
 * Daarna, bij het invoeren van de actie, `groot: '€ 2,50 p/m'` met
 * `klein: '€ 29,99 per jaar'` — het jaarbedrag erbij, maar nog steeds de
 * omrekening als grootste getal. Dat is de afwijzing in een nettere jas.
 *
 * De regel is niet "het bedrag moet erbij" maar "het bedrag moet het
 * duidelijkste zijn". Die is hier in één vergelijking te vatten: wat er in
 * `groot` staat is een jaar, wat er in `klein` staat is datzelfde jaar gedeeld
 * door twaalf, en een jaarbedrag is altijd het grootste getal van de twee.
 * Zo blijft de toets ook staan als de prijzen veranderen.
 */
describe('de prijspil op de winkelafbeelding', () => {
  const script = bron('../../scripts/make-screenshots.mjs')
  const blok = /const AANBOD = \{[\s\S]*?\n\}/.exec(script)?.[0]

  it('heeft een AANBOD-kader om te lezen', () => {
    expect(blok, 'AANBOD is niet te vinden in scripts/make-screenshots.mjs').toBeTruthy()
  })

  /** De eerste prijs uit een stukje tekst, als getal. */
  const bedrag = (tekst: string): number | null => {
    const m = /(\d+)[.,](\d{2})/.exec(tekst)
    return m ? Number(`${m[1]}.${m[2]}`) : null
  }

  it('zet in elk kader het afgeschreven bedrag groot en de omrekening klein', () => {
    const pillen = [...blok!.matchAll(/pil1: \{ groot: '([^']*)', klein: '([^']*)' \}/g)]
    // Vijf eurotalen; de Engelse vermelding is de terugval voor de hele wereld
    // en krijgt met opzet geen aanbodplaatje — zie `langs` bij de tiende opname.
    expect(pillen.length, 'niet elk kader heeft een pil1').toBe(5)
    for (const [heel, groot, klein] of pillen) {
      const bovenaan = bedrag(groot)
      const eronder = bedrag(klein)
      expect(bovenaan, `het grote bedrag ontbreekt: ${heel}`).not.toBeNull()
      expect(eronder, `de omrekening ontbreekt: ${heel}`).not.toBeNull()
      expect(bovenaan!, `de omrekening staat groter dan het afgeschreven bedrag: ${heel}`)
        .toBeGreaterThan(eronder!)
    }
  })

  /**
   * En de losse maandprijs blijft zichzelf. Dat `is` het afgeschreven bedrag,
   * dus daar hoort geen tweede getal onder — een omrekening van een maand naar
   * een maand is een getal te veel op een plaatje.
   */
  it('laat het maandblok met rust', () => {
    const pillen = [...blok!.matchAll(/pil2: \{ groot: '([^']*)', klein: '([^']*)' \}/g)]
    expect(pillen.length).toBe(5)
    for (const [heel, , klein] of pillen) {
      expect(bedrag(klein), `er staat een bedrag onder de maandprijs: ${heel}`).toBeNull()
    }
  })
})

/**
 * De trechtermeting, en de beloftes die eromheen staan.
 *
 * Deze test bewaakt twee soorten dingen. Het eerste is gewoon gedrag: een
 * trede vuurt op de juiste getallen, op het web wordt er niet geteld. Het
 * tweede is zwaarder en is de reden dat dit bestand bestaat: de app doet een
 * aantal uitspraken over zichzelf -- in de privacyverklaring in zes talen, en
 * in twee commentaren die met zoveel woorden beloven wat de app níét ziet --
 * en code die daarmee in tegenspraak komt, is bij Apple een afwijzingsgrond.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { LANGS, type Lang } from '../i18n/languages'
import { privacyVan } from '../i18n/privacy'
import { TELLEN } from './telbesluit'
import { TELLERS, TREDEN, telMogelijk, tredeVan } from './tellen'

const lees = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('de schakelaar', () => {
  /*
   * Hij staat uit, en dat hoort zo te blijven tot de vier dingen uit
   * `telbesluit.ts` gedaan zijn: twee winkelformulieren, de antwoorden aan App
   * Review, en de datum in de verklaring.
   *
   * Deze test is geen mening over of de meting goed is. Hij is er zodat het
   * aanzetten een bewuste regel blijft en niet iets dat met een andere
   * wijziging meelift -- dan valt deze test om en staat er in de melding
   * waarom.
   */
  it('staat uit tot de winkelverklaringen bij zijn', () => {
    expect(TELLEN, 'zie de vier punten in engine/telbesluit.ts').toBe(false)
  })

  it('woont in een bestand dat niets importeert, zodat er geen kringetje kan ontstaan', () => {
    const bron = lees('./telbesluit.ts')
    expect(bron).not.toMatch(/^import /m)
    expect(bron).toContain('export const TELLEN')
  })
})

describe('de privacyverklaring', () => {
  /*
   * Dit is de kern. De verklaring leest dezelfde constante als de code, dus
   * ze kunnen niet uit elkaar lopen -- maar alleen als elke taal die ternair
   * ook werkelijk heeft. Een taal die vergeten is, zegt in de ene stand het
   * verkeerde.
   */
  const bron = lees('../i18n/privacy.ts')

  it('leest dezelfde schakelaar als de app', () => {
    expect(bron).toContain("import { TELLEN } from '../engine/telbesluit'")
    expect(bron).toContain('const MEET = TELLEN')
  })

  it('heeft in alle zes de talen een tekst voor beide standen', () => {
    // Twee in "Wat we verzamelen" en één om de meetsectie heen, per taal.
    const ternairen = bron.split('MEET').length - 1
    expect(ternairen, 'MEET komt te weinig of te vaak voor').toBe(1 + LANGS.length * 3)
  })

  it('zegt in elke taal hetzelfde als de code doet', () => {
    // `LANGS` is een rij objecten met een `code`, niet een rij codes.
    for (const lang of LANGS.map((l) => l.code as Lang)) {
      const meten = privacyVan(lang).sections.find((s) => s.body.join(' ').match(/analytic|analitic|anal[íi]tic|Analytics/))
      expect(meten, lang).toBeDefined()
      const tekst = meten!.body.join(' ')
      if (TELLEN) {
        /* Telt de app, dan hoort er te staan wát er weggaat én dat er niets
           herleidbaar bij zit. Niet alleen "we meten": dat is waar en het
           zegt een ouder niets. */
        expect(meten!.body.length, lang).toBeGreaterThan(1)
        expect(tekst, lang).toMatch(/eigen server|propre serveur|eigenen Server|nostro server|our own server|propio servidor/)
      } else {
        expect(meten!.body.length, lang).toBe(1)
        /* En dan belooft hij het tegenovergestelde, dus mag er niets staan
           dat op een eigen server wijst. */
        expect(tekst, lang).not.toMatch(/eigen server|propre serveur|eigenen Server|nostro server|our own server|propio servidor/)
      }
    }
  })
})

describe('de tellers', () => {
  /*
   * De namen moeten door de witte lijst van de server komen. Die staat in
   * `server/src/index.ts` en is daar met opzet streng: het eindpunt is open,
   * dus wat er geteld kán worden is de enige rem die er is.
   */
  it('hebben namen die de server toelaat', () => {
    for (const naam of TELLERS) {
      expect(naam, naam).toMatch(/^[a-z_]{3,24}$/)
    }
  })

  it('en de treden ook', () => {
    for (const t of TREDEN) {
      expect(`les_af:${t}`.length).toBeLessThanOrEqual(24)
    }
  })

  /* De eerste vier treden zijn het gratis deel; daar zit de vraag. */
  it('beginnen met elk van de vier gratis lessen apart', () => {
    expect(TREDEN.slice(0, 4)).toEqual([1, 2, 3, 4])
  })

  it('vuren alleen op een exacte trede', () => {
    expect(tredeVan(1)).toBe('les_af:1')
    expect(tredeVan(4)).toBe('les_af:4')
    expect(tredeVan(10)).toBe('les_af:10')
    // Niet "de hoogste die gehaald is": anders telt les 6 opnieuw als trede 5.
    expect(tredeVan(6)).toBeNull()
    expect(tredeVan(0)).toBeNull()
    expect(tredeVan(75)).toBeNull()
  })

  it('tellen geen les en geen lesnaam, alleen hoe diep iemand kwam', () => {
    const bron = lees('./tellen.ts')
    // Dit stond er eerst wel. `privacy.ts` belooft dat er niets van het
    // oefenen naar een server gaat, en "hruf-3 was op 18 november af" is dat.
    expect(bron).not.toMatch(/les_af:\$\{[^}]*(id|lesson|les\b)/)
    expect(TELLERS.every((n) => !n.includes('hruf'))).toBe(true)
  })
})

describe('waar er niet geteld wordt', () => {
  it('niet op het web, en niet in de demobouw', () => {
    // In de testomgeving is er geen `window`, dus `platform()` is 'web'.
    expect(telMogelijk()).toBe(false)
    expect(lees('./tellen.ts')).toContain("platform() !== 'web'")
  })

  /*
   * De belofte in `engine/delen.ts`: "De app ziet niet of er iets verstuurd
   * is, aan wie, of hoe vaak." Een teller op de deelknop legt dat laatste
   * precies vast, dus die bestaat niet -- alleen `deel_zien`, en dat is onze
   * eigen kaart op ons eigen scherm.
   */
  it('niet op de deelknop, want delen.ts belooft dat we dat niet zien', () => {
    expect(lees('./delen.ts')).not.toContain('tel(')
    expect(lees('../ui/Delen.tsx')).toContain("tel('deel_zien')")
    expect(lees('../ui/Delen.tsx')).not.toMatch(/tel\('deel_klik'\)/)
    expect((TELLERS as readonly string[]).includes('deel_klik')).toBe(false)
  })

  /*
   * En in `engine/beoordeling.ts`: "of iemand werkelijk iets schrijft weten we
   * niet en kunnen we niet weten, en dat is maar goed ook."
   */
  it('niet op de uitkomst van een beoordeling', () => {
    expect(lees('./beoordeling.ts')).not.toContain('tel(')
    expect(lees('../ui/Beoordeling.tsx')).toContain("tel('beoord_zien')")
  })

  /* Geen netwerk in de diplomamodules; `ui/plank.test.ts` bewaakt dat al. */
  it('niet in de diplomamodules', () => {
    expect(lees('./diploma.ts')).not.toContain('tel(')
  })
})

describe('wat er over de lijn gaat', () => {
  const bron = lees('./tellen.ts')

  it('is een naam, een dag, een taal, een platform en een versie, en niets meer', () => {
    const merk = 'body: JSON.stringify({'
    const van = bron.indexOf(merk) + merk.length
    const body = bron.slice(van, bron.indexOf('})', van))
    for (const veld of ['t:', 'd:', 'l:', 'p:', 'v:']) expect(body).toContain(veld)
    expect(body.split(':').length - 1, 'een veld erbij hoort langs de verklaring').toBe(5)
  })

  it('bevat geen identificatie, hoe dan ook', () => {
    /*
     * Zonder commentaar, en dat is niet luiheid. De toelichting bovenaan
     * `tellen.ts` somt juist op wat er níét meegaat -- "geen sessie-id, geen
     * apparaat-id" -- en een test die daarover valt, verbiedt het opschrijven
     * van de belofte in plaats van het breken ervan. Dezelfde val als eerder
     * in `bidi.test.ts` en `intro.test.ts`, waar een regex op een commentaar
     * matchte en de bewaking leeg bleek.
     */
    const code = bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    expect(code, 'de code zelf moet er nog zijn').toContain('fetch(')
    for (const woord of ['idfa', 'deviceId', 'userId', 'sessie', 'uuid', 'randomUUID', 'fingerprint']) {
      expect(code.toLowerCase(), woord).not.toContain(woord.toLowerCase())
    }
  })

  it('stuurt de dag en niet het tijdstip', () => {
    expect(bron).not.toContain('toISOString()')
    expect(bron).toContain('getFullYear()')
  })

  it('is stil als het misgaat', () => {
    // Een teller is niets waard tegenover een foutmelding voor een kind.
    expect(bron).toMatch(/catch \{\n\s*\/\/[^\n]*\n\s*\}/)
    expect(bron).not.toMatch(/catch[^}]*console\./)
  })
})

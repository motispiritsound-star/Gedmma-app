import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * De zoekwoorden van de App Store, en de ruimte die erin verspild werd.
 *
 * Apple geeft honderd tekens voor een veld dat niemand ziet, en indexeert
 * daarnaast de naam en de ondertitel. Wie in de zoekwoorden iets herhaalt dat
 * daar al staat, betaalt daar tekens voor en krijgt er niets voor terug.
 *
 * `store/keywords.md` schreef die regel zelf voor en brak hem in zijn eigen
 * tabel: elke taal begon met de drie woorden uit de ondertitel. In het
 * Nederlandse veld ging 26 van de 91 tekens daaraan op. Wat er op 24 oktober
 * werkelijk in de console stond was nog slechter -- met `gratis` erin en een
 * spatie in `arabisch schrift`.
 *
 * Deze test leest de twee tabellen uit dat bestand en legt ze naast elkaar.
 * Niet de woordkeuze -- die mag veranderen -- maar de drie dingen die meetbaar
 * fout kunnen gaan: te lang, dubbel met de ondertitel, of een spatie erin.
 */
const TALEN: Record<string, string> = {
  Nederlands: 'nl', Français: 'fr', Deutsch: 'de',
  Español: 'es', Italiano: 'it', English: 'en',
}

const heel = readFileSync(new URL('../../store/keywords.md', import.meta.url), 'utf8')

/**
 * Alleen het App Store-deel.
 *
 * Het bestand heeft twee tabellen met een kolom `Taal`: die van Apple met naam
 * en ondertitel, en die van Google met titel en korte beschrijving. Zonder
 * deze knip las de test de tweede en vergeleek hij de zoekwoorden met een
 * Google-titel waar `Darija` gewoon in hoort te staan -- en wees hij `darija`
 * aan als fout terwijl dat juist de belangrijkste term is.
 */
const bron = heel.slice(0, heel.indexOf('## Google Play'))

/** De regels uit de naam-en-ondertiteltabel, per taalcode. */
function koppen(): Record<string, string> {
  const uit: Record<string, string> = {}
  for (const regel of bron.split('\n')) {
    const cel = regel.split('|').map((c) => c.trim())
    if (cel.length < 4) continue
    const code = TALEN[cel[1] ?? '']
    if (code && cel[3]) uit[code] = `${cel[2]} ${cel[3]}`
  }
  return uit
}

/** Het eerste blok met `nl: …`-regels. */
function zoekwoorden(): Record<string, string[]> {
  const uit: Record<string, string[]> = {}
  for (const regel of bron.split('\n')) {
    const m = /^(nl|fr|de|es|it|en): (.+)$/.exec(regel.trim())
    if (m && !uit[m[1]!]) uit[m[1]!] = m[2]!.split(',')
  }
  return uit
}

describe('de zoekwoorden van de App Store', () => {
  const kop = koppen()
  const woorden = zoekwoorden()

  it('heeft een regel voor elke taal die de app spreekt', () => {
    for (const code of Object.values(TALEN)) {
      expect(woorden[code], `zoekwoorden voor ${code}`).toBeTruthy()
      expect(kop[code], `naam en ondertitel voor ${code}`).toBeTruthy()
    }
  })

  it('blijft binnen de honderd tekens die Apple geeft', () => {
    for (const [code, lijst] of Object.entries(woorden)) {
      const regel = lijst.join(',')
      expect(regel.length, `${code}: ${regel}`).toBeLessThanOrEqual(100)
    }
  })

  /**
   * Een spatie is een teken dat geen woord is. Apple splitst op komma's, dus
   * `arabisch schrift` is één term waarvan de helft al los in het veld stond.
   */
  it('verspilt geen teken aan een spatie', () => {
    for (const [code, lijst] of Object.entries(woorden)) {
      for (const w of lijst) expect(w, `${code}: "${w}"`).not.toMatch(/\s/)
    }
  })

  it('herhaalt niets wat al in de naam of de ondertitel staat', () => {
    for (const [code, lijst] of Object.entries(woorden)) {
      const gedekt = new Set((kop[code] ?? '').toLowerCase().match(/[\p{L}]+/gu) ?? [])
      for (const w of lijst) {
        expect(gedekt.has(w.toLowerCase()), `${code}: "${w}" staat al in "${kop[code]}"`).toBe(false)
      }
    }
  })

  /**
   * `gratis` en zijn vertalingen: het zwaarst beconcurreerde woord in elke
   * winkel, en bij een app met een abonnement is het ook nog misleidend.
   */
  it('belooft niet gratis te zijn', () => {
    const verboden = /^(gratis|gratuit|kostenlos|gratuito|free)$/i
    for (const [code, lijst] of Object.entries(woorden)) {
      for (const w of lijst) expect(w, `${code}: "${w}"`).not.toMatch(verboden)
    }
  })
})

/**
 * De drie links in een mail die iets veranderen, en de regel eronder.
 *
 * `/bevestig`, `/uitschrijven` en `/wissen` deden hun werk op een GET. Daar was
 * geen aanvaller voor nodig: mailclients en virusscanners halen links in een
 * bericht vooruit op om ze te controleren — Outlook Safe Links, de scanner van
 * een bedrijf, het linkvoorbeeld van Slack en WhatsApp. Zo'n prefetch is een
 * gewone GET, en een GET was hier een verwijdering. Iemand kreeg de mail,
 * klikte nergens op, en zijn aanmelding was weg.
 *
 * Nu toont de GET een bladzijde met een knop, en pas de POST erachter doet het.
 * Dat is één regel per endpoint, en precies het soort regel dat bij een
 * volgende opruiming sneuvelt omdat niemand meer weet waarom hij er stond.
 * Vandaar deze test, die de bron leest in plaats van het gedrag: hij valt om
 * zodra een van de drie zijn methode niet meer nakijkt.
 *
 * Deze bewaker staat hier en niet in de worker-map, omdat de tsconfig daar
 * alleen de workers-types kent — een test die `node:fs` gebruikt haalt die
 * typecheck niet.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

/** De drie, met wat er gebeurt als je er per ongeluk langs komt. */
const ENDPOINTS = ['bevestig', 'uitschrijven', 'wissen'] as const

describe('de links uit de mail', () => {
  const index = bron('../../server/src/index.ts')

  it('geven alle drie de methode door aan hun afhandeling', () => {
    for (const naam of ENDPOINTS) {
      const route = new RegExp(
        `url\\.pathname === '/${naam}'\\) return metAdres\\(await ${naam}\\(url, env, verzoek\\.method === 'POST'\\)\\)`,
      )
      expect(index, `/${naam} kijkt niet meer naar de methode`).toMatch(route)
    }
  })

  it('tonen bij een GET eerst de vraag, vóór er iets wordt geschreven', () => {
    for (const naam of ENDPOINTS) {
      const start = index.indexOf(`async function ${naam}(`)
      expect(start, `${naam}() niet gevonden`).toBeGreaterThan(-1)
      const eind = index.indexOf('\nasync function ', start + 10)
      const lichaam = index.slice(start, eind === -1 ? undefined : eind)

      // De uitweg voor een GET moet er zijn ...
      expect(lichaam, `${naam}() vraagt niet eerst`).toContain('if (!doen)')
      expect(lichaam).toContain('vraagPagina(')

      // ... en hij moet vóór de eerste schrijfopdracht staan, anders is hij
      // decoratie: dan is de rij al gewijzigd tegen de tijd dat we het vragen.
      const vraag = lichaam.indexOf('if (!doen)')
      const schrijf = lichaam.search(/UPDATE |DELETE FROM /)
      expect(schrijf, `${naam}() schrijft niets meer?`).toBeGreaterThan(-1)
      expect(vraag, `${naam}() schrijft vóórdat hij vraagt`).toBeLessThan(schrijf)
    }
  })

  it('houden hun eigen adres aan, zodat oude mails blijven werken', () => {
    // Het formulier post terug naar dezelfde route. Wees dat een ander adres,
    // dan werkt elke link in elke al verstuurde mail vanaf nu op niets uit.
    for (const naam of ENDPOINTS) {
      expect(index).toContain(`\`/${naam}?t=\${encodeURIComponent(token)}\``)
    }
  })

  it('hebben in elke taal een tekst voor die vraag', () => {
    const mails = bron('../../server/src/mails.ts')
    const velden = ['vraagBevestigKop', 'vraagBevestigBody', 'vraagAfmeldKop',
      'vraagAfmeldBody', 'vraagWisKop', 'vraagWisBody']
    for (const veld of velden) {
      // Eén keer in de interface en één keer per taal.
      const keer = mails.split(`${veld}:`).length - 1
      expect(keer, `${veld} staat ${keer}× in mails.ts`).toBe(7)
    }
    expect(mails).not.toMatch(/vraag[A-Za-z]+:\s*''/)
  })
})

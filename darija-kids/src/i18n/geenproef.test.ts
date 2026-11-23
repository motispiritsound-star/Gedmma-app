/**
 * Geen enkel scherm belooft nul gratis dagen.
 *
 * De proefperiode is uit het aanbod gehaald: wie de app downloadt betaalt
 * meteen. In de app is dat geen vaste schakelaar maar wat de winkel
 * teruggeeft -- `billing.proef.jaar` -- en de schermen rekenen dat om naar
 * `proefDagen`, nul als er geen proef is.
 *
 * Wat er misging toen de proef eruit ging: `unlock.sub` en `unlock.tijdlijn`
 * kregen een tak voor nul dagen, `welcome.plan` alleen in het Nederlands, en
 * `lesson.gratisOpBody` kreeg er geen en werd ook nog met `TRIAL_DAYS` zelf
 * aangeroepen. Vijf talen zeiden dus "the first 0 days are free" op de
 * welkomstpagina, en het scorescherm beloofde drie gratis dagen die niet meer
 * bestonden -- een mededeling over geld die niet klopt, precies op de plek
 * waar iemand tegen het slot aanloopt.
 *
 * Er zijn in deze app twee manieren om dat goed te doen, en beide komen voor:
 *
 *   1. een tak in de tekst zelf (`sub`, `tijdlijn`, `plan`, `gratisOpBody`)
 *   2. een eigen sleutel ernaast (`koopDirect`, `voorwaardenDirect`,
 *      `voorwaardenJaarDirect`, `bodyDirect`, `welkomGeenProef`)
 *
 * De toets hieronder leest uit de bron welke van de twee ergens geldt. Krijgt
 * een tekst ooit iets anders binnen dan `TRIAL_DAYS` zelf -- en dat is
 * `proefDagen`, dat nul kan zijn -- dan moet hij nul aankunnen, en dat wordt
 * in alle zes de talen nagerekend. Komt er altijd `TRIAL_DAYS` in, dan kan er
 * geen nul in; dan bewaakt het tweede blok dat de aanroep onder een
 * voorwaarde staat die alleen waar is als de winkel werkelijk een proef geeft.
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { de } from './de'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'
import { it as italiaans } from './it'
import { nl } from './nl'

const TALEN = { nl, fr, de, es, it: italiaans, en } as const

/*
 * `reeksMijlpaal(dagen)` is de uitzondering, en de enige. Daar zijn `dagen`
 * geen gratis dagen maar dagen op rij geoefend, en nul is nooit een mijlpaal:
 * de functie wordt alleen aangeroepen als de reeks er een haalt. Een tak voor
 * nul zou dode code zijn.
 */
const GEEN_PROEFTEKST = ['reeksMijlpaal']

/*
 * Waarden zonder cijfers, zodat het enige nulletje dat in de uitkomst kan
 * staan uit `dagen` komt. `prijs` is normaal "€ 59,99" en `opnames` 432 --
 * daar zou de 0 uit "€ 5,00" de toets stil laten slagen.
 */
const VULLING: Record<string, unknown> = {
  prijs: 'PRIJS', winkel: 'WINKEL', opnames: 432, units: 9, gezin: true, jaar: true,
}

const hier = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

/** Alle .tsx- en .ts-bronnen van de app, zonder de toetsen zelf. */
function bronnen(map = new URL('..', import.meta.url).pathname.replace(/\/$/, '')): string[] {
  const uit: string[] = []
  for (const naam of readdirSync(map)) {
    const pad = `${map}/${naam}`
    if (statSync(pad).isDirectory()) uit.push(...bronnen(pad))
    else if (/\.tsx?$/.test(naam) && !/\.test\.tsx?$/.test(naam)) uit.push(pad)
  }
  return uit
}

/**
 * Zonder commentaar en zonder invoerregels. Een uitleg óver `TRIAL_DAYS` is
 * geen aanroep, en een `import { TRIAL_DAYS }` is er ook geen -- die laatste
 * loopt in Unlock.tsx over meerdere regels, dus een `import` wegstrepen op de
 * eerste regel is niet genoeg.
 */
const schoon = (bron: string) =>
  bron
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^import\s[\s\S]*?from\s+'[^']*'$/gm, '')

/**
 * Elke tekst in `nl.ts` die als eerste parameter `dagen` neemt, met de groep
 * waarin hij staat erbij. Die groep is nodig omdat een naam twee keer kan
 * voorkomen: `unlock.koop` is de abonnementsknop en neemt een dagental,
 * `unlock.boek.koop` is de knop onder het e-boek en neemt een prijs. Op naam
 * alleen zoeken haalde die tweede erbij en eiste een tak voor nul dagen in een
 * tekst die er geen dagental in heeft.
 */
function dagenFuncties(bron: string): { groep: string; naam: string }[] {
  const uit: { groep: string; naam: string }[] = []
  let groep = ''
  for (const regel of bron.split('\n')) {
    const g = /^  ([A-Za-z]+): \{/.exec(regel)
    if (g) groep = g[1]
    const m = /^\s+([A-Za-z]+): \(dagen\b/.exec(regel)
    if (m && !GEEN_PROEFTEKST.includes(m[1])) uit.push({ groep, naam: m[1] })
  }
  return uit
}

/** De parameternamen ná `dagen`, zodat elke plek de juiste vulling krijgt. */
function restParameters(bron: string, naam: string): string[] {
  const m = new RegExp(`^\\s+${naam}: \\((dagen[^)]*)\\)`, 'm').exec(bron)
  if (!m) return []
  return m[1].split(',').slice(1).map((p) => p.trim().split(':')[0].trim())
}

/** De functie `groep.naam`, in deze taal. */
function zoek(strings: unknown, groep: string, naam: string): ((...a: unknown[]) => unknown) | null {
  const g = (strings as Record<string, unknown>)[groep]
  if (!g || typeof g !== 'object') return null
  const f = (g as Record<string, unknown>)[naam]
  return typeof f === 'function' ? (f as (...a: unknown[]) => unknown) : null
}

const nlBron = hier('./nl.ts')
const app = bronnen().map((p) => schoon(readFileSync(p, 'utf8')))
const teksten = dagenFuncties(nlBron)

/** De eerste argumenten waarmee `groep.naam` in de app wordt aangeroepen. */
function eersteArgumenten(groep: string, naam: string): string[] {
  const uit: string[] = []
  for (const bron of app) {
    const re = new RegExp(`\\.${groep}\\.${naam}\\(([^,)]*)`, 'g')
    for (const m of bron.matchAll(re)) uit.push(m[1].trim())
  }
  return uit
}

describe('teksten die een dagental van nul kunnen krijgen', () => {
  it('bestaan, anders bewijst dit blok niets', () => {
    const open = teksten.filter(({ groep, naam }) =>
      eersteArgumenten(groep, naam).some((a) => a !== 'TRIAL_DAYS'))
    expect(open.map((t) => `${t.groep}.${t.naam}`),
      'geen enkele tekst krijgt iets anders binnen dan TRIAL_DAYS').not.toHaveLength(0)
  })

  for (const { groep, naam } of teksten) {
    const argumenten = eersteArgumenten(groep, naam)
    // Altijd `TRIAL_DAYS`? Dan kan er geen nul in, en bewaakt het tweede blok
    // dat die aanroep onder een voorwaarde staat.
    if (argumenten.length > 0 && argumenten.every((a) => a === 'TRIAL_DAYS')) continue
    const rest = restParameters(nlBron, naam)
    for (const [taal, strings] of Object.entries(TALEN)) {
      it(`${taal}: ${groep}.${naam}() zegt niets over nul dagen`, () => {
        const f = zoek(strings, groep, naam)
        expect(f, `${taal}: ${groep}.${naam}() is niet te vinden`).toBeTruthy()
        // Beide standen van `gezin` en `jaar`: de takken erbinnen hangen
        // eraan, en een vergeten nul kan in één ervan zitten.
        for (const gezin of [true, false]) {
          for (const jaar of [true, false]) {
            const vul: Record<string, unknown> = { ...VULLING, gezin, jaar }
            const uit = JSON.stringify(f!(0, ...rest.map((pm) => vul[pm])))
            expect(uit, `${taal}: ${groep}.${naam}() vult een dagental van nul in: ${uit}`)
              .not.toMatch(/\b0\b/)
          }
        }
      })
    }
  }
})

describe('de schermen geven het dagental van de winkel door', () => {
  /*
   * Niet `TRIAL_DAYS` zelf. Dat getal is de lengte van de proef zoals die in
   * de winkel stond; of er nog een proef ís weet alleen de winkel. De drie
   * schermen die een dagental doorgeven leiden het daarom af van `proef.jaar`,
   * en dat is woordelijk dezelfde regel op alle drie.
   */
  const AFLEIDING = 'const proefDagen = useBilling().proef.jaar === true ? TRIAL_DAYS : 0'
  /*
   * Twee, en niet meer drie. `LessonPlayer.tsx` stond hier ook: het
   * scorescherm zei "de eerste 3 dagen zijn gratis" onder de mededeling dat de
   * gratis lessen op waren. Die mededeling bestaat sinds 23 november niet meer
   * -- er is geen gratis les en dus geen laatste gratis les -- en het scherm
   * noemt nu geen dagen. Zie `geengratis.test.ts`, dat erop staat dat er in
   * dat bestand geen `proefDagen` en geen `TRIAL_DAYS` meer voorkomt.
   */
  const SCHERMEN = ['../pages/Settings.tsx', '../ui/Welcome.tsx']

  for (const pad of SCHERMEN) {
    it(`${pad.split('/').pop()} leidt proefDagen af van de winkel`, () => {
      expect(hier(pad), `${pad}: proefDagen komt niet van de winkel`).toContain(AFLEIDING)
    })
  }

  it('en geen enkele aanroep geeft TRIAL_DAYS blind door', () => {
    // Waar `TRIAL_DAYS` wél als argument meegaat, staat er een voorwaarde bij
    // die alleen waar is als de winkel een proef geeft. Een regel met
    // `TRIAL_DAYS` zonder een van die drie in de buurt is een belofte zonder
    // dekking.
    const WACHT = /magProef|proefGestart|proefDagen > 0|proef\.jaar/
    let gekeken = 0
    for (const pad of bronnen()) {
      if (/engine\/billing\.ts$/.test(pad)) continue  // daar staat het getal zelf
      const regels = schoon(readFileSync(pad, 'utf8')).split('\n')
      regels.forEach((regel, i) => {
        if (!/\bTRIAL_DAYS\b/.test(regel)) return
        gekeken++
        // Zes regels terug: een JSX-voorwaarde staat soms een paar regels
        // boven het argument dat eraan hangt. Zie Unlock.tsx, waar `magProef`
        // boven twee geneste ternaries staat.
        const buurt = regels.slice(Math.max(0, i - 6), i + 1).join('\n')
        expect(buurt, `${pad}:${i + 1} geeft TRIAL_DAYS door zonder voorwaarde: ${regel.trim()}`)
          .toMatch(WACHT)
      })
    }
    expect(gekeken, 'geen enkele aanroep met TRIAL_DAYS gevonden').toBeGreaterThan(4)
  })
})

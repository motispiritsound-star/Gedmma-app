/**
 * Het eenmalige seintje: de vier gratis lessen zijn gedaan.
 *
 * Dit is de enige melding in de app die niet door de ouder gezet is, en dat
 * maakt hem gevoelig. Hij komt op het moment dat er geld in het spel komt, in
 * een app voor kinderen, en Apple leest richtlijn 4.5.4 daar streng: een
 * melding mag geen verkooppraatje zijn en zeker geen toestemming afdwingen om
 * er een te kunnen sturen.
 *
 * Dus staan hier drie dingen vast die je in de code zelf makkelijk wegpoetst:
 *
 *   1. Er wordt geen toestemming gevraagd. Alleen `checkPermissions`, nooit
 *      `requestPermissions` -- staat het al aan, dan gaat hij, anders niet.
 *   2. Hij heeft zijn eigen id. Onder id 1 zou de dagelijkse wekker hem
 *      wissen, en de dagelijkse wekker hem.
 *   3. Hij is weg zodra er betaald is. "De gratis lessen zijn gedaan" tegen
 *      iemand die net een abonnement nam is op zijn best verwarrend.
 *
 * En de tekst, want die is net zo belangrijk als het mechanisme: wat er staat
 * is wat er gebeurd is, in alle zes de talen. Geen prijs, geen "nu", geen
 * knop.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { seintjeGratisOp, wisSeintjeGratisOp, zetHerinnering } from './herinnering'
import { de } from '../i18n/de'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import { fr } from '../i18n/fr'
import { it as italiaans } from '../i18n/it'
import { nl } from '../i18n/nl'

type Melding = { id: number; title: string; body: string; schedule?: { at?: Date } }

let gepland: Melding[] = []
let gewist: number[] = []
let gevraagd = 0

/**
 * De hele bundel draait in node zonder dom -- zie `vite.config.ts`. Dus zetten
 * we zelf een `window` neer met precies de plugin die herinnering.ts eruit
 * haalt, en houden bij wat eruit komt.
 */
function zetToestel(opties: { toestemming?: string; plugin?: boolean } = {}) {
  gepland = []
  gewist = []
  gevraagd = 0
  const meldingen = {
    checkPermissions: () => Promise.resolve({ display: opties.toestemming ?? 'granted' }),
    requestPermissions: () => { gevraagd += 1; return Promise.resolve({ display: 'granted' }) },
    schedule: (o: { notifications: unknown[] }) => {
      gepland.push(...(o.notifications as Melding[]))
      return Promise.resolve()
    },
    cancel: (o: { notifications: { id: number }[] }) => {
      gewist.push(...o.notifications.map((n) => n.id))
      return Promise.resolve()
    },
  }
  vi.stubGlobal('window', {
    Capacitor: opties.plugin === false ? {} : { Plugins: { LocalNotifications: meldingen } },
  })
}

const tekst = { titel: 'af', body: 'klaar' }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('het seintje als het gratis deel op is', () => {
  it('vraagt geen toestemming, maar kijkt alleen of ze er al is', async () => {
    zetToestel()
    expect(await seintjeGratisOp(tekst)).toBe(true)
    expect(gevraagd, 'een systeemvenster op het moment dat het slot in beeld komt').toBe(0)
  })

  it('gaat niet als er geen toestemming is', async () => {
    zetToestel({ toestemming: 'denied' })
    expect(await seintjeGratisOp(tekst)).toBe(false)
    expect(gepland).toEqual([])
  })

  it('gaat niet op het web, want daar is geen wekker', async () => {
    zetToestel({ plugin: false })
    expect(await seintjeGratisOp(tekst)).toBe(false)
    expect(gepland).toEqual([])
  })

  it('staat op morgenochtend tien uur, ver van de avondwekker', async () => {
    zetToestel()
    await seintjeGratisOp(tekst)
    const wanneer = gepland[0]?.schedule?.at
    expect(wanneer).toBeInstanceOf(Date)
    expect(wanneer?.getHours()).toBe(10)
    expect(wanneer?.getMinutes()).toBe(0)
    expect(wanneer!.getTime(), 'morgen, niet vandaag').toBeGreaterThan(Date.now())
  })

  it('heeft een eigen id, zodat de dagelijkse wekker hem niet wist', async () => {
    zetToestel()
    await seintjeGratisOp(tekst)
    const eigen = gepland[0]?.id
    expect(eigen).toBe(2)

    gepland = []
    gewist = []
    await zetHerinnering(true, '18:30', tekst)
    expect(gewist, 'de dagelijkse wekker wist alleen zichzelf').toEqual([1])
    expect(gepland[0]?.id).toBe(1)
  })

  it('is weg zodra er betaald is', async () => {
    zetToestel()
    await wisSeintjeGratisOp()
    expect(gewist).toEqual([2])
  })

  it('wordt afgezegd door `grant()`, de enige plek waar de toegang opengaat', () => {
    const billing = readFileSync(new URL('./billing.ts', import.meta.url), 'utf8')
    const start = billing.indexOf('function grant(): void {')
    expect(start, '`grant` is niet gevonden').toBeGreaterThan(-1)
    expect(billing.slice(start, billing.indexOf('\n}', start))).toContain('wisSeintjeGratisOp()')
  })
})

describe('de tekst van het seintje', () => {
  const talen = { nl, fr, de, es, it: italiaans, en }

  for (const [naam, t] of Object.entries(talen)) {
    it(`verkoopt niets in het ${naam}`, () => {
      const alles = `${t.settings.seintjeTitel} ${t.settings.seintjeBody}`
      expect(alles).not.toMatch(/\d+[.,]\d{2}|€|\$|£/)
      expect(alles.length, 'twee korte regels, geen betoog').toBeLessThan(120)
    })
  }

  it('wordt ook echt met die twee regels verstuurd', () => {
    const speler = readFileSync(new URL('../pages/LessonPlayer.tsx', import.meta.url), 'utf8')
    expect(speler).toContain('t.settings.seintjeTitel')
    expect(speler).toContain('t.settings.seintjeBody')
    // Eén keer per installatie: zonder deze vlag plant elke herhaling van een
    // gratis les er een nieuwe melding bij.
    expect(speler).toContain('!now.gratisOpGemeld')
    expect(speler).toContain('setState({ gratisOpGemeld: Date.now() })')
  })
})

describe('het welkomstscherm biedt de wekker aan', () => {
  const welkom = readFileSync(new URL('../ui/Welcome.tsx', import.meta.url), 'utf8')

  /*
   * Zonder dit ja bestaat het seintje hierboven alleen op papier: het vraagt
   * zelf geen toestemming, dus de enige manier waarop die er komt is dat de
   * ouder de dagelijkse wekker aanzet. En die stond in de praktijk bij
   * vrijwel niemand aan, want hij ligt twee tikken diep in Instellingen.
   */
  it('stelt de vraag op de laatste stap, bij de prijs', () => {
    const laatste = welkom.slice(welkom.indexOf('{stap === 3 && ('))
    expect(laatste).toContain('{t.welcome.seintje}')
    expect(laatste).toContain('{t.welcome.seintjeHint}')
    expect(laatste.indexOf('t.welcome.seintje'), 'de prijs blijft het laatste woord')
      .toBeLessThan(laatste.indexOf('t.welcome.plan'))
  })

  it('zet de schakelaar pas om als het toestel ja zegt', () => {
    expect(welkom).toContain("setSetting('herinnering', aan && gelukt)")
  })

  it('valt weg op het web, waar geen wekker bestaat', () => {
    expect(welkom).toContain('{kanHerinneren() && (')
  })

  it('haalt de schakelaar uit kit.tsx en bouwt er geen eigen', () => {
    expect(welkom).toMatch(/import \{[^}]*\bToggle\b[^}]*\} from '\.\/kit'/)
    expect(welkom).not.toContain('role="switch"')
  })
})

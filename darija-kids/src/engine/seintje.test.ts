/**
 * De dagelijkse wekker, en voor wie hij niet afgaat.
 *
 * Hier stond ook het eenmalige seintje "de vier gratis lessen zijn gedaan".
 * Dat seintje is op 23 november vervallen met het gratis deel zelf: er is geen
 * laatste gratis les meer, dus er is geen moment waarop hij kon afgaan. Zie
 * `magLeren` in store.ts.
 *
 * Wat ervoor in de plaats komt is een rem, en die is om dezelfde reden
 * gevoelig als het seintje was. Een app voor kinderen mag zijn meldingen niet
 * als verkooppraatje gebruiken -- Apple leest richtlijn 4.5.4 daar streng --
 * en zonder gratis deel zou de dagelijkse wekker voor een niet-betaler elke
 * dag een uitnodiging zijn voor iets dat achter de kassa staat. Dus gaat hij
 * niet af zolang er niets te doen is, en komt hij vanzelf terug zodra er
 * betaald is: de voorkeur blijft bewaard, alleen het plannen valt weg.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { herstelHerinnering, zetHerinnering } from './herinnering'
import { getState, magLeren, setState } from './store'

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

/** Alsof de eerste les gedaan is: dan mag er geleerd worden. */
const gedaan = () =>
  setState({ lessons: { 'hruf-1': { stars: 3, runs: 1, bestScore: 1, lastDone: 0 } } as never })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('de dagelijkse wekker', () => {
  beforeEach(() => setState({ lessons: {} as never, unlocked: false }))

  it('gaat niet af voor wie niets te doen heeft', async () => {
    zetToestel()
    expect(magLeren(getState()), 'een verse installatie mag niet leren').toBe(false)
    expect(await zetHerinnering(true, '18:30', tekst)).toBe(false)
    expect(gepland, 'er is niets gepland').toEqual([])
    /*
     * Wel gewist. Dat is met opzet: wie de app had, hem bijwerkt en niet
     * betaalt, heeft een wekker staan van voor deze versie. Die hoort weg.
     */
    expect(gewist).toEqual([1])
  })

  it('vraagt geen toestemming aan wie hem toch niet krijgt', async () => {
    zetToestel()
    await zetHerinnering(true, '18:30', tekst)
    expect(gevraagd, 'een systeemvenster voor een wekker die niet komt').toBe(0)
  })

  it('gaat af zodra er betaald is', async () => {
    zetToestel()
    setState({ unlocked: true })
    expect(await zetHerinnering(true, '18:30', tekst)).toBe(true)
    expect(gepland[0]?.id).toBe(1)
  })

  it('gaat ook af voor wie de app al had en lessen heeft afgerond', async () => {
    zetToestel()
    gedaan()
    expect(magLeren(getState())).toBe(true)
    expect(await zetHerinnering(true, '18:30', tekst)).toBe(true)
    expect(gepland[0]?.id).toBe(1)
  })

  /**
   * En de voorkeur blijft staan. `herstelHerinnering` zet hem bij elke start
   * opnieuw, dus de wekker van wie vandaag betaalt gaat morgen gewoon af
   * zonder dat hij de schakelaar nog een keer hoeft aan te raken.
   */
  it('komt terug bij de eerste start na de aankoop', async () => {
    zetToestel()
    setState({ settings: { ...getState().settings, herinnering: true, herinneringTijd: '18:30' } })
    await herstelHerinnering(tekst)
    expect(gepland, 'nog niet betaald').toEqual([])

    zetToestel()
    setState({ unlocked: true })
    await herstelHerinnering(tekst)
    expect(gepland[0]?.id).toBe(1)
  })
})

describe('het welkomstscherm biedt de wekker aan', () => {
  const welkom = readFileSync(new URL('../ui/Welcome.tsx', import.meta.url), 'utf8')

  /*
   * De wekker ligt anders twee tikken diep in Instellingen, en stond daardoor
   * bij vrijwel niemand aan. Hij wordt pas gezet als er betaald is -- zie
   * hierboven -- maar de vraag staat hier, op het scherm dat iedereen ziet,
   * zodat het antwoord er al is als het abonnement er komt.
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

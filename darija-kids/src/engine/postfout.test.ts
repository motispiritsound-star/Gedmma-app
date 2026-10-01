/**
 * Wat het scherm zegt als het aanmelden niet lukt.
 *
 * Er was één melding voor twee heel verschillende dingen: "probeer het zo nog
 * eens". Bij een haperende verbinding is dat het goede advies. Bij een fout
 * aan onze kant is het het verkeerde — dan laat je iemand tegen een muur
 * drukken, en laat je hem bovendien denken dat het aan hem ligt.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

/**
 * De module opnieuw laden met een serveradres erin.
 *
 * `VITE_POST` wordt bij het inlezen van `post.ts` één keer uitgelezen en in
 * een const gezet. In de testomgeving is hij leeg — en dan stopt `aanmelden`
 * meteen met `mis`, want zonder server is er niets om aan te melden. Dat is
 * het goede gedrag en precies waarom de test hem eerst moet zetten.
 */
/**
 * Een `navigator` die genoeg kan.
 *
 * `vi.stubGlobal('navigator', …)` vervangt het hele ding, en dan viel
 * `detectLang` om op een ontbrekende talenlijst — een foutmelding over
 * `toLowerCase` die niets met aanmelden te maken heeft. De taal hoort er dus
 * bij, ook al gaat deze test daar niet over.
 */
const navigatorMet = (onLine: boolean) =>
  vi.stubGlobal('navigator', { onLine, languages: ['nl-NL'], language: 'nl-NL' })

const metServer = async () => {
  vi.resetModules()
  vi.stubEnv('VITE_POST', 'https://post.voorbeeld.test')
  return (await import('./post')).aanmelden
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules() })

describe('aanmelden zonder verbinding', () => {
  /**
   * `navigator.onLine` op onwaar is een zekerheid: het toestel weet dat het
   * nergens bij kan. Dan hoeft er geen verzoek de deur uit en hoeft niemand
   * op een time-out te wachten voor een antwoord dat we al hebben.
   */
  it('vraagt het niet eens als het toestel weet dat het offline is', async () => {
    const roep = vi.fn()
    navigatorMet(false)
    vi.stubGlobal('fetch', roep)
    const aanmelden = await metServer()
    expect(await aanmelden('iemand@voorbeeld.nl', { nieuws: true, voortgang: false })).toBe('offline')
    expect(roep, 'er had niets verstuurd mogen worden').not.toHaveBeenCalled()
  })

  /**
   * En als het toestel denkt dat het online is maar het verzoek komt de deur
   * niet uit — dns stuk, server onbereikbaar — dan gooit `fetch`. Dat is
   * hetzelfde geval en krijgt dezelfde melding.
   */
  it('leest een mislukt verzoek als offline en niet als onze fout', async () => {
    navigatorMet(true)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const aanmelden = await metServer()
    expect(await aanmelden('iemand@voorbeeld.nl', { nieuws: true, voortgang: false })).toBe('offline')
  })

  /**
   * Een antwoord mét foutcode is wél onze fout: het verzoek kwam aan, wij
   * konden er niet mee omgaan. Daar helpt opnieuw proberen niet.
   */
  it('leest een foutcode van de server als onze fout', async () => {
    navigatorMet(true)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))
    const aanmelden = await metServer()
    expect(await aanmelden('iemand@voorbeeld.nl', { nieuws: true, voortgang: false })).toBe('mis')
  })
})

describe('de twee meldingen', () => {
  it('zeggen in elke taal iets anders, en allebei dat het ingevulde blijft staan', () => {
    for (const taal of LANG_CODES) {
      const p = STRINGS[taal].post
      expect(p.mis, taal).not.toBe(p.offline)
      expect(p.mis.length, taal).toBeGreaterThan(30)
      expect(p.offline.length, taal).toBeGreaterThan(30)
    }
  })
})

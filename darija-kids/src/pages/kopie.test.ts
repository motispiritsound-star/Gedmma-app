/**
 * "Voortgang opslaan" deed niets in de twee builds die in de winkel staan.
 *
 * De knop maakte een blob en tikte op een onzichtbare `<a download>`. In een
 * browser levert dat een bestand op. In de app niet: `@capacitor/ios` zet geen
 * `WKDownloadDelegate` en `@capacitor/android` geen `DownloadListener`, en
 * zonder die twee laat een webweergave een download vallen — geen bestand,
 * geen foutmelding, geen uitleg.
 *
 * Dat is nagekeken in de plugins zelf en niet aangenomen; de twee controles
 * hieronder lezen die broncode, zodat een latere versie van Capacitor die het
 * wél kan deze test laat omvallen in plaats van hem stil te laten staan.
 *
 * Erger nog was de helft die wél werkte: terugzetten krijgt zijn bestandskiezer
 * van `BridgeWebChromeClient` op Android en van de webweergave zelf op iOS. Wie
 * het probeerde kon dus wel iets terugzetten, maar nooit iets bewaren — en het
 * wisscherm verwijst naar die kopie: "bewaar eerst een kopie".
 *
 * Een bestand wegschrijven kost twee nieuwe native plugins, en die komen na de
 * lancering. Wat nu werkt in beide webweergaven is de tekst: het klembord uit,
 * een notitie in, en er weer in via "Tekst plakken".
 */
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

const lees = (pad: string) => readFileSync(pad, 'utf8')
const instellingen = lees('src/pages/Settings.tsx')

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

/** Doet alsof de code in de app draait en niet in een browser. */
const alsApp = (naam: 'ios' | 'android') =>
  vi.stubGlobal('window', { Capacitor: { getPlatform: () => naam } })

describe('waarom de downloadknop niets deed', () => {
  it('Capacitor iOS neemt een download niet aan', () => {
    const bron = lees('node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift')
    expect(bron).not.toContain('WKDownloadDelegate')
    expect(bron).not.toContain('shouldPerformDownload')
  })

  it('Capacitor Android ook niet', () => {
    const bron = lees('node_modules/@capacitor/android/capacitor/src/main/java/com/getcapacitor/BridgeWebChromeClient.java')
    expect(bron).not.toContain('setDownloadListener')
    // Maar de bestandskiezer zit er wél, en dat is waarom terugzetten werkte.
    expect(bron).toContain('onShowFileChooser')
  })
})

describe('kanDownloaden', () => {
  it('is waar op het web', async () => {
    const { kanDownloaden } = await import('../engine/klembord')
    expect(kanDownloaden()).toBe(true)
  })

  it('en niet in de app', async () => {
    for (const naam of ['ios', 'android'] as const) {
      alsApp(naam)
      vi.resetModules()
      const { kanDownloaden } = await import('../engine/klembord')
      expect(kanDownloaden(), naam).toBe(false)
    }
  })
})

describe('naar het klembord', () => {
  it('langs de nieuwe weg als die het doet', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { naarKlembord } = await import('../engine/klembord')
    expect(await naarKlembord('hallo')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('hallo')
  })

  /**
   * Een geweigerd klembord mag niet als een fout naar buiten komen: er is nog
   * een oude weg, en als die ook niet kan, een zin op het scherm.
   */
  it('en zegt netjes nee als het geweigerd wordt', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: async () => { throw new Error('nee') } } })
    const { naarKlembord } = await import('../engine/klembord')
    expect(await naarKlembord('hallo')).toBe(false)
  })

  it('en valt niet om als er helemaal geen klembord is', async () => {
    vi.stubGlobal('navigator', {})
    const { naarKlembord } = await import('../engine/klembord')
    await expect(naarKlembord('hallo')).resolves.toBe(false)
  })
})

describe('de twee wegen in Instellingen', () => {
  it('de knop kijkt eerst of downloaden hier iets oplevert', () => {
    expect(instellingen).toContain('kanDownloaden()')
    expect(instellingen).toContain('onClick={toonKopie}')
  })

  it('en de tekst komt uit hetzelfde exportProgress', () => {
    expect(instellingen).toContain('setKopie(exportProgress())')
  })

  /** Hetzelfde `importProgress` als bij een bestand: één weg naar binnen. */
  it('terugzetten uit tekst gaat langs importProgress', () => {
    expect(instellingen).toContain("importProgress(plak ?? '')")
    expect(instellingen).toContain('{t.settings.plakKnop}')
  })

  /**
   * Het veld is `readOnly` en niet `disabled`. Een uitgeschakeld veld is niet
   * te selecteren, en zelf selecteren is precies wat er overblijft wanneer het
   * klembord geweigerd wordt.
   */
  it('en de tekst blijft te selecteren', () => {
    const venster = instellingen.slice(instellingen.indexOf('labelledBy="kopie-titel"'))
    expect(venster.slice(0, 900)).toContain('readOnly')
    expect(venster.slice(0, 900)).not.toContain('disabled')
  })

  /** Wie zich vergiste moet de melding kunnen lezen zonder opnieuw te plakken. */
  it('en een mislukte plakpoging laat het venster staan', () => {
    expect(instellingen).toContain('if (goed) setPlak(null)')
  })
})

describe('de teksten', () => {
  it('staan in alle zes de talen', () => {
    for (const code of LANG_CODES) {
      const s = STRINGS[code].settings
      for (const sleutel of [
        'opslaanGeenBestand', 'kopieTitel', 'kopieUitleg', 'kopieerKnop',
        'gekopieerd', 'kopieerHandmatig', 'plakKnop', 'plakTitel', 'plakUitleg', 'plakBevestig',
      ] as const) {
        expect(s[sleutel], `${code}.${sleutel}`).toBeTruthy()
      }
    }
  })

  /**
   * En het wisscherm verwijst niet meer naar een download. Dat was de ene plek
   * waar de app een knop aanprees die hij niet had.
   */
  it('en het wisscherm belooft geen download meer', () => {
    const woorden = /download|télécharge|herunter|descarga|scarica/i
    for (const code of LANG_CODES) {
      expect(STRINGS[code].settings.wissenUitleg, code).not.toMatch(woorden)
    }
  })
})

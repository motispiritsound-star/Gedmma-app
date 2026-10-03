/**
 * "Wat is er nieuw", per taal, zonder overtikken.
 *
 * Play vraagt die tekst per winkelvermelding en staat 500 tekens toe — het
 * veld kapt niet af, het weigert. Zes talen met de hand overtikken in de
 * console is zes kansen om er een te vergeten of eroverheen te gaan, en
 * niemand die het nakijkt.
 *
 * De teksten stonden al in de repository, in `store/wat-is-nieuw-<versie>.md`.
 * Ze werden alleen nergens gelezen.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { MAX, lees, nieuwsVoor, teLang } from '../../scripts/lib/nieuws.mjs'
import { hoogste, naamVan } from '../../scripts/lib/versies.mjs'

const WORTEL = new URL('../../', import.meta.url).pathname
const TALEN = ['nl-NL', 'fr-FR', 'de-DE', 'es-ES', 'it-IT', 'en-US']

describe('het lezen', () => {
  it('pakt elke taalkop', () => {
    const uit = lees('inleiding\n\n## nl-NL\n\nhallo\n\n## en-US\n\nhello\n')
    expect(uit).toEqual([
      { language: 'nl-NL', text: 'hallo' },
      { language: 'en-US', text: 'hello' },
    ])
  })

  /** De inleiding boven de eerste kop is voor een mens en hoort er niet in. */
  it('en laat alles boven de eerste kop liggen', () => {
    expect(lees('# Kop\n\nuitleg voor een mens\n\n## nl-NL\n\nhallo\n')).toHaveLength(1)
  })

  /** Een kop die geen taalcode is, is een tussenkopje. */
  it('en trapt niet in een gewone tussenkop', () => {
    expect(lees('## Over dit bestand\n\nuitleg\n\n## nl-NL\n\nhallo\n')).toEqual([
      { language: 'nl-NL', text: 'hallo' },
    ])
  })

  it('en overleeft Windows-regeleinden', () => {
    expect(lees('## nl-NL\r\n\r\nhallo\r\n')).toEqual([{ language: 'nl-NL', text: 'hallo' }])
  })

  /**
   * Het bestand breekt af op tachtig tekens omdat dat prettig leest in een
   * editor. In de winkel is dat geen opmaak maar inhoud: een afbreking midden
   * in een zin staat er ook midden in een zin op het scherm van een ouder.
   */
  it('en plakt afgebroken regels binnen een alinea weer aan elkaar', () => {
    const uit = lees('## nl-NL\n\neen zin die\nis afgebroken\n\neen tweede alinea\n')
    expect(uit[0].text).toBe('een zin die is afgebroken\n\neen tweede alinea')
  })

  it('en een versie zonder bestand is geen fout', () => {
    expect(nieuwsVoor(WORTEL, 'bestaat-niet')).toEqual([])
  })
})

describe('de teksten voor 1.3', () => {
  const notities = nieuwsVoor(WORTEL, '1.3')

  it('staan er in alle zes de talen', () => {
    expect(notities.map((n) => n.language).sort()).toEqual([...TALEN].sort())
  })

  /** Het veld kapt niet af, het weigert. */
  it('en passen allemaal in wat Play toestaat', () => {
    expect(teLang(notities)).toEqual([])
    for (const n of notities) expect(n.text.length, n.language).toBeLessThanOrEqual(MAX)
  })

  /** Geen losse regeleinden meer: alleen lege regels tussen alinea's. */
  it('en staan er zonder afgebroken regels in', () => {
    for (const n of notities) {
      for (const stuk of n.text.split('\n\n')) {
        expect(stuk, `${n.language}: ${stuk}`).not.toContain('\n')
      }
    }
  })

  it('en geen enkele is leeg', () => {
    for (const n of notities) expect(n.text.length, n.language).toBeGreaterThan(50)
  })
})

describe('elk wat-is-nieuw-bestand in de repository', () => {
  const bestanden = ['1.1', '1.2', '1.3']

  it('heeft dezelfde zes talen en blijft binnen de grens', () => {
    for (const versie of bestanden) {
      const notities = nieuwsVoor(WORTEL, versie)
      expect(notities.map((n) => n.language).sort(), versie).toEqual([...TALEN].sort())
      expect(teLang(notities), versie).toEqual([])
    }
  })
})

describe('wie het gebruikt', () => {
  const trackScript = readFileSync(new URL('../../scripts/naartrack.mjs', import.meta.url), 'utf8')

  /**
   * Deze test legde de fout vast in plaats van hem te vangen.
   *
   * Hij eiste letterlijk `nieuwsVoor(ROOT, bundel.versionName` -- en dat was
   * precies de regel die niet werkte. Het antwoord van Google op een upload
   * draagt alleen `versionCode`, `sha1` en `sha256`; `versionName` is er nooit
   * in geweest. Dus zocht het script naar `wat-is-nieuw-undefined.md`, vond
   * niets, meldde "deze release krijgt geen notities" en ging door. Versiecode
   * 8 is zo op de testbaan beland zonder één van de zes teksten die klaarlagen.
   *
   * Een test die de vorm van een regel bewaakt in plaats van wat hij oplevert,
   * is een test die een fout kan bevriezen. Daarom kijkt deze nu naar de
   * uitkomst: komt er bij een bestaand versienummer ook werkelijk tekst uit.
   */
  it('de upload naar de track', () => {
    expect(trackScript).toContain("from './lib/nieuws.mjs'")
    expect(trackScript).toContain('releaseNotes: notities')
    // De naam komt uit het register, want de upload geeft hem niet terug.
    expect(trackScript).toContain('naamVan(ROOT, bundel.versionCode)')
    expect(trackScript).not.toContain('nieuwsVoor(ROOT, bundel.versionName')
  })

  /**
   * En de proef op de som: het nummer dat nu als laatste gebouwd is, moet langs
   * dezelfde weg zijn zes teksten opleveren. Dit is de controle die er niet was.
   */
  it('en levert bij de laatst gebouwde versie ook echt tekst op', () => {
    const code = hoogste(WORTEL)
    const naam = naamVan(WORTEL, code)
    expect(naam, `geen naam bij versiecode ${code} in docs/versies.json`).toBeTruthy()
    const notities = nieuwsVoor(WORTEL, naam!)
    expect(notities.length, `geen store/wat-is-nieuw-${naam}.md`).toBe(6)
    for (const n of notities) expect(n.text.length, n.language).toBeLessThanOrEqual(500)
  })

  /** En breekt af bij een te lange tekst, in plaats van Play ernaar te laten kijken. */
  it('en weigert een tekst die te lang is', () => {
    const blok = trackScript.slice(trackScript.indexOf('const lang = teLang(notities)'))
    expect(blok.slice(0, 600)).toContain('process.exit(1)')
  })
})

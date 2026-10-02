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

  it('de upload naar de track', () => {
    expect(trackScript).toContain("from './lib/nieuws.mjs'")
    expect(trackScript).toContain('nieuwsVoor(ROOT, bundel.versionName')
    expect(trackScript).toContain('releaseNotes: notities')
  })

  /** En breekt af bij een te lange tekst, in plaats van Play ernaar te laten kijken. */
  it('en weigert een tekst die te lang is', () => {
    const blok = trackScript.slice(trackScript.indexOf('const lang = teLang(notities)'))
    expect(blok.slice(0, 600)).toContain('process.exit(1)')
  })
})

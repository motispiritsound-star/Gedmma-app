import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * De commando's in de documentatie moeten werken op de machine waar ze
 * geplakt worden.
 *
 * Dat is Windows PowerShell 5.1, en die kent `&&` niet als scheiding. Hij
 * zegt *"The token '&&' is not a valid statement separator in this version"*
 * en doet niets — geen halve uitvoering, geen nuttige foutmelding, alleen een
 * regel die niet is gebeurd.
 *
 * Dat is op zichzelf te overleven, behalve op de dag waarop `GO-LIVE.md` wordt
 * gevolgd. Daar stond het twee keer, in het blok dat de website omzet nadat de
 * app in de winkel staat.
 *
 * Alleen blokken die je plakt tellen. Losse tekst mag `&&` bevatten — daar
 * wordt beschreven wat een script dóét, en npm draait dat zelf met sh.
 */
const WORTEL = path.join(process.cwd())
const MAPPEN = ['docs', 'store/winkel', 'server']

const bestanden = (): string[] => {
  const uit: string[] = []
  for (const map of MAPPEN) {
    const vol = path.join(WORTEL, map)
    let namen: string[] = []
    try { namen = readdirSync(vol) } catch { continue }
    for (const naam of namen) {
      const pad = path.join(vol, naam)
      if (naam.endsWith('.md') && statSync(pad).isFile()) uit.push(pad)
    }
  }
  return uit
}

/** De regels binnen ```bash- en ```sh-blokken, met hun regelnummer. */
const plakregels = (bron: string): [number, string][] => {
  const uit: [number, string][] = []
  let erin = false
  bron.split('\n').forEach((regel, i) => {
    if (regel.startsWith('```')) { erin = /^```(bash|sh|shell|console)\s*$/.test(regel); return }
    if (erin && regel.trim() && !regel.trim().startsWith('#')) uit.push([i + 1, regel])
  })
  return uit
}

describe('de commando\'s in de documentatie', () => {
  const lijst = bestanden()

  it('staan in bestanden die er zijn', () => {
    expect(lijst.length).toBeGreaterThan(5)
  })

  it.each(lijst.map((p) => [path.relative(WORTEL, p), p]))('%s gebruikt geen && om te scheiden', (_naam, pad) => {
    const fout = plakregels(readFileSync(pad, 'utf8'))
      .filter(([, regel]) => regel.includes('&&'))
      .map(([nr, regel]) => `regel ${nr}: ${regel.trim()}`)
    expect(fout, `PowerShell 5.1 leest && niet als scheiding — geef elke opdracht een eigen regel`).toEqual([])
  })

  it('gebruiken curl.exe en niet curl', () => {
    // `curl` is op Windows een alias voor Invoke-WebRequest, met andere
    // vlaggen. `curl -X POST ...` levert daar een foutmelding op over een
    // parameter die niet bestaat.
    for (const pad of lijst) {
      const fout = plakregels(readFileSync(pad, 'utf8'))
        .filter(([, regel]) => /(^|[\s|(])curl\s/.test(regel))
        .map(([nr, regel]) => `regel ${nr}: ${regel.trim()}`)
      expect(fout, path.relative(WORTEL, pad)).toEqual([])
    }
  })

  it('verwijzen niet naar /tmp', () => {
    // Die map bestaat niet op Windows.
    for (const pad of lijst) {
      const fout = plakregels(readFileSync(pad, 'utf8'))
        .filter(([, regel]) => /(^|\s)\/tmp\//.test(regel))
        .map(([nr, regel]) => `regel ${nr}: ${regel.trim()}`)
      expect(fout, path.relative(WORTEL, pad)).toEqual([])
    }
  })
})

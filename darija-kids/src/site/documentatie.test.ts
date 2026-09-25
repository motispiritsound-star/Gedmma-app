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

  /**
   * En ook wat een script zelf afdrukt.
   *
   * `npm run live` sloot af met "wat er nog moet", en daar stond
   * `git add -A && git commit ... && git push` op één regel. Dat is precies
   * de regel die op de dag van de lancering geplakt wordt, als de app al in
   * de winkel staat en de website nog niet om is. De markdown was toen al
   * gerepareerd; de uitvoer van het script niet, want daar keek niets naar.
   */
  it('en ook de opdrachten die de scripts afdrukken', () => {
    const map = path.join(WORTEL, 'scripts')
    const namen = readdirSync(map).filter((n) => n.endsWith('.mjs'))
    expect(namen.length).toBeGreaterThan(5)
    const fout: string[] = []
    for (const naam of namen) {
      readFileSync(path.join(map, naam), 'utf8').split('\n').forEach((regel, i) => {
        if (!regel.includes('console.log') && !regel.includes('console.error')) return
        // Alleen wat tússen de aanhalingstekens staat: `a && b` als gewone
        // javascript-operator in een regel eromheen is geen geplakte opdracht.
        for (const stuk of regel.match(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g) ?? []) {
          if (stuk.includes('&&')) fout.push(`${naam} regel ${i + 1}: ${stuk.trim()}`)
        }
      })
    }
    expect(fout, 'geef elke opdracht een eigen console.log').toEqual([])
  })

  /**
   * En er staat niets tussen punthaken in wat je plakt.
   *
   * Dit ging echt mis. `docs/STAND.md` gaf het adres voor Gumroad als
   * `https://post.darijaforkids.eu/koop?s=<de waarde van KOOP_GEHEIM>`, en dat
   * is één op één in het veld beland — punthaken en al. Gumroad antwoordde
   * "That URL seems to be invalid", en dat was de enige aanwijzing.
   *
   * Zoiets is geen slordigheid van wie het plakt. Een blok met een ```bash
   * eromheen ziet eruit als iets dat werkt, en dan werkt het ook. Hoort er een
   * waarde in die je zelf moet weten, dan is er een opdracht te kort — zie
   * `scripts/koopgeheim.mjs`, dat het hele adres afdrukt.
   *
   * Wat er ná een `#` staat telt niet mee. Dat is commentaar dat uitlegt wat
   * er uit een opdracht komt — `npm run screenshots  # store/screenshots/
   * <taal>/<toestel>/` — en dat is een beschrijving van een map, geen veld.
   */
  it('laten je niets invullen tussen punthaken', () => {
    const zonderUitleg = (regel: string): string => regel.split(/\s#/)[0] ?? regel
    for (const pad of lijst) {
      const fout = plakregels(readFileSync(pad, 'utf8'))
        .filter(([, regel]) => /<[^>]{2,}>/.test(zonderUitleg(regel)))
        .map(([nr, regel]) => `regel ${nr}: ${regel.trim()}`)
      expect(fout, `${path.relative(WORTEL, pad)} — geef een opdracht die het invult`).toEqual([])
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

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

/**
 * De regels binnen een blok dat je kunt plakken, met hun regelnummer.
 *
 * `powershell` stond hier niet bij, en dat is precies de verkeerde om te
 * missen: Adil werkt in PowerShell, dus dát zijn de blokken waar hij uit
 * plakt. Alle controles hieronder — geen `&&`, geen `/tmp`, niets tussen
 * punthaken — keken dus langs de enige blokken die er echt toe doen.
 *
 * Gevonden doordat `docs/ACTIES.md` in een powershell-blok drie keer
 * `<projectmap>` had staan en deze test er vrolijk groen bij bleef.
 */
const plakregels = (bron: string): [number, string][] => {
  const uit: [number, string][] = []
  let erin = false
  bron.split('\n').forEach((regel, i) => {
    if (regel.startsWith('```')) {
      erin = /^```(bash|sh|shell|console|powershell|pwsh|ps1)\s*$/.test(regel)
      return
    }
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
    expect(fout.join('\n'), `PowerShell 5.1 leest && niet als scheiding — geef elke opdracht een eigen regel`).toBe('')
  })

  /**
   * Een plakbare regel draagt zijn eigen voorbereiding mee.
   *
   * `$p` is de projectmap, en een PowerShell-variabele leeft alleen in het
   * venster waarin hij gezet is. Stond die toewijzing bovenaan de lijst en de
   * opdracht driehonderd regels lager, dan werkte die opdracht alleen voor wie
   * de lijst van boven naar beneden las in hetzelfde venster. Wie hem uit een
   * gesprek plakte kreeg:
   *
   *   The variable '$p' cannot be retrieved because it has not been set.
   *
   * Drie keer gebeurd. Het is geen leesfout maar een ontwerpfout: een opdracht
   * die een andere opdracht nodig heeft is een opdracht die stukgaat. Elk blok
   * dat `$p` gebruikt zet hem nu zelf, in dezelfde regel.
   */
  it('zetten $p zelf als ze hem gebruiken', () => {
    for (const pad of lijst) {
      const fout = plakregels(readFileSync(pad, 'utf8'))
        .filter(([, regel]) => regel.includes('$p'))
        // De regel die hem zet is goed, en die hem naar het profiel schrijft ook.
        .filter(([, regel]) => !/\$p\s*=/.test(regel) && !regel.includes('Add-Content'))
        .filter(([, regel]) => !regel.includes('if (-not $p)'))
        .map(([nr, regel]) => `regel ${nr}: ${regel.trim().slice(0, 70)}`)
      expect(
        fout.join('\n'),
        `${path.relative(WORTEL, pad)}: deze regels gebruiken $p zonder hem te zetten. ` +
          'Zet er  if (-not $p) { $p = (Get-ChildItem ...).FullName };  voor.',
      ).toBe('')
    }
  })

  it('gebruiken curl.exe en niet curl', () => {
    // `curl` is op Windows een alias voor Invoke-WebRequest, met andere
    // vlaggen. `curl -X POST ...` levert daar een foutmelding op over een
    // parameter die niet bestaat.
    for (const pad of lijst) {
      const fout = plakregels(readFileSync(pad, 'utf8'))
        .filter(([, regel]) => /(^|[\s|(])curl\s/.test(regel))
        .map(([nr, regel]) => `regel ${nr}: ${regel.trim()}`)
      expect(fout.join('\n'), path.relative(WORTEL, pad)).toBe('')
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
    expect(fout.join('\n'), 'geef elke opdracht een eigen console.log').toBe('')
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
      expect(fout.join('\n'), `${path.relative(WORTEL, pad)} — geef een opdracht die het invult`).toBe('')
    }
  })

  /**
   * En punthaken in wat een script afdrukt.
   *
   * De toets hierboven keek alleen naar markdown, en dat was een gat met een
   * echte bewoner. `maak-sleutel.mjs` drukte af:
   *
   *   storePassword=<het wachtwoord uit wachtwoord.txt naast de sleutel>
   *
   * Dat is een regel om in android/keystore.properties te zetten. Wordt hij
   * letterlijk overgetikt, dan valt de bouw om op een melding over een
   * wachtwoord dat niet klopt — en dan ga je je sleutel verdenken in plaats
   * van die regel. Het script vraagt er nu om en schrijft het bestand zelf.
   *
   * Een `gebruik:`-regel telt niet mee. Dat is een synopsis van de argumenten
   * van een ontwikkelaarsscript, geen opdracht die je plakt; `<bestand>` is
   * daar de gebruikelijke notatie en niet iets om in te vullen.
   */
  it('en ook geen punthaken in wat de scripts afdrukken', () => {
    const map = path.join(WORTEL, 'scripts')
    const fout: string[] = []
    const loop = (m: string): void => {
      for (const ding of readdirSync(m, { withFileTypes: true })) {
        const pad = path.join(m, ding.name)
        if (ding.isDirectory()) { loop(pad); continue }
        if (!ding.name.endsWith('.mjs')) continue
        readFileSync(pad, 'utf8').split('\n').forEach((regel, i) => {
          if (!regel.includes('console.log') && !regel.includes('console.error')) return
          for (const stuk of regel.match(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g) ?? []) {
            if (stuk.includes('gebruik:')) continue
            // `${...}` is een sjabloonwaarde en geen punthaak-plaatshouder.
            if (/<[^>$][^>]{1,}>/.test(stuk.split(/\s#/)[0] ?? stuk)) {
              fout.push(`${path.relative(WORTEL, pad)} regel ${i + 1}: ${stuk.trim()}`)
            }
          }
        })
      }
    }
    loop(map)
    expect(fout.join('\n'), 'laat het script de waarde afdrukken of erom vragen').toBe('')
  })

  it('verwijzen niet naar /tmp', () => {
    // Die map bestaat niet op Windows.
    for (const pad of lijst) {
      const fout = plakregels(readFileSync(pad, 'utf8'))
        .filter(([, regel]) => /(^|\s)\/tmp\//.test(regel))
        .map(([nr, regel]) => `regel ${nr}: ${regel.trim()}`)
      expect(fout.join('\n'), path.relative(WORTEL, pad)).toBe('')
    }
  })
})

/**
 * En de scheidingstekens in de scripts.
 *
 * `sitecheck.mjs` maakte van een bestandspad een adres met
 * `path.relative(MAP, pad)`. Op Linux levert dat `es/index.html` en klopt
 * alles; op Windows `es\index.html`, en dan wordt het adres `/es\`. Dat staat
 * nergens in de sitemap, dus meldde de controle bijna elke bladzijde als
 * vergeten — en omdat het een fout is en geen waarschuwing, stopte `npm run
 * build` daarop. Sinds 25 september, elke keer, alleen bij Adil.
 *
 * CLAUDE.md waarschuwt voor de regeleinden op die machine. Dit is dezelfde
 * soort val: iets wat hier klopt en daar niet, en wat hier nooit omvalt.
 * Vandaar een bewaker die niet naar deze ene regel kijkt maar naar de vorm:
 * wie een pad van `path.relative` in een URL stopt, moet de scheidingstekens
 * omzetten.
 */
/**
 * Regeleinden, aan de bron in plaats van in elk script apart.
 *
 * Git installeert op Windows standaard met "Checkout Windows-style", en dan
 * krijgt elk tekstbestand bij het uitchecken `\r\n`. Een script dat in een
 * bronbestand zoekt naar twee regels met `\n` ertussen vindt daar niets, en
 * meldt dan iets heel anders dan wat er aan de hand is. De controle in GitHub
 * ziet dat nooit: die draait op Linux.
 *
 * `.gitattributes` zet er LF in de werkmap neer, op elk besturingssysteem,
 * ongeacht wat er lokaal is ingesteld. Nagemeten in een kloon met
 * core.autocrlf=true: zonder het bestand komt package.json er met CRLF uit, en
 * het toevoegen gaf nul gewijzigde bestanden omdat git bij het vergelijken
 * normaliseert.
 */
describe('regeleinden', () => {
  const attrs = readFileSync(path.join(WORTEL, '..', '.gitattributes'), 'utf8')

  it('staan in de werkmap op LF, wat de machine ook wil', () => {
    expect(attrs, 'de regel die LF afdwingt is weg').toMatch(/^\*\s+text=auto\s+eol=lf$/m)
  })

  it('laten een Windows-batchbestand met rust', () => {
    // gradlew.bat start Gradle op Windows. Met LF leest cmd.exe hem niet.
    expect(attrs, 'gradlew.bat zou LF krijgen en dan start Gradle daar niet')
      .toMatch(/^\*\.bat\s+text\s+eol=crlf$/m)
  })

  it('raken geluid en platen niet aan', () => {
    // 433 wav-bestanden en 241 webp's; die door een tekstfilter halen is fataal.
    for (const soort of ['wav', 'webp', 'png', 'aab', 'keystore']) {
      expect(attrs, `*.${soort} staat niet als binair gemarkeerd`).toMatch(
        new RegExp(`^\\*\\.${soort}\\s+binary$`, 'm'),
      )
    }
  })
})

describe('paden die een adres worden', () => {
  const scripts = ['sitecheck.mjs', 'make-site.mjs', 'bundelcheck.mjs']

  it('zetten de scheidingstekens om voordat er een URL van wordt gemaakt', () => {
    for (const naam of scripts) {
      const tekst = readFileSync(new URL(`../../scripts/${naam}`, import.meta.url), 'utf8')
      const regels = tekst.split('\n')
      regels.forEach((regel, i) => {
        if (!/path\.relative\(/.test(regel)) return
        // Wordt het resultaat een adres? Dat is te zien aan wat er direct mee
        // gebeurt: een backtick met een schuine streep ervoor, of een replace
        // op `index.html`.
        const vervolg = regels.slice(i, i + 3).join('\n')
        const wordtAdres = /`\/\$\{/.test(vervolg) || /index\\?\.html\$/.test(vervolg)
        if (!wordtAdres) return
        expect(/split\(path\.sep\)\.join\('\/'\)/.test(vervolg),
          `${naam} regel ${i + 1}: hier wordt een pad een adres zonder de `
          + 'scheidingstekens om te zetten. Op Windows geeft path.relative '
          + 'backslashes, en dan klopt het adres niet.').toBe(true)
      })
    }
  })
})

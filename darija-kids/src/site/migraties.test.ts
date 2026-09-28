/**
 * De migraties, en de twee regels die ze bruikbaar houden.
 *
 * De database werd bijgewerkt door `server/schema.sql` in zijn geheel opnieuw
 * te draaien. Dat kon, want daar stond niets anders in dan
 * `CREATE TABLE IF NOT EXISTS` — en precies daarom kon er ook niets bij. Een
 * kolom toevoegen aan een tafel die al bestaat doet met `IF NOT EXISTS`
 * helemaal niets: het mislukt niet, het gebeurt gewoon niet, en de worker
 * verwacht daarna een kolom die er niet is.
 *
 * Zolang de database leeg was, gooide je hem weg en begon je opnieuw. Vanaf de
 * eerste echte bestelling kan dat niet meer, en dan is de goedkope oplossing
 * weg. Vandaar genummerde migraties.
 *
 * Twee dingen daaraan zijn niet uit één bestand af te lezen. Ten eerste: de
 * eerste migratie moet idempotent blijven, want dát is wat de overstap veilig
 * maakt — op de bestaande database is hij een lege handeling. Ten tweede:
 * wrangler moet weten waar ze staan, anders past `npm run schema` niets toe en
 * meldt hij dat ook nog eens opgewekt.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')
const MAP = new URL('../../server/migrations/', import.meta.url)

describe('de migraties', () => {
  const bestanden = readdirSync(MAP).filter((f) => f.endsWith('.sql')).sort()

  it('beginnen bij 0001 en lopen zonder gaten door', () => {
    expect(bestanden.length).toBeGreaterThan(0)
    bestanden.forEach((naam, i) => {
      expect(naam, `${naam} heeft geen nummer vooraan`).toMatch(/^\d{4}_[a-z0-9-]+\.sql$/)
      expect(Number(naam.slice(0, 4)), `na ${bestanden[i - 1] ?? 'het begin'} komt ${naam}`).toBe(i + 1)
    })
    expect(bestanden[0]).toBe('0001_begin.sql')
  })

  it('maken de eerste zo dat hij op een bestaande database niets doet', () => {
    // Dit is de hele reden dat de overstap kan zonder de database aan te raken:
    // 0001 draait over de tafels die er al zijn en verandert er niets aan.
    const begin = readFileSync(new URL('0001_begin.sql', MAP), 'utf8')

    // Per opdracht kijken, niet per regel: `ON DELETE CASCADE` hoort bij een
    // foreign key binnen een CREATE TABLE en is geen verwijdering. Waar het om
    // gaat is waarmee een opdracht begint.
    const opdrachten = begin
      .split('\n').map((r) => r.replace(/--.*$/, '')).join('\n')
      .split(';').map((o) => o.trim()).filter(Boolean)

    expect(opdrachten.length).toBeGreaterThan(0)
    for (const opdracht of opdrachten) {
      expect(opdracht.slice(0, 60), `deze opdracht is niet veilig om opnieuw te draaien: ${opdracht.slice(0, 60)}`)
        .toMatch(/^CREATE (TABLE|INDEX) IF NOT EXISTS/i)
    }
    const maakt = begin.match(/CREATE (TABLE|INDEX)/gi) ?? []
    const veilig = begin.match(/CREATE (TABLE|INDEX) IF NOT EXISTS/gi) ?? []
    expect(veilig.length, 'elke CREATE in 0001 hoort IF NOT EXISTS te zijn').toBe(maakt.length)
  })

  it('worden door wrangler gevonden — bij de binding, niet bovenaan', () => {
    // Deze test toetste `/^migrations_dir = "migrations"$/m`, en verankerde
    // daarmee precies de plaatsing die wrangler weggooit. In wrangler 4.132 is
    // `migrations_dir` een veld van de `[[d1_databases]]`-vermelding; als
    // sleutel op het hoogste niveau antwoordt hij op élke opdracht met
    // "Unexpected fields found in top-level field" en negeert hem.
    //
    // Dat het toch goed ging was toeval: de standaardwaarde is ook
    // `migrations`, opgelost tegen de map van wrangler.toml — dezelfde map. Was
    // die waarde ooit iets anders geworden, dan had wrangler stil in de oude
    // map blijven kijken en was een migratie nooit toegepast, terwijl de uitrol
    // wél doorging. En de waarschuwing gaat naar stderr, dat `wrangler()` bij
    // succes opvangt en weggooit, dus niemand zou hem zien.
    //
    // Bewezen door de regel naar een niet-bestaande map te laten wijzen: op de
    // oude plek gebeurde er niets, op de nieuwe kwam er een harde fout.
    const toml = bron('../../server/wrangler.toml')

    // Het blok van de binding: vanaf [[d1_databases]] tot de volgende kop.
    const start = toml.indexOf('[[d1_databases]]')
    expect(start, 'de d1-binding staat niet meer in wrangler.toml').toBeGreaterThan(-1)
    // Voorbij de kopregel zelf beginnen, anders matcht `^\[` meteen op regel nul.
    const naKop = toml.indexOf('\n', start) + 1
    const rest = toml.slice(naKop)
    const volgende = rest.search(/^\[/m)
    const blok = volgende === -1 ? rest : rest.slice(0, volgende)

    expect(blok.length, 'het blok van de binding is leeg — klopt het knippen nog?').toBeGreaterThan(20)
    expect(blok, 'migrations_dir staat niet bij de d1-binding')
      .toMatch(/^migrations_dir = "migrations"$/m)

    // En nergens anders, want daar doet hij niets.
    const daarbuiten = toml.slice(0, start) + (volgende === -1 ? '' : rest.slice(volgende))
    expect(daarbuiten, 'migrations_dir staat óók buiten de binding, waar wrangler hem negeert')
      .not.toMatch(/^migrations_dir\s*=/m)
  })

  it('worden toegepast door npm run schema, niet meer in één klap uitgevoerd', () => {
    const script = bron('../../scripts/schema.mjs')
    expect(script).toContain("'d1', 'migrations', 'apply'")
    // De oude weg draaide één bestand in zijn geheel. Komt die terug, dan is
    // elke migratie erna stil overgeslagen.
    expect(script).not.toContain("'--file'")

    const pkg = JSON.parse(bron('../../server/package.json')) as { scripts: Record<string, string> }
    expect(pkg.scripts.schema).toContain('migrations apply')
  })

  it('worden niet toegepast als er een leeg bestand tussen staat', () => {
    // De val die `--nieuw` zelf opzet. Wrangler strijkt commentaar weg, plakt
    // er `INSERT INTO d1_migrations` achter, en tekent het bestand af als
    // gedraaid. Nagebouwd op een echte lokale database:
    //
    //   toepassen met alleen commentaar  → d1_migrations kreeg rij 0002
    //   daarna de ALTER TABLE erin gezet → "No migrations to apply!", geen kolom
    //
    // Het nummer is dan op de productiedatabase verbrand terwijl er niets
    // gebeurd is, en de migratie is onbereikbaar.
    const script = bron('../../scripts/schema.mjs')
    expect(script, 'de controle op een lege migratie is weg').toContain('controleerLeeg()')
    expect(script).toMatch(/function opdrachtenIn\(/)
    // De controle hoort vóór het toepassen te staan, niet erna.
    const controle = script.indexOf('controleerLeeg()\n')
    const apply = script.indexOf("'d1', 'migrations', 'apply'")
    expect(controle, 'controleerLeeg wordt niet aangeroepen').toBeGreaterThan(-1)
    expect(controle, 'de controle staat ná het toepassen').toBeLessThan(apply)
  })

  it('vragen het eerst als een migratie bestaande gegevens raakt', () => {
    // `wrangler()` draait met stdio: 'pipe', dus wranglers eigen vraag — "Your
    // database may not be available to serve requests during the migration,
    // continue?" — wordt automatisch met ja beantwoord, en zijn tabel met wat
    // er gaat draaien kwam hier pas op het scherm nádat alles gedraaid was.
    //
    // De vraag hangt aan wát er in staat: CREATE ... IF NOT EXISTS doet op een
    // bestaande database niets, al het andere wel. Daardoor blijft de gewone
    // dag één opdracht zonder vragen en komt de stop precies waar hij hoort.
    const script = bron('../../scripts/schema.mjs')
    expect(script, 'de lijst wordt niet vooraf opgehaald').toContain('function wachtenden(')
    expect(script, 'het onderscheid veilig/spannend is weg').toContain('const spannend =')
    expect(script).toMatch(/if \(!HIER && !JA && wegen\.some\(spannend\)\)/)
    // En zonder terminal niet stilletjes doorgaan.
    expect(script).toContain('process.stdin.isTTY')
  })

  it('schrijven nooit over een bestaande migratie heen', () => {
    // `--nieuw` las het nummer als `Number(naam.slice(0, 4))` en wrangler als
    // `parseInt(naam.split('_')[0], 10)`. Bij `002_land.sql` leest de ene 2 en
    // de andere NaN → 0, en dan deelde --nieuw een nummer uit dat al bestond en
    // kapte het bestand af zonder een woord.
    const script = bron('../../scripts/schema.mjs')
    expect(script).toContain("parseInt(naam.split('_')[0], 10)")
    expect(script, 'er wordt niet gekeken of het bestand al bestaat').toContain('fs.existsSync(pad)')
  })

  it('zeggen in het sjabloon dat een migratie twee keer moet kunnen draaien', () => {
    // Anders dan het oude `d1 execute --file` gaat `migrations apply` niet
    // langs de import-tak van D1 — de enige waar wrangler bij afdrukt dat de
    // database bij een mislukking teruggaat naar zijn oude toestand.
    // `buildMigrationQuery` plakt de aantekening áchter de opdrachten, dus een
    // migratie die halverwege omvalt is niet afgetekend en begint de volgende
    // keer weer bij opdracht één.
    const script = bron('../../scripts/schema.mjs')
    expect(script, 'de waarschuwing in het sjabloon is weg')
      .toContain('SCHRIJF HEM ZO DAT HIJ TWEE KEER MAG DRAAIEN')
  })

  it('zijn niet meer ook als los schema.sql aanwezig', () => {
    // Twee kopieën van hetzelfde schema is precies de drift waar dit tegen is.
    const server = readdirSync(new URL('../../server/', import.meta.url))
    expect(server).not.toContain('schema.sql')
  })
})

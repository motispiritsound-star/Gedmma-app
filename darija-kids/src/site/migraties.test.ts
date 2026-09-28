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

  it('worden door wrangler gevonden', () => {
    const toml = bron('../../server/wrangler.toml')
    expect(toml).toMatch(/^migrations_dir = "migrations"$/m)
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

  it('zijn niet meer ook als los schema.sql aanwezig', () => {
    // Twee kopieën van hetzelfde schema is precies de drift waar dit tegen is.
    const server = readdirSync(new URL('../../server/', import.meta.url))
    expect(server).not.toContain('schema.sql')
  })
})

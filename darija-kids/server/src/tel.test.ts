/**
 * Het eindpunt dat de trechter telt.
 *
 * Twee dingen staan hier op het spel. Het eerste is de witte lijst: dit
 * eindpunt kán niet geautoriseerd worden -- de app mag geen geheim dragen,
 * want alles met een `VITE_`-voorvoegsel staat in de bundel -- dus is de lijst
 * van toegestane namen de enige rem die er is. Het tweede is dat die lijst op
 * twee plekken staat, hier en in `src/engine/tellen.ts`, en dat is precies hoe
 * lijsten uit elkaar gaan lopen.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const bron = readFileSync(new URL('./index.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const app = readFileSync(new URL('../../src/engine/tellen.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** Het blok van de telfunctie, zodat een bewering niet elders in de worker landt. */
const tel = bron.slice(bron.indexOf('async function tel('), bron.indexOf('\n}', bron.indexOf('async function tel(')))

describe('de route', () => {
  it('hangt op /tel en alleen op POST', () => {
    expect(bron).toContain("if (url.pathname === '/tel' && verzoek.method === 'POST')")
  })

  /*
   * Niet onder /portaal/. Dat pad kiest het gesloten CORS-regime --
   * `access-control-allow-origin: env.SITE` met `allow-credentials` -- en
   * vanaf `capacitor://localhost` of een origin `null` weigert de browser dat.
   * Zonder foutmelding op het scherm: alleen een verzoek dat nooit aankomt.
   */
  it('staat op de wortel, zodat het open CORS-regime geldt', () => {
    expect(bron).not.toContain("'/portaal/tel'")
    const poort = bron.match(/const portaal = [\s\S]*?\n/)?.[0] ?? ''
    expect(poort).not.toContain('/tel')
  })
})

describe('de witte lijst', () => {
  /*
   * Dezelfde namen als de app stuurt. Loopt dit uiteen, dan telt de server
   * stil niets -- en dat is de ergste soort fout die deze meting kan hebben,
   * want een teller op nul ziet eruit als een stap waar niemand komt.
   */
  it('kent precies de namen die de app stuurt', () => {
    const uitApp = [...app.matchAll(/^\s+'([a-z_]+)',$/gm)].map((m) => m[1])
    const uitServer = [...(tel.match(/const NAMEN = new Set\(\[[\s\S]*?\]\)/)?.[0] ?? '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1])
    expect(uitApp.length).toBeGreaterThan(5)
    expect([...uitServer].sort()).toEqual([...uitApp].sort())
  })

  it('kent precies de treden die de app stuurt', () => {
    const uitApp = (app.match(/export const TREDEN = \[([^\]]+)\]/)?.[1] ?? '').match(/\d+/g) ?? []
    const uitServer = (tel.match(/const TREDEN = new Set\(\[([^\]]+)\]\)/)?.[1] ?? '').match(/\d+/g) ?? []
    expect(uitApp.length).toBe(10)
    expect(uitServer).toEqual(uitApp)
  })

  it('weigert alles wat er niet in staat, zonder te zeggen dat het weigert', () => {
    // Een eindpunt dat anders antwoordt op geldige en ongeldige namen,
    // vertelt een vreemde welke namen bestaan.
    expect(tel).toContain('if (!bekend) return json({ ok: true })')
  })
})

describe('wat er bewaard wordt', () => {
  it('telt op in plaats van een rij per gebeurtenis te schrijven', () => {
    expect(tel).toContain('ON CONFLICT (naam, dag, taal, platform, versie) DO UPDATE SET aantal = aantal + 1')
  })

  it('bindt alles en plakt niets in de query', () => {
    // Een naam van buiten in een string geplakt is een injectie; `bind` niet.
    expect(tel).toContain('.bind(naam, dag, taal, platform, versie)')
    expect(tel).not.toMatch(/INSERT[\s\S]*\$\{/)
  })

  it('bewaart geen ip en geen hash daarvan', () => {
    expect(tel).not.toContain('ipHash')
    expect(tel).not.toContain('cf-connecting-ip')
    expect(tel).not.toContain('ZOUT')
  })

  it('normaliseert taal, platform en versie naar een vaste verzameling', () => {
    // Anders staat er ongefilterde invoer van buiten in een overzicht.
    expect(tel).toContain("uit(body.l, ['nl', 'fr', 'de', 'es', 'it', 'en'])")
    expect(tel).toContain("uit(body.p, ['ios', 'android'])")
    expect(tel).toMatch(/versie = typeof body\.v === 'string' && \/\^/)
  })

  it('weigert een dag die ver van vandaag ligt', () => {
    // Een klok die verkeerd staat mag geen rij in 1970 of 2098 maken.
    expect(tel).toContain('const week = 7 * 24 * 3600 * 1000')
    expect(tel).toMatch(/Math\.abs\(stip - Date\.now\(\)\) > week/)
  })
})

describe('wat er niet gebeurt', () => {
  it('geeft altijd 200, ook als er niets geteld is', () => {
    // Een foutcode laat een cliënt opnieuw proberen op iets wat misschien al
    // gelukt is, en dat is bij een teller een dubbele telling.
    const codes = [...tel.matchAll(/json\(\{[^}]*\}(?:,\s*(\d{3}))?\)/g)].map((m) => m[1])
    expect(codes.length).toBeGreaterThan(3)
    expect(codes.every((c) => c === undefined)).toBe(true)
  })

  it('zet de naam van buiten niet in een logregel', () => {
    // Dat zou ongefilterde invoer in de logboeken van Cloudflare zetten, met
    // een eigen bewaartermijn en zonder verwijderknop per regel.
    expect(tel).not.toContain('console.')
  })
})

describe('de migratie', () => {
  const sql = readFileSync(new URL('../migrations/0002_tel.sql', import.meta.url), 'utf8')

  it('mag twee keer draaien', () => {
    // Wrangler zet de aantekening in d1_migrations áchter de opdrachten, dus
    // een halve mislukking begint de volgende keer weer bij opdracht één.
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS teller')
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS teller_dag')
  })

  it('heeft geen kolom waarin een persoon kan zitten', () => {
    const kolommen = sql.slice(sql.indexOf('CREATE TABLE'), sql.indexOf(');')).toLowerCase()
    for (const verboden of ['ip', 'hash', 'email', 'id ', 'sessie', 'token']) {
      expect(kolommen, verboden).not.toContain(verboden)
    }
  })
})

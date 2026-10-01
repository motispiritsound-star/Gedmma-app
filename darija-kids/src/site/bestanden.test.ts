/**
 * Bestanden waar de app naar wijst en die er dus moeten zijn.
 *
 * Code die naar een ontbrekend bestand wijst geeft geen fout: de browser haalt
 * niets op, en wat je ziet is een leeg vlak. Voor de meeste dingen in deze app
 * maakt dat niet veel uit — een ontbrekende opname valt terug op de
 * spraakmachine, en dat is met opzet zo gebouwd.
 *
 * Voor twee dingen geldt dat niet.
 *
 * Het e-boek is een product van € 14,99 dat in de app zelf opengaat. Wijst
 * `ebookFile(lang)` naar een pdf die er niet is, dan krijgt een koper een leeg
 * kader en verder niets: geen melding, geen uitweg. Er zijn zes talen, dus zes
 * manieren waarop dat kan gebeuren, en vijf ervan merk je niet als je zelf in
 * het Nederlands test.
 *
 * En de pictogrammen: die staan in `index.html` en in de manifest, en een
 * ontbrekende levert een app zonder icoon op het beginscherm op.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ebookFile } from '../engine/billing'
import { LANG_CODES } from '../i18n/languages'

const WORTEL = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const PUBLIEK = path.join(WORTEL, 'public')

describe('het e-boek', () => {
  it.each(LANG_CODES)('heeft een pdf voor %s', (taal) => {
    const pad = path.join(PUBLIEK, ebookFile(taal))
    expect(existsSync(pad), `${ebookFile(taal)} ontbreekt`).toBe(true)
  })

  /**
   * En het is echt een pdf. Een leeg bestand of een half geschreven kopie
   * bestaat wél en toont niets — dat is dezelfde lege bladzijde met een andere
   * oorzaak.
   */
  it.each(LANG_CODES)('levert een leesbare pdf voor %s', (taal) => {
    const d = readFileSync(path.join(PUBLIEK, ebookFile(taal)))
    expect(d.subarray(0, 5).toString('latin1'), 'begint niet met %PDF-').toBe('%PDF-')
    expect(d.length, 'verdacht klein voor een boek').toBeGreaterThan(100_000)
  })
})

describe('de lettertypen', () => {
  const css = readFileSync(path.join(WORTEL, 'src', 'index.css'), 'utf8')
  const bestanden = [...new Set([...css.matchAll(/url\("\/(fonts\/[^"]+)"\)/g)].map((m) => m[1]!))]

  /**
   * Ze staan in de app en worden niet opgehaald, en dat is de bedoeling: de
   * app werkt in het vliegtuig en in Marokko zonder bereik. Een lettertype dat
   * van een server komt zou juist het Arabisch kapotmaken op precies het
   * moment dat de app zegt dat hij offline werkt.
   */
  it('komen uit de app zelf en niet van een server', () => {
    expect(bestanden.length).toBeGreaterThanOrEqual(4)
    expect(css).not.toMatch(/@import\s+url\(["']?https?:/)
    expect(css).not.toMatch(/src:\s*url\(["']?https?:/)
  })

  it.each(bestanden)('%s bestaat', (f) => {
    expect(existsSync(path.join(PUBLIEK, f)), `${f} staat niet in public/`).toBe(true)
  })

  /**
   * En het Arabisch heeft zijn eigen gezicht nodig. Valt `Noto Naskh Arabic`
   * weg, dan tekent het toestel het schrift in een schreefletter die er voor
   * een kind anders uitziet dan wat het moet leren.
   */
  it('bevatten het Arabische gezicht in twee diktes', () => {
    expect(bestanden.filter((f) => /naskh|arabic/i.test(f))).toHaveLength(2)
  })
})

describe('wat `index.html` en de manifest noemen', () => {
  const html = readFileSync(path.join(WORTEL, 'index.html'), 'utf8')
  const manifest = readFileSync(path.join(PUBLIEK, 'manifest.webmanifest'), 'utf8')

  /** Elk pad dat met een `/` begint, uit allebei de bestanden. */
  const paden = [...new Set(
    [...html.matchAll(/"(\/[a-z0-9./_-]+\.(?:png|svg|webmanifest))"/gi),
     ...manifest.matchAll(/"(\/[a-z0-9./_-]+\.(?:png|svg|webmanifest))"/gi)].map((m) => m[1]!),
  )]

  it('noemt er een stuk of wat, anders bewijst de rest niets', () => {
    expect(paden.length).toBeGreaterThanOrEqual(6)
  })

  it.each(paden)('%s bestaat', (p) => {
    expect(existsSync(path.join(PUBLIEK, p.slice(1))), `${p} staat niet in public/`).toBe(true)
  })

  /** De manifest moet ook leesbaar zijn; een komma te veel maakt hem stil onbruikbaar. */
  it('heeft een manifest die klopt', () => {
    const m = JSON.parse(manifest) as { name?: string; icons?: unknown[]; start_url?: string }
    expect(m.name).toBeTruthy()
    expect(m.start_url).toBeTruthy()
    expect(Array.isArray(m.icons) && m.icons.length).toBeTruthy()
  })
})

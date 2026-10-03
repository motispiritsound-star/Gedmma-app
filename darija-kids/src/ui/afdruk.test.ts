/**
 * Een diploma dat je niet kunt ophangen is een plaatje.
 *
 * Er komt geen pdf-bibliotheek bij: `window.print()` zit in elke browser en in
 * de WebView van Capacitor, en Android en iOS hangen er hun eigen
 * afdrukvenster aan — met "Opslaan als pdf" erin. Dat weegt nul byte, en het
 * enige dat het nodig heeft is een afdrukstijl die klopt.
 *
 * Die stijl is drie keer misgegaan en dat is het hele bestaansrecht van dit
 * bestand:
 *
 * 1. De eerste afdruk uit de donkere stand was een vel van #0d1220 — een
 *    bladzijde vol inkt met een diploma erin dat niemand wil ophangen. De
 *    tokens worden nu in `@media print` opnieuw gezet, en dat blok staat
 *    onderaan index.css zodat het van de twee donkere blokken erboven wint.
 * 2. Daarna kwam de kopbalk met drie tellers en een hangslot boven op elk vel
 *    terecht, en de tabbalk onderaan. Allebei dragen nu `niet-op-papier`.
 * 3. En zonder `break-after: page` stonden zeventien diploma's achter elkaar
 *    doorgedrukt, met drie halve diploma's per vel.
 *
 * Een afdruk is niet in een test te zien. Wat hier staat is dus de stijl zelf,
 * regel voor regel — en de meting staat in de toelichting, zoals overal.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string): string =>
  readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** Zonder commentaar, anders toetst een test zijn eigen toelichting. */
const css = lees('../index.css').replace(/\/\*[\s\S]*?\*\//g, '')
/** Alles vanaf het afdrukblok: daar hoort het in te staan en niet eerder. */
const afdruk = css.slice(css.indexOf('@media print'))

describe('wat er wel en niet op papier komt', () => {
  /**
   * Buiten elke `@layer`, zoals `.ar` en `.btn3d` erboven. Een regel zonder
   * laag wint van een Tailwind-klasse ernaast, en dat is hier de bedoeling: een
   * `hidden` of een `block` op hetzelfde element mag dit niet omzetten.
   */
  it('het afdrukblad staat op het scherm niet in de weg', () => {
    expect(css).toMatch(/^\.op-papier \{ display: none; \}$/m)
    expect(afdruk).toMatch(/\.op-papier \{ display: block; \}/)
  })

  it('en wat niet op papier hoort gaat alleen op papier weg', () => {
    expect(afdruk).toMatch(/\.niet-op-papier \{ display: none !important; \}/)
    // Buiten de afdrukstijl bestaat de klasse niet: hij mag op het scherm
    // niets verbergen.
    expect(css.slice(0, css.indexOf('@media print'))).not.toContain('.niet-op-papier')
  })

  /** De drie plekken die op elk vel terugkwamen. */
  it('de kopbalk, de tabbalk en een paneel dragen de klasse', () => {
    expect(lees('./TopBar.tsx')).toContain('className="niet-op-papier sticky top-0')
    expect(lees('../App.tsx')).toContain('className="niet-op-papier fixed inset-x-0 bottom-0')
    expect(lees('./kit.tsx')).toContain('className="niet-op-papier fixed inset-0 z-50')
  })

  it('de bladzijde zelf verbergt zijn schermkant', () => {
    const plank = lees('../pages/Diplomas.tsx')
    expect(plank).toContain('<div className="niet-op-papier">')
    expect(plank).toContain('<div className="op-papier">')
  })
})

describe('zwart op wit, ook uit de donkere stand', () => {
  /** De fout uit punt 1: een vel van #0d1220. */
  it('zet het papier op wit en de inkt op zwart', () => {
    expect(afdruk).toContain('--surface: #ffffff;')
    expect(afdruk).toContain('--ink: #000000;')
    expect(afdruk).toMatch(/body \{\s*background: #ffffff;\s*color: #000000;/)
  })

  /**
   * Twee keer, want de donkere stand komt op twee manieren binnen: via
   * `data-theme="dark"` als iemand hem zelf koos, en via de voorkeur van het
   * toestel. Alleen de eerste afvangen laat de helft van de gevallen staan —
   * dezelfde twee voorwaarden als bij `@custom-variant dark` bovenin.
   */
  it('vangt de gekozen stand en die van het toestel allebei af', () => {
    expect(afdruk).toContain(':root[data-theme="dark"]')
    expect(afdruk).toContain(':root:not([data-theme="light"])')
  })

  /**
   * `--ink-soft` uit de donkere stand (#9aa3bb) haalt op wit 2,6 op 1, en dat
   * is de datum onder een handtekening. #3f3f46 haalt 10,0.
   */
  it('zet ook de zachte inkt op een waarde die op wit leesbaar is', () => {
    expect(afdruk).toContain('--ink-soft: #3f3f46;')
    expect(afdruk).not.toContain('--ink-soft: #9aa3bb')
  })

  /** Het blok staat onderaan, anders winnen de donkere blokken erboven. */
  it('staat achter de twee donkere blokken in het bestand', () => {
    expect(css.indexOf('@media print')).toBeGreaterThan(css.lastIndexOf(':root[data-theme="dark"] :where(a, button'))
  })
})

describe('één diploma per vel', () => {
  /** De fout uit punt 3: drie halve diploma's per vel. */
  it('breekt na elk blad en niet middenin', () => {
    expect(afdruk).toMatch(/\.afdrukblad \{[\s\S]*?break-inside: avoid;/)
    expect(afdruk).toMatch(/\.afdrukblad \{[\s\S]*?break-after: page;/)
  })

  /** Anders komt er achter het laatste diploma een leeg vel uit de printer. */
  it('laat achter het laatste geen leeg vel', () => {
    expect(afdruk).toContain('.afdrukblad:last-child { break-after: auto; }')
  })

  it('kiest een staand A4 met een marge', () => {
    expect(afdruk).toMatch(/@page \{[\s\S]*?size: A4 portrait;/)
    expect(afdruk).toMatch(/@page \{[\s\S]*?margin: 14mm;/)
  })

  /**
   * Een vel is hoog en een diploma is dat niet. Zonder dit stond het bovenaan
   * geplakt met twee derde van het vel leeg eronder.
   */
  it('zet het diploma in het midden van het vel', () => {
    expect(afdruk).toMatch(/\.afdrukblad \{[\s\S]*?justify-content: center;/)
  })

  /**
   * De voorbladzijde komt er pas bij vanaf twee diploma's. Bij één vel is een
   * titelblad ervoor een lege bladzijde met een naam erop.
   */
  it('drukt een voorbladzijde alleen bij meer dan één diploma', () => {
    expect(lees('../pages/Diplomas.tsx')).toContain('{bladen.length > 1 && (')
  })
})

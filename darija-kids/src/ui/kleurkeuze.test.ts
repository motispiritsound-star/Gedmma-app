/**
 * De kleur die een gebruiker voor zichzelf kiest.
 *
 * De app zag er voor iedereen hetzelfde uit: één scherm aan het begin met een
 * talenlijst, en daarna een uil als avatar die niemand gekozen had en
 * "Leerling" waar een naam hoort. De naam zat in Instellingen, de avatar in
 * Profiel — twee schermen waar je pas komt als je weet dat ze bestaan.
 *
 * Nu kiest iemand aan het begin een naam, een dier, een kleur en licht of
 * donker. Die kleur raakt wat van jou is: de knop waarmee je verder gaat, de
 * balk die je vooruitgang toont, je avatar zelf.
 *
 * Wat hij níét raakt is groen-is-goed en rood-is-fout. Die betekenen iets, en
 * een kind dat zijn eigen "goed" naar oranje zet kan daarna niet meer zien of
 * hij het goed had. Dat is geen smaak maar betekenis, en die kies je niet.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ACCENTEN, ACCENTKLEUR, AVATARS } from '../engine/store'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const css = lees('../index.css')
const welkom = lees('./Welcome.tsx')
const kit = lees('./kit.tsx')
const app = lees('../App.tsx')
const instellingen = lees('../pages/Settings.tsx')
const profiel = lees('../pages/Profile.tsx')

/** De verhouding tussen twee kleuren, zoals WCAG hem rekent. */
function contrast(a: string, b: string): number {
  const kanaal = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const recht = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const licht = (h: string) => {
    const [r, g, bl] = kanaal(h).map(recht) as [number, number, number]
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const [hoog, laag] = [licht(a), licht(b)].sort((p, q) => q - p) as [number, number]
  return (hoog + 0.05) / (laag + 0.05)
}

describe('de vier kleuren', () => {
  it('staan alle vier in de stylesheet', () => {
    for (const a of ACCENTEN) {
      if (a === 'saffraan') continue // die staat op :root, zonder stempel
      expect(css, a).toContain(`:root[data-accent="${a}"]`)
    }
  })

  /**
   * Saffraan krijgt met opzet geen stempel: dat is hoe de app er altijd uitzag,
   * dus een opslag van voor deze versie ziet er precies zo uit als gisteren.
   */
  it('en saffraan is wat `:root` al zegt', () => {
    expect(css).toContain('--accent-500: #f59e0b;')
    expect(css).not.toContain(':root[data-accent="saffraan"]')
    expect(app).toContain("if (accent === 'saffraan') root.removeAttribute('data-accent')")
  })

  /** De bolletjes in de app en de tokens in de CSS horen dezelfde te zijn. */
  it('en het bolletje heeft de kleur die de app ook echt gebruikt', () => {
    for (const a of ACCENTEN) {
      const blok = a === 'saffraan'
        ? css.slice(css.indexOf('--accent-400'), css.indexOf('color-scheme: light'))
        : css.slice(css.indexOf(`:root[data-accent="${a}"]`), css.indexOf('}', css.indexOf(`:root[data-accent="${a}"]`)))
      expect(blok.toLowerCase(), a).toContain(`--accent-500: ${ACCENTKLEUR[a].toLowerCase()};`)
    }
  })

  /**
   * De knop draagt donkere inkt op de kleur. Dat moet voor alle vier kloppen,
   * anders kiest een kind een kleur waarop zijn eigen knop onleesbaar wordt.
   * De zwakste is terracotta met 5,55 op 1; de norm is 4,5.
   */
  it('en de tekst op de knop is op alle vier leesbaar', () => {
    for (const a of ACCENTEN) {
      expect(contrast(ACCENTKLEUR[a], '#080c17'), a).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('wat de kleur raakt', () => {
  it('de knop waarmee je verder gaat', () => {
    expect(kit).toContain('bg-[var(--accent-500)] text-[var(--accent-ink)] border-[var(--accent-600)]')
  })

  it('de voortgangsbalk, als hij om de kleur vraagt', () => {
    expect(kit).toContain("tone === 'accent' ? 'bg-[var(--accent-500)]'")
  })

  it('en je avatar op het profiel', () => {
    expect(profiel).toContain('from-[var(--accent-400)] to-[var(--accent-600)]')
  })

  /**
   * En niet de betekenis. `mint` is vooruitgang en `zellige` een reeks; die
   * blijven staan waar ze staan, ook als ze toevallig ook een kleurkeuze zijn.
   */
  it('maar niet groen-is-goed en rood-is-fout', () => {
    expect(kit).toContain("tone === 'mint' ? 'bg-mint-500'")
    const varianten = kit.slice(kit.indexOf('const VARIANTS'), kit.indexOf('const PRESS'))
    expect(varianten).toContain('danger')
    expect(varianten).not.toContain('danger: \'bg-[var(--accent')
  })
})

describe('het startscherm', () => {
  it('heeft vier stappen', () => {
    expect(welkom).toContain('const [stap, setStap] = useState(0)')
    for (const n of [0, 1, 2, 3]) expect(welkom).toContain(`{stap === ${n} && (`)
  })

  /**
   * De enige keuze in het begin die het leren zelf verandert: `showScript` en
   * `showTranslit` bepalen wat er op elk woordkaartje en in elke oefening
   * staat. Een ouder weet meteen wat zijn kind kan lezen.
   */
  it('en vraagt hoe je meeleest, met alle drie de combinaties', () => {
    const stap = welkom.slice(welkom.indexOf('{stap === 2 && ('), welkom.indexOf('{stap === 3 && ('))
    expect(stap).toContain("setSetting('showScript', script)")
    expect(stap).toContain("setSetting('showTranslit', translit)")
    for (const id of ['allebei', 'arabisch', 'klanken']) expect(stap, id).toContain(`'${id}'`)
  })

  /**
   * En niet het dagdoel. Wat "30 XP per dag" betekent weet je pas na een week;
   * dat vragen vóór de eerste les is een keuze zonder informatie.
   */
  it('maar niet het dagdoel', () => {
    expect(welkom).not.toContain('dailyGoal')
  })

  /** De vlag die dit scherm sluit gaat pas om op de laatste stap. */
  it('en sluit pas aan het eind', () => {
    const laatste = welkom.slice(welkom.indexOf('{stap === 2 && ('))
    expect(laatste).toContain('setState({ langPicked: true })')
    expect(welkom.slice(0, welkom.indexOf('{stap === 2 && ('))).not.toContain('langPicked: true')
  })

  /** Wat je kiest staat meteen in de staat, dus halverwege afhaken kost niets. */
  it('en bewaart elke keuze meteen', () => {
    expect(welkom).toContain('setState({ name: e.target.value.slice(0, 24) })')
    expect(welkom).toContain('setState({ avatar: a })')
    expect(welkom).toContain("setSetting('accent', a)")
    expect(welkom).toContain("setSetting('theme', w)")
  })

  /** De prijs hoort vóór de eerste les, niet bij het eerste slot. */
  it('en noemt wat het kost voordat je begint', () => {
    const laatste = welkom.slice(welkom.indexOf('{stap === 3 && ('))
    expect(laatste).toContain('t.welcome.plan(TRIAL_DAYS')
  })
})

describe('de lijsten staan op één plek', () => {
  it('de dieren', () => {
    expect(AVATARS.length).toBeGreaterThanOrEqual(8)
    for (const bron of [welkom, profiel]) expect(bron).toContain('AVATARS.map')
    // en nergens nog een eigen kopie
    for (const bron of [welkom, profiel]) expect(bron).not.toContain("const AVATARS = [")
  })

  it('en de kleuren', () => {
    for (const bron of [welkom, instellingen]) expect(bron).toContain('ACCENTKLEUR[a]')
    for (const bron of [welkom, instellingen]) expect(bron).not.toMatch(/const (KLEUR|ACCENTKLEUR): Record/)
  })
})

describe('de teksten', () => {
  it('staan in alle zes de talen', () => {
    for (const code of LANG_CODES) {
      const w = STRINGS[code].welcome
      expect(w.wieTitel, code).toBeTruthy()
      expect(w.wieBody, code).toBeTruthy()
      expect(w.kleurTitel, code).toBeTruthy()
      expect(w.kleurBody, code).toBeTruthy()
      expect(w.schriftTitel, code).toBeTruthy()
      expect(w.schriftBody, code).toBeTruthy()
      for (const k of ['arabisch', 'klanken', 'allebei'] as const) {
        expect(w.schriftKeuze[k], `${code} ${k}`).toBeTruthy()
      }
      for (const a of ACCENTEN) expect(STRINGS[code].settings.accenten[a], `${code} ${a}`).toBeTruthy()
    }
  })

  /** Zes keer dezelfde zin is geen vertaling. */
  it('en zijn echt vertaald', () => {
    const titels = LANG_CODES.map((c) => STRINGS[c].welcome.wieTitel)
    expect(new Set(titels).size).toBe(LANG_CODES.length)
  })
})

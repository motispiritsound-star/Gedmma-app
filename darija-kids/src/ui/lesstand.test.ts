/**
 * Wat een kind ziet als het het fout had.
 *
 * Niets, was het antwoord. De aangetikte knop werd rood, de andere drie gingen
 * `disabled` en `.btn3d:disabled` zet de dekking op 50% — dus het góéde
 * antwoord, dat gewoon op het scherm stond, verbleekte samen met de twee die
 * er niet toe deden. Wie het fout had moest in de balk onderaan lézen wat het
 * dan wel was.
 *
 * Nu zijn er zes standen. `onthuld` is de nieuwe: het juiste antwoord dat je
 * niet aantikte, en dat licht op in plaats van weg te zakken.
 *
 * En de rand die "dit was goed" zei, was de slechtst zichtbare rand van het
 * scherm. `mint-500` op een witte kaart haalt 2,28 op 1, en de norm voor een
 * rand die betekenis draagt is 3. Nagerekend bij het nalezen van deze patch,
 * en het klopte: de kleur die het belangrijkste zei was de kleur die je het
 * minst zag.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const oefeningen = lees('./exercises.tsx')
const css = lees('../index.css')

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

/** Een kleur uit `index.css` bij zijn naam. */
const token = (naam: string): string => {
  const m = css.match(new RegExp(`--color-${naam}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`${naam} staat niet in index.css`)
  return m[1]!
}

describe('de zes standen van een antwoord', () => {
  it('bestaan alle zes', () => {
    expect(oefeningen).toContain("type Stand = 'open' | 'gekozen' | 'goed' | 'onthuld' | 'fout' | 'weg'")
  })

  /**
   * De kern. Had je het fout, dan is het juiste antwoord `onthuld` en niet
   * `weg` — want het stond er, en een kind hoort het te zien zonder te lezen.
   */
  it('en het juiste antwoord wordt onthuld, ook als je het niet aantikte', () => {
    expect(oefeningen).toContain("id === answer ? (chosen === id ? 'goed' : 'onthuld')")
  })

  /** Alleen wat geen van beide is zakt weg. */
  it('terwijl alleen de rest wegzakt', () => {
    expect(oefeningen).toMatch(/chosen === id \? 'fout'\s*:\s*'weg'/)
  })

  /**
   * `disabled` zette de dekking van alle vier tegelijk; dat is precies waarom
   * het juiste antwoord meeverbleekte. Per vakje kiezen kan alleen zonder.
   */
  it('en de knoppen zijn niet meer `disabled`, want dat kleurde ze alle vier gelijk', () => {
    const vakje = oefeningen.slice(oefeningen.indexOf('const vast = stand'), oefeningen.indexOf('const vast = stand') + 900)
    expect(vakje).toContain('aria-disabled')
    expect(vakje).not.toMatch(/\sdisabled=\{/)
  })
})

describe('de kleuren die betekenis dragen', () => {
  const kaart = '#ffffff'
  const gezonken = '#f4ece1'
  const donker = '#080c17'

  /**
   * 3 op 1 is de norm voor iets wat geen tekst is maar wat je wél moet kunnen
   * onderscheiden. `mint-500` haalde 2,28.
   */
  it('de rand om het juiste antwoord haalt 3 op 1 op een witte kaart', () => {
    expect(contrast(token('mint-600'), kaart)).toBeGreaterThanOrEqual(3)
  })

  it('en de voortgang haalt het op het gezonken vlak', () => {
    expect(contrast(token('mint-700'), gezonken)).toBeGreaterThanOrEqual(3)
  })

  it('en in de donkere stand ook', () => {
    expect(contrast(token('mint-400'), donker)).toBeGreaterThanOrEqual(3)
  })

  /** De kleuren die het niet haalden, staan er niet meer als rand of balk. */
  it('en de kleur die het niet haalde wordt er niet meer voor gebruikt', () => {
    expect(contrast(token('mint-500'), kaart)).toBeLessThan(3)
    expect(oefeningen).not.toContain('border-mint-500')
  })
})

describe('de rustige stand', () => {
  /**
   * Twee schakelaars, en geen van beide dekte dit. `MotionConfig` luistert naar
   * het toestel en de regel in index.css zet overgangen stil — maar een kaart
   * die naar je vinger kantelt is een stánd, geen animatie, en die bleef staan.
   */
  it('leest allebei de voorkeuren, want geen van beide dekt een stand', () => {
    expect(oefeningen).toContain('export function useRustig(): boolean')
    const lijf = oefeningen.slice(oefeningen.indexOf('export function useRustig'), oefeningen.indexOf('export function useRustig') + 220)
    expect(lijf).toContain('useReducedMotion()')
    expect(lijf).toContain("s.settings.motion) !== 'full'")
  })

  /** En de viering gaat eruit als het uit moet. */
  it('en de ring bij een goed antwoord gaat eruit', () => {
    expect(oefeningen).toContain("stand === 'goed' && !rustig")
  })
})

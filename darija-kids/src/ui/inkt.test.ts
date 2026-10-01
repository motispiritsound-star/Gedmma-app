/**
 * De inkt waarmee een kind een letter natekent.
 *
 * Die stond met de hand in `Scribe.tsx` als `rgba(13,148,136,.85)` — de oude
 * waarde van `--color-zellige-600`. Toen die tint donkerder werd voor het
 * contrast, bleef de inkt achter: precies dezelfde drift als op het
 * foutscherm, en net zo onzichtbaar bij het schrijven.
 *
 * Gemeten op het witte tekenvak haalde die inkt **2,99 op 1**. De norm voor
 * iets wat geen tekst is maar je wél moet kunnen zien is 3. Een kind dat zijn
 * eigen haal niet terugziet, kan de oefening niet doen — en natekenen is een
 * van de twee dingen die deze app met het Arabische schrift doet.
 *
 * Nagemeten door de lagen echt over elkaar te tekenen en de pixel terug te
 * lezen: 4,11 in de lichte stand en 8,00 in de donkere. Die tweede is het
 * bewijs dat één vaste kleur niet kon kloppen: op een donker vak hoort de
 * inkt juist licht te zijn.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const css = lees('../index.css')
const scribe = lees('./Scribe.tsx')

/** Hoeveel de haal doorlaat. Staat zo in `Scribe.tsx`. */
const DOORZICHT = 0.85

const rgb = (hex: string): [number, number, number] => {
  const h = hex.length === 4 ? `#${hex[1]!}${hex[1]!}${hex[2]!}${hex[2]!}${hex[3]!}${hex[3]!}` : hex
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}
const over = (voor: number[], alfa: number, achter: number[]): number[] =>
  [0, 1, 2].map((i) => voor[i]! * alfa + achter[i]! * (1 - alfa))
const lum = (c: number[]): number => {
  const f = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(c[0]!) + 0.7152 * f(c[1]!) + 0.0722 * f(c[2]!)
}
const verhouding = (a: number[], b: number[]): number => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x! + 0.05) / (y! + 0.05)
}

/** De waarde van een variabele binnen één themablok. */
const uitBlok = (blok: string, naam: string): string => {
  const begin = css.indexOf(`${blok} {`)
  const stuk = css.slice(begin, css.indexOf('\n}', begin))
  return stuk.match(new RegExp(`${naam}:\\s*(#[0-9a-f]{3,8})`, 'i'))?.[1] ?? ''
}

describe('de haal moet zichtbaar zijn op het vak eronder', () => {
  it.each([
    ['de lichte stand', ':root'],
    ['de donkere stand', ':root[data-theme="dark"]'],
  ])('haalt in %s de drie op één', (_naam, blok) => {
    const inkt = uitBlok(blok, '--inkt-tekenen')
    const vak = uitBlok(blok, '--surface-raised')
    expect(inkt, `--inkt-tekenen ontbreekt in ${blok}`).not.toBe('')
    expect(vak, `--surface-raised ontbreekt in ${blok}`).not.toBe('')
    expect(verhouding(over(rgb(inkt), DOORZICHT, rgb(vak)), rgb(vak))).toBeGreaterThanOrEqual(3)
  })

  /**
   * En in de donkere stand hoort de inkt lichter te zijn dan het vak. Eén
   * vaste kleur kan dat niet, en dat is waarom hij hier niet meer vastzit.
   */
  it('kiest in het donker een lichte inkt', () => {
    const donker = rgb(uitBlok(':root[data-theme="dark"]', '--inkt-tekenen'))
    const vak = rgb(uitBlok(':root[data-theme="dark"]', '--surface-raised'))
    expect(lum(donker)).toBeGreaterThan(lum(vak))
  })

  /** De stand van het toestel telt ook zonder dat iemand hem heeft gekozen. */
  it('staat ook in de regel voor de systeemvoorkeur', () => {
    const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'))
    expect(media).toContain('--inkt-tekenen:')
  })
})

describe('hoe `Scribe` die inkt gebruikt', () => {
  it('leest de kleur uit de variabele in plaats van hem in te typen', () => {
    expect(scribe).toContain("getPropertyValue('--inkt-tekenen')")
    expect(scribe).not.toContain('rgba(13,148,136')
  })

  /**
   * Eén keer bij het schoonvegen, niet bij elke haal: `stroke` draait per
   * muisbeweging en `getComputedStyle` is daar te duur voor.
   */
  it('leest hem één keer en onthoudt hem', () => {
    expect(scribe).toContain('const inkt = useRef(')
    expect(scribe).toContain('ctx.strokeStyle = inkt.current')
  })

  /**
   * `globalAlpha` blijft anders staan, en dan wordt de voorbeeldletter bij de
   * volgende schoonveeg op 0,85 van zijn eigen 0,26 getekend.
   */
  it('zet de doorzichtigheid terug na de haal', () => {
    // Binnen `stroke` en niet binnen `paintGlyph`, die zijn eigen save/restore
    // heeft voor het verschuiven en schalen van de letter.
    const begin = scribe.indexOf('const stroke = (')
    const blok = scribe.slice(begin, scribe.indexOf('const mask = ink.current', begin))
    expect(blok).toContain('ctx.save()')
    expect(blok).toContain('ctx.globalAlpha = 0.85')
    expect(blok).toContain('ctx.restore()')
    expect(blok.indexOf('ctx.restore()')).toBeGreaterThan(blok.indexOf('ctx.stroke()'))
  })
})

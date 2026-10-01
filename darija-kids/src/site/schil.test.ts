/**
 * De schil om de app heen: de bladzijde, de statusbalk, het startscherm.
 *
 * Alles wat je ziet vóórdat de app zelf iets getekend heeft. Dat is precies
 * het stuk dat niemand test, en precies het eerste wat een beoordelaar en elke
 * gebruiker te zien krijgt.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const WORTEL = new URL('../../', import.meta.url)
const lees = (pad: string) => readFileSync(new URL(pad, WORTEL), 'utf8').replace(/\r\n/g, '\n')

const html = lees('index.html')
const css = lees('src/index.css')

/**
 * De waarde van een css-variabele, binnen één blok.
 *
 * Binnen dát blok en niet erna: `[data-theme="dark"]` staat ook in een
 * `@slot`-regel bovenaan het bestand, en wie vanaf daar verder leest vindt
 * eerst de lichte waarde.
 */
const kleur = (blok: string, naam: string): string => {
  const begin = css.indexOf(blok + ' {')
  if (begin < 0) return ''
  const stuk = css.slice(begin, css.indexOf('\n}', begin))
  return stuk.match(new RegExp(`${naam}:\\s*(#[0-9a-f]{3,8})`, 'i'))?.[1] ?? ''
}

describe('de kleur van de statusbalk', () => {
  /**
   * Eén `theme-color` is altijd in één van de twee standen fout. Hier was het
   * de donkere waarde, ook op een toestel in de lichte stand -- dan tekent
   * Android een nachtblauwe balk boven een crèmekleurige app.
   */
  it('heeft een waarde voor allebei de standen', () => {
    expect(html).toContain('media="(prefers-color-scheme: light)"')
    expect(html).toContain('media="(prefers-color-scheme: dark)"')
    expect(html.match(/<meta name="theme-color"/g)?.length).toBe(2)
  })

  /**
   * En die twee waarden zijn dezelfde als de achtergrond van de app. Lopen ze
   * uit elkaar, dan is de rand van het scherm een andere kleur dan wat eronder
   * staat, en dat zie je precies op de plek waar je het niet wilt.
   */
  it('gebruikt dezelfde kleuren als `--surface`', () => {
    const licht = kleur(':root', '--surface')
    const donker = kleur(':root[data-theme="dark"]', '--surface')
    expect(licht).not.toBe('')
    expect(donker).not.toBe('')
    expect(html).toContain(`content="${licht}" media="(prefers-color-scheme: light)"`)
    expect(html).toContain(`content="${donker}" media="(prefers-color-scheme: dark)"`)
  })

  /** Zonder dit is het eerste wat je ziet wit, ook in de donkere stand. */
  it('zegt welke standen de bladzijde kent', () => {
    expect(html).toContain('<meta name="color-scheme" content="light dark" />')
  })
})

describe('het startscherm van het toestel', () => {
  /**
   * De instellingen voor `SplashScreen` in `capacitor.config.ts` deden niets:
   * `@capacitor/splash-screen` staat niet in `package.json`, en alleen die
   * plugin leest ze. Het startscherm komt van de kant van het toestel, en daar
   * bestaat het in een dag- en een nachtversie.
   */
  it('wordt niet geregeld door een plugin die er niet is', () => {
    const pakket = JSON.parse(lees('package.json')) as { dependencies?: Record<string, string> }
    const heeftPlugin = '@capacitor/splash-screen' in (pakket.dependencies ?? {})
    const config = lees('capacitor.config.ts')
    if (!heeftPlugin) expect(config).not.toMatch(/SplashScreen:\s*\{/)
  })

  it('heeft een dag- én een nachtversie op Android', () => {
    const { existsSync } = require('node:fs') as typeof import('node:fs')
    const dag = new URL('android/app/src/main/res/drawable-port-xhdpi/splash.png', WORTEL)
    const nacht = new URL('android/app/src/main/res/drawable-port-night-xhdpi/splash.png', WORTEL)
    expect(existsSync(dag)).toBe(true)
    expect(existsSync(nacht)).toBe(true)
  })
})

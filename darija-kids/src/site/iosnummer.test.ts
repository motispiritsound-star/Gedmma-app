import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `npm run ios -- --build 6` op de verkeerde machine.
 *
 * Het script zet twee regels in `Info.plist` en het buildnummer in het
 * Xcode-project. Die twee horen zich verschillend te gedragen waar geen
 * iOS-project staat:
 *
 * - De twee regels overslaan is goed. `npm run build` op de pc raakt het
 *   iOS-project niet, en dat hoeft niet elke keer een waarschuwing te geven.
 * - Het buildnummer overslaan is fout. Wie `--build 6` typt vraagt om iets
 *   dat moet gebeuren. Een opdracht die dat overslaat en toch 0 teruggeeft,
 *   zegt dat het gelukt is — en dan archiveer je met het oude nummer en
 *   weigert Apple de upload.
 *
 * Dit is een keer misgegaan: de opdracht is op Windows geplakt en gaf
 * "spawnSync xcrun ENOENT", een melding waar Windows niet in voorkomt.
 */

const SCRIPT = path.resolve(__dirname, '../../scripts/ios-plist.mjs')

const draai = (args: string[]) => {
  try {
    const uit = execFileSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', stdio: 'pipe' })
    return { code: 0, tekst: uit }
  } catch (fout) {
    const f = fout as { status?: number; stdout?: string; stderr?: string }
    return { code: f.status ?? -1, tekst: `${f.stdout ?? ''}${f.stderr ?? ''}` }
  }
}

describe('npm run ios buiten een Mac', () => {
  it.skipIf(process.platform === 'darwin')('slaat de twee plistregels stil over', () => {
    const { code, tekst } = draai([])
    expect(code, 'zonder nummer hoort dit geen fout te zijn').toBe(0)
    expect(tekst).toMatch(/overgeslagen/)
  })

  it.skipIf(process.platform === 'darwin')('valt wél over een gevraagd buildnummer', () => {
    const { code } = draai(['--build', '6', '--versie', '1.0'])
    expect(code, 'een overgeslagen buildnummer mag niet als gelukt tellen').toBe(1)
  })

  it.skipIf(process.platform === 'darwin')('zegt dat het aan de machine ligt, niet aan xcrun', () => {
    const { tekst } = draai(['--build', '6'])
    expect(tekst, 'de melding noemt het besturingssysteem niet').toMatch(new RegExp(process.platform))
    expect(tekst, 'de melding noemt de Mac niet').toMatch(/Mac|macOS/)
    expect(tekst, 'er staat geen bruikbare opdracht bij').toMatch(/npm --prefix .*run ios/)
  })

  it.skipIf(process.platform === 'darwin')('geeft de nummers die je meegaf terug in die opdracht', () => {
    // Anders plak je de regel en moet je alsnog zelf het nummer erin zetten.
    const { tekst } = draai(['--build', '6', '--versie', '1.0'])
    expect(tekst).toMatch(/--versie 1\.0/)
    expect(tekst).toMatch(/--build 6/)
  })
})

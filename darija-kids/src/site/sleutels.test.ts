/**
 * Wat nooit in de repository mag komen.
 *
 * `git add -A` is één toetsaanslag, en een sleutel die één keer in de
 * geschiedenis staat haal je er niet meer uit — ook niet door het bestand
 * daarna te verwijderen. De enige bescherming die werkt is een `.gitignore`
 * die er al stond voordat het bestand er was.
 *
 * Twee gaten gevonden bij het nalopen:
 *
 * - `play-api.json`, de dienstrekening van Google Play. Wie die heeft kan een
 *   update uitbrengen onder jouw naam. De scripts vragen er met `--sleutel
 *   <pad>` naar en dat pad wijst naar buiten deze map, maar hem er "even bij
 *   zetten" is precies wat je op een drukke dag doet.
 * - `.env.production`. De hoofdmap van de repository negeert `.env`,
 *   `.env.local` en `.env.*.local` — maar niet die.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const WORTEL = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))))
const negeer = readFileSync(path.join(WORTEL, '.gitignore'), 'utf8')

/** Wat git zegt: wordt dit pad genegeerd? */
const genegeerd = (pad: string): boolean => {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', pad], { cwd: WORTEL, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

describe('sleutels horen buiten de repository', () => {
  it.each([
    ['play-api.json', 'de dienstrekening van Google Play'],
    ['een-ander-api.json', 'elke andere dienstrekening'],
    ['.env.production', 'de productie-instellingen'],
    ['.env.staging', 'de testinstellingen'],
    ['AuthKey_AB12CD34.p8', 'de sleutel voor App Store Connect'],
    ['certificaat.p12', 'een ondertekencertificaat'],
    ['Darijaforkids.mobileprovision', 'een voorzieningsprofiel'],
    ['android/keystore.properties', 'het wachtwoord van de ondertekensleutel'],
    ['release.keystore', 'de ondertekensleutel zelf'],
    ['server/.dev.vars', 'de serversleutels'],
    ['google-services.json', 'de Google-instellingen, mocht die ooit komen'],
  ])('negeert %s (%s)', (pad) => {
    expect(genegeerd(pad)).toBe(true)
  })

  /**
   * En één bestand dat er juist wél in hoort: daar staat alleen `VITE_DEMO=1`
   * in. Zonder deze uitzondering zou `.env.*` hem meenemen en breekt
   * `npm run build:demo` op een verse kloon.
   */
  it('laat `.env.demo` staan, want daar staat niets geheims in', () => {
    expect(genegeerd('.env.demo')).toBe(false)
    expect(readFileSync(path.join(WORTEL, '.env.demo'), 'utf8')).not.toMatch(/KEY|SECRET|TOKEN|PASSWORD/i)
    expect(negeer).toContain('!.env.demo')
  })
})

describe('en er staat nu niets geheims in', () => {
  /** Elk gevolgd bestand, afgezien van wat git zelf als binair ziet. */
  const gevolgd = execFileSync('git', ['ls-files'], { cwd: WORTEL, encoding: 'utf8' })
    .split('\n').filter(Boolean)

  it('bevat geen privésleutel en geen dienstrekening', () => {
    const verdacht: string[] = []
    for (const bestand of gevolgd) {
      if (!/\.(ts|tsx|js|mjs|cjs|json|md|css|html|yml|yaml|txt|xml|gradle|properties|plist)$/.test(bestand)) continue
      let inhoud: string
      try {
        inhoud = readFileSync(path.join(WORTEL, bestand), 'utf8')
      } catch {
        continue
      }
      // De test zelf noemt deze woorden, dus die slaan we over.
      if (bestand.endsWith('sleutels.test.ts')) continue
      if (/-----BEGIN [A-Z ]*PRIVATE KEY|"private_key"\s*:|AIza[0-9A-Za-z_-]{30,}|AKIA[0-9A-Z]{16}/.test(inhoud)) {
        verdacht.push(bestand)
      }
    }
    expect(verdacht, 'deze bestanden lijken een sleutel te bevatten').toEqual([])
  })

  /**
   * En wat er wél in de app-bundel terechtkomt: alleen `import.meta.env`-
   * waarden met een `VITE_`-voorvoegsel, en dat zijn er twee. `VITE_DEMO` is
   * een vlag en `VITE_POST` is een adres dat toch in elk netwerkverzoek staat.
   * Een sleutel hoort daar nooit bij — die blijft op de server.
   */
  it('zet geen enkele sleutel in de app-bundel', () => {
    const uit = execFileSync('git', ['grep', '-hoE', 'import\\.meta\\.env\\.[A-Za-z_]+', '--', 'src'],
      { cwd: WORTEL, encoding: 'utf8' })
    const namen = [...new Set(uit.split('\n').filter(Boolean))].sort()
    expect(namen).toEqual([
      'import.meta.env.DEV',
      'import.meta.env.PROD',
      'import.meta.env.VITE_DEMO',
      'import.meta.env.VITE_POST',
    ])
  })
})

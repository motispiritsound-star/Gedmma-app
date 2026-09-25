/**
 * De browser waarmee dit project zijn pdf's en platen zet.
 *
 * Elk van deze scripts maakt zijn werk met Chromium: de boeken, het e-boek,
 * de winkelplaten, de schermafdrukken. In de bouwomgeving staat er al een
 * browser klaar op een vast pad, en dat pad stond hardgecodeerd in ruim
 * dertig scripts. Daarmee werkte géén van die scripts op de laptop van de
 * schrijver — daar bestaat `/opt/pw-browsers` niet, en dan stopt het met
 * "Failed to launch chromium because executable doesn't exist", vijf regels
 * onder een stack trace waar niets in staat wat je verder helpt.
 *
 * Dus: het vaste pad als het er is, anders laat Playwright zelf zoeken naar
 * de browser die hij ooit heeft opgehaald. Is er dan nog steeds niets, dan
 * staat er wat je moet doen in plaats van wat er misging.
 */
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

/** Waar de bouwomgeving hem neerzet; zie PLAYWRIGHT_BROWSERS_PATH. */
const KLAARGEZET = '/opt/pw-browsers'

/**
 * Het pad naar een browser die er echt staat, of niets.
 *
 * Drie plekken, in deze volgorde: wat je zelf hebt opgegeven, wat de
 * bouwomgeving heeft klaargezet, en wat Playwright ooit heeft opgehaald.
 *
 * Die tweede wordt uitgezocht in plaats van opgeschreven. Er stond eerst een
 * vast versienummer in — `chromium-1194` — en dat klopte een halfjaar later
 * niet meer: dezelfde omgeving had toen `chromium-1243`, en dan zoekt hij
 * naar een browser die er niet is terwijl er twee mappen verder wel een staat.
 */
export function chroomPad() {
  if (process.env.CHROME_PAD) return process.env.CHROME_PAD

  if (existsSync(KLAARGEZET)) {
    for (const naam of readdirSync(KLAARGEZET)) {
      if (!naam.startsWith('chromium-') && naam !== 'chromium') continue
      for (const romp of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
        const kandidaat = path.join(KLAARGEZET, naam, romp)
        if (existsSync(kandidaat)) return kandidaat
      }
    }
  }

  try {
    const eigen = chromium.executablePath()
    if (eigen && existsSync(eigen)) return eigen
  } catch { /* Playwright heeft er nog nooit een opgehaald. */ }

  return null
}

/**
 * Start Chromium. Alle opties van `chromium.launch` mogen mee.
 *
 * Staat je browser ergens anders, zet dan `CHROME_PAD` naar dat bestand.
 */
export async function startChroom(opties = {}) {
  const pad = chroomPad()
  try {
    return await chromium.launch(pad ? { executablePath: pad, ...opties } : opties)
  } catch (fout) {
    const bericht = String(fout?.message ?? fout)
    if (!/executable doesn.?t exist|Failed to launch/i.test(bericht)) throw fout
    console.error(`
Er is geen browser om mee te zetten.

Deze scripts maken hun pdf's en platen met Chromium. Haal hem één keer op:

  npx playwright install chromium

Staat hij ergens anders op je schijf, zet dan CHROME_PAD naar dat bestand.
`)
    process.exit(1)
  }
}

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
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

/** Waar de bouwomgeving hem neerzet; zie PLAYWRIGHT_BROWSERS_PATH. */
const KLAARGEZET = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

/**
 * Start Chromium. Alle opties van `chromium.launch` mogen mee.
 *
 * Staat je browser ergens anders, zet dan `CHROME_PAD` naar dat bestand.
 */
export async function startChroom(opties = {}) {
  const pad = process.env.CHROME_PAD || (existsSync(KLAARGEZET) ? KLAARGEZET : null)
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

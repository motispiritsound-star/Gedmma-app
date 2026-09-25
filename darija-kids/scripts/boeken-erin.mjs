/**
 * Zet alle boeken in de bak, in één opdracht.
 *
 * Dit was drie opdrachten met twee valkuilen ertussen: de leesboeken, dan de
 * prentenboeken, en die laatste viel om omdat er geen browser stond — na een
 * regel die uitlegde wat je moest halen, en daarna mocht je zelf onthouden
 * waar je gebleven was.
 *
 * Nu: de browser wordt opgehaald als hij er niet is, en daarna gaat alles
 * erin. Herhalen mag altijd; alles wat er al staat wordt gewoon overschreven.
 *
 * Draaien met:
 *   npm run boeken                 # alles
 *   npm run boeken -- --lezen      # alleen de leesboeken (een halve minuut)
 *   npm run boeken -- --platen     # alleen de prentenboeken (een half uur)
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chroomPad } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ALLEEN_LEZEN = process.argv.includes('--lezen')
const ALLEEN_PLATEN = process.argv.includes('--platen')
const LEZEN = !ALLEEN_PLATEN
const PLATEN = !ALLEEN_LEZEN

const draai = (argumenten) =>
  execFileSync(process.execPath, argumenten, { cwd: ROOT, stdio: 'inherit' })

/* ----------------------------------------------------------- de browser */

/**
 * Chromium ophalen als hij er niet is.
 *
 * Zonder vragen. Het is geen verrassing en het kost niets: wie deze opdracht
 * geeft, heeft om de prentenboeken gevraagd, en die worden bladzijde voor
 * bladzijde met een browser geschoten. Een script dat halverwege stopt met
 * "haal eerst dit op" is een script dat je twee keer moet draaien.
 */
if (PLATEN && !chroomPad()) {
  console.log('\nChromium staat er nog niet. Die haal ik eerst op — een paar honderd')
  console.log('megabyte, één keer, en daarna nooit meer.\n')
  try {
    draai([path.join(ROOT, 'node_modules', 'playwright-core', 'cli.js'), 'install', 'chromium'])
  } catch {
    console.error('\nDat lukte niet. Haal hem met de hand op:\n')
    console.error('  npx playwright install chromium\n')
    console.error('En draai deze opdracht daarna opnieuw.\n')
    process.exit(1)
  }
}

/* ------------------------------------------------------------ de boeken */

if (LEZEN) {
  console.log('\n─── De sleutels van Marokko: 15 delen × 6 talen ───\n')
  draai([path.join(ROOT, 'scripts', 'leesuitgave.mjs'), '--r2'])
}

if (PLATEN) {
  console.log('\n─── Sba de Atlasleeuw: 12 delen × 6 talen ───')
  console.log('\nDit duurt een half uur. Hij zegt na elk deel hoe ver hij is, en valt hij')
  console.log('halverwege om, dan staat wat er al in de bak zit er gewoon nog.\n')
  draai([path.join(ROOT, 'scripts', 'make-bladen.mjs'), '--taal', 'alles', '--uploaden'])
}

console.log('\nKlaar. Log in op darijaforkids.eu/portaal en kijk of er een boek opengaat.\n')

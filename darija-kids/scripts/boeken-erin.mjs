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
 *   npm run boeken -- --platen     # alleen de prentenboeken (ruim een uur)
 *   npm run boeken -- --opnieuw    # ook wat al in de bak staat
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

const draai = (argumenten, opties = {}) =>
  execFileSync(process.execPath, argumenten, { cwd: ROOT, stdio: 'inherit', ...opties })

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
  console.log('\nEr staat nog geen browser klaar. Die haal ik eerst op — honderdvijftig')
  console.log('megabyte, één keer, en daarna nooit meer.\n')
  try {
    /**
     * Playwright kapt een download af na dertig seconden.
     *
     * Dat is genoeg voor een goede verbinding en te kort voor de meeste. Een
     * halfuur is hier de juiste grens: dit gebeurt één keer, en het alternatief
     * is drie keer dezelfde stapel foutmeldingen.
     */
    draai([path.join(ROOT, 'node_modules', 'playwright-core', 'cli.js'), 'install', 'chromium'],
      { env: { ...process.env, PLAYWRIGHT_DOWNLOAD_CONNECTION_TIMEOUT: '1800000' } })
  } catch {
    console.error('\nDat lukte niet — meestal is dat de verbinding, niet jouw machine.\n')
    console.error('Je hebt waarschijnlijk al een bruikbare browser staan. Edge is ook')
    console.error('Chromium en doet dit werk net zo goed. Wijs hem aan en draai deze')
    console.error('opdracht opnieuw:\n')
    if (process.platform === 'win32') {
      console.error('  $env:CHROME_PAD = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"')
      console.error('  npm run boeken\n')
      console.error('Staat Edge ergens anders, zoek hem dan met:\n')
      console.error('  Get-ChildItem "C:\\Program Files*" -Recurse -Filter msedge.exe -ErrorAction SilentlyContinue\n')
    } else {
      console.error('  CHROME_PAD=/pad/naar/chrome npm run boeken\n')
    }
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
  console.log('\nDit duurt ruim een uur: ongeveer de helft schieten, de helft versturen.')
  console.log('Hij zegt na elk deel hoe ver hij is, en elk deel gaat de deur uit zodra')
  console.log('het klaar is. Valt hij om, draai dan dezelfde opdracht opnieuw — wat er')
  console.log('al in de bak staat wordt overgeslagen.\n')
  draai([path.join(ROOT, 'scripts', 'make-bladen.mjs'), '--taal', 'alles', '--uploaden',
    ...(process.argv.includes('--opnieuw') ? ['--opnieuw'] : [])])
}

console.log('\nKlaar. Log in op darijaforkids.eu/portaal en kijk of er een boek opengaat.\n')

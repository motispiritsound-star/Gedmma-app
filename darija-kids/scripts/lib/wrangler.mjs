/**
 * Wrangler aanroepen, op elk besturingssysteem.
 *
 * Niet via `npx`. Dat lijkt de gewone weg en gaat op Windows stuk: daar heet
 * hij `npx.cmd`, en een programma dat Node rechtstreeks start — buiten een
 * shell om — vindt hem dan niet. `Error: spawnSync npx ENOENT`, en die
 * foutmelding zegt niet dat je op Windows zit.
 *
 * Dus roepen we het bestand aan dat npx uiteindelijk ook zou draaien: het
 * javascript van wrangler zelf, met de Node die dit script draait. Geen shell,
 * geen PATH, geen aanhalingstekens om paden met spaties.
 */
import { execFile, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SERVER = path.join(ROOT, 'server')
const BIN = path.join(SERVER, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

/**
 * Draait `wrangler <argumenten>` vanuit de servermap.
 *
 * Die map is met opzet vast: daar staat `wrangler.toml`, en wrangler zoekt dat
 * bestand vanaf de map waarin hij draait. Ergens anders vandaan gestart weet
 * hij niet welke worker je bedoelt.
 */
export const wrangler = (argumenten, opties = {}) => {
  if (!existsSync(BIN)) {
    console.error('\nWrangler staat er niet. Installeer hem eerst:\n')
    console.error('  cd server')
    console.error('  npm install\n')
    process.exit(1)
  }
  return execFileSync(process.execPath, [BIN, ...argumenten], {
    cwd: SERVER, stdio: 'pipe', encoding: 'utf8', ...opties,
  })
}

/**
 * Dezelfde aanroep, maar zonder te wachten — en met een pool erbij.
 *
 * Wrangler heeft ruim vier seconden nodig om op te starten, vóór hij ook maar
 * iets doet. Dat is onbelangrijk bij één aanroep en beslissend bij
 * tweeduizend: de prentenboeken zijn tweeduizenddriehonderd bestanden, en één
 * wrangler per bestand achter elkaar is bijna drie uur waarvan het meeste
 * opstarten is.
 *
 * Ze staan het grootste deel van die tijd te wachten op het netwerk, dus ze
 * kunnen prima naast elkaar. Zes is een rustig getal: het scheelt een factor
 * zes, en het blijft ruim onder wat Cloudflare per token toestaat.
 */
export const wranglerLos = (argumenten, opties = {}) => new Promise((klaar, mis) => {
  execFile(process.execPath, [BIN, ...argumenten],
    { cwd: SERVER, encoding: 'utf8', ...opties },
    (fout, uit, fouttekst) => (fout ? mis(new Error(fouttekst || fout.message)) : klaar(uit)))
})

/**
 * Draai een rij taken, hoogstens `tegelijk` tegelijk.
 *
 * `maak` krijgt één ding uit de rij en geeft een belofte terug. Gaat er één
 * mis, dan valt het geheel — dat is hier de bedoeling: een boek waarvan de
 * helft van de bladzijden in de bak staat is erger dan een boek dat er niet
 * is, want de lezer opent hem dan wel.
 */
export const pool = async (rij, maak, tegelijk = 6, na = null) => {
  const wacht = new Set()
  for (const ding of rij) {
    const taak = maak(ding).then(() => { wacht.delete(taak); if (na) na() })
    wacht.add(taak)
    if (wacht.size >= tegelijk) await Promise.race(wacht)
  }
  await Promise.all(wacht)
}

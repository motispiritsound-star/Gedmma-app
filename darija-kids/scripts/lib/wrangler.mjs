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
import { execFileSync } from 'node:child_process'
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

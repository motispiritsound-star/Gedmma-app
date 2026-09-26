/**
 * Het schema op de database zetten, vanuit de projectmap.
 *
 * `server/schema.sql` bestaat uit niets dan `CREATE TABLE IF NOT EXISTS` en
 * `CREATE INDEX IF NOT EXISTS` — geen DROP, geen ALTER, geen DELETE. Daarom
 * mag hij zo vaak worden toegepast als je wilt: bestaande tafels blijven zoals
 * ze zijn, met alles wat erin staat, en wat er nog niet is komt erbij.
 *
 * Dat is met opzet zo gehouden. Een schema dat je alleen in het begin mag
 * draaien, is een schema dat bij de eerstvolgende uitbreiding met de hand
 * moet, en dat is precies het soort stap dat je vergeet.
 *
 *   npm run schema            — op de echte database
 *   npm run schema -- --hier  — op de lokale kopie, om te proberen
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { wrangler } from './lib/wrangler.mjs'

const SERVER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'server')
const HIER = process.argv.includes('--hier')

try {
  const uit = wrangler(['d1', 'execute', 'darijaforkids',
    HIER ? '--local' : '--remote', '--yes', '--file', path.join(SERVER, 'schema.sql')])
  console.log(uit)
  console.log(`\nHet schema staat op de ${HIER ? 'lokale kopie' : 'database'}.\n`)
} catch (fout) {
  const tekst = String(fout.message || fout).replace(/\u001b\[[0-9;]*m/g, '')
  console.error('\nDat is niet gelukt.\n')
  if (/CLOUDFLARE_API_TOKEN|not logged in|authenticat/i.test(tekst)) {
    console.error('Wrangler weet niet wie je bent. Log één keer in:\n')
    console.error('  npm run inloggen\n')
  }
  console.error(`${tekst.split('\n').filter(Boolean).slice(-4).map((r) => `  ${r}`).join('\n')}\n`)
  process.exit(1)
}

/**
 * Meekijken met de worker, en eerst zeggen welke geheimen hij kent.
 *
 * Nodig omdat een fout in de worker nergens terechtkomt waar je hem ziet. Een
 * koopmelding die binnenkomt en waarvan de mail omvalt, meldt netjes "viel om:
 * mail" — maar wát de mailpartner zei staat alleen in het logboek van
 * Cloudflare, en dat logboek loopt alleen terwijl je ernaar kijkt.
 *
 * De lijst met geheimen staat er bovenop omdat dat negen van de tien keer het
 * antwoord is. `MAIL_SLEUTEL` niet gezet betekent: elke mail valt om met een
 * 401, en verder werkt alles. Dat is precies het soort storing waarbij je naar
 * de verkeerde kant zoekt.
 *
 * De waarden staan er niet bij. Cloudflare geeft ze ook niet terug — een
 * geheim gaat er één kant op.
 *
 *   npm run logboek
 *
 * Stoppen met Ctrl+C. Draai hem in een tweede venster naast de opdracht die
 * je wilt nakijken.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { wrangler } from './lib/wrangler.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SERVER = path.join(ROOT, 'server')
const BIN = path.join(SERVER, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

/** De vier die de worker nodig heeft, met wat er misgaat als ze ontbreken. */
const NODIG = {
  MAIL_SLEUTEL: 'zonder deze valt elke mail om — geen sleutel naar een koper',
  ZOUT: 'zonder deze kan er geen ip-hash worden gemaakt',
  KOOP_GEHEIM: 'zonder deze weigert de worker elke melding van de betaalpartner',
}

console.log('\nDe geheimen die bij Cloudflare staan:\n')

let gezet = []
try {
  const uit = wrangler(['secret', 'list'])
  gezet = [...uit.matchAll(/"name"\s*:\s*"([^"]+)"/g)].map((m) => m[1])
} catch (fout) {
  const tekst = String(fout.message || fout).replace(/\u001b\[[0-9;]*m/g, '')
  console.error('  Dat lukte niet.\n')
  if (/CLOUDFLARE_API_TOKEN|not logged in|authenticat/i.test(tekst)) {
    console.error('  Wrangler weet niet wie je bent:  npm run inloggen\n')
    process.exit(1)
  }
  console.error(`${tekst.split('\n').filter(Boolean).slice(-3).map((r) => `  ${r}`).join('\n')}\n`)
}

let mist = 0
for (const [naam, waarom] of Object.entries(NODIG)) {
  const er = gezet.includes(naam)
  if (!er) mist += 1
  console.log(`  ${er ? 'staat er ' : 'ONTBREEKT'}  ${naam}${er ? '' : ` — ${waarom}`}`)
}
for (const naam of gezet) {
  if (!(naam in NODIG)) console.log(`  staat er   ${naam}`)
}

if (mist) {
  console.log(`\nZet wat ontbreekt met:\n`)
  console.log('  npm run koopgeheim          (voor KOOP_GEHEIM)')
  console.log('  npm --prefix server exec wrangler secret put MAIL_SLEUTEL')
  console.log('  npm --prefix server exec wrangler secret put ZOUT\n')
}

if (!existsSync(BIN)) {
  console.error('Wrangler staat er niet. Draai eerst: npm --prefix server install\n')
  process.exit(1)
}

console.log('\nNu meekijken. Doe in een ander venster wat je wilt nakijken.')
console.log('Stoppen: Ctrl+C\n')
console.log('─'.repeat(60) + '\n')

spawn(process.execPath, [BIN, 'tail', '--format', 'pretty'], { cwd: SERVER, stdio: 'inherit' })

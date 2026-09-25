/**
 * Zet de binding naar de boekenbak aan in `server/wrangler.toml`.
 *
 * Die drie regels stonden uitgezet, en met reden: een binding naar een bak die
 * niet bestaat laat `wrangler deploy` omvallen, en dan gaat er ook niets live
 * dat wél werkt. Maar "haal er nu de hekjes weg" is een stap die je vergeet,
 * en als je hem vergeet zegt de lezer op de website "niet ingericht" zonder
 * dat ergens iets rood wordt.
 *
 * Dus hangt hij aan `npm run maak-bak`, meteen achter het aanmaken van de bak.
 * Twee keer draaien mag: dan verandert er niets.
 *
 * Draaien met:
 *   node scripts/r2-aan.mjs [--uit]
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TOML = path.join(ROOT, 'server', 'wrangler.toml')
const UIT = process.argv.includes('--uit')

const AAN = `[[r2_buckets]]
binding = "BOEKEN"
bucket_name = "darijaforkids-boeken"`
const UITGEZET = AAN.split('\n').map((r) => `# ${r}`).join('\n')

const bron = await readFile(TOML, 'utf8')
const doel = UIT ? UITGEZET : AAN
const van = UIT ? AAN : UITGEZET

if (bron.includes(doel) && !bron.includes(van)) {
  console.log(`De boekenbak stond al ${UIT ? 'uit' : 'aan'}.`)
  process.exit(0)
}
if (!bron.includes(van)) {
  console.error(`\nKan de drie regels van de boekenbak niet vinden in ${path.relative(ROOT, TOML)}.`)
  console.error('Zijn ze met de hand aangepast? Zet ze terug in hun oude vorm.\n')
  process.exit(1)
}

await writeFile(TOML, bron.replace(van, doel), 'utf8')
console.log(`De boekenbak staat ${UIT ? 'uit' : 'aan'} in server/wrangler.toml.`)

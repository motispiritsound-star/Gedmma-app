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

const REGELS = ['[[r2_buckets]]', 'binding = "BOEKEN"', 'bucket_name = "darijaforkids-boeken"']

/**
 * Zoeken met regels in plaats van met één blok tekst.
 *
 * Een blok van drie regels aan elkaar geplakt met `\n` staat niet in dit
 * bestand als het op Windows is uitgecheckt: git zet er dan `\r\n` van. Dan
 * vindt hij niets, zegt hij dat de regels met de hand zijn aangepast, en klopt
 * daar niets van — het bestand is ongemoeid en de melding wijst de verkeerde
 * kant op. Vandaar per regel, met het regeleinde erbuiten.
 */
const zoek = (uitgezet) => new RegExp(
  REGELS.map((r) => `${uitgezet ? '# ?' : ''}${r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).join('\r?\n'),
)

const bron = await readFile(TOML, 'utf8')
const eindeRegel = bron.includes('\r\n') ? '\r\n' : '\n'
const staatAan = zoek(false).test(bron)
const staatUit = zoek(true).test(bron)

if (UIT ? staatUit && !staatAan : staatAan && !staatUit) {
  console.log(`De boekenbak stond al ${UIT ? 'uit' : 'aan'}.`)
  process.exit(0)
}
if (!(UIT ? staatAan : staatUit)) {
  console.error(`\nKan de drie regels van de boekenbak niet vinden in ${path.relative(ROOT, TOML)}.`)
  console.error('Zijn ze met de hand aangepast? Zet ze terug in hun oude vorm.\n')
  process.exit(1)
}

const doel = REGELS.map((r) => (UIT ? `# ${r}` : r)).join(eindeRegel)
await writeFile(TOML, bron.replace(zoek(!UIT), doel), 'utf8')
console.log(`De boekenbak staat ${UIT ? 'uit' : 'aan'} in server/wrangler.toml.`)

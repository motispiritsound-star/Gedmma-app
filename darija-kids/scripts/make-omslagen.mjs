/**
 * De omslag van deel 1 van elke reeks, in elke taal, voor de boekenpagina.
 *
 * Op de boekenpagina staat naast elke reeks de omslag van het eerste deel.
 * Die omslag tekent de zetter al — `make-sleutels.mjs` en
 * `make-prentenboek.mjs` kunnen hem met `--omslag` als plaatje wegschrijven,
 * en dat is ooit één keer gedaan: in het Nederlands.
 *
 * Gevolg: een Franse bezoeker las "Les clés du Maroc" met daarnaast een
 * omslag waarop "DE SLEUTELS VAN MAROKKO · De olijvenbrand · DEEL 1 VAN
 * VIJFTIEN" stond. Het boek dat hij koopt is Frans; het plaatje was het niet.
 *
 * Er hoefde niets getekend te worden — alleen gedraaid, twaalf keer in plaats
 * van twee. Dit is die opdracht.
 *
 * Draaien met:
 *   npm run omslagen                 # alle zes de talen, beide reeksen
 *   npm run omslagen -- --taal fr
 */
import { execFileSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const GEVRAAGD = arg('taal', 'alles')
const TALEN = GEVRAAGD === 'alles' ? ['nl', 'fr', 'de', 'es', 'it', 'en'] : [GEVRAAGD]

/**
 * Het Nederlands blijft waar het staat.
 *
 * `site-assets/boeken/sba.webp` is de terugval voor een taal die er nog geen
 * heeft, en `make-site.mjs` pakt die als er in de taalmap niets ligt. Zou het
 * Nederlands in `boeken/nl/` gaan staan, dan is er ineens geen terugval meer.
 */
const waar = (taal, naam) => taal === 'nl'
  ? path.join(ROOT, 'site-assets', 'boeken', naam)
  : path.join(ROOT, 'site-assets', 'boeken', taal, naam)

const REEKSEN = [
  ['sleutel.webp', 'make-sleutels.mjs', 'De sleutels van Marokko'],
  ['sba.webp', 'make-prentenboek.mjs', 'Sba de Atlasleeuw'],
]

let gemaakt = 0
for (const taal of TALEN) {
  await mkdir(path.dirname(waar(taal, 'x')), { recursive: true })
  for (const [naam, script, reeks] of REEKSEN) {
    const uit = waar(taal, naam)
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', script),
      '--deel', '1', '--taal', taal, '--omslag', uit], { cwd: ROOT, stdio: 'pipe' })
    gemaakt += 1
    console.log(`${taal}  ${reeks}`)
  }
}
console.log(`\n${gemaakt} omslagen in site-assets/boeken/\n`)

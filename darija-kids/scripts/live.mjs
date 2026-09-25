/**
 * Zet de app op de website live, of haalt hem er weer af.
 *
 * Twee adressen in `src/site/links.ts` bepalen of darijaforkids.eu de app
 * aanbiedt of aankondigt. Zijn ze leeg, dan staat er "binnenkort" en een
 * knop die nergens heen gaat. Staat er een adres in, dan verdwijnt dat blok,
 * wordt de balk onderaan een downloadknop, en zijn de winkelknoppen echt.
 *
 * Dat is één bewerking in één bestand, en juist daarom hoort er een commando
 * bij. Op de dag van de lancering staan er twee goedkeuringen binnen, moet er
 * gepost worden en kijkt er iemand mee — dat is precies het moment waarop je
 * een cijfer verkeerd overtypt, en een verkeerd cijfer leidt de eerste
 * bezoekers naar een lege pagina in de App Store.
 *
 * Draaien met:
 *   node scripts/live.mjs                        — laat zien hoe het nu staat
 *   node scripts/live.mjs --apple 6751234567     — Apple erbij
 *   node scripts/live.mjs --apple <id> --google  — allebei, de lancering zelf
 *   node scripts/live.mjs --uit                  — weer terug naar binnenkort
 *
 * Bij `--apple` mag alles wat App Store Connect je geeft: het kale nummer,
 * `id6751234567`, of de lange deellink met een land en een naam erin.
 */
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LINKS = path.join(ROOT, 'src', 'site', 'links.ts')

const vlag = (naam) => process.argv.includes(`--${naam}`)
const arg = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  if (i < 0) return undefined
  const volgend = process.argv[i + 1]
  return volgend && !volgend.startsWith('--') ? volgend : ''
}

/* ------------------------------------------------------------------ lezen */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const { STORE, appleStoreUrl, playStoreUrl } = await server.ssrLoadModule('/src/site/links.ts')
await server.close()

const nu = { apple: STORE.apple, google: STORE.google }

/* ---------------------------------------------------------------- bepalen */

const uit = vlag('uit')
const appleIn = arg('apple')
const googleIn = arg('google')

if (!uit && appleIn === undefined && googleIn === undefined) {
  const toon = (naam, url) => console.log(`  ${naam.padEnd(7)} ${url || '— leeg, de website zegt "binnenkort"'}`)
  console.log('\nZo staan de winkeladressen nu:\n')
  toon('Apple', nu.apple)
  toon('Google', nu.google)
  console.log(`\nDe website is ${nu.apple || nu.google ? 'live' : 'nog niet live'}.`)
  console.log('\nZetten doe je zo:')
  console.log('  npm run live -- --apple 6751234567 --google')
  console.log('  npm run live -- --uit\n')
  process.exit(0)
}

let doel
try {
  doel = uit
    ? { apple: '', google: '' }
    : {
        apple: appleIn === undefined ? nu.apple : appleIn ? appleStoreUrl(appleIn) : '',
        google: googleIn === undefined ? nu.google : googleIn === '' ? playStoreUrl() : playStoreUrl(googleIn),
      }
} catch (fout) {
  console.error(`\n${fout.message}`)
  console.error('\nEen Apple ID is een getal van negen of tien cijfers. Je vindt het in')
  console.error('App Store Connect onder de app, bij App Information → Apple ID.\n')
  process.exit(1)
}

if (doel.apple === nu.apple && doel.google === nu.google) {
  console.log('\nEr verandert niets; dit staat er al.\n')
  process.exit(0)
}

/* --------------------------------------------------------------- schrijven */

const blok = (s) => `export const STORE = {\n  apple: '${s.apple}',\n  google: '${s.google}',\n}`

const bron = await readFile(LINKS, 'utf8')
const oud = bron.match(/export const STORE = \{[^}]*\}/)
if (!oud) {
  console.error(`\nKan het STORE-blok niet vinden in ${path.relative(ROOT, LINKS)}.`)
  console.error('Is het met de hand aangepast? Zet het terug in zijn oude vorm.\n')
  process.exit(1)
}
await writeFile(LINKS, bron.replace(oud[0], blok(doel)), 'utf8')

const regel = (naam, van, naar) =>
  van === naar ? `  ${naam.padEnd(7)} blijft ${naar || 'leeg'}` : `  ${naam.padEnd(7)} ${naar || '— leeg'}`
console.log('\nGeschreven in src/site/links.ts:\n')
console.log(regel('Apple', nu.apple, doel.apple))
console.log(regel('Google', nu.google, doel.google))

/* ---------------------------------------------------------- site opnieuw */

if (vlag('geen-site')) {
  console.log('\nDe site is niet opnieuw gezet (--geen-site).\n')
  process.exit(0)
}

console.log('\nDe site opnieuw zetten…')
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'make-site.mjs')], { cwd: ROOT, stdio: 'inherit' })
} catch {
  console.error('\nDe site is niet gezet. Draai `npm run site` en kijk wat hij zegt.\n')
  process.exit(1)
}

const live = Boolean(doel.apple || doel.google)
console.log(`\nDe website staat nu op ${live ? 'live' : 'binnenkort'}. Wat er nog moet:\n`)
console.log('  git add -A && git commit -m "De app staat in de winkel" && git push')
console.log('\nDe productiebranch bouwt en publiceert zichzelf, dus met die push staat')
console.log('darijaforkids.eu binnen een paar minuten goed. Kijk daarna zelf even:\n')
console.log('  https://darijaforkids.eu — de twee knoppen moeten klikbaar zijn')
if (live) console.log('\nEn dan pas posten. Niet andersom: een bericht met een dode link\nkomt maar één keer voorbij.\n')
else console.log('')

/**
 * De winkellinks per kanaal, kant-en-klaar om te plakken.
 *
 * Waarom dit een script is en geen lijstje in een document: de Apple-link
 * draagt een providercode die alleen App Store Connect kan geven, en
 * `CLAUDE.md` verbiedt een waarde tussen punthaken in een plakbaar blok --
 * `<de waarde van KOOP_GEHEIM>` is één keer letterlijk, mét punthaken, in een
 * veld bij Gumroad beland. Dus vraagt dit script om de code en drukt het de
 * echte links af, zoals `koopgeheim.mjs` en `live.mjs` dat ook doen.
 *
 * Twee manieren:
 *
 *     npm run kanaallinks
 *     npm run kanaallinks -- --pt 1234567
 *
 * De eerste drukt af wat er nu is. De tweede zet de providercode eerst in
 * `src/site/links.ts` -- daarna werken de Apple-links overal, ook op de
 * website, want de sitegenerator leest diezelfde constante.
 *
 * De Play-links hebben niets uit een console nodig en werken dus vanaf de
 * eerste keer dat dit script draait.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LINKS = path.join(ROOT, 'src', 'site', 'links.ts')

/* ------------------------------------------------------------- providercode */

const vlag = process.argv.indexOf('--pt')
const PT = vlag === -1 ? null : (process.argv[vlag + 1] ?? '').trim()

if (vlag !== -1 && !/^\d{4,}$/.test(PT ?? '')) {
  console.error('\n  --pt wil het getal dat App Store Connect in de campagnelink zet.')
  console.error('  Dat staat achter pt= en bestaat alleen uit cijfers.\n')
  console.error('  Waar je het vindt: App Store Connect -> je app -> Analytics ->')
  console.error('  in de zijbalk onder Acquisition -> Campaigns -> de + ernaast.')
  console.error('  Maak daar één campagne aan; de link die je terugkrijgt draagt pt=.\n')
  process.exit(1)
}

if (PT) {
  /* Lezen en terugschrijven met het regeleinde dat het bestand al had: op
     Windows zet git `\r\n` in de werkmap, en een script dat op `\n` zoekt
     vindt daar niets. Zie CLAUDE.md. */
  const bron = await readFile(LINKS, 'utf8')
  const oud = bron.match(/export const PROVIDER_TOKEN = '[^']*'/)
  if (!oud) {
    console.error(`\n  Kan PROVIDER_TOKEN niet vinden in ${path.relative(ROOT, LINKS)}.`)
    console.error('  Is het met de hand aangepast? Zet het terug in zijn oude vorm.\n')
    process.exit(1)
  }
  await writeFile(LINKS, bron.replace(oud[0], `export const PROVIDER_TOKEN = '${PT}'`), 'utf8')
  console.log(`\n  Providercode ${PT} staat nu in ${path.relative(ROOT, LINKS)}.`)
}

/* ------------------------------------------------------------------ afdrukken */

const server = await createServer({
  configFile: false,
  root: ROOT,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})

const { KANALEN, KANAAL_MAX, PROVIDER_TOKEN, appleKanaalUrl, playKanaalUrl } =
  await server.ssrLoadModule('/src/site/links.ts')
await server.close()

/* De namen nalopen tegen wat Apple toestaat, voordat ze de deur uit gaan. */
const fout = []
for (const naam of Object.keys(KANALEN)) {
  if (naam.length > KANAAL_MAX) fout.push(`${naam}: ${naam.length} tekens, Apple staat ${KANAAL_MAX} toe`)
  if (!/^[a-z0-9-]+$/.test(naam)) fout.push(`${naam}: alleen a-z, 0-9 en een streepje`)
}
if (fout.length) {
  console.error('\n  Deze kanaalnamen kunnen niet door allebei de winkels:\n')
  for (const f of fout) console.error(`    ${f}`)
  console.error('')
  process.exit(1)
}

const namen = Object.keys(KANALEN)
console.log(`\n  ${namen.length} kanalen.\n`)

for (const naam of namen) {
  console.log(`  ${naam}  —  ${KANALEN[naam].waar}`)
  console.log(`    Apple   ${appleKanaalUrl(naam)}`)
  console.log(`    Google  ${playKanaalUrl(naam)}`)
  console.log('')
}

if (!PROVIDER_TOKEN) {
  console.log('  De Apple-links hierboven zijn nog het gewone winkeladres, zonder meting.')
  console.log('  Dat is met opzet: liever een link die werkt zonder meting dan een link')
  console.log('  die meet en niet werkt.\n')
  console.log('  Zodra je de providercode uit App Store Connect hebt:\n')
  console.log('    npm run kanaallinks -- --pt HETGETAL\n')
  console.log('  De Play-links werken nu al.\n')
} else {
  console.log('  Maak elke naam hierboven ook aan in App Store Connect onder')
  console.log('  Analytics -> Acquisition -> Campaigns, met exact dezelfde spelling.')
  console.log('  De naam die je daar typt is de code die Apple terugmeet.\n')
  console.log('  Reken op minstens 24 uur, en op niets zolang een kanaal geen')
  console.log('  eerste-downloads van vijf verschillende personen heeft gehaald.\n')
}

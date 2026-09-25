/**
 * Schrijft De sleutels van Marokko weg als leesbare JSON, één bestand per
 * deel per taal.
 *
 * De PDF's zijn om te drukken; dit is om te lezen. Negentig boeken op één
 * plank, zonder dat er iets gedownload hoeft te worden — de leeskopie op het
 * web haalt hier haar bladzijden vandaan, en de schrijver kan zo ook zelf
 * nakijken wat er in het Italiaans is komen te staan.
 *
 * Met `--r2` gaan dezelfde boeken ook naar de bak waar de worker ze vandaan
 * haalt, in de vorm die hij verwacht: `sleutels/<deel>/<taal>/boek.json`.
 * Zonder die stap zegt de lezer op de website "niet ingericht" en blijft de
 * bibliotheek van een koper leeg.
 *
 * Run with:
 *   node scripts/leesuitgave.mjs
 *   node scripts/leesuitgave.mjs --r2        # en daarna naar de bak
 */
import { wrangler } from './lib/wrangler.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'lezen')
const TALEN = [
  { code: 'nl', naam: 'Nederlands' },
  { code: 'fr', naam: 'Français' },
  { code: 'de', naam: 'Deutsch' },
  { code: 'es', naam: 'Español' },
  { code: 'it', naam: 'Italiano' },
  { code: 'en', naam: 'English' },
]

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ REEKS }, talen, ...delen] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/content/sleutels-talen.ts'),
  ...Array.from({ length: 15 }, (_, i) => i + 1).map((n) => server.ssrLoadModule(`/src/content/sleutels-deel${n}.ts`)),
])
const { sleuteldeelIn, schilVanSleutel } = talen
await server.close()

/** Het Nederlandse deel is het enige dat zeker bestaat; de rest ligt eroverheen. */
const basis = REEKS.map((kop, i) => ({ ...kop, hoofdstukken: delen[i][`DEEL${i + 1}_HOOFDSTUKKEN`] ?? [] }))

const woorden = (deel) =>
  deel.hoofdstukken.reduce((n, h) => n + h.tekst.reduce((m, p) => m + p.split(/\s+/).filter(Boolean).length, 0), 0)

await mkdir(path.join(UIT, 'data'), { recursive: true })
const plank = {}

for (const { code, naam } of TALEN) {
  const S = schilVanSleutel(code)
  plank[code] = {
    naam,
    reeksnaam: S.reeksnaam,
    merk: S.merk,
    achterinKop: S.achterinKop,
    echtKop: S.echtKop,
    verzonnenKop: S.verzonnenKop,
    sleutelKop: S.sleutelKop,
    laatsteDeel: S.laatsteDeel,
    disclaimer: S.disclaimer,
    delen: [],
  }
  for (const nl of basis) {
    const deel = sleuteldeelIn(code, nl)
    const boek = {
      nummer: deel.nummer,
      deelVan: S.deelVan(deel.nummer),
      titel: deel.titel,
      jaar: deel.jaar,
      waar: deel.waar,
      verteller: deel.verteller,
      flap: deel.flap,
      sleutel: deel.sleutel,
      echt: deel.echt,
      verzonnen: deel.verzonnen,
      leesVerder: deel.nummer < 15 ? S.leesVerder(deel.nummer + 1) : S.laatsteDeel,
      hoofdstukken: deel.hoofdstukken.map((h) => ({ nummer: h.nummer, kop: S.hoofdstuk(h.nummer), titel: h.titel, tekst: h.tekst })),
    }
    await writeFile(path.join(UIT, 'data', `${code}-${deel.nummer}.json`), JSON.stringify(boek))
    plank[code].delen.push({
      nummer: deel.nummer, titel: deel.titel, jaar: deel.jaar, waar: deel.waar, flap: deel.flap,
      hoofdstukken: deel.hoofdstukken.length, woorden: woorden(deel),
    })
  }
}

await writeFile(path.join(UIT, 'plank.json'), JSON.stringify(plank))

/**
 * En dan naar de bak, als daarom gevraagd is.
 *
 * Eén boek per aanroep van wrangler: negentig kleine bestanden gaan sneller op
 * deze manier de deur uit dan dat iemand een tweede manier gaat onderhouden.
 * Ze staan er al, dus dit is een kopieerslag en geen bouw — valt hij halverwege
 * om, dan draai je hem gewoon opnieuw.
 */
if (process.argv.includes('--r2')) {
  console.log('\nNaar R2…\n')
  let gedaan = 0
  for (const { code } of TALEN) {
    for (let n = 1; n <= 15; n++) {
      const bron = path.join(UIT, 'data', `${code}-${n}.json`)
      try {
        wrangler(['r2', 'object', 'put',
          `darijaforkids-boeken/sleutels/${n}/${code}/boek.json`,
          '--file', bron, '--remote', '--content-type', 'application/json'])
      } catch (fout) {
        /**
         * Negentig keer dezelfde fout afdrukken helpt niemand.
         *
         * De eerste die omvalt zegt al wat er mis is, en dat is bijna altijd
         * hetzelfde: de bak bestaat nog niet. Dus: één keer zeggen, zeggen wat
         * je eraan doet, en stoppen.
         */
        const melding = `${fout.stdout ?? ''}${fout.stderr ?? ''}`
        console.error('\n\nDe boeken gaan er niet in.\n')
        if (/10042|enable R2|10006|does not exist|not found/i.test(melding)) {
          console.error('De bak bestaat nog niet. Maak hem eerst:\n')
          console.error('  cd server')
          console.error('  npm run maak-bak\n')
          console.error('Daarna deze opdracht opnieuw; wat er al in staat mag blijven staan.\n')
        } else {
          console.error(melding || String(fout))
        }
        process.exit(1)
      }
      gedaan += 1
      process.stdout.write(`\r${gedaan} van de 90`)
    }
  }
  console.log('\n\nDe boeken staan in de bak. De lezer op de website kan ze nu ophalen.\n')
}
const totaal = Object.values(plank).reduce((n, t) => n + t.delen.reduce((m, d) => m + d.woorden, 0), 0)
console.log(`${Object.keys(plank).length} talen × 15 delen → store/lezen/  (${totaal.toLocaleString('nl-NL')} woorden)`)

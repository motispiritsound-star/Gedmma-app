/**
 * Schrijft De sleutels van Marokko weg als leesbare JSON, één bestand per
 * deel per taal.
 *
 * De PDF's zijn om te drukken; dit is om te lezen. Negentig boeken op één
 * plank, zonder dat er iets gedownload hoeft te worden — de leeskopie op het
 * web haalt hier haar bladzijden vandaan, en de schrijver kan zo ook zelf
 * nakijken wat er in het Italiaans is komen te staan.
 *
 * Run with:
 *   node scripts/leesuitgave.mjs
 */
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
const totaal = Object.values(plank).reduce((n, t) => n + t.delen.reduce((m, d) => m + d.woorden, 0), 0)
console.log(`${Object.keys(plank).length} talen × 15 delen → store/lezen/  (${totaal.toLocaleString('nl-NL')} woorden)`)

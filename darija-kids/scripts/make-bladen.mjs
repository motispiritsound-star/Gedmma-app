/**
 * Zet elk boek om in losse bladzijden als afbeelding.
 *
 * De lezer op de website toont geen pdf maar plaatjes, en wel om één reden:
 * een pdf is één bestand dat je doorstuurt, en dertig losse bladzijden achter
 * een sleutel zijn dat niet.
 *
 * Wat eruit komt gaat naar R2, in de vorm die de worker verwacht:
 *   <reeks>/<deel>/<taal>/<nummer>.webp
 *
 * Run with:
 *   npm run bladen                       # alles, naar store/bladen/
 *   npm run bladen -- --deel 1           # één deel
 *   npm run bladen -- --uploaden         # en daarna naar R2
 */
import { execFileSync } from 'node:child_process'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'
import ffmpeg from 'ffmpeg-static'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'bladen')
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const ALLEEN = arg('deel') ? Number(arg('deel')) : null
const TAAL = arg('taal', 'nl')
const UPLOADEN = process.argv.includes('--uploaden')

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ DELEN }, { REEKS }] = await Promise.all([
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/content/sleutels.ts'),
])
const tekstVan = async (n) => {
  const mod = await server.ssrLoadModule(`/src/content/sleutels-deel${n}.ts`)
  return mod[`DEEL${n}_HOOFDSTUKKEN`]
}

const browser = await startChroom()

/**
 * Eén boek uit elkaar halen.
 *
 * De zetters schrijven hun html naar /tmp voordat ze er een pdf van maken.
 * Die html pakken we hier op en schieten we bladzijde voor bladzijde. Dat is
 * nauwkeuriger dan een pdf terugrekenen naar plaatjes, en het scheelt een
 * pdf-bibliotheek.
 */
const bladenVan = async (reeks, nummer, htmlPad, kiezer) => {
  const map = path.join(UIT, reeks, String(nummer), TAAL)
  await rm(map, { recursive: true, force: true })
  await mkdir(map, { recursive: true })

  const blad = await browser.newPage({ viewport: kiezer.venster, deviceScaleFactor: 2 })
  await blad.goto(`file://${htmlPad}`, { waitUntil: 'networkidle' })
  const secties = await blad.$$(kiezer.sectie)

  for (const [i, sectie] of secties.entries()) {
    const png = path.join(map, `${i + 1}.png`)
    await sectie.screenshot({ path: png })
    execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', png,
      '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6', '-preset', 'picture',
      png.replace(/\.png$/, '.webp')])
    await rm(png)
  }
  await blad.close()
  return secties.length
}

let totaal = 0

for (const deel of DELEN) {
  if (ALLEEN && deel.nummer !== ALLEEN) continue
  execFileSync('node', [path.join(ROOT, 'scripts', 'make-prentenboek.mjs'),
    '--deel', String(deel.nummer), '--taal', TAAL], { stdio: 'pipe' })
  const n = await bladenVan('sba', deel.nummer, `/tmp/.prentenboek-${TAAL}.html`,
    { venster: { width: 794, height: 560 }, sectie: 'section' })
  console.log(`sba ${String(deel.nummer).padStart(2)} — ${n} bladzijden`)
  totaal += n
}


/**
 * De leesboeken gaan als tekst en niet als plaatje.
 *
 * Een roman van dertig bladzijden in beeld is drie megabyte die op een
 * telefoon niet meeschaalt: je kunt niet groter zetten, de regels lopen niet
 * door, en wie slecht ziet kan er niets mee. Tekst is hier gewoon het goede
 * medium.
 *
 * Dat je tekst kunt kopiëren is waar en het verandert niets: dat kan in elke
 * lezer ter wereld. De sleutel en de naam op de bladzijde doen het werk.
 */
for (const deel of REEKS) {
  if (ALLEEN && deel.nummer !== ALLEEN) continue
  const mod = await tekstVan(deel.nummer)
  const map = path.join(UIT, 'sleutels', String(deel.nummer), TAAL)
  await rm(map, { recursive: true, force: true })
  await mkdir(map, { recursive: true })
  const boek = {
    nummer: deel.nummer, titel: deel.titel, jaar: deel.jaar, waar: deel.waar,
    verteller: deel.verteller, flap: deel.flap,
    hoofdstukken: mod.map((h) => ({ nummer: h.nummer, titel: h.titel, tekst: h.tekst })),
    echt: deel.echt, verzonnen: deel.verzonnen, sleutel: deel.sleutel,
  }
  await writeFile(path.join(map, 'boek.json'), JSON.stringify(boek))
  const woorden = mod.reduce((n, h) => n + h.tekst.join(' ').split(/\s+/).length, 0)
  console.log(`sleutels ${String(deel.nummer).padStart(2)} — ${mod.length} hoofdstukken, ${woorden} woorden`)
  totaal += mod.length
}

await browser.close()
await server.close()
console.log(`\n${totaal} bladzijden in ${path.relative(ROOT, UIT)}/\n`)

if (UPLOADEN) {
  console.log('Uploaden naar R2…\n')
  const loop = async (map) => {
    for (const naam of await readdir(map, { withFileTypes: true })) {
      const vol = path.join(map, naam.name)
      if (naam.isDirectory()) { await loop(vol); continue }
      const sleutel = path.relative(UIT, vol).replace(/\\/g, '/')
      execFileSync('npx', ['wrangler', 'r2', 'object', 'put',
        `darijaforkids-boeken/${sleutel}`, '--file', vol, '--remote',
        '--content-type', vol.endsWith('.json') ? 'application/json' : 'image/webp'],
        { cwd: path.join(ROOT, 'server'), stdio: 'inherit' })
    }
  }
  await loop(UIT)
}

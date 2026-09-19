/**
 * Bundles everything Google Play asks you to upload into one folder, per taal.
 *
 * De bestanden bestaan al — `npm run screenshots`, `npm run marketing` en
 * `npm run assets` maken ze — maar ze liggen verspreid over store/ en assets/,
 * in mappen die git negeert omdat er honderden megabytes in zitten. Wie de
 * winkelpagina invult zit achter een browser en heeft die repo niet. Dit
 * script zet er één map van die je kunt meesturen, met de teksten ernaast en
 * een briefje erbij dat zegt welk bestand waar hoort.
 *
 * Play wil maximaal acht telefoonschermen; er staan er negen klaar, dus de
 * laatste valt af.
 *
 * Run with: node scripts/make-playpakket.mjs [--lang nl,fr,...]
 */
import { execFile } from 'node:child_process'
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ffmpeg from 'ffmpeg-static'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store', 'play-pakket')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const LANGS = arg('lang', 'nl,fr,de,es,it,en').split(',')

/** Wat Play elke taal noemt, voor de mapnaam in het pakket. */
const PLAY_LOCALE = {
  nl: 'nl-NL', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', en: 'en-US',
}

/** Play neemt er acht; de negende is er één te veel. */
const MAX_SCHERMEN = 8

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

// Het icoon moet exact 512×512 zijn; assets/icon.png is 1024.
await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
  '-i', path.join(ROOT, 'assets', 'icon.png'),
  '-vf', 'scale=512:512', path.join(OUT, 'icoon-512.png')])

const gemist = []

for (const lang of LANGS) {
  const map = path.join(OUT, `${lang} (${PLAY_LOCALE[lang]})`)
  await mkdir(path.join(map, 'schermen'), { recursive: true })

  const feature = path.join(ROOT, 'store', 'marketing', lang, 'feature-graphic.png')
  await cp(feature, path.join(map, 'uitgelicht-1024x500.png')).catch(() => gemist.push(feature))

  const uit = path.join(ROOT, 'store', 'screenshots', lang, 'play')
  const schermen = (await readdir(uit).catch(() => [])).filter((f) => f.endsWith('.png')).sort()
  if (!schermen.length) gemist.push(uit)
  for (const [i, file] of schermen.slice(0, MAX_SCHERMEN).entries()) {
    await cp(path.join(uit, file), path.join(map, 'schermen', `${i + 1}-${file.replace(/^\d+-/, '')}`))
  }

  const teksten = path.join(ROOT, 'store', `listing.${lang}.md`)
  await cp(teksten, path.join(map, 'teksten.md')).catch(() => gemist.push(teksten))
}

await writeFile(path.join(OUT, 'LEES-DIT-EERST.txt'), `Darijaforkids — wat waar hoort in de Play Console
==================================================

Per taal staat hier een map. Google Play noemt die talen nl-NL, fr-FR, de-DE,
es-ES, it-IT en en-US; dat staat tussen haakjes achter de mapnaam.

Begin met en-US: dat is de standaardtaal van de winkelpagina en wat iemand
ziet in elk land waarvoor geen vertaling bestaat. De andere vijf voeg je toe
onder "Vertalingen beheren".

PER TAAL, onder Groeien > Winkelaanwezigheid > Hoofdvermelding in de winkel:

  Naam van de app          -> uit teksten.md, "Titel (max 30)"
  Korte beschrijving       -> uit teksten.md, "Korte beschrijving (max 80)"
  Volledige beschrijving   -> uit teksten.md, "Volledige beschrijving"
  Telefoonschermen         -> alles uit de map schermen/ (het zijn er acht)
  Uitgelichte afbeelding   -> uitgelicht-1024x500.png

EEN KEER, niet per taal:

  App-icoon                -> icoon-512.png
  Video                    -> een YouTube-link; het bestand staat klaar in
                              store/video/<taal>/intro-breed.mp4 en moet eerst
                              naar YouTube (mag "verborgen" staan).

LET OP

  De schermen zijn 1080x1920. Play wil minimaal twee en maximaal acht per
  taal; er staan er precies acht.

  De teksten in teksten.md zijn op de tekens geteld die Play toelaat. Plak ze
  zoals ze zijn — een titel van 31 tekens wordt geweigerd.

  De tekst onder "App Store" in teksten.md is voor Apple. Voor Play heb je de
  kop "Google Play" nodig, onderaan hetzelfde bestand.

Gemaakt met: npm run playpakket
`)

if (gemist.length) {
  console.warn('\nDit ontbrak:')
  for (const f of [...new Set(gemist)]) console.warn('  ', path.relative(ROOT, f))
  console.warn('Draai eerst npm run screenshots / npm run marketing.\n')
}

const tel = async (dir) => {
  let n = 0
  for (const e of await readdir(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? await tel(path.join(dir, e.name)) : 1
  }
  return n
}
console.log(`${await tel(OUT)} bestanden in ${path.relative(ROOT, OUT)}/`)

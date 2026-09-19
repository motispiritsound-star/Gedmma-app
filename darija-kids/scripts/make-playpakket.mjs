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

/** Play neemt er acht; er staan er tien klaar. */
const MAX_SCHERMEN = 8

/**
 * Welke acht, en in welke volgorde ze op de winkelpagina komen.
 *
 * Niet op bestandsnaam sorteren: dan valt "10-aanbod" tussen 1 en 2 en vallen
 * de laatste twee buiten de acht. En de volgorde is een keuze, geen toeval.
 * De eerste twee laten zien wat de app doet — pas daarna werkt een prijs
 * overtuigend in plaats van afschrikkend, dus het aanbod staat derde. Wat
 * niet bestaat in een taal (het aanbod staat alleen in de eurozone) wordt
 * overgeslagen, en de volgende schuift op.
 */
const VOLGORDE = ['1-pad', '2-letters', '10-aanbod', '3-les', '4-woorden', '5-verhalen', '8-geschiedenis', '6-jij', '7-spelen', '9-herhalen']

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

  // Play vraagt de schermen per soort toestel apart: telefoon, 7-inch tablet
  // en 10-inch tablet. Een app die alleen telefoonschermen aanlevert komt in
  // de winkel op een tablet met een waarschuwing te staan dat hij daar
  // misschien niet goed op werkt — en dat leest een ouder als "niet voor mijn
  // iPad-generatie".
  for (const [bron, naar] of [['play', 'schermen'], ['play-7', 'schermen-tablet-7inch'], ['play-10', 'schermen-tablet-10inch']]) {
    const uit = path.join(ROOT, 'store', 'screenshots', lang, bron)
    const aanwezig = new Set((await readdir(uit).catch(() => [])).filter((f) => f.endsWith('.png')))
    const schermen = VOLGORDE.map((id) => `${id}.png`).filter((f) => aanwezig.has(f))
    if (!schermen.length) { gemist.push(uit); continue }
    await mkdir(path.join(map, naar), { recursive: true })
    for (const [i, file] of schermen.slice(0, MAX_SCHERMEN).entries()) {
      // Als JPEG, niet als PNG. De 10-inch schermen zijn 1600x2560 en wegen
      // als PNG een megabyte per stuk; zes talen maal drie toestelsoorten is
      // dan een pakket van bijna negentig megabyte dat niemand nog gemaild
      // krijgt. Play neemt JPEG net zo goed aan, en op kwaliteit 92 is het
      // verschil op een winkelpagina niet te zien.
      const doel = path.join(map, naar, `${i + 1}-${file.replace(/^\d+-/, '').replace(/\.png$/, '.jpg')}`)
      await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
        '-i', path.join(uit, file), '-q:v', '3', doel])
    }
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
  7-inch tabletschermen    -> alles uit schermen-tablet-7inch/
  10-inch tabletschermen   -> alles uit schermen-tablet-10inch/
  Uitgelichte afbeelding   -> uitgelicht-1024x500.png

EEN KEER, niet per taal:

  App-icoon                -> icoon-512.png
  Video                    -> een YouTube-link; het bestand staat klaar in
                              store/video/<taal>/intro-breed.mp4 en moet eerst
                              naar YouTube (mag "verborgen" staan).

LET OP

  De telefoonschermen zijn 1080x1920, de 7-inch 1200x1920 en de 10-inch
  1600x2560. Play wil minimaal twee en maximaal acht per soort; er staan er
  precies acht.

  De tabletschermen zijn geen bijzaak: zonder die twee mappen zet Play bij je
  app op een tablet een waarschuwing dat hij daar mogelijk niet goed werkt.

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

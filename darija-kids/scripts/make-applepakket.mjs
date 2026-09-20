/**
 * Hetzelfde als het Play-pakket, maar dan voor App Store Connect.
 *
 * De bestanden bestaan al — `npm run screenshots` en `npm run reviewshot`
 * maken ze — maar ze liggen in mappen die git negeert omdat er honderden
 * megabytes in zitten. Wie de winkelpagina invult zit achter een browser en
 * heeft die repo niet. Dit zet er één map van die je kunt meesturen, met de
 * teksten ernaast en een briefje dat zegt welk bestand waar hoort.
 *
 * Apple vraagt twee formaten en leidt de rest af: een iPhone van 6,9 inch
 * (1290x2796) en een iPad van 13 inch (2048x2732). Tien per formaat is het
 * maximum, en er staan er tien klaar.
 *
 * Draaien met: node scripts/make-applepakket.mjs [--lang nl,fr,...]
 */
import { execFile } from 'node:child_process'
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ffmpeg from 'ffmpeg-static'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store', 'appstore-pakket')

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const LANGS = arg('lang', 'nl,fr,de,es,it,en').split(',')

/** Wat Apple elke taal noemt, voor de mapnaam in het pakket. */
const APPLE_TAAL = {
  nl: 'Dutch', fr: 'French', de: 'German', es: 'Spanish (Spain)',
  it: 'Italian', en: 'English (U.S.)',
}

/**
 * De volgorde waarin ze op de productpagina komen.
 *
 * Niet op bestandsnaam sorteren: dan valt "10-aanbod" tussen 1 en 2. De eerste
 * twee beelden verkopen wat de app doet; pas daarna werkt een prijs
 * overtuigend in plaats van afschrikkend, dus het aanbod staat derde. Wat in
 * een taal niet bestaat — het aanbod staat alleen in de eurozone — wordt
 * overgeslagen en de rest schuift op.
 */
const VOLGORDE = ['1-pad', '2-letters', '10-aanbod', '3-les', '4-woorden', '5-verhalen', '8-geschiedenis', '6-jij', '7-spelen', '9-herhalen']

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const gemist = []

for (const lang of LANGS) {
  const map = path.join(OUT, `${lang} (${APPLE_TAAL[lang]})`)

  // De 6,5-inch map is er voor consoles die de 6,9-inch maat niet aanbieden;
  // is hij niet gerenderd, dan wordt hij stil overgeslagen.
  for (const [bron, naar] of [
    ['iphone', 'schermen-iphone-6.9'],
    ['iphone-65', 'schermen-iphone-6.5'],
    ['ipad', 'schermen-ipad-13'],
  ]) {
    const uit = path.join(ROOT, 'store', 'screenshots', lang, bron)
    const aanwezig = new Set((await readdir(uit).catch(() => [])).filter((f) => f.endsWith('.png')))
    const schermen = VOLGORDE.map((id) => `${id}.png`).filter((f) => aanwezig.has(f))
    if (!schermen.length) { gemist.push(uit); continue }
    await mkdir(path.join(map, naar), { recursive: true })
    for (const [i, bestand] of schermen.entries()) {
      // Als JPEG: een iPad-scherm weegt als PNG bijna twee megabyte, en zes
      // talen maal twee formaten is dan een pakket dat niemand nog gemaild
      // krijgt. Apple neemt JPEG net zo goed aan.
      const doel = path.join(map, naar, `${i + 1}-${bestand.replace(/^\d+-/, '').replace(/\.png$/, '.jpg')}`)
      await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
        '-i', path.join(uit, bestand), '-q:v', '3', doel])
    }
  }

  const teksten = path.join(ROOT, 'store', `listing.${lang}.md`)
  await cp(teksten, path.join(map, 'teksten.md')).catch(() => gemist.push(teksten))
}

/** De review-opname hoort bij de drie producten, niet bij een taal. */
const review = path.join(ROOT, 'store', 'review-screenshot', 'abonnement-nl-1290x2796.png')
await cp(review, path.join(OUT, 'review-screenshot.png')).catch(() => gemist.push(review))

await writeFile(path.join(OUT, 'LEES-DIT-EERST.txt'), `Darijaforkids — wat waar hoort in App Store Connect
===================================================

Per taal staat hier een map. Apple noemt die talen Dutch, French, German,
Spanish (Spain), Italian en English (U.S.); dat staat tussen haakjes achter
de mapnaam.

Begin met English (U.S.): dat is de primaire taal van de vermelding en wat
iemand ziet in elk land waarvoor geen vertaling bestaat. De andere vijf voeg
je toe onder het taalmenu rechtsboven op de pagina van de app.

PER TAAL, onder Distribution > je versie:

  Naam                     -> uit teksten.md, "Naam (max 30)"
  Ondertitel               -> uit teksten.md, "Ondertitel (max 30)"
  Trefwoorden              -> uit teksten.md, "Trefwoorden (max 100)"
  Promotietekst            -> uit teksten.md, "Promotietekst (max 170)"
  Beschrijving             -> uit teksten.md, "Beschrijving (max 4000)"
  iPhone 6.9" schermen     -> alles uit schermen-iphone-6.9/ (het zijn er tien)
  iPhone 6.5" schermen     -> alles uit schermen-iphone-6.5/, als de console
                              om 1284 x 2778 vraagt in plaats van 1290 x 2796
  iPad 13" schermen        -> alles uit schermen-ipad-13/

EEN KEER, niet per taal:

  Review Screenshot        -> review-screenshot.png, bij alle drie de
                              producten: Jaar, Maand en het e-boek
  App-icoon                -> zit in de build zelf, niet apart te uploaden
  App Preview (film)       -> store/video/<taal>/intro-appstore.mp4

LET OP

  Apple vraagt alleen deze twee formaten en leidt de kleinere toestellen zelf
  af. Tien per formaat is het maximum; er staan er precies tien.

  Het derde beeld noemt de prijs. Dat staat er bewust niet in het Engels bij:
  de Engelse vermelding is de terugval voor de hele wereld, en euro's op een
  plaatje kloppen dan niet met wat een Amerikaan betaalt. Engels heeft er dus
  negen.

  De teksten in teksten.md zijn geteld op de limieten die Apple hanteert. Plak
  ze zoals ze zijn — een naam van 31 tekens wordt geweigerd.

  De tekst onder "Google Play" in teksten.md is voor de andere winkel. Voor
  Apple heb je de kop "App Store" nodig, bovenaan hetzelfde bestand.

Gemaakt met: npm run applepakket
`)

if (gemist.length) {
  console.warn('\nDit ontbrak:')
  for (const f of [...new Set(gemist)]) console.warn('  ', path.relative(ROOT, f))
  console.warn('Draai eerst npm run screenshots en npm run reviewshot.\n')
}

const tel = async (dir) => {
  let n = 0
  for (const e of await readdir(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? await tel(path.join(dir, e.name)) : 1
  }
  return n
}
console.log(`${await tel(OUT)} bestanden in ${path.relative(ROOT, OUT)}/`)

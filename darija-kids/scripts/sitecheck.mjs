/**
 * Loopt de gezette website na op links die nergens heen gaan.
 *
 * Zestig bladzijden in zes talen zijn meer dan iemand met de hand nakijkt, en
 * de fout waar het om gaat is onzichtbaar tot een bezoeker hem vindt: een
 * `href` naar een pagina die niet meer zo heet, een plaatje dat bij het
 * hernoemen is blijven liggen, een `#download` die nergens meer op staat.
 *
 * Dat mag niet op de dag van de lancering gebeuren. Op die dag komen er in één
 * uur meer mensen langs dan in de maand ervoor, en die komen niet terug.
 *
 * Wat er gecontroleerd wordt:
 *   - elke interne link levert een bestand op, met de regels van Cloudflare
 *     erbij (`/privacy` is `/privacy/index.html`)
 *   - elk plaatje, elk stylesheet, elk bestand om te downloaden bestaat
 *   - elke `#anker` staat ook echt op de bladzijde waar hij naar wijst
 *   - elke externe link is https en heeft een geldige vorm
 *
 * Draaien met:
 *   node scripts/sitecheck.mjs [--map site] [--extern]
 *
 * `--extern` haalt de externe adressen ook echt op. Dat duurt langer en kan
 * een valse alarmbel geven achter een proxy, dus het staat standaard uit.
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terug
}
const MAP = path.resolve(ROOT, arg('map', 'site'))
const EXTERN = process.argv.includes('--extern')

/* ------------------------------------------------------------------ lezen */

const bladzijden = async (map) => {
  const uit = []
  for (const naam of await readdir(map)) {
    const pad = path.join(map, naam)
    if ((await stat(pad)).isDirectory()) uit.push(...await bladzijden(pad))
    else if (naam.endsWith('.html')) uit.push(pad)
  }
  return uit
}

const bestaat = async (pad) => {
  try { return (await stat(pad)).isFile() } catch { return false }
}

/**
 * Van een adres op de bladzijde naar een bestand op de schijf.
 *
 * `html_handling = "auto-trailing-slash"` in wrangler.toml betekent dat
 * `/privacy` het bestand `/privacy/index.html` oplevert. Wie dat hier niet
 * nadoet, meldt zestig fouten die geen van alle bestaan.
 */
const bestandVan = async (adres, vanaf) => {
  const zonder = decodeURI(adres.split('#')[0].split('?')[0])
  if (!zonder) return null
  const grond = zonder.startsWith('/') ? path.join(MAP, zonder) : path.join(path.dirname(vanaf), zonder)
  for (const kandidaat of [grond, `${grond}.html`, path.join(grond, 'index.html')]) {
    if (await bestaat(kandidaat)) return kandidaat
  }
  return null
}

/* ---------------------------------------------------------------- nakijken */

const ANKERS = /\sid="([^"]+)"/g
const VERWIJZING = /\s(href|src|content)="([^"]+)"/g

const fouten = []
const extern = new Map()
const pagina = await bladzijden(MAP)
const ankersVan = new Map()

for (const pad of pagina) {
  const html = await readFile(pad, 'utf8')
  ankersVan.set(pad, new Set([...html.matchAll(ANKERS)].map((m) => m[1])))
}

for (const pad of pagina) {
  const html = await readFile(pad, 'utf8')
  const kort = path.relative(MAP, pad)
  const gezien = new Set()

  for (const [, veld, adres] of html.matchAll(VERWIJZING)) {
    if (gezien.has(adres)) continue
    gezien.add(adres)
    if (!adres || adres.startsWith('data:') || adres.startsWith('mailto:') || adres.startsWith('tel:')) continue
    // `content` draagt meestal geen adres maar een beschrijving of een kleur.
    // Alleen wat eruitziet als een adres wordt nagelopen.
    if (veld === 'content' && !/^(https?:\/\/|\/)/.test(adres)) continue

    if (/^https?:\/\//.test(adres)) {
      if (adres.startsWith('http://')) fouten.push(`${kort}: http in plaats van https — ${adres}`)
      extern.set(adres, (extern.get(adres) ?? 0) + 1)
      continue
    }
    if (!adres.startsWith('/') && !adres.startsWith('#') && !adres.startsWith('.')) continue

    if (adres.startsWith('#')) {
      const anker = adres.slice(1)
      if (anker && !ankersVan.get(pad)?.has(anker)) fouten.push(`${kort}: geen ${adres} op deze bladzijde`)
      continue
    }

    const doel = await bestandVan(adres, pad)
    if (!doel) { fouten.push(`${kort}: ${adres} bestaat niet`); continue }

    const hekje = adres.split('#')[1]
    if (hekje && doel.endsWith('.html') && !ankersVan.get(doel)?.has(hekje)) {
      fouten.push(`${kort}: ${adres} — die bladzijde heeft geen #${hekje}`)
    }
  }
}

/* -------------------------------------------------------------- het script */

/**
 * Elk stukje javascript op de bladzijde moet ook echt javascript zijn.
 *
 * De bladzijden worden gezet met sjabloonstrings, en die worden begrensd door
 * accenten grave. Eén zo'n accent in een commentaar sluit de string, en dan
 * staat er ineens code op de bladzijde die nergens op slaat. Dat is hier twee
 * keer gebeurd, en allebei de keren viel de bouw pas om bij toeval.
 *
 * `new Function` voert niets uit; het ontleedt alleen. Meer is niet nodig: een
 * afgekapte string valt al bij het ontleden om.
 */
const SCRIPTS = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g

for (const pad of pagina) {
  const html = await readFile(pad, 'utf8')
  for (const [, code] of html.matchAll(SCRIPTS)) {
    if (!code.trim()) continue
    try { new Function(code) } catch (fout) {
      fouten.push(`${path.relative(MAP, pad)}: het script valt om — ${fout.message}`)
    }
  }
}

/* ---------------------------------------------------------- de omschrijving */

/**
 * Wat een zoekmachine onder een zoekresultaat zet.
 *
 * Google kapt af rond de honderdzestig tekens, midden in een woord. Zestien
 * bladzijden zaten daarboven — de geschiedenispagina's op ruim
 * tweehonderdveertig — omdat de omschrijving simpelweg de inleiding van de
 * bladzijde was. `kort()` in `make-site.mjs` knipt nu op een zinseinde; dit
 * bewaakt dat er geen bladzijde langs komt die daar omheen gaat.
 *
 * En dat er één ís: een bladzijde zonder omschrijving laat Google zelf een
 * zin uitkiezen, en die keus valt zelden goed uit.
 */
const MAXOM = 160

for (const pad of pagina) {
  const html = await readFile(pad, 'utf8')
  const kortpad = path.relative(MAP, pad)
  const om = html.match(/<meta name="description" content="([^"]*)"/)?.[1]
  if (!om) { fouten.push(`${kortpad}: geen omschrijving`); continue }
  const n = [...om].length
  if (n > MAXOM) fouten.push(`${kortpad}: de omschrijving is ${n} tekens, meer dan ${MAXOM}`)
}

/* ------------------------------------------------------- sitemap en noindex */

/**
 * Elke bladzijde staat óf in de sitemap, óf op noindex.
 *
 * Er is geen derde geval. Een bladzijde die in geen van beide staat is
 * vergeten: hij wordt wel gevonden — via het menu of de voettekst — maar
 * niemand heeft besloten of dat de bedoeling was.
 *
 * Zo stond het portaal erbij. Dat is een persoonlijke hoek achter een inlog en
 * het was met opzet uit de sitemap gelaten, maar het stond niet op noindex.
 * Dan zet Google een leeg inlogformulier in de zoekresultaten, mogelijk boven
 * de startpagina, bij iemand die op onze naam zoekt.
 */
{
  const kaart = await readFile(path.join(MAP, 'sitemap.xml'), 'utf8').catch(() => '')
  if (!kaart) fouten.push('er is geen sitemap.xml')
  const erin = new Set([...kaart.matchAll(/<loc>([^<]*)<\/loc>/g)]
    .map((m) => m[1].replace(/^https?:\/\/[^/]+/, '') || '/'))

  for (const pad of pagina) {
    const kortpad = path.relative(MAP, pad)
    if (kortpad === '404.html') continue          // die hoort nergens in
    const adres = `/${kortpad.replace(/index\.html$/, '').replace(/\/$/, '')}` || '/'
    const html = await readFile(pad, 'utf8')
    const noindex = /name="robots"[^>]*noindex|noindex[^>]*name="robots"/.test(html)
    if (erin.has(adres) || erin.has(`${adres}/`) || (adres === '/' && erin.has('/'))) {
      if (noindex) fouten.push(`${kortpad}: staat in de sitemap én op noindex`)
    } else if (!noindex) {
      fouten.push(`${kortpad}: staat niet in de sitemap en niet op noindex — vergeten?`)
    }
  }
}

/* ----------------------------------------------------------------- extern */

if (EXTERN) {
  let mis = 0
  for (const adres of extern.keys()) {
    try {
      const antwoord = await fetch(adres, { method: 'GET', redirect: 'follow' })
      if (!antwoord.ok) { mis++; fouten.push(`extern: ${antwoord.status} op ${adres}`) }
    } catch (fout) {
      mis++
      fouten.push(`extern: onbereikbaar — ${adres} (${fout.message})`)
    }
  }
  /**
   * Valt bijna alles om, dan is niet het hele internet stuk maar deze machine
   * afgesloten. Dat is geen theorie: achter een proxy geeft elk adres 403, en
   * dan staan er zeventig "problemen" die geen van alle bestaan.
   */
  if (mis > extern.size * 0.8 && extern.size > 3) {
    fouten.length = 0
    console.error(`\n${mis} van de ${extern.size} adressen gaven een fout — dat is geen website`)
    console.error('maar een netwerk dat niets doorlaat. Draai dit op een gewone verbinding.')
    process.exit(2)
  }
}

/* ---------------------------------------------------------------- melden */

console.log(`${pagina.length} bladzijden, ${extern.size} verschillende adressen naar buiten`)
if (!EXTERN && extern.size) {
  console.log('\nNaar buiten (niet opgehaald; draai met --extern om dat wel te doen):')
  for (const [adres, hoevaak] of [...extern].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(hoevaak).padStart(3)}×  ${adres}`)
  }
}

if (!fouten.length) {
  console.log('\nGeen dode links.')
  process.exit(0)
}
console.error(`\n${fouten.length} ${fouten.length === 1 ? 'probleem' : 'problemen'}:\n`)
for (const f of fouten) console.error(`  ${f}`)
console.error('')
process.exit(1)

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
    /*
     * Let op de scheidingstekens.
     *
     * `path.relative` geeft op Windows `es\index.html`, en een URL kent geen
     * backslash. Zonder deze omzetting werd het adres `/es\`, stond dat
     * nergens in de sitemap, en meldde dit blok bijna elke bladzijde als
     * vergeten — dertig regels rood bij elke bouw, en omdat `fouten.push`
     * hier staat, stopte de bouw daarop. Op Linux viel dat nooit op.
     *
     * Gevolg: sinds deze controle er staat (25 september) faalde `npm run
     * build` op Adils machine, en dus ook `npm run aab`, want die begint
     * ermee. De bundels van 23 en 24 september zijn nog gebouwd voordat dit
     * blok bestond.
     */
    const kortpad = path.relative(MAP, pad).split(path.sep).join('/')
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

/* ------------------------------------------------- en het cachebeleid */

/**
 * Elke map met vaste bestanden hoort in `_headers` te staan.
 *
 * `/shots` stond er niet in: zes talen aan schermafdrukken, 1,8 MB, tien keer
 * genoemd op de thuisbladzijde, en bij elk bezoek opnieuw nagevraagd — precies
 * de heenreis die `_headers` wil wegnemen, op de ene bladzijde waarvoor het
 * geschreven is.
 *
 * Dat is geen vergeten regel maar een vorm die vanzelf scheeftrekt: er komt een
 * map bij en `_headers` weet daar niets van. Dus telt de machine ze.
 *
 * Deze controle staat hier en niet in een test, omdat hij de gebouwde site
 * nodig heeft. `site/` staat in .gitignore, dus bij een verse kloon bestaat hij
 * pas na `npm run build` — en `npm test` draait in CI daarvóór. Een test die
 * eruit leest faalt daar met ENOENT, en dat is precies wat er gebeurde.
 */
const VAST = /\.(webp|png|jpe?g|svg|avif|woff2?|mp4|webm|ico|json)$/i
try {
  const headers = await readFile(path.join(MAP, '_headers'), 'utf8')
  const geregeld = new Set([...headers.matchAll(/^\/([a-z0-9-]+)\/\*/gm)].map((m) => m[1]))
  for (const ding of await readdir(MAP, { withFileTypes: true })) {
    if (!ding.isDirectory() || ding.name.startsWith('.')) continue
    const erin = await readdir(path.join(MAP, ding.name), { recursive: true })
    const hoeveel = erin.filter((f) => VAST.test(String(f))).length
    // Een map met een handvol bestanden is de moeite niet; het gaat om de
    // mappen waar een bezoeker echt op wacht.
    if (hoeveel >= 5 && !geregeld.has(ding.name)) {
      fouten.push(`/${ding.name}: ${hoeveel} vaste bestanden en geen cacheregel — zet hem in _headers in scripts/make-site.mjs`)
    }
  }
} catch (fout) {
  fouten.push(`_headers: ${fout instanceof Error ? fout.message : fout}`)
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

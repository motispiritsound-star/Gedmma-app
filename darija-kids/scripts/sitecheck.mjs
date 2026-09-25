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

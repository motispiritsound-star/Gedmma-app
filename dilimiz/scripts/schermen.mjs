/**
 * De schermafdrukken voor de Play Console.
 *
 *   npm run schermen
 *
 * Google eist er minstens twee en staat er acht toe, 9:16, minstens 320 pixels
 * breed. Dit maakt er zes op 1080x1920 uit de échte app, in het Duits -- want
 * dat is de markt waar mee begonnen wordt.
 *
 * Uit de echte app en niet uit een ontwerp: een schermafdruk die mooier is dan
 * de app levert een eenster-beoordeling op met "ziet er heel anders uit". En
 * als de app verandert, verandert de afdruk mee zodra je dit opnieuw draait.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WORTEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const NAAR = path.join(WORTEL, 'winkel', 'schermen')
const BASIS = process.argv[2] ?? 'http://localhost:4173'

mkdirSync(NAAR, { recursive: true })

const browser = await chromium.launch()
// 1080x1920 met deviceScaleFactor 3 geeft een scherpe afdruk van 360x640 css.
const pagina = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 })

let n = 0
const afdruk = async (naam) => {
  const bestand = path.join(NAAR, `${String(++n).padStart(2, '0')}-${naam}.png`)
  await pagina.screenshot({ path: bestand })
  console.log(`  ${path.relative(WORTEL, bestand)}`)
}

await pagina.goto(BASIS, { waitUntil: 'networkidle' })
await afdruk('willkommen')

// Duits, want daar wordt mee begonnen.
await pagina.getByRole('button', { name: /Deutsch/ }).click()
await afdruk('eltern')

await pagina.getByRole('button', { name: /Verstanden/ }).click()
await pagina.getByRole('textbox').fill('Deniz')
await pagina.getByRole('button', { name: /^Weiter$/ }).click()
await pagina.getByRole('button', { name: '🦊' }).click()
await pagina.getByRole('button', { name: /^Weiter$/ }).click()
await pagina.getByRole('button', { name: /7 bis 11/ }).click()
await pagina.getByRole('button', { name: /^Weiter$/ }).click()
await pagina.getByRole('button', { name: /Los geht/ }).click()
await afdruk('weg')

// Het alfabet: dat is wat deze app anders maakt dan een algemene taalapp.
await pagina.goto(`${BASIS}#/alfabet`, { waitUntil: 'networkidle' })
await afdruk('buchstaben')

// Een letterkaart uit de eerste les.
await pagina.goto(`${BASIS}#/`, { waitUntil: 'networkidle' })
await pagina.getByRole('link', { name: /Hier anfangen|Weiter, wo du warst/ }).first().click()
const tip = pagina.getByRole('button', { name: /Verstanden/ })
if (await tip.count()) await tip.click()
await afdruk('lektion')

// En een oefening, zodat zichtbaar is dat er geoefend wordt en niet gelezen.
const volgende = pagina.getByRole('button', { name: /^Weiter$/ })
if (await volgende.count()) await volgende.first().click()
await afdruk('uebung')

await browser.close()
console.log('')
console.log(`${n} schermafdrukken, 1080x1920, in winkel/schermen/`)
console.log('Upload er minstens twee in de Play Console.')

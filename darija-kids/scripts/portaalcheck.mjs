/**
 * Loopt het portaal en de lezer na in een echte browser.
 *
 * Dit is de weg die een koper aflegt: hij betaalt, meldt zich aan met zijn
 * e-mailadres, klikt op de link in zijn mail, en ziet dan zijn boeken staan.
 * Vier bladzijden, twee domeinen en een koekje — en geen enkele unittest die
 * er iets over zegt, want alles wat ertoe doet gebeurt in de browser.
 *
 * Het is ook geen theorie dat dit misgaat. Toen dit script er voor het eerst
 * was, wees de knop "lezen" in het portaal naar `/lezen#sleutels`, en die
 * bladzijde wilde een sleutel van tweeëndertig tekens. Wie inlogde en op zijn
 * boek klikte, kreeg te horen dat hij geen sleutel had.
 *
 * De worker draait hier niet mee: zijn antwoorden staan hieronder. Dat is met
 * opzet — deze controle gaat over wat de bladzijden met die antwoorden doen,
 * en moet werken zonder database, zonder mail en zonder internet.
 *
 * Draaien met:
 *   node scripts/portaalcheck.mjs [--map site] [--taal nl]
 */
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terug
}
const MAP = path.resolve(ROOT, arg('map', 'site'))
const PORT = 4392

/* ------------------------------------------------------- de site serveren */

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
                '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' }

const zoek = async (pad) => {
  for (const kandidaat of [pad, `${pad}.html`, path.join(pad, 'index.html')]) {
    try { if ((await stat(kandidaat)).isFile()) return kandidaat } catch { /* volgende */ }
  }
  return null
}

const site = createServer(async (verzoek, antwoord) => {
  const vraag = decodeURI((verzoek.url ?? '/').split('?')[0])
  const bestand = await zoek(path.join(MAP, vraag))
  if (!bestand) { antwoord.writeHead(404); return antwoord.end('404') }
  antwoord.writeHead(200, { 'content-type': TYPES[path.extname(bestand)] ?? 'application/octet-stream' })
  createReadStream(bestand).pipe(antwoord)
})
await new Promise((klaar) => site.listen(PORT, klaar))

/* ------------------------------------------------- wat de worker antwoordt */

const BOEK = {
  titel: 'De olijvenbrand', jaar: '1912', waar: 'Fes',
  hoofdstukken: [{ nummer: 1, titel: 'De rook boven de gaard', tekst: ['Het begon met rook.', 'Niemand keek op.'] }],
}

const fouten = []
const meld = (goed, wat) => {
  console.log(`${goed ? '  ok  ' : ' MIS  '}${wat}`)
  if (!goed) fouten.push(wat)
}

const browser = await startChroom()

/**
 * Eén bezoek, met een worker die antwoordt zoals wij zeggen.
 *
 * `antwoorden` is een tabel van pad naar wat eruit komt: een object wordt JSON
 * met status 200, een getal wordt een lege fout met die status.
 */
const bezoek = async (adres, antwoorden) => {
  const context = await browser.newContext()
  const bladzijde = await context.newPage()
  const gezien = []
  await bladzijde.route('**/post.darijaforkids.eu/**', async (route) => {
    const pad = new URL(route.request().url()).pathname
    gezien.push(pad)
    const uit = antwoorden[pad]
    if (uit === undefined) return await route.fulfill({ status: 404, body: '{}' })
    if (typeof uit === 'number') return await route.fulfill({ status: uit, body: '{}' })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(uit) })
  })
  await bladzijde.goto(`http://127.0.0.1:${PORT}${adres}`, { waitUntil: 'networkidle' })
  return { bladzijde, context, gezien }
}

/* ------------------------------------------------------------ het portaal */

console.log('\nHet portaal')
{
  const { bladzijde, context } = await bezoek('/portaal', { '/portaal/mij': { binnen: false } })
  meld(await bladzijde.locator('#aanmelden').isVisible(), 'wie niet is ingelogd, krijgt het aanmeldformulier')
  meld(!(await bladzijde.locator('#binnen').isVisible()), 'en niet de boekenlijst')
  const knop = bladzijde.locator('#aanmelden button[type=submit]')
  meld(await knop.count() === 1, 'er staat één knop om een link aan te vragen')
  await context.close()
}

{
  const { bladzijde, context } = await bezoek('/portaal', {
    '/portaal/mij': { binnen: true, email: 'koper@example.com', nieuws: false, reeksen: ['sleutels'] },
  })
  meld(await bladzijde.locator('#binnen').isVisible(), 'wie wel is ingelogd, ziet zijn boeken')
  meld(!(await bladzijde.locator('#aanmelden').isVisible()), 'en niet meer het formulier')
  meld((await bladzijde.locator('#wie').textContent() ?? '').includes('koper@example.com'),
       'met het adres waarmee hij binnen is')
  const links = await bladzijde.locator('#boekenlijst a').evaluateAll((a) => a.map((x) => x.getAttribute('href')))
  meld(links.length === 1, 'één gekochte reeks geeft één knop')
  /**
   * De knop moet op een bladzijde uitkomen die bestaat, en op een stand die
   * werkt. Dit is precies de regel die een keer naar `#sleutels` wees terwijl
   * de lezer een sleutel van tweeëndertig tekens verwachtte.
   */
  meld(links.every((h) => h && h.startsWith('/lezen')), `de knop wijst naar de lezer (${links.join(', ')})`)
  await context.close()
}

{
  const { bladzijde, context } = await bezoek('/portaal', {
    '/portaal/mij': { binnen: true, email: 'koper@example.com', nieuws: false, reeksen: [] },
  })
  meld(await bladzijde.locator('#leeg').isVisible(), 'wie nog niets heeft gekocht, wordt naar de winkel gewezen')
  await context.close()
}

/* -------------------------------------------------------------- de lezer */

console.log('\nDe lezer')
{
  const { bladzijde, context } = await bezoek('/lezen', { '/lezen': 404 })
  const tekst = (await bladzijde.locator('#lezer').textContent()) ?? ''
  meld(tekst.trim().length > 20, 'zonder sleutel en zonder koekje staat er uitleg')
  const uitweg = bladzijde.locator('#lezer a')
  meld(await uitweg.count() === 1, 'met één knop eronder')
  meld((await uitweg.getAttribute('href')) === '/portaal', 'die naar het portaal wijst')
  await context.close()
}

{
  const { bladzijde, context, gezien } = await bezoek('/lezen#sleutels', {
    '/lezen': { reeksen: ['sleutels'], taal: 'nl', merk: 'koper@example.com' },
    '/blad': BOEK,
  })
  meld(gezien.includes('/lezen'), 'met een koekje vraagt hij zijn boeken op')
  const knoppen = bladzijde.locator('#lezer .boekjes button')
  meld(await knoppen.count() === 15, `vijftien delen om uit te kiezen (${await knoppen.count()})`)
  await knoppen.first().click()
  await bladzijde.waitForSelector('#lezer h2', { timeout: 5000 }).catch(() => {})
  const kop = (await bladzijde.locator('#lezer h2').first().textContent()) ?? ''
  meld(kop.includes('De olijvenbrand'), `het boek gaat open (${kop})`)
  const alinea = (await bladzijde.locator('#lezer p').allTextContents()).join(' ')
  meld(alinea.includes('Het begon met rook.'), 'en de tekst staat erin')
  await context.close()
}

{
  // Een sleutel uit de bestelmail: dezelfde bladzijde, andere deur.
  const sleutel = 'a'.repeat(32)
  const { bladzijde, context } = await bezoek(`/lezen#${sleutel}`, {
    '/lezen': { reeksen: ['sba', 'sleutels'], taal: 'nl', merk: 'bestelling 123' },
  })
  const koppen = await bladzijde.locator('#lezer h3').allTextContents()
  meld(koppen.length === 2, `twee reeksen geven twee koppen (${koppen.join(' / ')})`)
  await context.close()
}

/* ---------------------------------------------------------------- klaar */

await browser.close()
site.close()

if (fouten.length) {
  console.error(`\n${fouten.length} van de controles ging mis.\n`)
  process.exit(1)
}
console.log('\nHet hele rondje loopt.\n')

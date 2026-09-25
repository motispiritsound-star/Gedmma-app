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
  // Twee alinea's, drie zinnen: zo komt ook het knippen binnen een alinea
  // onder de controle te staan, en niet alleen het knippen tussen alinea's.
  hoofdstukken: [{
    nummer: 1, titel: 'De rook boven de gaard',
    tekst: ['Het begon met rook. Niemand keek op.', 'De gaard stond in brand.'],
  }],
}

const fouten = []
/**
 * Elke fout die een bladzijde gooit, waar dan ook in het rondje.
 *
 * Dit stond er eerst niet, en toen ging het mis: in de voorleesbalk werd een
 * `const` gebruikt vijfentwintig regels boven zijn eigen declaratie. Dat is
 * geen lege waarde maar een ReferenceError, en die viel middenin het opbouwen
 * van de balk — de knop stond er wel, leeg, en de stemmenlijst bleef leeg.
 * Alle controles bleven groen, want die telden of de knop er was.
 *
 * Een bladzijde die een fout gooit is stuk, ook als hij er goed uitziet.
 */
const paginafouten = []
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
const bezoek = async (adres, antwoorden, beginscript) => {
  const context = await browser.newContext()
  if (beginscript) await context.addInitScript(beginscript)
  const bladzijde = await context.newPage()
  bladzijde.on('pageerror', (fout) => paginafouten.push(`${adres} — ${fout.message}`))
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

/* ------------------------------------------------- het gratis begin */

console.log('\nDe teaser')
{
  const { bladzijde, context } = await bezoek('/leesboeken', {})
  const knop = bladzijde.locator('#proefknop')
  meld(await knop.count() === 1, 'op de boekenpagina staat een knop om het begin te lezen')
  meld(!(await bladzijde.locator('#proef').isVisible()), 'en het boek staat nog dicht')
  await knop.click()
  await bladzijde.waitForSelector('#proef .zin', { timeout: 5000 }).catch(() => {})
  const zinnen = await bladzijde.locator('#proef .zin').count()
  meld(zinnen > 40, `het begin gaat open en is in zinnen geknipt (${zinnen})`)
  meld(await bladzijde.locator('#proef .leesbalk .speel').count() === 1,
       'met dezelfde voorleesknop als na het afrekenen')
  /* En er moet iets óp die knop staan. Dat de knop bestaat zegt niets: hij
     wordt leeg aangemaakt en pas later van tekst voorzien, dus een fout
     daartussen laat precies dit over — een knop die er is en niets zegt. */
  const opDeKnop = (await bladzijde.locator('#proef .leesbalk .speel').textContent()) ?? ''
  meld(opDeKnop.trim().length > 0, `en er staat tekst op die knop (${opDeKnop.trim() || 'leeg'})`)
  /**
   * De klasse `lezer` moet blijven staan. Hier stond ooit `className = 'boek'`,
   * en dat gooide hem weg — waarmee ook de opmaak verdween die eraan hangt,
   * zoals de zin die oplicht. Alles werkte, het zag er alleen anders uit dan op
   * de andere bladzijde, en niemand kon zeggen waarom.
   */
  meld(await bladzijde.locator('#proef.lezer.boek').count() === 1,
       'het vak houdt zijn opmaak (lezer én boek)')
  meld(await bladzijde.locator('#proef .leestekst em').count() > 0,
       'sterretjes uit de brontekst zijn cursief, geen sterretjes')
  meld(await bladzijde.locator('#proef .boekplaat').count() === 1,
       'het geschilderde tafereel staat boven het verhaal')
  const koppen = await bladzijde.locator('#proef h3').count()
  meld(koppen === 3, `drie hoofdstukken, en niet het hele boek (${koppen})`)
  await knop.click()
  meld(!(await bladzijde.locator('#proef').isVisible()), 'en hij gaat ook weer dicht')
  await context.close()
}

{
  // Dezelfde teaser in het Frans hoort Frans te zijn. Dat klinkt vanzelf-
  // sprekend; het ging in dit project al een keer mis in de andere richting.
  const { bladzijde, context } = await bezoek('/fr/livres', {})
  await bladzijde.locator('#proefknop').click()
  await bladzijde.waitForSelector('#proef .zin', { timeout: 5000 }).catch(() => {})
  const eerste = (await bladzijde.locator('#proef .zin').first().textContent()) ?? ''
  meld(eerste.includes('réveillée'), `de Franse teaser is Frans (${eerste.trim().slice(0, 40)})`)
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

  /**
   * Het luisteren. De stem zelf kan hier niet klinken — een browser zonder
   * geluidskaart heeft geen stemmen — maar wat wél te zien is, is of het boek
   * in zinnen is geknipt en of de knop er staat. Dat is waar de belofte
   * "luister/leesboeken" op rust.
   */
  const zinnen = bladzijde.locator('#lezer .zin')
  meld(await zinnen.count() === 3, `het boek is in zinnen geknipt (${await zinnen.count()})`)
  meld((await zinnen.first().textContent() ?? '').trim() === 'Het begon met rook.',
       'elke zin staat apart, want die licht straks op')
  const speel = bladzijde.locator('#lezer .leesbalk .speel')
  meld(await speel.count() === 1, 'er staat een voorleesknop boven het boek')
  await context.close()
}

{
  /**
   * Een prentenboek: de plaat, en eronder de voorleestekst met een stem.
   * Zonder die tekst is het geen luisterboek maar een stapel plaatjes.
   */
  const plaatje = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  const { bladzijde, context } = await bezoek('/lezen#sba', {
    '/lezen': { reeksen: ['sba'], taal: 'nl', merk: 'koper@example.com' },
    '/blad': {
      nummer: 1, titel: 'Sba in Tanger', ondertitel: '', waar: 'Tanger',
      // Vier bladzijden voorwerk, dan de plaat en het verhaal van blad 0.
      bladzijden: [null, null, null, null, 0, 0],
      bladen: [{ tekst: ['De boten zijn blauw. Allemaal.', 'Er springt nog iets in.'], woord: {}, echo: '' }],
    },
  })
  await bladzijde.locator('#lezer .boekjes button').first().click()
  await bladzijde.waitForSelector('#lezer .boek img', { timeout: 5000 }).catch(() => {})
  meld(await bladzijde.locator('#lezer .bladtekst .zin').count() === 0,
       'de omslag zwijgt, want daar hoort geen verhaal bij')

  // Vier bladzijden voorwerk, dan begint het verhaal.
  const verder = bladzijde.locator('#lezer .boek .balk button').nth(1)
  for (let i = 0; i < 4; i++) await verder.click()
  await bladzijde.waitForSelector('#lezer .bladtekst .zin', { timeout: 5000 }).catch(() => {})
  const zinnen = await bladzijde.locator('#lezer .bladtekst .zin').count()
  meld(zinnen === 3, `op bladzijde vijf staat de voorleestekst, in zinnen (${zinnen})`)
  meld(await bladzijde.locator('#lezer .bladtekst .leesbalk .speel').count() === 1,
       'met een voorleesknop, net als bij de leesboeken')
  await context.close()
}

{
  // Sba staat nog niet in de bak. Dan hoort er een zin te staan, geen leeg vak.
  const { bladzijde, context } = await bezoek('/lezen#sba', {
    '/lezen': { reeksen: ['sba'], taal: 'nl', merk: 'koper@example.com' },
    '/blad': 503,
  })
  await bladzijde.locator('#lezer .boekjes button').first().click()
  await bladzijde.waitForTimeout(500)
  const tekst = (await bladzijde.locator('#lezer').textContent()) ?? ''
  meld(tekst.includes('staat nog niet online'), 'een boek dat er nog niet is, zegt dat')
  meld(tekst.includes('bestelmail'), 'en wijst naar de pdf die wel werkt')
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

/**
 * Waar je met een vinger op kunt tikken.
 *
 * De vragenlijst op de startpagina had de ruimte op de kaart staan en niet op
 * de `summary` erin. Dat ziet er op een breed scherm hetzelfde uit, maar het
 * aanraakvlak was achtentwintig punten hoog — de regel tekst — met daaromheen
 * een rand die er klikbaar uitziet en niets doet. Op een telefoon mis je die.
 *
 * Vinkjes blijven buiten schot: die zitten in een `<label>` met de tekst erin,
 * dus je tikt op de hele regel.
 */
console.log('\nOp een telefoon')
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const bladzijde = await context.newPage()
  bladzijde.on('pageerror', (fout) => paginafouten.push(`/ (telefoon) — ${fout.message}`))
  await bladzijde.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })
  const klein = await bladzijde.evaluate(() => {
    const uit = []
    for (const el of document.querySelectorAll('summary, button')) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0 || r.height >= 32) continue
      uit.push(`${el.tagName.toLowerCase()} ${Math.round(r.height)}px "${(el.textContent || '').trim().slice(0, 24)}"`)
    }
    return uit
  })
  for (const k of klein) console.log(`      ${k}`)
  meld(klein.length === 0, `elke knop en elke vraag is hoog genoeg om te raken (${klein.length} te klein)`)
  const vraag = await bladzijde.locator('details.q summary').first().boundingBox()
  meld(Boolean(vraag) && vraag.height >= 44, `een vraag uit de lijst is ${Math.round(vraag?.height ?? 0)} punten hoog`)
  await context.close()
}

/**
 * Wat er staat nadat je een link hebt aangevraagd.
 *
 * De aanhef zegt "meld je aan met je e-mailadres, je krijgt een link in je
 * mail". Dat is precies wat je net hebt gedaan, en hij bleef staan boven het
 * blok "kijk in je mail" — met een gat ertussen waar het formulier stond.
 */
console.log('\nNa het aanvragen')
{
  const { bladzijde, context } = await bezoek('/portaal', {
    '/portaal/mij': { binnen: false },
    '/portaal/aanmelden': { goed: true },
  })
  await bladzijde.fill('#aanmelden input[type=email]', 'koper@example.com')
  for (const vinkje of await bladzijde.locator('#aanmelden input[type=checkbox]').all()) {
    await vinkje.check().catch(() => {})
  }
  await bladzijde.click('#aanmelden button[type=submit]')
  await bladzijde.waitForTimeout(500)
  meld(await bladzijde.locator('#gestuurd').isVisible(), 'er staat dat de mail onderweg is')
  meld(!(await bladzijde.locator('#aanmelden').isVisible()), 'het formulier is weg')
  meld(!(await bladzijde.locator('#uitleg').isVisible()), 'en de uitleg erboven ook')
  await context.close()
}

/* ------------------------------------------------------------ de stemmen */

/**
 * Welke verteller welke stem van het toestel krijgt.
 *
 * Het geslacht van een stem staat nergens in de Web Speech API; het wordt uit
 * de naam geraden. Dat ging mis op een manier die je niet ziet als je het niet
 * in de goede taal opent: "German (Germany)" eindigt op `man`, dus in het
 * Duits was élke stem een mannenstem en kreeg Katja de naam Amir.
 *
 * Daarom hier nagemaakte stemmen in een echte browser, met de namen zoals
 * Windows ze schrijft. Een lijst met namen blijft een gok, maar deze gok hoort
 * op de bekende toestellen te kloppen.
 */
console.log('\nDe stemmen')
{
  const DUITS = [
    { name: 'Microsoft Katja Online (Natural) - German (Germany)', lang: 'de-DE', localService: false },
    { name: 'Microsoft Conrad Online (Natural) - German (Germany)', lang: 'de-DE', localService: false },
    { name: 'Microsoft Hedda - German (Germany)', lang: 'de-DE', localService: true },
    { name: 'Microsoft Stefan - German (Germany)', lang: 'de-DE', localService: true },
  ]
  const nep = (stemmen) => `
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => ({
      getVoices: () => ${JSON.stringify(stemmen)},
      speak() {}, cancel() {}, addEventListener() {}, removeEventListener() {},
    }) })`

  const { bladzijde, context } = await bezoek('/de/buecher', {}, nep(DUITS))
  await bladzijde.locator('#proefknop').click()
  await bladzijde.waitForSelector('#proef .zin', { timeout: 5000 }).catch(() => {})
  const keuze = bladzijde.locator('#proef .stemkeuze option')
  const rijen = await keuze.evaluateAll((els) => els.map((e) => [e.textContent, e.value]))
  const bij = (naam) => (rijen.find(([t]) => t === naam) || [])[1] || ''

  meld(rijen.length > 0, `de Duitse teaser krijgt stemmen (${rijen.length})`)
  meld(rijen.length === 4, `vier vertellers, niet meer (${rijen.length})`)
  meld(/Conrad|Stefan/.test(bij('Amir')), `Amir is een mannenstem (${bij('Amir') || 'geen'})`)
  meld(/Conrad|Stefan/.test(bij('Yassine')), `Yassine ook (${bij('Yassine') || 'geen'})`)
  meld(/Katja|Hedda/.test(bij('Yousra')), `Yousra is een vrouwenstem (${bij('Yousra') || 'geen'})`)
  meld(/Katja|Hedda/.test(bij('Sarah')), `Sarah ook (${bij('Sarah') || 'geen'})`)
  meld(new Set(rijen.map(([, v]) => v)).size === rijen.length, 'elke verteller heeft zijn eigen stem')
  await context.close()
}

{
  // Android noemt zijn stemmen niet met een naam maar met een code, en zegt
  // het geslacht er letterlijk bij. `female` bevat `male`, en dat telde mee.
  const ANDROID = [
    { name: 'nl-nl-x-dma#female_1-local', lang: 'nl-NL', localService: true },
    { name: 'nl-nl-x-dma#male_1-local', lang: 'nl-NL', localService: true },
  ]
  const nep = (stemmen) => `
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => ({
      getVoices: () => ${JSON.stringify(stemmen)},
      speak() {}, cancel() {}, addEventListener() {}, removeEventListener() {},
    }) })`
  const { bladzijde, context } = await bezoek('/leesboeken', {}, nep(ANDROID))
  await bladzijde.locator('#proefknop').click()
  await bladzijde.waitForSelector('#proef .zin', { timeout: 5000 }).catch(() => {})
  const rijen = await bladzijde.locator('#proef .stemkeuze option')
    .evaluateAll((els) => els.map((e) => [e.textContent, e.value]))
  const bij = (naam) => (rijen.find(([t]) => t === naam) || [])[1] || ''
  meld(bij('Amir').includes('#male_'), `een stem die zegt dat hij man is, wordt Amir (${bij('Amir') || 'geen'})`)
  meld(bij('Yousra').includes('#female_'), `en female is geen male (${bij('Yousra') || 'geen'})`)
  meld(rijen.length === 2, `twee stemmen geven twee vertellers, geen vier (${rijen.length})`)
  await context.close()
}

await browser.close()
site.close()

console.log('\nGeen javascriptfouten')
for (const f of paginafouten) console.log(`      ${f}`)
meld(paginafouten.length === 0,
     `geen enkele bladzijde gooide een fout (${paginafouten.length})`)

if (fouten.length) {
  console.error(`\n${fouten.length} van de controles ging mis.\n`)
  process.exit(1)
}
console.log('\nHet hele rondje loopt.\n')

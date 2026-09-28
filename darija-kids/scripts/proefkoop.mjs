/**
 * Een aankoop naspelen, zonder te betalen.
 *
 * Dit is de enige manier om het portaal helemaal na te lopen zonder je eigen
 * boek te kopen: de worker krijgt dezelfde melding als bij een echte verkoop,
 * maakt een bestelling aan, en mailt de sleutel naar het adres dat je opgeeft.
 * Daarna doe je wat een koper doet — de link openen op je telefoon, op de
 * tablet, op de laptop, en je laten voorlezen.
 *
 * De melding wordt gemarkeerd als proef, dus in `npm run bestellingen` is hij
 * te herkennen aan "proefmelding" en kun je hem daarna intrekken.
 *
 * Hij vraagt om het adres met het geheim erin. Dat staat bij Gumroad onder
 * Settings → Advanced → Ping; heb je het niet meer, dan maakt
 * `npm run koopgeheim` een nieuw geheim aan en drukt het hele adres af.
 *
 *   npm run proefkoop
 */
import { pingAdres } from './lib/geheim.mjs'

const REEKSEN = {
  1: { naam: 'De sleutels van Marokko', permalink: 'sleutels' },
  2: { naam: 'Sba de Atlasleeuw', permalink: 'sbadeleeuw' },
  3: { naam: 'allebei', permalink: 'sleutels,sbadeleeuw' },
}

if (!process.stdin.isTTY) {
  console.error('\nDeze opdracht vraagt een paar dingen en heeft dus een scherm nodig.\n')
  process.exit(1)
}

const { createInterface } = await import('node:readline/promises')
const lezer = createInterface({ input: process.stdin, output: process.stdout })

const vraag = async (tekst) => {
  try {
    return (await lezer.question(tekst)).trim()
  } catch {
    lezer.close()
    console.log('\n\nAfgebroken. Er is niets verstuurd.\n')
    process.exit(0)
  }
}

console.log(`
Een aankoop naspelen
────────────────────

Hierna krijgt het adres dat je opgeeft een echte mail met een echte sleutel.
Er wordt niets afgerekend.
`)

/* Staat het geheim op deze computer, dan hoeft er niets gevraagd te worden.
   Het adres zelf drukken we niet af: het is een sleutel. */
const bekend = pingAdres()

let adres
if (bekend) {
  console.log('Het ping-adres staat op deze computer; die gebruik ik.\n')
  adres = bekend
} else {
  console.log('Het adres met het geheim erin staat bij Gumroad onder')
  console.log('Settings → Advanced → Ping. Het begint met https://post.darijaforkids.eu/koop?s=')
  console.log('Ben je het kwijt: stop hier en draai eerst npm run koopgeheim.\n')
  adres = await vraag('Ping-adres: ')
  // Alleen nakijken wat je zelf intikt. Wat uit ons eigen bestand komt is
  // daar door `koopgeheim` neergezet en heeft die vraag niet nodig — en een
  // afkeuring zou dan een melding geven die nergens op slaat.
  if (!adres.startsWith('https://') || !adres.includes('/koop')) {
    lezer.close()
    console.log('\nDat lijkt niet op het ping-adres. Er is niets verstuurd.\n')
    process.exit(1)
  }
}

const email = await vraag('\nNaar welk e-mailadres mag de sleutel? ')
if (!email.includes('@')) {
  lezer.close()
  console.log('\nDat is geen e-mailadres. Er is niets verstuurd.\n')
  process.exit(1)
}

console.log('\nWelke reeks koopt deze proefkoper?\n')
for (const [n, r] of Object.entries(REEKSEN)) console.log(`  ${n}. ${r.naam}`)
const keuze = REEKSEN[Number(await vraag('\nKeuze (1, 2 of 3): '))]
if (!keuze) {
  lezer.close()
  console.log('\nGeen geldige keuze. Er is niets verstuurd.\n')
  process.exit(1)
}

const taal = (await vraag('\nTaal van de mail (enter = nl): ')) || 'nl'
lezer.close()

/* Elke proef krijgt een eigen bestelnummer, anders ziet de worker de tweede
   als een herhaling van de eerste en stuurt hij geen tweede sleutel. */
const bestelnummer = `PROEF-${Date.now()}`

const velden = new URLSearchParams({
  email,
  permalink: keuze.permalink,
  full_name: 'Proefkoper',
  sale_id: bestelnummer,
  ip_country: 'Netherlands',
  taal,
  test: 'true',
})

console.log('\nVersturen …\n')

let antwoord
try {
  antwoord = await fetch(adres, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: velden.toString(),
  })
} catch (fout) {
  console.error('De worker is niet bereikbaar.\n')
  console.error(`  ${fout.message}\n`)
  console.error('Staat hij al uitgerold? npm run deploy\n')
  process.exit(1)
}

const tekst = await antwoord.text()
let uit = {}
try { uit = JSON.parse(tekst) } catch { /* geen json: dan tonen we de tekst */ }

if (antwoord.status === 403) {
  console.error('De worker zegt nee: het geheim in dat adres klopt niet.\n')
  console.error('Draai npm run koopgeheim en plak het nieuwe adres ook bij Gumroad.\n')
  process.exit(1)
}

if (!antwoord.ok || !uit.goed) {
  console.error(`Dat ging mis (${antwoord.status}).\n`)
  console.error(`  ${tekst.slice(0, 300)}\n`)
  process.exit(1)
}

console.log('Gelukt.\n')
if (uit.mislukt?.length) {
  console.log(`Let op: deze stappen vielen om — ${uit.mislukt.join(', ')}.`)
  console.log('De bestelling staat er wel. Ging de mail niet, dan kun je nog')
  console.log('steeds inloggen op het portaal met hetzelfde adres.\n')
} else {
  console.log(`De mail met de sleutel is onderweg naar ${email}.\n`)
}

console.log('Wat een koper nu doet, en jij dus ook:\n')
console.log('  1. De mail openen en op de knop drukken. Dat is de leeskamer.')
console.log('  2. Diezelfde link openen op je telefoon en op een tablet.')
console.log('  3. Een boek openen en op voorlezen drukken.')
console.log('  4. Naar darijaforkids.eu/portaal gaan, hetzelfde adres invullen,')
console.log('     en kijken of de boeken ook zónder die link in de lijst staan.\n')
console.log(`Deze proefbestelling heet ${bestelnummer} en staat in:\n`)
console.log('  npm run bestellingen\n')
console.log('Klaar met testen? Dan haal je hem weg met npm run intrekken.\n')

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
 * Het ping-adres komt uit `server/.dev.vars`, waar `npm run koopgeheim` het
 * neerzet. Staat het daar niet, dan vraagt hij erom.
 *
 *   npm run proefkoop
 */
import { pingAdres } from './lib/geheim.mjs'

/**
 * Eén melding per product, want zo doet de betaalpartner het ook.
 *
 * Hier stond eerst één melding met `sleutels,sbadeleeuw` erin, en dat gaf een
 * 400. Terecht: de worker leest dat als één productnaam met een komma erin,
 * want Gumroad stuurt per verkocht product een aparte melding en nooit twee
 * namen in één. Twee reeksen naspelen is dus twee meldingen sturen, en dat is
 * meteen een eerlijker proef.
 */
const REEKSEN = {
  1: { naam: 'De sleutels van Marokko', permalinks: ['sleutels'] },
  2: { naam: 'Sba de Atlasleeuw', permalinks: ['sbadeleeuw'] },
  3: { naam: 'allebei — twee meldingen, zoals bij twee aankopen', permalinks: ['sleutels', 'sbadeleeuw'] },
}

/**
 * Netjes ophouden in plaats van `process.exit`.
 *
 * Een `process.exit` vlak na het sluiten van de vraagregel liet Node op
 * Windows omvallen met "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)".
 * Dat is geen fout in de proefkoop maar wel het laatste wat je op je scherm
 * ziet, en dan lijkt er iets stuk dat het niet is.
 */
const stop = (code, ...regels) => {
  for (const r of regels) console.log(r)
  process.exitCode = code
}

async function main() {
  if (!process.stdin.isTTY) {
    return stop(1, '\nDeze opdracht vraagt een paar dingen en heeft dus een scherm nodig.\n')
  }

  const { createInterface } = await import('node:readline/promises')
  const lezer = createInterface({ input: process.stdin, output: process.stdout })
  let open = true
  const sluit = () => { if (open) { lezer.close(); open = false } }

  const vraag = async (tekst) => {
    try {
      return (await lezer.question(tekst)).trim()
    } catch {
      sluit()
      return null
    }
  }

  console.log(`
Een aankoop naspelen
────────────────────

Hierna krijgt het adres dat je opgeeft een echte mail met een echte sleutel.
Er wordt niets afgerekend.
`)

  const bekend = pingAdres()
  let adres = bekend
  if (bekend) {
    console.log('Het ping-adres staat op deze computer; die gebruik ik.\n')
  } else {
    console.log('Het adres met het geheim erin staat bij Gumroad onder')
    console.log('Settings → Advanced → Ping. Het begint met https://post.darijaforkids.eu/koop?s=')
    console.log('Ben je het kwijt: stop hier en draai eerst npm run koopgeheim.\n')
    adres = await vraag('Ping-adres: ')
    if (adres === null) return stop(0, '\n\nAfgebroken. Er is niets verstuurd.\n')
    if (!adres.startsWith('https://') || !adres.includes('/koop')) {
      sluit()
      return stop(1, '\nDat lijkt niet op het ping-adres. Er is niets verstuurd.\n')
    }
  }

  const email = await vraag('Naar welk e-mailadres mag de sleutel? ')
  if (email === null) return stop(0, '\n\nAfgebroken. Er is niets verstuurd.\n')
  if (!email.includes('@')) {
    sluit()
    return stop(1, '\nDat is geen e-mailadres. Er is niets verstuurd.\n')
  }

  console.log('\nWelke reeks koopt deze proefkoper?\n')
  for (const [n, r] of Object.entries(REEKSEN)) console.log(`  ${n}. ${r.naam}`)
  const gekozen = await vraag('\nKeuze (1, 2 of 3): ')
  if (gekozen === null) return stop(0, '\n\nAfgebroken. Er is niets verstuurd.\n')
  const keuze = REEKSEN[Number(gekozen)]
  if (!keuze) {
    sluit()
    return stop(1, '\nGeen geldige keuze. Er is niets verstuurd.\n')
  }

  const taalIn = await vraag('\nTaal van de mail (enter = nl): ')
  if (taalIn === null) return stop(0, '\n\nAfgebroken. Er is niets verstuurd.\n')
  const taal = taalIn || 'nl'
  sluit()

  console.log('\nVersturen …\n')

  const nummers = []
  const mislukteStappen = []
  for (const permalink of keuze.permalinks) {
    /* Elke melding een eigen bestelnummer, anders ziet de worker de tweede
       als een herhaling van de eerste en stuurt hij geen tweede sleutel. */
    const bestelnummer = `PROEF-${Date.now()}-${permalink}`
    const velden = new URLSearchParams({
      email,
      permalink,
      full_name: 'Proefkoper',
      sale_id: bestelnummer,
      ip_country: 'Netherlands',
      taal,
      test: 'true',
    })

    let antwoord
    try {
      antwoord = await fetch(adres, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: velden.toString(),
      })
    } catch (fout) {
      return stop(1,
        'De worker is niet bereikbaar.\n',
        `  ${fout.message}\n`,
        'Staat hij al uitgerold? npm run deploy\n')
    }

    const tekst = await antwoord.text()
    let uit = {}
    try { uit = JSON.parse(tekst) } catch { /* geen json: dan tonen we de tekst */ }

    if (antwoord.status === 403) {
      return stop(1,
        'De worker zegt nee: het geheim klopt niet.\n',
        'Het adres op deze computer en dat bij Gumroad moeten hetzelfde zijn.',
        'Draai npm run koopgeheim en plak het nieuwe adres ook bij Gumroad.\n')
    }

    if (!antwoord.ok || !uit.goed) {
      return stop(1,
        `Dat ging mis (${antwoord.status}) bij ${permalink}.\n`,
        `  ${tekst.slice(0, 300)}\n`)
    }

    console.log(`  ${permalink} — de bestelling staat`)
    for (const m of uit.mislukt ?? []) {
      /* De reden komt nu mee uit de worker. Zonder die regel is "viel om:
         mail" een mededeling waar je niets mee kunt. */
      console.log(`      ${m.naam} viel om: ${typeof m === 'string' ? m : m.waarom}`)
    }
    nummers.push(bestelnummer)
    mislukteStappen.push(...(uit.mislukt ?? []))
  }

  const mailGingMis = mislukteStappen.some((m) => (typeof m === 'string' ? m : m.naam) === 'mail')
  if (mailGingMis) {
    console.log(`\nEr is géén mail verstuurd naar ${email}.`)
    console.log('De regel hierboven zegt waarom. Twee veelvoorkomende:\n')
    console.log('  401 of unauthorized  — MAIL_SLEUTEL ontbreekt of klopt niet')
    console.log('  sender / not valid   — info@darijaforkids.eu is bij de mailpartner')
    console.log('                         nog niet als afzender geverifieerd\n')
    console.log('Welke geheimen er staan, zie je met:  npm run logboek\n')
  } else {
    console.log(`\nDe mail met de sleutel is onderweg naar ${email}.\n`)
  }
  console.log('Wat een koper nu doet, en jij dus ook:\n')
  console.log('  1. De mail openen en op de knop drukken. Dat is de leeskamer.')
  console.log('  2. Diezelfde link openen op je telefoon en op een tablet.')
  console.log('  3. Een boek openen en op voorlezen drukken.')
  console.log('  4. Naar darijaforkids.eu/portaal gaan, hetzelfde adres invullen,')
  console.log('     en kijken of de boeken ook zónder die link in de lijst staan.\n')
  console.log(`${nummers.length === 1 ? 'Deze proefbestelling heet' : 'Deze proefbestellingen heten'}:\n`)
  for (const n of nummers) console.log(`  ${n}`)
  console.log('\nZe staan in npm run bestellingen, en npm run intrekken haalt ze weg.\n')
}

await main()

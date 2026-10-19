/**
 * Hoe vaak is de app gedownload? Zonder door Play Console te klikken.
 *
 * Dit getal stond tot nu toe op één plek: het dashboard in Play Console, waar
 * je voor moet inloggen op een scherm dat niet voor een telefoon gemaakt is.
 * En er staan er drie die op elkaar lijken -- installaties, nieuwe gebruikers
 * en toestellen die hem nú hebben -- die alle drie iets anders betekenen en
 * waarvan je de verkeerde naast het Apple-cijfer kunt leggen.
 *
 *   npm run downloads                 -- alles sinds de lancering
 *   npm run downloads -- --maand 202610
 *   npm run downloads -- --dagen      -- ook de losse dagen erbij
 *   npm run downloads -- --emmer naam-van-de-emmer
 *   npm run downloads -- --sleutel pad/naar/play-api.json
 *
 * Waarom dit een csv-bestand uit een emmer leest en geen API aanroept: dat is
 * de enige bron die er is. De Play Developer Reporting API, waar `npm run
 * crashes` mee praat, geeft alleen vitals; de Android Publisher API heeft geen
 * cijfers. Google zet de installatierapporten maandelijks in Cloud Storage.
 *
 * Werkt dit niet meteen, dan ontbreekt er één recht. Dat staat onderaan
 * uitgeschreven, met het adres van het serviceaccount erbij zodat je weet
 * welke regel je in Play Console moet hebben.
 */
import { leesSleutel, SCOPES, tokenOfStop } from './lib/play.mjs'
import { EERSTE_MAAND, emmers, leesCsv, maandNaam, maandenSinds, naarTekst, pad, vatSamen } from './lib/installs.mjs'

const APP = 'app.darijaforkids.learn'
// Het nummer uit het adres van Play Console, net als in rechten.mjs. Geen
// geheim: het staat in elke URL die je daar opent.
const DEV = '4661006956999186517'
const API = 'https://storage.googleapis.com/storage/v1/b'

const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const DAGEN = process.argv.includes('--dagen')
const MAAND = arg('maand')

const sleutel = leesSleutel(arg('sleutel'))
console.log(`\nSleutel: ${sleutel.pad}`)

const bewijs = await tokenOfStop(sleutel, SCOPES.opslag)

/**
 * Eén bestand ophalen.
 *
 * Geeft `null` bij een 404 -- dat is geen fout maar "die maand staat er nog
 * niet", en dat gebeurt aan het begin van elke maand. Alle andere fouten gaan
 * omhoog, want die betekenen iets.
 */
async function haal(emmer, object) {
  const adres = `${API}/${encodeURIComponent(emmer)}/o/${encodeURIComponent(object)}?alt=media`
  const antwoord = await fetch(adres, { headers: { authorization: `Bearer ${bewijs}` } })
  if (antwoord.status === 404) return null
  if (!antwoord.ok) {
    const fout = new Error(await antwoord.text())
    fout.status = antwoord.status
    throw fout
  }
  return Buffer.from(await antwoord.arrayBuffer())
}

/**
 * Bestaat deze emmer, en mogen we erin?
 *
 * Apart van het ophalen van een bestand, en dat is het hele punt. Een emmer
 * die niet bestaat geeft een 404, en een maandbestand dat er nog niet is geeft
 * óók een 404. Vroeg ik die twee in één verzoek, dan koos het script de eerste
 * naam die "niet gevonden" zei als de goede, en meldde daarna dat er nog geen
 * cijfers waren -- terwijl het in de verkeerde emmer keek. Dat is een
 * foutmelding die je de verkeerde kant op stuurt.
 */
async function bestaatEmmer(naam) {
  const antwoord = await fetch(`${API}/${encodeURIComponent(naam)}`, {
    headers: { authorization: `Bearer ${bewijs}` },
  })
  if (antwoord.ok) return 'ja'
  if (antwoord.status === 403) return 'verboden'
  if (antwoord.status === 404) return 'nee'
  const tekst = await antwoord.text()
  console.error(`\nHet opvragen van ${naam} ging mis (${antwoord.status}): ${tekst.slice(0, 300)}\n`)
  process.exit(1)
}

/* ------------------------------------------------------- welke emmer is het */

/**
 * De emmer uitproberen in plaats van ernaar vragen.
 *
 * Twee vormen, afhankelijk van hoe oud het account is. Een 404 op allebei
 * betekent iets anders dan een 403 op allebei, en die twee krijgen dus hun
 * eigen uitleg onderaan.
 */
const gegeven = arg('emmer')
const kandidaten = gegeven ? [gegeven] : emmers(DEV)
/* `--maand` wordt nagekeken en niet geloofd: "oktober" levert anders een 404
   op, en die leest als "er staat nog niets" in plaats van als een typefout. */
const geldig = (m) => /^\d{4}(0[1-9]|1[0-2])$/.test(m)
const maanden = MAAND
  ? (geldig(MAAND) ? [MAAND] : [])
  : maandenSinds(EERSTE_MAAND, new Date())

if (!maanden.length) {
  console.error(`\nIk kan er geen maand van maken: ${MAAND ?? EERSTE_MAAND}`)
  console.error('Schrijf hem als 202610 -- vier cijfers jaar, twee cijfers maand.\n')
  process.exit(1)
}

let emmer = null
let verboden = false
const gevonden = new Map()

for (const kandidaat of kandidaten) {
  const stand = await bestaatEmmer(kandidaat)
  if (stand === 'ja') { emmer = kandidaat; break }
  if (stand === 'verboden') { verboden = true; break }
}

if (!emmer) {
  if (verboden) {
    console.log('\nDe sleutel werkt, maar dit account mag de rapporten niet lezen.\n')
    console.log('Dat is één recht, en het staat los van de rechten om uit te geven.')
    console.log('In Play Console: Users and permissions, dan de regel van\n')
    console.log(`  ${sleutel.client_email}\n`)
    console.log('en daar het vinkje "View app information and download bulk reports".')
    console.log('Google heeft daarna ongeveer een dag nodig voor het doorwerkt.\n')
    console.log('Staat dat account er helemaal niet bij, nodig het dan eerst uit met')
    console.log('datzelfde adres.\n')
  } else {
    console.log('\nDe emmer is niet gevonden. Geprobeerd:\n')
    for (const k of kandidaten) console.log(`  ${k}`)
    console.log('\nDe naam staat in Play Console onder Download reports -> Statistics,')
    console.log('bij "Copy Cloud Storage URI". Geef hem mee achter --emmer.\n')
  }
  process.exit(1)
}

/* --------------------------------------------------------------- de cijfers */

for (const maand of maanden) {
  try {
    const bytes = await haal(emmer, pad(APP, maand))
    if (bytes) gevonden.set(maand, bytes)
  } catch (fout) {
    console.error(`\n${maand} ging mis (${fout.status ?? '?'}): ${String(fout.message).slice(0, 200)}\n`)
    process.exit(1)
  }
}

if (!gevonden.size) {
  console.log(`\nEr staat nog niets in ${emmer} voor ${maanden.join(', ')}.\n`)
  console.log('Google schrijft deze bestanden een paar dagen achteraf, dus vlak na')
  console.log('een lancering of aan het begin van een maand is dat normaal. Het')
  console.log('dashboard in Play Console loopt voor op deze rapporten.\n')
  process.exit(0)
}

console.log(`Emmer:   ${emmer}`)
console.log(`Maanden: ${[...gevonden.keys()].join(', ')}\n`)

let nieuw = 0
let installaties = 0
let toestellen = 0
const gemist = new Set()

for (const [maand, bytes] of gevonden) {
  const { kop, regels } = leesCsv(naarTekst(bytes))
  const som = vatSamen(kop, regels)
  som.ontbreekt.forEach((k) => gemist.add(k))

  console.log('─'.repeat(64))
  console.log(`${maand}  ·  ${som.dagen.length} ${som.dagen.length === 1 ? 'dag' : 'dagen'}`)
  console.log(`  nieuwe gebruikers   ${String(som.nieuw).padStart(6)}`)
  console.log(`  installaties        ${String(som.installaties).padStart(6)}`)
  console.log(`  toestellen erop     ${String(som.toestellen).padStart(6)}`)

  if (DAGEN) {
    console.log('')
    for (const d of som.dagen) {
      console.log(`  ${d.datum}   nieuw ${String(d.nieuw).padStart(4)}   installaties ${String(d.installaties).padStart(4)}`)
    }
  }

  if (som.ontbreekt.length) {
    console.log(`\n  (kolommen niet herkend: ${som.ontbreekt.join(', ')})`)
    console.log(`  (wat er wel in staat: ${kop.join(' | ')})`)
  }

  nieuw += som.nieuw
  installaties += som.installaties
  toestellen = som.toestellen
}

console.log('─'.repeat(64))
console.log(`\nSinds ${[...gevonden.keys()][0]}:\n`)
console.log(`  ${nieuw} nieuwe gebruikers`)
console.log(`  ${installaties} installaties`)
console.log(`  ${toestellen} toestellen hebben hem nu\n`)

/*
 * Waarom hier drie getallen staan en niet één.
 *
 * Ze worden alle drie "downloads" genoemd en ze zijn het geen van drieën
 * helemaal. Wie dit naast App Store Connect legt moet de eerste hebben:
 * "first-time downloads" bij Apple telt mensen, net als "nieuwe gebruikers"
 * hier. "Installaties" telt gebeurtenissen en is dus hoger -- een tweede
 * toestel en een herinstallatie tellen mee.
 */
console.log('Nieuwe gebruikers is het getal dat naast Apple\'s "first-time')
console.log('downloads" hoort: allebei tellen ze mensen. Installaties telt')
console.log('gebeurtenissen en is daarom hoger -- een herinstallatie of een')
console.log('tweede toestel telt mee. Toestellen erop is een stand en loopt')
console.log('terug als iemand de app verwijdert.\n')

if (gemist.size) {
  console.log('Let op: niet alle kolommen zijn herkend, dus een van de getallen')
  console.log('hierboven kan nul zijn terwijl het bestand er wel iets over zegt.')
  console.log('De kolomnamen staan er hierboven bij; die horen in KOLOMMEN in')
  console.log('scripts/lib/installs.mjs.\n')
}

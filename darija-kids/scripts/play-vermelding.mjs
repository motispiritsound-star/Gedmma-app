/**
 * De winkelvermelding naar Google Play sturen, in alle zes de talen.
 *
 * Zes talen, en per taal een titel, twee beschrijvingen en vierentwintig
 * beelden. Met de hand is dat ruim honderdvijftig handelingen in een console
 * die na elke stap vraagt of je naar het publicatieoverzicht wilt — en één
 * tabletmap in een telefoonvak is zo gebeurd. Dit doet het in één keer, uit
 * dezelfde bestanden die `npm run playpakket` maakt.
 *
 *   npm run play                    alle talen
 *   npm run play -- --taal nl-NL    één taal
 *   npm run play -- --proef         niets versturen, alleen tonen wat er zou gaan
 *   npm run play -- --tekst         alleen de teksten, rechtstreeks uit store/listing.*.md
 *
 * Die laatste is voor een tekstwijziging na de lancering: de beelden staan er
 * dan al en zijn niet veranderd, en het pakket met die beelden staat niet in
 * git -- dus wie alleen een zin bijschaaft heeft aan de zes listing-bestanden
 * genoeg en hoeft niets opnieuw te maken.
 *
 * De sleutel is een serviceaccount uit Google Cloud, met in Play Console de
 * rechten "Edit and delete draft apps" en "Manage store presence" op deze app.
 * Standaard wordt hij gezocht naast de ondertekensleutel; met --sleutel kan het
 * ergens anders. Hij hoort niet in deze repo: het is een wachtwoord in
 * bestandsvorm.
 *
 * Wat dit script NIET doet: de drie producten. Een abonnement is bij Google
 * drie lagen diep (product, basisabonnement, aanbieding) en het zijn er maar
 * drie -- dat is sneller in het formulier dan in code.
 */
import { createSign } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAKKET = path.join(ROOT, 'store', 'play-pakket')
const APP = 'app.darijaforkids.learn'
const API = 'https://androidpublisher.googleapis.com'

const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const PROEF = process.argv.includes('--proef')
const TEKST = process.argv.includes('--tekst')

/** Hoe Play elke taal noemt; store/listing.<taal>.md draagt de korte code. */
const PLAY_TAAL = { nl: 'nl-NL', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT', en: 'en-US' }

/** Wat Play weigert. Liever hier stuklopen dan halverwege het uploaden. */
const MAX = { titel: 30, kort: 80, vol: 4000 }

/** De mapnaam in het pakket draagt de taalcode in haakjes: "nl (nl-NL)". */
const taalVan = (map) => map.match(/\(([^)]+)\)/)?.[1] ?? null

/**
 * Welke map bij welk vak in de console hoort.
 *
 * De namen komen uit de API en zijn niet te raden; ze staan hier zodat een
 * verkeerde map niet in een verkeerd vak kan belanden, wat met slepen wel kan.
 */
const BEELDEN = [
  ['schermen', 'phoneScreenshots'],
  ['schermen-tablet-7inch', 'sevenInchScreenshots'],
  ['schermen-tablet-10inch', 'tenInchScreenshots'],
  ['uitgelicht-1024x500.png', 'featureGraphic'],
]

/**
 * De teksten uit teksten.md halen.
 *
 * Het bestand heeft twee delen: bovenaan de App Store, onderaan Google Play.
 * Titel en korte beschrijving staan in het Play-deel tussen accenttekens; de
 * volledige beschrijving staat maar één keer in het bestand, als het enige
 * ingekaderde blok, en geldt voor allebei. Op positie lezen in plaats van op
 * kopjes, want die kopjes staan er in zes talen anders.
 */
function teksten(ruw, waar) {
  // Windows schrijft \r\n. Een patroon dat een accentteken aan het regeleinde
  // vastknoopt vindt dan niets, want dat \r zit ertussen -- en de foutmelding
  // zegt dan dat het bestand er anders uitziet terwijl er niets mis mee is.
  const md = ruw.replace(/\r\n/g, '\n')
  const play = md.slice(md.lastIndexOf('\n## '))
  const losse = [...play.matchAll(/^`([^`]+)`$/gm)].map((m) => m[1])
  const kader = md.match(/^```\n([\s\S]*?)\n```$/m)
  if (losse.length < 2 || !kader) {
    throw new Error(
      `${waar} ziet er anders uit dan verwacht:\n` +
        `  losse regels tussen accenttekens: ${losse.length} (verwacht 2 of meer)\n` +
        `  ingekaderd blok: ${kader ? 'gevonden' : 'niet gevonden'}\n` +
        'Draai `npm run playpakket` om het pakket opnieuw te maken.',
    )
  }
  const uit = { titel: losse[0], kort: losse[1], vol: kader[1] }
  for (const [veld, grens] of Object.entries(MAX)) {
    if (uit[veld].length > grens) {
      throw new Error(`${waar}: ${veld} is ${uit[veld].length} tekens, Play neemt er ${grens}.`)
    }
  }
  return uit
}

/** Een toegangsbewijs halen met de sleutel: JWT tekenen, inruilen bij Google. */
async function token(sleutel) {
  const nu = Math.floor(Date.now() / 1000)
  const kop = { alg: 'RS256', typ: 'JWT' }
  const romp = {
    iss: sleutel.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: nu,
    exp: nu + 3600,
  }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const basis = `${b64(kop)}.${b64(romp)}`
  const handtekening = createSign('RSA-SHA256').update(basis).end().sign(sleutel.private_key, 'base64url')

  const antwoord = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${basis}.${handtekening}`,
    }),
  })
  const body = await antwoord.json()
  if (!antwoord.ok) throw new Error(`inloggen mislukt: ${JSON.stringify(body)}`)
  return body.access_token
}

/** Eén verzoek aan de API, met de foutmelding van Google als er iets misgaat. */
async function api(bewijs, pad, opties = {}) {
  const antwoord = await fetch(`${API}${pad}`, {
    ...opties,
    headers: { authorization: `Bearer ${bewijs}`, ...(opties.headers ?? {}) },
  })
  const tekst = await antwoord.text()
  if (!antwoord.ok) throw new Error(`${opties.method ?? 'GET'} ${pad}\n${tekst}`)
  return tekst ? JSON.parse(tekst) : {}
}

// Een proef praat met niemand, dus die heeft de sleutel niet nodig -- en zo
// kun je de teksten en het aantal beelden nakijken voordat je er een
// serviceaccount bij haalt.
const SLEUTELPAD = arg('sleutel', path.join(os.homedir(), 'Documents', 'Darijaforkids-sleutel', 'play-api.json'))
if (!PROEF && !existsSync(SLEUTELPAD)) {
  console.error(`\nGeen sleutel gevonden op:\n  ${SLEUTELPAD}\n`)
  console.error('Geef het pad mee met --sleutel <pad naar play-api.json>\n')
  process.exit(1)
}
const sleutel = PROEF ? { client_email: '(proef)' } : JSON.parse(readFileSync(SLEUTELPAD, 'utf8'))

const alleen = arg('taal')
const bronnen = (TEKST
  ? Object.entries(PLAY_TAAL).map(([kort, code]) => ({
      taal: code,
      tekst: path.join(ROOT, 'store', `listing.${kort}.md`),
      dir: null,
    }))
  : (await readdir(PAKKET, { withFileTypes: true }))
      .filter((d) => d.isDirectory() && taalVan(d.name))
      .map((d) => ({
        taal: taalVan(d.name),
        tekst: path.join(PAKKET, d.name, 'teksten.md'),
        dir: path.join(PAKKET, d.name),
      }))
).filter((b) => existsSync(b.tekst)).filter((b) => !alleen || b.taal === alleen)
if (!bronnen.length) {
  console.error(`\nNiets te doen. Draai eerst: npm run ${TEKST ? 'build' : 'playpakket'}\n`)
  process.exit(1)
}

console.log(`\n${PROEF ? 'PROEF — er wordt niets verstuurd' : `Inloggen als ${sleutel.client_email}`}\n`)
const bewijs = PROEF ? null : await token(sleutel)

const edit = PROEF ? { id: '(proef)' } : await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits`, { method: 'POST' })
console.log(`bewerking ${edit.id}\n`)

for (const bron of bronnen) {
  const { taal, dir } = bron
  const t = teksten(await readFile(bron.tekst, 'utf8'), path.relative(ROOT, bron.tekst))
  console.log(`${taal}`)
  console.log(`  titel   ${t.titel}`)
  console.log(`  kort    ${t.kort.slice(0, 60)}${t.kort.length > 60 ? '…' : ''}`)
  console.log(`  vol     ${t.vol.length} tekens`)

  if (!PROEF) {
    await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}/listings/${taal}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ language: taal, title: t.titel, shortDescription: t.kort, fullDescription: t.vol }),
    })
  }

  // --tekst laat de beelden staan zoals ze staan.
  if (!dir) {
    console.log()
    continue
  }

  for (const [beeld, soort] of BEELDEN) {
    const vol = path.join(dir, beeld)
    if (!existsSync(vol)) {
      console.log(`  ${soort.padEnd(20)} ontbreekt — overgeslagen`)
      continue
    }
    const bestanden = beeld.endsWith('.png')
      ? [vol]
      : (await readdir(vol)).sort().map((n) => path.join(vol, n))
    console.log(`  ${soort.padEnd(20)} ${bestanden.length}`)
    if (PROEF) continue

    // Eerst weg wat er staat: de API voegt toe, en een tweede keer draaien zou
    // anders acht schermen verdubbelen tot zestien -- waarvan Play er acht
    // weigert en je niet ziet welke.
    await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}/listings/${taal}/${soort}`, {
      method: 'DELETE',
    })
    for (const bestand of bestanden) {
      const type = bestand.endsWith('.png') ? 'image/png' : 'image/jpeg'
      await api(
        bewijs,
        `/upload/androidpublisher/v3/applications/${APP}/edits/${edit.id}/listings/${taal}/${soort}?uploadType=media`,
        { method: 'POST', headers: { 'content-type': type }, body: readFileSync(bestand) },
      )
    }
  }
  console.log()
}

// Het icoon is één keer voor alle talen, maar de API hangt het aan een taal.
const icoon = path.join(PAKKET, 'icoon-512.png')
if (!TEKST && existsSync(icoon) && !alleen) {
  console.log('icon                 1  (op en-US)')
  if (!PROEF) {
    await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}/listings/en-US/icon`, { method: 'DELETE' })
    await api(
      bewijs,
      `/upload/androidpublisher/v3/applications/${APP}/edits/${edit.id}/listings/en-US/icon?uploadType=media`,
      { method: 'POST', headers: { 'content-type': 'image/png' }, body: readFileSync(icoon) },
    )
  }
}

if (PROEF) {
  console.log('\nProef klaar. Zonder --proef gaat dit echt naar Play.\n')
  process.exit(0)
}

await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits/${edit.id}:commit`, { method: 'POST' })
console.log('\nVerstuurd en vastgelegd.\n')
console.log('Kijk in Play Console bij Grow users -> Store presence -> Main store listing.')
console.log('Wijzigingen staan daar klaar; versturen naar Google doe je bij Publishing overview.\n')

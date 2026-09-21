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
function teksten(md) {
  const play = md.slice(md.lastIndexOf('\n## '))
  const losse = [...play.matchAll(/^`([^`]+)`$/gm)].map((m) => m[1])
  const kader = md.match(/^```\n([\s\S]*?)\n```$/m)
  if (losse.length < 2 || !kader) throw new Error('teksten.md ziet er anders uit dan verwacht')
  return { titel: losse[0], kort: losse[1], vol: kader[1] }
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
const mappen = (await readdir(PAKKET, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && taalVan(d.name))
  .filter((d) => !alleen || taalVan(d.name) === alleen)
if (!mappen.length) {
  console.error(`\nNiets te doen. Draai eerst: npm run playpakket\n`)
  process.exit(1)
}

console.log(`\n${PROEF ? 'PROEF — er wordt niets verstuurd' : `Inloggen als ${sleutel.client_email}`}\n`)
const bewijs = PROEF ? null : await token(sleutel)

const edit = PROEF ? { id: '(proef)' } : await api(bewijs, `/androidpublisher/v3/applications/${APP}/edits`, { method: 'POST' })
console.log(`bewerking ${edit.id}\n`)

for (const map of mappen) {
  const taal = taalVan(map.name)
  const dir = path.join(PAKKET, map.name)
  const t = teksten(await readFile(path.join(dir, 'teksten.md'), 'utf8'))
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

  for (const [bron, soort] of BEELDEN) {
    const vol = path.join(dir, bron)
    if (!existsSync(vol)) {
      console.log(`  ${soort.padEnd(20)} ontbreekt — overgeslagen`)
      continue
    }
    const bestanden = bron.endsWith('.png')
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
if (existsSync(icoon) && !alleen) {
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

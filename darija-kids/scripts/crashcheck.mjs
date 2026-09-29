/**
 * De stacktraces van een crash ophalen, zonder door Play Console te klikken.
 *
 * Google heeft versie 2 afgewezen met één zin: "Crashes: Your app crashes
 * after opening." Dat is genoeg om de app uit de winkel te halen en te weinig
 * om iets te repareren. Wat je nodig hebt is de uitzondering en de regels
 * eronder, en die staan in Play Console achter een paar bladzijden klikken.
 *
 * Ze zijn ook op te vragen. De Play Developer Reporting API geeft dezelfde
 * gegevens als het scherm Android vitals, inclusief `reportText` — de
 * stacktrace zelf. En de sleutel daarvoor heb je al: dezelfde
 * `play-api.json` waarmee `npm run play` de winkelvermelding bijwerkt.
 *
 *   npm run crashes                 — de crashes van de laatste 28 dagen
 *   npm run crashes -- --versie 2   — alleen die versiecode
 *   npm run crashes -- --anr        — vastlopers in plaats van crashes
 *   npm run crashes -- --sleutel <pad naar play-api.json>
 *
 * Twee dingen kunnen hier misgaan, en allebei zeggen ze iets anders dan
 * "geen crashes". Ze staan onderaan uitgeschreven, met wat eraan te doen is.
 */
import { createSign } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const APP = 'app.darijaforkids.learn'
const API = 'https://playdeveloperreporting.googleapis.com/v1beta1'
const SCOPE = 'https://www.googleapis.com/auth/playdeveloperreporting'

const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const ANR = process.argv.includes('--anr')
const VERSIE = arg('versie')
/**
 * Hoeveel soorten crashes je wilt zien. Niet hoeveel voorbeelden per soort:
 * `sampleErrorReportLimit` neemt volgens de API alleen 0 of 1, en op 3 komt er
 * een 400 terug met "'sample_error_reports' field only supports the values 0
 * and 1". Eén voorbeeld per soort is ook genoeg — wat je zoekt is de
 * stacktrace, en die is binnen een soort steeds dezelfde.
 */
const HOEVEEL = Math.max(1, Math.min(50, Number(arg('aantal', '10')) || 10))

/* ------------------------------------------------------------- de sleutel */

/**
 * De sleutel opzoeken in plaats van erom vragen.
 *
 * Hier stond "geef het pad mee met --sleutel <pad naar play-api.json>". Zo'n
 * regel tussen punthaken is precies wat er een keer letterlijk, mét punthaken,
 * in een veld bij Gumroad is beland. CLAUDE.md zegt het kort: staat er iets
 * tussen punthaken, dan ontbreekt er een opdracht.
 *
 * Dus kijkt hij eerst op de gewone plek, en anders zoekt hij hem. Vijf mappen
 * diep onder je thuismap is ruim genoeg en duurt een halve seconde.
 */
function zoekSleutel() {
  const gegeven = arg('sleutel')
  if (gegeven) return existsSync(gegeven) ? gegeven : null

  const gewoon = path.join(os.homedir(), 'Documents', 'Darijaforkids-sleutel', 'play-api.json')
  if (existsSync(gewoon)) return gewoon

  const gezien = new Set()
  const zoek = (map, diepte) => {
    if (diepte > 5 || gezien.has(map)) return null
    gezien.add(map)
    let inhoud
    try {
      inhoud = readdirSync(map, { withFileTypes: true })
    } catch {
      return null // geen toegang; dan is hij hier toch niet
    }
    for (const ding of inhoud) {
      if (ding.isFile() && ding.name === 'play-api.json') return path.join(map, ding.name)
    }
    for (const ding of inhoud) {
      if (!ding.isDirectory() || ding.name.startsWith('.') || ding.name === 'node_modules') continue
      const gevonden = zoek(path.join(map, ding.name), diepte + 1)
      if (gevonden) return gevonden
    }
    return null
  }
  return zoek(os.homedir(), 0)
}

const SLEUTELPAD = zoekSleutel()
if (!SLEUTELPAD) {
  console.error('\nIk kan play-api.json niet vinden, ook niet door onder je thuismap te zoeken.\n')
  console.error('Dat is het sleutelbestand van het serviceaccount waarmee `npm run play`')
  console.error('de winkelvermelding bijwerkt. Staat het ergens anders, zet het dan hier:\n')
  console.error(`  ${path.join(os.homedir(), 'Documents', 'Darijaforkids-sleutel', 'play-api.json')}\n`)
  process.exit(1)
}
console.log(`\nSleutel: ${SLEUTELPAD}`)
const sleutel = JSON.parse(readFileSync(SLEUTELPAD, 'utf8'))

/** Een toegangsbewijs halen: JWT tekenen, inruilen bij Google. */
async function token() {
  const nu = Math.floor(Date.now() / 1000)
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const basis = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sleutel.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: nu, exp: nu + 3600,
  })}`
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

async function api(bewijs, pad) {
  const antwoord = await fetch(`${API}${pad}`, { headers: { authorization: `Bearer ${bewijs}` } })
  const tekst = await antwoord.text()
  if (!antwoord.ok) {
    const fout = new Error(tekst)
    fout.status = antwoord.status
    fout.pad = pad
    throw fout
  }
  return tekst ? JSON.parse(tekst) : {}
}

/* ------------------------------------------------------------- het venster */

/**
 * De laatste achtentwintig dagen, in hele uren.
 *
 * De API wil een begin en een eind met uurnauwkeurigheid. Zonder venster
 * antwoordt hij met de standaardperiode, en die is per soort gegevens anders —
 * dan weet je bij een leeg antwoord niet of er niets is of dat je buiten het
 * venster hebt gekeken.
 */
/**
 * De laatste achtentwintig dagen, in hele uren — en wel op de vorm die de API wil.
 *
 * Dat is de enige plek waar ik moest gokken, en dat kostte twee rondes. De API
 * wil een `google.type.DateTime` als losse queryvelden, en welke tijdzone-vorm
 * daarbij hoort staat niet in de foutmelding. Eerst probeerde ik het met
 * `utcOffset=0s`; antwoord: "'utc_offset' must be unset."
 *
 * Dus gokt hij niet meer, hij probeert. Drie vormen, in deze volgorde, en bij
 * een 400 over de tijd gaat hij door naar de volgende:
 *
 *   1. met `timeZone.id=UTC`   — de andere manier om er een zone bij te zetten
 *   2. kaal, zonder zone       — wat "utc_offset must be unset" letterlijk vraagt
 *   3. zonder venster          — dan kiest Google zelf een periode
 *
 * Drie verzoeken in het slechtste geval, en die kosten niets. Welke vorm het
 * werd staat in de uitvoer, want anders weet je bij een leeg antwoord niet over
 * welke periode je hebt gekeken.
 */
const KLOK = () => {
  const eind = new Date()
  const begin = new Date(eind.getTime() - 28 * 24 * 3600 * 1000)
  const deel = (d, v) => [
    `${v}.year=${d.getUTCFullYear()}`,
    `${v}.month=${d.getUTCMonth() + 1}`,
    `${v}.day=${d.getUTCDate()}`,
    `${v}.hours=${d.getUTCHours()}`,
  ].join('&')
  return { begin, eind, deel }
}

const VORMEN = [
  {
    naam: 'de laatste 28 dagen',
    maak: () => {
      const { begin, eind, deel } = KLOK()
      return `${deel(begin, 'interval.startTime')}&interval.startTime.timeZone.id=UTC`
        + `&${deel(eind, 'interval.endTime')}&interval.endTime.timeZone.id=UTC&`
    },
  },
  {
    naam: 'de laatste 28 dagen',
    maak: () => {
      const { begin, eind, deel } = KLOK()
      return `${deel(begin, 'interval.startTime')}&${deel(eind, 'interval.endTime')}&`
    },
  },
  {
    naam: 'de standaardperiode van Google (het opgegeven venster werd geweigerd)',
    maak: () => '',
  },
]

/** Gaat deze 400 over de tijd, of over iets anders? */
const overDeTijd = (fout) => fout.status === 400
  && /interval|start_?time|end_?time|utc_?offset|time_?zone|datetime/i.test(String(fout.message))

async function metVenster(bewijs, maakPad) {
  let laatste
  for (const vorm of VORMEN) {
    try {
      return { uit: await api(bewijs, maakPad(vorm.maak())), periode: vorm.naam }
    } catch (fout) {
      // Een 400 over iets anders — zoals die over `sample_error_reports` — is
      // geen reden om het nog eens te proberen; dan valt het tweede verzoek
      // net zo hard om en staat dezelfde fout twee keer op het scherm.
      if (!overDeTijd(fout)) throw fout
      laatste = fout
    }
  }
  throw laatste
}


/* ---------------------------------------------------------------- opvragen */

const soort = ANR ? 'APPLICATION_NOT_RESPONDING' : 'CRASH'
const filters = [`errorIssueType = ${soort}`]
if (VERSIE) filters.push(`versionCode = ${VERSIE}`)

console.log(`Ik vraag het aan Google, met ${sleutel.client_email}.`)
console.log(`${ANR ? 'Vastlopers' : 'Crashes'} van de laatste 28 dagen${VERSIE ? `, versiecode ${VERSIE}` : ''}.\n`)

let bewijs
try {
  bewijs = await token()
} catch (fout) {
  console.error(`${fout.message}\n`)
  console.error('De sleutel werd niet aangenomen. Kijk of het bestand het juiste')
  console.error('serviceaccount is, en of de systeemklok klopt — een JWT met een')
  console.error('scheve tijd wordt geweigerd.\n')
  process.exit(1)
}

let uit
let periode
try {
  const antwoord = await metVenster(bewijs, (v) =>
    `/apps/${APP}/errorIssues:search?${v}`
    + `filter=${encodeURIComponent(filters.join(' AND '))}`
    + `&sampleErrorReportLimit=1&pageSize=${HOEVEEL}&orderBy=${encodeURIComponent('errorReportCount desc')}`)
  uit = antwoord.uit
  periode = antwoord.periode
} catch (fout) {
  console.error(`De vraag kwam niet door (${fout.status}).\n`)
  const tekst = String(fout.message)
  if (/SERVICE_DISABLED|has not been used|is disabled/i.test(tekst)) {
    console.error('De Reporting API staat nog uit voor het project van deze sleutel.')
    console.error('Inschakelen kost niets: het is dezelfde API die het scherm Android')
    console.error('vitals zelf gebruikt.\n')
    // Het adres staat midden in een zin in Google's JSON en breekt daar
    // onleesbaar af. Op een eigen regel is het aan te klikken.
    const adres = /https:\/\/console\.(?:developers|cloud)\.google\.com\/[^\s"']+/.exec(tekst)?.[0]
    if (adres) {
      console.error('Open dit één keer en druk op Enable:\n')
      console.error(`  ${adres}\n`)
      console.error('Wacht daarna een minuut en draai deze opdracht opnieuw.\n')
    } else {
      console.error('Het adres om hem aan te zetten staat in de melding hieronder.\n')
    }
  } else if (fout.status === 403) {
    console.error('Dit serviceaccount mag de gegevens niet zien. In Play Console staat')
    console.error('het onder Gebruikers en rechten: geef het account het recht om')
    console.error('app-informatie en downloadrapporten te bekijken. Dat is een ander')
    console.error('recht dan het uitrollen waarvoor het al gebruikt wordt.\n')
  } else if (fout.status === 404) {
    console.error(`Het pakket ${APP} is onder dit account niet te vinden.\n`)
  }
  console.error(tekst.split('\n').slice(0, 12).join('\n'))
  console.error('')
  process.exit(1)
}

/* ----------------------------------------------------------------- melden */

const zaken = uit.errorIssues ?? []
if (!zaken.length) {
  console.log(`Google kent hier geen ${ANR ? 'vastlopers' : 'crashes'}.\n`)
  console.log('Dat is geen bewijs dat de app niet crasht. Deze cijfers komen van')
  console.log('toestellen van gebruikers die meedoen aan het delen van gegevens, en')
  console.log('een app die is afgewezen vóór de uitrol heeft die niet — de crash is')
  console.log('dan gezien door een beoordelaar, niet door een gebruiker.\n')
  console.log('Kijk in dat geval in Play Console bij Testen en publiceren ->')
  console.log('Testen -> Rapport vóór lancering. Daar staat wat de beoordelaar zag,')
  console.log('meestal met een filmpje en de uitzondering erbij.\n')
  process.exit(0)
}

console.log(`${zaken.length} ${zaken.length === 1 ? 'soort' : 'soorten'} gevonden, over ${periode}.\n`)

for (const [i, zaak] of zaken.entries()) {
  console.log('─'.repeat(72))
  console.log(`${i + 1}. ${zaak.cause ?? '(geen oorzaak gemeld)'}`)
  if (zaak.location) console.log(`   in ${zaak.location}`)
  console.log(`   ${zaak.errorReportCount ?? 0} meldingen, ${zaak.distinctUsers ?? 0} toestellen`)
  if (zaak.firstOsVersion || zaak.lastOsVersion) {
    // Zonder de accenttekens in elkaar te schuiven: een template-literal in
    // een template-literal is hier al twee keer misgegaan, en
    // documentatie.test.ts leest zo'n regel als twee opdrachten op één regel.
    const os1 = zaak.firstOsVersion?.apiLevel ?? '?'
    const os2 = zaak.lastOsVersion?.apiLevel
    const reeks = os2 && os2 !== os1 ? String(os1) + ' tot ' + String(os2) : String(os1)
    console.log('   Android API ' + reeks)
  }
  console.log('')

  const namen = (zaak.sampleErrorReports ?? []).slice(0, 1)
  if (!namen.length) {
    console.log('   (geen voorbeeldmelding meegeleverd)\n')
    continue
  }
  // De naam van een melding is het volledige pad; `errorReports:search` wil
  // hem als filter terug. Eén verzoek per zaak is genoeg voor wat we zoeken.
  const vraag = namen.map((n) => `name = ${JSON.stringify(n)}`).join(' OR ')
  let rapport
  try {
      rapport = (await metVenster(bewijs, (v) =>
      `/apps/${APP}/errorReports:search?${v}filter=${encodeURIComponent(vraag)}`)).uit
  } catch (fout) {
    console.log(`   (de melding zelf kwam niet door: ${String(fout.message).slice(0, 120)})\n`)
    continue
  }
  for (const r of rapport.errorReports ?? []) {
    const kenmerken = [
      r.deviceModel?.marketingName,
      r.osVersion?.apiLevel ? 'API ' + String(r.osVersion.apiLevel) : null,
      r.appVersion?.versionCode ? 'versiecode ' + String(r.appVersion.versionCode) : null,
    ].filter(Boolean)
    if (kenmerken.length) console.log('   ── ' + kenmerken.join(' · '))
    for (const regel of String(r.reportText ?? '(geen tekst)').split('\n')) console.log(`   ${regel}`)
    console.log('')
  }
}

console.log('─'.repeat(72))
console.log('\nPlak de regels hierboven in het gesprek; daar is de reparatie mee te')
console.log('vinden. De eerste regel met een klassenaam en het woord Exception of')
console.log('Error is de belangrijkste.\n')

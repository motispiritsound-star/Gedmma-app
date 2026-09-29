/**
 * Welke rechten heeft het serviceaccount bij Google Play echt?
 *
 * Dit script bestaat omdat er te veel geraden is. `npm run track` kreeg een 403
 * op de laatste stap, en ik heb twee keer een verklaring opgeschreven die ik
 * niet had nagekeken: eerst dat het over het insturen ter beoordeling ging,
 * daarna dat de vlag `changesNotSentForReview` het zou oplossen. Allebei fout.
 * Het is een recht, en welk recht is geen kwestie van vermoeden — de Play API
 * kan het gewoon vertellen.
 *
 *   npm run rechten              laat zien wat het account mag
 *   npm run rechten -- --zetaan  probeert het ontbrekende recht zelf te zetten
 *
 * Dat tweede lukt alleen als het account zelf rechten mag beheren, en dat is
 * precies het recht dat een uitgiftesleutel meestal niet heeft. Lukt het niet,
 * dan zegt hij welk vinkje het is en waar het staat — één ding, niet zeven.
 */
import { leesSleutel, tokenOfStop } from './lib/play.mjs'

const APP = 'app.darijaforkids.learn'
// Het nummer uit het adres van Play Console. Geen geheim: het staat in elke
// URL die je daar opent.
const DEV = '4661006956999186517'
const API = 'https://androidpublisher.googleapis.com'

const arg = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null
}
const ZETAAN = process.argv.includes('--zetaan')

/**
 * De rechten die er in Play Console als vinkje uitzien, met hun naam in de API.
 * Alleen die ertoe doen voor uitgeven; de lijst is langer.
 */
const RECHTEN = {
  CAN_ACCESS_APP: 'de app mogen zien',
  CAN_VIEW_NON_FINANCIAL_DATA: 'cijfers lezen',
  CAN_MANAGE_DRAFT_APPS: 'concepten beheren',
  CAN_MANAGE_TRACK_APKS: 'releases naar testtracks',
  CAN_MANAGE_PUBLIC_APKS: 'releases naar productie',
  CAN_MANAGE_APP_CONTENT: 'app-inhoud beheren',
  CAN_MANAGE_PUBLIC_LISTING: 'winkelvermelding beheren',
  CAN_MANAGE_PERMISSIONS: 'rechten van anderen beheren',
  CAN_REPLY_TO_REVIEWS: 'op recensies antwoorden',
}
/** Dit is het recht waar `npm run track` op strandde. */
const NODIG = 'CAN_MANAGE_TRACK_APKS'

const sleutel = leesSleutel(arg('sleutel'))

async function api(bewijs, pad, opties = {}) {
  const antwoord = await fetch(`${API}${pad}`, {
    ...opties,
    headers: { authorization: `Bearer ${bewijs}`, ...(opties.headers ?? {}) },
  })
  const tekst = await antwoord.text()
  if (!antwoord.ok) {
    const fout = new Error(tekst)
    fout.status = antwoord.status
    throw fout
  }
  return tekst ? JSON.parse(tekst) : {}
}

/* -------------------------------------------------------------------- doen */

console.log(`\nServiceaccount: ${sleutel.client_email}`)
console.log(`App:            ${APP}\n`)

const bewijs = await tokenOfStop(sleutel)

/*
 * De gebruikerslijst ophalen, en die bron heeft een eigenaardigheid.
 *
 * Zonder parameters antwoordt hij met 400: "Pagination is not currently
 * available. The page_size parameter must be set to -1." Je moet paginering dus
 * uitdrukkelijk uitzetten, met een waarde die nergens anders voorkomt. Google
 * noemt het veld `page_size` in die melding, terwijl de JSON-vorm van deze API
 * overal elders `pageSize` gebruikt — daarom worden beide geprobeerd, in die
 * volgorde, net als bij de vensters in crashcheck.mjs. Raden welke van de twee
 * het is kost een ronde; ze allebei proberen kost niets.
 */
async function gebruikers() {
  let laatste
  for (const vorm of ['?pageSize=-1', '?page_size=-1', '']) {
    try {
      return await api(bewijs, `/androidpublisher/v3/developers/${DEV}/users${vorm}`)
    } catch (fout) {
      laatste = fout
      if (fout.status !== 400) throw fout
    }
  }
  throw laatste
}

let ik
try {
  const lijst = await gebruikers()
  ik = (lijst.users ?? []).find((u) => (u.email ?? '').toLowerCase() === sleutel.client_email.toLowerCase())
} catch (fout) {
  if (fout.status === 403) {
    /*
     * Dit mag het account niet. Dat is op zichzelf een antwoord: wie de
     * gebruikerslijst niet mag lezen, mag zeker geen rechten wijzigen, en dan
     * is er geen opdracht die dit oplost.
     */
    console.log('Dit account mag de gebruikerslijst niet lezen. Daarmee staat vast dat het')
    console.log('geen rechten kan beheren, en dus ook niet die van zichzelf. Hier houdt')
    console.log('wat een script kan doen op.\n')
    console.log('Let op wat hier wel en niet bewezen is. Dat het geen rechten mag beheren,')
    console.log('is zojuist aangetoond. Dát het uitgerekend "' + RECHTEN[NODIG] + '"')
    console.log('mist, is afgeleid uit de 403 die npm run track kreeg bij het vastleggen —')
    console.log('dat is de stap waar Google releaserechten toetst. Aannemelijk, niet')
    console.log('bewezen.\n')
    toonHandmatig()
    console.log('Staat dat vinkje al aan? Dan klopt deze verklaring niet en moeten we')
    console.log('ergens anders kijken. Zeg dat dan, in plaats van eraan te gaan zitten')
    console.log('sleutelen.\n')
    process.exit(1)
  }
  /*
   * En alles wat ik niet voorzien heb: leesbaar, niet als stacktrace. Een
   * stacktrace wijst naar de regel waar de fout is gemaakt en niet naar wat
   * eraan te doen is, en dat is hier precies de verkeerde kant op.
   */
  console.error(`De rechten opvragen lukte niet (${fout.status ?? '?'}).\n`)
  console.error(String(fout.message).split('\n').slice(0, 12).join('\n'))
  console.error('\nDit is een antwoord dat ik niet had voorzien. Wat je hoe dan ook zelf')
  console.error('kunt doen:\n')
  toonHandmatig()
  process.exit(1)
}

function toonHandmatig() {
  console.log('In Play Console, bij Gebruikers en rechten:\n')
  console.log(`  1. zoek  ${sleutel.client_email}`)
  console.log('  2. open App-rechten voor deze app')
  console.log(`  3. zet het recht aan dat "${RECHTEN[NODIG]}" heet\n`)
  console.log('Daarna werkt npm run track. Het kan een paar minuten duren voor')
  console.log('Google het doorheeft.\n')
}

if (!ik) {
  console.log('Dit adres staat niet in de gebruikerslijst van dit ontwikkelaarsaccount.')
  console.log('Dan is de sleutel van een ander account, of het is nooit uitgenodigd.\n')
  toonHandmatig()
  process.exit(1)
}

const grant = (ik.grants ?? []).find((g) => g.packageName === APP)
const heeft = new Set([...(ik.developerAccountPermissions ?? []), ...(grant?.appLevelPermissions ?? [])])

console.log('Wat dit account mag:\n')
for (const [naam, wat] of Object.entries(RECHTEN)) {
  const ja = heeft.has(naam)
  console.log(`  ${ja ? 'ja ' : 'NEE'}  ${wat.padEnd(32)} ${naam}`)
}
console.log('')

if (heeft.has(NODIG)) {
  console.log(`Het recht "${RECHTEN[NODIG]}" staat aan. De 403 bij npm run track komt`)
  console.log('dan ergens anders vandaan, en dan is deze uitleg niet de goede.\n')
  process.exit(0)
}

console.log(`Dit ontbreekt: ${RECHTEN[NODIG]} (${NODIG}).`)
console.log('Dat is precies de stap waar npm run track op strandt — Google toetst dat')
console.log('bij het vastleggen en niet eerder, en daarom lukten de upload en de')
console.log('trackwijziging er wel.\n')

if (!ZETAAN) {
  console.log('Proberen het zelf te zetten:\n')
  console.log('  npm run rechten -- --zetaan\n')
  console.log('Dat lukt alleen als dit account rechten mag beheren, en dat heeft een')
  console.log('uitgiftesleutel meestal niet. Zo niet, dan hieronder.\n')
  toonHandmatig()
  process.exit(1)
}

try {
  await api(
    bewijs,
    `/androidpublisher/v3/developers/${DEV}/users/${encodeURIComponent(sleutel.client_email)}` +
      `/grants/${APP}?updateMask=appLevelPermissions`,
    {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ appLevelPermissions: [...new Set([...(grant?.appLevelPermissions ?? []), NODIG])] }),
    },
  )
  console.log('Gelukt. Het recht staat nu aan.\n')
  console.log('  npm run track\n')
} catch (fout) {
  console.log(`Dat mocht niet (${fout.status ?? '?'}). Dit account mag geen rechten beheren,`)
  console.log('en dat is ook precies zoals het hoort voor een uitgiftesleutel.\n')
  toonHandmatig()
  process.exit(1)
}

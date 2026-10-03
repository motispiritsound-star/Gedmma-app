/**
 * De gebouwde app op een aangesloten Android-toestel zetten.
 *
 * Er is één test die geen laptop kan doen: de app in een hand, op het toestel
 * waar hij voor bedoeld is. Tot nu toe ging dat zo: zoek `adb.exe` ergens
 * onder AppData, zet hem in je PATH of typ het hele pad, en denk eraan de oude
 * versie eerst te verwijderen. Drie dingen om te onthouden, en bij alle drie
 * loopt het dood met een foutmelding die over iets anders gaat -- `adb` wordt
 * niet herkend, of `INSTALL_FAILED_UPDATE_INCOMPATIBLE` zonder uitleg.
 *
 * Dus: één opdracht.
 *
 *   npm run opstoestel              de laatst gebouwde .apk
 *   npm run opstoestel -- --apk <pad>   een andere
 *   npm run opstoestel -- --houd    laat de oude versie staan (zie hieronder)
 *
 * `adb` komt uit de Android-SDK die Gradle ook gebruikt; `vindSdk()` weet al
 * waar die staat, inclusief de plek waar Android Studio hem onthoudt.
 *
 * De oude versie gaat er standaard eerst af, en dat is geen voorzichtigheid
 * maar noodzaak: een bundel uit de Play Store is door Google ondertekend en
 * deze .apk door ons, en Android weigert een vervanger met een andere
 * handtekening. Dat levert `INSTALL_FAILED_UPDATE_INCOMPATIBLE` op, een
 * melding waar niets in staat over handtekeningen.
 *
 * Dat wist wel de voortgang op dat toestel. Voor een testtoestel is dat juist
 * goed -- je wilt het startscherm van een verse app zien -- maar wie dat niet
 * wil geeft `--houd` mee. Dan lukt het alleen als de vorige installatie van
 * dezelfde sleutel kwam.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { vindSdk } from './lib/jdk.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAKKET = 'app.darijaforkids.learn'
const WINDOWS = process.platform === 'win32'

const arg = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > -1 ? process.argv[i + 1] : undefined
}
const HOUD = process.argv.includes('--houd')

const APK = path.resolve(
  arg('apk') ?? path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
)

if (!existsSync(APK)) {
  console.error(`\nGeen installatiebestand op:\n  ${APK}\n`)
  console.error('Bouw hem eerst:\n')
  console.error('  npm run apk\n')
  process.exit(1)
}

const sdk = vindSdk()
if (!sdk) {
  console.error('\nDe Android-SDK is niet gevonden, en daar zit `adb` in.\n')
  console.error('Haal hem op met:\n')
  console.error('  npm run sdk\n')
  process.exit(1)
}

const adb = path.join(sdk, 'platform-tools', WINDOWS ? 'adb.exe' : 'adb')
if (!existsSync(adb)) {
  console.error(`\nDe SDK staat er wel, maar \`platform-tools\` niet:\n  ${adb}\n`)
  console.error('Haal hem op met:\n')
  console.error('  npm run sdk\n')
  process.exit(1)
}

/** `adb` draaien en teruggeven wat hij zei; een fout is hier geen uitzondering. */
const praat = (...args) => {
  try {
    return { ok: true, uit: execFileSync(adb, args, { encoding: 'utf8' }) }
  } catch (e) {
    return { ok: false, uit: `${e.stdout ?? ''}${e.stderr ?? ''}` || String(e.message) }
  }
}

const mb = (statSync(APK).size / 1024 / 1024).toFixed(1)
console.log(`\nBestand: ${APK}`)
console.log(`         ${mb} MB\n`)

/*
 * Welke toestellen er hangen, en in welke staat.
 *
 * `unauthorized` is het geval dat het vaakst voorkomt en het minst duidelijk
 * is: de kabel zit erin, het toestel is er, maar op het scherm staat een
 * venster dat om toestemming vraagt en dat niemand heeft weggeklikt. Zonder
 * deze regel krijg je alleen "device unauthorized" van adb en sta je te kijken
 * naar een tablet die volgens jou gewoon aanstaat.
 */
const lijst = praat('devices', '-l')
const regels = lijst.uit.split('\n').slice(1).map((r) => r.trim()).filter(Boolean)
const toestellen = regels.map((r) => ({ naam: r.split(/\s+/)[0], staat: r.split(/\s+/)[1] }))

if (!toestellen.length) {
  console.error('Er hangt geen toestel aan de kabel.\n')
  console.error('Kabel erin, scherm ontgrendelen, en in het meldingenpaneel op de')
  console.error('USB-melding tikken -> Bestandsoverdracht. En USB-foutopsporing moet')
  console.error('aanstaan bij Opties voor ontwikkelaars.\n')
  process.exit(1)
}

const klaar = toestellen.filter((t) => t.staat === 'device')
const wacht = toestellen.filter((t) => t.staat === 'unauthorized')

if (!klaar.length && wacht.length) {
  console.error(`Toestel gevonden (${wacht[0].naam}), maar het heeft nog geen toestemming gegeven.\n`)
  console.error('Kijk op het scherm van het toestel: daar staat "USB-foutopsporing')
  console.error('toestaan?". Aanvinken dat je deze computer vertrouwt, en op OK.\n')
  process.exit(1)
}

if (!klaar.length) {
  console.error(`Toestel gevonden, maar in de staat "${toestellen[0].staat}".\n`)
  process.exit(1)
}

console.log(`Toestel:  ${klaar.map((t) => t.naam).join(', ')}\n`)

if (!HOUD) {
  const weg = praat('uninstall', PAKKET)
  // Niets te verwijderen is geen fout: dan stond hij er gewoon niet.
  console.log(weg.ok ? 'oude versie verwijderd' : 'er stond nog niets op dit toestel')
}

const erop = praat('install', APK)
if (!erop.ok) {
  console.error(`\nHet installeren is misgelukt:\n\n${erop.uit}\n`)
  if (/UPDATE_INCOMPATIBLE|signatures do not match/i.test(erop.uit)) {
    console.error('Dat betekent: er staat een versie op met een andere handtekening --')
    console.error('bijvoorbeeld een uit de Play Store. Draai hem opnieuw zonder --houd,')
    console.error('dan gaat die er eerst af.\n')
  }
  process.exit(1)
}

console.log('geïnstalleerd\n')
console.log('Open hem op het toestel. Waar je naar kijkt:\n')
console.log('  1. hij opent -- dat is waar het om gaat')
console.log('  2. het startscherm in vier stappen: taal, naam en dier, schrift, kleur')
console.log('  3. het leerpad: loopt er een weg tussen de lessen, met je dier erop')
console.log('  4. een les spelen, en kijken of er een diploma op de plank komt\n')

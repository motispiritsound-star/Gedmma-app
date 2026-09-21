/**
 * De ondertekende bundel voor Google Play bouwen.
 *
 * Hetzelfde als *Build → Generate Signed App Bundle* in Android Studio, maar
 * zonder de wizard: de sleutel staat al in `android/keystore.properties` (zie
 * `npm run sleutel`) en Gradle pakt hem daar zelf op.
 *
 *   npm run aab            bouwt de app, synct hem, en maakt de bundel
 *   npm run apk            hetzelfde, maar als .apk voor op je eigen telefoon
 *   node scripts/maak-aab.mjs --versie 2    hoogt versionCode op naar 2
 *
 * Play weigert twee bundels met hetzelfde versionCode, ook als je de eerste
 * hebt ingetrokken. Bij elke volgende upload dus --versie met één erbij.
 *
 * Het verschil tussen de twee vormen: een .aab is wat Play wil, en daar maakt
 * Google per telefoon een installatiebestand van. Zelf installeren kun je hem
 * niet. Een .apk is dat installatiebestand, en die zet je op je eigen toestel
 * om de app te spelen zoals een kind hem straks krijgt -- met geluid, met de
 * echte snelheid, met je duim in plaats van een muis.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geenJdk, haalJdk, vindJdk, vindSdk } from './lib/jdk.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ANDROID = path.join(ROOT, 'android')
const GRADLE = path.join(ANDROID, 'app', 'build.gradle')

const args = process.argv.slice(2)
const versie = args.includes('--versie') ? Number(args[args.indexOf('--versie') + 1]) : null
const alsApk = args.includes('--apk')

const TAAK = alsApk ? 'assembleRelease' : 'bundleRelease'
const RESULTAAT = alsApk
  ? path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
  : path.join(ANDROID, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')

if (!existsSync(path.join(ANDROID, 'keystore.properties'))) {
  console.error('\nEr is nog geen ondertekensleutel.\n')
  console.error('Draai eerst:  npm run sleutel\n')
  process.exit(1)
}

const publiek = path.join(ANDROID, 'app', 'src', 'main', 'assets', 'public', 'index.html')
if (!existsSync(publiek)) {
  console.error('\nDe app staat nog niet in het Android-project.\n')
  console.error('Draai eerst:  npm run android\n')
  process.exit(1)
}

if (versie) {
  const was = readFileSync(GRADLE, 'utf8')
  const wordt = was.replace(/versionCode \d+/, `versionCode ${versie}`)
  if (was === wordt) {
    console.error('Kon versionCode niet vinden in android/app/build.gradle.')
    process.exit(1)
  }
  writeFileSync(GRADLE, wordt)
  console.log(`versionCode → ${versie}`)
}

let jdk = vindJdk()
if (!jdk) jdk = haalJdk()
if (!jdk) geenJdk()

// Gradle vindt de SDK via local.properties of ANDROID_HOME. Vanuit een verse
// PowerShell is geen van beide er -- Android Studio schrijft local.properties
// pas als het het project een keer geopend heeft.
const LOKAAL = path.join(ANDROID, 'local.properties')
if (!existsSync(LOKAAL) && !process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  const sdk = vindSdk()
  if (!sdk) {
    console.error('\nGeen Android-SDK gevonden.\n')
    console.error('Draai eerst:  npm run sdk\n')
    console.error('Dat haalt de SDK op zonder Android Studio. Duurt een minuut of tien.\n')
    process.exit(1)
  }
  writeFileSync(LOKAAL, `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`)
  console.log(`Android-SDK gevonden: ${sdk}`)
}

console.log(`\n${alsApk ? 'Installatiebestand' : 'Bundel'} bouwen. De eerste keer haalt Gradle veel op; reken op een paar minuten.\n`)

// Een .bat kan node sinds versie 20 niet rechtstreeks starten. Via cmd.exe
// dus, maar met /c en vaste argumenten in plaats van shell:true -- dat laatste
// plakt de argumenten aan elkaar tot één tekenreeks, en node waarschuwt daar
// terecht voor.
const [programma, argumenten] =
  process.platform === 'win32'
    ? ['cmd.exe', ['/c', 'gradlew.bat', TAAK]]
    : ['./gradlew', [TAAK]]

try {
  execFileSync(programma, argumenten, {
    cwd: ANDROID,
    stdio: 'inherit',
    env: { ...process.env, JAVA_HOME: jdk },
  })
} catch {
  // Gradle heeft zijn eigen foutmelding al op het scherm gezet; een
  // stacktrace van node eronder maakt alleen maar moeilijker te zien waar je
  // moet kijken.
  console.error('\nGradle is gestopt met een fout.\n')
  console.error('Zoek hierboven het blok dat begint met "* What went wrong:".')
  console.error('Daar staat wat er mis is; de regels eronder zeggen meestal waar.\n')
  process.exit(1)
}

if (!existsSync(RESULTAAT)) {
  console.error('\nGradle is klaar, maar er ligt niets. Lees de uitvoer hierboven.\n')
  process.exit(1)
}

const mb = (statSync(RESULTAAT).size / 1024 / 1024).toFixed(1)
console.log('\nKlaar.\n')
console.log(`  ${RESULTAAT}`)
console.log(`  ${mb} MB\n`)
console.log(
  alsApk
    ? 'Zet dit bestand op je telefoon en open het daar om de app te installeren.\n'
    : 'Die ene .aab is wat je in Play Console uploadt bij een release.\n',
)

/**
 * De ondertekende bundel voor Google Play bouwen.
 *
 * Hetzelfde als *Build → Generate Signed App Bundle* in Android Studio, maar
 * zonder de wizard: de sleutel staat al in `android/keystore.properties` (zie
 * `npm run sleutel`) en Gradle pakt hem daar zelf op.
 *
 *   npm run aab            bouwt de app, synct hem, en maakt de bundel
 *   node scripts/maak-aab.mjs --versie 2    hoogt versionCode op naar 2
 *
 * Play weigert twee bundels met hetzelfde versionCode, ook als je de eerste
 * hebt ingetrokken. Bij elke volgende upload dus --versie met één erbij.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geenJdk, haalJdk, vindJdk, vindSdk } from './lib/jdk.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ANDROID = path.join(ROOT, 'android')
const GRADLE = path.join(ANDROID, 'app', 'build.gradle')
const BUNDEL = path.join(ANDROID, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')

const args = process.argv.slice(2)
const versie = args.includes('--versie') ? Number(args[args.indexOf('--versie') + 1]) : null

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

const wrapper = process.platform === 'win32' ? 'gradlew.bat' : './gradlew'
console.log('\nBundel bouwen. De eerste keer haalt Gradle veel op; reken op een paar minuten.\n')

try {
  execFileSync(wrapper, ['bundleRelease'], {
    cwd: ANDROID,
    stdio: 'inherit',
    shell: process.platform === 'win32',
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

if (!existsSync(BUNDEL)) {
  console.error('\nGradle is klaar, maar er ligt geen bundel. Lees de uitvoer hierboven.\n')
  process.exit(1)
}

const mb = (statSync(BUNDEL).size / 1024 / 1024).toFixed(1)
console.log('\nKlaar.\n')
console.log(`  ${BUNDEL}`)
console.log(`  ${mb} MB\n`)
console.log('Die ene .aab is wat je in Play Console uploadt bij een release.\n')

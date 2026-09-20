/**
 * De Android-SDK ophalen, zonder Android Studio.
 *
 * Android Studio is een editor van een gigabyte die bij het installeren ook de
 * SDK ophaalt. Als je die editor niet gebruikt -- en dat doen we hier niet, we
 * bouwen vanaf de commandoregel -- is het alleen die SDK die je nodig hebt.
 * Google levert hem los als `commandline-tools`, een zip van honderd megabyte
 * met daarin `sdkmanager`, dat de rest binnenhaalt.
 *
 *   npm run sdk
 *
 * Wat erin gaat:
 *   platform-tools          adb en vrienden
 *   platforms;android-36    de doel-API uit android/variables.gradle
 *   build-tools;36.0.0      aapt2, d8, zipalign, apksigner
 *
 * Het pad komt in android/local.properties, waar Gradle als eerste kijkt.
 * Alles bij elkaar ongeveer 600 MB, en een minuut of tien.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geenJdk, haalJdk, vindJdk, vindSdk } from './lib/jdk.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ANDROID = path.join(ROOT, 'android')
const WINDOWS = process.platform === 'win32'
const MAC = process.platform === 'darwin'

const ONDERDELEN = ['platform-tools', 'platforms;android-36']
// De bouwgereedschappen horen bij de Gradle-plugin, en die weet zelf welke
// versie hij wil. Lukt deze niet, dan haalt hij hem straks alsnog op -- de
// licenties staan dan al goed, en dat was het enige wat hij zelf niet kan.
const LIEFST_OOK = ['build-tools;36.0.0']

/**
 * Google zet in elke naam een bouwnummer, en oude blijven bereikbaar. Welke de
 * nieuwste is weten we hier niet, dus we proberen er een paar op volgorde --
 * het maakt niet uit welke het wordt, want sdkmanager werkt zichzelf daarna
 * toch bij.
 */
const NUMMERS = ['13114758', '12700392', '11479570', '11076708', '10406996']

function zipnaam(nummer) {
  const soort = WINDOWS ? 'win' : MAC ? 'mac' : 'linux'
  return `commandlinetools-${soort}-${nummer}_latest.zip`
}

function sdkmap() {
  const thuis = os.homedir()
  if (WINDOWS) return path.join(process.env.LOCALAPPDATA || path.join(thuis, 'AppData', 'Local'), 'Android', 'Sdk')
  if (MAC) return path.join(thuis, 'Library', 'Android', 'sdk')
  return path.join(thuis, 'Android', 'Sdk')
}

async function haalZip(naar) {
  for (const nummer of NUMMERS) {
    const url = `https://dl.google.com/android/repository/${zipnaam(nummer)}`
    process.stdout.write(`Ophalen ${zipnaam(nummer)} ... `)
    try {
      const antwoord = await fetch(url)
      if (!antwoord.ok) {
        console.log(`nee (${antwoord.status})`)
        continue
      }
      const bytes = Buffer.from(await antwoord.arrayBuffer())
      writeFileSync(naar, bytes)
      console.log(`${(bytes.length / 1024 / 1024).toFixed(0)} MB`)
      return true
    } catch (e) {
      console.log(`nee (${e.message})`)
    }
  }
  return false
}

function pakUit(zip, naar) {
  if (WINDOWS) {
    execFileSync(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${naar}' -Force`],
      { stdio: 'inherit' },
    )
  } else {
    execFileSync('unzip', ['-q', '-o', zip, '-d', naar], { stdio: 'inherit' })
  }
}

const staat = vindSdk()
if (staat && existsSync(path.join(staat, 'platforms', 'android-36'))) {
  console.log(`\nDe SDK staat er al: ${staat}`)
  writeFileSync(path.join(ANDROID, 'local.properties'), `sdk.dir=${staat.replace(/\\/g, '\\\\')}\n`)
  console.log('android/local.properties bijgewerkt. Verder met: npm run aab\n')
  process.exit(0)
}

let jdk = vindJdk()
if (!jdk) jdk = haalJdk()
if (!jdk) geenJdk()

const sdk = staat || sdkmap()
const tijdelijk = path.join(os.tmpdir(), `android-sdk-${process.pid}`)
mkdirSync(tijdelijk, { recursive: true })
const zip = path.join(tijdelijk, 'cmdline-tools.zip')

console.log(`\nDe SDK komt in: ${sdk}\n`)

if (!(await haalZip(zip))) {
  console.error('\nKon de commandline-tools niet ophalen.')
  console.error('Controleer je internetverbinding en probeer het opnieuw.\n')
  process.exit(1)
}

// In de zip zit één map, `cmdline-tools`. sdkmanager verwacht hem terug te
// vinden als cmdline-tools/latest -- staat hij ergens anders, dan weigert hij
// met "Could not determine SDK root".
console.log('Uitpakken ...')
pakUit(zip, tijdelijk)
const latest = path.join(sdk, 'cmdline-tools', 'latest')
rmSync(latest, { recursive: true, force: true })
mkdirSync(path.dirname(latest), { recursive: true })
cpSync(path.join(tijdelijk, 'cmdline-tools'), latest, { recursive: true })
rmSync(tijdelijk, { recursive: true, force: true })

const sdkmanager = path.join(latest, 'bin', WINDOWS ? 'sdkmanager.bat' : 'sdkmanager')

/**
 * sdkmanager is op Windows een .bat, en die draait dus door cmd.exe heen. Cmd
 * knipt argumenten op spaties, komma's, puntkomma's en is-tekens -- precies de
 * tekens in `platforms;android-36` en `--sdk_root=...`. Aanhalingstekens
 * houden ze bij elkaar.
 */
function arg(tekst) {
  return WINDOWS ? `"${tekst}"` : tekst
}
const omgeving = { ...process.env, JAVA_HOME: jdk, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk }

// De licenties moeten geaccepteerd worden voor er iets gedownload mag worden.
// Dat is een vraag-en-antwoordspel op de commandoregel; een stapel j's is
// genoeg, en te veel schaadt niet.
console.log('\nLicenties accepteren ...')
try {
  execFileSync(sdkmanager, ['--licenses', arg(`--sdk_root=${sdk}`)], {
    input: 'y\n'.repeat(40),
    stdio: ['pipe', 'ignore', 'inherit'],
    env: omgeving,
    shell: WINDOWS,
  })
} catch {
  // sdkmanager sluit soms af met een foutcode terwijl alles geaccepteerd is.
}

console.log('\nOnderdelen installeren. Dit is het lange stuk.\n')
execFileSync(sdkmanager, [arg(`--sdk_root=${sdk}`), ...ONDERDELEN.map(arg)], {
  stdio: 'inherit',
  env: omgeving,
  shell: WINDOWS,
})

for (const onderdeel of LIEFST_OOK) {
  try {
    execFileSync(sdkmanager, [arg(`--sdk_root=${sdk}`), arg(onderdeel)], {
      stdio: 'inherit',
      env: omgeving,
      shell: WINDOWS,
    })
  } catch {
    console.log(`\n${onderdeel} kon niet; Gradle haalt straks zelf op wat hij nodig heeft.\n`)
  }
}

writeFileSync(path.join(ANDROID, 'local.properties'), `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`)

console.log('\nKlaar.\n')
console.log(`  ${sdk}`)
console.log('  android/local.properties wijst Gradle nu de weg\n')
console.log('Verder met:  npm run aab\n')

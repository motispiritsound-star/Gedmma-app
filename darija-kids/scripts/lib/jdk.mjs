/**
 * De JDK en de Android-SDK opzoeken.
 *
 * Gradle en keytool hebben Java nodig, en op een verse Windows-machine staat
 * JAVA_HOME zelden goed: Android Studio zet zijn eigen JDK in zijn
 * programmamap en vertelt dat aan niemand. Waar die map precies ligt hangt af
 * van hoe Studio geïnstalleerd is — het installatieprogramma, de JetBrains
 * Toolbox, een andere schijf — en hoe oud hij is: vroeger heette de map `jre`,
 * nu `jbr`. Dus zoeken we op alle plekken, en anders in PATH.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, realpathSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const WINDOWS = process.platform === 'win32'
const MAC = process.platform === 'darwin'
const EXT = WINDOWS ? '.exe' : ''

/** Heeft deze map een bin/ met java én keytool erin? */
function bruikbaar(map) {
  if (!map) return false
  return existsSync(path.join(map, 'bin', `java${EXT}`)) && existsSync(path.join(map, 'bin', `keytool${EXT}`))
}

/** De mappen in `ouder`, of niets als die niet bestaat. */
function kinderen(ouder) {
  try {
    return readdirSync(ouder, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => path.join(ouder, d.name))
  } catch {
    return []
  }
}

/** Java uit PATH, terugvertaald naar de map erboven. */
function uitPad() {
  try {
    // stderr dicht: `where` roept anders 'Could not find files for the given
    // pattern(s)' over het scherm als java niet in PATH staat, en dat is hier
    // geen fout maar de normale gang van zaken.
    const uit = execFileSync(WINDOWS ? 'where' : 'which', ['java'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    const regel = uit.split(/\r?\n/)[0]
    if (!regel) return null
    // Op Windows staat er vaak een doorgeefluikje in WindowsApps; realpath
    // brengt ons bij de echte installatie.
    const echt = realpathSync(regel.trim())
    return path.dirname(path.dirname(echt))
  } catch {
    return null
  }
}

function kandidaten() {
  const thuis = os.homedir()
  const uit = [process.env.JAVA_HOME]

  if (WINDOWS) {
    const lokaal = process.env.LOCALAPPDATA || path.join(thuis, 'AppData', 'Local')
    const schijven = ['C:\\Program Files', 'C:\\Program Files (x86)', 'D:\\Program Files']
    // Android Studio: elke versie, elke schijf, jbr én het oude jre.
    for (const ouder of [
      ...schijven.map((s) => path.join(s, 'Android')),
      path.join(lokaal, 'Programs'),
      ...schijven.map((s) => path.join(s, 'JetBrains')),
      path.join(lokaal, 'JetBrains', 'Toolbox', 'apps'),
    ]) {
      for (const map of kinderen(ouder)) {
        uit.push(path.join(map, 'jbr'), path.join(map, 'jre'))
        // Toolbox schuift er nog twee lagen tussen: apps/AndroidStudio/ch-0/<versie>
        for (const kanaal of kinderen(map)) {
          uit.push(path.join(kanaal, 'jbr'))
          for (const versie of kinderen(kanaal)) uit.push(path.join(versie, 'jbr'))
        }
      }
    }
    // Losse JDK's, bijvoorbeeld via winget.
    for (const ouder of [
      ...schijven.map((s) => path.join(s, 'Microsoft')),
      ...schijven.map((s) => path.join(s, 'Eclipse Adoptium')),
      ...schijven.map((s) => path.join(s, 'Java')),
      ...schijven.map((s) => path.join(s, 'Amazon Corretto')),
      ...schijven.map((s) => path.join(s, 'Zulu')),
    ]) {
      uit.push(...kinderen(ouder))
    }
  } else if (MAC) {
    for (const app of ['/Applications', path.join(thuis, 'Applications')]) {
      for (const map of kinderen(app)) {
        if (/Android Studio/i.test(path.basename(map))) uit.push(path.join(map, 'Contents', 'jbr', 'Contents', 'Home'))
      }
    }
    uit.push(...kinderen('/Library/Java/JavaVirtualMachines').map((m) => path.join(m, 'Contents', 'Home')))
  } else {
    uit.push('/opt/android-studio/jbr', path.join(thuis, 'android-studio/jbr'))
    uit.push(...kinderen('/usr/lib/jvm'))
  }

  uit.push(uitPad())
  return uit
}

/** Pad naar een bruikbare JDK, of null. */
export function vindJdk() {
  for (const map of kandidaten()) if (bruikbaar(map)) return map
  return null
}

/** Pad naar een programma in de JDK, bijvoorbeeld 'keytool'. */
export function jdkTool(jdk, naam) {
  return path.join(jdk, 'bin', `${naam}${EXT}`)
}

/**
 * Java erbij installeren.
 *
 * Alleen op Windows, en alleen als winget er is — dat is precies de situatie
 * waarin dit nodig is. Het scheelt een tocht langs een downloadpagina.
 */
export function haalJdk() {
  if (!WINDOWS) return null
  console.log('\nGeen Java gevonden. Ik installeer er een (Microsoft OpenJDK 17).')
  console.log('Dit duurt een paar minuten; er kan een venster om toestemming vragen.\n')
  const argumenten = [
    'install',
    '--id',
    'Microsoft.OpenJDK.17',
    '--silent',
    '--accept-package-agreements',
    '--accept-source-agreements',
  ]
  try {
    // Zonder shell: winget.exe is een echt programma, en node waarschuwt
    // terecht dat argumenten door een shell heen alleen aan elkaar geplakt
    // worden in plaats van netjes doorgegeven.
    execFileSync('winget', argumenten, { stdio: 'inherit' })
  } catch {
    // Behalve als winget alleen als alias in PATH staat; dan toch maar zo.
    try {
      execFileSync('winget.exe', argumenten, { stdio: 'inherit', shell: true })
    } catch {
      return null
    }
  }
  return vindJdk()
}

export function geenJdk() {
  console.error('\nGeen Java gevonden, en installeren lukte ook niet.\n')
  console.error('Doe dit dan met de hand:')
  console.error('  winget install Microsoft.OpenJDK.17')
  console.error('Sluit daarna dit venster, open een nieuw PowerShell-venster en')
  console.error('probeer het commando opnieuw.\n')
  process.exit(1)
}

/**
 * Waar staat de Android-SDK?
 *
 * Gradle zoekt hem via android/local.properties of via ANDROID_HOME, en geen
 * van beide is er als Android Studio het project nog nooit geopend heeft. Dit
 * kijkt op de plek waar de installatiewizard hem standaard neerzet.
 */
export function vindSdk() {
  const thuis = os.homedir()
  const uit = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT]
  if (WINDOWS) {
    const lokaal = process.env.LOCALAPPDATA || path.join(thuis, 'AppData', 'Local')
    uit.push(path.join(lokaal, 'Android', 'Sdk'), path.join(thuis, 'Android', 'Sdk'), 'C:\\Android\\Sdk')
  } else if (MAC) {
    uit.push(path.join(thuis, 'Library', 'Android', 'sdk'))
  } else {
    uit.push(path.join(thuis, 'Android', 'Sdk'), '/usr/lib/android-sdk')
  }
  for (const map of uit) if (map && existsSync(path.join(map, 'platform-tools'))) return map
  return null
}

/** Alles wat we konden vinden, voor als er iets niet klopt. */
export function toon() {
  console.log(`platform : ${process.platform}`)
  console.log(`JAVA_HOME: ${process.env.JAVA_HOME || '(niet gezet)'}`)
  console.log(`java      : ${vindJdk() || '(niet gevonden)'}`)
  console.log(`sdk       : ${vindSdk() || '(niet gevonden)'}`)
  console.log('\nGezocht in:')
  for (const map of kandidaten()) if (map) console.log(`  ${bruikbaar(map) ? '✓' : ' '} ${map}`)
}

if (process.argv[1] && process.argv[1].endsWith('jdk.mjs')) toon()

/**
 * De JDK opzoeken die Android Studio meelevert.
 *
 * Gradle en keytool hebben Java nodig, en op een verse Windows-machine staat
 * JAVA_HOME zelden goed: Android Studio zet zijn eigen JDK (jbr) in zijn
 * programmamap en vertelt dat aan niemand. Dit zoekt hem op, zodat `npm run
 * sleutel` en `npm run aab` werken zonder dat er eerst iets ingesteld moet
 * worden.
 */
import { existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const WINDOWS = process.platform === 'win32'
const MAC = process.platform === 'darwin'

/** Heeft deze map een bin/ met java én keytool erin? */
function bruikbaar(map) {
  if (!map) return false
  const ext = WINDOWS ? '.exe' : ''
  return existsSync(path.join(map, 'bin', `java${ext}`)) && existsSync(path.join(map, 'bin', `keytool${ext}`))
}

function kandidaten() {
  const thuis = os.homedir()
  const uit = [process.env.JAVA_HOME]
  if (WINDOWS) {
    const lokaal = process.env.LOCALAPPDATA || path.join(thuis, 'AppData', 'Local')
    for (const naam of ['Android Studio', 'Android Studio Preview']) {
      uit.push(path.join('C:\\Program Files', 'Android', naam, 'jbr'))
      uit.push(path.join(lokaal, 'Programs', naam, 'jbr'))
    }
  } else if (MAC) {
    uit.push('/Applications/Android Studio.app/Contents/jbr/Contents/Home')
    uit.push(path.join(thuis, 'Applications/Android Studio.app/Contents/jbr/Contents/Home'))
  } else {
    uit.push('/opt/android-studio/jbr', path.join(thuis, 'android-studio/jbr'))
    uit.push('/usr/lib/jvm/default-java', '/usr/lib/jvm/java-17-openjdk-amd64')
  }
  return uit
}

/**
 * Pad naar een bruikbare JDK, of null.
 */
export function vindJdk() {
  for (const map of kandidaten()) if (bruikbaar(map)) return map
  return null
}

/** Pad naar een programma in de JDK, bijvoorbeeld 'keytool'. */
export function jdkTool(jdk, naam) {
  return path.join(jdk, 'bin', WINDOWS ? `${naam}.exe` : naam)
}

export function geenJdk() {
  console.error('\nGeen Java gevonden.\n')
  console.error('Android Studio levert er zelf een mee. Installeer Android Studio en')
  console.error('start het één keer, of zet JAVA_HOME naar een JDK 17 of hoger.\n')
  process.exit(1)
}

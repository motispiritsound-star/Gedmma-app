/**
 * De JDK vinden: `keytool` en `jarsigner` zitten erin.
 *
 * Android Studio brengt een JDK mee, en een Mac of Linux heeft er vaak al een.
 * Dit zoekt op de plekken waar hij staat in plaats van te eisen dat JAVA_HOME
 * goed staat -- dat is precies de instelling die op een nieuwe computer
 * ontbreekt, en een foutmelding daarover zegt niets over wat er te doen is.
 */
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

const WINDOWS = process.platform === 'win32'
const EXT = WINDOWS ? '.exe' : ''

/** Waar een JDK kan staan, in volgorde van waarschijnlijkheid. */
function kandidaten() {
  const thuis = os.homedir()
  const uit = []
  if (process.env.JAVA_HOME) uit.push(process.env.JAVA_HOME)

  // De JDK die bij Android Studio zit. Dit is op de meeste computers de enige.
  if (WINDOWS) {
    uit.push(
      path.join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Android', 'Android Studio', 'jbr'),
      path.join(process.env.LOCALAPPDATA ?? path.join(thuis, 'AppData', 'Local'), 'Programs', 'Android Studio', 'jbr'),
    )
  } else if (process.platform === 'darwin') {
    uit.push(
      '/Applications/Android Studio.app/Contents/jbr/Contents/Home',
      '/Library/Java/JavaVirtualMachines/current/Contents/Home',
    )
  } else {
    uit.push('/usr/lib/jvm/default-java', '/usr/lib/jvm/java-21-openjdk-amd64')
  }
  return uit
}

/** Het pad naar een tool uit de JDK, of null als er geen JDK te vinden is. */
export function jdkTool(naam) {
  for (const basis of kandidaten()) {
    const pad = path.join(basis, 'bin', naam + EXT)
    if (existsSync(pad)) return pad
  }
  // Staat hij gewoon in PATH? Dan is dat ook goed.
  try {
    const zoek = WINDOWS ? 'where' : 'which'
    const uit = execFileSync(zoek, [naam], { encoding: 'utf8' }).split(/\r?\n/)[0]?.trim()
    if (uit && existsSync(uit)) return uit
  } catch { /* niet gevonden */ }
  return null
}

/** Wat je afdrukt als er geen JDK is. Eén ding om te doen, geen zeven stappen. */
export const geenJdk = () => [
  'Geen Java gevonden, en die is nodig om de sleutel te maken en de app te',
  'ondertekenen.',
  '',
  'Installeer Android Studio — daar zit er een in, en je hebt hem toch nodig',
  'voor de Android SDK:',
  '',
  '    https://developer.android.com/studio',
  '',
  'Staat hij er wel maar vindt dit script hem niet, zet dan JAVA_HOME en',
  'probeer opnieuw.',
].join('\n')

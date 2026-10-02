/**
 * Wat er in het Android-manifest staat, en vooral wat er niet in hoort.
 *
 * Het manifest dat in de bundel belandt is niet het bestand dat hier staat:
 * Gradle voegt de manifesten van alle plugins erbij. Een plugin kan dus een
 * recht aanvragen dat wij nooit hebben opgeschreven, en dat is precies wat er
 * gebeurde met `SCHEDULE_EXACT_ALARM`.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const WORTEL = process.cwd()
const manifest = readFileSync(path.join(WORTEL, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
const talen = readFileSync(path.join(WORTEL, 'android/app/src/main/res/xml/locales_config.xml'), 'utf8')
const plugin = path.join(WORTEL, 'node_modules/@capacitor/local-notifications/android/src/main/AndroidManifest.xml')

describe('het recht op een exacte wekker', () => {
  /**
   * Eerst het bewijs dat het probleem bestaat: de plugin vraagt het aan. Komt
   * er ooit een versie die dat niet meer doet, dan valt deze test om en kan
   * de verwijdering eruit.
   */
  it('wordt door de meldingenplugin aangevraagd', () => {
    expect(readFileSync(plugin, 'utf8')).toContain('android.permission.SCHEDULE_EXACT_ALARM')
  })

  /**
   * Google beperkt dit recht tot wekkers, timers en agenda-afspraken. Een app
   * die één keer per dag een herinnering stuurt komt daar niet voor in
   * aanmerking, en wie het toch aanvraagt moet het in Play Console
   * verantwoorden — of wordt afgewezen.
   */
  it('wordt door ons weer weggehaald', () => {
    expect(manifest).toMatch(
      /<uses-permission android:name="android\.permission\.SCHEDULE_EXACT_ALARM" tools:node="remove" \/>/,
    )
  })

  /** `tools:node` werkt alleen met de naamruimte erbij. */
  it('en de naamruimte van tools staat erboven', () => {
    expect(manifest).toContain('xmlns:tools="http://schemas.android.com/tools"')
  })

  /**
   * Weghalen mag alleen omdat de plugin terugvalt. Op Android 12 en later
   * vraagt hij eerst `canScheduleExactAlarms()`, en gebruikt bij nee
   * `setAndAllowWhileIdle`. De herinnering komt dan rond de gekozen tijd in
   * plaats van op de seconde, en dat is wat er bedoeld was.
   */
  it('en de plugin valt terug op een onnauwkeurige wekker', () => {
    const beheer = readFileSync(
      path.join(WORTEL, 'node_modules/@capacitor/local-notifications/android/src/main/kotlin/com/capacitorjs/plugins/localnotifications/LocalNotificationManager.kt'),
      'utf8',
    )
    expect(beheer).toContain('canScheduleExactAlarms(alarmManager)')
    expect(beheer).toContain('setAndAllowWhileIdle')
  })
})

describe('de rechten die er wél in horen', () => {
  it.each([
    ['android.permission.INTERNET', 'de WebView laadt zijn eigen bestanden'],
    ['android.permission.RECORD_AUDIO', 'de spreekronde neemt je uitspraak op'],
  ])('%s staat er (%s)', (recht) => {
    expect(manifest).toContain(`<uses-permission android:name="${recht}" />`)
  })

  /** Een tablet zonder microfoon mag de app gewoon installeren. */
  it('de microfoon is geen eis', () => {
    expect(manifest).toContain('android:name="android.hardware.microphone" android:required="false"')
  })
})

/**
 * De talen die Android aanbiedt onder "App-taal", sinds Android 13. Stond er
 * een taal niet bij, dan kan een gezin de app niet op die taal zetten zonder
 * het hele toestel om te zetten — en Italiaans ontbrak.
 */
describe('de talen in locales_config', () => {
  it.each(['nl', 'fr', 'de', 'es', 'it', 'en'])('%s staat erin', (code) => {
    expect(talen).toContain(`<locale android:name="${code}" />`)
  })

  it('en het zijn er precies zes, net als in de app', () => {
    expect(talen.match(/<locale android:name="/g)).toHaveLength(6)
  })
})

/**
 * De enige Java-klasse van de app moet in de repository staan.
 *
 * Dit heeft een afwijzing bij Google gekost, en het was van buiten niet te
 * zien. De hoofd-`.gitignore` gooide `android/` weg met een uitzondering voor
 * `bladi/android/` — de naam die deze map vroeger had. Na de hernoeming naar
 * `darija-kids` gold die uitzondering nergens meer.
 *
 * Een deel van de bestanden stond er toch in, ooit met `git add -f` erin
 * gezet. `MainActivity.java` niet. En die wordt door `npx cap sync` niet
 * teruggemaakt: alleen `npx cap add android` schrijft hem, en dat doe je één
 * keer. Een verse kloon kreeg dus het manifest, de plaatjes en de
 * gradle-bestanden, maar niet de klasse waar het manifest naar wijst.
 *
 * Gradle merkt daar niets van. Er is niets te compileren, dus de bouw slaagt
 * zonder één waarschuwing, de bundel is te ondertekenen en te uploaden, en
 * Play neemt hem aan. Pas bij het starten zoekt Android
 * `app.darijaforkids.learn.MainActivity`, vindt hem niet, en sluit de app af:
 *
 *   java.lang.ClassNotFoundException: Didn't find class
 *   "app.darijaforkids.learn.MainActivity" on path: DexPathList[...base.apk...]
 *
 * Dat is wat Google zag — "Crashes: Your app crashes after opening" — en wat
 * op een Galaxy Tab A met Android 11 precies zo is nagespeeld.
 *
 * Deze test kijkt niet of het bestand bestáát. Dat deed het namelijk, op de
 * machine waar het ooit is aangemaakt. Hij kijkt of git hem meeneemt.
 */
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const WORTEL = process.cwd()
const BRON = 'android/app/src/main/java/app/darijaforkids/learn/MainActivity.java'

const git = (args: string[]): string =>
  execFileSync('git', args, { cwd: WORTEL, encoding: 'utf8' }).trim()

describe('MainActivity.java', () => {
  /** De kern: staat hij in de index, dus krijgt een verse kloon hem mee? */
  it('wordt door git meegenomen', () => {
    expect(git(['ls-files', BRON])).toBe(BRON)
  })

  /**
   * En wordt hij door geen enkele regel genegeerd. `ls-files` alleen is niet
   * genoeg: een bestand kan gevolgd zijn én genegeerd, en dan verdwijnt hij
   * bij de eerste de beste `git rm --cached`.
   */
  it('wordt door geen enkele negeerregel geraakt', () => {
    let uit = ''
    try {
      uit = execFileSync('git', ['check-ignore', '-v', BRON], { cwd: WORTEL, encoding: 'utf8' }).trim()
    } catch {
      // `check-ignore` geeft afsluitcode 1 als er niets wordt genegeerd. Goed.
      return
    }
    expect(uit, `deze regel negeert ${BRON}`).toBe('')
  })
})

describe('en hij heet wat het manifest verwacht', () => {
  const bron = readFileSync(path.join(WORTEL, BRON), 'utf8')
  const manifest = readFileSync(path.join(WORTEL, 'android/app/src/main/AndroidManifest.xml'), 'utf8')
  const gradle = readFileSync(path.join(WORTEL, 'android/app/build.gradle'), 'utf8')

  const naamruimte = /namespace = "([^"]+)"/.exec(gradle)?.[1]
  const activiteit = /android:name="(\.[A-Za-z0-9_.]+)"/.exec(manifest)?.[1]
  const pakket = /^package ([a-z0-9_.]+);/m.exec(bron)?.[1]
  const klasse = /public class ([A-Za-z0-9_]+)/.exec(bron)?.[1]

  it('alle vier de stukjes zijn te vinden', () => {
    expect({ naamruimte, activiteit, pakket, klasse }).toEqual({
      naamruimte: 'app.darijaforkids.learn',
      activiteit: '.MainActivity',
      pakket: 'app.darijaforkids.learn',
      klasse: 'MainActivity',
    })
  })

  /**
   * `android:name=".MainActivity"` is een afkorting: Android plakt er de
   * naamruimte voor. Dat moet dus uitkomen op precies de klasse die in het
   * bestand staat, anders krijg je dezelfde ClassNotFoundException met een
   * bestand dat er wél is.
   */
  it('namespace plus activiteit is precies de klasse in het bestand', () => {
    expect(`${naamruimte}${activiteit}`).toBe(`${pakket}.${klasse}`)
  })

  /** Capacitor's brug zit erin; zonder die basisklasse laadt de WebView niet. */
  it('erft van BridgeActivity', () => {
    expect(bron).toContain('import com.getcapacitor.BridgeActivity')
    expect(bron).toMatch(/class MainActivity extends BridgeActivity/)
  })
})

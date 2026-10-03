/**
 * Een kopie van je voortgang meenemen, zonder een bestand.
 *
 * "Voortgang opslaan" maakte een blob en tikte op een onzichtbare `<a
 * download>`. In een browser levert dat een bestand op. In de app niet, en
 * dat is geen vermoeden: `@capacitor/ios` zet geen `WKDownloadDelegate` en
 * `@capacitor/android` geen `DownloadListener`, en zonder die twee laat een
 * webweergave een download vallen. Geen bestand, geen foutmelding, geen
 * uitleg. De knop deed dus niets in precies de twee builds die in de winkel
 * staan — en het is de knop waar het wisscherm naar verwijst: "bewaar eerst
 * een kopie".
 *
 * Terugzetten werkte wél, want een `<input type="file">` krijgt op Android een
 * kiezer van `BridgeWebChromeClient` en op iOS van de webweergave zelf. Dat
 * maakte het erger: wie het probeerde kon wel iets terugzetten, maar nooit
 * iets bewaren.
 *
 * Een bestand wegschrijven zou twee nieuwe native plugins kosten
 * (`@capacitor/filesystem` en `@capacitor/share`), en die komen na de
 * lancering. Wat nu kan en in beide webweergaven werkt, is de tekst zelf: het
 * klembord uit, een notitie of een mail in, en er weer in via "Tekst
 * plakken". Daarmee loopt het rondje heel, en dat is wat ontbrak.
 */
import { platform } from './platform'

/**
 * Of een bestand downloaden hier iets oplevert.
 *
 * Alleen op het web. Zie de toelichting hierboven voor waarom de app dat niet
 * kan — en waarom het stil mislukte.
 */
export const kanDownloaden = (): boolean => platform() === 'web'

/**
 * Tekst naar het klembord, langs de nieuwe weg of de oude.
 *
 * `navigator.clipboard` bestaat in beide webweergaven en vraagt een
 * veilige herkomst; Capacitor dient de app van `https://localhost` (iOS) en
 * `http://localhost` (Android), en dat tweede geldt ook als veilig. Maar het
 * kan geweigerd worden — zonder tik van een gebruiker, of in een oudere
 * webweergave — en dan is er nog `execCommand('copy')`, dat het al deed
 * voordat die API bestond.
 *
 * Lukt geen van beide, dan zegt het scherm wat de lezer zelf kan doen. De
 * tekst staat er, dus ingedrukt houden en kopiëren blijft altijd over.
 */
export async function naarKlembord(tekst: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(tekst)
      return true
    }
  } catch {
    // Geweigerd; de oude weg hieronder mag het nog proberen.
  }
  return viaSelectie(tekst)
}

/**
 * De oude weg: zet de tekst in een veld, selecteer hem, laat het kopiëren.
 *
 * Het veld staat buiten beeld en niet op `display: none` — een veld dat er
 * niet is, is niet te selecteren. `readOnly` houdt het toetsenbord dicht op
 * een telefoon, en `fontSize: 16px` voorkomt dat Safari erop inzoomt in de
 * tel dat het veld er staat.
 */
function viaSelectie(tekst: string): boolean {
  if (typeof document === 'undefined') return false
  const veld = document.createElement('textarea')
  veld.value = tekst
  veld.readOnly = true
  veld.setAttribute('aria-hidden', 'true')
  veld.style.position = 'fixed'
  veld.style.top = '-1000px'
  veld.style.fontSize = '16px'
  document.body.appendChild(veld)
  try {
    veld.select()
    veld.setSelectionRange(0, tekst.length)
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    veld.remove()
  }
}

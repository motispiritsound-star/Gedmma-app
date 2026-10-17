import { getState } from './store'

/**
 * De meldingen die dit toestel aan zichzelf stuurt. Er zijn er twee.
 *
 * De herinnering: één melding per dag, op een tijd die de ouder kiest. En
 * daarnaast, onderaan dit bestand, één eenmalig seintje als de vier gratis
 * lessen gedaan zijn.
 *
 * Apple schrijft er in richtlijn 4.2 zelf bij dat een melding op zichzelf
 * niets bewijst, en dat klopt. Hij staat hier niet om een vinkje te halen maar
 * omdat een reeks die je vergeet geen reeks is: dit is de enige plek waar de
 * app zelf begint, en alles wat ze verder doet wacht op een kind dat haar
 * opent.
 *
 * Wat ze níét is: een pushbericht. Er is geen server, er is geen token, er
 * gaat niets naar buiten. Het toestel zet een wekker en die wekker gaat af,
 * ook in het vliegtuig. Dat is precies zo veel als deze app nodig heeft.
 *
 * Net als bij het abonnement en het trillen praten we via `window.Capacitor`,
 * zodat de webbuild niets van de native laag meeneemt.
 */

type Meldingen = {
  requestPermissions?: () => Promise<{ display?: string }>
  checkPermissions?: () => Promise<{ display?: string }>
  schedule?: (o: { notifications: unknown[] }) => Promise<unknown>
  cancel?: (o: { notifications: { id: number }[] }) => Promise<unknown>
}

/**
 * Twee vaste ids, en meer worden het niet.
 *
 * 1 is de dagelijkse wekker. Altijd dezelfde, zodat opnieuw inplannen de oude
 * overschrijft in plaats van er een tweede naast te zetten.
 *
 * 2 is het enige eenmalige seintje dat deze app kent: dat de vier gratis
 * lessen gedaan zijn. Het heeft een eigen nummer nodig, want anders wist het
 * zetten van de dagelijkse wekker het weg -- en omgekeerd.
 */
const ID = 1
const ID_GRATIS_OP = 2

const plugin = (): Meldingen | null =>
  (window as { Capacitor?: { Plugins?: { LocalNotifications?: Meldingen } } })
    .Capacitor?.Plugins?.LocalNotifications ?? null

/** Of dit toestel meldingen kan zetten. Op het web: nee. */
export const kanHerinneren = (): boolean => plugin() !== null

/** "18:30" wordt half zeven 's avonds. Onleesbare invoer wordt zes uur. */
const uurEnMinuut = (tijd: string): { uur: number; minuut: number } => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(tijd.trim())
  const uur = m ? Number(m[1]) : 18
  const minuut = m ? Number(m[2]) : 0
  return {
    uur: uur >= 0 && uur <= 23 ? uur : 18,
    minuut: minuut >= 0 && minuut <= 59 ? minuut : 0,
  }
}

/**
 * Zet de wekker, of haalt hem weg.
 *
 * Eerst altijd weghalen. Een melding die je opnieuw inplant zonder de oude te
 * wissen levert er twee op, en twee herinneringen op één avond is precies de
 * reden dat mensen meldingen uitzetten.
 */
export async function zetHerinnering(
  aan: boolean,
  tijd: string,
  tekst: { titel: string; body: string },
): Promise<boolean> {
  const api = plugin()
  if (!api) return false
  try {
    await api.cancel?.({ notifications: [{ id: ID }] })
    if (!aan) return false

    const toestemming = (await api.requestPermissions?.())?.display
    if (toestemming !== 'granted') return false

    const { uur, minuut } = uurEnMinuut(tijd)
    await api.schedule?.({
      notifications: [{
        id: ID,
        title: tekst.titel,
        body: tekst.body,
        schedule: { on: { hour: uur, minute: minuut }, allowWhileIdle: true },
      }],
    })
    return true
  } catch {
    return false
  }
}

/**
 * De wekker opnieuw zetten bij het opstarten.
 *
 * iOS bewaart een geplande melding over een herstart heen, maar niet over een
 * herinstallatie, en Android is er per fabrikant wisselend in. Eén keer per
 * start opnieuw zetten kost niets en scheelt een reeks.
 */
export async function herstelHerinnering(tekst: { titel: string; body: string }): Promise<void> {
  const s = getState().settings
  if (!s.herinnering) return
  await zetHerinnering(true, s.herinneringTijd, tekst)
}

/* ------------------------------------------------- het gratis deel is op */

/**
 * Het seintje dat de vier gratis lessen gedaan zijn.
 *
 * Het kind maakt de vierde les af en ziet dat op het scorescherm staan. De
 * ouder, die beslist of er verder geleerd wordt, zit op dat moment meestal
 * niet mee te kijken -- en dit is de enige plek in de app waar die twee niet
 * dezelfde persoon zijn. Daarom één melding, de volgende ochtend.
 *
 * Drie dingen die hij met opzet níét doet:
 *
 *   - Hij vraagt geen toestemming. Een systeemvenster op het moment dat het
 *     slot in beeld komt is een verkooppraatje met een knop erin. Staat de
 *     toestemming er al -- omdat de ouder de dagelijkse wekker aanzette -- dan
 *     gaat hij; anders niet, en daar blijft het bij. Dat is ook waarom het
 *     welkomstscherm die wekker aanbiedt: zonder dat ja bestaat dit seintje
 *     alleen op papier.
 *   - Hij zegt niet "koop nu". Er staat wat er gebeurd is. Wie wil weten wat
 *     het kost opent de app, waar de prijs staat. Apple noemt een melding die
 *     wel verkoopt in richtlijn 4.5.4 met zoveel woorden, en terecht.
 *   - Hij herhaalt zich niet. `gratisOpGemeld` in de staat houdt bij dat hij
 *     geweest is; een gratis les die opnieuw gespeeld wordt levert er geen
 *     tweede op.
 *
 * Tien uur 's ochtends, de dag erna: ver genoeg van de avond dat hij niet
 * boven op de dagelijkse wekker valt, en op een tijd dat een telefoon
 * doorgaans in een hand ligt.
 */
export async function seintjeGratisOp(tekst: { titel: string; body: string }): Promise<boolean> {
  const api = plugin()
  if (!api) return false
  try {
    const toestemming = (await api.checkPermissions?.())?.display
    if (toestemming !== 'granted') return false

    const wanneer = new Date()
    wanneer.setDate(wanneer.getDate() + 1)
    wanneer.setHours(10, 0, 0, 0)
    await api.schedule?.({
      notifications: [{
        id: ID_GRATIS_OP,
        title: tekst.titel,
        body: tekst.body,
        schedule: { at: wanneer, allowWhileIdle: true },
      }],
    })
    return true
  } catch {
    return false
  }
}

/**
 * Het seintje weghalen.
 *
 * Wordt er betaald tussen het afmaken van de vierde les en de volgende
 * ochtend, dan hoort die melding niet meer te komen: "de gratis lessen zijn
 * gedaan" tegen iemand die net een abonnement nam is op zijn best verwarrend.
 * `grant()` in billing.ts is de enige plek waar de toegang opengaat, en dus de
 * enige plek die dit hoort aan te roepen.
 */
export async function wisSeintjeGratisOp(): Promise<void> {
  const api = plugin()
  if (!api) return
  try {
    await api.cancel?.({ notifications: [{ id: ID_GRATIS_OP }] })
  } catch { /* niets te wissen is geen fout */ }
}

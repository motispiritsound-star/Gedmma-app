import { getState, magLeren } from './store'

/**
 * De melding die dit toestel aan zichzelf stuurt. Er is er één.
 *
 * De herinnering: één melding per dag, op een tijd die de ouder kiest. Hier
 * stond daarnaast één eenmalig seintje, voor als de gratis lessen gedaan
 * waren; dat is op 23 november vervallen met het gratis deel zelf.
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
 * Eén vast id, en het blijft er één.
 *
 * Altijd hetzelfde nummer, zodat opnieuw inplannen de oude wekker overschrijft
 * in plaats van er een tweede naast te zetten. Nummer 2 was van het eenmalige
 * seintje over het gratis deel; dat bestaat niet meer, en als er ooit weer een
 * tweede melding komt hoort die een eigen nummer te krijgen — anders wist de
 * één de ander weg.
 */
const ID = 1

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
    /*
     * Geen wekker voor wie niets kan doen.
     *
     * Sinds er geen gratis lessen meer zijn, zou een dagelijkse melding voor
     * een niet-betaler een uitnodiging zijn voor iets wat achter de kassa
     * staat -- elke dag opnieuw. Dat is precies de melding waar Apple in
     * richtlijn 4.5.4 naar kijkt, en in de kindercategorie wil je die niet
     * sturen. De voorkeur blijft wel staan: zodra er betaald is, zet
     * `herstelHerinnering` hem bij de volgende start gewoon aan.
     */
    if (!magLeren(getState())) return false

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
  // De wacht op `magLeren` zit in `zetHerinnering`, dus hij geldt hier ook.

  const s = getState().settings
  if (!s.herinnering) return
  await zetHerinnering(true, s.herinneringTijd, tekst)
}

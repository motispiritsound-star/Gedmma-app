import { getState } from './store'

/**
 * Trillen: het enige in deze app dat je voelt in plaats van ziet of hoort.
 *
 * Een browser op een iPhone kan dit niet. `navigator.vibrate` bestaat daar
 * niet en heeft er nooit bestaan, en dat gaat ook niet veranderen. Een app
 * kan het wel, en dat is precies waarom het hier staat: een goed antwoord
 * moet in je hand aankomen, niet alleen op het scherm.
 *
 * Net als bij het abonnement praten we via `window.Capacitor` en niet via een
 * import, zodat de webbuild niets van de native laag meeneemt.
 *
 * Alles faalt geruisloos. Een toestel zonder trilmotor, een gebruiker die het
 * uit heeft gezet, een oude Android zonder rechten — in alle drie de gevallen
 * gebeurt er niets, en het spel loopt door.
 */

type Haptics = {
  impact?: (o: { style: string }) => Promise<unknown>
  notification?: (o: { type: string }) => Promise<unknown>
  selectionStart?: () => Promise<unknown>
  selectionChanged?: () => Promise<unknown>
  selectionEnd?: () => Promise<unknown>
}

const plugin = (): Haptics | null =>
  (window as { Capacitor?: { Plugins?: { Haptics?: Haptics } } }).Capacitor?.Plugins?.Haptics ?? null

/** Uit als de instelling uit staat; stil als het toestel het niet kan. */
const aan = (): Haptics | null => (getState().settings.trillen ? plugin() : null)

const stil = (p: Promise<unknown> | undefined): void => void p?.catch(() => {})

/**
 * De vier momenten die de moeite waard zijn om te voelen.
 *
 * Meer dan vier is te veel: een telefoon die de hele les zit te trillen wordt
 * een telefoon die je uitzet. Dit is goed, fout, een tik onder je vinger, en
 * het einde van iets.
 */
export const tril = {
  /** Een goed antwoord. Kort en licht — het mag niet in de weg zitten. */
  goed: () => stil(aan()?.notification?.({ type: 'SUCCESS' })),
  /** Een fout antwoord. Zwaarder, maar geen straf. */
  fout: () => stil(aan()?.notification?.({ type: 'WARNING' })),
  /** Onder je vinger: een keuze, een letter die je natekent. */
  tik: () => stil(aan()?.impact?.({ style: 'LIGHT' })),
  /** Een les uit, een insigne, een niveau erbij. */
  feest: () => stil(aan()?.impact?.({ style: 'HEAVY' })),
}

/** Of dit toestel überhaupt kan trillen — voor het instellingenscherm. */
export const kanTrillen = (): boolean => plugin() !== null

/**
 * Wanneer de app van het scherm af gaat.
 *
 * Nodig voor één ding: de ouderpoort vergeet zijn antwoord dan. Die poort
 * vraagt de som één keer per keer dat de app open is, zodat een ouder die de
 * app aan het inrichten is hem niet tien keer op een avond hoeft te maken —
 * maar zonder deze regel betekent "één keer per keer dat de app open is" in de
 * praktijk: één keer, en daarna nooit meer. Een app op een tablet gaat niet
 * dicht, hij gaat weg. Het kind pakt hem een uur later op, de poort staat nog
 * open, en dan bewaakt hij niets meer.
 *
 * `pause` en niet `appStateChange`. Dat tweede komt op iOS van
 * `willResignActive`, en dat gaat af bij elk venster van het systeem — een
 * telefoontje, het bedieningspaneel, een melding die binnenkomt. Dan zou de
 * poort midden in een handeling terugkomen die al aan het lopen was.
 * `pause` hangt op iOS aan `didEnterBackground` en op Android aan `onPause`,
 * en dat is pas echt "de app is er niet meer".
 *
 * Op de website en in de browser bestaat de plugin niet. Daar doet dit niets:
 * een tabblad dat je sluit neemt de hele sessie mee, dus daar is er niets te
 * vergeten.
 */

interface Luisteraar { remove: () => void }

interface AppPlugin {
  addListener: (naam: 'pause', cb: () => void) => Promise<Luisteraar> | Luisteraar
}

const appPlugin = (): AppPlugin | null =>
  // `typeof window` en niet gewoon `window`: dit bestand wordt ook geladen
  // waar geen bladzijde is — in de tests, en bij het voorbakken van de site.
  typeof window === 'undefined'
    ? null
    : (window as unknown as { Capacitor?: { Plugins?: { App?: AppPlugin } } })
      .Capacitor?.Plugins?.App ?? null

/**
 * Luistert tot je de teruggegeven functie aanroept.
 *
 * Dezelfde afhandeling als in `terug.ts`: `addListener` geeft in sommige
 * versies een belofte terug en in andere het ding zelf, en wie afmeldt voordat
 * die belofte rond is, moet de luisteraar die daarna alsnog binnenkomt meteen
 * weghalen — anders blijft hij hangen.
 */
export function opPauze(doe: () => void): () => void {
  const plugin = appPlugin()
  if (!plugin) return () => {}

  let weg: (() => void) | null = null
  let afgemeld = false

  void Promise.resolve(plugin.addListener('pause', doe))
    .then((l) => {
      if (afgemeld) l.remove()
      else weg = () => l.remove()
    })
    .catch(() => {})

  return () => {
    afgemeld = true
    weg?.()
    weg = null
  }
}

/**
 * De terugknop van Android.
 *
 * Op Android is terug een systeemknop — tegenwoordig meestal een veeg vanaf
 * de rand. Android-gebruikers gebruiken hem voor álles waarvan ze af willen,
 * en dat geldt zeker voor een paneel dat over het scherm heen komt. Doet hij
 * daar niets of iets anders, dan voelt de app als een website in een jasje.
 *
 * Capacitor meldt die druk via de `App`-plugin. Belangrijk detail: zodra er
 * één luisteraar staat, vervalt het standaardgedrag — dan gebeurt er alleen
 * nog wat die luisteraar doet. Daarom wordt hij hier alleen aangezet zolang
 * er werkelijk iets te sluiten is, en meteen daarna weer weggehaald.
 *
 * Op de website en in de browser bestaat de plugin niet. Dan doet dit niets,
 * en blijft de terugknop van de browser gewoon de terugknop van de browser.
 */

interface Luisteraar { remove: () => void }

interface AppPlugin {
  addListener: (naam: 'backButton', cb: () => void) => Promise<Luisteraar> | Luisteraar
}

const appPlugin = (): AppPlugin | null =>
  // `typeof window` en niet gewoon `window`: dit bestand wordt ook geladen waar
  // geen bladzijde is -- in de tests, en bij het voorbakken van de website.
  typeof window === 'undefined'
    ? null
    : (window as unknown as { Capacitor?: { Plugins?: { App?: AppPlugin } } })
      .Capacitor?.Plugins?.App ?? null

export const kanTerugluisteren = (): boolean => appPlugin() !== null

/**
 * Luistert naar de terugknop totdat je de teruggegeven functie aanroept.
 *
 * `addListener` geeft in sommige versies een belofte terug en in andere het
 * ding zelf, dus allebei worden afgehandeld. En wordt er afgemeld voordat die
 * belofte rond is, dan moet de luisteraar die daarna alsnog binnenkomt meteen
 * weg — anders blijft hij hangen en sluit de volgende terugdruk iets wat er
 * niet meer staat.
 */
export function opTerug(doe: () => void): () => void {
  const plugin = appPlugin()
  if (!plugin) return () => {}

  let weg: (() => void) | null = null
  let afgemeld = false

  void Promise.resolve(plugin.addListener('backButton', doe))
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

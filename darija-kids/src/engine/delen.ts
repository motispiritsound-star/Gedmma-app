/**
 * Delen — en waarom het precies WhatsApp is en verder niets.
 *
 * In Marokkaans-Nederlandse families gebeurt alles in WhatsApp: de
 * familiegroep, de buurtgroep, de klassenapp. `docs/LANCERING.md` §4 noemt
 * het "de motor" en dat is geen compromis — van alle kanalen is dit het enige
 * waar een aanbeveling van een neef zwaarder weegt dan een advertentie.
 *
 * §12 vraagt er twee dingen voor: een deelkaart bij een mijlpaal, en "laat
 * het aan oma zien" op het ouderscherm. Dat is dezelfde kaart met een andere
 * aanleiding, dus het is hier ook dezelfde code.
 *
 * **Geen deelplugin.** `navigator.share` en `@capacitor/share` kunnen allebei
 * meer — een plaatje meesturen bijvoorbeeld — maar ze kosten allebei iets wat
 * hier zwaarder weegt: de eerste werkt niet overal hetzelfde in een
 * WebView, de tweede is native code erbij, een `cap sync` meer, en een
 * plugin die stil kan wegvallen (zie `scripts/lib/plugins.mjs`, waar dat één
 * keer gebeurd is). `wa.me` is een gewoon adres, werkt op allebei de
 * platforms en opent WhatsApp met de tekst er al in.
 *
 * **En er gaat niets naar een server.** De tekst wordt hier samengesteld en
 * aan de telefoon gegeven. De app ziet niet of er iets verstuurd is, aan wie,
 * of hoe vaak — en dat hoeft ook niet.
 */
import { getState, setState, type State } from './store'

/**
 * De mijlpalen, in woorden die vastzitten.
 *
 * "Vastzitten" is `strength >= 0.85`, hetzelfde getal waar /ouders en
 * /profiel mee rekenen. Niet "gezien": een woord dat één keer voorbijkwam is
 * geen woord dat je kent, en een deelbericht dat dat beweert is een bericht
 * waar de ontvanger de app op afrekent.
 *
 * Vijfentwintig is de eerste, want daar is het nog een verrassing. Daarna
 * ongeveer een verdubbeling, en de laatste is alles wat er is.
 */
export const MIJLPALEN = [25, 50, 100, 200, 304] as const

/** Hoeveel woorden er echt vastzitten. */
export const woordenVast = (s: State = getState()): number =>
  Object.values(s.cards).filter((c) => c.strength >= 0.85).length

/** De hoogste mijlpaal die gehaald is, of 0. */
export function gehaaldeMijlpaal(s: State = getState()): number {
  const vast = woordenVast(s)
  let hoogste = 0
  for (const m of MIJLPALEN) if (vast >= m) hoogste = m
  return hoogste
}

/**
 * Of er een mijlpaal te vieren valt die nog niet getoond is.
 *
 * Eén kaart per mijlpaal. Wie hem wegklikt krijgt hem bij de volgende weer —
 * dat is geen zeuren maar een nieuw feit, en tussen 25 en 50 woorden zitten
 * weken.
 */
export const nieuweMijlpaal = (s: State = getState()): number => {
  const gehaald = gehaaldeMijlpaal(s)
  return gehaald > s.mijlpaalGedeeld ? gehaald : 0
}

/** Deze mijlpaal is afgehandeld, gedeeld of niet. */
export function onthoudMijlpaal(m: number): void {
  if (getState().mijlpaalGedeeld >= m) return
  setState({ mijlpaalGedeeld: m })
}

/**
 * Het adres dat WhatsApp opent met de tekst er al in.
 *
 * `wa.me` zonder nummer laat de verzender zelf kiezen naar wie — en dat is
 * precies de bedoeling: wij weten niet wie oma is en willen dat ook niet
 * weten.
 */
export const deelAdres = (tekst: string): string =>
  `https://wa.me/?text=${encodeURIComponent(tekst)}`

/** Naar WhatsApp, met de tekst erin. */
export function deelNaarWhatsApp(tekst: string): void {
  window.open(deelAdres(tekst), '_blank')
}

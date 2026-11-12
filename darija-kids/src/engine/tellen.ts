/**
 * De trechter, geteld in totalen en zonder iemand te volgen.
 *
 * Dit bestaat omdat er geen enkel antwoord was op de vraag waar mensen
 * afhaken. `growth-audit/03-conversion-audit.md` heeft er een tabel vol
 * **ONBEKEND** over, en die cijfers zijn niet met terugwerkende kracht op te
 * halen: een gebeurtenis die niet geteld is, is weg.
 *
 * ## Wat hier met opzet niet in zit
 *
 * Geen gebruikers-id, geen apparaat-id, geen sessie-id, geen advertentie-id,
 * geen ip dat bewaard wordt, geen naam, geen leeftijd, niets van het kind.
 * Wat de deur uit gaat is een naam uit de vaste lijst hieronder, de dag (niet
 * het tijdstip), de taal, het platform en het versienummer. De server telt op
 * en bewaart alleen het totaal.
 *
 * Dat betekent dat één analyse niet kan: een trechter per persoon volgen. We
 * zien dat er honderd keer een eerste les is afgerond en veertig keer het slot
 * is bereikt, maar niet of dat dezelfde mensen zijn. Dat is de prijs, en in
 * Apples Kinderen-categorie is die niet te omzeilen — analytics van derden
 * zijn daar verboden, en een eigen meting die wél herleidbaar is zou erger
 * zijn dan geen meting.
 *
 * ## Waarom `TELLEN` op onwaar staat
 *
 * Zie de constante hieronder. Kort: dit verandert wat de app over zichzelf
 * verklaart in twee winkels, en die verklaringen staan nu op "er wordt niets
 * verzameld".
 *
 * ## Wat de getallen wel en niet zijn
 *
 * Een ondergrens, en geen waarheid. Drie redenen, en ze horen bij elk cijfer
 * dat hieruit komt:
 *
 * - **Offline gaat verloren.** De app werkt zonder netwerk. Een gebeurtenis
 *   die niet verstuurd kan worden, is weg; er is geen wachtrij. Dat is een
 *   keuze: een wachtrij die bij de volgende start leegloopt, zet gebeurtenissen
 *   op de verkeerde dag, en een dag die klopt is hier meer waard dan een totaal
 *   dat klopt.
 * - **Het eindpunt is open.** De app kan geen geheim dragen — alles met een
 *   `VITE_`-voorvoegsel staat in de bundel, en `src/site/sleutels.test.ts`
 *   houdt die lijst kort. Wie het adres vindt, kan de tellers opblazen. De
 *   witte lijst op de server begrenst wát er geteld kan worden, niet hoe vaak.
 * - **Sommige tellers overdrijven van zichzelf.** `aanbod_zien` en
 *   `beoord_zien` tellen een getoonde kaart, niet een persoon: wie het scherm
 *   wegklikt en opnieuw opent, telt twee keer. Dat staat per teller in de
 *   lijst.
 *
 * Gebruik dus de verhoudingen tussen de stappen, en vergelijk weken met
 * weken. Niet de absolute aantallen; daarvoor zijn de winkelconsoles er.
 */
import { platform } from './platform'
import { TELLEN } from './telbesluit'
import { getState } from './store'

/*
 * `TELLEN` staat in `telbesluit.ts`, en niet hier.
 *
 * Omdat `i18n/privacy.ts` hem ook moet lezen: die schrijft de ene of de
 * andere alinea op grond van dezelfde regel, zodat de verklaring niet uit de
 * pas kan lopen met wat de app werkelijk doet. Een privacytekst die deze
 * module zou importeren, trekt `store.ts`, het curriculum en de woordenlijst
 * de website-bouw in voor één booleaan.
 *
 * Wat er moet gebeuren vóórdat die regel op `true` gaat, staat daar.
 */

/**
 * De tellers, compleet. Een naam die hier niet staat, bestaat niet.
 *
 * De server heeft dezelfde lijst — zie `server/src/index.ts` — want een open
 * eindpunt zonder witte lijst is een tabel die een vreemde kan volschrijven.
 */
export const TELLERS = [
  /** De app is geopend. Eén keer per dag per toestel; zie `vandaagAl`. */
  'start',
  /** Het welkomstscherm is doorlopen. */
  'welkom_af',
  /** Het eenmalige abonnementsaanbod is getoond. Telt kaarten, niet mensen. */
  'aanbod_zien',
  /** Er is op "later" gedrukt in dat aanbod. */
  'aanbod_later',
  /** Het slot is bereikt: de laatste gratis les is af. */
  'gratis_op',
  /** Het abonnementsscherm is geopend. Telt openingen, niet mensen. */
  'paywall_zien',
  /** Een aankoop is gestart bij de winkel. */
  'koop_start',
  /** De deelkaart is getoond. Zie de aantekening bij `deel_zien` onderaan. */
  'deel_zien',
  /** Het verzoek om een winkelbeoordeling is getoond. Telt kaarten. */
  'beoord_zien',
] as const

/**
 * Hoe diep iemand in het pad is gekomen, in treden.
 *
 * **Een aantal, niet een les.** Hier stond eerst `les_af:<lesid>`, en dat gaat
 * te ver: `privacy.ts` belooft dat de app niets van het oefenen naar een
 * server stuurt, en "hruf-3 is op 18 november afgerond" is iets van het
 * oefenen. Een trede zegt alleen hoe ver iemand kwam, en dat is precies wat de
 * trechter nodig heeft.
 *
 * Grof, en met een reden: de eerste vier treden zijn het gratis deel, en daar
 * zit de vraag. Daarna is elke trede een verdubbeling, want een curve met 74
 * punten op drie downloads per dag is 74 keer niets.
 */
export const TREDEN = [1, 2, 3, 4, 5, 10, 20, 40, 74] as const

export type Teller = (typeof TELLERS)[number] | `les_af:${(typeof TREDEN)[number]}`

/** Waar de worker antwoordt. Leeg betekent: er is geen server. */
const POST: string = (import.meta.env.VITE_POST as string | undefined) ?? ''

/**
 * Of er hier geteld hoort te worden.
 *
 * Drie wachten, en ze doen elk iets anders:
 *
 * - `TELLEN` is het besluit (zie boven).
 * - Een lege `VITE_POST` betekent dat er geen server achter deze bouw zit —
 *   dezelfde afspraak als in `post.ts`.
 * - `platform() === 'web'` sluit de website en de demobouw uit. Op
 *   darijaforkids.eu loopt dezelfde code, en een trechter die bezoekers van de
 *   verkooppagina bij de app-gebruikers optelt, meet iets anders dan hij zegt.
 *   `platform()` en niet `PREVIEWS`: die laatste staat in `npm run dev` ook aan.
 */
export const telMogelijk = (): boolean => TELLEN && POST !== '' && platform() !== 'web'

/**
 * Of deze naam vandaag al geteld is op dit toestel.
 *
 * Alleen `start` gebruikt dit. De app gaat op een tablet niet dicht, hij gaat
 * weg en komt terug; zonder deze rem zou één toestel op een avond tien keer
 * "start" sturen.
 *
 * In `localStorage` en niet in de staat uit `store.ts`: die heeft een schema
 * met migraties eromheen (`migraties.test.ts`), en een telrem is geen
 * voortgang. Komt de sleutel niet terug — privévenster, opslag geblokkeerd —
 * dan telt hij gewoon opnieuw. Een dubbeling is hier minder erg dan een
 * uitzondering die de app laat omvallen.
 */
const SLEUTEL = 'darija.tel.dag'

function vandaagAl(naam: string, dag: string): boolean {
  try {
    const rauw = localStorage.getItem(SLEUTEL)
    const al = rauw ? (JSON.parse(rauw) as Record<string, string>) : {}
    if (al[naam] === dag) return true
    localStorage.setItem(SLEUTEL, JSON.stringify({ ...al, [naam]: dag }))
    return false
  } catch {
    return false
  }
}

/** De dag, in de tijdzone van het toestel. Geen tijdstip. */
const vandaag = (): string => {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const g = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${g}`
}

/**
 * Telt één gebeurtenis. Doet niets als er iets niet klopt, en zegt dat niet.
 *
 * Een mislukking is stilte. Dat is dezelfde regel als bij `meldVoortgang` in
 * `post.ts` — *"this is not worth an error in front of a child"* — en bij een
 * teller geldt hij dubbel: er is niemand die iets aan de uitkomst heeft.
 *
 * `eensPerDag` is er alleen voor `start`.
 */
export async function tel(naam: Teller, eensPerDag = false): Promise<void> {
  if (!telMogelijk()) return
  const dag = vandaag()
  if (eensPerDag && vandaagAl(naam, dag)) return
  // Dezelfde goedkope poort als in post.ts: onwaar is een zekerheid dat er
  // geen netwerk is, en dan hoeft niemand op een time-out te wachten.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  try {
    await fetch(`${POST}/tel`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        t: naam,
        d: dag,
        l: getState().settings.lang,
        p: platform(),
        v: VERSIE,
      }),
    })
  } catch {
    // Weg. Zie de aantekening over de ondergrens bovenaan dit bestand.
  }
}

/**
 * Het versienummer van de app.
 *
 * Hardgecodeerd en niet uit `package.json` gelezen: dat bestand noemt `1.0.0`
 * en is nooit meeverhuisd met de winkelversies, terwijl `docs/versies.json`
 * de echte nummers bijhoudt. Eén getal dat met de hand meeverhuist is hier
 * eerlijker dan een getal dat automatisch verkeerd is.
 */
const VERSIE = '1.6'

/**
 * De trede die bij dit aantal afgeronde lessen hoort, of niets.
 *
 * Alleen op een exacte trede, niet op "de hoogste die gehaald is": anders
 * telt elke les na de vierde opnieuw als trede 4.
 */
export const tredeVan = (lessen: number): Teller | null =>
  (TREDEN as readonly number[]).includes(lessen) ? (`les_af:${lessen}` as Teller) : null

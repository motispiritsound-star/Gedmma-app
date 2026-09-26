/**
 * Who publishes this app.
 *
 * Two different rules meet in this one file. The GDPR wants a name and a way
 * to reach a human. The EU's Digital Services Act goes further: anyone selling
 * in an app store is a *trader*, and a trader's name, address, phone number,
 * e-mail and trade-register number have to be visible to the buyer. Apple and
 * Google both ask for those in the console and both show them on the listing,
 * so they may as well be true in the app too.
 *
 * None of it can be invented here. As long as the first two are empty the
 * privacy page and the terms page say so out loud, in a box that disappears
 * the moment they are filled in.
 */
export const OPERATOR = {
  /** The name the stores show as the seller. For a sole trader: your own. */
  name: 'Darijaforkids',
  /**
   * The legal entity behind that name, when they differ.
   *
   * A buyer who wants to complain should not have to guess who "Darijaforkids"
   * is; the trade register knows it as Venship, and the KvK number below is
   * that company's. Empty when the seller trades under its own name.
   */
  bedrijf: 'Venship',
  /**
   * On the domain, not on a mailbox somebody happens to own: a buyer reads the
   * address the app is sold under, and a shop whose contact address is at a
   * free provider looks like a shop that may not be there next year.
   */
  email: 'info@darijaforkids.eu',
  /**
   * Street, postcode and town. A PO box is not accepted as a trader address.
   *
   * Dit is het bezoekadres zoals het bij de KvK staat, en dat is per
   * 1 januari 2026 Bussum in plaats van Veenendaal. Het moet letterlijk
   * kloppen met de inschrijving: Apple en Google controleren het tegen
   * openbare registers en publiceren het op de winkelpagina.
   */
  address: 'Torenlaan 5 B, 1402 AT Bussum',
  country: 'Nederland',
  /**
   * Leeg, met opzet.
   *
   * Er stond een 06-nummer op de website, en een mobiel nummer naast een
   * bedrijfsnaam leest als een eenmanszaak die je op zijn fiets kunt bellen.
   * De mailbox op het eigen domein doet hetzelfde werk en ziet er uit als een
   * winkel die er volgend jaar ook nog is.
   *
   * Het veld blijft staan omdat de winkels het wél willen: Apple en Google
   * hebben het nummer in hun console voor de handelaarsverificatie van de
   * Digital Services Act, en dat is goedgekeurd op 24 september. Dat staat
   * los van wat de website toont.
   *
   * Vul je het ooit weer in, dan verschijnt het vanzelf overal waar het hoort
   * — op de website, in de app, in de handelaarstabel.
   */
  phone: '',
  /** KvK number in the Netherlands, or the equivalent trade-register number. */
  registration: '77780868',
  /** Only when you are registered for VAT — under the Dutch KOR, leave empty. */
  vat: 'NL003000506B28',
}

/** Enough to name a data controller and write to them. */
export const operatorKnown = (): boolean => Boolean(OPERATOR.name && OPERATOR.email)

/**
 * Enough to publish a paid app in the EU.
 *
 * Both stores refuse a subscription from a trader whose details are missing,
 * and both make the seller fill exactly these in before the listing goes live.
 */
/* Geen `phone` in deze lijst. Een telefoonnummer is bij verkoop op afstand
   verplicht *indien beschikbaar*; wie geen telefonische klantenservice voert,
   voldoet met een adres waarop snel en rechtstreeks gereageerd wordt. De
   winkels vragen het apart in hun eigen console, en daar staat het. */
export const traderKnown = (): boolean => Boolean(
  OPERATOR.name && OPERATOR.email && OPERATOR.address
  && OPERATOR.country && OPERATOR.registration,
)

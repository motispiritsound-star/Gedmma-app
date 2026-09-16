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
  name: '',
  email: '',
  /** Street, postcode and town. A PO box is not accepted as a trader address. */
  address: '',
  country: '',
  /** A phone number that is answered. A mobile is fine. */
  phone: '',
  /** KvK number in the Netherlands, or the equivalent trade-register number. */
  registration: '',
  /** Only when you are registered for VAT — under the Dutch KOR, leave empty. */
  vat: '',
}

/** Enough to name a data controller and write to them. */
export const operatorKnown = (): boolean => Boolean(OPERATOR.name && OPERATOR.email)

/**
 * Enough to publish a paid app in the EU.
 *
 * Both stores refuse a subscription from a trader whose details are missing,
 * and both make the seller fill exactly these in before the listing goes live.
 */
export const traderKnown = (): boolean => Boolean(
  OPERATOR.name && OPERATOR.email && OPERATOR.address
  && OPERATOR.country && OPERATOR.phone && OPERATOR.registration,
)

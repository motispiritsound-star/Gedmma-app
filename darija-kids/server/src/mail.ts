/**
 * The one file that knows which company delivers the mail.
 *
 * It is one file on purpose: swapping Brevo for MailerLite, Postmark or your
 * own SMTP is this file and nothing else. Brevo is the default because it is
 * French, so the addresses stay inside the EU and the processing agreement is
 * one you can actually sign as a European publisher.
 *
 * The key never leaves the server. An app that could send mail on its own
 * would be an app with a mail key inside it, and every copy in every store
 * would carry it.
 */

export interface Bericht {
  aan: string
  onderwerp: string
  html: string
  tekst: string
  /**
   * Where "unsubscribe" in the mail client itself should point.
   *
   * Empty for a mail that is not a mailing: a purchase confirmation, a login
   * link. Those get no unsubscribe header at all — see below for why an empty
   * one is worse than none.
   */
  afmeldUrl: string
}

export interface Afzender {
  naam: string
  email: string
}

/** Brevo's own endpoint, unless something is put in front of it. */
export const BREVO = 'https://api.brevo.com/v3/smtp/email'

/**
 * Hoe lang we op Brevo wachten voordat we het opgeven.
 *
 * Hier stond niets, en dat is een ander soort gat dan een fout. `naDeVerkoop()`
 * vangt een omgevallen mail op en laat de koop staan — met opzet, want de koper
 * heeft betaald en dat mag niet verdampen omdat de post het even niet doet.
 * Maar een verbinding die blijft hangen gooit niets. Hij wacht. Dus vangt
 * `naDeVerkoop()` hem niet, staat er niets in het logboek, en wacht de
 * Gumroad-ping mee tot Gumroad het opgeeft en het nog eens probeert.
 *
 * En bij deze producten ís die mail de levering: er gaat geen PDF de deur uit,
 * de koper krijgt een sleutel. Een levering die mislukt zonder iets te melden
 * is de ergste soort — dan weet je pas dat het mis is als de koper mailt.
 *
 * Tien seconden is ruim voor een API die normaal in een halve seconde
 * antwoordt, en kort genoeg om binnen de ping te blijven.
 */
export const TIJDSLIMIET = 10_000

export async function verstuur(
  bericht: Bericht,
  afzender: Afzender,
  sleutel: string,
  /** Point this at a sink while developing, so nothing real gets sent. */
  endpoint: string | undefined = BREVO,
): Promise<void> {
  const antwoord = await fetch(endpoint ?? BREVO, {
    method: 'POST',
    signal: AbortSignal.timeout(TIJDSLIMIET),
    headers: { 'api-key': sleutel, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: afzender.naam, email: afzender.email },
      to: [{ email: bericht.aan }],
      subject: bericht.onderwerp,
      htmlContent: bericht.html,
      textContent: bericht.tekst,
      // Both of these are what makes Gmail and Apple Mail show their own
      // one-tap unsubscribe, and what keeps a complaint from becoming a spam
      // report.
      //
      // Maar alleen als er iets is om naartoe te wijzen. Zonder adres stond
      // er letterlijk `List-Unsubscribe: <>` in de kop, en dat is geen lege
      // regel maar een kapotte: precies het soort dat een filter meeweegt.
      // Het overkwam uitgerekend de koopmail — de enige mail die écht moet
      // aankomen, want daar zit de sleutel in.
      //
      // En eronder: `One-Click` is een belofte dat een POST naar dat adres de
      // afmelding regelt. Wijst het naar een gewone pagina, dan meldt de
      // mailclient "uitgeschreven" en gebeurt er niets. Dan liever niets
      // beloven; in de mail zelf staan de links gewoon.
      ...(bericht.afmeldUrl
        ? {
          headers: {
            'List-Unsubscribe': `<${bericht.afmeldUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }
        : {}),
    }),
  }).catch((fout: unknown) => {
    // Een afgebroken verbinding heet bij de een `TimeoutError` en bij de ander
    // `AbortError`, en de melding erbij zegt niets over post. Maak er één regel
    // van die in het logboek te begrijpen is: daar leest straks iemand mee die
    // wil weten waarom een koper zijn sleutel niet kreeg.
    const naam = fout instanceof Error ? fout.name : ''
    if (naam === 'TimeoutError' || naam === 'AbortError') {
      throw new Error(`mail: geen antwoord van de postdienst binnen ${TIJDSLIMIET / 1000} seconden`)
    }
    throw fout
  })
  if (!antwoord.ok) {
    throw new Error(`mail ${antwoord.status}: ${(await antwoord.text()).slice(0, 200)}`)
  }
}

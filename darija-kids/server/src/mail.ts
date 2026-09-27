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

export async function verstuur(
  bericht: Bericht,
  afzender: Afzender,
  sleutel: string,
  /** Point this at a sink while developing, so nothing real gets sent. */
  endpoint: string | undefined = BREVO,
): Promise<void> {
  const antwoord = await fetch(endpoint ?? BREVO, {
    method: 'POST',
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
  })
  if (!antwoord.ok) {
    throw new Error(`mail ${antwoord.status}: ${(await antwoord.text()).slice(0, 200)}`)
  }
}

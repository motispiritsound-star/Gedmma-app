import { getState, setState } from './store'

/**
 * The one place this app talks to a server of our own.
 *
 * It exists because a parent asked to hear from us — about a new unit, an
 * offer, or how the week went. Nothing here runs unless they filled in the
 * form behind the parental gate, and nothing here is about the child: what
 * goes over the wire is a grown-up's address and, at most, five counts.
 *
 * Two things this deliberately cannot do:
 *
 * - It cannot find out who bought the app. Apple and Google do not hand over a
 *   buyer's e-mail address, to anybody. An address only exists here because
 *   somebody typed it.
 * - It cannot send anything on its own. `VITE_POST` is empty in a build with
 *   no server behind it, and then the form is not even shown.
 */

/** Where the worker in `server/` answers. Empty means: there is no server. */
const POST: string = (import.meta.env.VITE_POST as string | undefined) ?? ''

export const postMogelijk = (): boolean => POST !== ''

export type Aanmelding = 'geen' | 'wacht' | 'bevestigd' | 'mis'

/**
 * Wat er uit een aanmeldpoging komt — iets meer dan wat er bewaard wordt.
 *
 * `mis` en `offline` zijn allebei "het is niet gelukt", en toch moet het
 * scherm iets anders zeggen. Bij geen verbinding helpt het om te wachten en
 * nog eens te proberen; bij een fout aan onze kant helpt dat juist niet, en
 * dan is het eerlijker om te zeggen dat het aan ons ligt.
 *
 * Eén melding voor allebei leidde tot het verkeerde advies in het ene geval en
 * tot onnodige schuld bij de lezer in het andere.
 */
export type Uitkomst = Aanmelding | 'offline'

export interface Keuze {
  /** News, new units, the occasional offer. */
  nieuws: boolean
  /** The weekly note about how the learning is going. */
  voortgang: boolean
}

/**
 * Signs an address up, and gets back whether it still has to be confirmed.
 *
 * The address itself is kept on the device only so the screen can say which
 * one it was; the id is what the weekly numbers are sent under.
 */
export async function aanmelden(email: string, keuze: Keuze): Promise<Uitkomst> {
  if (!postMogelijk()) return 'mis'
  const s = getState()
  /*
   * Eerst de goedkope vraag. `navigator.onLine` is onwaar alleen als het
   * toestel wéét dat het nergens bij kan — vliegtuigstand, wifi uit. Waar is
   * geen garantie dat er internet is, maar onwaar is wel een zekerheid dat er
   * geen is, en dan hoeft de lezer geen vijf seconden op een time-out te
   * wachten voor een antwoord dat we al hebben.
   */
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline'
  try {
    const antwoord = await fetch(`${POST}/aanmelden`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), taal: s.settings.lang, ...keuze }),
    })
    const body = await antwoord.json() as { ok?: boolean; status?: string; id?: string }
    if (!antwoord.ok || !body.ok || !body.id) return 'mis'
    const status: Aanmelding = body.status === 'bevestigd' ? 'bevestigd' : 'wacht'
    setState({ post: { id: body.id, email: email.trim(), status, ...keuze } })
    return status
  } catch {
    /*
     * `fetch` gooit alleen als het verzoek de deur niet uit kwam: geen
     * verbinding, dns stuk, de server onbereikbaar. Een antwoord met een
     * foutcode komt hierboven langs en is dus wél `mis`. Dat onderscheid is
     * precies het verschil tussen "probeer het zo nog eens" en "het ligt aan
     * ons".
     */
    return 'offline'
  }
}

/**
 * Five counts, sent at most once a day.
 *
 * Only when the weekly note was asked for, and only ever counts — no words, no
 * answers, nothing that says how a particular child did on a particular
 * morning. A failure is silence: this is not worth an error in front of a
 * child.
 */
export async function meldVoortgang(): Promise<void> {
  if (!postMogelijk()) return
  const s = getState()
  const post = s.post
  // Before the address is confirmed the server refuses these anyway.
  if (!post?.id || !post.voortgang || post.status !== 'bevestigd') return
  const dag = 24 * 3600 * 1000
  if (post.gemeld && Date.now() - post.gemeld < dag) return

  const woorden = Object.keys(s.cards).length
  const units = new Set(
    Object.keys(s.lessons).filter((id) => id.endsWith('-toets')).map((id) => id.split('-')[0]),
  ).size

  try {
    await fetch(`${POST}/voortgang`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        id: post.id,
        units,
        lessen: Object.keys(s.lessons).length,
        woorden,
        reeks: s.bestStreak,
        xp: s.xp,
      }),
    })
    setState({ post: { ...post, gemeld: Date.now() } })
  } catch {
    // Next time the app opens.
  }
}

/** Forgets the sign-up on this device. The list itself is left by mail. */
export function vergeetAanmelding(): void {
  setState({ post: null })
}

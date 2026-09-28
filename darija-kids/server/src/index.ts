/**
 * The only server Darijaforkids has.
 *
 * It exists for one thing: a grown-up who wants to hear from us. It holds an
 * e-mail address, what that address agreed to, and — if they asked for the
 * weekly note — five numbers about how the learning is going. No name, no
 * answers, no device id, nothing that says which child.
 *
 * Three rules it is built around, and none of them are optional:
 *
 * 1. Nothing here may be filled in by a child. The app only shows the form
 *    behind the parental gate, and this end says so in the mail too.
 * 2. An address is not on the list until it has been clicked from the inbox.
 *    Anyone can type anyone's address into a form; a confirmation is what
 *    turns that into consent.
 * 3. Every mail carries a way out and a way to be forgotten, and both work
 *    without logging in — because an account would be a second thing to
 *    protect.
 */
import { bestellingVan, hashVan, maakSleutel, plekken, tekAan } from './lezer'
import {
  bezit, koekje, lidVanEmail, logUit, maakLink, magMailen, magOpnieuw, netjes as netjesEmail, ruimOp, schrijfIn, sessieUit, telMail, vergeetLink, welkAdres, wieIsDit, wisLid, wisselIn, zetNieuws,
} from './portaal'
import { geheimKlopt, koopbericht, veldenVan } from './koopbericht'
import { PostOnzeker, verstuur, type Afzender } from './mail'
import { MAILS, TEKST_VERSIE, isTaal, type Taal, type Week } from './mails'
import { briefHtml, briefTekst, pagina, vraagPagina } from './sjabloon'

export interface Env {
  DB: D1Database
  /** The mail provider's key. `wrangler secret put MAIL_SLEUTEL`. */
  MAIL_SLEUTEL: string
  /** Where this worker itself answers, e.g. https://post.darijaforkids.eu */
  BASIS: string
  AFZENDER_NAAM: string
  AFZENDER_EMAIL: string
  /** Salt for the hashed IP. `wrangler secret put ZOUT`. */
  ZOUT: string
  /** Only set while developing, to send the mail somewhere harmless. */
  MAIL_URL?: string
  /** The book pages. One object per page: `<reeks>/<deel>/<taal>/<nr>.webp`. */
  BOEKEN?: R2Bucket
  /** Shared with the payment partner, so only they can report a sale. */
  KOOP_GEHEIM?: string
  /** Where the reader lives, e.g. https://darijaforkids.eu/lezen */
  LEZER?: string
  /** De website zelf, e.g. https://darijaforkids.eu. Het portaal woont daar. */
  SITE?: string
}

/* ------------------------------------------------------------------ helpers */

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } })

/**
 * The app runs from a webview, not from a page on our own domain, so its
 * origin is `capacitor://localhost` or `http://localhost` depending on the
 * platform. There is nothing secret behind this worker and no cookie to
 * protect, so the list of allowed origins is the open one.
 */
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
}

const nu = (): number => Math.floor(Date.now() / 1000)

const sleutelBytes = (n: number): string => {
  const b = new Uint8Array(n)
  crypto.getRandomValues(b)
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/**
 * The address, as one shape.
 *
 * Two people writing "Naam@Example.COM " and "naam@example.com" are one person,
 * and a trailing space is the commonest way a list grows a duplicate.
 */
const netjes = (email: string): string => email.trim().toLowerCase()

/** Good enough to catch a typo; the confirmation mail is the real check. */
/**
 * Wanneer er werkelijk een mail de deur uit gaat.
 *
 * Twee regels, apart gezet omdat ze het verschil maken tussen een portaal en
 * een spuit waarmee een vreemde post kan versturen onder onze naam. Wie ze
 * leest ziet de hele afweging; wie ze in een `if` verstopt, ziet hem niet.
 *
 * `magPost` telt per plek en per uur. De andere twee tellen per adres, en die
 * zijn alleen geen rem: elke keer een ander adres invullen is elke keer een
 * nieuw lid, en dan mag het meteen weer.
 */
export const mailBijAanmelding = (
  o: { magPost: boolean; bevestigd: boolean; teSnel: boolean },
): boolean => o.magPost && !o.bevestigd && !o.teSnel

export const mailBijInloggen = (
  o: { magPost: boolean; magOpnieuw: boolean },
): boolean => o.magPost && o.magOpnieuw

const lijktEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email) && email.length <= 254

/** A hashed IP is proof of consent without keeping anybody's address. */
async function ipHash(verzoek: Request, zout: string): Promise<string> {
  const ip = verzoek.headers.get('cf-connecting-ip') ?? ''
  const data = new TextEncoder().encode(`${zout}:${ip}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].slice(0, 8).map((x) => x.toString(16).padStart(2, '0')).join('')
}

const afzenderVan = (env: Env): Afzender => ({ naam: env.AFZENDER_NAAM, email: env.AFZENDER_EMAIL })

interface Rij {
  id: string
  email: string
  taal: string
  nieuws: number
  voortgang: number
  status: string
  token: string
}

const taalVan = (rij: { taal: string }): Taal => (isTaal(rij.taal) ? rij.taal : 'en')

/** The two links every mail ends with. */
const uitwegen = (env: Env, token: string) => ({
  afmeldUrl: `${env.BASIS}/uitschrijven?t=${token}`,
  wisUrl: `${env.BASIS}/wissen?t=${token}`,
})

/* -------------------------------------------------------------- the letters */

async function stuurBevestiging(env: Env, rij: Rij): Promise<void> {
  const taal = taalVan(rij)
  const m = MAILS[taal]
  const brief = {
    kop: m.bevestigKop,
    body: m.bevestigBody,
    knop: { tekst: m.bevestigKnop, url: `${env.BASIS}/bevestig?t=${rij.token}` },
    staart: m.bevestigStaart,
    afmeldTekst: m.afmelden,
    wisTekst: m.wissen,
    voet: m.voet,
    ...uitwegen(env, rij.token),
  }
  await verstuur(
    { aan: rij.email, onderwerp: m.bevestigOnderwerp, html: briefHtml(brief), tekst: briefTekst(brief), afmeldUrl: brief.afmeldUrl },
    afzenderVan(env), env.MAIL_SLEUTEL, env.MAIL_URL,
  )
}

async function stuurWelkom(env: Env, rij: Rij): Promise<void> {
  const m = MAILS[taalVan(rij)]
  const brief = {
    kop: m.welkomKop,
    body: m.welkomBody,
    afmeldTekst: m.afmelden,
    wisTekst: m.wissen,
    voet: m.voet,
    ...uitwegen(env, rij.token),
  }
  await verstuur(
    { aan: rij.email, onderwerp: m.welkomOnderwerp, html: briefHtml(brief), tekst: briefTekst(brief), afmeldUrl: brief.afmeldUrl },
    afzenderVan(env), env.MAIL_SLEUTEL, env.MAIL_URL,
  )
}

async function stuurWeek(env: Env, rij: Rij, week: Week): Promise<void> {
  const m = MAILS[taalVan(rij)]
  const brief = {
    kop: m.weekKop(week),
    body: m.weekWoord(week),
    regels: m.weekRegels(week),
    afmeldTekst: m.afmelden,
    wisTekst: m.wissen,
    voet: m.voet,
    ...uitwegen(env, rij.token),
  }
  await verstuur(
    { aan: rij.email, onderwerp: m.weekOnderwerp(week), html: briefHtml(brief), tekst: briefTekst(brief), afmeldUrl: brief.afmeldUrl },
    afzenderVan(env), env.MAIL_SLEUTEL, env.MAIL_URL,
  )
}

/* --------------------------------------------------------------- the routes */

async function aanmelden(verzoek: Request, env: Env): Promise<Response> {
  const body = await verzoek.json().catch(() => null) as
    { email?: string; taal?: string; nieuws?: boolean; voortgang?: boolean } | null
  if (!body) return json({ fout: 'geen-body' }, 400)

  const email = netjes(String(body.email ?? ''))
  if (!lijktEmail(email)) return json({ fout: 'geen-adres' }, 400)
  const taal: Taal = isTaal(body.taal) ? body.taal : 'en'
  const nieuws = body.nieuws ? 1 : 0
  const voortgang = body.voortgang ? 1 : 0
  // Neither box ticked is not a subscription, it is a form somebody scrolled past.
  if (!nieuws && !voortgang) return json({ fout: 'geen-keuze' }, 400)

  /**
   * De rem, vóór beide paden.
   *
   * Dit verstuurt een mail naar elk adres dat iemand invult, en dat is precies
   * wat een vreemde nodig heeft om post te versturen onder onze naam. De rem
   * per rij hieronder (`teSnel`, zestig seconden) is daar geen rem tegen: maak
   * honderd rijen aan en loop ze om beurten langs.
   *
   * Dus telt deze plek, niet dit adres. Hij wordt hier één keer berekend en
   * beide paden gebruiken hem.
   */
  const plek = await ipHash(verzoek, env.ZOUT)
  const magPost = await magMailen(env.DB, plek)

  const bestaand = await env.DB
    .prepare('SELECT id, email, taal, nieuws, voortgang, status, token, aangemeld_op FROM aanmelding WHERE email = ?')
    .bind(email).first<Rij & { aangemeld_op: number }>()

  if (bestaand) {
    // Somebody who is already on the list and asks again gets their choices
    // updated, not a duplicate row — and, if they never confirmed, one more
    // chance to. A minute apart, so a double tap is not two mails.
    const teSnel = nu() - bestaand.aangemeld_op < 60
    await env.DB
      .prepare('UPDATE aanmelding SET taal = ?, nieuws = ?, voortgang = ?, tekst_versie = ?, aangemeld_op = ? WHERE id = ?')
      .bind(taal, nieuws, voortgang, TEKST_VERSIE, nu(), bestaand.id).run()
    if (mailBijAanmelding({ magPost, bevestigd: bestaand.status === 'bevestigd', teSnel })) {
      await stuurBevestiging(env, { ...bestaand, taal })
      await telMail(env.DB, plek)
    }
    return json({ ok: true, status: bestaand.status === 'bevestigd' ? 'bevestigd' : 'wacht', id: bestaand.id })
  }

  const rij: Rij = { id: sleutelBytes(12), email, taal, nieuws, voortgang, status: 'wacht', token: sleutelBytes(24) }
  await env.DB.prepare(
    `INSERT INTO aanmelding (id, email, taal, nieuws, voortgang, status, token, aangemeld_op, ip_hash, tekst_versie)
     VALUES (?, ?, ?, ?, ?, 'wacht', ?, ?, ?, ?)`,
  ).bind(rij.id, email, taal, nieuws, voortgang, rij.token, nu(), plek, TEKST_VERSIE).run()

  // Hetzelfde antwoord als bij een geslaagde aanmelding: wie hier tegenaan
  // loopt hoeft niet te weten waarom, en een echte bezoeker merkt het niet.
  if (!magPost) return json({ ok: true, status: 'wacht', id: rij.id })

  try {
    await stuurBevestiging(env, rij)
    await telMail(env.DB, plek)
  } catch (e) {
    // The row without its mail is the worst of both: the caller is told it
    // failed, and a second try would find the address already taken and stay
    // quiet. So take it back out and let them try again for real.
    await env.DB.prepare('DELETE FROM aanmelding WHERE id = ?').bind(rij.id).run()
    throw e
  }
  return json({ ok: true, status: 'wacht', id: rij.id })
}

async function bevestig(url: URL, env: Env, doen: boolean): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const rij = await env.DB
    .prepare('SELECT id, email, taal, nieuws, voortgang, status, token FROM aanmelding WHERE token = ?')
    .bind(token).first<Rij>()
  if (!rij) return pagina('en', 'Deze link werkt niet meer', 'Meld je opnieuw aan in de app onder "Voor ouders".', env.SITE, MAILS.en.terug)

  const m = MAILS[taalVan(rij)]
  if (rij.status === 'bevestigd') return pagina(rij.taal, m.welkomKop, m.welkomBody, env.SITE, m.terug)

  // Een tik in de mail komt hier binnen als GET, en die laat alleen de vraag
  // zien. Toestemming die een linkscanner kan geven, is geen toestemming.
  if (!doen) {
    return vraagPagina(rij.taal, m.vraagBevestigKop, m.vraagBevestigBody, m.bevestigKnop,
      `/bevestig?t=${encodeURIComponent(token)}`)
  }

  await env.DB.prepare("UPDATE aanmelding SET status = 'bevestigd', bevestigd_op = ? WHERE id = ?")
    .bind(nu(), rij.id).run()
  // The click is the consent. A welcome mail that will not send is a bad
  // afternoon at the mail provider, not a reason to throw the yes away.
  try {
    await stuurWelkom(env, rij)
  } catch (e) {
    console.error('welkom', rij.id, e instanceof Error ? e.message : e)
  }
  return pagina(rij.taal, m.welkomKop, m.welkomBody, env.SITE, m.terug)
}

async function uitschrijven(url: URL, env: Env, doen: boolean): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const rij = await env.DB
    .prepare('SELECT id, email, taal, nieuws, voortgang, status, token FROM aanmelding WHERE token = ?')
    .bind(token).first<Rij>()
  // A link that no longer matches anything has already done its job.
  if (!rij) return pagina('en', MAILS.en.afgemeldKop, MAILS.en.afgemeldBody, env.SITE, MAILS.en.terug)

  // De POST is hier ook de weg van de afmeldknop in de mailclient zelf: die
  // belooft `List-Unsubscribe-Post` en doet een POST. Die schrijft dus meteen
  // uit, zoals beloofd. Een mens die op de link tikt, krijgt eerst de vraag.
  const m2 = MAILS[taalVan(rij)]
  if (!doen) {
    return vraagPagina(rij.taal, m2.vraagAfmeldKop, m2.vraagAfmeldBody, m2.afmelden,
      `/uitschrijven?t=${encodeURIComponent(token)}`)
  }

  await env.DB.prepare(
    "UPDATE aanmelding SET status = 'uitgeschreven', nieuws = 0, voortgang = 0, uitgeschreven_op = ? WHERE id = ?",
  ).bind(nu(), rij.id).run()
  await env.DB.prepare('DELETE FROM voortgang WHERE id = ?').bind(rij.id).run()
  const m = MAILS[taalVan(rij)]
  return pagina(rij.taal, m.afgemeldKop, m.afgemeldBody, env.SITE, m.terug)
}

/**
 * Forgetting somebody, for real.
 *
 * "Unsubscribe" leaves a row behind that says we may not write; this removes
 * the address itself. Both exist because they are different asks, and the
 * GDPR gives a right to the second one.
 */
async function wissen(url: URL, env: Env, doen: boolean): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const rij = await env.DB.prepare('SELECT id, taal FROM aanmelding WHERE token = ?').bind(token).first<{ id: string; taal: string }>()
  if (!rij) return pagina('en', MAILS.en.gewistKop, MAILS.en.gewistBody, env.SITE, MAILS.en.terug)

  // Van de drie is dit de enige die niet terug te draaien is, en dus de enige
  // waar een vooruit opgehaalde link echt iets kost.
  if (!doen) {
    const mw = MAILS[taalVan(rij)]
    return vraagPagina(rij.taal, mw.vraagWisKop, mw.vraagWisBody, mw.wissen,
      `/wissen?t=${encodeURIComponent(token)}`)
  }

  await env.DB.prepare('DELETE FROM voortgang WHERE id = ?').bind(rij.id).run()
  await env.DB.prepare('DELETE FROM aanmelding WHERE id = ?').bind(rij.id).run()
  const m = MAILS[taalVan(rij)]
  return pagina(rij.taal, m.gewistKop, m.gewistBody, env.SITE, m.terug)
}

/**
 * Five numbers, sent by the app when it opens, and only when the weekly note
 * was asked for. Counts and nothing else: no words, no answers, no dates of
 * birth, nothing that would be worth stealing.
 */
async function voortgang(verzoek: Request, env: Env): Promise<Response> {
  const body = await verzoek.json().catch(() => null) as
    { id?: string; units?: number; lessen?: number; woorden?: number; reeks?: number; xp?: number } | null
  if (!body?.id) return json({ fout: 'geen-id' }, 400)

  const rij = await env.DB.prepare("SELECT id, voortgang, status FROM aanmelding WHERE id = ?")
    .bind(body.id).first<{ id: string; voortgang: number; status: string }>()
  if (!rij || rij.status !== 'bevestigd' || !rij.voortgang) return json({ ok: false })

  const getal = (v: unknown): number => Math.max(0, Math.min(1_000_000, Math.floor(Number(v) || 0)))
  await env.DB.prepare(
    `INSERT INTO voortgang (id, bijgewerkt, units, lessen, woorden, reeks, xp)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       bijgewerkt = excluded.bijgewerkt, units = excluded.units, lessen = excluded.lessen,
       woorden = excluded.woorden, reeks = excluded.reeks, xp = excluded.xp`,
  ).bind(rij.id, nu(), getal(body.units), getal(body.lessen), getal(body.woorden), getal(body.reeks), getal(body.xp)).run()
  return json({ ok: true })
}

/* ------------------------------------------------------------ the weekly run */

/**
 * One note a week, to the people who asked for one.
 *
 * It only goes to somebody whose app has actually reported in — a row with no
 * snapshot is a parent whose child has not opened the app since signing up,
 * and a mail full of zeroes would be a strange way to say hello.
 */
async function weekloop(env: Env): Promise<void> {
  // Meteen even opruimen: verlopen sessies en gebruikte inloglinks doen niets
  // meer dan ruimte innemen, en er is toch al een keer per week iets te doen.
  try {
    const weg = await ruimOp(env.DB)
    if (weg) console.log(`opgeruimd: ${weg} verlopen sessies`)
  } catch (e) {
    console.error('opruimen', e instanceof Error ? e.message : e)
  }

  const grens = nu() - 6 * 24 * 3600
  const { results } = await env.DB.prepare(
    `SELECT a.id, a.email, a.taal, a.nieuws, a.voortgang, a.status, a.token,
            v.units, v.lessen, v.woorden, v.reeks, v.xp, v.vorige_xp
     FROM aanmelding a JOIN voortgang v ON v.id = a.id
     WHERE a.status = 'bevestigd' AND a.voortgang = 1
       AND (a.laatste_mail IS NULL OR a.laatste_mail < ?)
     LIMIT 200`,
  ).bind(grens).all<Rij & Omit<Week, 'erbij'> & { vorige_xp: number }>()

  for (const r of results ?? []) {
    const week: Week = {
      units: r.units, lessen: r.lessen, woorden: r.woorden, reeks: r.reeks, xp: r.xp,
      erbij: Math.max(0, r.xp - r.vorige_xp),
    }
    try {
      await stuurWeek(env, r, week)
      await env.DB.batch([
        env.DB.prepare('UPDATE aanmelding SET laatste_mail = ? WHERE id = ?').bind(nu(), r.id),
        env.DB.prepare('UPDATE voortgang SET vorige_xp = ? WHERE id = ?').bind(r.xp, r.id),
      ])
    } catch (e) {
      // One bad address must not hold up the other hundred and ninety-nine.
      console.error('week', r.id, e instanceof Error ? e.message : e)
    }
  }
}


/* ---------------------------------------------------------------- the reader */

/**
 * Wat er in de mail komt te staan als iemand een reeks heeft gekocht.
 *
 * Eén link, geen wachtwoord, en de zin die het meeste doet: dat zijn naam op
 * elke bladzijde staat. Wie dat weet, stuurt het niet door — en dat werkt
 * beter dan welk slot ook.
 */
/**
 * De mail die een koper krijgt, in zijn eigen taal.
 *
 * De taal komt uit `koopbericht`, dat hem uit het land van de koper raadt.
 * Dat gebeurde al en werd al opgeslagen — alleen deze mail deed er niets mee
 * en was altijd Nederlands. Een Franse koper betaalde € 34,99 en kreeg een
 * Nederlandse mail met een Nederlandse boektitel, terwijl hij Franse boeken
 * had gekocht.
 *
 * De reekstitels staan daarom ook in `MAILS`: "The Keys of Morocco" is de
 * titel op het boek dat hij net heeft gekregen, en "De sleutels van Marokko"
 * staat nergens in zijn zip.
 */
export const koopMail = (
  env: Pick<Env, 'SITE' | 'LEZER'>, sleutel: string, reeksen: string[], taal: Taal,
): { onderwerp: string; kop: string; body: string; knop: { tekst: string; url: string }; staart: string } => {
  const m = MAILS[taal]
  /**
   * De knop wijst naar de leeskamer in de taal van de koper.
   *
   * Hij wees naar `env.LEZER`, en dat is één vast adres: `/lezen`, het
   * Nederlandse. De mail was wél vertaald, dus een Franse koper betaalde,
   * kreeg een Franse mail, en kwam uit op een Nederlandse bladzijde.
   *
   * `LEZER` blijft bestaan voor wie hem gezet heeft, maar alleen als er geen
   * SITE is — de paden per taal staan bij de vertaling, in `mails.ts`.
   */
  const basis = (env.SITE ?? '').replace(/\/+$/, '')
  const lezer = basis
    ? `${basis}${m.leesPad}#${sleutel}`
    : `${env.LEZER ?? 'https://darijaforkids.eu/lezen'}#${sleutel}`
  const portaal = `${basis || 'https://darijaforkids.eu'}${m.portaalPad}`
  const titels = [
    reeksen.includes('sba') ? m.reeks.sba : null,
    reeksen.includes('sleutels') ? m.reeks.sleutels : null,
  ].filter((t): t is string => t !== null)
  const meer = titels.length > 1
  const wat = titels.join(` ${m.koopEn} `)
  return {
    onderwerp: m.koopOnderwerp(wat),
    kop: m.koopKop,
    body: m.koopBody(wat, meer, portaal),
    knop: { tekst: m.koopKnop, url: lezer },
    staart: m.koopStaart,
  }
}

/**
 * De betaalpartner meldt een verkoop.
 *
 * Er komt een gedeeld geheim mee. Zonder dat kan iedereen die het adres kent
 * zichzelf een sleutel toesturen, en dan hebben we een winkel waar je niet
 * hoeft te betalen.
 *
 * Het geheim mag in een kop staan, maar hoeft niet. Gumroad heeft namelijk
 * één invulveld voor een adres en verder niets — geen koppen, geen
 * handtekening. Dus wordt `?s=<geheim>` achter het adres ook aangenomen. Dat
 * betekent wel dat het geheim in logboeken terechtkomt, en daarom hoort het
 * nergens anders voor te dienen dan hiervoor: wie het heeft, kan zichzelf een
 * boek sturen, en verder niets.
 */
/**
 * Wat er met een melding van de betaalpartner moet gebeuren.
 *
 * Drie van deze vier gevallen deden vóór vandaag hetzelfde: een nieuwe
 * bestelling met een nieuwe sleutel, en een mail eromheen.
 *
 * - Een **terugbetaling** werd gelezen als een verkoop. De koper kreeg zijn
 *   geld terug én een tweede sleutel erbij.
 * - **Dezelfde melding twee keer** — en dat gebeurt, want de betaalpartner
 *   probeert het opnieuw zodra wij geen 200 teruggeven — maakte elke keer een
 *   bestelling. Eén verkoop hoort één bestelling te zijn.
 * - Een terugbetaling **zonder bestelnummer** valt niet thuis te brengen.
 *   Gokken is hier het verkeerde antwoord: dan haal je de boeken weg bij
 *   iemand die netjes betaald heeft. Liever niets doen en het melden.
 *
 * Het staat los van de database zodat de vier gevallen een tafel kunnen zijn
 * in plaats van een verhaal.
 */
export const koopStap = (o: { terugbetaald: boolean; bestelnummer?: string; alBekend: boolean }):
  'intrekken' | 'zonder-nummer' | 'al-bekend' | 'nieuw' => {
  if (o.terugbetaald) return o.bestelnummer ? 'intrekken' : 'zonder-nummer'
  return o.alBekend ? 'al-bekend' : 'nieuw'
}

/**
 * Alles wat ná de verkoop nog moet, en waarvan niets de verkoop mag omgooien.
 *
 * Zodra de bestelling in de database staat, is de koop rond. Wat daarna komt
 * — de koper lid maken, de mail met de sleutel — zijn losse stappen, en een
 * stap die omvalt hoort de andere niet mee te nemen.
 *
 * Dat ging hier mis op een manier die niemand zou zien. `schrijfIn` stond
 * zonder vangnet tussen de bestelling en de mail. Viel die om, dan gaf het
 * verzoek een 500, probeerde de betaalpartner het opnieuw, zag de rem dat
 * deze bestelling al bestond, en antwoordde netjes met "al bekend" — waarna
 * de mail met de sleutel nooit meer werd verstuurd. Betaald, besteld,
 * geregistreerd, en geen sleutel; en in het logboek niets bijzonders.
 *
 * De volgorde is daarom ook de volgorde van belang: het lidmaatschap is een
 * gemak, de sleutel is het product.
 */
export async function naDeVerkoop(
  stappen: { naam: string; doe: () => Promise<unknown> }[],
): Promise<{ naam: string; waarom: string }[]> {
  const mislukt: { naam: string; waarom: string }[] = []
  for (const stap of stappen) {
    try {
      await stap.doe()
    } catch (fout) {
      /**
       * De reden gaat mee terug, niet alleen de naam.
       *
       * "viel om: mail" zegt dát er iets misging en niet wát. Dat kostte een
       * avond met een tweede venster open om in het logboek van Cloudflare
       * mee te kijken, terwijl de melding er al was — hij werd alleen
       * weggegooid. Wie deze kant op mag praten heeft het gedeelde geheim,
       * dus er staat niets in wat hij niet al mocht weten.
       */
      const waarom = fout instanceof Error ? fout.message : String(fout)
      mislukt.push({ naam: stap.naam, waarom: waarom.slice(0, 300) })
      console.error('na de verkoop', stap.naam, waarom)
    }
  }
  return mislukt
}

async function koop(verzoek: Request, env: Env): Promise<Response> {
  if (!env.KOOP_GEHEIM) return json({ fout: 'niet-ingericht' }, 503)
  const url = new URL(verzoek.url)
  const meegegeven = verzoek.headers.get('x-darija-geheim') ?? url.searchParams.get('s')
  if (!geheimKlopt(meegegeven, env.KOOP_GEHEIM)) return json({ fout: 'nee' }, 403)

  const body = koopbericht(veldenVan(verzoek.headers.get('content-type'), await verzoek.text().catch(() => '')))

  const email = body.email
  const reeksen = body.reeksen
  if (!lijktEmail(email)) return json({ fout: 'onvolledig' }, 400)

  const stap = koopStap({
    terugbetaald: body.terugbetaald,
    bestelnummer: body.bestelnummer,
    alBekend: body.bestelnummer && !body.terugbetaald
      ? Boolean(await env.DB.prepare('SELECT id FROM bestelling WHERE bestelnummer = ?')
          .bind(body.bestelnummer).first<{ id: string }>())
      : false,
  })

  if (stap === 'zonder-nummer') {
    // Het adres niet. Hier stond het wel, en dat is een uitzondering die de
    // rest van deze database nergens maakt: `opening` en `mailteller` bewaren
    // een hash van het ip en niet het ip, en `bestelling` bewaart een hash van
    // de sleutel en niet de sleutel. Een adres in de logs van Cloudflare heeft
    // een andere bewaartermijn, een andere toegangslijst en geen verwijderknop
    // per regel — en voor de AVG maakt het niet uit dat het in een log staat en
    // niet in een tabel.
    //
    // Gezouten, want een kale hash van een e-mailadres is af te raden: de
    // verzameling adressen is klein genoeg om door te rekenen.
    //
    // Wat overblijft is genoeg voor waar deze regel voor is: zien dat het
    // twee keer dezelfde persoon is. Het adres zelf staat bij de betaalpartner,
    // en daar hoort het ook: dit bericht kwam binnen zónder bestelnummer, dus
    // het terugzoeken gebeurt daar.
    console.error('terugbetaling zonder bestelnummer; adres staat bij de betaalpartner, hier het merk:',
      (await hashVan(email + env.ZOUT)).slice(0, 12))
    return json({ goed: true, genegeerd: ['terugbetaling-zonder-bestelnummer'] })
  }

  if (stap === 'intrekken') {
    const uit = await env.DB
      .prepare('UPDATE bestelling SET ingetrokken = ?, reden = ? WHERE bestelnummer = ? AND ingetrokken IS NULL')
      .bind(nu(), 'terugbetaald', body.bestelnummer ?? '')
      .run()
    return json({ goed: true, ingetrokken: uit.meta?.changes ?? 0 })
  }

  if (stap === 'al-bekend') return json({ goed: true, alBekend: true })
  /**
   * Verkocht, maar niets wat het portaal uitdeelt — het e-boek is één pdf die
   * de betaalpartner zelf aflevert. Dat is geen fout, dus geen 400: een
   * foutcode zet de betaalpartner ertoe aan het nog eens te proberen, en dan
   * staat er morgen een rij mislukte meldingen die allemaal in orde waren.
   */
  if (!reeksen.length) {
    return body.genegeerd.length ? json({ goed: true, genegeerd: body.genegeerd }) : json({ fout: 'onvolledig' }, 400)
  }

  const sleutel = maakSleutel()
  const merk = [body.naam?.trim(), body.bestelnummer && `bestelling ${body.bestelnummer}`,
                body.proef && 'proefmelding']
    .filter(Boolean).join(' · ') || email

  await env.DB
    .prepare(`INSERT INTO bestelling (id, sleutel_hash, email, reeksen, taal, merk, bestelnummer, gekocht_op)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(sleutelBytes(16), await hashVan(sleutel), email, reeksen.join(','),
          body.taal, merk, body.bestelnummer ?? null, nu())
    .run()

  /**
   * Een koper is meteen lid.
   *
   * Niet om hem een nieuwsbrief te sturen — die staat hier uit en blijft uit
   * tot hij er zelf om vraagt — maar zodat hij zich met ditzelfde adres kan
   * aanmelden op het portaal en zijn boeken terugvindt zonder de oude mail op
   * te moeten diepen. De voorwaarden heeft hij bij het afrekenen aangevinkt;
   * dat is waar dit moment vandaan komt.
   */
  const m = koopMail(env, sleutel, reeksen, taalVan({ taal: body.taal }))
  const brief = { ...m, afmeldTekst: '', wisTekst: '', voet: 'Darijaforkids', afmeldUrl: '', wisUrl: '' }
  const ipHash = await hashVan((verzoek.headers.get('cf-connecting-ip') ?? '') + env.ZOUT)

  const mislukt = await naDeVerkoop([
    {
      naam: 'lid',
      doe: () => schrijfIn(env.DB, {
        email, taal: body.taal, nieuws: false, tekstVersie: TEKST_VERSIE, ipHash,
      }),
    },
    {
      naam: 'mail',
      doe: () => verstuur(
        { aan: email, onderwerp: m.onderwerp, html: briefHtml(brief), tekst: briefTekst(brief), afmeldUrl: '' },
        afzenderVan(env), env.MAIL_SLEUTEL, env.MAIL_URL,
      ),
    },
  ])

  // Altijd een 200: de bestelling staat, en een foutcode laat de
  // betaalpartner alleen maar opnieuw proberen op iets wat al gelukt is.
    return mislukt.length ? json({ goed: true, mislukt }) : json({ goed: true })
}

/**
 * Wie er leest, en wat hij mag lezen.
 *
 * Twee wegen naar hetzelfde boek. De eerste is de sleutel uit de mail die na
 * het afrekenen komt: die staat in de body en niet in het pad, want een pad
 * komt in logboeken terecht en een body niet. De tweede is het portaal —
 * iemand die is ingelogd hoeft geen oude mail op te diepen om bij zijn eigen
 * boeken te komen.
 *
 * De sleutel gaat voor. Wie er een meestuurt, bedoelt die: anders krijgt
 * iemand die toevallig is ingelogd de boeken van het verkeerde account te
 * zien zodra hij een link van een ander opent.
 */
async function toegang(
  verzoek: Request, env: Env, sleutel: string | undefined,
): Promise<{ reeksen: string[]; taal: string; merk: string; bestelling?: string } | null> {
  const bestelling = await bestellingVan(env.DB, sleutel ?? '')
  if (bestelling) {
    return {
      reeksen: bestelling.reeksen.split(','),
      taal: bestelling.taal,
      merk: bestelling.merk,
      bestelling: bestelling.id,
    }
  }

  const lid = await wieIsDit(env.DB, sessieUit(verzoek.headers.get('cookie')))
  if (!lid) return null
  const gekocht = await bezit(env.DB, lid.email)
  if (!gekocht.reeksen.length) return null
  return { reeksen: gekocht.reeksen, taal: lid.taal, merk: lid.email }
}

/** Wat deze lezer mag lezen. */
async function lezen(verzoek: Request, env: Env): Promise<Response> {
  const { sleutel } = await verzoek.json<{ sleutel?: string }>().catch(() => ({ sleutel: '' as string | undefined }))
  const mag = await toegang(verzoek, env, sleutel)
  if (!mag) return portaalJson(env, { fout: 'onbekend' }, 404)

  // Alleen een bestelling houdt bij hoe vaak hij is geopend; een lid van het
  // portaal is geen bestelling, en zijn bezoeken horen nergens geteld te worden.
  if (mag.bestelling) await tekAan(env.DB, mag.bestelling, await ipHash(verzoek, env.ZOUT))

  return portaalJson(env, { reeksen: mag.reeksen, taal: mag.taal, merk: mag.merk })
}

/**
 * Eén bladzijde.
 *
 * Elke bladzijde gaat apart door deze controle heen. Dat is duurder dan één
 * keer controleren en daarna alles vrijgeven, en het is het enige dat werkt:
 * een adres dat één keer openstaat, staat voor iedereen open.
 */
async function blad(verzoek: Request, env: Env): Promise<Response> {
  if (!env.BOEKEN) return portaalJson(env, { fout: 'niet-ingericht' }, 503)
  type Bladverzoek = { sleutel?: string; reeks?: string; deel?: number; nr?: number; taal?: string }
  const { sleutel, reeks, deel, nr, taal }: Bladverzoek =
    await verzoek.json<Bladverzoek>().catch(() => ({}))

  const mag = await toegang(verzoek, env, sleutel)
  if (!mag) return portaalJson(env, { fout: 'onbekend' }, 404)
  if (!mag.reeksen.includes(reeks ?? '')) return portaalJson(env, { fout: 'niet-gekocht' }, 403)
  if (!Number.isInteger(deel)) return portaalJson(env, { fout: 'onvolledig' }, 400)
  if (reeks !== 'sleutels' && !Number.isInteger(nr)) return portaalJson(env, { fout: 'onvolledig' }, 400)

  // Een prentenboek is een bladzijde als plaatje; een leesboek is tekst.
  // Een roman als plaatje schaalt niet op een telefoon: je kunt niet groter
  // zetten en de regels lopen niet door.
  //
  // `nr: 0` is bij allebei de tekst. Bij een prentenboek is dat de voorlees-
  // tekst die onder de plaatjes hoort — zonder die tekst zwijgt een prenten-
  // boek, en dan is het geen luisterboek maar een stapel plaatjes.
  const map = `${reeks}/${deel}/${(taal ?? mag.taal).replace(/[^a-z]/g, '')}`
  const isBoek = reeks === 'sleutels' || nr === 0
  const object = await env.BOEKEN.get(isBoek ? `${map}/boek.json` : `${map}/${nr}.webp`)
  if (!object) return portaalJson(env, { fout: 'geen-bladzijde' }, 404)

  return new Response(object.body, {
    headers: {
      'content-type': isBoek ? 'application/json' : 'image/webp',
      // Wel in de browser bewaren, nooit op een tussenliggende server.
      'cache-control': 'private, max-age=86400',
      ...portaalCors(env),
    },
  })
}

/* ------------------------------------------------------------- het portaal */

/**
 * Het portaal praat mét een koekje, en dat verandert de regels.
 *
 * `access-control-allow-origin: *` en meegestuurde koekjes gaan niet samen —
 * een browser weigert dat, en terecht. Hier staat daarom de site zelf, en
 * niets anders. De app komt hier nooit: die verkoopt niets.
 */
const portaalCors = (env: Env): Record<string, string> => ({
  'access-control-allow-origin': env.SITE ?? 'https://darijaforkids.eu',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-credentials': 'true',
  vary: 'origin',
})

const portaalJson = (env: Env, body: unknown, status = 200, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...portaalCors(env), ...extra },
  })

/** Wat er in de inlogmail staat. Kort: er is maar één ding te doen. */
const INLOGMAIL: Record<string, { kop: string; regel: string; knop: string; staart: string
  vraagKop: string; vraagBody: string; vraagKnop: string }> = {
  nl: { kop: 'Je link om binnen te komen', regel: 'Klik hieronder en je bent binnen. De link werkt een half uur en daarna niet meer.', knop: 'Naar mijn boeken', staart: 'Heb je hier niet om gevraagd? Dan hoef je niets te doen — zonder klik gebeurt er niets.',
       vraagKop: 'Nog één tik', vraagBody: 'Druk op de knop en je bent binnen. Die tik vragen we omdat je link maar één keer werkt — zo kan geen programma dat je post nakijkt hem opgebruiken.', vraagKnop: 'Inloggen' },
  fr: { kop: 'Votre lien de connexion', regel: 'Cliquez ci-dessous pour entrer. Le lien est valable une demi-heure.', knop: 'Vers mes livres', staart: 'Vous n’avez rien demandé ? Alors ne faites rien — sans clic, rien ne se passe.',
       vraagKop: 'Encore un clic', vraagBody: 'Appuyez sur le bouton et vous êtes entré. Nous demandons ce clic parce que votre lien ne fonctionne qu’une fois : ainsi aucun programme qui vérifie votre courrier ne peut l’utiliser.', vraagKnop: 'Se connecter' },
  de: { kop: 'Dein Link zum Anmelden', regel: 'Klick unten und du bist drin. Der Link gilt eine halbe Stunde.', knop: 'Zu meinen Büchern', staart: 'Nicht angefragt? Dann tu nichts — ohne Klick passiert nichts.',
       vraagKop: 'Nur noch ein Klick', vraagBody: 'Drück auf den Knopf und du bist drin. Wir fragen diesen Klick, weil dein Link nur einmal funktioniert — so kann kein Programm, das deine Post prüft, ihn verbrauchen.', vraagKnop: 'Anmelden' },
  es: { kop: 'Tu enlace para entrar', regel: 'Pulsa abajo y entras. El enlace vale media hora.', knop: 'A mis libros', staart: '¿No lo has pedido? No hagas nada: sin clic no pasa nada.',
       vraagKop: 'Solo falta un clic', vraagBody: 'Pulsa el botón y ya estás dentro. Te pedimos este clic porque tu enlace solo funciona una vez: así ningún programa que revise tu correo puede gastarlo.', vraagKnop: 'Entrar' },
  it: { kop: 'Il tuo link per entrare', regel: 'Clicca qui sotto ed entri. Il link vale mezz’ora.', knop: 'Ai miei libri', staart: 'Non l’hai chiesto tu? Allora non fare nulla: senza clic non succede niente.',
       vraagKop: 'Manca solo un clic', vraagBody: 'Premi il pulsante ed entri. Ti chiediamo questo clic perché il tuo link funziona una volta sola: così nessun programma che controlla la tua posta può consumarlo.', vraagKnop: 'Accedi' },
  en: { kop: 'Your link to get in', regel: 'Tap below and you are in. The link works for half an hour.', knop: 'To my books', staart: 'Did not ask for this? Then do nothing — without a click nothing happens.',
       vraagKop: 'Just one more tap', vraagBody: 'Press the button and you are in. We ask for this tap because your link works only once — that way no program that checks your mail can use it up.', vraagKnop: 'Log in' },
}

/**
 * Aanmelden of opnieuw inloggen: hetzelfde verzoek.
 *
 * Er is geen apart "registreren" en "inloggen", want het verschil zou alleen
 * bestaan uit een foutmelding die verklapt of een adres bij ons bekend is. Dat
 * is precies wat je niet wilt vertellen aan iemand die adressen afloopt.
 */
async function portaalAanmelden(verzoek: Request, env: Env): Promise<Response> {
  type Aanvraag = { email?: string; taal?: string; nieuws?: boolean; voorwaarden?: boolean; leeftijd?: boolean }
  const body: Aanvraag = await verzoek.json<Aanvraag>().catch(() => ({}))
  const email = netjesEmail(String(body.email ?? ''))
  if (!lijktEmail(email)) return portaalJson(env, { fout: 'adres' }, 400)

  // De twee verplichte vinkjes, altijd en voor iedereen.
  //
  // Hier stond `!bestaat && !(...)`: wie al een rij had mocht zonder vinkjes
  // door. Dat was een orakel. Stuur een adres zonder vinkjes en het antwoord
  // verschilde — `vinkjes` bij een onbekend adres, `goed` bij een bekend — en
  // daarmee kon je het formulier aflopen om te vragen wie hier een account
  // heeft. Met de poort hieronder erbij zou dat zelfs zijn: wie hier gekocht
  // heeft.
  //
  // De site vraagt ze al op elke inzending (`make-site.mjs`, de controle vóór
  // de fetch), dus dit wijkt nergens af van wat een bezoeker ziet.
  if (!(body.voorwaarden && body.leeftijd)) return portaalJson(env, { fout: 'vinkjes' }, 400)

  /**
   * De poort: post gaat alleen naar wie hier iets gekocht heeft.
   *
   * Het lézen was al dicht — `blad()` toetst `mag.reeksen.includes(reeks)` op
   * élke bladzijde, dus zonder bestelling krijg je overal een 403. Maar de mail
   * ging naar elk adres dat iemand hier intypte, met een knop "Naar mijn
   * boeken" erin. Voor de ontvanger onbegrijpelijk, en voor een vreemde een
   * manier om post te versturen onder onze naam.
   *
   * Geen bestelling is dus geen mail, geen `lid`-rij, en hetzelfde antwoord als
   * anders. Dat laatste moet: een afwijkend antwoord maakt dit formulier een
   * manier om na te vragen wie er gekocht heeft.
   *
   * `bezit()` telt een ingetrokken bestelling niet mee, dus een terugbetaling
   * sluit de deur hier vanzelf mee.
   *
   * Let op bij een klacht: het adres moet hetzelfde zijn als dat bij de
   * betaalpartner. Allebei de kanten gaan door `netjes()` — kleine letters,
   * geen spaties — maar `jan@gmail.com` en `j.jansen@werk.nl` zijn twee
   * adressen, en dan krijgt de koper niets terwijl het scherm zegt dat er post
   * onderweg is. De tekst op dat scherm wijst daarom naar deze mogelijkheid.
   */
  const gekocht = await bezit(env.DB, email)
  if (!gekocht.reeksen.length) return portaalJson(env, { goed: true })

  /*
   * En niets naar wie gewist wil worden.
   *
   * `wisselIn` weigert een lid met `gewist_op` al, dus zo iemand kwam toch niet
   * binnen — maar hij kreeg wel de mail. En die mail kon door een ander worden
   * uitgelokt: typ het adres van een gewist persoon in dit formulier en er gaat
   * post naar iemand die gevraagd heeft vergeten te worden.
   *
   * Zijn boeken blijven van hem: de sleutel uit de koopmail werkt los van het
   * portaal, en dat staat ook zo in de tekst die hij bij het wissen las.
   */
  const bestaand = await lidVanEmail(env.DB, email)
  if (bestaand?.gewist_op) return portaalJson(env, { goed: true })

  const taal = isTaal(body.taal ?? '') ? (body.taal as Taal) : 'nl'
  const lid = await schrijfIn(env.DB, {
    email, taal, nieuws: Boolean(body.nieuws), tekstVersie: TEKST_VERSIE,
    ipHash: await hashVan((verzoek.headers.get('cf-connecting-ip') ?? '') + env.ZOUT),
  })

  /**
   * Altijd hetzelfde antwoord, ook als er niets verstuurd is. Anders is dit
   * een manier om te vragen welke adressen bestaan.
   *
   * Twee remmen, en ze doen verschillend werk. `magOpnieuw` is per lid en
   * houdt tegen dat je jezelf vijf keer een link stuurt. `magMailen` is per
   * plek: wie elke keer een ánder adres invult, maakt elke keer een nieuw lid
   * en komt langs de eerste rem — en dan is dit een spuit waarmee een vreemde
   * post kan versturen onder onze naam.
   */
  const plek = await hashVan((verzoek.headers.get('cf-connecting-ip') ?? '') + env.ZOUT)
  if (mailBijInloggen({
    magPost: await magMailen(env.DB, plek),
    magOpnieuw: await magOpnieuw(env.DB, lid.id),
  })) {
    const token = await maakLink(env.DB, lid.id)
    const tekst = INLOGMAIL[taal] ?? INLOGMAIL.nl!
    // `l` is alleen voor de taal van de tussenbladzijde hieronder. Een oude
    // mail zonder die parameter werkt gewoon; die valt terug op Nederlands.
    const link = `${env.BASIS}/portaal/binnen?t=${token}&l=${taal}`
    const m = MAILS[taal]
    const portaalUrl = `${env.SITE ?? 'https://darijaforkids.eu'}/portaal`
    const brief = {
      kop: tekst.kop,
      body: tekst.regel,
      knop: { tekst: tekst.knop, url: link },
      staart: tekst.staart,
      // Een inlogmail is geen nieuwsbrief. De uitwegen wijzen daarom naar het
      // portaal zelf: daar staan de knoppen die er werkelijk toe doen.
      afmeldTekst: m.afmelden,
      wisTekst: m.wissen,
      voet: m.voet,
      afmeldUrl: portaalUrl,
      wisUrl: portaalUrl,
    }
    try {
      await verstuur({
        aan: email,
        onderwerp: tekst.kop,
        html: briefHtml(brief),
        tekst: briefTekst(brief),
        // Leeg, en niet `portaalUrl`: de links staan in de mail zelf, maar een
        // inlogmail hoort de mailclient geen één-tik-afmelding te beloven die
        // op een gewone pagina uitkomt.
        afmeldUrl: '',
      }, { naam: env.AFZENDER_NAAM, email: env.AFZENDER_EMAIL }, env.MAIL_SLEUTEL, env.MAIL_URL)
    } catch (fout) {
      // De link staat al in de tafel, want hij moest in de mail. Wat er nu moet
      // gebeuren hangt af van wát er misging, en dat scheelt.
      //
      // Bij een weigering van de postdienst staat vast dat er niets uitging.
      // Dan is het token niets waard — en erger: `magOpnieuw` ziet hem staan en
      // houdt de tweede poging tegen. Die krijgt dan een 200 en het portaal
      // zegt "kijk in je mail", terwijl er niets onderweg is. Dus opruimen; de
      // volgende poging maakt een nieuwe link.
      //
      // Bij een tijdslimiet weten we dat niet. Brevo kan de mail hebben
      // aangenomen en alleen te laat hebben geantwoord, en dan ligt er een
      // bezorgde mail in een postvak met een link die wij net weggooiden. De
      // ouder tikt erop en krijgt "werkt niet meer", terwijl hij precies deed
      // wat er stond. Die link blijft dus staan.
      //
      // En dan telt hij ook mee voor de rem per plek: er is post de deur uit
      // gegaan, of in elk geval waarschijnlijk. Zou dat niet meetellen, dan
      // remt een trage postdienst niemand meer, en is dit een spuit waarmee
      // iemand post kan laten versturen onder onze naam zolang Brevo traag is.
      if (fout instanceof PostOnzeker) await telMail(env.DB, plek)
      else await vergeetLink(env.DB, token)
      throw fout
    }
    await telMail(env.DB, plek)
  }
  return portaalJson(env, { goed: true })
}

/**
 * De link inwisselen en doorsturen naar het portaal, met het koekje erbij.
 *
 * Dit was de vierde link uit een mail die op een GET schreef, en de enige die
 * we bij de vorige ronde hebben overgeslagen. Hij is ook de duurste van de
 * vier: `wisselIn` zet `gebruikt_op`, dus wie hem ophaalt verbruikt hem. Haalt
 * de scanner van een mailbox de link vooraf op — Outlook Safe Links, de
 * virusscanner van een bedrijf, het linkvoorbeeld van een chatprogramma — dan
 * is die ophaling de inlog, en krijgt de koper zelf `?fout=link`.
 *
 * En het loopt niet af. `WACHTTIJD` is een minuut, dus hij mag een nieuwe link
 * vragen, maar die gaat langs dezelfde scanner en brandt net zo op. Iemand die
 * net betaald heeft komt dan niet bij zijn boek, en er is aan zijn kant niets
 * wat hij eraan kan doen.
 *
 * Een GET doet daarom nu precies niets: geen schrijfopdracht, en ook geen
 * vraag of het token bestaat. Dat laatste is met opzet. Het scheelt niet alleen
 * een query per ophaling, het betekent ook dat deze bladzijde nooit verklapt of
 * een token geldig is — de knop staat er altijd, en pas de POST erachter zoekt
 * hem op. Een scanner laat hier dus geen enkel spoor achter.
 *
 * De taal komt uit de URL en niet uit de database, want dat zou weer een vraag
 * zijn. `portaalAanmelden` zet hem erbij; een oude mail zonder die parameter
 * valt terug op Nederlands en werkt verder gewoon.
 */
async function portaalBinnen(url: URL, env: Env, doen: boolean): Promise<Response> {
  const site = env.SITE ?? 'https://darijaforkids.eu'
  const token = url.searchParams.get('t') ?? ''

  if (!doen) {
    const l = url.searchParams.get('l') ?? ''
    const taal = isTaal(l) ? l : 'nl'
    const t = INLOGMAIL[taal] ?? INLOGMAIL.nl!
    return vraagPagina(taal, t.vraagKop, t.vraagBody, t.vraagKnop,
      `/portaal/binnen?t=${encodeURIComponent(token)}&l=${encodeURIComponent(taal)}`)
  }

  const uit = await wisselIn(env.DB, token)
  if (!uit) return Response.redirect(`${site}/portaal?fout=link`, 302)
  return new Response(null, {
    status: 302,
    headers: {
      location: `${site}/portaal`,
      'set-cookie': koekje(uit.sessie, site, 90 * 24 * 60 * 60),
    },
  })
}

/** Wie ben ik, en wat heb ik. Eén verzoek, want het scherm heeft beide nodig. */
async function portaalMij(verzoek: Request, env: Env): Promise<Response> {
  const lid = await wieIsDit(env.DB, sessieUit(verzoek.headers.get('cookie')))
  if (!lid) return portaalJson(env, { binnen: false }, 200)
  const gekocht = await bezit(env.DB, lid.email)
  return portaalJson(env, {
    binnen: true,
    email: lid.email,
    taal: lid.taal,
    nieuws: Boolean(lid.nieuws),
    reeksen: gekocht.reeksen,
    sinds: gekocht.sinds,
  })
}

/**
 * Vergeet mij.
 *
 * Achter het koekje, dus alleen wie is ingelogd kan zichzelf wissen — en
 * omdat het een POST is, kan geen vreemde bladzijde het namens je doen.
 *
 * Het koekje gaat in hetzelfde antwoord weg. Anders blijft de browser er een
 * houden die nergens meer op slaat, en dat leest als "er is niets gebeurd".
 */
async function portaalWissen(verzoek: Request, env: Env): Promise<Response> {
  const lid = await wieIsDit(env.DB, sessieUit(verzoek.headers.get('cookie')))
  /*
   * Geen sessie is hier een fout, geen stilte.
   *
   * Hier stond `{ goed: true }` ook zonder sessie, met als reden dat een
   * afwijkend antwoord niet mag verklappen welke adressen bestaan. Die reden
   * klopt bij de drie links uit de mail — daar voer je een adres in — maar niet
   * hier: dit gaat op een koekje. Wie er geen heeft leert uit een 401 niets
   * over wie er wél een account heeft.
   *
   * En wat het kostte was echt. Verloopt je sessie terwijl het scherm open
   * staat, dan drukte je op "wissen", kreeg je "je gegevens zijn gewist", en
   * stond alles er nog. Bij deze knop is dat het ergst denkbare antwoord: je
   * denkt dat je weg bent en je bent het niet.
   */
  if (!lid) return portaalJson(env, { fout: 'niet-binnen' }, 401)
  await wisLid(env.DB, lid)
  return portaalJson(env, { goed: true }, 200, {
    'set-cookie': koekje('', env.SITE ?? 'https://darijaforkids.eu', 0),
  })
}

async function portaalUit(verzoek: Request, env: Env): Promise<Response> {
  await logUit(env.DB, sessieUit(verzoek.headers.get('cookie')))
  return portaalJson(env, { goed: true }, 200, {
    'set-cookie': koekje('', env.SITE ?? 'https://darijaforkids.eu', 0),
  })
}

async function portaalNieuws(verzoek: Request, env: Env): Promise<Response> {
  const lid = await wieIsDit(env.DB, sessieUit(verzoek.headers.get('cookie')))
  if (!lid) return portaalJson(env, { fout: 'niet-binnen' }, 401)
  const body: { aan?: boolean } = await verzoek.json<{ aan?: boolean }>().catch(() => ({}))
  await zetNieuws(env.DB, lid.id, Boolean(body.aan))
  return portaalJson(env, { goed: true, nieuws: Boolean(body.aan) })
}

/* --------------------------------------------------------------------- entry */

export default {
  async fetch(verzoek: Request, env: Env): Promise<Response> {
    const url = new URL(verzoek.url)
    // `/lezen` en `/blad` dragen het koekje van het portaal, en een browser
    // weigert een koekje bij `access-control-allow-origin: *`.
    const portaal = url.pathname.startsWith('/portaal/')
      || url.pathname === '/lezen' || url.pathname === '/blad'
    if (verzoek.method === 'OPTIONS') {
      return new Response(null, {
        headers: portaal ? { ...portaalCors(env), 'access-control-allow-origin': welkAdres(env.SITE, verzoek.headers.get('origin')) } : CORS,
      })
    }

    /**
     * Het antwoord krijgt het adres van de bezoeker mee.
     *
     * Eén plek, aan de uitgang, in plaats van zestien keer een verzoek
     * doorgeven aan een functie die er verder niets mee doet.
     */
    const metAdres = (antwoord: Response): Response => {
      if (!portaal) return antwoord
      const kop = new Headers(antwoord.headers)
      kop.set('access-control-allow-origin', welkAdres(env.SITE, verzoek.headers.get('origin')))
      return new Response(antwoord.body, { status: antwoord.status, headers: kop })
    }

    try {
      if (url.pathname === '/aanmelden' && verzoek.method === 'POST') return metAdres(await aanmelden(verzoek, env))
      if (url.pathname === '/voortgang' && verzoek.method === 'POST') return metAdres(await voortgang(verzoek, env))
      if (url.pathname === '/bevestig') return metAdres(await bevestig(url, env, verzoek.method === 'POST'))
      // Mail clients unsubscribe with a POST, people with a click.
      if (url.pathname === '/uitschrijven') return metAdres(await uitschrijven(url, env, verzoek.method === 'POST'))
      if (url.pathname === '/wissen') return metAdres(await wissen(url, env, verzoek.method === 'POST'))
      if (url.pathname === '/koop' && verzoek.method === 'POST') return metAdres(await koop(verzoek, env))
      if (url.pathname === '/lezen' && verzoek.method === 'POST') return metAdres(await lezen(verzoek, env))
      if (url.pathname === '/blad' && verzoek.method === 'POST') return metAdres(await blad(verzoek, env))

      if (url.pathname === '/portaal/aanmelden' && verzoek.method === 'POST') return metAdres(await portaalAanmelden(verzoek, env))
      if (url.pathname === '/portaal/binnen') return metAdres(await portaalBinnen(url, env, verzoek.method === 'POST'))
      if (url.pathname === '/portaal/mij') return metAdres(await portaalMij(verzoek, env))
      if (url.pathname === '/portaal/uit' && verzoek.method === 'POST') return metAdres(await portaalUit(verzoek, env))
      if (url.pathname === '/portaal/wissen' && verzoek.method === 'POST') return metAdres(await portaalWissen(verzoek, env))
      if (url.pathname === '/portaal/nieuws' && verzoek.method === 'POST') return metAdres(await portaalNieuws(verzoek, env))
    } catch (e) {
      console.error(url.pathname, e instanceof Error ? e.message : e)
      return json({ fout: 'ging-mis' }, 500)
    }
    return json({ fout: 'onbekend' }, 404)
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(weekloop(env))
  },
}

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
import { verstuur, type Afzender } from './mail'
import { MAILS, TEKST_VERSIE, isTaal, type Taal, type Week } from './mails'
import { briefHtml, briefTekst, pagina } from './sjabloon'

export interface Env {
  DB: D1Database
  /** The mail provider's key. `wrangler secret put MAIL_SLEUTEL`. */
  MAIL_SLEUTEL: string
  /** Where this worker itself answers, e.g. https://post.darijaforkids.app */
  BASIS: string
  AFZENDER_NAAM: string
  AFZENDER_EMAIL: string
  /** Salt for the hashed IP. `wrangler secret put ZOUT`. */
  ZOUT: string
  /** Only set while developing, to send the mail somewhere harmless. */
  MAIL_URL?: string
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
    if (bestaand.status !== 'bevestigd' && !teSnel) {
      await stuurBevestiging(env, { ...bestaand, taal })
    }
    return json({ ok: true, status: bestaand.status === 'bevestigd' ? 'bevestigd' : 'wacht', id: bestaand.id })
  }

  const rij: Rij = { id: sleutelBytes(12), email, taal, nieuws, voortgang, status: 'wacht', token: sleutelBytes(24) }
  await env.DB.prepare(
    `INSERT INTO aanmelding (id, email, taal, nieuws, voortgang, status, token, aangemeld_op, ip_hash, tekst_versie)
     VALUES (?, ?, ?, ?, ?, 'wacht', ?, ?, ?, ?)`,
  ).bind(rij.id, email, taal, nieuws, voortgang, rij.token, nu(), await ipHash(verzoek, env.ZOUT), TEKST_VERSIE).run()

  try {
    await stuurBevestiging(env, rij)
  } catch (e) {
    // The row without its mail is the worst of both: the caller is told it
    // failed, and a second try would find the address already taken and stay
    // quiet. So take it back out and let them try again for real.
    await env.DB.prepare('DELETE FROM aanmelding WHERE id = ?').bind(rij.id).run()
    throw e
  }
  return json({ ok: true, status: 'wacht', id: rij.id })
}

async function bevestig(url: URL, env: Env): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const rij = await env.DB
    .prepare('SELECT id, email, taal, nieuws, voortgang, status, token FROM aanmelding WHERE token = ?')
    .bind(token).first<Rij>()
  if (!rij) return pagina('en', 'Deze link werkt niet meer', 'Meld je opnieuw aan in de app onder "Voor ouders".')

  const m = MAILS[taalVan(rij)]
  if (rij.status === 'bevestigd') return pagina(rij.taal, m.welkomKop, m.welkomBody)

  await env.DB.prepare("UPDATE aanmelding SET status = 'bevestigd', bevestigd_op = ? WHERE id = ?")
    .bind(nu(), rij.id).run()
  // The click is the consent. A welcome mail that will not send is a bad
  // afternoon at the mail provider, not a reason to throw the yes away.
  try {
    await stuurWelkom(env, rij)
  } catch (e) {
    console.error('welkom', rij.id, e instanceof Error ? e.message : e)
  }
  return pagina(rij.taal, m.welkomKop, m.welkomBody)
}

async function uitschrijven(url: URL, env: Env): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const rij = await env.DB
    .prepare('SELECT id, email, taal, nieuws, voortgang, status, token FROM aanmelding WHERE token = ?')
    .bind(token).first<Rij>()
  // A link that no longer matches anything has already done its job.
  if (!rij) return pagina('en', 'Uitgeschreven', 'Dit adres staat niet (meer) op de lijst.')

  await env.DB.prepare(
    "UPDATE aanmelding SET status = 'uitgeschreven', nieuws = 0, voortgang = 0, uitgeschreven_op = ? WHERE id = ?",
  ).bind(nu(), rij.id).run()
  await env.DB.prepare('DELETE FROM voortgang WHERE id = ?').bind(rij.id).run()
  return pagina(rij.taal, MAILS[taalVan(rij)].afmelden, MAILS[taalVan(rij)].voet)
}

/**
 * Forgetting somebody, for real.
 *
 * "Unsubscribe" leaves a row behind that says we may not write; this removes
 * the address itself. Both exist because they are different asks, and the
 * GDPR gives a right to the second one.
 */
async function wissen(url: URL, env: Env): Promise<Response> {
  const token = url.searchParams.get('t') ?? ''
  const rij = await env.DB.prepare('SELECT id, taal FROM aanmelding WHERE token = ?').bind(token).first<{ id: string; taal: string }>()
  if (!rij) return pagina('en', 'Gewist', 'Er staat niets meer onder deze link.')
  await env.DB.prepare('DELETE FROM voortgang WHERE id = ?').bind(rij.id).run()
  await env.DB.prepare('DELETE FROM aanmelding WHERE id = ?').bind(rij.id).run()
  return pagina(rij.taal, MAILS[isTaal(rij.taal) ? rij.taal : 'en'].wissen, MAILS[isTaal(rij.taal) ? rij.taal : 'en'].voet)
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

/* --------------------------------------------------------------------- entry */

export default {
  async fetch(verzoek: Request, env: Env): Promise<Response> {
    const url = new URL(verzoek.url)
    if (verzoek.method === 'OPTIONS') return new Response(null, { headers: CORS })

    try {
      if (url.pathname === '/aanmelden' && verzoek.method === 'POST') return await aanmelden(verzoek, env)
      if (url.pathname === '/voortgang' && verzoek.method === 'POST') return await voortgang(verzoek, env)
      if (url.pathname === '/bevestig') return await bevestig(url, env)
      // Mail clients unsubscribe with a POST, people with a click.
      if (url.pathname === '/uitschrijven') return await uitschrijven(url, env)
      if (url.pathname === '/wissen') return await wissen(url, env)
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

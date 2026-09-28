/**
 * De andere weg: van aanmelden tot de maandagochtendmail.
 *
 * De koopketen loopt één keer per koper. Deze loopt vanzelf, elke week, naar
 * iedereen die erom gevraagd heeft — en als daar iets omvalt, merkt niemand
 * het. `weekloop()` vangt per adres een fout af zodat één slecht adres de
 * andere honderdnegenennegentig niet ophoudt, en dat is goed; het betekent ook
 * dat een stille fout stil blijft.
 *
 * Doorgelopen tegen een draaiende worker met een echte lokale D1 en de post
 * omgeleid naar een opvangbak, met `--test-scheduled` zodat de maandagochtend
 * op afroep komt. Wat daar uitkwam staat hieronder.
 *
 * Twee dingen zijn onderweg gerepareerd en staan hier vast: de witregels in de
 * platte tekst (zie `briefTekst`), en dat een oude bevestiglink een afmelding
 * niet meer opwekt.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import worker from './index'

/* ------------------------------------------------------------ de nabootsing */

interface Aanmelding {
  id: string; email: string; taal: string; nieuws: number; voortgang: number
  status: string; token: string; aangemeld_op: number; laatste_mail: number | null
  bevestigd_op: number | null; uitgeschreven_op: number | null
}
interface Voortgang {
  id: string; units: number; lessen: number; woorden: number; reeks: number
  xp: number; vorige_xp: number; bijgewerkt: number
}

/**
 * Een D1 van niks, met de twee tafels die deze weg aandoet.
 *
 * Bewust ruw: dit herkent de query's die deze keten stelt en niets anders. Komt
 * er een query bij, dan valt de test om op een leeg antwoord — beter dan een
 * nabootsing die alles slikt.
 */
const nepDb = () => {
  const aanmeldingen: Aanmelding[] = []
  const voortgangen: Voortgang[] = []
  const db = {
    prepare(sql: string) {
      let a: unknown[] = []
      const api = {
        bind(...x: unknown[]) { a = x; return api },
        async first<T>(): Promise<T | null> {
          if (/FROM aanmelding WHERE email/.test(sql)) {
            return (aanmeldingen.find((r) => r.email === a[0]) ?? null) as T
          }
          if (/FROM aanmelding WHERE token/.test(sql)) {
            return (aanmeldingen.find((r) => r.token === a[0]) ?? null) as T
          }
          if (/FROM aanmelding WHERE id/.test(sql)) {
            return (aanmeldingen.find((r) => r.id === a[0]) ?? null) as T
          }
          return null as T
        },
        async all<T>() {
          // De weeklijst: bevestigd, voortgang aan, en langer dan zes dagen
          // geleden gemaild.
          if (/FROM aanmelding a JOIN voortgang v/.test(sql)) {
            const grens = Number(a[0])
            const uit = aanmeldingen
              .filter((r) => r.status === 'bevestigd' && r.voortgang === 1
                && (r.laatste_mail === null || r.laatste_mail < grens))
              .map((r) => {
                const v = voortgangen.find((x) => x.id === r.id)
                return v ? { ...r, ...v } : null
              })
              .filter(Boolean)
            return { results: uit as T[] }
          }
          return { results: [] as T[] }
        },
        async run() {
          if (/INSERT INTO aanmelding/.test(sql)) {
            // Let op de nummering: `status` staat als letterlijke 'wacht' in de
            // SQL en is dus géén parameter. De eerste versie hiervan las a[5]
            // als de status en kreeg het token te pakken — de test viel om op
            // "expected '84855cde…' to be 'wacht'", en dat is precies waarom
            // een nabootsing die de query's herkent beter is dan een die alles
            // slikt.
            aanmeldingen.push({
              id: String(a[0]), email: String(a[1]), taal: String(a[2]),
              nieuws: Number(a[3]), voortgang: Number(a[4]), status: 'wacht',
              token: String(a[5]), aangemeld_op: Number(a[6]),
              laatste_mail: null, bevestigd_op: null, uitgeschreven_op: null,
            })
          }
          if (/UPDATE aanmelding SET status = 'bevestigd'/.test(sql)) {
            const r = aanmeldingen.find((x) => x.id === a[1])
            if (r) { r.status = 'bevestigd'; r.bevestigd_op = Number(a[0]) }
          }
          if (/UPDATE aanmelding SET status = 'uitgeschreven'/.test(sql)) {
            const r = aanmeldingen.find((x) => x.id === a[1])
            if (r) { r.status = 'uitgeschreven'; r.nieuws = 0; r.voortgang = 0; r.uitgeschreven_op = Number(a[0]) }
          }
          if (/UPDATE aanmelding SET laatste_mail/.test(sql)) {
            const r = aanmeldingen.find((x) => x.id === a[1])
            if (r) r.laatste_mail = Number(a[0])
          }
          if (/UPDATE voortgang SET vorige_xp/.test(sql)) {
            const v = voortgangen.find((x) => x.id === a[1])
            if (v) v.vorige_xp = Number(a[0])
          }
          if (/INSERT INTO voortgang/.test(sql)) {
            const bestaand = voortgangen.find((x) => x.id === a[0])
            const nieuw = {
              id: String(a[0]), bijgewerkt: Number(a[1]), units: Number(a[2]),
              lessen: Number(a[3]), woorden: Number(a[4]), reeks: Number(a[5]),
              xp: Number(a[6]), vorige_xp: bestaand?.vorige_xp ?? 0,
            }
            if (bestaand) Object.assign(bestaand, nieuw)
            else voortgangen.push(nieuw)
          }
          if (/DELETE FROM voortgang WHERE id/.test(sql)) {
            const i = voortgangen.findIndex((x) => x.id === a[0])
            if (i !== -1) voortgangen.splice(i, 1)
          }
          return { meta: { changes: 0 } }
        },
      }
      return api
    },
    async batch(opdrachten: { run: () => Promise<unknown> }[]) {
      for (const o of opdrachten) await o.run()
      return []
    },
  }
  return { db: db as unknown as D1Database, aanmeldingen, voortgangen }
}

const env = (db: D1Database) => ({
  DB: db,
  MAIL_SLEUTEL: 'proef',
  MAIL_URL: 'https://post.invalid/',
  BASIS: 'https://post.darijaforkids.eu',
  AFZENDER_NAAM: 'Darijaforkids',
  AFZENDER_EMAIL: 'post@darijaforkids.eu',
  ZOUT: 'zout',
  SITE: 'https://darijaforkids.eu',
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

const postbak = () => {
  const brieven: { aan: string; onderwerp: string; tekst: string; html: string }[] = []
  globalThis.fetch = (async (_url: unknown, opties: { body: string }) => {
    const b = JSON.parse(opties.body) as {
      to: { email: string }[]; subject: string; textContent: string; htmlContent: string
    }
    brieven.push({ aan: b.to[0]!.email, onderwerp: b.subject, tekst: b.textContent, html: b.htmlContent })
    return new Response('{"messageId":"proef"}', { status: 201 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any
  return brieven
}

const json = (pad: string, body: unknown) =>
  new Request(`https://post.darijaforkids.eu${pad}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.4' },
    body: JSON.stringify(body),
  })

const link = (pad: string, token: string, methode: 'GET' | 'POST') =>
  new Request(`https://post.darijaforkids.eu/${pad}?t=${token}`, { method: methode })

/** De maandagochtend, op afroep. */
const maandag = async (e: unknown) => {
  const wachten: Promise<unknown>[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (worker as any).scheduled({} as never, e, {
    waitUntil: (p: Promise<unknown>) => wachten.push(p),
    passThroughOnException: () => {},
  })
  await Promise.all(wachten)
}

/* ---------------------------------------------------------------- de keten */

describe('van aanmelden tot de maandagochtendmail', () => {
  const echt = globalThis.fetch
  afterEach(() => { globalThis.fetch = echt; vi.restoreAllMocks() })
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  /** Aanmelden, bevestigen, en de eerste voortgang doorgeven. */
  const opzetten = async (e: ReturnType<typeof env>, post: ReturnType<typeof postbak>) => {
    const aan = await worker.fetch(
      json('/aanmelden', { email: 'Ouder@Voorbeeld.NL', taal: 'nl', nieuws: true, voortgang: true }), e)
    const { id } = await aan.json() as { id: string }
    return id
  }

  it('loopt in één keer door: aanmelden, bevestigen, voortgang, weekmail', async () => {
    const { db, aanmeldingen, voortgangen } = nepDb()
    const e = env(db)
    const post = postbak()

    // 1 — de app meldt aan
    const id = await opzetten(e, post)
    expect(aanmeldingen).toHaveLength(1)
    const rij = aanmeldingen[0]!
    expect(rij.email, 'het adres is niet genormaliseerd').toBe('ouder@voorbeeld.nl')
    expect(rij.status).toBe('wacht')
    expect(post, 'geen mail om het adres te bevestigen').toHaveLength(1)
    expect(post[0]!.onderwerp).toBe('Klopt dit adres?')

    // 2 — een linkscanner haalt de bevestiglink op: dat mag niets doen
    const geprefetcht = await worker.fetch(link('bevestig', rij.token, 'GET'), e)
    expect(geprefetcht.status).toBe(200)
    expect(rij.status, 'een GET bevestigde de aanmelding').toBe('wacht')
    expect(post, 'een GET stuurde een welkomstmail').toHaveLength(1)

    // 3 — en dan de mens
    await worker.fetch(link('bevestig', rij.token, 'POST'), e)
    expect(rij.status).toBe('bevestigd')
    expect(post, 'geen welkomstmail').toHaveLength(2)

    // 4 — de app stuurt de vijf getallen
    const gemeld = await worker.fetch(
      json('/voortgang', { id, units: 3, lessen: 11, woorden: 74, reeks: 5, xp: 420 }), e)
    expect(await gemeld.json()).toEqual({ ok: true })
    expect(voortgangen[0]).toMatchObject({ units: 3, lessen: 11, woorden: 74, reeks: 5, xp: 420 })

    // 5 — maandagochtend
    await maandag(e)
    expect(post, 'er ging geen weekmail uit').toHaveLength(3)
    const week = post[2]!
    expect(week.aan).toBe('ouder@voorbeeld.nl')
    expect(week.tekst).toContain('Units af: 3')
    expect(week.tekst).toContain('Woorden gezien: 74')
    expect(week.tekst).toContain('Langste reeks: 5')

    // de boekhouding: gemaild, en de stand van de xp vastgelegd voor volgende week
    expect(rij.laatste_mail, 'laatste_mail is niet gezet').not.toBeNull()
    expect(voortgangen[0]!.vorige_xp, 'vorige_xp is niet bijgewerkt').toBe(420)
  })

  it('stuurt niet twee keer post als de taak twee keer draait', async () => {
    // De taak staat op maandagochtend, maar een herstart of een tweede trigger
    // mag geen tweede mail betekenen. `laatste_mail` is de rem: zes dagen.
    const { db, aanmeldingen } = nepDb()
    const e = env(db)
    const post = postbak()
    const id = await opzetten(e, post)
    await worker.fetch(link('bevestig', aanmeldingen[0]!.token, 'POST'), e)
    await worker.fetch(json('/voortgang', { id, units: 1, lessen: 1, woorden: 1, reeks: 1, xp: 10 }), e)

    await maandag(e)
    const naEen = post.length
    await maandag(e)
    expect(post, 'de tweede ronde stuurde nog een mail').toHaveLength(naEen)
  })

  it('mailt niemand wiens app nog niets heeft gemeld', async () => {
    // Een rij zonder voortgang is een ouder wiens kind de app na het aanmelden
    // niet meer heeft geopend. Een mail vol nullen is een rare manier om hallo
    // te zeggen, en de JOIN houdt hem daarom buiten de lijst.
    const { db, aanmeldingen } = nepDb()
    const e = env(db)
    const post = postbak()
    await opzetten(e, post)
    await worker.fetch(link('bevestig', aanmeldingen[0]!.token, 'POST'), e)
    const voor = post.length

    await maandag(e)
    expect(post, 'er ging een weekmail zonder cijfers uit').toHaveLength(voor)
  })

  it('zet de witregels in de platte tekst van de weekmail', async () => {
    // `briefTekst` bouwde zijn regels met `.filter((l) => l !== '')` erachter,
    // en dat gooide juist de witregels weg die er met opzet in stonden: onder
    // de kop, en boven de streep van de voet. In elke mail plakte de kop dus
    // aan de tekst eronder.
    const { db, aanmeldingen } = nepDb()
    const e = env(db)
    const post = postbak()
    const id = await opzetten(e, post)
    await worker.fetch(link('bevestig', aanmeldingen[0]!.token, 'POST'), e)
    await worker.fetch(json('/voortgang', { id, units: 1, lessen: 2, woorden: 3, reeks: 4, xp: 5 }), e)
    await maandag(e)

    const regels = post[post.length - 1]!.tekst.split('\n')
    expect(regels[1], 'de kop plakt aan de tekst eronder').toBe('')
    const streep = regels.indexOf('—')
    expect(streep, 'de streep van de voet is weg').toBeGreaterThan(0)
    expect(regels[streep - 1], 'de streep plakt aan de regel erboven').toBe('')
    // En de uitwegen staan eronder, met tekst én adres.
    expect(regels.slice(streep).join('\n')).toMatch(/Uitschrijven: https:\/\/post\./)
    expect(regels.slice(streep).join('\n')).toMatch(/wissen: https:\/\/post\./i)
  })

  it('houdt op met mailen zodra iemand zich uitschrijft', async () => {
    const { db, aanmeldingen, voortgangen } = nepDb()
    const e = env(db)
    const post = postbak()
    const id = await opzetten(e, post)
    const rij = aanmeldingen[0]!
    await worker.fetch(link('bevestig', rij.token, 'POST'), e)
    await worker.fetch(json('/voortgang', { id, units: 1, lessen: 1, woorden: 1, reeks: 1, xp: 10 }), e)
    await maandag(e)
    const naEersteWeek = post.length

    // Een scanner die de afmeldlink ophaalt schrijft niemand uit.
    await worker.fetch(link('uitschrijven', rij.token, 'GET'), e)
    expect(rij.status, 'een GET schreef hem uit').toBe('bevestigd')

    // De knop wel, en dan gaat de voortgang ook weg.
    await worker.fetch(link('uitschrijven', rij.token, 'POST'), e)
    expect(rij.status).toBe('uitgeschreven')
    expect(rij.voortgang).toBe(0)
    expect(voortgangen, 'de voortgangsrij bleef staan').toHaveLength(0)

    // De maandag daarna komt er niets meer.
    rij.laatste_mail = null
    await maandag(e)
    expect(post, 'er ging toch nog een weekmail uit').toHaveLength(naEersteWeek)
  })

  it('wekt een uitgeschreven aanmelding niet op met de oude bevestiglink', async () => {
    // De bevestiglink en de afmeldlink staan in dezelfde mail en dragen
    // hetzelfde token. Wie zich afmeldt en later in die oude mail op de
    // verkeerde knop tikt, stond er weer op — met een welkomstmail erbij.
    const { db, aanmeldingen } = nepDb()
    const e = env(db)
    const post = postbak()
    await opzetten(e, post)
    const rij = aanmeldingen[0]!
    await worker.fetch(link('bevestig', rij.token, 'POST'), e)
    await worker.fetch(link('uitschrijven', rij.token, 'POST'), e)
    const voor = post.length

    await worker.fetch(link('bevestig', rij.token, 'POST'), e)
    expect(rij.status, 'de afmelding is opgewekt').toBe('uitgeschreven')
    expect(post, 'er ging een tweede welkomstmail uit').toHaveLength(voor)
  })
})

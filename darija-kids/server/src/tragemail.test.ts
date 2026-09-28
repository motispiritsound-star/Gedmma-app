import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import worker from './index'
import { MAILS_PER_UUR } from './portaal'

/** Een D1 van niks, maar wel met lid, sessie en mailteller erin. */
const nepDb = () => {
  const leden: { id: string; email: string; taal: string; nieuws: number; gewist_op: number | null; laatste_bezoek: number | null }[] = []
  const sessies: { token_hash: string; lid_id: string; soort: string; gemaakt_op: number; verloopt_op: number; gebruikt_op: number | null }[] = []
  const tellers: { ip_hash: string; uur: string; aantal: number }[] = []
  /* De poort in `portaalAanmelden` stuurt iedereen zonder bestelling weg vóór
     de mailstap. Deze test gaat over wat er ná die stap gebeurt, dus hoort er
     een koper in te staan. */
  const bestellingen: { email: string; reeksen: string; gekocht_op: number }[] = [
    { email: 'ouder@example.com', reeksen: 'sba', gekocht_op: 1 },
  ]
  const db = {
    prepare(sql: string) {
      if (process.env.SQLLOG) console.log('SQL:', sql.replace(/\s+/g, ' ').slice(0, 90))
      let a: any[] = []
      const api = {
        bind(...x: any[]) { a = x; return api },
        async first<T>(): Promise<T | null> {
          if (/SELECT id, email, taal, nieuws, gewist_op FROM lid WHERE email/.test(sql)) {
            return (leden.find((l) => l.email === a[0]) ?? null) as T
          }
          if (/SELECT id, email, taal, nieuws, gewist_op FROM lid WHERE id/.test(sql)) {
            return (leden.find((l) => l.id === a[0]) ?? null) as T
          }
          if (/SELECT gemaakt_op FROM sessie/.test(sql)) {
            const mijne = sessies.filter((s) => s.lid_id === a[0] && s.soort === 'link')
              .sort((p, q) => q.gemaakt_op - p.gemaakt_op)
            return (mijne[0] ? { gemaakt_op: mijne[0].gemaakt_op } : null) as T
          }
          if (/SELECT aantal FROM mailteller/.test(sql)) {
            const r = tellers.find((t) => t.ip_hash === a[0] && t.uur === a[1])
            return (r ? { aantal: r.aantal } : null) as T
          }
          if (/SELECT lid_id, verloopt_op, gebruikt_op FROM sessie/.test(sql)) {
            const r = sessies.find((s) => s.token_hash === a[0] && s.soort === 'link')
            return (r ? { lid_id: r.lid_id, verloopt_op: r.verloopt_op, gebruikt_op: r.gebruikt_op } : null) as T
          }
          return null as T
        },
        async all<T>() {
          if (/FROM bestelling WHERE email/.test(sql)) {
            return { results: bestellingen.filter((b) => b.email === a[0]) as unknown as T[] }
          }
          return { results: [] as T[] }
        },
        async run() {
          if (/INSERT INTO lid/.test(sql)) {
            leden.push({ id: String(a[0]), email: String(a[1]), taal: String(a[2]), nieuws: Number(a[5]), gewist_op: null, laatste_bezoek: null })
          }
          if (/INSERT INTO sessie/.test(sql)) {
            const soort = /'link'/.test(sql) ? 'link' : 'sessie'
            sessies.push({ token_hash: String(a[0]), lid_id: String(a[1]), soort, gemaakt_op: Number(a[2]), verloopt_op: Number(a[3]), gebruikt_op: null })
          }
          if (/DELETE FROM sessie WHERE token_hash/.test(sql)) {
            const i = sessies.findIndex((s) => s.token_hash === a[0] && s.soort === 'link')
            if (i !== -1) sessies.splice(i, 1)
          }
          if (/UPDATE sessie SET gebruikt_op/.test(sql)) {
            const r = sessies.find((s) => s.token_hash === a[1])
            if (r) r.gebruikt_op = Number(a[0])
          }
          if (/INSERT INTO mailteller/.test(sql)) {
            const r = tellers.find((t) => t.ip_hash === a[0] && t.uur === a[1])
            if (r) r.aantal += 1
            else tellers.push({ ip_hash: String(a[0]), uur: String(a[1]), aantal: 1 })
          }
          return { meta: { changes: 0 } }
        },
      }
      return api
    },
  }
  return { db: db as unknown as D1Database, leden, sessies, tellers, bestellingen }
}

const env = (db: D1Database) => ({
  DB: db, MAIL_SLEUTEL: 'k', BASIS: 'https://post.darijaforkids.eu',
  AFZENDER_NAAM: 'Darija', AFZENDER_EMAIL: 'info@darijaforkids.eu',
  ZOUT: 'zout', SITE: 'https://darijaforkids.eu',
}) as any

/** Brevo op een drukke middag: de mail gaat de deur uit, het antwoord komt te laat. */
const brevoBezorgtMaarAntwoordtTeLaat = (bezorgd: string[]) =>
  vi.fn(async (_url: any, opties: any) => {
    bezorgd.push(String(opties.body))
    const fout: any = new Error('The operation was aborted due to timeout')
    fout.name = 'TimeoutError'
    throw fout
  })

/** Brevo die antwoordt met een foutcode: dan staat vast dat er niets uitging. */
const brevoWeigert = () =>
  vi.fn(async () => new Response('{"message":"Key not found"}', { status: 401 }))

const vraagLink = (email: string) => new Request('https://post.darijaforkids.eu/portaal/aanmelden', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', origin: 'https://darijaforkids.eu' },
  body: JSON.stringify({ email, taal: 'nl', voorwaarden: true, leeftijd: true }),
})

describe('trage mailpartner', () => {
  const echt = globalThis.fetch
  beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => { globalThis.fetch = echt; vi.restoreAllMocks() })

  it('laat de link staan, want die mail kan bezorgd zijn', async () => {
    const { db, sessies, tellers } = nepDb()
    const bezorgd: string[] = []
    globalThis.fetch = brevoBezorgtMaarAntwoordtTeLaat(bezorgd) as any

    const antwoord = await worker.fetch(vraagLink('ouder@example.com'), env(db))
    console.log('STATUS', antwoord.status, await antwoord.clone().text(), 'BEZORGD', bezorgd.length, 'SESSIES', JSON.stringify(sessies), 'LEDEN')
    expect(antwoord.status).toBe(500)
    expect(await antwoord.json()).toEqual({ fout: 'ging-mis' })

    // De mail is wél de deur uit, met de link erin.
    expect(bezorgd).toHaveLength(1)
    const token = /portaal\/binnen\?t=([0-9a-f]{32})/.exec(bezorgd[0]!)![1]!

    // En de rij staat er nog, want we weten niet dat de mail niet aankwam.
    expect(sessies, 'de link is weggegooid terwijl de mail onderweg kan zijn').toHaveLength(1)
    // En hij telt mee voor de rem: er is post de deur uit gegaan.
    expect(tellers, 'de mail telt niet mee voor de rem per plek').toHaveLength(1)

    // De ouder tikt op de knop in die bezorgde mail, en komt gewoon binnen.
    const tik = await worker.fetch(new Request(`https://post.darijaforkids.eu/portaal/binnen?t=${token}&l=nl`, {
      method: 'POST', headers: { origin: 'https://darijaforkids.eu' },
    }), env(db))
    expect(tik.status).toBe(302)
    expect(tik.headers.get('location'), 'de ouder kwam niet binnen').toBe('https://darijaforkids.eu/portaal')
    expect(tik.headers.get('set-cookie')).toContain('dfk_sessie=')
  })

  it('ruimt de link wel op als de postdienst hem hard weigert', async () => {
    // De andere helft van hetzelfde onderscheid. Bij een foutcode van Brevo is
    // er niets bezorgd, en dan hoort de rij weg: anders ziet `magOpnieuw` hem
    // staan en krijgt de tweede poging een 200 zonder dat er post uitgaat.
    const { db, sessies, tellers } = nepDb()
    const nep = brevoWeigert()
    globalThis.fetch = nep as any

    const antwoord = await worker.fetch(vraagLink('ouder@example.com'), env(db))
    expect(antwoord.status).toBe(500)
    expect(sessies, 'de link bleef staan terwijl er niets verstuurd is').toHaveLength(0)
    expect(tellers, 'een geweigerde mail telde mee voor de rem').toHaveLength(0)

    // En omdat de rij weg is, gaat de volgende poging er wél opnieuw langs.
    await worker.fetch(vraagLink('ouder@example.com'), env(db))
    expect(nep, 'de tweede poging werd tegengehouden door een link die er niet is')
      .toHaveBeenCalledTimes(2)
  })

  it('laat de rem per plek dichtgaan, ook als de post traag is', async () => {
    // Hier zat het tweede gat. `telMail` stond achter de try, dus bij een
    // tijdslimiet werd er niet geteld — en dan remt een trage postdienst
    // niemand meer, terwijl er wél post uitgaat.
    const { db, tellers, bestellingen } = nepDb()
    const pogingen = MAILS_PER_UUR * 3
    for (let i = 0; i < pogingen; i += 1) {
      bestellingen.push({ email: `koper${i}@example.com`, reeksen: 'sba', gekocht_op: 1 })
    }
    const bezorgd: string[] = []
    const nep = brevoBezorgtMaarAntwoordtTeLaat(bezorgd)
    globalThis.fetch = nep as any

    for (let i = 0; i < pogingen; i += 1) {
      await worker.fetch(vraagLink(`koper${i}@example.com`), env(db))
    }

    // Na de eerste twaalf is de rem dicht en gaat er niets meer uit. Het
    // antwoord blijft hetzelfde, want dat mag niet verklappen of er post is.
    expect(nep, 'de rem ging niet dicht').toHaveBeenCalledTimes(MAILS_PER_UUR)
    expect(bezorgd).toHaveLength(MAILS_PER_UUR)
    expect(tellers[0]?.aantal, 'de teller staat niet op de limiet').toBe(MAILS_PER_UUR)
  })
})

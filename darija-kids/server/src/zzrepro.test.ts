import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import worker from './index'
import { MAILS_PER_UUR } from './portaal'

/** Een D1 van niks, maar wel met lid, sessie en mailteller erin. */
const nepDb = () => {
  const leden: { id: string; email: string; taal: string; nieuws: number; gewist_op: number | null; laatste_bezoek: number | null }[] = []
  const sessies: { token_hash: string; lid_id: string; soort: string; gemaakt_op: number; verloopt_op: number; gebruikt_op: number | null }[] = []
  const tellers: { ip_hash: string; uur: string; aantal: number }[] = []
  const db = {
    prepare(sql: string) {
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
        async all<T>() { return { results: [] as T[] } },
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
  return { db: db as unknown as D1Database, leden, sessies, tellers }
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

const vraagLink = (email: string) => new Request('https://post.darijaforkids.eu/portaal/aanmelden', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', origin: 'https://darijaforkids.eu' },
  body: JSON.stringify({ email, taal: 'nl', voorwaarden: true, leeftijd: true }),
})

describe('trage mailpartner', () => {
  const echt = globalThis.fetch
  beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => { globalThis.fetch = echt; vi.restoreAllMocks() })

  it('de bezorgde mail houdt een link die het portaal niet meer kent', async () => {
    const { db, sessies, tellers } = nepDb()
    const bezorgd: string[] = []
    globalThis.fetch = brevoBezorgtMaarAntwoordtTeLaat(bezorgd) as any

    const antwoord = await worker.fetch(vraagLink('ouder@example.com'), env(db))
    expect(antwoord.status).toBe(500)
    expect(await antwoord.json()).toEqual({ fout: 'ging-mis' })

    // De mail is wél de deur uit, met de link erin.
    expect(bezorgd).toHaveLength(1)
    const token = /portaal\/binnen\?t=([0-9a-f]{32})/.exec(bezorgd[0]!)![1]!

    // Maar de rij is weg, en de teller staat op nul.
    expect(sessies, 'vergeetLink heeft de link gewist').toHaveLength(0)
    expect(tellers, 'telMail is nooit bereikt').toHaveLength(0)

    // De ouder tikt op de knop in die mail.
    const tik = await worker.fetch(new Request(`https://post.darijaforkids.eu/portaal/binnen?t=${token}&l=nl`, {
      method: 'POST', headers: { origin: 'https://darijaforkids.eu' },
    }), env(db))
    expect(tik.status).toBe(302)
    expect(tik.headers.get('location')).toBe('https://darijaforkids.eu/portaal?fout=link')
  })

  it('zonder de opruiming had diezelfde link wel gewerkt', async () => {
    // Dezelfde staat, maar met de rij nog in de tafel: precies wat er vóór de
    // diff gebeurde, want telMail werd toen ook al overgeslagen.
    const { db, sessies } = nepDb()
    const bezorgd: string[] = []
    globalThis.fetch = brevoBezorgtMaarAntwoordtTeLaat(bezorgd) as any
    const bewaard: any[] = []
    const echteDb = db as any
    const omheen = {
      prepare(sql: string) {
        const p = echteDb.prepare(sql)
        if (!/DELETE FROM sessie WHERE token_hash/.test(sql)) return p
        const nietsDoen = {
          bind: () => nietsDoen,
          run: async () => { bewaard.push(1); return { meta: { changes: 0 } } },
        }
        return nietsDoen as any
      },
    } as unknown as D1Database

    await worker.fetch(vraagLink('ouder@example.com'), env(omheen))
    expect(bewaard, 'de nieuwe catch probeerde te wissen').toHaveLength(1)
    const token = /portaal\/binnen\?t=([0-9a-f]{32})/.exec(bezorgd[0]!)![1]!
    expect(sessies).toHaveLength(1)

    const tik = await worker.fetch(new Request(`https://post.darijaforkids.eu/portaal/binnen?t=${token}&l=nl`, {
      method: 'POST', headers: { origin: 'https://darijaforkids.eu' },
    }), env(omheen))
    expect(tik.status).toBe(302)
    expect(tik.headers.get('location'), 'de ouder kwam binnen').toBe('https://darijaforkids.eu/portaal')
    expect(tik.headers.get('set-cookie')).toContain('dfk_sessie=')
  })

  it('de rem per plek gaat nooit dicht zolang de post omvalt', async () => {
    const { db, tellers } = nepDb()
    const bezorgd: string[] = []
    const nep = brevoBezorgtMaarAntwoordtTeLaat(bezorgd)
    globalThis.fetch = nep as any

    const pogingen = MAILS_PER_UUR * 3
    for (let i = 0; i < pogingen; i += 1) {
      const r = await worker.fetch(vraagLink(`slachtoffer${i}@example.com`), env(db))
      expect(r.status, `poging ${i + 1}`).toBe(500)
    }
    expect(nep, 'elke poging ging naar de mailpartner').toHaveBeenCalledTimes(pogingen)
    expect(bezorgd, 'en elke keer met een volledige mail erin').toHaveLength(pogingen)
    expect(tellers, 'de mailteller is nooit aangeraakt').toHaveLength(0)
  })
})

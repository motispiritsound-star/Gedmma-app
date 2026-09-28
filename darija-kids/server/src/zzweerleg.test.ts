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


/** Brevo dat 429 antwoordt: geweigerd, dus niets bezorgd. */
const brevo429 = (bezorgd: string[]) =>
  vi.fn(async () => { void bezorgd; return new Response('{"message":"rate limit"}', { status: 429 }) })

/** Exact de body uit het rapport. */
const rapportBody = (email: string) => new Request('https://post.darijaforkids.eu/portaal/aanmelden', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', origin: 'https://darijaforkids.eu' },
  body: JSON.stringify({ email, nieuws: false }),
})

describe('WEERLEGGING: mailbombardement via het foutpad', () => {
  const echt = globalThis.fetch
  beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })
  afterEach(() => { globalThis.fetch = echt; vi.restoreAllMocks() })

  it('A: de letterlijke invoer uit het rapport, 50x', async () => {
    const { db, sessies, tellers } = nepDb()
    const bezorgd: string[] = []
    const nep = brevoBezorgtMaarAntwoordtTeLaat(bezorgd)
    globalThis.fetch = nep as any
    let statussen = new Set<number>()
    for (let i = 0; i < 50; i += 1) {
      const r = await worker.fetch(rapportBody('slachtoffer@ergens.nl'), env(db))
      statussen.add(r.status)
    }
    console.log('A statussen', [...statussen], 'fetches', nep.mock.calls.length, 'bezorgd', bezorgd.length, 'sessies', sessies.length, 'tellers', JSON.stringify(tellers))
  })

  it('B: met vinkjes, slachtoffer heeft niets gekocht, 50x', async () => {
    const { db, sessies, tellers } = nepDb()
    const bezorgd: string[] = []
    const nep = brevoBezorgtMaarAntwoordtTeLaat(bezorgd)
    globalThis.fetch = nep as any
    let statussen = new Set<number>()
    for (let i = 0; i < 50; i += 1) {
      const r = await worker.fetch(vraagLink('slachtoffer@ergens.nl'), env(db))
      statussen.add(r.status)
    }
    console.log('B statussen', [...statussen], 'fetches', nep.mock.calls.length, 'bezorgd', bezorgd.length, 'sessies', sessies.length, 'tellers', JSON.stringify(tellers))
  })

  it('C: slachtoffer IS koper, Brevo bezorgt maar antwoordt te laat, 50x', async () => {
    const { db, sessies, tellers } = nepDb()
    const bezorgd: string[] = []
    const nep = brevoBezorgtMaarAntwoordtTeLaat(bezorgd)
    globalThis.fetch = nep as any
    let statussen = new Set<number>()
    for (let i = 0; i < 50; i += 1) {
      const r = await worker.fetch(vraagLink('ouder@example.com'), env(db))
      statussen.add(r.status)
    }
    console.log('C statussen', [...statussen], 'fetches', nep.mock.calls.length, 'BEZORGD BIJ SLACHTOFFER', bezorgd.length, 'sessies', sessies.length, 'tellers', JSON.stringify(tellers))
  })

  it('D: slachtoffer IS koper, Brevo weigert met 429, 50x', async () => {
    const { db, sessies, tellers } = nepDb()
    const bezorgd: string[] = []
    const nep = brevo429(bezorgd)
    globalThis.fetch = nep as any
    let statussen = new Set<number>()
    for (let i = 0; i < 50; i += 1) {
      const r = await worker.fetch(vraagLink('ouder@example.com'), env(db))
      statussen.add(r.status)
    }
    console.log('D statussen', [...statussen], 'fetches', nep.mock.calls.length, 'BEZORGD BIJ SLACHTOFFER', bezorgd.length, 'sessies', sessies.length, 'tellers', JSON.stringify(tellers))
  })

  it('E: wisselende adressen van kopers, timeout, 50x (de per-ip rem)', async () => {
    const { db, tellers, bestellingen } = nepDb()
    for (let i = 0; i < 50; i += 1) bestellingen.push({ email: `koper${i}@example.com`, reeksen: 'sba', gekocht_op: 1 })
    const bezorgd: string[] = []
    const nep = brevoBezorgtMaarAntwoordtTeLaat(bezorgd)
    globalThis.fetch = nep as any
    for (let i = 0; i < 50; i += 1) await worker.fetch(vraagLink(`koper${i}@example.com`), env(db))
    console.log('E fetches', nep.mock.calls.length, 'BEZORGD TOTAAL', bezorgd.length, 'tellers', JSON.stringify(tellers))
  })
})

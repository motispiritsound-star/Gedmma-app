/**
 * De hele weg van betaling tot boek, in één test.
 *
 * Dit is de keten waar geld in zit: de betaalpartner meldt een verkoop, de
 * koper krijgt een mail, in die mail zit een sleutel, en met die sleutel gaat
 * het boek open. Elk stuk ervan werd al apart getoetst — `koopbericht` op de
 * velden van Gumroad, `koopmail` op de tekst, `naverkoop` op de volgorde van de
 * stappen — maar niets liep de hele weg af. En juist dáár zitten de fouten die
 * een koper raken: op de naden tussen twee stukken die elk voor zich kloppen.
 *
 * Deze test is geschreven nadat ik die weg met de hand heb doorlopen tegen een
 * draaiende worker, met een echte lokale D1, een bladzijde in de lokale R2 en
 * de post omgeleid naar een opvangbak — waar `verstuur()` een parameter voor
 * heeft, precies hiervoor. Wat daar uitkwam staat hieronder, zodat het niet
 * meer van mijn terminal afhangt.
 *
 * Wat die ronde opleverde: één echte fout, in de staart van de platte tekst.
 * Zie `briefTekst` in sjabloon.ts en de laatste toets hieronder.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import worker from './index'

/* ------------------------------------------------------------ de nabootsing */

interface Rijen {
  bestelling: Record<string, unknown>[]
  lid: Record<string, unknown>[]
  opening: Record<string, unknown>[]
}

/**
 * Een D1 van niks, maar wel met de vier tafels die deze weg aandoet.
 *
 * Bewust ruw: dit bootst geen sqlite na, het herkent de query's die deze keten
 * stelt. Komt er een query bij die hier niet staat, dan valt de test om op een
 * leeg antwoord — en dat is beter dan een nabootsing die alles slikt.
 */
const nepDb = () => {
  const rijen: Rijen = { bestelling: [], lid: [], opening: [] }
  const db = {
    prepare(sql: string) {
      let a: unknown[] = []
      const api = {
        bind(...x: unknown[]) { a = x; return api },
        async first<T>(): Promise<T | null> {
          if (/SELECT id FROM bestelling WHERE bestelnummer/.test(sql)) {
            return (rijen.bestelling.find((b) => b.bestelnummer === a[0]) ?? null) as T
          }
          if (/FROM bestelling WHERE sleutel_hash/.test(sql)) {
            const r = rijen.bestelling.find((b) => b.sleutel_hash === a[0])
            return (r ?? null) as T
          }
          if (/FROM lid WHERE email/.test(sql)) {
            return (rijen.lid.find((l) => l.email === a[0]) ?? null) as T
          }
          return null as T
        },
        async all<T>() {
          if (/FROM bestelling WHERE email/.test(sql)) {
            return { results: rijen.bestelling.filter((b) => b.email === a[0] && !b.ingetrokken) as T[] }
          }
          return { results: [] as T[] }
        },
        async run() {
          if (/INSERT INTO bestelling/.test(sql)) {
            rijen.bestelling.push({
              id: a[0], sleutel_hash: a[1], email: a[2], reeksen: a[3], taal: a[4],
              merk: a[5], bestelnummer: a[6], gekocht_op: a[7], ingetrokken: null,
            })
          }
          if (/INSERT INTO lid/.test(sql)) {
            rijen.lid.push({ id: a[0], email: a[1], taal: a[2], nieuws: a[5], gewist_op: null })
          }
          if (/INSERT INTO opening/.test(sql)) {
            rijen.opening.push({ bestelling_id: a[0], dag: a[1], ip_hash: a[2] })
          }
          return { meta: { changes: 0 } }
        },
      }
      return api
    },
  }
  return { db: db as unknown as D1Database, rijen }
}

/** Eén bladzijde in de bak, genoeg om te zien dat hij eruit komt. */
const nepBak = (sleutels: Record<string, string>) => ({
  async get(sleutel: string) {
    const inhoud = sleutels[sleutel]
    if (inhoud === undefined) return null
    return { body: inhoud, httpEtag: '"x"' }
  },
}) as unknown as R2Bucket

const env = (db: D1Database, bak?: R2Bucket) => ({
  DB: db,
  BOEKEN: bak,
  MAIL_SLEUTEL: 'proef',
  MAIL_URL: 'https://post.invalid/',
  BASIS: 'https://post.darijaforkids.eu',
  AFZENDER_NAAM: 'Darijaforkids',
  AFZENDER_EMAIL: 'post@darijaforkids.eu',
  ZOUT: 'zout',
  SITE: 'https://darijaforkids.eu',
  KOOP_GEHEIM: 'geheim',
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any

/** De postbak: wat er verstuurd zou zijn, zonder dat er iets weggaat. */
const postbak = () => {
  const brieven: { aan: string; onderwerp: string; html: string; tekst: string }[] = []
  globalThis.fetch = (async (_url: unknown, opties: { body: string }) => {
    const b = JSON.parse(opties.body) as {
      to: { email: string }[]; subject: string; htmlContent: string; textContent: string
    }
    brieven.push({ aan: b.to[0]!.email, onderwerp: b.subject, html: b.htmlContent, tekst: b.textContent })
    return new Response('{"messageId":"proef"}', { status: 201 })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any
  return brieven
}

/** Een ping zoals de betaalpartner hem stuurt: formuliervelden, geen JSON. */
const ping = (velden: Record<string, string>, geheim = 'geheim') =>
  new Request('https://post.darijaforkids.eu/koop', {
    method: 'POST',
    headers: {
      'x-darija-geheim': geheim,
      'content-type': 'application/x-www-form-urlencoded',
      'cf-connecting-ip': '203.0.113.9',
    },
    body: new URLSearchParams(velden).toString(),
  })

const vraag = (pad: string, body: unknown) =>
  new Request(`https://post.darijaforkids.eu${pad}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' },
    body: JSON.stringify(body),
  })

/** De sleutel staat alleen in de knop van de mail; daar halen we hem vandaan. */
const sleutelUit = (html: string): string => {
  const m = /\/lezen#([0-9a-f]{32})/.exec(html)
  expect(m, 'geen sleutel in de knop van de koopmail').not.toBeNull()
  return m![1]!
}

const KOPER = {
  purchaser_email: 'Ouder@Example.COM',
  product_permalink: 'sba',
  full_name: 'Fatima Ouali',
  order_number: 'GUM-99001',
  ip_country: 'Netherlands',
}

/* ---------------------------------------------------------------- de keten */

describe('van betaling tot boek', () => {
  const echt = globalThis.fetch
  afterEach(() => { globalThis.fetch = echt; vi.restoreAllMocks() })
  beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}) })

  it('loopt in één keer door: ping, mail, sleutel, bladzijde', async () => {
    const { db, rijen } = nepDb()
    const bak = nepBak({ 'sba/1/nl/boek.json': '{"titel":"Sba deel 1"}' })
    const post = postbak()

    // 1 — de betaalpartner meldt de verkoop
    const gemeld = await worker.fetch(ping(KOPER), env(db, bak))
    expect(gemeld.status).toBe(200)
    expect(await gemeld.json()).toEqual({ goed: true })

    // De bestelling staat er, met het adres in kleine letters.
    expect(rijen.bestelling).toHaveLength(1)
    const bestelling = rijen.bestelling[0]!
    expect(bestelling.email, 'het adres is niet genormaliseerd').toBe('ouder@example.com')
    expect(bestelling.reeksen).toBe('sba')
    expect(bestelling.merk).toContain('Fatima Ouali')
    expect(bestelling.merk).toContain('GUM-99001')

    // 2 — en de mail is de deur uit, met de sleutel in de knop
    expect(post, 'er ging geen mail uit').toHaveLength(1)
    const brief = post[0]!
    expect(brief.aan).toBe('ouder@example.com')
    const sleutel = sleutelUit(brief.html)

    // De sleutel zelf staat nergens in de database, alleen zijn afdruk.
    expect(String(bestelling.sleutel_hash), 'de sleutel staat in de database')
      .not.toContain(sleutel)
    expect(String(bestelling.sleutel_hash)).toHaveLength(64)

    // 3 — de koper wisselt hem in
    const mij = await worker.fetch(vraag('/lezen', { sleutel }), env(db, bak))
    expect(mij.status).toBe(200)
    expect(await mij.json()).toEqual({
      reeksen: ['sba'], taal: 'nl', merk: bestelling.merk,
    })

    // en de opening is geteld, met een afdruk van het ip en niet het ip zelf
    expect(rijen.opening, 'de opening is niet geteld').toHaveLength(1)
    expect(String(rijen.opening[0]!.ip_hash)).not.toContain('203.0.113')

    // 4 — en het boek gaat open
    const blad = await worker.fetch(
      vraag('/blad', { sleutel, reeks: 'sba', deel: 1, nr: 0, taal: 'nl' }), env(db, bak))
    expect(blad.status).toBe(200)
    expect(await blad.text()).toContain('Sba deel 1')
  })

  it('geeft niets aan wie het niet gekocht heeft, en verklapt ook niet wat', async () => {
    const { db } = nepDb()
    const bak = nepBak({
      'sba/1/nl/boek.json': '{"titel":"Sba"}',
      'sleutels/1/nl/boek.json': '{"titel":"Sleutels"}',
    })
    const post = postbak()
    await worker.fetch(ping(KOPER), env(db, bak))
    const sleutel = sleutelUit(post[0]!.html)

    // De andere reeks: gekocht is gekocht, en dit is niet gekocht.
    const ander = await worker.fetch(
      vraag('/blad', { sleutel, reeks: 'sleutels', deel: 1, nr: 0, taal: 'nl' }), env(db, bak))
    expect(ander.status).toBe(403)
    expect(await ander.json()).toEqual({ fout: 'niet-gekocht' })

    // Een verzonnen sleutel krijgt hetzelfde antwoord als een ingetrokken:
    // wie hier probeert, hoort niet te weten of hij ooit goed was.
    const verzonnen = await worker.fetch(
      vraag('/blad', { sleutel: '0'.repeat(32), reeks: 'sba', deel: 1, nr: 0, taal: 'nl' }), env(db, bak))
    expect(verzonnen.status).toBe(404)
    expect(await verzonnen.json()).toEqual({ fout: 'onbekend' })
  })

  it('sluit de deur zodra de sleutel is ingetrokken', async () => {
    const { db, rijen } = nepDb()
    const bak = nepBak({ 'sba/1/nl/boek.json': '{"titel":"Sba"}' })
    const post = postbak()
    await worker.fetch(ping(KOPER), env(db, bak))
    const sleutel = sleutelUit(post[0]!.html)

    // Zoals `npm run intrekken` doet na een terugbetaling.
    rijen.bestelling[0]!.ingetrokken = 1

    for (const [pad, body] of [
      ['/lezen', { sleutel }],
      ['/blad', { sleutel, reeks: 'sba', deel: 1, nr: 0, taal: 'nl' }],
    ] as const) {
      const antwoord = await worker.fetch(vraag(pad, body), env(db, bak))
      expect(antwoord.status, `${pad} laat een ingetrokken sleutel nog door`).toBe(404)
      expect(await antwoord.json()).toEqual({ fout: 'onbekend' })
    }
  })

  it('maakt van een tweede ping geen tweede bestelling en geen tweede mail', async () => {
    // Gumroad stuurt dezelfde ping opnieuw als de eerste te lang duurde. Een
    // tweede bestelling zou een tweede sleutel zijn, een tweede mail, en een
    // koper die niet weet welke van de twee de zijne is.
    const { db, rijen } = nepDb()
    const post = postbak()

    await worker.fetch(ping(KOPER), env(db))
    const nogmaals = await worker.fetch(ping(KOPER), env(db))

    expect(await nogmaals.json()).toEqual({ goed: true, alBekend: true })
    expect(rijen.bestelling, 'er kwam een tweede bestelling bij').toHaveLength(1)
    expect(post, 'er ging een tweede mail uit').toHaveLength(1)
  })

  it('laat een bijkoop wél door, want dat is een tweede bestelling', async () => {
    const { db, rijen } = nepDb()
    const post = postbak()
    await worker.fetch(ping(KOPER), env(db))
    await worker.fetch(ping({ ...KOPER, product_permalink: 'sleutels', order_number: 'GUM-99002' }), env(db))
    expect(rijen.bestelling).toHaveLength(2)
    expect(post).toHaveLength(2)
  })

  it('doet niets zonder het juiste geheim, of zonder adres of product', async () => {
    const { db, rijen } = nepDb()
    const post = postbak()

    const fout = await worker.fetch(ping(KOPER, 'raden'), env(db))
    expect(fout.status).toBe(403)

    const zonderAdres = await worker.fetch(ping({ product_permalink: 'sba' }), env(db))
    expect(zonderAdres.status).toBe(400)

    // Een product dat wij niet kennen komt niet stil door: dan staat er een
    // 400 in het pinglogboek van de betaalpartner, en dat is een plek waar
    // iemand kan kijken.
    const onbekend = await worker.fetch(
      ping({ ...KOPER, product_permalink: 'kalender', order_number: 'GUM-4' }), env(db))
    expect(onbekend.status).toBe(400)

    expect(rijen.bestelling, 'er is een bestelling ontstaan').toHaveLength(0)
    expect(post, 'er ging post uit').toHaveLength(0)
  })

  /**
   * En de staart van de platte tekst.
   *
   * Dit is wat de ronde met de hand opleverde. Een koopmail is geen mailing, dus
   * `koop()` geeft afmeldTekst, afmeldUrl, wisTekst en wisUrl alle vier leeg mee
   * — met opzet, want een één-tik-afmelding beloven die op een gewone bladzijde
   * uitkomt is erger dan hem niet beloven. `briefHtml` vangt dat af. `briefTekst`
   * bouwde die twee regels onvoorwaardelijk, en `filter(l => l !== '')` laat
   * `": "` staan, want dat is niet leeg. Elke koopmail eindigde dus op:
   *
   *   —
   *   Darijaforkids
   *   :
   *   :
   *
   * Dat is de enige mail die écht moet aankomen, want daar zit de sleutel in,
   * en de platte tekst is wat een deel van de mailprogramma's en de spamfilters
   * laat zien.
   */
  it('stuurt geen mail met een staart van losse dubbele punten', async () => {
    const { db } = nepDb()
    const post = postbak()
    await worker.fetch(ping(KOPER), env(db))

    const tekst = post[0]!.tekst
    for (const regel of tekst.split('\n')) {
      expect(regel.trim(), `losse regel in de koopmail: ${JSON.stringify(regel)}`).not.toBe(':')
    }
    expect(tekst.trimEnd(), 'de mail eindigt op een lege verwijzing').not.toMatch(/:\s*$/)
    // En het slot hoort de afzender te zijn.
    expect(tekst.trimEnd().split('\n').pop()).toBe('Darijaforkids')
  })
})

import { describe, expect, it } from 'vitest'
import { maakLink, magOpnieuw, vergeetLink, wisLid } from './portaal'

/**
 * Een inloglink die nooit is verstuurd, hoort niet te blijven staan.
 *
 * Gevonden door het portaal echt te doorlopen met een worker ernaast waarvan
 * de post het niet deed. Wat er gebeurde:
 *
 *   poging 1 → HTTP 500 {"fout":"ging-mis"}
 *   poging 2 → HTTP 200 {"goed":true}
 *
 * en het portaal toonde na die tweede poging "Kijk in je mail — we hebben je
 * een link gestuurd". Er was niets gestuurd.
 *
 * De oorzaak zit in de volgorde, en die volgorde móet zo: `maakLink` schrijft
 * de rij vóórdat de mail weggaat, want het token hoort in die mail. Valt het
 * versturen om, dan blijft de rij staan, en `magOpnieuw` ziet een link van nog
 * geen minuut oud. De tweede poging slaat het versturen dus over — precies
 * zoals bedoeld tegen iemand die zichzelf vijf keer een link stuurt — en
 * antwoordt `{ goed: true }`.
 *
 * Dat antwoord is met opzet altijd hetzelfde, zodat je hiermee niet kunt
 * vragen welke adressen bestaan. Maar daardoor ziet de persoon die staat te
 * wachten geen verschil tussen "we hebben niet gestuurd want je vroeg net al"
 * en "we hebben niet gestuurd want onze post ligt plat".
 *
 * De oplossing is de link weghalen als de mail niet weggaat. Hij is dan toch
 * niets waard: hij stond in een bericht dat nooit is aangekomen.
 */

/** Een D1 van niks: genoeg voor de tafel `sessie`. */
const nepDb = () => {
  const rijen: { token_hash: string; lid_id: string; soort: string; gemaakt_op: number }[] = []
  const db = {
    prepare(sql: string) {
      let args: unknown[] = []
      const api = {
        bind(...a: unknown[]) { args = a; return api },
        async first<T>(): Promise<T | null> {
          if (!/SELECT gemaakt_op FROM sessie/.test(sql)) return null
          const mijne = rijen
            .filter((r) => r.lid_id === args[0] && r.soort === 'link')
            .sort((a, b) => b.gemaakt_op - a.gemaakt_op)
          return (mijne[0] ? { gemaakt_op: mijne[0].gemaakt_op } : null) as T
        },
        async run() {
          if (/INSERT INTO sessie/.test(sql)) {
            // `soort` staat als letterlijke 'link' in de query en is dus geen
            // parameter: de gebonden waarden zijn hash, lid, gemaakt, verloopt.
            rijen.push({
              token_hash: String(args[0]), lid_id: String(args[1]),
              soort: 'link', gemaakt_op: Number(args[2]),
            })
          }
          if (/DELETE FROM sessie WHERE token_hash/.test(sql)) {
            const i = rijen.findIndex((r) => r.token_hash === args[0] && r.soort === 'link')
            if (i !== -1) rijen.splice(i, 1)
          }
          return { meta: { changes: 0 } }
        },
      }
      return api
    },
  }
  return { db: db as unknown as D1Database, rijen }
}

describe('een inloglink waarvan de mail omviel', () => {
  it('houdt de volgende poging tegen zolang hij blijft staan', async () => {
    const { db } = nepDb()
    expect(await magOpnieuw(db, 'lid-1'), 'een lid zonder links mag altijd').toBe(true)

    await maakLink(db, 'lid-1')
    // Dit is de rem die hoort te werken tegen iemand die zichzelf vijf keer
    // een link stuurt — en die precies verkeerd uitpakt als de mail omviel.
    expect(await magOpnieuw(db, 'lid-1')).toBe(false)
  })

  it('laat de volgende poging weer door zodra hij is opgeruimd', async () => {
    const { db, rijen } = nepDb()
    const token = await maakLink(db, 'lid-1')
    expect(rijen).toHaveLength(1)

    await vergeetLink(db, token)

    expect(rijen, 'de link hoort weg te zijn').toHaveLength(0)
    expect(await magOpnieuw(db, 'lid-1'), 'en dan mag de volgende poging wél').toBe(true)
  })

  it('raakt de link van iemand anders niet aan', async () => {
    const { db, rijen } = nepDb()
    const vanMij = await maakLink(db, 'lid-1')
    await maakLink(db, 'lid-2')

    await vergeetLink(db, vanMij)

    expect(rijen).toHaveLength(1)
    expect(rijen[0]!.lid_id).toBe('lid-2')
    expect(await magOpnieuw(db, 'lid-2'), 'de ander houdt zijn rem').toBe(false)
  })

  it('valt niet om over een token dat er niet is', async () => {
    const { db } = nepDb()
    await expect(vergeetLink(db, 'bestaat-niet')).resolves.toBeUndefined()
  })
})

/**
 * En het recht om vergeten te worden.
 *
 * De kolom `gewist_op` stond in het schema en werd overal gelezen — `wieIsDit`
 * en `lidVanEmail` weigeren een lid dat gezet is — maar nergens gezet. Er was
 * een deur zonder kruk.
 *
 * En dat was niet alleen een gemis. De inlogmail zet er onderaan letterlijk
 * "Mijn gegevens wissen" bij, met een link naar het portaal, en de
 * privacyverklaring zegt hetzelfde. Op die bladzijde stond alleen "Uitloggen".
 *
 * Wat blijft staan is de bestelling. Die hoort bij een koop en niet bij een
 * account: de boeken blijven van wie ze betaald heeft, bereikbaar met de
 * sleutel uit de koopmail. Dat staat ook in de tekst die de lezer leest,
 * voordat hij op de knop drukt.
 */
describe('vergeten worden', () => {
  /** Een D1 met een lid en zijn sessies erin. */
  const nepLid = () => {
    const sessies: { lid_id: string }[] = [{ lid_id: 'lid-1' }, { lid_id: 'lid-1' }, { lid_id: 'lid-2' }]
    const lid: Record<string, unknown> = { id: 'lid-1', gewist_op: null, nieuws: 1, ip_hash: 'abc' }
    const db = {
      prepare(sql: string) {
        let args: unknown[] = []
        const api = {
          bind(...a: unknown[]) { args = a; return api },
          async first<T>(): Promise<T | null> { return null as T | null },
          async run() {
            if (/DELETE FROM sessie WHERE lid_id/.test(sql)) {
              for (let i = sessies.length - 1; i >= 0; i--) if (sessies[i]!.lid_id === args[0]) sessies.splice(i, 1)
            }
            if (/UPDATE lid SET gewist_op/.test(sql) && args[1] === lid.id) {
              lid.gewist_op = args[0]; lid.nieuws = 0; lid.ip_hash = null
            }
            return { meta: { changes: 0 } }
          },
        }
        return api
      },
    }
    return { db: db as unknown as D1Database, sessies, lid }
  }

  it('zet het moment, en haalt het vinkje en de ip-hash weg', async () => {
    const { db, lid } = nepLid()
    await wisLid(db, 'lid-1')
    expect(lid.gewist_op, 'gewist_op is niet gezet').toEqual(expect.any(Number))
    expect(lid.nieuws, 'het nieuwsvinkje hoort uit').toBe(0)
    expect(lid.ip_hash, 'de ip-hash hoort weg').toBeNull()
  })

  it('logt uit op álle apparaten, en alleen bij deze persoon', async () => {
    const { db, sessies } = nepLid()
    await wisLid(db, 'lid-1')
    // Wie vergeten wil worden, hoort ook op zijn tweede toestel uit te zijn.
    expect(sessies.filter((s) => s.lid_id === 'lid-1')).toHaveLength(0)
    expect(sessies.filter((s) => s.lid_id === 'lid-2'), 'de ander blijft ingelogd').toHaveLength(1)
  })

  it('raakt de tafel met bestellingen niet aan', async () => {
    // Nagelopen tegen een echte database: na het wissen stond de bestelling er
    // nog. Hier wordt het in de query zelf vastgelegd.
    const gezien: string[] = []
    const db = {
      prepare(sql: string) {
        gezien.push(sql)
        const api = { bind() { return api }, async first() { return null }, async run() { return { meta: {} } } }
        return api
      },
    } as unknown as D1Database
    await wisLid(db, 'lid-1')
    expect(gezien.join(' '), 'wisLid komt aan de bestellingen').not.toMatch(/bestelling/i)
  })
})

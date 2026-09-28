/**
 * De winkelknop en de worker moeten hetzelfde product bedoelen.
 *
 * Het adres van een product bij de betaalpartner is het laatste stuk van de
 * link: `venshipper.gumroad.com/l/sleutels` wordt `sleutels`. Dat woord staat
 * op drie plekken — in de link op de website, in de tabel van de worker, en
 * in de handleiding waarin staat hoe je het product aanmaakt — en die drie
 * zijn uit elkaar gelopen.
 *
 * `docs/WINKEL-INRICHTEN.md` zei `ebook`; de worker kende alleen `eboek`. Wie
 * zijn eigen handleiding volgde, kreeg bij elke verkoop een melding binnen
 * die de worker niet begreep. Een letter, op de dag dat de winkel opengaat.
 *
 * Deze test leest alle drie en vergelijkt ze. Hij weet niets van Gumroad: hij
 * weet alleen dat een naam die ergens beloofd wordt, herkend moet worden.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string) => readFileSync(pad, 'utf8')

/** De namen die de worker herkent, uit `REEKS_VAN` zelf. */
function bekendeNamen(): Set<string> {
  const bron = lees('server/src/koopbericht.ts')
  const blok = bron.slice(bron.indexOf('REEKS_VAN'), bron.indexOf('}', bron.indexOf('REEKS_VAN')))
  const namen = new Set<string>()
  for (const m of blok.matchAll(/^\s*'?([a-z-]+)'?\s*:/gm)) namen.add(m[1]!)
  // `sleutels` en `sba` mogen er ook rechtstreeks in; die komen uit onze
  // eigen proefposten en staan als uitzondering in de lus erboven.
  namen.add('sleutels')
  namen.add('sba')
  return namen
}

/** Het laatste stuk van een productadres, net als `slugVan` in de worker. */
const slug = (url: string) => url.replace(/\/+$/, '').split('/').pop()!.toLowerCase()

describe('de namen van de producten', () => {
  it('kent elk adres dat op de website staat', () => {
    const bekend = bekendeNamen()
    const links = [...lees('src/site/shop.ts').matchAll(/gumroad\.com\/l\/([a-z0-9-]+)/gi)]
    // Er moet er minstens één zijn, anders test dit niets.
    expect(links.length).toBeGreaterThan(0)
    for (const m of links) expect([...bekend], `de link /l/${m[1]}`).toContain(slug(m[1]!))
  })

  it('kent elke naam die de handleiding voorstelt', () => {
    const bekend = bekendeNamen()
    const doc = lees('docs/WINKEL-INRICHTEN.md')
    const regel = doc.split('\n').find((r) => r.includes('Zet de URL op'))
    expect(regel, 'de regel met de voorgestelde adressen').toBeTruthy()
    const voorgesteld = [...regel!.matchAll(/`([a-z0-9-]+)`/g)].map((m) => m[1]!)
    expect(voorgesteld.length).toBeGreaterThan(0)
    for (const naam of voorgesteld) expect([...bekend], `de handleiding noemt ${naam}`).toContain(naam)
  })
})

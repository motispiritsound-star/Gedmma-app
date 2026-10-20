import { describe, expect, it } from 'vitest'
import { TEKSTEN, vul } from './index'
import { TAALCODES, TALEN, isTaal, localeVan, vindTaal } from './talen'
import { MERK, noemtVerbodenNaam } from '../merk/merk'

/** Alle paden in een genest tekstobject, als `welkom.titel`. */
const paden = (o: unknown, voor = ''): string[] => {
  if (typeof o === 'string') return [voor]
  if (!o || typeof o !== 'object') return []
  return Object.entries(o as Record<string, unknown>)
    .flatMap(([k, v]) => paden(v, voor ? `${voor}.${k}` : k))
}

const bij = (o: unknown, pad: string): unknown =>
  pad.split('.').reduce<unknown>((a, k) => (a as Record<string, unknown>)?.[k], o)

describe('vertalingen', () => {
  it('heeft een bestand voor elke taal in de lijst', () => {
    for (const code of TAALCODES) expect(TEKSTEN[code], code).toBeDefined()
    expect(Object.keys(TEKSTEN).sort()).toEqual([...TAALCODES].sort())
  })

  it('heeft in elke taal precies dezelfde sleutels', () => {
    // Een ontbrekende sleutel is een leeg scherm; een extra sleutel is dode
    // tekst die niemand ooit ziet.
    const verwacht = paden(TEKSTEN.nl).sort()
    for (const code of TAALCODES) {
      expect(paden(TEKSTEN[code]).sort(), code).toEqual(verwacht)
    }
  })

  it('heeft nergens een lege of onvertaalde tekst', () => {
    for (const code of TAALCODES) {
      for (const pad of paden(TEKSTEN[code])) {
        const waarde = bij(TEKSTEN[code], pad)
        expect(typeof waarde, `${code}.${pad}`).toBe('string')
        expect((waarde as string).trim(), `${code}.${pad} is leeg`).toBeTruthy()
        expect(waarde, `${code}.${pad} is nog een plaatshouder`).not.toMatch(/^(TODO|TBD|\.\.\.)$/i)
      }
    }
  })

  it('laat geen Nederlandse tekst in een andere taal staan', () => {
    // Niet sluitend, maar het vangt de meest voorkomende fout: een regel
    // gekopieerd en vergeten te vertalen. Korte woorden slaan we over, want
    // `Start` is in het Duits en het Engels ook `Start`.
    const nlPaden = paden(TEKSTEN.nl)
    for (const code of TAALCODES.filter((c) => c !== 'nl')) {
      const zelfde = nlPaden.filter((pad) => {
        const a = bij(TEKSTEN.nl, pad) as string
        const b = bij(TEKSTEN[code], pad) as string
        return a === b && a.length > 14
      })
      expect(zelfde, `${code}: nog niet vertaald`).toEqual([])
    }
  })

  it('houdt dezelfde plaatshouders in elke taal', () => {
    // Een vertaling die `{dagen}` kwijtraakt, belooft "dagen gratis" zonder
    // getal. Een die er `{dag}` van maakt, laat de plaatshouder letterlijk op
    // het scherm staan.
    const vanTekst = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort()
    for (const pad of paden(TEKSTEN.nl)) {
      const verwacht = vanTekst(bij(TEKSTEN.nl, pad) as string)
      for (const code of TAALCODES) {
        expect(vanTekst(bij(TEKSTEN[code], pad) as string), `${code}.${pad}`).toEqual(verwacht)
      }
    }
  })
})

describe('de merknaam blijft buiten de vertalingen', () => {
  it('staat nergens letterlijk in een taalbestand', () => {
    // Daarom bestaat `{naam}`. Een vertaling die de naam letterlijk bevat,
    // moet opnieuw langs een vertaler als de naam ooit wijzigt -- en dat is
    // precies wat A-2 wil voorkomen.
    for (const code of TAALCODES) {
      for (const pad of paden(TEKSTEN[code])) {
        const waarde = bij(TEKSTEN[code], pad) as string
        if (pad === 'welkom.betekenis') continue // legt uit wat de naam betekent
        expect(waarde, `${code}.${pad} bevat de merknaam letterlijk`).not.toContain(MERK.naam)
      }
    }
  })

  it('noemt nergens de naam van de app waar de techniek van komt', () => {
    for (const code of TAALCODES) {
      for (const pad of paden(TEKSTEN[code])) {
        const waarde = bij(TEKSTEN[code], pad) as string
        expect(noemtVerbodenNaam(waarde), `${code}.${pad}`).toBeNull()
      }
    }
  })
})

describe('plaatshouders invullen', () => {
  it('vult de merknaam altijd in', () => {
    expect(vul('Welkom bij {naam}')).toBe(`Welkom bij ${MERK.naam}`)
  })

  it('vult meegegeven waarden in', () => {
    expect(vul('{dagen} dagen gratis, daarna {prijs}', { dagen: 3, prijs: '€ 59,99' }))
      .toBe('3 dagen gratis, daarna € 59,99')
  })

  it('laat een plaatshouder staan waar geen waarde voor is, zodat het opvalt', () => {
    // Stil vervangen door een lege string zou "dagen gratis" opleveren, en
    // dat is een belofte zonder getal. Liever zichtbaar fout dan onzichtbaar
    // fout.
    expect(vul('{dagen} dagen')).toBe('{dagen} dagen')
  })
})

describe('taal uit het toestel', () => {
  it('erkent alleen de talen die bestaan', () => {
    expect(isTaal('nl')).toBe(true)
    expect(isTaal('tr')).toBe(false)
    expect(isTaal(42)).toBe(false)
  })

  it('kiest de taal van het toestel als die er is', () => {
    expect(vindTaal(['de-DE', 'en'])).toBe('de')
    expect(vindTaal(['nl-BE'])).toBe('nl')
    expect(vindTaal(['fr-CH'])).toBe('fr')
  })

  it('valt op het land terug als de taal er niet is', () => {
    // Een Turks of Koerdisch ingestelde telefoon in Keulen hoort Duits te
    // krijgen en niet Engels.
    expect(vindTaal(['tr-DE'])).toBe('de')
    expect(vindTaal(['ku-NL'])).toBe('nl')
    expect(vindTaal(['ar-FR'])).toBe('fr')
  })

  it('geeft Engels als niets past', () => {
    expect(vindTaal(['ja-JP'])).toBe('en')
    expect(vindTaal([])).toBe('en')
  })

  it('zet Duits vooraan in de keuzelijst, want dat is de grootste groep', () => {
    expect(TALEN[0]!.code).toBe('de')
  })

  it('geeft een geldige locale per taal', () => {
    for (const code of TAALCODES) {
      expect(localeVan(code), code).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
    }
  })
})

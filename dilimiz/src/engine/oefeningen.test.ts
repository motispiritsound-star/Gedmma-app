import { describe, expect, it } from 'vitest'
import { maakHerhaalronde, maakRonde, RONDE_LENGTE } from './oefeningen'
import { HARMONIE_LES, LESSEN, les_ } from '../content/curriculum'
import { woord } from '../content/woorden'
import { LETTER } from '../content/letters'
import { KLANKPAAR } from '../content/klankparen'
import { zin } from '../content/zinnen'
import { SLEUTEL, isWoordKaart } from './srs'

const les = (id: string) => {
  const l = les_(id) ?? (id === HARMONIE_LES.id ? HARMONIE_LES : undefined)
  if (!l) throw new Error(`geen les ${id}`)
  return l
}

describe('een ronde uit een les', () => {
  it('levert oefeningen op voor elke les in het curriculum', () => {
    for (const l of LESSEN) {
      expect(maakRonde(l).length, l.id).toBeGreaterThan(0)
    }
  })

  it('geeft bij hetzelfde zaadje dezelfde ronde', () => {
    // Nodig om te kunnen testen, en nodig in de app: wie een les afbreekt en
    // terugkomt, hoort niet in een andere ronde te vallen.
    const a = maakRonde(les('merhaba-1'), { zaadje: 7 })
    const b = maakRonde(les('merhaba-1'), { zaadje: 7 })
    expect(a).toEqual(b)
  })

  it('geeft bij een ander zaadje een andere ronde', () => {
    const a = maakRonde(les('merhaba-1'), { zaadje: 1 })
    const b = maakRonde(les('merhaba-1'), { zaadje: 2 })
    expect(a).not.toEqual(b)
  })

  it('verwijst alleen naar inhoud die bestaat', () => {
    for (const l of LESSEN) {
      for (const o of maakRonde(l)) {
        if (o.woordId) expect(woord(o.woordId), `${l.id}/${o.id}`).toBeDefined()
        if (o.letterId) expect(LETTER(o.letterId), `${l.id}/${o.id}`).toBeDefined()
        if (o.klankpaarId) expect(KLANKPAAR(o.klankpaarId), `${l.id}/${o.id}`).toBeDefined()
        if (o.zinId) expect(zin(o.zinId), `${l.id}/${o.id}`).toBeDefined()
      }
    }
  })

  it('zet het goede antwoord altijd tussen de keuzes', () => {
    for (const l of LESSEN) {
      for (const o of maakRonde(l)) {
        if (!o.keuzes) continue
        const goed = o.woordId ?? o.letterId ?? o.zinId ?? o.antwoord
        expect(o.keuzes, `${l.id}/${o.id} (${o.soort})`).toContain(goed)
      }
    }
  })

  it('geeft minstens drie keuzes waar er keuzes zijn', () => {
    // Twee keuzes is een munt opgooien. Uitzondering: `harmonie` bij een
    // meervoud heeft er maar twee, en dat is precies de vraag -- a of e.
    for (const l of LESSEN) {
      for (const o of maakRonde(l)) {
        if (!o.keuzes || o.soort === 'harmonie') continue
        expect(o.keuzes.length, `${l.id}/${o.id}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('heeft geen dubbele keuzes', () => {
    for (const l of LESSEN) {
      for (const o of maakRonde(l)) {
        if (!o.keuzes) continue
        expect(new Set(o.keuzes).size, `${l.id}/${o.id}`).toBe(o.keuzes.length)
      }
    }
  })

  it('oefent elk woord van de les minstens twee keer', () => {
    // Eén keer is een gok die ook met geluk goed gaat. Twee verschillende
    // vormen is wat het laat blijven zitten.
    for (const l of LESSEN.filter((x) => x.woorden.length && x.soort === 'woorden')) {
      const ronde = maakRonde(l, { hoogstens: 999 })
      for (const id of l.woorden) {
        const keren = ronde.filter((o) => o.woordId === id).length
        expect(keren, `${l.id}: ${id} komt ${keren}x`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('laat de leerkaart weg voor wat al bekend is', () => {
    const bekend = new Set(['merhaba', 'selam'])
    const ronde = maakRonde(les('merhaba-1'), { bekend })
    const nieuw = ronde.filter((o) => o.soort === 'nieuw').map((o) => o.woordId)
    expect(nieuw).not.toContain('merhaba')
    expect(nieuw).not.toContain('selam')
    expect(nieuw).toContain('gunaydin')
  })

  it('gebruikt in een toets geen leerkaarten en geen herkenningsvragen', () => {
    // Een toets hoort te meten of je het kunt produceren, niet of je het
    // herkent tussen drie andere woorden.
    const ronde = maakRonde(les('merhaba-toets'), { hoogstens: 999 })
    expect(ronde.some((o) => o.soort === 'nieuw')).toBe(false)
    expect(ronde.some((o) => o.soort === 'kies-betekenis')).toBe(false)
  })

  it('houdt zich aan de bovengrens', () => {
    expect(maakRonde(les('aile-toets'), { hoogstens: 8 })).toHaveLength(8)
  })

  it('laat typen weg als dat uitstaat', () => {
    const ronde = maakRonde(les('merhaba-1'), { typen: false, hoogstens: 999 })
    expect(ronde.some((o) => o.soort === 'tik')).toBe(false)
  })

  it('laat spreken weg als dat uitstaat', () => {
    const ronde = maakRonde(les('aile-1'), { spreken: false, hoogstens: 999 })
    expect(ronde.some((o) => o.soort === 'spreek')).toBe(false)
  })

  it('kan een ronde maken met typen én spreken uit, zoals in de groep klein', () => {
    for (const l of LESSEN) {
      const ronde = maakRonde(l, { typen: false, spreken: false })
      expect(ronde.length, l.id).toBeGreaterThan(0)
    }
  })

  it('geeft elke oefening een unieke id binnen de ronde', () => {
    for (const l of LESSEN) {
      const ids = maakRonde(l).map((o) => o.id)
      expect(new Set(ids).size, l.id).toBe(ids.length)
    }
  })
})

describe('de Turks-eigen oefenvormen', () => {
  it('oefent een klankpaar beide kanten op, zodat gokken niet werkt', () => {
    const ronde = maakRonde(les('harfler-2'), { hoogstens: 999 })
    const paren = ronde.filter((o) => o.soort === 'klankpaar')
    expect(paren.length).toBeGreaterThan(0)
    for (const id of les('harfler-2').klankparen ?? []) {
      const kanten = paren.filter((o) => o.klankpaarId === id).map((o) => o.kant)
      expect(new Set(kanten), id).toEqual(new Set(['links', 'rechts']))
    }
  })

  it('stelt bij harmonie nooit een vraag met één keuze', () => {
    const ronde = maakRonde(HARMONIE_LES, { hoogstens: 999 })
    for (const o of ronde.filter((x) => x.soort === 'harmonie')) {
      expect(o.keuzes!.length, o.regelId).toBeGreaterThan(1)
      expect(o.keuzes, o.regelId).toContain(o.antwoord)
    }
  })

  it('sluit de harmonieles af met een plakoefening', () => {
    const ronde = maakRonde(HARMONIE_LES, { hoogstens: 999 })
    const plak = ronde.filter((o) => o.soort === 'plak')
    expect(plak).toHaveLength(1)
    expect(plak[0]!.antwoord).toBeTruthy()
    // De tegels bevatten alle stukjes van het antwoord, plus ruis.
    expect(plak[0]!.tegels!.length).toBeGreaterThan(2)
  })

  it('houdt harmonie en plakken buiten de herhaalplanner', () => {
    // Ze oefenen een regel en geen item. Een regel in de planner zou een
    // kaart "okul-in" opleveren die naast de woordkaarten gaat meetellen.
    const ronde = maakRonde(HARMONIE_LES, { hoogstens: 999 })
    for (const o of ronde.filter((x) => x.soort === 'harmonie' || x.soort === 'plak')) {
      expect(o.kaartId, o.id).toBe('')
    }
  })

  it('zet letters, zinnen en klankparen onder hun eigen voorvoegsel', () => {
    for (const l of LESSEN) {
      for (const o of maakRonde(l)) {
        if (o.letterId) expect(o.kaartId).toBe(SLEUTEL.letter(o.letterId))
        if (o.zinId) expect(o.kaartId).toBe(SLEUTEL.zin(o.zinId))
        if (o.klankpaarId) expect(o.kaartId).toBe(SLEUTEL.klankpaar(o.klankpaarId))
        if (o.woordId) expect(isWoordKaart(o.kaartId), o.id).toBe(true)
      }
    }
  })

  it('kent geen natekenen en geen lettervormen -- dat is de andere taal', () => {
    const soorten = new Set(LESSEN.flatMap((l) => maakRonde(l, { hoogstens: 999 })).map((o) => o.soort))
    for (const weg of ['schrijf', 'letter-schrijf', 'letter-vorm', 'script']) {
      expect([...soorten], weg).not.toContain(weg)
    }
  })
})

describe('de herhaalronde', () => {
  it('maakt oefeningen van woorden, letters, zinnen en klankparen', () => {
    const ronde = maakHerhaalronde(
      ['merhaba', SLEUTEL.letter('i-dotless'), SLEUTEL.zin('merhaba-1'), SLEUTEL.klankpaar('kil-kil')],
      { zaadje: 3 },
    )
    expect(ronde).toHaveLength(4)
    expect(ronde.map((o) => o.soort).some((s) => s === 'letter-klank')).toBe(true)
    expect(ronde.map((o) => o.soort).some((s) => s === 'klankpaar')).toBe(true)
  })

  it('slaat een kaart over waarvan de inhoud niet meer bestaat', () => {
    // Zo gaat een opslag van een oudere versie niet om een woord dat uit de
    // cursus gehaald is.
    const ronde = maakHerhaalronde(['bestaat-niet', 'l:ook-niet', 'merhaba'], { zaadje: 1 })
    expect(ronde).toHaveLength(1)
    expect(ronde[0]!.kaartId).toBe('merhaba')
  })

  it('gebruikt geen leerkaarten', () => {
    const ronde = maakHerhaalronde(['merhaba', 'selam', 'gunaydin'], { zaadje: 5 })
    expect(ronde.some((o) => o.soort === 'nieuw')).toBe(false)
  })

  it('houdt zich aan de bovengrens', () => {
    const veel = Array.from({ length: 40 }, (_, i) => `w${i}`)
    expect(maakHerhaalronde([...veel, 'merhaba'], { hoogstens: 5 }).length).toBeLessThanOrEqual(5)
  })

  it('heeft een rondelengte per leeftijdsgroep, kort voor de kleinsten', () => {
    expect(RONDE_LENGTE.klein).toBeLessThan(RONDE_LENGTE.midden)
    expect(RONDE_LENGTE.midden).toBeLessThan(RONDE_LENGTE.groot)
  })
})

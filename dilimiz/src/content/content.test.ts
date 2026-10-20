import { describe, expect, it } from 'vitest'
import { TALEN } from './types'
import { WOORDEN, woord } from './woorden'
import { LETTERS, LASTIGE_LETTERS, LETTERGROEPEN } from './letters'
import { KLANKPAREN, KLANKPAAR } from './klankparen'
import { ZINNEN, tegelsVan } from './zinnen'
import { LESSEN, PAD, UNITS, HARMONIE_LES } from './curriculum'
import { HARMONIE_OEFENINGEN, PLAK_OEFENINGEN, harmonieOefening } from './achtervoegsels'
import { harmonieVraag, naarId } from '../engine/turks'

describe('woorden', () => {
  it('heeft unieke ids', () => {
    const ids = WOORDEN.map((w) => w.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('heeft ids die uit het Turks volgen, zodat niemand ze met de hand verzint', () => {
    for (const w of WOORDEN) expect(w.id, w.tr).toBe(naarId(w.tr))
  })

  it('heeft ids die alleen a-z, 0-9 en streepjes bevatten', () => {
    // Ids staan in de opslag op het toestel. Een diakriet erin is een
    // coderingsprobleem dat pas bij een gebruiker opvalt.
    for (const w of WOORDEN) expect(w.id).toMatch(/^[a-z0-9-]+$/)
  })

  it('heeft een betekenis in elke interfacetaal', () => {
    for (const w of WOORDEN) {
      for (const taal of TALEN) {
        expect(w.betekenis[taal]?.trim(), `${w.id} / ${taal}`).toBeTruthy()
      }
    }
  })

  it('heeft een volledige uitleg waar er een uitleg is', () => {
    // Half vertaalde uitleg is erger dan geen uitleg: dan staat er Nederlands
    // op een Frans scherm.
    for (const w of WOORDEN.filter((x) => x.gebruik)) {
      for (const taal of TALEN) {
        expect(w.gebruik![taal]?.trim(), `${w.id} / ${taal}`).toBeTruthy()
      }
    }
  })

  it('heeft Turkse tekst zonder letters die het Turks niet heeft', () => {
    // q, w en x bestaan niet in het Turkse alfabet. Staat er een, dan is het
    // een typefout of een woord uit een andere taal.
    for (const w of WOORDEN) {
      expect(w.tr, w.id).not.toMatch(/[qwxQWX]/)
    }
  })
})

describe('letters', () => {
  it('heeft precies de 29 letters van het Turkse alfabet', () => {
    expect(LETTERS).toHaveLength(29)
  })

  it('heeft geen q, w of x', () => {
    for (const l of LETTERS) expect('qwx').not.toContain(l.klein)
  })

  it('heeft unieke ids, ook voor c/ç en ı/i', () => {
    const ids = LETTERS.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('zet de hoofdletter van i op İ en van ı op I', () => {
    // Dit is het hele punt van de unit. Een lijst die hier `I` en `i` zegt,
    // leert een kind precies het omgekeerde van wat waar is.
    expect(LETTERS.find((l) => l.id === 'i-dotted')!.hoofd).toBe('İ')
    expect(LETTERS.find((l) => l.id === 'i-dotless')!.hoofd).toBe('I')
    expect(LETTERS.find((l) => l.id === 'i-dotless')!.klein).toBe('ı')
  })

  it('markeert precies de zes lastige letters', () => {
    const lastig = LASTIGE_LETTERS.map((l) => l.klein).sort()
    expect(lastig).toEqual(['c', 'i', 'ç', 'ö', 'ü', 'ğ', 'ı', 'ş'].sort())
  })

  it('heeft klankbeschrijvingen die achter het label "Klinkt" passen', () => {
    /*
     * Het scherm zet "Klinkt" en dan deze tekst, dus moet elke beschrijving
     * met het voegwoord beginnen: "als de a in kat".
     *
     * Deze test bestaat omdat er "Klinkt als als dzj" op het scherm stond --
     * het label zei "Klinkt als" en de tekst begon er ook mee. Gevonden met
     * een rooktest in een echte browser, niet met een unittest, en daarom
     * staat de unittest er nu.
     */
    const voegwoord: Record<string, string> = { nl: 'als ', de: 'wie ', fr: 'comme ', en: 'like ' }
    for (const l of LETTERS) {
      for (const taal of TALEN) {
        expect(l.klank[taal], `${l.id} / ${taal}`).toMatch(new RegExp(`^${voegwoord[taal]}`))
      }
    }
  })

  it('heeft een klankbeschrijving in elke taal', () => {
    for (const l of LETTERS) {
      for (const taal of TALEN) {
        expect(l.klank[taal]?.trim(), `${l.id} / ${taal}`).toBeTruthy()
      }
    }
  })

  it('verwijst in de lesgroepen alleen naar letters en klankparen die bestaan', () => {
    for (const groep of LETTERGROEPEN) {
      for (const id of groep.letters) {
        expect(LETTERS.some((l) => l.id === id), `letter ${id}`).toBe(true)
      }
      for (const id of groep.klankparen) {
        expect(KLANKPAAR(id), `klankpaar ${id}`).toBeDefined()
      }
    }
  })

  it('neemt elke lastige letter ergens in een lesgroep op', () => {
    const inLes = new Set(LETTERGROEPEN.flatMap((g) => g.letters))
    for (const l of LASTIGE_LETTERS) {
      expect(inLes.has(l.id), `${l.klein} (${l.id}) komt in geen les voor`).toBe(true)
    }
  })
})

describe('klankparen', () => {
  it('heeft unieke ids', () => {
    const ids = KLANKPAREN.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('heeft twee verschillende woorden per paar', () => {
    for (const p of KLANKPAREN) expect(p.links.tr, p.id).not.toBe(p.rechts.tr)
  })

  it('verschilt bij een minimaal paar in precies één letter', () => {
    // Dat is wat `minimaal` betekent. Klopt het niet, dan hoort het paar als
    // `contrast` gemarkeerd te staan -- en dat is de eerlijke variant, niet
    // een foutje.
    for (const p of KLANKPAREN.filter((x) => x.soort === 'minimaal')) {
      const a = [...p.links.tr]
      const b = [...p.rechts.tr]
      expect(a.length, `${p.id}: even lang`).toBe(b.length)
      const verschillen = a.filter((c, i) => c !== b[i]).length
      expect(verschillen, `${p.id}: één letter verschil`).toBe(1)
    }
  })

  it('oefent de twee letters die het paar belooft', () => {
    for (const p of KLANKPAREN.filter((x) => x.soort === 'minimaal')) {
      const [links, rechts] = p.letters
      expect(p.links.tr, p.id).toContain(links)
      expect(p.rechts.tr, p.id).toContain(rechts)
    }
  })

  it('heeft een betekenis in elke taal, voor beide woorden', () => {
    for (const p of KLANKPAREN) {
      for (const taal of TALEN) {
        expect(p.links.betekenis[taal]?.trim(), `${p.id} links / ${taal}`).toBeTruthy()
        expect(p.rechts.betekenis[taal]?.trim(), `${p.id} rechts / ${taal}`).toBeTruthy()
      }
    }
  })

  it('oefent elk van de vijf lastige klankverschillen minstens één keer', () => {
    const geoefend = new Set(KLANKPAREN.flatMap((p) => p.letters))
    for (const letter of ['ç', 'ş', 'ı', 'ö', 'ü', 'ğ']) {
      expect(geoefend.has(letter), `geen paar voor ${letter}`).toBe(true)
    }
  })
})

describe('zinnen', () => {
  it('heeft unieke ids', () => {
    const ids = ZINNEN.map((z) => z.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('hoort bij een les die bestaat', () => {
    for (const z of ZINNEN) {
      expect(LESSEN.some((l) => l.id === z.lesId), `${z.id} -> ${z.lesId}`).toBe(true)
    }
  })

  it('heeft een betekenis in elke taal', () => {
    for (const z of ZINNEN) {
      for (const taal of TALEN) {
        expect(z.betekenis[taal]?.trim(), `${z.id} / ${taal}`).toBeTruthy()
      }
    }
  })

  it('heeft volledige hulpwoorden waar die er zijn', () => {
    for (const z of ZINNEN.filter((x) => x.hulpwoorden?.length)) {
      for (const hw of z.hulpwoorden!) {
        for (const taal of TALEN) {
          expect(hw.betekenis[taal]?.trim(), `${z.id} / ${hw.tr} / ${taal}`).toBeTruthy()
        }
      }
    }
  })

  it('levert minstens twee tegels per zin op, anders is de bouwoefening geen puzzel', () => {
    for (const z of ZINNEN) {
      expect(tegelsVan(z.tr).length, z.id).toBeGreaterThan(1)
    }
  })
})

describe('curriculum', () => {
  it('heeft unieke les-ids over alle units', () => {
    const ids = LESSEN.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('verwijst alleen naar woorden die bestaan', () => {
    for (const l of LESSEN) {
      for (const id of l.woorden) {
        expect(woord(id), `les ${l.id} -> woord ${id}`).toBeDefined()
      }
    }
  })

  it('verwijst alleen naar letters en klankparen die bestaan', () => {
    for (const l of LESSEN) {
      for (const id of l.letters ?? []) {
        expect(LETTERS.some((x) => x.id === id), `les ${l.id} -> letter ${id}`).toBe(true)
      }
      for (const id of l.klankparen ?? []) {
        expect(KLANKPAAR(id), `les ${l.id} -> klankpaar ${id}`).toBeDefined()
      }
    }
  })

  it('onderwijst elk woord uit de woordenlijst ergens', () => {
    // Een woord dat in geen les voorkomt, komt alleen in het woordenboek
    // terecht en wordt nooit geoefend. Dat is dode inhoud.
    const onderwezen = new Set(LESSEN.flatMap((l) => l.woorden))
    const verweesd = WOORDEN.filter((w) => !onderwezen.has(w.id)).map((w) => w.id)
    expect(verweesd).toEqual([])
  })

  it('geeft elke unit een toets met alles erin', () => {
    for (const u of UNITS) {
      const toets = u.lessen.at(-1)!
      expect(toets.soort, u.id).toBe('toets')
      const uitLessen = new Set(u.lessen.slice(0, -1).flatMap((l) => l.woorden))
      for (const id of uitLessen) {
        expect(toets.woorden, `${u.id}: ${id} niet in de toets`).toContain(id)
      }
    }
  })

  it('vraagt in een toets niets wat niet is onderwezen', () => {
    for (const u of UNITS) {
      const toets = u.lessen.at(-1)!
      const uitLessen = new Set(u.lessen.slice(0, -1).flatMap((l) => l.woorden))
      for (const id of toets.woorden) {
        expect(uitLessen.has(id), `${u.id}: toets vraagt ${id}, nergens onderwezen`).toBe(true)
      }
    }
  })

  it('heeft een pad dat bij de eerste unit begint en geen gaten heeft', () => {
    expect(PAD[0]!.unit.id).toBe('harfler')
    expect(PAD).toHaveLength(LESSEN.length)
  })

  it('heeft per unit titel, ondertitel en gezinsopdracht in elke taal', () => {
    for (const u of UNITS) {
      for (const taal of TALEN) {
        expect(u.titel[taal]?.trim(), `${u.id} titel / ${taal}`).toBeTruthy()
        expect(u.ondertitel[taal]?.trim(), `${u.id} ondertitel / ${taal}`).toBeTruthy()
        expect(u.gezinsopdracht?.[taal]?.trim(), `${u.id} gezinsopdracht / ${taal}`).toBeTruthy()
      }
    }
  })

  it('heeft volledige lestitels en volledige tips', () => {
    for (const l of LESSEN) {
      for (const taal of TALEN) {
        expect(l.titel[taal]?.trim(), `${l.id} titel / ${taal}`).toBeTruthy()
        if (l.tip) {
          expect(l.tip.titel[taal]?.trim(), `${l.id} tip-titel / ${taal}`).toBeTruthy()
          expect(l.tip.tekst[taal]?.trim(), `${l.id} tip-tekst / ${taal}`).toBeTruthy()
        }
      }
    }
  })

  it('begint met letters en komt dan pas bij woorden', () => {
    // Een kind dat `cam` als "kam" leest, leest de hele cursus verkeerd.
    const eerste = UNITS[0]!
    expect(eerste.lessen.some((l) => (l.letters?.length ?? 0) > 0)).toBe(true)
    expect(UNITS[1]!.lessen[0]!.woorden.length).toBeGreaterThan(0)
  })
})

describe('harmonie en plakken', () => {
  it('oefent alle vier de klinkergroepen, zodat niemand -ler als vaste regel leert', () => {
    const uitkomsten = new Set(
      HARMONIE_OEFENINGEN
        .filter((o) => o.soort === 'mijn')
        .map((o) => harmonieVraag(o.woord, 'mijn').goed.slice(-2, -1)),
    )
    // ı, i, u, ü moeten alle vier voorkomen -- plus de losse `m` na een
    // klinker, die een andere letter oplevert.
    for (const k of ['ı', 'i', 'u', 'ü']) {
      expect(uitkomsten.has(k), `geen mijn-oefening met ${k}`).toBe(true)
    }
  })

  it('oefent ook de stemloze t-vorm', () => {
    const inVormen = HARMONIE_OEFENINGEN
      .filter((o) => o.soort === 'in')
      .map((o) => harmonieVraag(o.woord, 'in').goed)
    expect(inVormen.some((v) => v.endsWith('ta') || v.endsWith('te'))).toBe(true)
    expect(inVormen.some((v) => v.endsWith('da') || v.endsWith('de'))).toBe(true)
  })

  it('heeft unieke oefening-ids', () => {
    const ids = HARMONIE_OEFENINGEN.map((o) => o.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('verwijst in de harmonieles alleen naar oefeningen die bestaan', () => {
    for (const id of HARMONIE_LES.harmonieOefeningen ?? []) {
      expect(harmonieOefening(id), `harmonieles -> ${id}`).toBeDefined()
    }
  })

  it('verdeelt de harmonieles over meer dan één klinkergroep', () => {
    // Een les met alleen `ev` en `kardeş` leert dat het altijd -de is.
    const uitkomsten = (HARMONIE_LES.harmonieOefeningen ?? [])
      .map((id) => harmonieOefening(id)!)
      .map((o) => harmonieVraag(o.woord, o.soort).goed.slice(-2))
    expect(new Set(uitkomsten).size).toBeGreaterThan(2)
  })

  it('bouwt elke plakoefening stap voor stap op uit de vorige', () => {
    for (const o of PLAK_OEFENINGEN) {
      let tot = o.stam
      for (const stap of o.stappen) {
        tot += stap.deel
        expect(stap.heel, `${o.id}: ${stap.deel}`).toBe(tot)
      }
    }
  })

  it('geeft bij elke plakoefening ruis die niet in het antwoord zit', () => {
    // Zonder ruis is de oefening te doen door de tegels te tellen.
    for (const o of PLAK_OEFENINGEN) {
      expect(o.ruis.length, o.id).toBeGreaterThan(0)
      const juist = new Set(o.stappen.map((s) => s.deel))
      for (const r of o.ruis) expect(juist.has(r), `${o.id}: ruis ${r} is juist`).toBe(false)
    }
  })

  it('heeft een betekenis in elke taal bij elke stap', () => {
    for (const o of PLAK_OEFENINGEN) {
      for (const stap of o.stappen) {
        for (const taal of TALEN) {
          expect(stap.betekenis[taal]?.trim(), `${o.id} / ${stap.deel} / ${taal}`).toBeTruthy()
        }
      }
    }
  })
})

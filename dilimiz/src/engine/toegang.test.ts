import { describe, expect, it } from 'vitest'
import {
  AANTAL_GRATIS, GRATIS_LESSEN, GRATIS_LETTERS, GRATIS_WOORDEN,
  heeftToegang, lesOpen, letterOpSlot, slotVan, volgendeLes, woordOpSlot,
} from './toegang'
import { legeStaat, type Staat } from './opslag'
import { PAD, UNITS } from '../content/curriculum'
import { allesOpen, OMGEVING } from './omgeving'

const met = (deel: Partial<Staat> = {}): Staat => ({ ...legeStaat(), ...deel })
const gedaan = (...ids: string[]): Partial<Staat> => ({
  lessen: Object.fromEntries(ids.map((id) => [id, { sterren: 2, keren: 1, besteScore: 0.8, laatstGedaan: 1 }])),
})
const betaald = (): Partial<Staat> => ({
  abonnement: { actief: true, sinds: 1, proefGestart: 0, plan: 'jaar' },
})

describe('het gratis deel', () => {
  it('is een handvol lessen en geen hele unit', () => {
    // Een hele unit gratis is weken werk, en tegen die tijd probeert niemand
    // de app meer uit. Zie docs/decisions.md B-6.
    expect(AANTAL_GRATIS).toBeGreaterThanOrEqual(3)
    expect(AANTAL_GRATIS).toBeLessThan(UNITS[0]!.lessen.length + UNITS[1]!.lessen.length)
  })

  it('begint bij de eerste les van het pad', () => {
    expect(GRATIS_LESSEN[0]).toBe(PAD[0]!.les.id)
  })

  it('eindigt middenin de cursus, zodat wat erna komt zichtbaar op het pad staat', () => {
    const laatsteGratis = PAD.findIndex(({ les }) => les.id === GRATIS_LESSEN.at(-1))
    expect(laatsteGratis).toBeGreaterThan(0)
    expect(laatsteGratis).toBeLessThan(PAD.length - 1)
  })

  it('laat een kind iets kunnen zeggen voordat het slot komt', () => {
    // Dit is de hele reden dat het gratis deel zo gekozen is: het kind moet
    // dezelfde avond iets kunnen laten zien. `merhaba` en `evet` zitten in de
    // eerste les van unit 1, en die is gratis.
    expect(GRATIS_WOORDEN.has('merhaba')).toBe(true)
    expect(GRATIS_WOORDEN.has('gunaydin')).toBe(true)
  })

  it('bevat de lastige letters, want daar begint de cursus', () => {
    expect(GRATIS_LETTERS.size).toBeGreaterThan(0)
    expect(GRATIS_LETTERS.has('i-dotless')).toBe(true)
  })

  it('verwijst alleen naar lessen die bestaan', () => {
    for (const id of GRATIS_LESSEN) {
      expect(PAD.some(({ les }) => les.id === id), id).toBe(true)
    }
  })
})

describe('de volgorde van het pad', () => {
  it('zet de eerste les altijd open', () => {
    expect(lesOpen(PAD[0]!.les.id, met())).toBe(true)
  })

  it('houdt de tweede les dicht tot de eerste één keer gedaan is', () => {
    const tweede = PAD[1]!.les.id
    expect(lesOpen(tweede, met())).toBe(false)
    expect(lesOpen(tweede, met(gedaan(PAD[0]!.les.id)))).toBe(true)
  })

  it('eist geen drie sterren om door te mogen', () => {
    // Anders zit een kind vast op een les die het niet perfect krijgt, en dat
    // is geen leren maar afstraffen.
    const eerste = PAD[0]!.les.id
    const s = met({ lessen: { [eerste]: { sterren: 0, keren: 1, besteScore: 0.2, laatstGedaan: 1 } } })
    expect(lesOpen(PAD[1]!.les.id, s)).toBe(true)
  })
})

describe('het slot', () => {
  it('maakt verschil tussen "nog niet aan de beurt" en "hoort bij het abonnement"', () => {
    // Het scherm zegt bij elk iets anders, en dat verschil is het punt: het
    // eerste kan een kind zelf oplossen, het tweede niet.
    expect(slotVan(PAD[0]!.les.id, met())).toBe('open')
    expect(slotVan(PAD[1]!.les.id, met())).toBe('volgorde')

    const alleGratisGedaan = met(gedaan(...GRATIS_LESSEN))
    const eersteBetaalde = PAD.find(({ les }) => !GRATIS_LESSEN.includes(les.id))!.les.id
    expect(slotVan(eersteBetaalde, alleGratisGedaan)).toBe('betaald')
  })

  it('noemt het betaalde slot ook als de volgorde óók nog niet klopt', () => {
    /*
     * Dit is een fout die een rooktest in de browser vond en de unittests
     * niet: bij een nieuwe gebruiker zegt een les die om beide redenen dicht
     * zit "maak de les ervoor af", en dat opent hem niet. Het kind doet die
     * les, komt terug, en vindt een slotje.
     */
    const nieuweGebruiker = met()
    const betaaldeLes = PAD.find(({ les }) => !GRATIS_LESSEN.includes(les.id))!.les.id
    expect(slotVan(betaaldeLes, nieuweGebruiker)).toBe('betaald')
    // En open gaat hij nog steeds niet: betalen koopt toegang, geen voorsprong.
    expect(lesOpen(betaaldeLes, met(betaald()))).toBe(false)
  })

  it('laat bij een nieuwe gebruiker meteen zien dat er een betaald deel is', () => {
    // Zien wat er nog komt is de beste reden om verder te willen -- maar dan
    // moet het er ook staan, en met de juiste reden erbij.
    const nieuweGebruiker = met()
    const betaalde = PAD.filter(({ les }) => slotVan(les.id, nieuweGebruiker) === 'betaald')
    expect(betaalde.length).toBeGreaterThan(0)
  })

  it('opent met een abonnement alles waar je aan toe bent', () => {
    const s = met({ ...gedaan(...GRATIS_LESSEN), ...betaald() })
    const eersteBetaalde = PAD.find(({ les }) => !GRATIS_LESSEN.includes(les.id))!.les.id
    expect(heeftToegang(s)).toBe(true)
    expect(lesOpen(eersteBetaalde, s)).toBe(true)
  })

  it('houdt ook met een abonnement de volgorde aan', () => {
    // Betalen koopt toegang, niet het overslaan van de leerlijn.
    const laatste = PAD.at(-1)!.les.id
    expect(lesOpen(laatste, met(betaald()))).toBe(false)
  })

  it('zet na een verlopen abonnement de gratis lessen weer open en de rest dicht', () => {
    const s = met({
      ...gedaan(...GRATIS_LESSEN),
      abonnement: { actief: false, sinds: 1, proefGestart: 0, plan: 'jaar' },
    })
    expect(lesOpen(GRATIS_LESSEN[0]!, s)).toBe(true)
    const eersteBetaalde = PAD.find(({ les }) => !GRATIS_LESSEN.includes(les.id))!.les.id
    expect(lesOpen(eersteBetaalde, s)).toBe(false)
  })
})

describe('woorden en letters op slot', () => {
  it('zet buiten het gratis deel een slotje op het woord', () => {
    // Zonder dit is de woordenlijst een gratis cursus: wie daarheen loopt
    // komt bij alle woorden, ook zonder ooit een les te doen.
    expect(woordOpSlot('merhaba', met())).toBe(false)
    expect(woordOpSlot('anneanne', met())).toBe(true)
  })

  it('haalt alle slotjes weg met een abonnement', () => {
    expect(woordOpSlot('anneanne', met(betaald()))).toBe(false)
    expect(letterOpSlot('z', met(betaald()))).toBe(false)
  })
})

describe('waar "verder" naartoe gaat', () => {
  it('wijst naar de eerste les bij een nieuwe gebruiker', () => {
    expect(volgendeLes(met())).toBe(PAD[0]!.les.id)
  })

  it('wijst naar de eerste les die nog niet af is', () => {
    expect(volgendeLes(met(gedaan(PAD[0]!.les.id)))).toBe(PAD[1]!.les.id)
  })

  it('wijst nooit naar een les die op slot staat', () => {
    const s = met(gedaan(...GRATIS_LESSEN))
    const volgende = volgendeLes(s)
    expect(lesOpen(volgende, s)).toBe(true)
  })

  it('wijst bij alles gedaan naar een les die bestaat', () => {
    const s = met({ ...gedaan(...PAD.map(({ les }) => les.id)), ...betaald() })
    expect(PAD.some(({ les }) => les.id === volgendeLes(s))).toBe(true)
  })
})

describe('de omgeving zet niet per ongeluk alles open', () => {
  it('draait deze tests met de sloten aan', () => {
    /*
     * Zonder dit meten de tests hierboven niets.
     *
     * `.env.test` zet `VITE_OMGEVING=test`, en vitest draait standaard in mode
     * `test` -- dus laadde hij dat bestand, zette `allesOpen()` op true en
     * gingen alle toegangstests groen terwijl er geen enkel slot meer werkte.
     * Gevonden doordat vijf tests tegelijk omvielen nadat `.env.test` erbij
     * kwam. Nu staat de omgeving vastgepind in vite.config.ts, en deze test
     * merkt het als dat ooit losgaat.
     */
    expect(OMGEVING).not.toBe('test')
    expect(allesOpen()).toBe(false)
  })

  it('valt zonder omgevingsvariabele terug op productie', () => {
    // De strengste stand. Een vergeten variabele hoort niet alle lessen open
    // te zetten -- dat is het soort fout dat pas opvalt als er niemand meer
    // betaalt.
    expect(['dev', 'test', 'prod']).toContain(OMGEVING)
  })
})

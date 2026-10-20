// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  alsTekst, antwoord, haalStaat, laad, legeStaat, migreer, nieuweReeks, rondLesAf,
  vandaag, wisAlles, zetInstelling, zetProfiel, zetStaat, zetTerug, XP_PER_GOED,
  _zetTerugVoorTest,
} from './opslag'
import { MERK } from '../merk/merk'
import { SLEUTEL } from './srs'

beforeEach(() => {
  localStorage.clear()
  _zetTerugVoorTest()
})

describe('de lege staat', () => {
  it('heeft geen naam, geen voortgang en geen abonnement', () => {
    const s = legeStaat()
    expect(s.profiel.naam).toBe('')
    expect(s.xp).toBe(0)
    expect(s.abonnement.actief).toBe(false)
    expect(Object.keys(s.kaarten)).toEqual([])
  })

  it('zet meldingen uit', () => {
    // Een app die bij de eerste start om meldingstoestemming vraagt, krijgt
    // van de helft van de ouders nee -- en die nee is moeilijk terug te
    // draaien.
    expect(legeStaat().instellingen.herinnering).toBe(false)
  })
})

describe('migreren', () => {
  it('maakt van rommel een geldige staat in plaats van om te vallen', () => {
    // Dit is waarom deze functie bestaat. Bij de vorige app was een veld dat
    // later bijkwam `undefined` bij iedereen die de app al had, en het eerste
    // Object.keys erop liet het scherm omvallen -- met een wit scherm en
    // voortgang die niet terug te halen was, want er is geen server.
    for (const rommel of [null, undefined, 42, 'tekst', [], {}]) {
      const s = migreer(rommel)
      expect(s.versie).toBe(1)
      expect(typeof s.instellingen.taal).toBe('string')
      expect(s.lessen).toEqual({})
      expect(s.abonnement.actief).toBe(false)
    }
  })

  it('vult velden aan die in een oudere opslag ontbraken', () => {
    const oud = { versie: 1, xp: 120, profiel: { naam: 'Deniz' } }
    const s = migreer(oud)
    expect(s.xp).toBe(120)
    expect(s.profiel.naam).toBe('Deniz')
    expect(s.profiel.groep).toBe('midden')
    expect(s.tipsGezien).toEqual([])
    expect(s.extraKaarten).toEqual({})
  })

  it('zet een onbekende waarde terug op iets geldigs', () => {
    const s = migreer({
      instellingen: { taal: 'xx', accent: 'knalroze', thema: 'regenboog', lezen: 'onzin' },
      profiel: { groep: 'reus' },
    })
    expect(['nl', 'de', 'fr', 'en']).toContain(s.instellingen.taal)
    expect(s.instellingen.accent).toBe('cini')
    expect(s.instellingen.thema).toBe('systeem')
    expect(s.instellingen.lezen).toBe('gewoon')
    expect(s.profiel.groep).toBe('midden')
  })

  it('kapt een belachelijk lange naam af in plaats van hem te bewaren', () => {
    const s = migreer({ profiel: { naam: 'a'.repeat(500) } })
    expect(s.profiel.naam.length).toBeLessThanOrEqual(24)
  })

  it('houdt sterren en sterkte binnen hun grenzen', () => {
    const s = migreer({
      lessen: { 'merhaba-1': { sterren: 99 } },
      kaarten: { merhaba: { sterkte: 5 } },
    })
    expect(s.lessen['merhaba-1']!.sterren).toBe(3)
    expect(s.kaarten.merhaba!.sterkte).toBe(1)
  })

  it('zet het abonnement nooit op actief op gezag van rommel', () => {
    expect(migreer({ abonnement: { actief: 'ja' } }).abonnement.actief).toBe(false)
    expect(migreer({ abonnement: { actief: 1 } }).abonnement.actief).toBe(false)
  })
})

describe('laden en bewaren', () => {
  it('leest terug wat er bewaard is', () => {
    zetProfiel({ naam: 'Elif' })
    zetInstelling('taal', 'de')
    _zetTerugVoorTest()
    laad()
    expect(haalStaat().profiel.naam).toBe('Elif')
    expect(haalStaat().instellingen.taal).toBe('de')
  })

  it('bewaart onder de sleutel van het merk', () => {
    zetStaat({ xp: 10 })
    // Compact opgeslagen; `alsTekst()` is de leesbare versie voor het scherm.
    expect(localStorage.getItem(MERK.opslagSleutel)).toContain('"xp":10')
  })

  it('valt terug op een lege staat als de opslag onleesbaar is', () => {
    localStorage.setItem(MERK.opslagSleutel, '{dit is geen json')
    laad()
    expect(haalStaat().xp).toBe(0)
  })
})

describe('een antwoord verwerken', () => {
  it('betaalt XP meteen uit bij een goed antwoord', () => {
    antwoord('merhaba', 'goed')
    expect(haalStaat().xp).toBe(XP_PER_GOED)
  })

  it('betaalt niets uit bij een fout antwoord, maar straft ook niet', () => {
    zetStaat({ xp: 10 })
    antwoord('merhaba', 'fout')
    expect(haalStaat().xp).toBe(10)
  })

  it('zet een woord in `kaarten` en een letter in `extraKaarten`', () => {
    antwoord('merhaba', 'goed')
    antwoord(SLEUTEL.letter('i-dotless'), 'goed')
    expect(Object.keys(haalStaat().kaarten)).toEqual(['merhaba'])
    expect(Object.keys(haalStaat().extraKaarten)).toEqual(['l:i-dotless'])
  })

  it('maakt een kaart aan die er nog niet was', () => {
    antwoord('selam', 'goed')
    expect(haalStaat().kaarten.selam).toBeDefined()
    expect(haalStaat().kaarten.selam!.keren).toBe(1)
  })
})

describe('een les afronden', () => {
  it('geeft sterren naar score', () => {
    rondLesAf('merhaba-1', 1)
    expect(haalStaat().lessen['merhaba-1']!.sterren).toBe(3)
    rondLesAf('merhaba-2', 0.5)
    expect(haalStaat().lessen['merhaba-2']!.sterren).toBe(0)
  })

  it('houdt de beste score en de beste sterren vast bij een slechtere poging', () => {
    rondLesAf('merhaba-1', 1)
    rondLesAf('merhaba-1', 0.4)
    const l = haalStaat().lessen['merhaba-1']!
    expect(l.sterren).toBe(3)
    expect(l.besteScore).toBe(1)
    expect(l.keren).toBe(2)
  })
})

describe('de reeks', () => {
  const s = (laatsteDag: string | null, reeks: number) => ({ ...legeStaat(), laatsteDag, reeks })

  it('begint op één', () => {
    expect(nieuweReeks(s(null, 0), '2026-10-20')).toBe(1)
  })

  it('loopt door bij een dag erna', () => {
    expect(nieuweReeks(s('2026-10-19', 4), '2026-10-20')).toBe(5)
  })

  it('verandert niet bij twee keer op dezelfde dag', () => {
    expect(nieuweReeks(s('2026-10-20', 4), '2026-10-20')).toBe(4)
  })

  it('begint opnieuw na een gemiste dag', () => {
    expect(nieuweReeks(s('2026-10-17', 9), '2026-10-20')).toBe(1)
  })

  it('werkt over een maandgrens', () => {
    expect(nieuweReeks(s('2026-10-31', 2), '2026-11-01')).toBe(3)
  })

  it('werkt over een jaargrens', () => {
    expect(nieuweReeks(s('2026-12-31', 7), '2027-01-01')).toBe(8)
  })

  it('schrijft de datum met voorloopnullen', () => {
    expect(vandaag(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('inzien, meenemen en verwijderen', () => {
  it('toont letterlijk alles wat is opgeslagen', () => {
    // Geen samenvatting: een ouder die wil weten wat de app bewaart, hoort
    // het te zien en niet te moeten vertrouwen.
    zetProfiel({ naam: 'Deniz' })
    antwoord('merhaba', 'goed')
    const tekst = alsTekst()
    expect(tekst).toContain('Deniz')
    expect(tekst).toContain('merhaba')
    expect(JSON.parse(tekst)).toEqual(haalStaat())
  })

  it('verwijdert echt alles, ook de instellingen', () => {
    zetProfiel({ naam: 'Deniz' })
    zetInstelling('taal', 'fr')
    antwoord('merhaba', 'goed')
    rondLesAf('merhaba-1', 1)

    wisAlles()

    const s = haalStaat()
    expect(s.profiel.naam).toBe('')
    expect(s.kaarten).toEqual({})
    expect(s.lessen).toEqual({})
    expect(s.xp).toBe(0)
    expect(s.instellingen.taal).toBe(legeStaat().instellingen.taal)
    expect(localStorage.getItem(MERK.opslagSleutel)).toBeNull()
  })

  it('zet een meegenomen bestand terug', () => {
    zetProfiel({ naam: 'Elif' })
    antwoord('selam', 'goed')
    const bestand = alsTekst()

    wisAlles()
    expect(haalStaat().profiel.naam).toBe('')

    expect(zetTerug(bestand)).toBe(true)
    expect(haalStaat().profiel.naam).toBe('Elif')
    expect(haalStaat().kaarten.selam).toBeDefined()
  })

  it('weigert een bestand dat geen geldige opslag is, zonder iets te wissen', () => {
    zetProfiel({ naam: 'Deniz' })
    expect(zetTerug('dit is geen json')).toBe(false)
    expect(haalStaat().profiel.naam).toBe('Deniz')
  })

  it('schoont een teruggezet bestand net zo op als een geladen opslag', () => {
    // Een meegenomen bestand komt van buiten en is dus niet te vertrouwen,
    // ook al heeft de app het zelf geschreven.
    expect(zetTerug('{"abonnement":{"actief":true},"profiel":{"groep":"reus"}}')).toBe(true)
    expect(haalStaat().abonnement.actief).toBe(true)
    expect(haalStaat().profiel.groep).toBe('midden')
  })
})

describe('wat er niet wordt opgeslagen', () => {
  it('bewaart geen geboortedatum, e-mailadres of toestel-id', () => {
    zetProfiel({ naam: 'Deniz' })
    antwoord('merhaba', 'goed')
    const velden = Object.keys(haalStaat()).join(' ') + ' ' + Object.keys(haalStaat().profiel).join(' ')
    for (const verboden of ['geboorte', 'email', 'mail', 'adres', 'telefoon', 'toestel', 'device', 'locatie']) {
      expect(velden.toLowerCase(), verboden).not.toContain(verboden)
    }
  })

  it('heeft in de hele opgeslagen tekst niets wat op een id van buiten lijkt', () => {
    zetProfiel({ naam: 'Deniz' })
    const tekst = alsTekst()
    expect(tekst).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  })
})

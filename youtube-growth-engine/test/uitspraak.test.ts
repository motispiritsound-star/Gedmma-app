import { describe, expect, it } from 'vitest'
import { kiesTestpassage, struikelwoorden } from '../src/studio/uitspraak.js'

describe('struikelwoorden', () => {
  it('wijst cijfers aan', () => {
    const uit = struikelwoorden('Er staat 260 kubieke meter per seconde.')
    expect(uit.map((s) => s.woord)).toContain('260')
  })

  it('wijst eenheden aan, ook met een superscript', () => {
    const uit = struikelwoorden('Dat is 2500 m³ per bad.')
    expect(uit.find((s) => s.woord === 'm³')?.reden).toBe('eenheid')
  })

  it('wijst eigennamen aan, maar niet het eerste woord van een zin', () => {
    const uit = struikelwoorden('Nederland pompt water. Het gemaal bij IJmuiden staat stil.')
    const woorden = uit.map((s) => s.woord)
    expect(woorden).toContain('IJmuiden')
    expect(woorden).not.toContain('Nederland')
  })

  it('wijst lange samenstellingen aan', () => {
    const uit = struikelwoorden('Het rioolwaterzuiveringsinstallatie staat verderop.')
    expect(uit.find((s) => s.reden === 'samenstelling')?.woord)
      .toBe('rioolwaterzuiveringsinstallatie')
  })

  it('ziet th in onthoud niet aan voor een leenwoord', () => {
    expect(struikelwoorden('Ik onthoud de ontheffing.')).toEqual([])
    expect(struikelwoorden('Een kathedraal en een thema.').map((s) => s.reden))
      .toContain('leenwoord')
  })

  it('laat gewone korte woorden met rust', () => {
    expect(struikelwoorden('Het water gaat naar de sloot en dan verder.')).toHaveLength(0)
  })

  it('geeft elk woord maar één keer terug', () => {
    const uit = struikelwoorden('IJmuiden en IJmuiden en nog eens IJmuiden.')
    expect(uit.filter((s) => s.woord === 'IJmuiden')).toHaveLength(1)
  })

  it('doet niets raars met een lege tekst', () => {
    expect(struikelwoorden('')).toEqual([])
  })
})

describe('kiesTestpassage', () => {
  const makkelijk = 'Het water gaat weg. Het loopt naar de sloot. Daar blijft het even. ' +
    'Dan gaat het verder. Zo werkt dat al jaren. Niemand ziet het gebeuren.'
  const lastig = 'Het gemaal bij IJmuiden verzet 260 m³ per seconde. ' +
    'De rioolwaterzuiveringsinstallatie krijgt 2500 m³ te verwerken. ' +
    'Rijkswaterstaat noemt dat normaal.'

  it('kiest het stuk met de meeste struikelwoorden', () => {
    const p = kiesTestpassage(`${makkelijk} ${lastig}`, 24)
    expect(p.tekst).toContain('IJmuiden')
    expect(p.dichtheid).toBeGreaterThan(0)
  })

  it('levert een aaneengesloten stuk, geen geknipte zinnen', () => {
    const p = kiesTestpassage(`${makkelijk} ${lastig}`, 24)
    const bron = `${makkelijk} ${lastig}`
    expect(bron).toContain(p.tekst)
  })

  it('werkt ook als er geen enkel moeilijk woord in staat', () => {
    const p = kiesTestpassage(makkelijk, 12)
    expect(p.woorden).toBeGreaterThan(0)
    expect(p.dichtheid).toBe(0)
  })

  it('geeft een lege passage terug bij lege invoer', () => {
    expect(kiesTestpassage('').tekst).toBe('')
  })

  it('blijft in de buurt van de gevraagde lengte', () => {
    const lang = Array.from({ length: 40 }, (_, i) =>
      `Zin nummer ${i} met wat woorden erin om te vullen.`).join(' ')
    const p = kiesTestpassage(lang, 60)
    expect(p.woorden).toBeGreaterThanOrEqual(30)
    expect(p.woorden).toBeLessThanOrEqual(100)
  })
})

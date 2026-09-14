import { describe, expect, it } from 'vitest'
import { berekenLengte, omslagpunt, MIDROLL_MINUTEN, DREMPELS } from '../src/studio/watchhours.js'

describe('lengte en de drempels', () => {
  it('rekent kijkminuten per view uit lengte en bekeken percentage', () => {
    const [zes] = berekenLengte([{ minuten: 6, bekekenPercentage: 45 }])
    expect(zes!.kijkminutenPerView).toBe(2.7)
  })

  it('laat zien dat langer minder views vraagt zolang de retentie meevalt', () => {
    const [zes, vijftien] = berekenLengte([
      { minuten: 6, bekekenPercentage: 45 },
      { minuten: 15, bekekenPercentage: 32 },
    ])
    const viewsZes = zes!.views.find((v) => v.drempel === 'Advertenties')!.views
    const viewsVijftien = vijftien!.views.find((v) => v.drempel === 'Advertenties')!.views
    expect(viewsVijftien).toBeLessThan(viewsZes)
  })

  it('draait om zodra de retentie inzakt — vullen kost je views', () => {
    const [zes, gevuld] = berekenLengte([
      { minuten: 6, bekekenPercentage: 45 },
      { minuten: 15, bekekenPercentage: 15 },
    ])
    const viewsZes = zes!.views.find((v) => v.drempel === 'Advertenties')!.views
    const viewsGevuld = gevuld!.views.find((v) => v.drempel === 'Advertenties')!.views
    expect(viewsGevuld).toBeGreaterThan(viewsZes)
  })

  it('noemt het omslagpunt waar langer niet meer loont', () => {
    // 6 min op 45% = 2,7 kijkminuten. Over 15 minuten is dat 18%.
    expect(omslagpunt({ minuten: 6, bekekenPercentage: 45 }, 15)).toBe(18)
  })

  it('kent de midrollgrens en past hem toe', () => {
    expect(MIDROLL_MINUTEN).toBe(8)
    const [kort, lang] = berekenLengte([
      { minuten: 6, bekekenPercentage: 45 },
      { minuten: 8, bekekenPercentage: 42 },
    ])
    expect(kort!.midrolls).toBe(false)
    expect(lang!.midrolls).toBe(true)
  })

  it('rekent tegen beide drempels, en fan funding komt eerder', () => {
    expect(DREMPELS.map((d) => d.kijkuren)).toEqual([3000, 4000])
    const [u] = berekenLengte([{ minuten: 11, bekekenPercentage: 38 }])
    const fan = u!.views.find((v) => v.drempel === 'Fan funding')!.views
    const ads = u!.views.find((v) => v.drempel === 'Advertenties')!.views
    expect(fan).toBeLessThan(ads)
  })
})

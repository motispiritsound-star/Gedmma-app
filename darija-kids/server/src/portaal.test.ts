import { describe, expect, it } from 'vitest'
import { koekje, netjes, sessieUit, welkAdres } from './portaal'

/**
 * De website staat op twee adressen: `darijaforkids.eu` en met `www.` ervoor.
 * Cloudflare serveert allebei dezelfde bladzijden, dus wie `www` intypt krijgt
 * een portaal dat er precies zo uitziet — en dat bij elk verzoek stukloopt als
 * de worker alleen het ene adres doorlaat. Geen foutmelding op het scherm,
 * alleen een knop die niets doet.
 */
describe('welk adres mag antwoorden krijgen', () => {
  const site = 'https://darijaforkids.eu'

  it('laat het eigen adres door', () => {
    expect(welkAdres(site, 'https://darijaforkids.eu')).toBe('https://darijaforkids.eu')
  })

  it('laat www er ook door', () => {
    expect(welkAdres(site, 'https://www.darijaforkids.eu')).toBe('https://www.darijaforkids.eu')
  })

  it('geeft een vreemde een adres waar hij niets aan heeft', () => {
    // De browser vergelijkt zelf, en dan houdt hij het verzoek tegen.
    expect(welkAdres(site, 'https://kwaadwillend.example')).toBe(site)
    expect(welkAdres(site, 'https://darijaforkids.eu.example')).toBe(site)
    expect(welkAdres(site, 'null')).toBe(site)
  })

  it('valt terug op het gewone adres als er geen origin meekomt', () => {
    // Een verzoek van curl of van een server heeft er geen.
    expect(welkAdres(site, null)).toBe(site)
    expect(welkAdres(undefined, null)).toBe(site)
  })

  it('werkt ook als SITE zelf met www is ingesteld', () => {
    expect(welkAdres('https://www.darijaforkids.eu', 'https://darijaforkids.eu'))
      .toBe('https://darijaforkids.eu')
  })
})

describe('het koekje van de sessie', () => {
  it('staat op het hoofddomein, zodat post. hem ook krijgt', () => {
    const k = koekje('a'.repeat(32), 'https://darijaforkids.eu', 60)
    expect(k).toContain('Domain=.darijaforkids.eu')
    expect(k).toContain('HttpOnly')
    expect(k).toContain('Secure')
    expect(k).toContain('SameSite=Lax')
  })

  it('leest zichzelf weer terug, en niets anders', () => {
    const token = 'b'.repeat(32)
    expect(sessieUit(`dfk_sessie=${token}`)).toBe(token)
    expect(sessieUit(`iets=1; dfk_sessie=${token}; nog=2`)).toBe(token)
    expect(sessieUit('dfk_sessie=kort')).toBe(null)
    expect(sessieUit(null)).toBe(null)
  })
})

describe('een e-mailadres', () => {
  it('wordt op één manier opgeschreven', () => {
    // Anders is Adil@Example.com een ander lid dan adil@example.com, en vindt
    // een koper zijn eigen bestelling niet terug.
    expect(netjes('  Adil@Example.COM ')).toBe('adil@example.com')
  })
})

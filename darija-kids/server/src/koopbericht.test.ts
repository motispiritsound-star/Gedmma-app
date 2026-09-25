import { describe, expect, it } from 'vitest'
import { geheimKlopt, koopbericht, slugVan, taalVanLand, veldenVan } from './koopbericht'

/**
 * De melding van de betaalpartner, in de vorm waarin hij echt binnenkomt.
 *
 * Dit is het stuk waar een vergissing op diefstal lijkt: iemand betaalt, de
 * melding wordt niet begrepen, en zijn bibliotheek blijft leeg terwijl het
 * geld weg is. Daarom staat hier een echte ping na, veld voor veld, en niet
 * een opgeschoonde versie waarvan we hopen dat hij lijkt op het origineel.
 */
const PING = [
  'seller_id=ABC123',
  'product_id=DEF456',
  'product_name=De+sleutels+van+Marokko',
  'permalink=sleutels',
  'product_permalink=https%3A%2F%2Fvenshipper.gumroad.com%2Fl%2Fsleutels',
  'email=koper%40example.com',
  'price=3499',
  'currency=eur',
  'quantity=1',
  'order_number=123456789',
  'sale_id=xYzAbC',
  'sale_timestamp=2026-10-01T09%3A12%3A00Z',
  'full_name=Fatima+El+Amrani',
  'ip_country=Netherlands',
].join('&')

const velden = (lijf: string, soort = 'application/x-www-form-urlencoded') => veldenVan(soort, lijf)

describe('de melding van de betaalpartner', () => {
  it('leest een gewone formulierpost', () => {
    const b = koopbericht(velden(PING))
    expect(b.email).toBe('koper@example.com')
    expect(b.reeksen).toEqual(['sleutels'])
    expect(b.naam).toBe('Fatima El Amrani')
    expect(b.bestelnummer).toBe('123456789')
    expect(b.proef).toBe(false)
  })

  it('leest onze eigen JSON net zo goed', () => {
    // Zonder dit is de enige manier om de keten te beproeven: iets echt kopen.
    const b = koopbericht(velden('{"email":"IK@Example.COM ","reeksen":["sba"],"taal":"fr"}', 'application/json'))
    expect(b.email).toBe('ik@example.com')
    expect(b.reeksen).toEqual(['sba'])
    expect(b.taal).toBe('fr')
  })

  it('herkent het tweede product aan zijn eigen adres', () => {
    const b = koopbericht(velden('email=a%40b.nl&product_permalink=https://venshipper.gumroad.com/l/sbadeleeuw'))
    expect(b.reeksen).toEqual(['sba'])
  })

  it('kent het e-boek, maar geeft er niets voor', () => {
    // Gumroad levert die pdf zelf af. Geen reeks, maar ook geen fout — een
    // foutcode laat de betaalpartner het morgen nog eens proberen.
    const b = koopbericht(velden('email=a%40b.nl&permalink=eboek'))
    expect(b.reeksen).toEqual([])
    expect(b.genegeerd).toEqual(['eboek'])
  })

  it('laat een onbekend product helemaal liggen', () => {
    const b = koopbericht(velden('email=a%40b.nl&permalink=ietsanders'))
    expect(b.reeksen).toEqual([])
    expect(b.genegeerd).toEqual([])
  })

  it('merkt een proefmelding', () => {
    expect(koopbericht(velden(`${PING}&test=true`)).proef).toBe(true)
    expect(koopbericht(velden(`${PING}&test=false`)).proef).toBe(false)
  })

  it('raadt de taal uit het land van de koper', () => {
    expect(koopbericht(velden(PING)).taal).toBe('nl')
    expect(koopbericht(velden(PING.replace('Netherlands', 'France'))).taal).toBe('fr')
    expect(koopbericht(velden(PING.replace('Netherlands', 'Deutschland'))).taal).toBe('de')
    // Wie we niet thuis kunnen brengen, krijgt Engels. Niet Nederlands.
    expect(koopbericht(velden(PING.replace('Netherlands', 'Japan'))).taal).toBe('en')
    expect(taalVanLand(undefined)).toBe('en')
  })

  it('laat een meegegeven taal voorgaan op het land', () => {
    expect(koopbericht(velden(`${PING}&taal=it`)).taal).toBe('it')
    expect(koopbericht(velden(`${PING}&taal=xx`)).taal).toBe('nl')
  })

  it('valt niet om over een body die nergens op slaat', () => {
    expect(koopbericht(velden('{kapot', 'application/json'))).toMatchObject({ email: '', reeksen: [] })
    expect(koopbericht(velden(''))).toMatchObject({ email: '', reeksen: [] })
  })
})

describe('het productadres', () => {
  it('levert overal dezelfde naam op', () => {
    expect(slugVan('sleutels')).toBe('sleutels')
    expect(slugVan('https://venshipper.gumroad.com/l/sleutels')).toBe('sleutels')
    expect(slugVan('https://venshipper.gumroad.com/l/sleutels/')).toBe('sleutels')
    expect(slugVan('https://venshipper.gumroad.com/l/Sleutels?wanted=true')).toBe('sleutels')
  })
})

describe('het gedeelde geheim', () => {
  it('laat alleen het goede door', () => {
    expect(geheimKlopt('abc', 'abc')).toBe(true)
    expect(geheimKlopt('abd', 'abc')).toBe(false)
    expect(geheimKlopt('ab', 'abc')).toBe(false)
    expect(geheimKlopt('abcd', 'abc')).toBe(false)
  })

  it('laat niets door als er niets is ingesteld', () => {
    // Anders staat de winkel open op het moment dat het geheim wegvalt.
    expect(geheimKlopt('', '')).toBe(false)
    expect(geheimKlopt(null, 'abc')).toBe(false)
    expect(geheimKlopt('abc', '')).toBe(false)
  })
})

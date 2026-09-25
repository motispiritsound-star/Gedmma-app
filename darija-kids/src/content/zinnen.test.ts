import { describe, expect, it } from 'vitest'
import { uitspreekbaar, zinnenVan } from './zinnen'

describe('zinnen knippen', () => {
  it('knipt op een punt, en niet binnen een afkorting zonder spatie erna', () => {
    expect(zinnenVan(['Hij liep weg. Zij bleef staan.'])).toEqual(['Hij liep weg.', 'Zij bleef staan.'])
  })

  it('houdt het aanhalingsteken bij de zin waar het bij hoort', () => {
    expect(zinnenVan(['“Ga weg,” zei ze. “Nu.”'])).toEqual(['“Ga weg,” zei ze.', '“Nu.”'])
  })

  it('knipt ook op een vraagteken en een beletselteken', () => {
    expect(zinnenVan(['Wie is daar? Niemand… Toch wel.']))
      .toEqual(['Wie is daar?', 'Niemand…', 'Toch wel.'])
  })

  it('loopt door over alinea’s heen, in leesvolgorde', () => {
    expect(zinnenVan(['Eén. Twee.', 'Drie.'])).toEqual(['Eén.', 'Twee.', 'Drie.'])
  })

  it('laat een zin zonder eindpunt heel', () => {
    expect(zinnenVan(['Een halve zin zonder eind'])).toEqual(['Een halve zin zonder eind'])
  })

  it('haalt de sterretjes weg voordat er iets uitgesproken wordt', () => {
    expect(uitspreekbaar('Hij heette *Ayyur*.')).toBe('Hij heette Ayyur.')
  })
})

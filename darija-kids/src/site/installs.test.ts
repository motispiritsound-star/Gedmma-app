/**
 * Het optellen van de Play-installatiecijfers.
 *
 * `npm run downloads` haalt een maandelijks csv-bestand uit een Cloud
 * Storage-emmer en telt het op. Het ophalen is van hier niet na te rekenen --
 * daar hoort een sleutel en een internetverbinding bij -- maar het ontleden en
 * optellen wel, en dat is precies waar het soort fout in zit dat je niet ziet:
 * een verkeerd getal ziet er goed uit.
 *
 * Drie dingen gaan hier makkelijk mis, en ze staan alle drie hieronder:
 *
 *   1. De bestanden zijn UTF-16. Lees je ze als UTF-8, dan krijg je geen
 *      foutmelding maar tekens met een nulbyte ertussen.
 *   2. De kolommen zijn in de loop der jaren verschoven en hernoemd, en
 *      Google's eigen hulppagina noemt een andere set dan wat er in staat.
 *      Op volgnummer zoeken geeft dan stilletjes het verkeerde getal.
 *   3. "Toestellen erop" is een stand en geen stroom. Die optellen over de
 *      dagen geeft een getal dat elke dag groeit en nergens op slaat.
 */
import { describe, expect, it } from 'vitest'
import {
  EERSTE_MAAND, emmers, kolom, leesCsv, maandNaam, maandenSinds, naarTekst, pad, splitsRegel, vatSamen,
} from '../../scripts/lib/installs.mjs'

/** Een bestand zoals Google het neerzet: UTF-16 met een bytevolgordemerk. */
const alsUtf16 = (tekst: string) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(tekst, 'utf16le')])

const KOP = 'Date,Package Name,Daily Device Installs,Daily Device Uninstalls,Daily User Installs,Daily User Uninstalls,Active Device Installs'
const BESTAND = [
  KOP,
  '2026-10-13,app.darijaforkids.learn,8,0,7,0,8',
  '2026-10-14,app.darijaforkids.learn,5,1,4,1,12',
  '2026-10-15,app.darijaforkids.learn,3,0,3,0,15',
].join('\r\n')

describe('de bytes naar tekst', () => {
  it('leest UTF-16 met een merk vooraan', () => {
    expect(naarTekst(alsUtf16('Date,Daily User Installs'))).toBe('Date,Daily User Installs')
  })

  it('leest ook de omgekeerde bytevolgorde', () => {
    const om = Buffer.from('Date,x', 'utf16le')
    om.swap16()
    expect(naarTekst(Buffer.concat([Buffer.from([0xfe, 0xff]), om]))).toBe('Date,x')
  })

  /* `swap16` gooit op een oneven aantal bytes. Dat gebeurt bij een afgebroken
     download, en dan hoort het script niet om te vallen op een foutmelding
     die over buffergroottes gaat. */
  it('valt niet om op een afgebroken download', () => {
    const om = Buffer.from('Date,x', 'utf16le')
    om.swap16()
    const half = Buffer.concat([Buffer.from([0xfe, 0xff]), om, Buffer.from([0x00])])
    expect(() => naarTekst(half)).not.toThrow()
    expect(naarTekst(half)).toBe('Date,x')
  })

  it('leest UTF-8 als er geen merk staat', () => {
    expect(naarTekst(Buffer.from('Date,x', 'utf8'))).toBe('Date,x')
  })

  it('leest UTF-8 met een merk zonder dat merk mee te nemen', () => {
    expect(naarTekst(Buffer.from('﻿Date,x', 'utf8'))).toBe('Date,x')
  })

  /*
   * Dit is de fout waar het om gaat. Als UTF-8 gelezen staat er tussen elke
   * letter een nulbyte, en er komt geen foutmelding -- het bestand ziet er
   * alleen uit alsof er niets in staat.
   *
   * Dat `kolom` er desondanks nog doorheen kijkt is geen reden om hier minder
   * streng te zijn: die opschoning is er voor spaties en liggende streepjes,
   * niet om een verkeerde codering op te vangen. De garantie hoort in
   * `naarTekst` te zitten, en dat is wat hier wordt nagerekend.
   */
  it('en als UTF-8 gelezen zouden er nulbytes tussen de letters staan', () => {
    expect(alsUtf16(KOP).toString('utf8')).toContain('\u0000')
    expect(naarTekst(alsUtf16(KOP))).not.toContain('\u0000')
    expect(naarTekst(alsUtf16(KOP))).toBe(KOP)
  })
})

describe('het csv zelf', () => {
  it('houdt een komma binnen aanhalingstekens bij elkaar', () => {
    expect(splitsRegel('2026-10-13,"Rabat, Marokko",8')).toEqual(['2026-10-13', 'Rabat, Marokko', '8'])
  })

  it('leest een dubbel aanhalingsteken als één teken', () => {
    expect(splitsRegel('a,"zeg ""hoi""",b')).toEqual(['a', 'zeg "hoi"', 'b'])
  })

  it('laat lege regels weg, ook de laatste', () => {
    expect(leesCsv('a,b\r\n1,2\r\n').regels).toEqual([['1', '2']])
  })
})

describe('de kolommen op naam', () => {
  const kop = splitsRegel(KOP)

  it('vindt ze ongeacht hoofdletters en spaties', () => {
    expect(kolom(kop, ['daily user installs'])).toBe(4)
    expect(kolom(['Daily_User_Installs'], ['Daily User Installs'])).toBe(0)
  })

  it('neemt de eerste naam die bestaat, zodat een oude naam blijft werken', () => {
    expect(kolom(['Current Device Installs'], ['Active Device Installs', 'Current Device Installs'])).toBe(0)
  })

  it('geeft -1 als de kolom er niet is, in plaats van de verkeerde', () => {
    expect(kolom(kop, ['Verzonnen Kolom'])).toBe(-1)
  })
})

describe('het optellen', () => {
  const { kop, regels } = leesCsv(naarTekst(alsUtf16(BESTAND)))
  const som = vatSamen(kop, regels)

  it('telt nieuwe gebruikers en installaties over de dagen op', () => {
    expect(som.nieuw).toBe(14)
    expect(som.installaties).toBe(16)
  })

  /* Een stand, geen stroom: 8 + 12 + 15 zou 35 zijn en dat slaat nergens op. */
  it('neemt van de toestellen alleen de laatste dag', () => {
    expect(som.toestellen).toBe(15)
  })

  it('houdt de losse dagen bij, voor --dagen', () => {
    expect(som.dagen.map((d: { datum: string }) => d.datum))
      .toEqual(['2026-10-13', '2026-10-14', '2026-10-15'])
  })

  it('meldt welke kolom ontbrak in plaats van stilletjes nul te tellen', () => {
    const zonder = leesCsv('Date,Daily Device Installs\n2026-10-13,8')
    const uit = vatSamen(zonder.kop, zonder.regels)
    expect(uit.ontbreekt).toContain('nieuw')
    expect(uit.ontbreekt).toContain('toestellen')
    expect(uit.installaties).toBe(8)
  })

  it('leest een getal met een scheidingsteken erin nog steeds als getal', () => {
    const met = leesCsv('Date,Daily User Installs\n2026-10-13,"1,234"')
    expect(vatSamen(met.kop, met.regels).nieuw).toBe(1234)
  })
})

describe('de maanden en de emmer', () => {
  it('rekent de maand in UTC uit', () => {
    expect(maandNaam(new Date('2026-10-19T12:00:00Z'))).toBe('202610')
    expect(maandNaam(new Date('2026-01-01T00:00:00Z'))).toBe('202601')
  })

  it('loopt van de lanceermaand tot en met vandaag', () => {
    expect(maandenSinds('202610', new Date('2026-10-19T00:00:00Z'))).toEqual(['202610'])
    expect(maandenSinds('202610', new Date('2027-01-05T00:00:00Z')))
      .toEqual(['202610', '202611', '202612', '202701'])
  })

  it('loopt niet weg op onzin', () => {
    expect(maandenSinds('kaas', new Date())).toEqual([])
    expect(maandenSinds('202613', new Date())).toEqual([])
    // Honderd maanden is ruim acht jaar; dit mag geen duizend verzoeken worden.
    expect(maandenSinds('190001', new Date()).length).toBeLessThanOrEqual(100)
  })

  it('probeert allebei de vormen van de emmernaam', () => {
    expect(emmers('123')).toEqual(['pubsite_prod_rev_123', 'pubsite_prod_123'])
  })

  it('bouwt het pad zoals Google het neerzet', () => {
    expect(pad('app.darijaforkids.learn', '202610'))
      .toBe('stats/installs/installs_app.darijaforkids.learn_202610_overview.csv')
  })

  it('begint bij de maand waarin de app in Play verscheen', () => {
    expect(EERSTE_MAAND).toBe('202610')
  })
})

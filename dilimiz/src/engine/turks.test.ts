import { describe, expect, it } from 'vitest'
import {
  bezitMijn, eindigtStemloos, gelijk, harmonie2, harmonie4, harmonieVraag,
  HULPTOETSEN, laatsteKlinker, locatief, meervoud, metHoofdletter, naarHoofd,
  naarId, naarKlein, STEMLOOS, turksSorteren, verzacht,
} from './turks'

describe('hoofdletters', () => {
  it('maakt van i een İ en niet een I', () => {
    // Dit is de hele reden dat deze module bestaat. Zonder locale geeft
    // JavaScript hier 'ISTANBUL'.
    expect(naarHoofd('istanbul')).toBe('İSTANBUL')
    expect(naarHoofd('iyi')).toBe('İYİ')
    expect('istanbul'.toUpperCase()).not.toBe(naarHoofd('istanbul'))
  })

  it('maakt van İ een i zonder losse punt erachter', () => {
    expect(naarKlein('İSTANBUL')).toBe('istanbul')
    // En dit is wat er zonder locale gebeurt: een i met een combining dot.
    expect('İSTANBUL'.toLowerCase().length).toBeGreaterThan(8)
    expect(naarKlein('İSTANBUL').length).toBe(8)
  })

  it('maakt van I een ı', () => {
    expect(naarKlein('ILIK')).toBe('ılık')
  })

  it('zet een hoofdletter voor een naam', () => {
    expect(metHoofdletter('ibrahim')).toBe('İbrahim')
    expect(metHoofdletter('')).toBe('')
  })
})

describe('getypt antwoord vergelijken', () => {
  it('neemt goed wat goed is', () => {
    expect(gelijk('merhaba', 'merhaba')).toBe(true)
    expect(gelijk('  merhaba ', 'merhaba')).toBe(true)
    expect(gelijk('merhaba!', 'merhaba')).toBe(true)
    expect(gelijk('teşekkür  ederim', 'teşekkür ederim')).toBe(true)
  })

  it('houdt het verschil tussen ı en i vast, want dat is de les', () => {
    expect(gelijk('kil', 'kıl')).toBe(false)
    expect(gelijk('kır', 'kir')).toBe(false)
    expect(gelijk('iyi', 'ıyı')).toBe(false)
  })

  it('leest een hoofdletter I beide kanten op, want die toets bestaat hier niet', () => {
    // Een kind op een Nederlands toetsenbord kan geen İ typen. Een hoofdletter
    // mag dus beide zijn; een kleine letter nooit.
    expect(gelijk('Iyi', 'İyi')).toBe(true)
    expect(gelijk('Istanbul', 'İstanbul')).toBe(true)
    expect(gelijk('ıyi', 'iyi')).toBe(false)
  })

  it('negeert hoofdlettergebruik', () => {
    expect(gelijk('MERHABA', 'merhaba')).toBe(true)
    expect(gelijk('Günaydın', 'günaydın')).toBe(true)
  })

  it('heeft hulptoetsen voor wat een Europees toetsenbord mist', () => {
    expect(HULPTOETSEN).toContain('ğ')
    expect(HULPTOETSEN).toContain('ı')
    expect(HULPTOETSEN).toContain('İ')
    expect(HULPTOETSEN).toContain('ş')
  })
})

describe('ids', () => {
  it('maakt Latijnse ids zonder diakrieten', () => {
    expect(naarId('teşekkür ederim')).toBe('tesekkur-ederim')
    expect(naarId('günaydın')).toBe('gunaydin')
    expect(naarId('İyi geceler')).toBe('iyi-geceler')
    expect(naarId('kız kardeş')).toBe('kiz-kardes')
  })

  it('laat geen streepjes aan de randen staan', () => {
    expect(naarId('  hoş geldin!  ')).toBe('hos-geldin')
  })

  it('maakt ids die alleen a-z, 0-9 en streepjes bevatten', () => {
    for (const woord of ['çay', 'öğretmen', 'ışık', 'şşş', 'anne & baba']) {
      expect(naarId(woord)).toMatch(/^[a-z0-9-]+$/)
    }
  })
})

describe('sorteren', () => {
  it('zet ı vóór i en ç ná c, zoals het Turkse alfabet', () => {
    expect(['i', 'ı'].sort(turksSorteren)).toEqual(['ı', 'i'])
    expect(['ç', 'c', 'd'].sort(turksSorteren)).toEqual(['c', 'ç', 'd'])
    expect(['s', 'ş', 't'].sort(turksSorteren)).toEqual(['s', 'ş', 't'])
  })
})

describe('klinkerharmonie', () => {
  it('vindt de laatste klinker', () => {
    expect(laatsteKlinker('ev')).toBe('e')
    expect(laatsteKlinker('okul')).toBe('u')
    expect(laatsteKlinker('kitap')).toBe('a')
    expect(laatsteKlinker('göz')).toBe('ö')
    expect(laatsteKlinker('teşekkür')).toBe('ü')
    expect(laatsteKlinker('ş')).toBe(null)
  })

  it('kiest a achter a ı o u, en e achter e i ö ü', () => {
    expect(harmonie2('okul')).toBe('a')
    expect(harmonie2('kitap')).toBe('a')
    expect(harmonie2('kız')).toBe('a')
    expect(harmonie2('ev')).toBe('e')
    expect(harmonie2('göz')).toBe('e')
    expect(harmonie2('gün')).toBe('e')
  })

  it('kiest ı i u ü volgens de vier groepen', () => {
    expect(harmonie4('kitap')).toBe('ı')
    expect(harmonie4('kız')).toBe('ı')
    expect(harmonie4('ev')).toBe('i')
    expect(harmonie4('dil')).toBe('i')
    expect(harmonie4('okul')).toBe('u')
    expect(harmonie4('yol')).toBe('u')
    expect(harmonie4('göz')).toBe('ü')
    expect(harmonie4('gün')).toBe('ü')
  })
})

describe('fıstıkçı şahap', () => {
  it('bevat alle acht stemloze consonanten', () => {
    for (const letter of STEMLOOS) {
      expect('fıstıkçı şahap').toContain(letter)
    }
    expect(STEMLOOS.length).toBe(8)
  })

  it('ziet of een woord stemloos eindigt', () => {
    expect(eindigtStemloos('kitap')).toBe(true)
    expect(eindigtStemloos('ağaç')).toBe(true)
    expect(eindigtStemloos('sepet')).toBe(true)
    expect(eindigtStemloos('ev')).toBe(false)
    expect(eindigtStemloos('okul')).toBe(false)
    expect(eindigtStemloos('anne')).toBe(false)
  })
})

describe('achtervoegsels', () => {
  it('maakt meervouden', () => {
    expect(meervoud('ev')).toBe('evler')
    expect(meervoud('okul')).toBe('okullar')
    expect(meervoud('kız')).toBe('kızlar')
    expect(meervoud('göz')).toBe('gözler')
    expect(meervoud('anne')).toBe('anneler')
  })

  it('maakt de in-vorm, met de t na een stemloze consonant', () => {
    expect(locatief('ev')).toBe('evde')
    expect(locatief('okul')).toBe('okulda')
    expect(locatief('kitap')).toBe('kitapta')
    expect(locatief('sepet')).toBe('sepette')
    expect(locatief('göz')).toBe('gözde')
  })

  it('maakt de mijn-vorm, met alleen een m na een klinker', () => {
    expect(bezitMijn('anne')).toBe('annem')
    expect(bezitMijn('baba')).toBe('babam')
    expect(bezitMijn('abla')).toBe('ablam')
    expect(bezitMijn('dede')).toBe('dedem')
    expect(bezitMijn('ev')).toBe('evim')
    expect(bezitMijn('okul')).toBe('okulum')
    expect(bezitMijn('göz')).toBe('gözüm')
    expect(bezitMijn('kardeş')).toBe('kardeşim')
  })

  it('verzacht een eindconsonant alleen als de inhoud dat zegt', () => {
    expect(verzacht('kitap')).toBe('kitab')
    expect(verzacht('ağaç')).toBe('ağac')
    expect(verzacht('dört')).toBe('dörd')
    expect(verzacht('köpek')).toBe('köpeğ')
    expect(bezitMijn('kitap', true)).toBe('kitabım')
    // En zonder de vlag gebeurt het niet, want `at` wordt `atım` en niet `adım`.
    expect(bezitMijn('at')).toBe('atım')
  })
})

describe('de harmonie-oefening', () => {
  it('biedt twee keuzes bij een meervoud en zet het goede ertussen', () => {
    const v = harmonieVraag('okul', 'meervoud')
    expect(v.goed).toBe('okullar')
    expect(v.keuzes).toContain('okullar')
    expect(v.keuzes).toHaveLength(2)
  })

  it('biedt vier keuzes bij de in-vorm', () => {
    const v = harmonieVraag('kitap', 'in')
    expect(v.goed).toBe('kitapta')
    expect(v.keuzes).toEqual(['kitapde', 'kitapda', 'kitapte', 'kitapta'])
  })

  it('biedt bij een woord op een klinker maar één mijn-vorm', () => {
    // `anne` kan alleen `annem` worden. Een vraag met één antwoord is geen
    // vraag, dus hier hoort de oefening hem niet te stellen -- het scherm
    // slaat een vraag met één keuze over.
    const v = harmonieVraag('anne', 'mijn')
    expect(v.keuzes).toHaveLength(1)
    expect(v.goed).toBe('annem')
  })

  it('zet bij elke vraag het goede antwoord tussen de keuzes', () => {
    const woorden = ['ev', 'okul', 'göz', 'kitap', 'kardeş', 'kız']
    const soorten = ['meervoud', 'in', 'mijn'] as const
    for (const w of woorden) {
      for (const s of soorten) {
        const v = harmonieVraag(w, s)
        expect(v.keuzes, `${w} / ${s}`).toContain(v.goed)
      }
    }
  })
})

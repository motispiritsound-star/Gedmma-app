import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { MERK, merknaam, noemtVerbodenNaam, VERBODEN_NAMEN } from './merk'
import { ACCENTEN, ACCENTKLEUR, ACCENTNAAM, KLEUREN_VAN_DE_ANDERE_APP } from './kleuren'

const WORTEL = join(import.meta.dirname, '..', '..')

/**
 * Dit testbestand en merk.ts/kleuren.ts noemen de verboden namen en kleuren om
 * ertegen te kunnen meten. Die zijn dus de uitzondering, en dat staat hier op
 * één plek zodat elke controle hieronder dezelfde uitzondering gebruikt.
 */
const MAG_ZE_NOEMEN = ['merk.ts', 'merk.test.ts', 'kleuren.ts']
const uitgezonderd = (bestand: string): boolean =>
  MAG_ZE_NOEMEN.some((naam) => bestand.endsWith(naam))

const bestandenOnder = (map: string, achtervoegsels: string[]): string[] => {
  const uit: string[] = []
  const loop = (pad: string) => {
    for (const naam of readdirSync(pad)) {
      if (naam === 'node_modules' || naam === 'dist' || naam.startsWith('.')) continue
      const vol = join(pad, naam)
      if (statSync(vol).isDirectory()) loop(vol)
      else if (achtervoegsels.some((a) => naam.endsWith(a))) uit.push(vol)
    }
  }
  loop(join(WORTEL, map))
  return uit
}

describe('het merk staat op één plek', () => {
  it('houdt capacitor.config.ts gelijk aan merk.ts', () => {
    // Twee plekken die hetzelfde moeten zeggen lopen uiteen zodra er één
    // verandert, en dan draait de app met een andere id dan de winkel kent.
    const conf = readFileSync(join(WORTEL, 'capacitor.config.ts'), 'utf8')
    expect(conf).toContain(`appId: '${MERK.appId}'`)
    expect(conf).toContain(`appName: '${MERK.appNaam}'`)
  })

  it('heeft een app-id in omgekeerde domeinvorm', () => {
    expect(MERK.appId).toMatch(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/)
  })

  it('heeft abonnementsproducten die bij de app-id horen', () => {
    for (const product of Object.values(MERK.abonnement)) {
      expect(product).toMatch(/^app\.dilimiz\./)
    }
  })

  it('hergebruikt geen enkel product-id van de andere app', () => {
    // De overdracht is hier expliciet over: eigen winkelvermelding, eigen
    // ondertekensleutels, eigen abonnementsproducten.
    const alles = [MERK.appId, ...Object.values(MERK.abonnement), MERK.opslagSleutel]
    for (const waarde of alles) {
      expect(noemtVerbodenNaam(waarde), waarde).toBeNull()
    }
  })

  it('vult de merknaam in waar {naam} staat', () => {
    expect(merknaam('Welkom bij {naam}!')).toBe(`Welkom bij ${MERK.naam}!`)
    expect(merknaam('{naam} en {naam}')).toBe(`${MERK.naam} en ${MERK.naam}`)
  })

  it('heeft een opslagsleutel met een versienummer erin', () => {
    // Zonder versie in de sleutel is een onverenigbare verandering later niet
    // te maken zonder iedereen zijn voortgang af te pakken.
    expect(MERK.opslagSleutel).toMatch(/\.v\d+$/)
  })
})

describe('niets van de andere app', () => {
  it('noemt de oude merknaam nergens in de broncode', () => {
    for (const bestand of bestandenOnder('src', ['.ts', '.tsx', '.css'])) {
      if (uitgezonderd(bestand)) continue
      const gevonden = noemtVerbodenNaam(readFileSync(bestand, 'utf8'))
      expect(gevonden, `${bestand} noemt ${gevonden}`).toBeNull()
    }
  })

  it('gebruikt geen enkele kleurwaarde van de andere app', () => {
    // Een zoek-en-vervang die één hex-waarde laat staan is precies hoe twee
    // apps op elkaar gaan lijken.
    const bestanden = [
      ...bestandenOnder('src', ['.ts', '.tsx', '.css']),
      join(WORTEL, 'capacitor.config.ts'),
      join(WORTEL, 'index.html'),
    ]
    for (const bestand of bestanden) {
      if (uitgezonderd(bestand)) continue
      const inhoud = readFileSync(bestand, 'utf8').toLowerCase()
      for (const kleur of KLEUREN_VAN_DE_ANDERE_APP) {
        expect(inhoud, `${bestand} gebruikt ${kleur}`).not.toContain(kleur.toLowerCase())
      }
    }
  })

  it('gebruikt Baloo 2 niet, want dat is de kop van de andere app', () => {
    for (const bestand of bestandenOnder('src', ['.ts', '.tsx', '.css'])) {
      if (uitgezonderd(bestand)) continue
      expect(readFileSync(bestand, 'utf8').toLowerCase(), bestand).not.toContain('baloo')
    }
  })

  it('heeft geen Arabisch lettertype en geen rechts-naar-links', () => {
    // Turks is Latijns schrift. Blijft hier iets van de bidi-laag staan, dan
    // is er iets gekopieerd dat niet van toepassing is.
    for (const bestand of bestandenOnder('src', ['.ts', '.tsx', '.css'])) {
      if (uitgezonderd(bestand)) continue
      const inhoud = readFileSync(bestand, 'utf8').toLowerCase()
      expect(inhoud, bestand).not.toContain('naskh')
      expect(inhoud, bestand).not.toContain('direction: rtl')
    }
  })

  it('weet welke namen verboden zijn en matcht ze op woordgrenzen', () => {
    expect(VERBODEN_NAMEN.length).toBeGreaterThan(3)
    expect(noemtVerbodenNaam('Darija for Kids')).toBe('darija')
    expect(noemtVerbodenNaam('Sba de leeuw')).toBe('sba')
    // En niet in een woord waar het toevallig in zit.
    expect(noemtVerbodenNaam('leichter lesbare Schrift')).toBeNull()
    expect(noemtVerbodenNaam('onverbasterde tekst')).toBeNull()
  })
})

describe('het palet', () => {
  it('heeft vier accenten en een kleur en een naam voor elk', () => {
    expect(ACCENTEN).toHaveLength(4)
    for (const accent of ACCENTEN) {
      expect(ACCENTKLEUR[accent], accent).toMatch(/^#[0-9a-f]{6}$/)
      expect(ACCENTNAAM[accent], accent).toBeTruthy()
    }
  })

  it('heeft vier verschillende kleuren', () => {
    expect(new Set(Object.values(ACCENTKLEUR)).size).toBe(4)
  })

  it('houdt de accentkleuren gelijk met de CSS', () => {
    // Een kind kiest een bolletje en verwacht dat de knoppen diezelfde kleur
    // krijgen. Lopen deze twee uiteen, dan kiest het kind blauw en wordt de
    // app groen.
    const css = readFileSync(join(WORTEL, 'src', 'stijl.css'), 'utf8')
    for (const accent of ACCENTEN) {
      expect(css, `--accent-${accent} ontbreekt in stijl.css`)
        .toContain(`--accent-${accent}: ${ACCENTKLEUR[accent]}`)
    }
  })
})

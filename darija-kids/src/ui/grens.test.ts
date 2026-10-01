/**
 * De foutopvang, en de twee aannames waarop ze rust.
 *
 * `main.tsx` hing `<App/>` rechtstreeks in de root. React ontkoppelt bij een
 * onafgevangen fout de hele boom, dus was één `undefined` uit een oude
 * opgeslagen staat genoeg voor een wit scherm bij een kind dat niet kan
 * herladen en niet kan navertellen wat er gebeurde.
 *
 * Twee dingen daaraan zijn niet uit het bestand zelf af te lezen en staan
 * daarom hieronder bewaakt: dat de grens er nog steeds om `App` heen hangt, en
 * dat ze niets uit de store of de i18n haalt. Dat laatste is geen netheid maar
 * de hele werking: valt de store om, dan valt `useT()` er achteraan en staat het
 * kind alsnog voor een wit scherm — nu met twee fouten in plaats van één.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { maakSom, taalUitOpslag, wisOpslag } from './Grens'
import { LANG_CODES } from '../i18n/languages'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

/** De code zonder de toelichting eromheen. Dit bestand legt uit waaróm het geen
 *  `useT` gebruikt, en een scan die dat woord in een comment vindt meldt precies
 *  het tegenovergestelde van wat er aan de hand is. */
const zonderCommentaar = (tekst: string) =>
  tekst.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

/** Alleen het blok met de vertalingen, zodat een leeg veld daarbinnen opvalt
 *  zonder dat elke andere lege string in het bestand meetelt. */
const tekstBlok = (tekst: string) =>
  /const TEKST: Record<Lang, Tekst> = \{[\s\S]*?\n\}/.exec(tekst)?.[0] ?? ''

describe('de taal op het foutscherm', () => {
  it('komt uit de opgeslagen staat', () => {
    expect(taalUitOpslag(JSON.stringify({ settings: { lang: 'fr' } }))).toBe('fr')
    expect(taalUitOpslag(JSON.stringify({ settings: { lang: 'en' } }))).toBe('en')
  })

  it('valt terug op Nederlands bij alles wat niet klopt', () => {
    // Elk van deze gevallen is precies wat de grens moet opvangen: onleesbare
    // of half ingevulde opslag. Zou hij hierop zelf omvallen, dan is er geen
    // scherm meer om de fout op te laten zien.
    for (const ruw of [
      null,
      '',
      'geen json',
      '{',
      '{}',
      JSON.stringify({ settings: {} }),
      JSON.stringify({ settings: { lang: 'ar' } }),
      JSON.stringify({ settings: { lang: 42 } }),
      JSON.stringify(null),
      JSON.stringify([1, 2, 3]),
    ]) {
      expect(taalUitOpslag(ruw)).toBe('nl')
    }
  })

  it('kent elke taal die de app kent', () => {
    for (const code of LANG_CODES) {
      expect(taalUitOpslag(JSON.stringify({ settings: { lang: code } }))).toBe(code)
    }
  })

  it('heeft voor elke taal een echte tekst, niet een lege', () => {
    const blok = tekstBlok(bron('./Grens.tsx'))
    expect(blok).not.toBe('')

    for (const code of LANG_CODES) {
      expect(blok).toContain(`  ${code}: {`)
    }
    // Geen veld leeg gelaten, en nergens een plakrestje. Alleen binnen dit blok,
    // want elders in het bestand is een lege string gewoon een begintoestand.
    expect(blok).not.toMatch(/:\s*''/)
    expect(blok).not.toMatch(/:\s*""/)
    expect(blok).not.toMatch(/TODO|FIXME|XXX/)

    // En elke taal heeft alle acht de velden: mist er één, dan staat er straks
    // `undefined` op het scherm van een kind.
    const velden = ['titel', 'uitleg', 'knop', 'ouders', 'nogmaals', 'wissen', 'wisUitleg', 'som']
    for (const code of LANG_CODES) {
      const eigen = new RegExp(`\\n  ${code}: \\{[\\s\\S]*?\\n  \\},`).exec(blok)?.[0] ?? ''
      expect(eigen, `taal ${code}`).not.toBe('')
      for (const veld of velden) expect(eigen, `${code}.${veld}`).toContain(`${veld}:`)
    }
  })
})

describe('het wissen', () => {
  it('wist de sleutel van de app en de twee oude', () => {
    const weg: string[] = []
    wisOpslag({ removeItem: (k) => void weg.push(k) })
    expect(weg).toEqual(['darijakids.v1', 'bladi.v1', 'gedmma.v1'])
  })

  it('valt niet om als de browser het weigert', () => {
    // Een privévenster gooit hier. Dat mag geen tweede foutscherm opleveren.
    expect(() => wisOpslag({
      removeItem: () => { throw new Error('opslag geweigerd') },
    })).not.toThrow()
  })
})

describe('de som voor de ouder', () => {
  it('klopt altijd, en is nooit te makkelijk', () => {
    for (let i = 0; i < 200; i++) {
      const som = maakSom()
      const [a, b] = som.tekst.split(' × ').map(Number)
      expect(a! * b!).toBe(som.waarde)
      // Geen tafel van één of twee: die kan een zesjarige uit zijn hoofd.
      expect(a!).toBeGreaterThanOrEqual(3)
      expect(b!).toBeGreaterThanOrEqual(4)
    }
  })
})

describe('de aannames onder de grens', () => {
  it('hangt in main.tsx om App heen', () => {
    const main = bron('../main.tsx')
    expect(main).toContain("import { Grens } from './ui/Grens'")
    // Om App, niet ernaast: een fout in App zelf moet hij ook opvangen, en dat
    // kan alleen van buitenaf.
    expect(main.replace(/\s+/g, ' ')).toContain('<Grens> <App /> </Grens>')
  })

  it('haalt niets uit de store of de i18n', () => {
    const tekst = zonderCommentaar(bron('./Grens.tsx'))
    const imports = [...tekst.matchAll(/^import\s+(type\s+)?.*?from\s+'([^']+)'/gm)]
      .map((m) => ({ alleenType: Boolean(m[1]), waar: m[2]! }))

    expect(imports.length).toBeGreaterThan(0)
    for (const { alleenType, waar } of imports) {
      // React mag, en een type mag — dat verdwijnt bij het compileren en kan
      // dus niets omvallen. Al het andere is een afhankelijkheid die tijdens
      // een storing meedoet.
      if (waar === 'react' || alleenType) continue
      throw new Error(`Grens.tsx importeert '${waar}' tijdens runtime; dat mag niet`)
    }

    // En geen sluipweg langs een import om: geen store, geen useT, geen kit.
    expect(tekst).not.toMatch(/\buseStore\b|\buseT\b|from '\.\/kit'/)
  })

  it('gebruikt dezelfde opslagsleutels als de store', () => {
    // Ze staan met opzet twee keer opgeschreven, want de grens mag niets uit de
    // store importeren. Deze test is wat die dubbeling veilig maakt.
    const store = bron('../engine/store.ts')
    const grens = bron('./Grens.tsx')

    const uit = (tekst: string, naam: string) => {
      const regel = new RegExp(`const ${naam} = (.+)`).exec(tekst)?.[1] ?? ''
      return [...regel.matchAll(/'([^']+)'/g)].map((m) => m[1])
    }

    expect(uit(grens, 'SLEUTEL')).toEqual(uit(store, 'KEY'))
    expect(uit(grens, 'OUDE_SLEUTELS')).toEqual(uit(store, 'OLD_KEYS'))
    // En niet allebei leeg, want dan bewijst het bovenstaande niets.
    expect(uit(store, 'KEY')).toEqual(['darijakids.v1'])
    expect(uit(store, 'OLD_KEYS')).toHaveLength(2)
  })
})

describe('de enige knop op het foutscherm', () => {
  /**
   * Dit scherm staat er als al het andere stuk is, dus alles wat erop staat is
   * met de hand ingetypt — geen klassen, geen css-variabelen, niets wat zelf
   * nog kan omvallen. Dat is goed, en het is precies waarom de kleuren hier
   * achterbleven: toen `--color-zellige-600` donkerder werd voor het contrast,
   * veranderde er hier niets mee. Wit op `#14b8a6` haalde 2,49 op 1, op de
   * enige knop van het scherm.
   *
   * Nagemeten in de browser, met een echte fout erin: de knop is
   * `rgb(15,118,110)`, 239 bij 58, en het scherm zegt "Oeps, daar ging iets
   * mis — het is niet jouw schuld."
   */
  const grens = bron('./Grens.tsx')

  const verhouding = (a: string, b: string): number => {
    const kleur = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const lum = (hex: string) => {
      const [r, g, bl] = kleur(hex)
      const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(bl!)
    }
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x! + 0.05) / (y! + 0.05)
  }

  it('is leesbaar', () => {
    const achter = /background: '(#[0-9a-f]{6})',\n\s+color: '#fff'/.exec(grens)?.[1]
    expect(achter, 'de achtergrond van de knop staat niet meer waar hij stond').toBeTruthy()
    expect(verhouding('#ffffff', achter!)).toBeGreaterThanOrEqual(4.5)
  })

  /**
   * En die handmatige tinten horen wel dezelfde te zijn als die in `index.css`.
   * Lopen ze uit elkaar, dan ziet een kind bij een fout een knop in een kleur
   * die nergens anders in de app voorkomt.
   */
  it('gebruikt dezelfde tinten als de rest van de app', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')
    const tint = (naam: string) => css.match(new RegExp(`--color-${naam}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]
    expect(grens).toContain(`background: '${tint('zellige-600')}'`)
    expect(grens).toContain(`border: '2px solid ${tint('zellige-700')}'`)
  })

  /**
   * Altijd licht, en dat staat er ook. Anders tekent de browser het
   * invoerveld verderop donker op een crèmekleurige bladzijde.
   */
  it('zegt dat het scherm licht is', () => {
    expect(grens).toContain("colorScheme: 'light'")
  })
})

/**
 * De tabbalk: vijf emoji eruit, één hand erin.
 *
 * Onderaan elk scherm stonden 🧭 🔁 📚 🎮 🦊. Dat is dezelfde fout die in de
 * kopbalk al rechtgezet was: elk toestel tekent zijn eigen emoji, dus deze
 * balk was op elk toestel anders — een oranje blokje naast een rode
 * boekenstapel naast een grijze controller, vijf plaatjes uit vijf
 * tekenstijlen. In de donkere stand was het het ergst: vijf volle kleuren op
 * een bijna zwarte balk, terwijl de tellers erboven netjes de inkt volgen.
 *
 * En "waar ben ik" was één signaal: hetzelfde plaatje, hetzelfde woord, groen
 * in plaats van grijs. Dat valt weg voor wie kleur niet goed ziet, en juist
 * deze balk is waar een kind op kijkt om te weten waar het is.
 *
 * Wat hier vastligt is dat het er één hand blijft, dat er drie signalen zijn,
 * en dat de ruit op zijn plek verschijnt in plaats van ernaartoe te reizen.
 * Dat laatste is geen smaak: de ruit is een gevuld vlak dat ónder de tekens
 * door reist terwijl die hun kleur al bij de tik veranderen, dus onderweg wist
 * hij ze. Nagemeten en gefotografeerd: in de donkere stand stond het teken van
 * de net aangetikte tab op 1,14 op 1 zolang de ruit er nog niet was, en de
 * tekens waar hij langs kwam op 1,01 tot 2,26. Tien keer per sessie.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/**
 * Hetzelfde bestand, zonder de toelichtingen.
 *
 * Nodig omdat de toelichtingen hier beschrijven wat er wég is: de emoji die er
 * stond, de `layoutId` die eruit is. Een test die op het hele bestand kijkt
 * valt dan om op zijn eigen uitleg — en dat is in deze ronde al drie keer
 * gebeurd. Wat bewaakt wordt is de code.
 */
const zonderUitleg = (bron: string) =>
  bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '').replace(/^\s*\/\/.*$/gm, '')
const app = lees('../App.tsx')
const tekens = lees('./tekens.tsx')
const css = lees('../index.css')
const topbar = lees('./TopBar.tsx')
const round = lees('./Round.tsx')
const leren = lees('../pages/Learn.tsx')

/** Alles dat als emoji leest. */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u

describe('de vijf tekens', () => {
  it('zijn getekend en geen emoji', () => {
    for (const naam of ['Kompas', 'Rond', 'BoekTeken', 'Steen', 'Jij']) {
      expect(tekens, naam).toContain(`export const ${naam} = () => (`)
    }
    // En de balk zelf draagt er geen enkele meer.
    const schoon = zonderUitleg(app)
    const balk = schoon.slice(schoon.indexOf('const TABS = ['), schoon.indexOf('function useTheme'))
    expect(balk).not.toMatch(EMOJI)
  })

  /**
   * Eén lijndikte. 15 met 2.2 op een viewBox van 24 is 1,375 css-pixel in de
   * kopbalk; om diezelfde lijn op 18 te houden is het 1.83. Met de 2.1 die er
   * eerst stond was deze rij 15 procent dikker, en dan is het geen stelsel
   * maar twee handen.
   */
  it('en lopen op dezelfde lijndikte als de tellers in de kopbalk', () => {
    expect(tekens).toContain('strokeWidth="1.83"')
    expect(tekens).toContain('width="18" height="18"')
    // De kopbalk, waar de maat vandaan komt.
    expect(topbar).toContain('strokeWidth')
  })
})

describe('waar je bent', () => {
  it('is aan drie dingen te zien en niet alleen aan een kleur', () => {
    // De ruit eronder...
    expect(app).toContain('rotate-45 rounded-[5px] bg-[var(--accent-vlak)]')
    // ...het teken in de inkt van die ruit...
    expect(app).toContain("isActive ? 'text-[var(--accent-ink)]' : undefined")
    // ...en het woord donkerder in plaats van anders gekleurd.
    expect(app).toContain("isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'")
    expect(app).not.toContain("text-zellige-600 dark:text-zellige-300'")
  })

  /**
   * Gemeten op de echt getekende bladzijde, dus mét de doorzichtigheid van de
   * balk en de blur erachter: de ruit tegen de balk haalt 3,19 (saffraan),
   * 3,30 (mint), 4,84 (terracotta) en 5,47 (zellige) in de lichte stand, en
   * 7,98 / 7,52 / 4,87 / 6,89 in de donkere. Het teken op de ruit haalt 3,59
   * tot 9,10. Alle zestien boven de drie die een grafisch element hoort te
   * halen.
   */
  it('en de kleur van die ruit is de trede die daarvoor nagemeten is', () => {
    expect(css).toContain('--accent-vlak: var(--accent-600)')
    expect(css).toContain('--accent-vlak: var(--accent-500)')
    // Drie keer: de lichte stand en de twee donkere blokken.
    expect(css.match(/--accent-vlak:/g)!.length).toBe(3)
  })

  /** Op zijn plek, niet onderweg. Zie de toelichting bovenaan dit bestand. */
  it('en de ruit reist niet onder de tekens door', () => {
    expect(zonderUitleg(app)).not.toContain('layoutId')
  })
})

describe('dezelfde bestemming, dezelfde hand', () => {
  /**
   * De vijf tekens stonden eerst in `App.tsx`, en de tabbalk was niet de enige
   * plek met een emoji voor een bestemming: op het pad stond "🎮 Spelen" op een
   * knop en aan het eind van een ronde "🔁 Herhalen".
   */
  it('de knop naar Herhalen draagt het teken van de balk', () => {
    expect(round).toContain('<Rond /> {t.nav.herhalen}')
    /*
      Alleen die knop, en niet het hele bestand: een ronde heeft verder
      terecht emoji -- 🔥 bij een reeks, ❤️ bij de harten, 🎉 👌 💡 in de
      feedbackbalk. Dat zijn geen bestemmingen maar uitroepen, en daar is een
      emoji precies het goede middel. Het bezwaar ging over de vijf plekken
      waar de tabbalk óók naartoe gaat.
    */
    const knop = zonderUitleg(round)
    const blok = knop.slice(knop.indexOf("nav('/herhalen')") - 300, knop.indexOf("nav('/herhalen')") + 300)
    expect(blok).not.toMatch(EMOJI)
  })

  it('en de rij op het pad draagt geen emoji meer', () => {
    const schoon = zonderUitleg(leren)
    const rij = schoon.slice(schoon.indexOf('<Link to="/verhalen">'), schoon.indexOf('<Link to="/spelen">') + 120)
    expect(rij).not.toMatch(EMOJI)
  })
})

describe('de ghost-knop', () => {
  /**
   * `.btn3d` geeft elke knop de richel van vier pixels. De ghost heeft met
   * opzet geen vlak en geen rand, en dan is die richel een bruine balk onder
   * niets: op /volledig stonden "Voorwaarden" en "Privacy" als twee zwevende
   * platen terwijl het twee woorden zijn.
   */
  it('ligt in de bladzijde in plaats van erboven', () => {
    expect(lees('./kit.tsx')).toContain("variant === 'ghost' ? 'btn3d-plat' : ''")
    expect(css).toContain('.btn3d.btn3d-plat { box-shadow: none; }')
    // En zakt één pixel in een verzonken vlak in plaats van vier op een richel.
    expect(css).toContain('.btn3d.btn3d-plat:active:not(:disabled)')
  })
})

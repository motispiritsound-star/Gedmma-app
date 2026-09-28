/**
 * De vraag mag het antwoord niet weggeven.
 *
 * In de betekenis-oefening ("Wat betekent dit?") stond boven het Arabische
 * woord een emoji, en onder de vier antwoorden stond diezelfde emoji bij de
 * juiste. De kaart toonde 👍 boven `bikhir`, en het antwoord was "👍 prima,
 * goed". Je zocht de bijpassende emoji en had het goed — elke keer, want elk
 * woord heeft er één.
 *
 * Dat is geen schoonheidsfoutje in een taalapp: het is de kernoefening, en hij
 * mat niets. Een kind kon een les uitspelen zonder een letter Arabisch te
 * lezen, en de app feliciteerde het.
 *
 * Op de leskaart hoort de emoji juist wél: daar wordt uitgelegd, en dan horen
 * plaatje, woord en betekenis bij elkaar. Bij de antwoorden ook, want daar
 * helpt hij een kind dat nog niet vlot leest om vier regels uit elkaar te
 * houden zonder iets te verraden.
 *
 * Deze test leest de bron, want er draait geen jsdom in dit project.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = readFileSync(new URL('./exercises.tsx', import.meta.url), 'utf8')

/** Het blok dat bij één modus hoort, van `{mode === 'x' && (` tot zijn sluiting. */
function blokVan(modus: string, vanaf: number): string {
  const start = bron.indexOf(`{mode === '${modus}' && (`, vanaf)
  if (start === -1) return ''
  const eind = bron.indexOf(`{mode === '`, start + 10)
  return bron.slice(start, eind === -1 ? start + 800 : eind)
}

describe('de betekenis-oefening', () => {
  // De tweede keer dat 'betekenis' voorkomt is de vraagkaart in Choice; de
  // eerste zit in de hint-regel erboven.
  const vraagkaart = blokVan('betekenis', bron.indexOf('function Choice'))

  it('is gevonden, anders bewijst de rest niets', () => {
    expect(vraagkaart).not.toBe('')
    expect(vraagkaart).toContain('WordText')
  })

  it('zet geen emoji op de vraag', () => {
    expect(vraagkaart, 'de vraagkaart toont w.emoji en geeft daarmee het antwoord weg')
      .not.toContain('w.emoji')
  })

  it('laat de emoji bij de antwoorden juist staan', () => {
    // Die helpt bij het uit elkaar houden van vier regels en verraadt niets.
    const opties = bron.slice(bron.indexOf('data-answer'))
    expect(opties).toContain('{o.emoji}')
  })
})

describe('de leskaart legt juist wél alles bij elkaar', () => {
  it('toont daar plaatje, woord en betekenis samen', () => {
    // Dit is het uitleggen en niet het toetsen; hier hoort de emoji.
    const kaart = bron.slice(0, bron.indexOf('function Choice'))
    expect(kaart).toContain("w.emoji ?? '✨'")
    expect(kaart).toContain('meaning(w)')
  })
})

describe('de andere oefeningen geven niets weg', () => {
  it('vraagt in de darija-modus met een emoji, maar antwoordt in het Arabisch', () => {
    // Hier is de emoji de vraag ("hoe zeg je dit?") en staat het antwoord in
    // het Arabisch. Geen enkele optie draagt een emoji, dus niets te matchen.
    const opties = bron.slice(bron.indexOf('data-answer'))
    const darija = /\{mode === 'darija' && <WordText word=\{o\} \/>\}/.test(opties)
    expect(darija, 'de darija-antwoorden tonen iets anders dan alleen het woord').toBe(true)
  })

  it('toont bij luisteren en schrift alleen Arabisch als antwoord', () => {
    const opties = bron.slice(bron.indexOf('data-answer'))
    for (const modus of ['luister', 'script']) {
      const regel = new RegExp(`\\{mode === '${modus}' && <span[^>]*>\\{o\\.ar\\}</span>\\}`)
      expect(opties, `${modus} toont meer dan het Arabisch`).toMatch(regel)
    }
  })
})

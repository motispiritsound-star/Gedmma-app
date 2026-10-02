/**
 * Het woordenboek moet te doorzoeken zijn op een trage telefoon.
 *
 * Nagemeten met de processor zes keer vertraagd, wat ongeveer een goedkope
 * Android is: alle 304 woorden tegelijk neerzetten gaf een pagina van
 * 29 341px met 3 161 knopen, het eerste woord stond er pas na 2 572ms, en
 * elke aanslag in het zoekveld kostte 200 tot 564ms — want bij elke letter
 * mogen 304 kaarten weer weg. Zo loopt het zoekveld achter je vingers aan.
 *
 * En wie doorscrolde was na een paar vegen twintig schermen van het zoekveld
 * vandaan; een tweede woord opzoeken begon met helemaal terugscrollen.
 *
 * Gemeten na afloop: 4 490px en 522 knopen bij het openen, eerste woord na
 * 1 388ms (−46%), eerste aanslag 279ms (−50%), en alle 304 woorden nog steeds
 * bereikbaar door te scrollen.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const schoon = (pad: string) =>
  readFileSync(new URL(pad, import.meta.url), 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '')

const woorden = schoon('./Words.tsx')
const kopbalk = schoon('../ui/TopBar.tsx')
const stijl = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

describe('de lijst bouwt zich op in stukken', () => {
  it('toont er veertig tegelijk', () => {
    expect(woorden).toMatch(/const STAP = 40/)
    expect(woorden).toMatch(/useState\(STAP\)/)
    expect(woorden).toMatch(/results\.slice\(0, toon\)/)
  })

  it('schuift het volgende stuk erbij voordat je het eind ziet', () => {
    expect(woorden).toMatch(/new IntersectionObserver\(/)
    expect(woorden).toMatch(/rootMargin: '800px 0px'/)
  })

  /**
   * Zonder deze regel houdt een nieuwe zoekvraag het oude aantal vast: je
   * typt iets met zes treffers, en daarna staat er bij het wissen nog steeds
   * maar het stuk dat je toen open had.
   */
  it('begint bij een nieuwe zoekvraag weer bij veertig', () => {
    expect(woorden).toMatch(/useEffect\(\(\) => setToon\(STAP\), \[query, topic\]\)/)
  })

  /** De telregel gaat over wat er te vinden is, niet over wat er al staat. */
  it('telt alle treffers, niet alleen de getoonde', () => {
    expect(woorden).toMatch(/t\.words\.resultaten\(results\.length\)/)
    expect(woorden).not.toMatch(/resultaten\(zichtbaar\.length\)/)
  })

  /** Een baken onder een lijst die al helemaal getoond is, blijft laden. */
  it('haalt het baken weg zodra alles er staat', () => {
    expect(woorden).toMatch(/toon < results\.length && <div ref=\{baken\}/)
  })
})

describe('het zoekveld blijft staan', () => {
  it('plakt onder de kopbalk op de gemeten hoogte', () => {
    expect(woorden).toMatch(/className="sticky[^"]*"[^>]*style=\{\{ top: 'var\(--kop-hoogte\)' \}\}/)
  })

  /**
   * De kopbalk is niet overal even hoog: bij een grote letterinstelling
   * breekt de rij af naar twee regels en op een toestel met een inkeping komt
   * `--rand-boven` erbij. Nagemeten 77px op 390/16 en 163px op 320/24, en in
   * beide gevallen stond het veld er net onder. Een vast getal had het veld
   * op de kleine telefoon 86px onder de balk geschoven.
   */
  it('de kopbalk meet zichzelf en geeft de hoogte door', () => {
    expect(kopbalk).toMatch(/new ResizeObserver\(zet\)/)
    expect(kopbalk).toMatch(/setProperty\('--kop-hoogte'/)
  })

  it('er staat een waarde klaar voordat er gemeten is', () => {
    expect(stijl).toMatch(/--kop-hoogte:\s*\d+px/)
  })
})

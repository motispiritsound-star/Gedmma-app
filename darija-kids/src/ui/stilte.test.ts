/**
 * Een luisteroefening zonder geluid is geen oefening.
 *
 * `say()` doet niets zodra het geluid uitstaat. Dan staat er een vraag "wat
 * hoor je?" met een knop van 112 bij 112 die zwijgt, een linkje "langzamer"
 * dat ook zwijgt, en vier antwoorden. Je kunt alleen gokken — en gokken kost
 * een hartje en zet het woord verkeerd in de planning.
 *
 * Dat geluid staat niet per ongeluk uit: het is een schakelaar in de
 * instellingen, en wie hem omzet doet dat met een reden. Een slapende broer,
 * een trein, een klas.
 *
 * Nagemeten in de herhaalronde over 64 schermen: met geluid aan vier
 * luisterschermen, met geluid uit nul. Dezelfde vier vragen staan er nog, maar
 * dan als lezen in plaats van luisteren — de antwoorden hebben bij beide
 * varianten dezelfde vorm, dus er wordt niets opnieuw opgebouwd.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { BONUS, type BonusPool } from '../engine/bonus'

const code = readFileSync(new URL('./exercises.tsx', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')

describe('wat er met de vier luistervarianten gebeurt', () => {
  it.each([
    ['luister', /case 'luister': return <Choice \{\.\.\.props\} mode=\{soundOn \? 'luister' : 'betekenis'\} \/>/],
    ['zin-luister', /case 'zin-luister': return <SentenceChoice \{\.\.\.props\} mode=\{soundOn \? 'luister' : 'betekenis'\} \/>/],
    ['letter-klank', /case 'letter-klank': return <LetterChoice \{\.\.\.props\} mode=\{soundOn \? 'klank' : 'naam'\} \/>/],
    ['dictee', /case 'dictee': return soundOn \? <Type \{\.\.\.props\} mode="dictee" \/> : <Type \{\.\.\.props\} \/>/],
  ])('%s wisselt om naar de leesvariant', (_naam, patroon) => {
    expect(code).toMatch(patroon)
  })

  it('leest de schakelaar uit de instellingen', () => {
    expect(code).toMatch(/const soundOn = useStore\(\(s\) => s\.settings\.sound\)/)
  })
})

/**
 * Het dictee is de uitzondering. Acht keer "schrijf op wat je hoort" heeft
 * geen leesvariant die hetzelfde vraagt, dus het spel hoort er niet te staan
 * in plaats van onspeelbaar te zijn — net zoals de spreekronde wegvalt op een
 * toestel zonder spraakherkenning.
 */
describe('het dictee als spel', () => {
  const poel = (canHear: boolean): BonusPool => ({
    letters: ['alif', 'ba', 'ta', 'tha'],
    words: Array.from({ length: 30 }, (_, i) => `w${i}`),
    sentences: ['z1', 'z2', 'z3', 'z4'],
    canSpeak: true,
    canHear,
    canWrite: true,
  })

  const klaar = (p: BonusPool) => BONUS.filter((b) => b.ready(p)).map((b) => b.id)

  it('staat er met geluid aan', () => {
    expect(klaar(poel(true))).toContain('dictee')
  })

  it('valt weg met geluid uit', () => {
    expect(klaar(poel(false))).not.toContain('dictee')
  })

  /** En de andere spellen blijven gewoon staan. */
  it('neemt de rest niet mee', () => {
    const uit = klaar(poel(false))
    for (const id of ['schrijven', 'zinnen', 'marathon', 'spreken']) expect(uit).toContain(id)
  })
})

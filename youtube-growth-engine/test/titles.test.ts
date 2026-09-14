import { describe, expect, it } from 'vitest'
import { extractTitlePattern, screenTitles, titleDistance } from '../src/domain/titles.js'
import { checkCirculationNotEvidence, checkTitleDistance } from '../src/domain/gates.js'
import type { Claim, Production, Source } from '../src/domain/types.js'

const TOPIC = 'de eerste moskee in Medina'

describe('titelafstand', () => {
  it('herkent een titel die alleen één woord verwisselt', () => {
    const d = titleDistance(
      'De eerste moskee had geen minaret. Dat was geen toeval.',
      'De eerste moskee had geen koepel. Dat was geen toeval.',
      TOPIC,
    )
    expect(d.tooClose).toBe(true)
  })

  it('rekent gedeelde onderwerpwoorden niet aan', () => {
    // Beide gaan over moskeeën in Medina; die overlap is onvermijdelijk.
    const d = titleDistance(
      'Wat er als eerste stond, en wat er pas later bij kwam',
      'De grootste moskeeën van Medina, op volgorde',
      TOPIC,
    )
    expect(d.tooClose).toBe(false)
    expect(d.sharedBeyondTopic).toEqual([])
  })

  it('blokkeert een lange letterlijk overgenomen passage', () => {
    const d = titleDistance(
      'Ik bouwde een moskee in 24 uur en dit gebeurde er',
      'Ik bouwde een moskee in 24 uur',
      TOPIC,
    )
    expect(d.lcsRatio).toBeGreaterThan(0.5)
    expect(d.tooClose).toBe(true)
  })
})

describe('titelpoort', () => {
  const seeds = ['De eerste moskee had geen koepel. Dat was geen toeval.']

  it('laat de goede opties door en zet de te dichte opties apart', () => {
    const outcome = screenTitles({
      candidates: [
        'De eerste moskee had geen minaret. Dat was geen toeval.',
        'Waarom een gebedsruimte eeuwenlang zonder toren werkte',
      ],
      seeds, topic: TOPIC,
    })
    expect(outcome.ok).toBe(true)
    expect(outcome.accepted).toEqual(['Waarom een gebedsruimte eeuwenlang zonder toren werkte'])
    expect(outcome.rejected).toHaveLength(1)
  })

  it('valt pas wanneer er geen enkele optie overblijft', () => {
    const outcome = screenTitles({
      candidates: ['De eerste moskee had geen minaret. Dat was geen toeval.'],
      seeds, topic: TOPIC,
    })
    expect(outcome.ok).toBe(false)
    expect(checkTitleDistance(outcome.accepted.concat(['De eerste moskee had geen minaret. Dat was geen toeval.']), seeds, TOPIC).score).toBe(0)
  })

  it('is niet van toepassing zonder referentietitels', () => {
    expect(checkTitleDistance(['wat dan ook'], [], TOPIC).score).toBe(15)
  })
})

describe('titelpatroon', () => {
  it('leest de vorm, niet de tekst', () => {
    expect(extractTitlePattern('7 dingen die je NOOIT moet doen')).toMatchObject({
      hasNumber: true, hasNegation: true, hasSuperlative: true, shape: 'lijst',
    })
    expect(extractTitlePattern('Waarom bidden moslims op deze tijden?')).toMatchObject({
      hasQuestion: true, shape: 'vraag',
    })
    expect(extractTitlePattern('De eerste moskee had geen minaret')).toMatchObject({
      hasNegation: true, shape: 'tegenintuitieve-claim',
    })
  })
})

describe('"het staat overal" is geen bewijs', () => {
  const production = (claims: Claim[], sources: Source[]): Production => ({
    id: 'p', state: 'scripted', createdAt: 'now', topic: TOPIC, seedTitles: [],
    claims, sources, shots: [], assetIds: [], variants: [], gateResults: [],
  })

  const circulated: Source = {
    id: 's-rond', kind: 'circulated', work: 'wijdverbreid op sociale media',
    locator: 'geen', retrievedAt: 'now',
  }
  const primary: Source = {
    id: 's-prim', kind: 'primary', work: 'Sahih al-Bukhari', locator: 'hadith 446',
    grading: 'sahih', gradedBy: 'al-Bukhari', retrievedAt: 'now',
  }
  const claim = (sourceIds: string[], claimClass: Claim['claimClass'] = 'hadith'): Claim => ({
    id: 'c', text: 'x', claimClass, sourceIds, atSecond: 1, notesScholarlyDifference: false,
  })

  it('blokkeert een centrale claim die alleen op herhaling steunt', () => {
    expect(checkCirculationNotEvidence(production([claim(['s-rond'])], [circulated])).score).toBe(0)
  })

  it('laat het door zodra er ook een primaire bron onder ligt', () => {
    expect(
      checkCirculationNotEvidence(
        production([claim(['s-rond', 's-prim'])], [circulated, primary]),
      ).score,
    ).toBe(10)
  })

  it('laat een algemene claim wel op herhaling staan', () => {
    expect(
      checkCirculationNotEvidence(production([claim(['s-rond'], 'general')], [circulated])).score,
    ).toBe(10)
  })
})

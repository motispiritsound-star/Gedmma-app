import { describe, expect, it } from 'vitest'
import {
  checkGuidelineProvenance, checkNoPersonalMedicalAdvice,
  checkRecommendationAttribution, checkStatisticYear, checkStudyProvenance,
} from '../src/domain/gates.js'
import type { Claim, Production, Source } from '../src/domain/types.js'

const production = (claims: Claim[], sources: Source[]): Production => ({
  id: 'p', state: 'scripted', createdAt: 'now', topic: 'zitten', seedTitles: [],
  claims, sources, shots: [], assetIds: [], variants: [], gateResults: [],
})

const claim = (over: Partial<Claim>): Claim => ({
  id: 'c', text: 'x', claimClass: 'study', sourceIds: ['s'],
  atSecond: 10, notesScholarlyDifference: false, ...over,
})

describe('richtlijnen', () => {
  const richtlijn: Source = {
    id: 's', kind: 'primary', work: 'Gezondheidsraad', locator: 'Beweegrichtlijnen, hoofdstuk 3',
    year: 2017, retrievedAt: 'now',
  }

  it('accepteert werk, vindplaats en jaar', () => {
    expect(checkGuidelineProvenance(
      production([claim({ claimClass: 'guideline' })], [richtlijn])).score).toBe(20)
  })

  it('blokkeert een richtlijn zonder jaartal — ze worden herzien', () => {
    const { year: _weg, ...zonderJaar } = richtlijn
    expect(checkGuidelineProvenance(
      production([claim({ claimClass: 'guideline' })], [zonderJaar])).score).toBe(0)
  })

  it('blokkeert een richtlijnclaim die op een secundaire bron steunt', () => {
    expect(checkGuidelineProvenance(
      production([claim({ claimClass: 'guideline' })],
        [{ ...richtlijn, kind: 'secondary' }])).score).toBe(0)
  })
})

describe('onderzoek — het medische equivalent van een hadith zonder gradering', () => {
  const studie: Source = {
    id: 's', kind: 'primary', work: 'The Lancet', locator: '2019;394:1145',
    grading: 'systematische review', gradedBy: 'The Lancet', year: 2019,
    participants: 12000, retrievedAt: 'now',
  }

  it('accepteert tijdschrift, jaar, opzet en omvang', () => {
    expect(checkStudyProvenance(production([claim({})], [studie])).score).toBe(25)
  })

  it('blokkeert een studie zonder opzet', () => {
    const { grading: _g, ...zonder } = studie
    expect(checkStudyProvenance(production([claim({})], [zonder])).score).toBe(0)
  })

  it('blokkeert een dierstudie waarvan de beperking niet wordt benoemd', () => {
    const muizen = { ...studie, grading: 'dierstudie', participants: 40 }
    const result = checkStudyProvenance(production([claim({})], [muizen]))
    expect(result.score).toBe(0)
    expect(result.reasoning).toMatch(/geen uitspraak over mensen/)
  })

  it('laat een dierstudie door als het script de beperking wél benoemt', () => {
    const muizen = { ...studie, grading: 'dierstudie', participants: 40 }
    expect(checkStudyProvenance(
      production([claim({ notesScholarlyDifference: true })], [muizen])).score).toBe(25)
  })

  it('blokkeert een klein onderzoek dat als bewijs wordt gebruikt', () => {
    const klein = { ...studie, grading: 'cohort', participants: 14 }
    const result = checkStudyProvenance(production([claim({})], [klein]))
    expect(result.score).toBe(0)
    expect(result.reasoning).toMatch(/te weinig/)
  })

  it('staat een kleine RCT wel toe — opzet weegt zwaarder dan omvang', () => {
    const rct = { ...studie, grading: 'RCT', participants: 24 }
    expect(checkStudyProvenance(production([claim({})], [rct])).score).toBe(25)
  })
})

describe('adviezen en cijfers', () => {
  it('eist dat een advies wordt toegeschreven', () => {
    expect(checkRecommendationAttribution([claim({ claimClass: 'recommendation' })]).score).toBe(0)
    expect(checkRecommendationAttribution(
      [claim({ claimClass: 'recommendation', attributedTo: 'de Gezondheidsraad' })]).score).toBe(15)
  })

  it('eist een jaartal bij een cijfer', () => {
    const bron: Source = { id: 's', kind: 'primary', work: 'CBS', locator: 'tabel 4', retrievedAt: 'now' }
    expect(checkStatisticYear(production([claim({ claimClass: 'statistic' })], [bron])).score).toBe(0)
    expect(checkStatisticYear(
      production([claim({ claimClass: 'statistic' })], [{ ...bron, year: 2025 }])).score).toBe(10)
  })
})

describe('de grens tussen uitleg en advies', () => {
  it('blokkeert zinnen die de kijker vertellen wat hij moet doen', () => {
    for (const tekst of [
      'Jij moet elke dag een uur staan.',
      'Stop met zitten en je rugpijn verdwijnt.',
      'Neem dagelijks vitamine D.',
      'Slik magnesium voor je slaap.',
    ]) {
      expect(checkNoPersonalMedicalAdvice([claim({ text: tekst })]).score).toBe(0)
    }
  })

  it('laat uitleg met rust', () => {
    expect(checkNoPersonalMedicalAdvice([
      claim({ text: 'De Gezondheidsraad adviseert volwassenen wekelijks 150 minuten matig te bewegen.' }),
      claim({ text: 'In het onderzoek zat de groep die vaker opstond lager op de pijnschaal.' }),
    ]).score).toBe(15)
  })
})

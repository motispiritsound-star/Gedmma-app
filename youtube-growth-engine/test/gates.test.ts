import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GATES, ThresholdLoweringError, checkCentralClaimsPrimary,
  checkEveryClaimSourced, checkFigureFree, checkFiqhAttribution,
  checkHadithProvenance, checkLicenseProofs, checkNoGeneratedArabic,
  checkQuranProvenance,
  evaluate, withThresholds,
} from '../src/domain/gates.js'
import type {
  Asset, Claim, LicenseProof, Production, Shot, Source,
} from '../src/domain/types.js'

const base = (over: Partial<Production> = {}): Production => ({
  id: 'p1', state: 'scripted', createdAt: '2026-01-01T00:00:00.000Z', topic: 't',
  seedTitles: [],
  claims: [], sources: [], shots: [], assetIds: [], variants: [], gateResults: [],
  ...over,
})

const quranSource: Source = {
  id: 's-q', kind: 'primary', work: 'Koran', locator: '2:144',
  translation: 'Genoemde gepubliceerde vertaling', retrievedAt: 'now',
}
const hadithSource: Source = {
  id: 's-h', kind: 'primary', work: 'Sahih al-Bukhari', locator: 'boek 8, hadith 446',
  grading: 'sahih', gradedBy: 'al-Bukhari', retrievedAt: 'now',
}

describe('drempels', () => {
  it('laat aanscherpen toe', () => {
    const next = withThresholds(DEFAULT_GATES, { originality: 95 })
    expect(next.originality.threshold).toBe(95)
  })

  it('weigert verlagen — er is geen codepad dat een drempel omlaag brengt', () => {
    expect(() => withThresholds(DEFAULT_GATES, { originality: 80 }))
      .toThrow(ThresholdLoweringError)
  })
})

describe('harde criteria', () => {
  it('laat de poort vallen ook als het totaal ruim boven de drempel ligt', () => {
    const result = evaluate(
      { key: 'trust', threshold: 50, blocking: true, hardCriteria: ['title_delivered'] },
      [
        { criterion: 'title_delivered', score: 9, max: 10, reasoning: 'net niet' },
        { criterion: 'anders', score: 90, max: 90, reasoning: 'prima' },
      ],
    )
    expect(result.score).toBe(99)
    expect(result.passed).toBe(false)
  })
})

describe('koranherkomst', () => {
  it('eist soera:ayah en een genoemde vertaling', () => {
    const claim: Claim = {
      id: 'c', text: 'x', claimClass: 'quran', sourceIds: ['s-q'],
      atSecond: 1, notesScholarlyDifference: false,
    }
    expect(checkQuranProvenance(base({ claims: [claim], sources: [quranSource] })).score).toBe(20)

    const { translation: _weg, ...zonderVertaling } = quranSource
    expect(
      checkQuranProvenance(base({ claims: [claim], sources: [zonderVertaling] })).score,
    ).toBe(0)
  })
})

describe('hadithherkomst', () => {
  const claim: Claim = {
    id: 'c', text: 'x', claimClass: 'hadith', sourceIds: ['s-h'],
    atSecond: 1, notesScholarlyDifference: false,
  }

  it('accepteert collectie, nummer en gradering met beoordelaar', () => {
    expect(checkHadithProvenance(base({ claims: [claim], sources: [hadithSource] })).score).toBe(25)
  })

  it('blokkeert een hadith zonder gradering — niet afzwakken, blokkeren', () => {
    const { grading: _g, gradedBy: _b, ...ongegradeerd } = hadithSource
    expect(checkHadithProvenance(base({ claims: [claim], sources: [ongegradeerd] })).score).toBe(0)
  })

  it('blokkeert een als mawdu gegradeerde overlevering', () => {
    const verzonnen = { ...hadithSource, grading: "mawdu'" }
    expect(checkHadithProvenance(base({ claims: [claim], sources: [verzonnen] })).score).toBe(0)
  })

  it('blokkeert een hadith zonder enige bron', () => {
    const los = { ...claim, sourceIds: [] }
    expect(checkHadithProvenance(base({ claims: [los], sources: [] })).score).toBe(0)
  })
})

describe('afbeeldingsverbod', () => {
  const shots: Shot[] = [
    { index: 0, fromSecond: 0, toSecond: 5, description: 'landschap', figureFree: true },
  ]
  const asset = (figureCheck: 'pass' | 'fail'): Asset => ({
    id: 'a', kind: 'image', uri: '/x.png', sha256: 'h', origin: 'generated',
    provider: 'p', licenseProofId: 'l', figureCheck,
  })

  it('laat een figuurvrije scène zonder figuur door', () => {
    expect(checkFigureFree(shots, [asset('pass')]).score).toBe(15)
  })

  it('blokkeert zodra een asset een figuur toont', () => {
    expect(checkFigureFree(shots, [asset('fail')]).score).toBe(0)
  })
})

describe('Arabische tekst', () => {
  const shots: Shot[] = [
    { index: 0, fromSecond: 0, toSecond: 5, description: 'kalligrafie', figureFree: true, arabicAssetId: 'ar-1' },
  ]

  it('accepteert tekst uit de geverifieerde bibliotheek', () => {
    expect(checkNoGeneratedArabic(shots, new Set(['ar-1'])).score).toBe(15)
  })

  it('blokkeert tekst die geen mens heeft gecontroleerd', () => {
    expect(checkNoGeneratedArabic(shots, new Set()).score).toBe(0)
  })
})

describe('fiqh', () => {
  const claim = (over: Partial<Claim>): Claim => ({
    id: 'c', text: 'x', claimClass: 'fiqh', sourceIds: ['s'],
    atSecond: 1, notesScholarlyDifference: false, ...over,
  })

  it('blokkeert een oordeel dat als feit wordt gesteld', () => {
    expect(checkFiqhAttribution([claim({})]).score).toBe(0)
  })

  it('accepteert een toegeschreven oordeel', () => {
    expect(checkFiqhAttribution([claim({ attributedTo: 'de hanafitische school' })]).score).toBe(10)
  })

  it('accepteert een benoemd verschil tussen geleerden', () => {
    expect(checkFiqhAttribution([claim({ notesScholarlyDifference: true })]).score).toBe(10)
  })
})

describe('bronnen', () => {
  it('blokkeert een claim zonder bron', () => {
    const los: Claim = {
      id: 'c', text: 'x', claimClass: 'general', sourceIds: [],
      atSecond: 1, notesScholarlyDifference: false,
    }
    expect(checkEveryClaimSourced(base({ claims: [los] })).score).toBe(0)
  })

  it('eist een primaire bron voor centrale claims, niet voor algemene', () => {
    const secundair: Source = {
      id: 's2', kind: 'secondary', work: 'blog', locator: 'url', retrievedAt: 'now',
    }
    const historisch: Claim = {
      id: 'c1', text: 'x', claimClass: 'history', sourceIds: ['s2'],
      atSecond: 1, notesScholarlyDifference: false,
    }
    const algemeen: Claim = { ...historisch, id: 'c2', claimClass: 'general' }

    expect(checkCentralClaimsPrimary(base({ claims: [historisch], sources: [secundair] })).score).toBe(0)
    expect(checkCentralClaimsPrimary(base({ claims: [algemeen], sources: [secundair] })).score).toBe(15)
  })
})

describe('checkLicenseProofs met bewijzen erbij', () => {
  const asset = (id: string, proofId: string): Asset => ({
    id, kind: 'image', uri: `f/${id}.png`, sha256: 'x'.repeat(64),
    origin: 'licensed', provider: 'archief', licenseProofId: proofId,
  })
  const bewijs = (id: string, commercieel: boolean, holder: string): LicenseProof => ({
    id, holder, terms: commercieel ? 'commercieel toegestaan' : 'alleen educatief',
    commercialUse: commercieel, evidenceUri: `https://example.test/${id}`,
  })

  it('keurt goed wanneer elk bewijs commercieel gebruik toestaat', () => {
    const c = checkLicenseProofs(
      [asset('a1', 'p1'), asset('a2', 'p1')],
      [bewijs('p1', true, 'Rijksmuseum')],
    )
    expect(c.score).toBe(c.max)
  })

  it('blokkeert een bron die alleen educatief gebruik toestaat', () => {
    const c = checkLicenseProofs(
      [asset('a1', 'p1')],
      [bewijs('p1', false, 'Rijkswaterstaat Beeldarchief')],
    )
    expect(c.score).toBe(0)
    expect(c.reasoning).toContain('Rijkswaterstaat')
  })

  it('blokkeert ook als er één niet-commercieel bewijs tussen zit', () => {
    const c = checkLicenseProofs(
      [asset('a1', 'p1'), asset('a2', 'p2')],
      [bewijs('p1', true, 'Rijksmuseum'), bewijs('p2', false, 'Rijkswaterstaat')],
    )
    expect(c.score).toBe(0)
  })

  it('blokkeert een verwijzing naar een bewijs dat niet bestaat', () => {
    const c = checkLicenseProofs([asset('a1', 'weg')], [bewijs('p1', true, 'x')])
    expect(c.score).toBe(0)
    expect(c.reasoning).toContain('verwijzing is geen bewijs')
  })

  it('blokkeert nog steeds een asset zonder bewijs-id', () => {
    const zonder = { ...asset('a1', 'p1'), licenseProofId: '' }
    expect(checkLicenseProofs([zonder], [bewijs('p1', true, 'x')]).score).toBe(0)
  })

  it('zegt het eerlijk wanneer de bewijzen niet zijn meegegeven', () => {
    const c = checkLicenseProofs([asset('a1', 'p1')])
    expect(c.score).toBe(c.max)
    expect(c.reasoning).toContain('niet gecontroleerd')
  })
})

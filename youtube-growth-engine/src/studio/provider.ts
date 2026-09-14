import type { KnowledgePack } from '../knowledge/types.js'
import type { NicheProposal } from './niche.js'
import { NICHE_CATEGORIES } from './niche.js'
import { TITLE_CATEGORIES, TITLE_STYLES, type TitleCandidate } from './titles.js'
import { ALWAYS_EXCLUDE, THUMBNAIL_CATEGORIES, type ThumbnailConcept } from './thumbnails.js'
import type { Positioning, VideoIdea } from './project.js'

export interface RawScore {
  key: string
  score: number
  reasoning: string
  assumptions?: string[]
  weaknesses?: string[]
  improvements?: string[]
}

/**
 * De denkstappen van de studio. Elke methode levert ruwe scores; het rekenen,
 * begrenzen en classificeren gebeurt in `scoring.ts`, buiten het bereik van
 * het model.
 */
export interface StudioProvider {
  name: string
  simulated: boolean

  proposeNiches(pack: KnowledgePack, count: number): Promise<NicheProposal[]>
  scoreNiche(proposal: NicheProposal, pack: KnowledgePack): Promise<RawScore[]>
  buildPositioning(proposal: NicheProposal, pack: KnowledgePack): Promise<Positioning>
  generateIdeas(positioning: Positioning, count: number): Promise<Omit<VideoIdea, 'id' | 'revision' | 'status'>[]>
  generateTitles(idea: VideoIdea, positioning: Positioning): Promise<TitleCandidate[]>
  scoreTitle(title: TitleCandidate, idea: VideoIdea): Promise<RawScore[]>
  generateThumbnails(idea: VideoIdea, title: string, pack: KnowledgePack, count: number): Promise<ThumbnailConcept[]>
  scoreThumbnail(concept: ThumbnailConcept, title: string): Promise<RawScore[]>
}

const score = (specs: { key: string; max: number }[], factor: number, note: string): RawScore[] =>
  specs.map((s) => ({
    key: s.key,
    score: Math.round(s.max * factor),
    reasoning: note,
    assumptions: ['Gesimuleerde score; geen extern onderzoek gedaan.'],
    weaknesses: [],
    improvements: ['Zet ANTHROPIC_API_KEY om een echte beoordeling te krijgen.'],
  }))

/**
 * Mock-studio. Levert genoeg echte structuur om de hele werkstroom en alle
 * correcties te laten zien, zonder één API-aanroep.
 */
export class MockStudioProvider implements StudioProvider {
  readonly name = 'mock-studio'
  readonly simulated = true

  async proposeNiches(_pack: KnowledgePack, count: number): Promise<NicheProposal[]> {
    const all: NicheProposal[] = [
      {
        broadSubject: 'islamitische content',
        proposition:
          'Korte cinematische verhalen uit de vroege islam die elke aflevering ' +
          'eindigen bij een keuze die een Nederlands gezin vandaag ook maakt',
        positioningStatement:
          'Voor Nederlandse islamitische gezinnen die samen kijken: verhalen met ' +
          'bronvermelding, die ouder en kind allebei iets nieuws vertellen.',
        targetAudience: 'Nederlandse islamitische gezinnen, kind van 8-14 kijkt mee met een ouder',
        whyThisCreator: 'Kent de vragen die in deze gezinnen echt langskomen; heeft een reviewer',
        contentPillars: ['Verhalen', 'Waarom doen we dit zo', 'Plaatsen', 'Woorden'],
        exampleIdeas: [
          'De eerste moskee had geen minaret',
          'Waarom het gebed vijf keer is en niet drie',
          'Wat er in Medina stond voordat er iets stond',
        ],
      },
      {
        broadSubject: 'islamitische content',
        proposition: 'islamitische content voor kinderen',
        positioningStatement: 'Leuke video\'s over de islam voor kinderen.',
        targetAudience: 'kinderen',
        whyThisCreator: 'affiniteit',
        contentPillars: ['verhalen', 'liedjes'],
        exampleIdeas: ['verhaal 1', 'verhaal 2'],
      },
    ]
    return all.slice(0, count)
  }

  async scoreNiche(proposal: NicheProposal): Promise<RawScore[]> {
    // De tweede propositie is met opzet zwak: zo is te zien dat de focustoets
    // en de begrenzingen werken in plaats van alleen te bestaan.
    const strong = proposal.proposition.length > 60
    return score(NICHE_CATEGORIES, strong ? 0.85 : 0.45,
      strong ? 'Toegespitst voorstel met eigen invalshoek.' : 'Blijft een breed onderwerp.')
  }

  async buildPositioning(proposal: NicheProposal): Promise<Positioning> {
    return {
      proposition: proposal.proposition,
      statement: proposal.positioningStatement,
      audience: proposal.targetAudience,
      viewerProblem: 'Ouders willen iets laten zien dat klopt én dat het kind boeit',
      emotionalPromise: 'Trots op iets wat je zelf niet wist',
      functionalPromise: 'Elke video eindigt met één zin die je kunt navertellen',
      reasonsToSubscribe: [
        'Bronnen staan er altijd bij, met vindplaats',
        'Geen kleutertoon bij een serieus verhaal',
        'Elke week één, op vaste dag',
      ],
      differentiator: 'De enige Nederlandse islamitische gezinsserie die per claim de bron toont',
      brandPersonality: 'Rustig, precies, warm',
      toneOfVoice: 'Vertelt alsof het aan tafel gebeurt',
      language: 'nl',
      contentPillars: proposal.contentPillars,
      repeatableFormats: ['Verhaal met wending', 'Waarom doen we dit zo', 'Plaats in beeld'],
      recommendedLengthSeconds: 660,
      publicationRhythm: '1 long-form per week, vaste dag',
    }
  }

  async generateIdeas(positioning: Positioning, count: number) {
    const seeds = [
      ['De eerste moskee had geen minaret', 'Verhalen', 'leren', 'ontdekking'],
      ['Waarom het gebed vijf keer is', 'Waarom doen we dit zo', 'oplossen', 'vertrouwen'],
      ['Wat er in Medina stond voor er iets stond', 'Plaatsen', 'beleven', 'ontdekking'],
      ['Het woord dat iedereen verkeerd vertaalt', 'Woorden', 'leren', 'binding'],
    ]
    return Array.from({ length: count }, (_, i) => {
      const seed = seeds[i % seeds.length]!
      const suffix = i >= seeds.length ? ` (deel ${Math.floor(i / seeds.length) + 1})` : ''
      return {
        contentPillar: seed[1]!,
        concept: seed[0]! + suffix,
        viewerIntent: seed[2]!,
        format: positioning.repeatableFormats[0]!,
        evergreen: true,
        productionDifficulty: 'middel' as const,
        funnelStage: seed[3] as 'ontdekking' | 'vertrouwen' | 'binding' | 'conversie',
      }
    })
  }

  async generateTitles(idea: VideoIdea): Promise<TitleCandidate[]> {
    const bases = [
      'Wat er als eerste stond in Medina',
      'Waarom een gebedsruimte eeuwen zonder toren werkte',
      'Het onderdeel dat pas eeuwen later bij de moskee kwam',
      'De waarheid over de eerste moskee',
      'Drie dingen die de eerste moskee niet had',
      'De eerste moskee had geen koepel. Dat was geen toeval.',
      'Hoe zag de allereerste moskee er werkelijk uit volgens de vroegste bronnen',
      'DIT WIST JE NIET over de eerste moskee',
      'Van zandvloer tot marmer: wat er onderweg bij kwam',
      'Wat een moskee nodig heeft, en wat eraan is geplakt',
    ]
    return bases.map((title, i) => ({
      title,
      style: TITLE_STYLES[i % TITLE_STYLES.length]!,
      // Titel 4 en 8 krijgen met opzet geen dekking: dan is te zien dat de
      // holle-constructieregel en de schreeuwregel echt iets doen.
      coverage: i === 3 || i === 7 ? '' : `De video behandelt ${idea.concept.toLowerCase()}.`,
    }))
  }

  async scoreTitle(title: TitleCandidate): Promise<RawScore[]> {
    const factor = 0.6 + (title.title.length % 7) * 0.05
    return score(TITLE_CATEGORIES, Math.min(1, factor), 'Gesimuleerde beoordeling.')
  }

  async generateThumbnails(
    _idea: VideoIdea, _title: string, pack: KnowledgePack, count: number,
  ): Promise<ThumbnailConcept[]> {
    const palette = pack.houseStyle.palette.length > 0
      ? pack.houseStyle.palette : ['#14332b', '#f2efe6']
    const concepts: ThumbnailConcept[] = [
      { name: 'Silhouet zonder toren', subject: 'daklijn zonder minaret', text: 'GEEN TOREN' },
      { name: 'Zandvloer', subject: 'zand in tegenlicht', text: 'ZAND' },
      { name: 'Twee daklijnen', subject: 'dezelfde daklijn, eeuwen apart', text: 'TOEN NU' },
      { name: 'Palmstam', subject: 'palmstam als pilaar', text: 'DIT DROEG HET' },
      { name: 'Lege plattegrond', subject: 'plattegrond die opbouwt', text: 'WAT ONTBRAK' },
    ].map((c) => ({
      conceptName: c.name,
      visualSubject: c.subject,
      emotionalSignal: 'stilte vlak voor het gebed',
      background: 'ochtendlucht met veel ruimte',
      composition: 'onderwerp links, tekst rechts, alles binnen de veilige marge',
      text: c.text,
      palette,
      contrastStrategy: 'donker silhouet op lichte lucht',
      supportingSymbol: 'kalligrafische lijn',
      exclude: [...ALWAYS_EXCLUDE, ...pack.houseStyle.visualAvoid],
      imagePrompt: `${c.subject}, ${pack.houseStyle.visualKeywords.join(', ')}, 16:9, 1280x720`,
      whyItComplementsTheTitle: 'De titel stelt de vraag, het beeld toont het gemis.',
    }))
    return concepts.slice(0, count)
  }

  async scoreThumbnail(concept: ThumbnailConcept): Promise<RawScore[]> {
    const factor = 0.65 + (concept.conceptName.length % 6) * 0.05
    return score(THUMBNAIL_CATEGORIES, Math.min(1, factor), 'Gesimuleerde beoordeling.')
  }
}

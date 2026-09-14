import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname } from 'node:path'
import type { KnowledgePack } from '../knowledge/types.js'
import type { NicheEvaluation } from './niche.js'
import type { ScoredTitle } from './titles.js'
import type { ScoredThumbnail, PairScore } from './thumbnails.js'
import type { Finding } from './quality-gate.js'

/**
 * De entiteiten uit stap 12, aangepast aan wat er al staat.
 *
 * Bewust NIET opnieuw gemodelleerd: `CreatorProfile` is de kennisbank,
 * `VideoBrief` leunt op het bestaande `Script`, en `PerformanceRecord` is het
 * bestaande `Metric`-model in prisma/schema.prisma. Wat hier wel bij komt, is
 * alles rond de keuze vóór de productie: niche, positionering, ideeën, titels
 * en thumbnails.
 */

export type IdeaStatus = 'open' | 'geaccepteerd' | 'afgewezen' | 'gepland' | 'gemaakt'

export interface VideoIdea {
  id: string
  contentPillar: string
  concept: string
  /** Waar de kijker mee komt: leren, oplossen, beleven, kiezen. */
  viewerIntent: string
  format: string
  evergreen: boolean
  productionDifficulty: 'laag' | 'middel' | 'hoog'
  funnelStage: 'ontdekking' | 'vertrouwen' | 'binding' | 'conversie'
  status: IdeaStatus
  titles?: ScoredTitle[]
  thumbnails?: ScoredThumbnail[]
  pairs?: PairScore[]
  selectedTitle?: string
  selectedThumbnail?: string
  /** Bevindingen van de kwaliteitspoort bij de laatste ronde. */
  findings?: Finding[]
  /** Welke versie dit is. Elke hergeneratie verhoogt dit. */
  revision: number
}

export interface Positioning {
  proposition: string
  statement: string
  audience: string
  viewerProblem: string
  emotionalPromise: string
  functionalPromise: string
  reasonsToSubscribe: string[]
  differentiator: string
  brandPersonality: string
  toneOfVoice: string
  language: string
  contentPillars: string[]
  repeatableFormats: string[]
  recommendedLengthSeconds: number
  publicationRhythm: string
}

export interface ChannelProject {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  /** Momentopname van het makersprofiel waarop dit project is gebouwd. */
  creatorSnapshot: KnowledgePack['creator']
  evaluations: NicheEvaluation[]
  selectedNiche?: string
  positioning?: Positioning
  ideas: VideoIdea[]
  /** Onderdelen die de gebruiker heeft vastgezet en niet opnieuw genereert. */
  locked: string[]
}

interface Snapshot { projects: Record<string, ChannelProject> }

/**
 * Opslag in één JSON-bestand, dezelfde aanpak als `JsonFileStore`. Dat is met
 * opzet: de overstap naar PostgreSQL is straks één implementatie, niet een
 * herschrijving van alles wat eraan hangt.
 */
export class ProjectStore {
  private snapshot: Snapshot = { projects: {} }
  private loaded = false

  constructor(private readonly path: string) {}

  private async load(): Promise<void> {
    if (this.loaded) return
    try {
      this.snapshot = JSON.parse(await readFile(this.path, 'utf8')) as Snapshot
    } catch { this.snapshot = { projects: {} } }
    this.loaded = true
  }

  private async flush(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(this.path, JSON.stringify(this.snapshot, null, 2), 'utf8')
  }

  async create(name: string, creator: KnowledgePack['creator']): Promise<ChannelProject> {
    await this.load()
    const now = new Date().toISOString()
    const project: ChannelProject = {
      id: randomUUID().slice(0, 8), name, createdAt: now, updatedAt: now,
      creatorSnapshot: creator, evaluations: [], ideas: [], locked: [],
    }
    this.snapshot.projects[project.id] = project
    await this.flush()
    return project
  }

  async save(project: ChannelProject): Promise<void> {
    await this.load()
    this.snapshot.projects[project.id] = { ...project, updatedAt: new Date().toISOString() }
    await this.flush()
  }

  async get(id: string): Promise<ChannelProject | undefined> {
    await this.load()
    const p = this.snapshot.projects[id]
    return p ? { ...p } : undefined
  }

  async list(): Promise<ChannelProject[]> {
    await this.load()
    return Object.values(this.snapshot.projects)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  /** Vastgezette onderdelen worden bij hergeneratie overgeslagen. */
  async lock(id: string, part: string): Promise<void> {
    const project = await this.get(id)
    if (!project) throw new Error(`Onbekend project ${id}`)
    if (!project.locked.includes(part)) project.locked.push(part)
    await this.save(project)
  }

  async unlock(id: string, part: string): Promise<void> {
    const project = await this.get(id)
    if (!project) throw new Error(`Onbekend project ${id}`)
    project.locked = project.locked.filter((p) => p !== part)
    await this.save(project)
  }
}

/**
 * Vergelijkt niches naast elkaar op de onderdelen die het verschil maken. De
 * totaalscore staat er wel bij, maar de categorieën eronder zijn wat je nodig
 * hebt om te kiezen — twee niches van 78 kunnen om heel andere redenen 78 zijn.
 */
export function compareNiches(evaluations: NicheEvaluation[]): string {
  if (evaluations.length === 0) return 'Nog geen niches beoordeeld.'
  const keys = ['audience_demand', 'creator_advantage', 'original_positioning',
    'evergreen', 'scalability', 'competition']
  const width = 22

  const header = ['categorie'.padEnd(width), ...evaluations.map((_, i) => `#${i + 1}`.padStart(6))]
  const rows = keys.map((key) => {
    const cells = evaluations.map((e) => {
      const c = e.scorecard.categories.find((x) => x.key === key)
      return `${c?.score ?? 0}/${c?.max ?? 0}`.padStart(6)
    })
    return [key.padEnd(width), ...cells].join(' ')
  })
  const totals = ['TOTAAL'.padEnd(width),
    ...evaluations.map((e) => `${e.scorecard.total}`.padStart(6))].join(' ')
  const names = evaluations.map((e, i) =>
    `  #${i + 1}  ${e.proposal.proposition.slice(0, 72)}`)

  return [header.join(' '), ...rows, totals, '', ...names].join('\n')
}

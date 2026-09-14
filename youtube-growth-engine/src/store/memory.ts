import type { Asset, LicenseProof, Production, ProductionState } from '../domain/types.js'
import { assertTransition } from '../domain/states.js'

/**
 * Opslag achter een interface, net als de providers. M1 draait op geheugen
 * zodat `npm run demo` zonder infrastructuur werkt; `prisma/schema.prisma` is
 * het canonieke model en de PostgreSQL-implementatie komt in M2.
 */
export interface Store {
  save(p: Production): Promise<void>
  get(id: string): Promise<Production | undefined>
  transition(id: string, to: ProductionState, detail?: string): Promise<Production>
  putAsset(a: Asset): Promise<void>
  getAssets(ids: string[]): Promise<Asset[]>
  putLicense(l: LicenseProof): Promise<void>
  /** Idempotente upload: dezelfde sleutel geeft het bestaande videoId terug. */
  claimUpload(key: string, videoId: string): Promise<{ videoId: string; created: boolean }>
}

export class MemoryStore implements Store {
  private readonly productions = new Map<string, Production>()
  private readonly assets = new Map<string, Asset>()
  private readonly licenses = new Map<string, LicenseProof>()
  private readonly uploads = new Map<string, string>()

  async save(p: Production): Promise<void> { this.productions.set(p.id, { ...p }) }

  async get(id: string): Promise<Production | undefined> {
    const p = this.productions.get(id)
    return p ? { ...p } : undefined
  }

  async transition(id: string, to: ProductionState, detail?: string): Promise<Production> {
    const p = this.productions.get(id)
    if (!p) throw new Error(`Onbekende productie ${id}`)
    assertTransition(p.state, to)
    const next: Production = { ...p, state: to }
    if (to === 'rejected' && detail) next.rejectedReason = detail
    this.productions.set(id, next)
    return { ...next }
  }

  async putAsset(a: Asset): Promise<void> {
    if (!a.licenseProofId) {
      // In PostgreSQL is dit een NOT NULL-constraint. Hier hetzelfde effect.
      throw new Error(`Asset ${a.id} heeft geen licentiebewijs en kan de montage niet in.`)
    }
    if (!this.licenses.has(a.licenseProofId)) {
      throw new Error(`Asset ${a.id} verwijst naar onbekend licentiebewijs ${a.licenseProofId}.`)
    }
    this.assets.set(a.id, a)
  }

  async getAssets(ids: string[]): Promise<Asset[]> {
    return ids.map((id) => this.assets.get(id)).filter((a): a is Asset => a !== undefined)
  }

  async putLicense(l: LicenseProof): Promise<void> { this.licenses.set(l.id, l) }

  async claimUpload(key: string, videoId: string): Promise<{ videoId: string; created: boolean }> {
    const existing = this.uploads.get(key)
    if (existing) return { videoId: existing, created: false }
    this.uploads.set(key, videoId)
    return { videoId, created: true }
  }
}

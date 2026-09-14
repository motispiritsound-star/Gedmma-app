import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Asset, LicenseProof, Production, ProductionState } from '../domain/types.js'
import { assertTransition } from '../domain/states.js'
import type { Store } from './memory.js'

interface Snapshot {
  productions: Record<string, Production>
  assets: Record<string, Asset>
  licenses: Record<string, LicenseProof>
  uploads: Record<string, string>
}

const empty = (): Snapshot => ({ productions: {}, assets: {}, licenses: {}, uploads: {} })

/**
 * Opslag in één JSON-bestand, zodat `npm run produce` en `npm run upload` los
 * van elkaar kunnen draaien zonder dat er een database hoeft te staan.
 *
 * Dit is de tussenstap tussen het geheugen van M1 en PostgreSQL in M2, en het
 * is bewust dezelfde `Store`-interface: de overstap is straks één regel.
 */
export class JsonFileStore implements Store {
  private snapshot: Snapshot = empty()
  private loaded = false

  constructor(private readonly path: string) {}

  private async load(): Promise<void> {
    if (this.loaded) return
    try {
      this.snapshot = JSON.parse(await readFile(this.path, 'utf8')) as Snapshot
    } catch {
      this.snapshot = empty()
    }
    this.loaded = true
  }

  private async flush(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(this.path, JSON.stringify(this.snapshot, null, 2), 'utf8')
  }

  async save(p: Production): Promise<void> {
    await this.load()
    this.snapshot.productions[p.id] = { ...p }
    await this.flush()
  }

  async get(id: string): Promise<Production | undefined> {
    await this.load()
    const p = this.snapshot.productions[id]
    return p ? { ...p } : undefined
  }

  async list(): Promise<Production[]> {
    await this.load()
    return Object.values(this.snapshot.productions)
  }

  async transition(id: string, to: ProductionState, detail?: string): Promise<Production> {
    await this.load()
    const p = this.snapshot.productions[id]
    if (!p) throw new Error(`Onbekende productie ${id}`)
    assertTransition(p.state, to)
    const next: Production = { ...p, state: to }
    if (to === 'rejected' && detail) next.rejectedReason = detail
    this.snapshot.productions[id] = next
    await this.flush()
    return { ...next }
  }

  async putAsset(a: Asset): Promise<void> {
    await this.load()
    if (!a.licenseProofId) {
      throw new Error(`Asset ${a.id} heeft geen licentiebewijs en kan de montage niet in.`)
    }
    if (!this.snapshot.licenses[a.licenseProofId]) {
      throw new Error(`Asset ${a.id} verwijst naar onbekend licentiebewijs ${a.licenseProofId}.`)
    }
    this.snapshot.assets[a.id] = a
    await this.flush()
  }

  async getAssets(ids: string[]): Promise<Asset[]> {
    await this.load()
    return ids.map((id) => this.snapshot.assets[id]).filter((a): a is Asset => a !== undefined)
  }

  async putLicense(l: LicenseProof): Promise<void> {
    await this.load()
    this.snapshot.licenses[l.id] = l
    await this.flush()
  }

  async peekUpload(key: string): Promise<string | undefined> {
    await this.load()
    return this.snapshot.uploads[key] || undefined
  }

  async claimUpload(key: string, videoId: string): Promise<{ videoId: string; created: boolean }> {
    await this.load()
    const existing = this.snapshot.uploads[key]
    if (existing) return { videoId: existing, created: false }
    this.snapshot.uploads[key] = videoId
    await this.flush()
    return { videoId, created: true }
  }
}

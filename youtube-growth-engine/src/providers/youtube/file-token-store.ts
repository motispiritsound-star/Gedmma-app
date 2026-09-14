import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { StoredTokens, TokenStore } from './auth.js'

/**
 * Tokens op schijf, met leesrechten alleen voor de eigenaar. Ze staan bewust
 * niet in de database: een databasedump hoort geen kanaaltoegang te bevatten.
 * Voor productie hoort hier een secret manager; het bestand is de eenvoudige
 * variant voor een machine die jij beheert.
 */
export class FileTokenStore implements TokenStore {
  constructor(private readonly path: string) {}

  async read(): Promise<StoredTokens | undefined> {
    try {
      return JSON.parse(await readFile(this.path, 'utf8')) as StoredTokens
    } catch { return undefined }
  }

  async write(tokens: StoredTokens): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true })
    await writeFile(this.path, JSON.stringify(tokens, null, 2), 'utf8')
    await chmod(this.path, 0o600)
  }

  async clear(): Promise<void> {
    await rm(this.path, { force: true })
  }
}

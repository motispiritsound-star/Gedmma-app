import { createHash } from 'node:crypto'
import { open, stat } from 'node:fs/promises'
import type { OAuthConfig, TokenStore } from './auth.js'
import { getAccessToken, OAuthRevokedError } from './auth.js'
import type { Store } from '../../store/memory.js'

const UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/youtube/v3/videos'
const THUMBNAIL_ENDPOINT = 'https://www.googleapis.com/upload/youtube/v3/thumbnails/set'
const CAPTION_ENDPOINT = 'https://www.googleapis.com/upload/youtube/v3/captions'

export interface UploadRequest {
  productionId: string
  language: string
  videoPath: string
  title: string
  description: string
  tags: string[]
  /** 27 = Education, 22 = People & Blogs. */
  categoryId: string
  /** Altijd 'private' zolang APPROVAL_MODE aanstaat. */
  privacyStatus: 'private' | 'unlisted' | 'public'
  /** RFC3339. Alleen zinvol bij privacyStatus 'private'. */
  publishAt?: string
  /** YouTube's veld voor gemanipuleerde of synthetische content. */
  containsSyntheticMedia: boolean
  /** Verplicht veld bij YouTube. False = niet specifiek voor kinderen gemaakt. */
  madeForKids: boolean
  thumbnailPath?: string
  /** Vereist de bredere scope `youtube.force-ssl`; standaard uit. */
  srtPath?: string
}

export interface UploadOutcome {
  videoId: string
  /** False wanneer deze inhoud al eerder is geupload. */
  created: boolean
  quotaUnitsSpent: number
}

/** Dezelfde inhoud levert dezelfde sleutel, dus nooit een tweede upload. */
export async function idempotencyKey(req: UploadRequest): Promise<string> {
  const handle = await open(req.videoPath, 'r')
  try {
    const hash = createHash('sha256')
    const buffer = Buffer.alloc(1024 * 1024)
    let position = 0
    for (;;) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, position)
      if (bytesRead === 0) break
      hash.update(buffer.subarray(0, bytesRead))
      position += bytesRead
    }
    return `${req.productionId}:${req.language}:${hash.digest('hex').slice(0, 32)}`
  } finally {
    await handle.close()
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Exponentiele backoff met jitter. 401 en 403 zijn geen tijdelijke fouten. */
async function withBackoff<T>(
  label: string, attempt: () => Promise<T>, maxTries = 5,
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < maxTries; i += 1) {
    try {
      return await attempt()
    } catch (error) {
      if (error instanceof OAuthRevokedError) throw error
      if (error instanceof HttpError && error.status < 500 && error.status !== 429) throw error
      lastError = error
      const delay = Math.min(32_000, 2 ** i * 1000) + Math.random() * 500
      await sleep(delay)
    }
  }
  throw new Error(`${label} bleef falen na ${maxTries} pogingen: ${String(lastError)}`)
}

export class HttpError extends Error {
  constructor(readonly status: number, readonly body: string, label: string) {
    super(`${label} gaf HTTP ${status}: ${body.slice(0, 400)}`)
    this.name = 'HttpError'
  }
}

async function expectOk(response: Response, label: string): Promise<string> {
  const text = await response.text()
  if (!response.ok) throw new HttpError(response.status, text, label)
  return text
}

/**
 * Uploadt prive, in stukken, en geeft bij een tweede aanroep met dezelfde
 * inhoud het bestaande videoId terug in plaats van opnieuw te uploaden.
 *
 * De quotakosten van `videos.insert` zijn in de bronnen tegenstrijdig (zie
 * docs/10). Daarom meet deze code het verbruik zelf en alarmeert op 80% van
 * het ingestelde dagbudget, in plaats van op een aangenomen getal te vertrouwen.
 */
export class YouTubeUploader {
  constructor(
    private readonly config: OAuthConfig,
    private readonly tokens: TokenStore,
    private readonly store: Store,
    private readonly opts: { chunkBytes?: number; onQuota?: (units: number) => void } = {},
  ) {}

  async upload(req: UploadRequest): Promise<UploadOutcome> {
    const key = await idempotencyKey(req)
    const existing = await this.store.peekUpload(key)
    if (existing) {
      // Dezelfde inhoud is al geupload. Geen tweede upload, geen quotum.
      return { videoId: existing, created: false, quotaUnitsSpent: 0 }
    }

    const accessToken = await getAccessToken(this.config, this.tokens)
    const size = (await stat(req.videoPath)).size

    const metadata = {
      snippet: {
        title: req.title.slice(0, 100),
        description: req.description.slice(0, 5000),
        tags: req.tags.slice(0, 30),
        categoryId: req.categoryId,
        defaultLanguage: req.language,
      },
      status: {
        privacyStatus: req.privacyStatus,
        selfDeclaredMadeForKids: req.madeForKids,
        containsSyntheticMedia: req.containsSyntheticMedia,
        ...(req.publishAt ? { publishAt: req.publishAt } : {}),
      },
    }

    // 1. Sessie openen.
    const location = await withBackoff('resumable init', async () => {
      const response = await fetch(
        `${UPLOAD_ENDPOINT}?uploadType=resumable&part=snippet,status`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
            'x-upload-content-length': String(size),
            'x-upload-content-type': 'video/mp4',
          },
          body: JSON.stringify(metadata),
        },
      )
      await expectOk(response, 'resumable init')
      const url = response.headers.get('location')
      if (!url) throw new Error('Google gaf geen upload-URL terug.')
      return url
    })

    // 2. In stukken versturen, zodat een haperende verbinding niet alles kost.
    const chunkBytes = this.opts.chunkBytes ?? 8 * 1024 * 1024
    const handle = await open(req.videoPath, 'r')
    let videoId = ''
    try {
      let offset = 0
      while (offset < size) {
        const length = Math.min(chunkBytes, size - offset)
        const buffer = Buffer.alloc(length)
        await handle.read(buffer, 0, length, offset)
        const end = offset + length - 1

        const body = await withBackoff(`chunk ${offset}`, async () => {
          const response = await fetch(location, {
            method: 'PUT',
            headers: {
              'content-length': String(length),
              'content-range': `bytes ${offset}-${end}/${size}`,
            },
            body: new Uint8Array(buffer),
          })
          // 308 = stuk ontvangen, ga door. Geen fout.
          if (response.status === 308) return ''
          return expectOk(response, `chunk ${offset}`)
        })

        offset += length
        if (body) videoId = (JSON.parse(body) as { id: string }).id
      }
    } finally {
      await handle.close()
    }

    if (!videoId) throw new Error('Upload voltooid maar Google gaf geen videoId terug.')
    await this.store.claimUpload(key, videoId)

    let quotaUnitsSpent = 1600 // conservatieve aanname; zie docs/10
    if (req.thumbnailPath) {
      await this.setThumbnail(accessToken, videoId, req.thumbnailPath)
      quotaUnitsSpent += 50
    }
    this.opts.onQuota?.(quotaUnitsSpent)

    return { videoId, created: true, quotaUnitsSpent }
  }

  private async setThumbnail(token: string, videoId: string, path: string): Promise<void> {
    const handle = await open(path, 'r')
    try {
      const data = await handle.readFile()
      await withBackoff('thumbnails.set', async () => {
        const response = await fetch(`${THUMBNAIL_ENDPOINT}?videoId=${videoId}`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'image/png' },
          body: new Uint8Array(data),
        })
        await expectOk(response, 'thumbnails.set')
      })
    } finally {
      await handle.close()
    }
  }

  /**
   * Ondertiteling via de API. Vereist `youtube.force-ssl`, die ook
   * schrijfrechten op reacties geeft — daarom standaard uit. Zonder deze scope
   * upload je het SRT-bestand met de hand; dat kost twintig seconden.
   */
  async uploadCaptions(videoId: string, srtPath: string, language: string): Promise<void> {
    const accessToken = await getAccessToken(this.config, this.tokens)
    const handle = await open(srtPath, 'r')
    try {
      const srt = await handle.readFile()
      const boundary = `yge-${Date.now()}`
      const metadata = JSON.stringify({
        snippet: { videoId, language, name: 'Nederlands', isDraft: false },
      })
      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\ncontent-type: application/json\r\n\r\n${metadata}\r\n`),
        Buffer.from(`--${boundary}\r\ncontent-type: application/octet-stream\r\n\r\n`),
        srt,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ])
      await withBackoff('captions.insert', async () => {
        const response = await fetch(`${CAPTION_ENDPOINT}?uploadType=multipart&part=snippet`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': `multipart/related; boundary=${boundary}`,
          },
          body: new Uint8Array(body),
        })
        await expectOk(response, 'captions.insert')
      })
    } finally {
      await handle.close()
    }
  }
}

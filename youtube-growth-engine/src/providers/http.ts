/**
 * Gedeelde HTTP-hulp voor provider-adapters: time-out, exponentiële backoff met
 * jitter, en het onderscheid tussen fouten die overgaan en fouten die dat niet
 * doen. Een 401 opnieuw proberen is zinloos en kost alleen tijd.
 */

export class ProviderHttpError extends Error {
  constructor(
    readonly provider: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(`${provider} gaf HTTP ${status}: ${body.slice(0, 300)}`)
    this.name = 'ProviderHttpError'
  }

  /** 429 en 5xx gaan meestal over; 4xx niet. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500
  }
}

export interface RequestOptions {
  provider: string
  url: string
  headers: Record<string, string>
  body: unknown
  timeoutMs?: number
  maxTries?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function postJson<T>(opts: RequestOptions): Promise<T> {
  const maxTries = opts.maxTries ?? 4
  let lastError: unknown

  for (let attempt = 0; attempt < maxTries; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 180_000)
    try {
      const response = await fetch(opts.url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...opts.headers },
        body: JSON.stringify(opts.body),
        signal: controller.signal,
      })
      const text = await response.text()
      if (!response.ok) {
        const error = new ProviderHttpError(opts.provider, response.status, text)
        if (!error.retryable) throw error
        lastError = error
      } else {
        return JSON.parse(text) as T
      }
    } catch (error) {
      if (error instanceof ProviderHttpError && !error.retryable) throw error
      lastError = error
    } finally {
      clearTimeout(timer)
    }
    await sleep(Math.min(20_000, 2 ** attempt * 1000) + Math.random() * 400)
  }
  throw new Error(`${opts.provider} bleef falen na ${maxTries} pogingen: ${String(lastError)}`)
}

/** Haalt een gegenereerd bestand op en schrijft het weg. */
export async function download(url: string, path: string): Promise<number> {
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { dirname } = await import('node:path')
  const response = await fetch(url)
  if (!response.ok) {
    throw new ProviderHttpError('download', response.status, await response.text())
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, bytes)
  return bytes.length
}

import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { ProviderHttpError } from '../src/providers/http.js'
import { SplitImageProvider, buildProviders, monthlyEstimate } from '../src/providers/registry.js'
import type { ImageProvider } from '../src/providers/contracts.js'

const fake = (name: string): ImageProvider & { calls: string[] } => {
  const calls: string[] = []
  return {
    name, simulated: true, calls,
    async generate(input) {
      calls.push(input.outPath)
      return {
        value: { path: input.outPath, figureCheck: 'pass' as const },
        costCents: 1, latencyMs: 1, providerRef: name,
      }
    },
  }
}

describe('HTTP-fouten', () => {
  it('probeert 429 en 5xx opnieuw, 4xx niet', () => {
    expect(new ProviderHttpError('p', 429, '').retryable).toBe(true)
    expect(new ProviderHttpError('p', 500, '').retryable).toBe(true)
    expect(new ProviderHttpError('p', 503, '').retryable).toBe(true)
    expect(new ProviderHttpError('p', 401, '').retryable).toBe(false)
    expect(new ProviderHttpError('p', 400, '').retryable).toBe(false)
    expect(new ProviderHttpError('p', 404, '').retryable).toBe(false)
  })

  it('kort het antwoord in zodat een foutmelding leesbaar blijft', () => {
    const error = new ProviderHttpError('p', 500, 'x'.repeat(5000))
    expect(error.message.length).toBeLessThan(400)
  })
})

describe('beeld splitsen tussen twee modellen', () => {
  it('stuurt thumbnails naar het model dat tekst kan, stills naar het goedkope', async () => {
    const stills = fake('stills')
    const thumbs = fake('thumbs')
    const split = new SplitImageProvider(stills, thumbs)

    await split.generate({
      prompt: 'p', figureFree: true, width: 1920, height: 1080,
      outPath: '/out/abc-shot-3.png',
    })
    await split.generate({
      prompt: 'p', figureFree: false, width: 1280, height: 720,
      outPath: '/out/abc-thumb-1.png',
    })

    expect(stills.calls).toEqual(['/out/abc-shot-3.png'])
    expect(thumbs.calls).toEqual(['/out/abc-thumb-1.png'])
  })

  it('heet alleen gesimuleerd wanneer beide kanten dat zijn', () => {
    const echt: ImageProvider = { ...fake('echt'), simulated: false }
    expect(new SplitImageProvider(fake('a'), fake('b')).simulated).toBe(true)
    expect(new SplitImageProvider(echt, fake('b')).simulated).toBe(false)
  })
})

describe('maandraming', () => {
  const env = { ...process.env }
  beforeEach(() => {
    process.env['FAL_IMAGE_CENTS'] = '3'
    process.env['GEMINI_IMAGE_CENTS'] = '14'
    process.env['FAL_VIDEO_CENTS_PER_SEC'] = '3'
  })
  afterEach(() => { process.env = { ...env } })

  it('rekent stills, thumbnails en clipseconden apart', () => {
    const e = monthlyEstimate({
      longFormPerMonth: 4, imagesPerVideo: 45, thumbnailsPerVideo: 6, clipSecondsPerVideo: 25,
    })
    expect(e.images).toBe(180)
    expect(e.thumbnails).toBe(24)
    expect(e.clips).toBe(100)
    // 180*3 + 24*14 + 100*3 = 540 + 336 + 300 = 1176 cent
    expect(e.totalCents).toBe(1176)
  })

  it('blijft ruim onder een abonnement van EUR 35 bij dit tempo', () => {
    const e = monthlyEstimate({
      longFormPerMonth: 4.3, imagesPerVideo: 45, thumbnailsPerVideo: 6, clipSecondsPerVideo: 25,
    })
    expect(e.totalCents).toBeLessThan(3500)
  })
})

describe('providerkeuze', () => {
  const env = { ...process.env }
  afterEach(() => { process.env = { ...env } })

  it('valt terug op mocks en zegt wat er ontbreekt', () => {
    delete process.env['ANTHROPIC_API_KEY']
    delete process.env['FAL_KEY']
    delete process.env['GEMINI_API_KEY']

    const { providers, report } = buildProviders()
    expect(providers.image.simulated).toBe(true)
    expect(providers.videoClip.simulated).toBe(true)

    const beeld = report.find((r) => r.role === 'beeld')
    expect(beeld?.missing).toMatch(/FAL_KEY/)
    // De montage draait altijd echt: dat is FFmpeg op de eigen machine.
    expect(report.find((r) => r.role === 'montage')?.simulated).toBe(false)
  })

  it('splitst zodra beide beeldsleutels er zijn', () => {
    process.env['FAL_KEY'] = 'test'
    process.env['GEMINI_API_KEY'] = 'test'
    const { providers } = buildProviders()
    expect(providers.image).toBeInstanceOf(SplitImageProvider)
    expect(providers.image.name).toBe('fal-image+gemini-image')
  })

  it('meldt het ontbrekende thumbnailmodel wanneer alleen fal er is', () => {
    process.env['FAL_KEY'] = 'test'
    delete process.env['GEMINI_API_KEY']
    const { report } = buildProviders()
    expect(report.find((r) => r.role === 'beeld')?.missing).toMatch(/GEMINI_API_KEY/)
  })
})

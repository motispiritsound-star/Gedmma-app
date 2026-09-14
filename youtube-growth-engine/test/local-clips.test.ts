import { copyFile, mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'
import { LocalClipProvider } from '../src/providers/local/clips.js'

const run = promisify(execFile)

/**
 * Eén echte MP4 voor de hele suite, daarna kopiëren. FFmpeg per testbestand
 * aanroepen maakte deze test traag genoeg om onder belasting om te vallen — en
 * een test die van de machinebelasting afhangt, test niets.
 */
let sjabloon: string | undefined
async function mp4Sjabloon(): Promise<string> {
  if (sjabloon) return sjabloon
  const dir = await mkdtemp(join(tmpdir(), 'clip-tpl-'))
  const pad = join(dir, 'sjabloon.mp4')
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=64x64:d=3',
    '-pix_fmt', 'yuv420p', pad])
  sjabloon = pad
  return pad
}

async function clipDir(names: string[]): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'clips-'))
  await mkdir(dir, { recursive: true })
  for (const name of names) {
    if (name.endsWith('.mp4')) await copyFile(await mp4Sjabloon(), join(dir, name))
    else await writeFile(join(dir, name), 'geen video')
  }
  return dir
}

const ask = (prompt: string, seconds = 3) =>
  ({ prompt, seconds, outPath: '/tmp/onbelangrijk.mp4' })

describe('clips die met de hand zijn aangeleverd', () => {
  it('koppelt op de scènesleutel voorin de prompt', async () => {
    const dir = await clipDir(['scene-05-gemaal.mp4'])
    const p = new LocalClipProvider({ dir })
    const result = await p.generate(ask('[scene-05] Gemaal bij nacht'))
    expect(result.value.path).toContain('scene-05-gemaal.mp4')
  })

  it('kiest de meest specifieke naam als er meerdere passen', async () => {
    const dir = await clipDir(['scene-0.mp4', 'scene-05-gemaal.mp4'])
    const p = new LocalClipProvider({ dir })
    const result = await p.generate(ask('[scene-0] iets'))
    expect(result.value.path).toContain('scene-05-gemaal.mp4')
  })

  it('slaat een scène zonder clip stilzwijgend over — de stills doen het werk', async () => {
    const dir = await clipDir([])
    const p = new LocalClipProvider({ dir })
    const result = await p.generate(ask('[scene-09] niets hier'))
    expect(result.value.path).toBe('')
    expect(result.providerRef).toMatch(/ontbreekt/)
  })

  it('stopt wel wanneer je dat expliciet vraagt', async () => {
    const dir = await clipDir([])
    const p = new LocalClipProvider({ dir, onMissing: 'error' })
    await expect(p.generate(ask('[scene-09] niets hier'))).rejects.toThrow(/Geen clip gevonden/)
  })

  it('negeert bestanden die geen video zijn', async () => {
    const dir = await clipDir(['scene-01.txt', 'scene-01-echt.mp4'])
    const p = new LocalClipProvider({ dir })
    expect((await p.inventory()).clips).toEqual(['scene-01-echt'])
  })

  it('rekent niets per clip — die kosten zijn al bij de tool betaald', async () => {
    const dir = await clipDir(['scene-01.mp4'])
    const p = new LocalClipProvider({ dir, madeWith: 'neural-frames' })
    const result = await p.generate(ask('[scene-01] iets'))
    expect(result.costCents).toBe(0)
    expect(result.providerRef).toContain('neural-frames')
  })

  it('overleeft een map die niet bestaat', async () => {
    const p = new LocalClipProvider({ dir: '/bestaat/echt/niet' })
    expect((await p.inventory()).clips).toEqual([])
    await expect(p.generate(ask('[scene-01] iets'))).resolves.toMatchObject({
      value: { path: '' },
    })
  })
})

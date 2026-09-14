/**
 * `npm run animatic -- --video content/video-001/video.json`
 *
 * Bouwt een bekijkbare animatic: de echte tekst, de echte timing, de echte
 * shotlist, met kaarten in plaats van beeld. Bedoeld om het verhaal en het
 * tempo te beoordelen vóórdat er een cent naar een beeldgenerator gaat.
 *
 * Wat hier echt is: de lengte, de volgorde, de verhouding tussen de scènes en
 * de ondertiteling. Wat niet: het beeld en de stem.
 */
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { FONT, ffmpeg, probeDurationMs } from './lib/ffmpeg.js'
import { buildSrt } from './lib/srt.js'
import { analysePacing } from './studio/pacing.js'
import type { Script } from './domain/types.js'

interface Scene { n: number; visual: string; narration: string }
interface VideoFile {
  id: string; title: string; language: string
  aspect: '16:9' | '9:16'; speakingRate: number; scenes: Scene[]
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

/** Breekt tekst af op woordgrenzen zodat drawtext hem kan zetten. */
function wrap(text: string, perLine: number): string {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > perLine) { lines.push(line.trim()); line = w }
    else line += ' ' + w
  }
  if (line.trim()) lines.push(line.trim())
  return lines.join('\n')
}

const PALETTE = ['0x14332b', '0x1b3a4b', '0x2b2140', '0x143033', '0x3a2f1b']

async function main(): Promise<void> {
  const path = arg('video') ?? 'content/video-001/video.json'
  const video = JSON.parse(await readFile(path, 'utf8')) as VideoFile
  const outDir = arg('out') ?? join('out', 'animatic')
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  const vertical = video.aspect === '9:16'
  const width = vertical ? 720 : 1280
  const height = vertical ? 1280 : 720

  // Elke scène duurt precies zolang als zijn tekst duurt om uit te spreken.
  // Daarmee is de animatic even lang als de echte video wordt.
  const timed = video.scenes.map((scene) => {
    const words = scene.narration.trim().split(/\s+/).filter(Boolean).length
    return { ...scene, seconds: Math.max(2, words / video.speakingRate) }
  })
  const total = timed.reduce((sum, s) => sum + s.seconds, 0)

  console.log(`\n${video.title}`)
  console.log(`${timed.length} scènes · ${Math.round(total)} seconden (${(total / 60).toFixed(1)} min)\n`)

  // --- Kaarten -------------------------------------------------------------
  const cards: string[] = []
  for (const [i, scene] of timed.entries()) {
    const cardPath = join(outDir, `scene-${String(scene.n).padStart(2, '0')}.png`)
    const headerPath = `${cardPath}.head.txt`
    const bodyPath = `${cardPath}.body.txt`
    const footPath = `${cardPath}.foot.txt`

    const from = timed.slice(0, i).reduce((s, x) => s + x.seconds, 0)
    const stamp = `${String(Math.floor(from / 60)).padStart(2, '0')}:${String(Math.floor(from % 60)).padStart(2, '0')}`

    await writeFile(headerPath, `SCENE ${scene.n}  ·  ${stamp}`, 'utf8')
    await writeFile(bodyPath, wrap(scene.visual, vertical ? 26 : 40), 'utf8')
    await writeFile(footPath, wrap(scene.narration, vertical ? 34 : 62), 'utf8')

    await ffmpeg([
      '-f', 'lavfi', '-i', `color=c=${PALETTE[i % PALETTE.length]}:s=${width}x${height}`,
      '-vf', [
        `drawtext=fontfile=${FONT}:textfile=${headerPath}:fontcolor=0x8FBF9F:` +
          `fontsize=${Math.round(height / 34)}:x=48:y=44`,
        `drawtext=fontfile=${FONT}:textfile=${bodyPath}:fontcolor=0xF2EFE6:` +
          `fontsize=${Math.round(height / 17)}:x=48:y=${Math.round(height * 0.22)}:line_spacing=12`,
        // De narratie onderin, zoals ondertiteling. Zo lees je mee terwijl je
        // kijkt of het tempo klopt.
        `drawtext=fontfile=${FONT}:textfile=${footPath}:fontcolor=0xC9A961:` +
          `fontsize=${Math.round(height / 30)}:x=48:y=h-th-52:line_spacing=8`,
      ].join(','),
      '-frames:v', '1', cardPath,
    ])
    cards.push(cardPath)
  }

  // --- Stilte van de juiste lengte ----------------------------------------
  const audioPath = join(outDir, 'toon.wav')
  await ffmpeg([
    '-f', 'lavfi', '-i', `sine=frequency=174:sample_rate=44100:duration=${total.toFixed(2)}`,
    '-af', 'volume=-34dB', '-ac', '1', audioPath,
  ])

  // --- Montage -------------------------------------------------------------
  const listPath = join(outDir, 'concat.txt')
  const lines: string[] = []
  for (const [i, scene] of timed.entries()) {
    lines.push(`file '${process.cwd()}/${cards[i]}'`, `duration ${scene.seconds.toFixed(3)}`)
  }
  lines.push(`file '${process.cwd()}/${cards[cards.length - 1]}'`)
  await writeFile(listPath, lines.join('\n'), 'utf8')

  const outPath = join(outDir, `${video.id}-animatic.mp4`)
  await ffmpeg([
    '-f', 'concat', '-safe', '0', '-i', listPath, '-i', audioPath,
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '25',
    '-c:a', 'aac', '-b:a', '96k', '-shortest', outPath,
  ])

  // --- Ondertiteling uit dezelfde timing ----------------------------------
  const charTimings: { char: string; atMs: number }[] = []
  let offset = 0
  for (const scene of timed) {
    const perChar = (scene.seconds * 1000) / Math.max(1, scene.narration.length)
    for (const [i, char] of [...scene.narration].entries()) {
      charTimings.push({ char, atMs: Math.round(offset + i * perChar) })
    }
    offset += scene.seconds * 1000
  }
  const srtPath = join(outDir, `${video.id}.srt`)
  await writeFile(srtPath, buildSrt(charTimings, Math.round(total * 1000)), 'utf8')

  // --- Tempocontrole op de echte tekst ------------------------------------
  const script: Script = {
    thesis: video.title,
    hook: timed[0]?.narration ?? '',
    promise: timed[2]?.narration ?? '',
    segments: timed.slice(3).map((s) => ({ title: `scene ${s.n}`, body: s.narration })),
    counterArgument: '', conclusion: timed[timed.length - 1]?.narration ?? '',
    callToAction: '', wordCount: 0,
  }
  const pacing = analysePacing(script, Math.round(total))

  console.log('--- Tempo ---')
  console.log(`  hook: ${pacing.hookSeconds} s ${pacing.hookWithinFive ? 'OK' : 'TE LANG'}`)
  console.log(`  eerste beloning op ${pacing.firstRewardSecond} s ${pacing.rewardOnTime ? 'OK' : 'TE LAAT'}`)
  console.log(`  verboden opening: ${pacing.bannedOpening ?? 'geen'}`)
  console.log(`  geschatte woorden: ${pacing.estimatedWords}`)
  if (Math.round(total) < 480) {
    console.log(`\n  LET OP: ${Math.round(total)} seconden is onder de 8 minuten.`)
    console.log('  Daarmee vervallen midrolls. Dat maakt nu niets uit — die komen')
    console.log('  pas na de YPP-drempel — maar het is een keuze en geen toeval.')
  }

  const durationMs = await probeDurationMs(outPath)
  console.log(`\n  ${outPath}  (${Math.round(durationMs / 1000)} s)`)
  console.log(`  ${srtPath}\n`)
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })

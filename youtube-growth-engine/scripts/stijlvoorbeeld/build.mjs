// Rendert de scènes naar PNG met de headless browser en monteert er een
// stijlvoorbeeld van. Ondertiteling in beeld, zodat je ziet hoe het samenkomt.
import { execFile } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { SCENES, PALETTE } from './scenes.mjs'

const run = promisify(execFile)
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = 'out/stijlvoorbeeld'
const RATE = 2.2 // woorden per seconde

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function main() {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const timed = SCENES.map((s) => ({
    ...s,
    seconds: Math.max(3.2, s.caption.split(/\s+/).length / RATE + 1.4),
  }))

  for (const [i, scene] of timed.entries()) {
    // Ondertiteling in de SVG zelf: één render, geen tweede bewerking, en de
    // typografie is dezelfde als op de pagina.
    const lines = wrap(scene.caption, 52)
    const blockTop = 720 - 52 - lines.length * 42
    const subtitle = `
      <rect x="0" y="${blockTop - 34}" width="1280" height="${720 - blockTop + 34}" fill="${PALETTE.deep}" opacity="0.62"/>
      ${lines.map((line, n) => `
        <text x="64" y="${blockTop + n * 42}" font-family="Georgia, serif" font-size="34"
              fill="${PALETTE.bone}">${esc(line)}</text>`).join('')}`

    const html = `<!doctype html><meta charset="utf-8">
      <style>html,body{margin:0;padding:0;background:${PALETTE.deep};overflow:hidden}</style>
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        ${scene.svg}
        ${subtitle}
      </svg>`

    const htmlPath = join(OUT, `${scene.id}.html`)
    await writeFile(htmlPath, html, 'utf8')
    await run(CHROME, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      '--window-size=1280,720',
      `--screenshot=${join(OUT, `${scene.id}.png`)}`,
      `file://${process.cwd()}/${htmlPath}`,
    ], { maxBuffer: 32 * 1024 * 1024 })
    process.stdout.write(`  ${String(i + 1).padStart(2)}. ${scene.id}  ${scene.seconds.toFixed(1)}s\n`)
  }

  const total = timed.reduce((s, x) => s + x.seconds, 0)

  const listPath = join(OUT, 'concat.txt')
  const lines = []
  for (const scene of timed) {
    lines.push(`file '${process.cwd()}/${join(OUT, `${scene.id}.png`)}'`, `duration ${scene.seconds.toFixed(3)}`)
  }
  lines.push(`file '${process.cwd()}/${join(OUT, `${timed[timed.length - 1].id}.png`)}'`)
  await writeFile(listPath, lines.join('\n'), 'utf8')

  const audio = join(OUT, 'toon.wav')
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'lavfi', '-i', `sine=frequency=174:sample_rate=44100:duration=${total.toFixed(2)}`,
    '-af', 'volume=-34dB', '-ac', '1', audio])

  const out = join(OUT, 'stijlvoorbeeld.mp4')
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', listPath, '-i', audio,
    '-map', '0:v', '-map', '1:a',
    // Langzame inzoom: de beweging die beperkte animatie levert, zonder
    // generatieve clip. Dit is wat FFmpeg straks ook in productie doet.
    '-vf', `zoompan=z='min(zoom+0.0006,1.10)':d=125:s=1280x720:fps=25,format=yuv420p`,
    '-c:v', 'libx264', '-r', '25', '-c:a', 'aac', '-b:a', '96k', '-shortest', out],
    { maxBuffer: 64 * 1024 * 1024 })

  console.log(`\n  ${out}  (${Math.round(total)} s)\n`)
}

function wrap(text, per) {
  const words = text.split(/\s+/)
  const out = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > per && line) { out.push(line.trim()); line = w }
    else line += ' ' + w
  }
  if (line.trim()) out.push(line.trim())
  return out
}

main().catch((e) => { console.error(e); process.exitCode = 1 })

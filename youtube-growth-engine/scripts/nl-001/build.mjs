// Rendert de veertien scènes van NL-001 naar PNG en monteert er een
// beeldvoorbeeld van.
//
// Let op wat dit wél en niet is. Het is GEEN aflevering: veertien beelden over
// zeven minuten zou vijfendertig seconden per plaat zijn en dat kijkt niemand.
// Dit laat in ruim een minuut zien hoe de video eruit komt te zien, met de
// echte tekst eronder, zodat je het beeld kunt beoordelen voordat er een stem
// en een montage aan te pas komen.
import { execFile } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { SCENES, PALETTE } from './scenes.mjs'

const run = promisify(execFile)
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
// Chromium headless geeft een kleiner tekenvlak terug dan het venster dat je
// vraagt: bij 1280x720 blijft er 633 pixel hoogte over en valt de onderste
// strook weg — precies waar de ondertiteling staat. Daarom renderen we hoger
// en snijden we terug op maat. Gemeten, niet geraden: zie de probe in de
// commitboodschap.
const VENSTER_MARGE = 87
const OUT = 'out/nl-001'
const RATE = 2.2

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function main() {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const timed = SCENES.map((s) => ({
    ...s,
    seconds: Math.max(3.4, s.caption.split(/\s+/).length / RATE + 1.2),
  }))

  for (const [i, scene] of timed.entries()) {
    const lines = wrap(scene.caption, 58)
    const bandTop = 720 - 46 - lines.length * 40

    // Ondertiteling op een lichte band: dit kanaal is papier, geen schemering,
    // dus donkere letters op licht in plaats van andersom.
    const subtitle = `
      <rect x="0" y="${bandTop - 30}" width="1280" height="${720 - bandTop + 30}"
        fill="${PALETTE.ink}" opacity="0.92"/>
      ${lines.map((line, n) => `
        <text x="64" y="${bandTop + n * 40}" font-family="Helvetica, Arial, sans-serif"
              font-size="31" fill="${PALETTE.paper}">${esc(line)}</text>`).join('')}`

    const html = `<!doctype html><meta charset="utf-8">
      <style>html,body{margin:0;padding:0;background:${PALETTE.paper};overflow:hidden}</style>
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        ${scene.svg}
        ${subtitle}
      </svg>`

    const htmlPath = join(OUT, `${scene.id}.html`)
    await writeFile(htmlPath, html, 'utf8')
    await run(CHROME, [
      '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
      `--window-size=1280,${720 + VENSTER_MARGE}`,
      `--screenshot=${join(OUT, `${scene.id}-vol.png`)}`,
      `file://${process.cwd()}/${htmlPath}`,
    ], { maxBuffer: 32 * 1024 * 1024 })
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
      '-i', join(OUT, `${scene.id}-vol.png`), '-vf', 'crop=1280:720:0:0',
      join(OUT, `${scene.id}.png`)])
    process.stdout.write(`  ${String(i + 1).padStart(2)}. ${scene.id}  ${scene.seconds.toFixed(1)}s\n`)
  }

  const total = timed.reduce((s, x) => s + x.seconds, 0)

  const listPath = join(OUT, 'concat.txt')
  const lines = []
  for (const scene of timed) {
    lines.push(`file '${process.cwd()}/${join(OUT, `${scene.id}.png`)}'`,
      `duration ${scene.seconds.toFixed(3)}`)
  }
  lines.push(`file '${process.cwd()}/${join(OUT, `${timed.at(-1).id}.png`)}'`)
  await writeFile(listPath, lines.join('\n'), 'utf8')

  const out = join(OUT, 'beeldvoorbeeld.mp4')
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', listPath,
    // Geen toon eronder. Bij het islamitische kanaal stond er een lage sinus om
    // de sfeer te dragen; hier zou dat het beeld tegenwerken. Een technische
    // tekening hoort stil te zijn tot er een stem overheen komt.
    '-vf', 'zoompan=z=\'min(zoom+0.0004,1.06)\':d=125:s=1280x720:fps=25,format=yuv420p',
    '-c:v', 'libx264', '-r', '25', '-an', out],
    { maxBuffer: 64 * 1024 * 1024 })

  console.log(`\n  ${out}  (${Math.round(total)} s, ${SCENES.length} beelden)\n`)
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

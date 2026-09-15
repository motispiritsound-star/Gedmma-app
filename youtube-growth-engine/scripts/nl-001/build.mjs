// Rendert NL-001 naar beeld en monteert er een beeldvoorbeeld van.
//
// Twee soorten scènes:
//   - stil: één plaat, met een trage camerabeweging eroverheen;
//   - bewegend: een scène met `frames` krijgt zijn `svg` aangeroepen als
//     functie van t tussen 0 en 1, en wordt als beeldenreeks gerenderd.
//
// Dat laatste is waarom regen valt, water leeft en het getij stijgt. Het kost
// één browserstart per frame, dus het staat alleen op de momenten die het
// verhaal dragen — niet op een praatplaat waar niets gebeurt.
import { execFile } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { SCENES, PALETTE } from './scenes.mjs'

const run = promisify(execFile)
const CHROME = process.env.CHROME_PATH ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = 'out/nl-001'
const RATE = 2.2
const FPS = 12

// Chromium headless geeft een kleiner tekenvlak terug dan het venster dat je
// vraagt: bij 1280x720 blijft er 633 pixel over en valt de onderste strook weg,
// precies waar de ondertiteling staat. Gemeten, niet geraden.
const VENSTER_MARGE = 87

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Ondertiteling zonder balk.
 *
 * De eerste versie legde er een dichte balk onder. Dat leest makkelijk en het
 * ziet eruit als een instructievideo. Een schaduw onder de letters houdt het
 * beeld heel en blijft leesbaar, ook op het lichtste stuk lucht.
 */
function ondertitel(tekst) {
  const regels = wrap(tekst, 56)
  const basis = 720 - 44 - (regels.length - 1) * 42
  return `
    <defs>
      <linearGradient id="ondergrond" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${PALETTE.nacht}" stop-opacity="0"/>
        <stop offset="100%" stop-color="${PALETTE.nacht}" stop-opacity="0.82"/>
      </linearGradient>
      <filter id="schaduw" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.9"/>
      </filter>
    </defs>
    <rect x="0" y="480" width="1280" height="240" fill="url(#ondergrond)"/>
    ${regels.map((regel, i) => `
      <text x="64" y="${basis + i * 42}" font-family="Archivo, Helvetica, sans-serif"
        font-size="33" font-weight="600" fill="${PALETTE.bot}"
        filter="url(#schaduw)">${esc(regel)}</text>`).join('')}`
}

function pagina(svg, tekst) {
  return `<!doctype html><meta charset="utf-8">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&display=swap">
    <style>html,body{margin:0;padding:0;background:${PALETTE.nacht};overflow:hidden}</style>
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
      ${svg}
      ${ondertitel(tekst)}
    </svg>`
}

async function schiet(html, naam) {
  const htmlPad = join(OUT, `${naam}.html`)
  await writeFile(htmlPad, html, 'utf8')
  await run(CHROME, [
    '--headless', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    `--window-size=1280,${720 + VENSTER_MARGE}`,
    // Even wachten zodat het weblettertype binnen is; anders valt hij terug op
    // Helvetica en verspringt de typografie tussen de frames.
    '--virtual-time-budget=1200',
    `--screenshot=${join(OUT, `${naam}-vol.png`)}`,
    `file://${process.cwd()}/${htmlPad}`,
  ], { maxBuffer: 32 * 1024 * 1024 })
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', join(OUT, `${naam}-vol.png`), '-vf', 'crop=1280:720:0:0',
    join(OUT, `${naam}.png`)])
  await rm(join(OUT, `${naam}-vol.png`), { force: true })
  await rm(htmlPad, { force: true })
}

async function main() {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const regels = []
  let totaal = 0

  for (const [i, scene] of SCENES.entries()) {
    const seconden = Math.max(3.4, scene.caption.split(/\s+/).length / RATE + 1.2)
    const beweegt = typeof scene.svg === 'function' && scene.frames > 0

    if (beweegt) {
      // De reeks wordt herhaald tot de scène zijn tijd vol heeft, zodat de
      // beweging doorloopt zonder dat we honderden frames hoeven te maken.
      for (let f = 0; f < scene.frames; f++) {
        await schiet(pagina(scene.svg(f / scene.frames), scene.caption),
          `${scene.id}-${String(f).padStart(3, '0')}`)
      }
      const rondjes = Math.max(1, Math.round((seconden * FPS) / scene.frames))
      for (let r = 0; r < rondjes; r++) {
        for (let f = 0; f < scene.frames; f++) {
          regels.push(`file '${process.cwd()}/${join(OUT, `${scene.id}-${String(f).padStart(3, '0')}.png`)}'`)
          regels.push(`duration ${(1 / FPS).toFixed(4)}`)
        }
      }
      totaal += (rondjes * scene.frames) / FPS
      process.stdout.write(`  ${String(i + 1).padStart(2)}. ${scene.id}  ${scene.frames} frames\n`)
    } else {
      const svg = typeof scene.svg === 'function' ? scene.svg(0) : scene.svg
      await schiet(pagina(svg, scene.caption), scene.id)
      regels.push(`file '${process.cwd()}/${join(OUT, `${scene.id}.png`)}'`)
      regels.push(`duration ${seconden.toFixed(3)}`)
      totaal += seconden
      process.stdout.write(`  ${String(i + 1).padStart(2)}. ${scene.id}  ${seconden.toFixed(1)}s\n`)
    }
  }

  // Het laatste beeld nog een keer: de concat-demuxer laat de duur van de
  // laatste regel anders vallen.
  regels.push(regels[regels.length - 2])

  const lijst = join(OUT, 'concat.txt')
  await writeFile(lijst, regels.join('\n'), 'utf8')

  const uit = join(OUT, 'beeldvoorbeeld.mp4')
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'concat', '-safe', '0', '-i', lijst,
    '-vf', `fps=${FPS},format=yuv420p`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-an', uit],
    { maxBuffer: 64 * 1024 * 1024 })

  console.log(`\n  ${uit}  (${Math.round(totaal)} s, ${SCENES.length} scènes)\n`)
}

function wrap(text, per) {
  const woorden = text.split(/\s+/)
  const uit = []
  let regel = ''
  for (const w of woorden) {
    if ((regel + ' ' + w).trim().length > per && regel) { uit.push(regel.trim()); regel = w }
    else regel += ' ' + w
  }
  if (regel.trim()) uit.push(regel.trim())
  return uit
}

main().catch((e) => { console.error(e); process.exitCode = 1 })

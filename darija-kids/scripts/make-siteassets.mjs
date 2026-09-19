/**
 * Shrinks the store's pictures and film down to something a phone on 4G will
 * actually wait for, and writes them into site-assets/.
 *
 * The originals are enormous on purpose — Apple wants a 1290×2796 PNG and the
 * app preview is a 15 MB VP9 file — and they live in store/, which git
 * ignores because nobody needs a hundred megabytes of screenshots in their
 * clone. The website does need them, and the website is built on a machine
 * that has neither ffmpeg nor those folders. So this runs here, by hand, and
 * what it produces is small enough to commit.
 *
 * Two things change besides the size. The screenshots become WebP at a third
 * of the width, which is all a 14rem column shows. And the film is re-encoded
 * from VP9-in-MP4 to plain H.264 with AAC sound: Safari on an iPhone will not
 * play the original, and an iPhone is exactly who this page is for.
 *
 * Run with: node scripts/make-siteassets.mjs [--lang nl,fr,...]
 */
import { execFile } from 'node:child_process'
import { mkdir, readdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ffmpeg from 'ffmpeg-static'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'site-assets')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const LANGS = arg('lang', 'nl,fr,de,es,it,en').split(',')

const kb = (bytes) => `${Math.round(bytes / 1024)} kB`
const sizeOf = async (file) => (await stat(file)).size

/** ffmpeg says a great deal; only the exit code interests us. */
const ff = (args) => run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { maxBuffer: 1 << 24 })

/**
 * How long a file plays, out of what ffmpeg prints when asked to do nothing.
 *
 * `ffmpeg -i file` with no output exits non-zero on purpose, so the number has
 * to be read from the rejection rather than from a happy result.
 */
const duurVan = async (file) => {
  const out = await run(ffmpeg, ['-hide_banner', '-i', file]).then(
    (r) => r.stderr, (e) => e.stderr ?? '')
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(out)
  if (!m) throw new Error(`geen duur te vinden in ${file}`)
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

/**
 * Twee Darija-woorden die tussen de muziek door te horen zijn.
 *
 * De film laat de app zien maar liet hem niet hóren, en juist het geluid is
 * waar deze app op staat: geen spraakcomputer maar een mens. Dus komt de echte
 * opname van salam aan het begin voorbij en die van shukran tegen het eind, met
 * de muziek er even onder. Het zijn dezelfde bestanden die in de app zitten —
 * een bezoeker hoort precies wat zijn kind straks hoort.
 */
const WOORDEN = [
  { id: 'salam', op: 5 },
  { id: 'shukran', op: 21 },
]

await rm(OUT, { recursive: true, force: true })

let total = 0

for (const lang of LANGS) {
  const shotsIn = path.join(ROOT, 'store', 'screenshots', lang, 'iphone')
  const shotsOut = path.join(OUT, 'shots', lang)
  await mkdir(shotsOut, { recursive: true })

  const files = (await readdir(shotsIn).catch(() => [])).filter((f) => f.endsWith('.png')).sort()
  if (!files.length) console.warn(`${lang}: geen schermen in ${path.relative(ROOT, shotsIn)} — overgeslagen`)
  for (const file of files) {
    const n = file.split('-')[0]
    const out = path.join(shotsOut, `${n}.webp`)
    // 430 wide is twice the 14rem the page gives it, so it stays sharp on a
    // retina screen and nowhere near as heavy as the original.
    await ff(['-i', path.join(shotsIn, file), '-vf', 'scale=430:-2', '-c:v', 'libwebp', '-quality', '82', out])
    total += await sizeOf(out)
  }
  console.log(`${lang}: ${files.length} schermen`)

  const filmIn = path.join(ROOT, 'store', 'video', lang, 'intro-breed.mp4')
  const filmOut = path.join(OUT, 'film', lang)
  await mkdir(filmOut, { recursive: true })

  // De twee opnames erbij, elk op zijn eigen moment, met de muziek eronder.
  const stemmen = []
  for (const woord of WOORDEN) {
    const bestand = path.join(ROOT, 'src', 'audio', 'woorden', `${woord.id}.wav`)
    stemmen.push({ ...woord, bestand, duur: await duurVan(bestand) })
  }

  // De muziek zakt een kwart seconde voor het woord en komt er weer bovenop
  // zodra het uit is; anders praat de darbuka eroverheen.
  const zacht = stemmen
    .map((w) => `between(t,${(w.op - 0.25).toFixed(2)},${(w.op + w.duur + 0.35).toFixed(2)})`)
    .join('+')

  const mix = [
    `[0:a]volume=0.28:enable='${zacht}'[muziek]`,
    ...stemmen.map((w, i) =>
      `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,` +
      `adelay=${Math.round(w.op * 1000)}|${Math.round(w.op * 1000)},volume=2.2[w${i}]`),
    `[muziek]${stemmen.map((_, i) => `[w${i}]`).join('')}` +
      // Een limiter achteraan: de opnames zijn niet allemaal even hard, en
      // een enkele luide sisklank boven op de muziek tikt anders tegen het
      // plafond — wat je in AAC terughoort als een kraakje.
      `amix=inputs=${stemmen.length + 1}:duration=first:normalize=0,alimiter=limit=0.89:level=disabled[uit]`,
  ].join(';')

  await ff([
    '-i', filmIn,
    ...stemmen.flatMap((w) => ['-i', w.bestand]),
    '-filter_complex', mix,
    '-map', '0:v', '-map', '[uit]',
    '-vf', 'scale=1280:-2',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    // The whole point of a preview is that it starts playing before it has
    // finished downloading, which needs the index at the front of the file.
    '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '96k', '-ac', '2',
    path.join(filmOut, 'intro.mp4'),
  ])
  total += await sizeOf(path.join(filmOut, 'intro.mp4'))

  // A still from two seconds in: the first frame of the film is black.
  await ff([
    '-ss', '2', '-i', filmIn, '-frames:v', '1',
    '-vf', 'scale=1280:-2', '-c:v', 'libwebp', '-quality', '78',
    path.join(filmOut, 'poster.webp'),
  ])
  total += await sizeOf(path.join(filmOut, 'poster.webp'))
  console.log(`${lang}: film ${kb(await sizeOf(path.join(filmOut, 'intro.mp4')))}`)
}

console.log(`\nsite-assets/ is ${kb(total)} in totaal`)

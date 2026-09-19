/**
 * Packs the app into one self-contained HTML file.
 *
 * Everything the app normally loads over the network — its JavaScript, its
 * stylesheet, both fonts — is folded into the document, so the file runs from
 * a disk, an email attachment or a sandboxed frame with no server behind it.
 * The demo build routes on the hash for the same reason.
 *
 * Run with: VITE_DEMO=1 npx vite build && node scripts/make-demo.mjs [out.html]
 */
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ffmpeg from 'ffmpeg-static'

const run = promisify(execFile)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist-demo')
const OUT = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? path.join(DIST, 'darijaforkids-demo.html')

/**
 * `--alles` zet het slot eraf voordat de app start.
 *
 * Alleen om zelf te testen: in dit bestand is geen winkel, dus wie hem op zijn
 * eigen telefoon opent komt niet verder dan de zes gratis units en ziet de
 * helft van wat hij gebouwd heeft niet. Een gewoon script, geen module, dus
 * het draait vóór de app — die is uitgesteld.
 *
 * Deel een bestand dat zo gemaakt is met niemand: het geeft alles weg.
 */
const ALLES = process.argv.includes('--alles')
const slotEraf = ALLES ? `<script>
try {
  const k = 'darijakids.v1'
  const s = JSON.parse(localStorage.getItem(k) || '{}')
  if (!s.unlocked) { s.unlocked = true; s.unlockedAt = Date.now(); localStorage.setItem(k, JSON.stringify(s)) }
} catch {}
</script>
` : ''

const assets = await readdir(path.join(DIST, 'assets'))
const cssFile = assets.find((f) => f.endsWith('.css'))
const jsFiles = assets.filter((f) => f.endsWith('.js'))
if (!cssFile || jsFiles.length !== 1) {
  throw new Error(`Verwachtte één js- en één css-bestand, kreeg: ${assets.join(', ')}`)
}

let css = await readFile(path.join(DIST, 'assets', cssFile), 'utf8')

// The fonts have to travel inside the file: there is no /fonts/ to fetch from.
for (const font of await readdir(path.join(DIST, 'fonts'))) {
  const base64 = (await readFile(path.join(DIST, 'fonts', font))).toString('base64')
  css = css.replaceAll(`/fonts/${font}`, `data:font/woff2;base64,${base64}`)
}

let js = await readFile(path.join(DIST, 'assets', jsFiles[0]), 'utf8')

/**
 * De opnames van wav naar aac, anders is het bestand niet te gebruiken.
 *
 * De 432 opnames staan als wav in de bundel — dat is de goede keuze voor de
 * app, want daar worden ze pas bij het bouwen omgezet. Hier zitten ze als
 * base64 ín het document, en dan wegen ze samen eenentwintig megabyte. Een
 * pagina van die omvang is niet te versturen en op een telefoon niet te
 * openen.
 *
 * Aac op 48 kbit mono is ruim een vierde daarvan en klinkt bij spraak van een
 * seconde niet hoorbaar anders. Safari en Chrome nemen het allebei in
 * `decodeAudioData`, wat de app gebruikt om een opname af te spelen.
 */
const wavs = [...new Set(js.match(/data:audio\/wav;base64,[A-Za-z0-9+/=]+/g) ?? [])]
if (wavs.length) {
  const werk = await mkdtemp(path.join(tmpdir(), 'demo-'))
  let klaar = 0
  const omzetten = async (uri, i) => {
    const wav = path.join(werk, `${i}.wav`)
    const m4a = path.join(werk, `${i}.m4a`)
    await writeFile(wav, Buffer.from(uri.slice('data:audio/wav;base64,'.length), 'base64'))
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav,
      '-c:a', 'aac', '-b:a', '48k', '-ac', '1', '-ar', '24000', m4a])
    const uit = `data:audio/mp4;base64,${(await readFile(m4a)).toString('base64')}`
    if (++klaar % 100 === 0) process.stdout.write(`  ${klaar}/${wavs.length} opnames omgezet\n`)
    return [uri, uit]
  }
  // Vier tegelijk: meer levert niets op en vult de schijf met tijdelijke wavs.
  const paren = []
  for (let i = 0; i < wavs.length; i += 4) {
    paren.push(...await Promise.all(wavs.slice(i, i + 4).map((u, j) => omzetten(u, i + j))))
  }
  for (const [van, naar] of paren) js = js.replaceAll(van, naar)
  await rm(werk, { recursive: true, force: true })
}

// A literal </script> anywhere in the bundle would close the tag early.
const safe = (code) => code.replaceAll('</script', '<\\/script').replaceAll('<!--', '<\\!--')

// Without this a file:// page falls back to Latin-1 and every Arabic letter,
// emoji and accent turns to mojibake.
/**
 * `--map <dir>` schrijft drie bestanden in plaats van één.
 *
 * Eén bestand is het handigst om te versturen, maar een pagina van zes
 * megabyte wordt door sommige plekken geweigerd omdat het document zelf zo
 * groot is. Met de stijl en de code ernaast is de pagina een paar regels en
 * staat het gewicht in twee bestanden die gewoon worden opgehaald.
 */
const MAP = (() => {
  const i = process.argv.indexOf('--map')
  return i > 0 ? process.argv[i + 1] : null
})()

if (MAP) {
  await mkdir(MAP, { recursive: true })
  await writeFile(path.join(MAP, 'app.css'), css)
  await writeFile(path.join(MAP, 'app.js'), js)
  await writeFile(path.join(MAP, 'index.html'), `<!doctype html>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Darijaforkids</title>
<meta name="description" content="Marokkaans-Arabisch (Darija) leren voor kinderen en jongeren: korte lessen, echte uitspraak, spelletjes en een leerpad dat zich aanpast." />
<link rel="stylesheet" href="app.css" />
${slotEraf}<div id="root"></div>
<script type="module" src="app.js"></script>
`)
  const mb = (n) => (n / 1024 / 1024).toFixed(1)
  console.log(`${MAP}/ — index.html, app.css (${mb(Buffer.byteLength(css))} MB), app.js (${mb(Buffer.byteLength(js))} MB)${ALLES ? ' — alles open, niet delen' : ''}`)
  process.exit(0)
}

const html = `<meta charset="utf-8" />
<title>Darijaforkids</title>
<meta name="description" content="Marokkaans-Arabisch (Darija) leren voor kinderen en jongeren: korte lessen, echte uitspraak, spelletjes en een leerpad dat zich aanpast." />
<style>
${css}
</style>
${slotEraf}<div id="root"></div>
<script type="module">
${safe(js)}
</script>
`

await writeFile(OUT, html)
const kb = (Buffer.byteLength(html) / 1024).toFixed(0)
console.log(`${path.relative(ROOT, OUT)} — ${kb} kB${ALLES ? ' — alles open, niet delen' : ''}`)

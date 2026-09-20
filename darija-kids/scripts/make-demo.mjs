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
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
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

/**
 * Weigeren te werken met een bundel van voor de laatste wijziging.
 *
 * Dit script leest `dist-demo/`, dat een ander commando vult. Wie het los
 * draait krijgt stilzwijgend de vorige versie van de app in een bestand dat er
 * nieuw uitziet — en dat is precies één keer gebeurd, met een demo die nog de
 * oude gratis grens noemde.
 */
const nieuwste = async (dir) => {
  let t = 0
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    t = Math.max(t, e.isDirectory() ? await nieuwste(p) : (await stat(p)).mtimeMs)
  }
  return t
}
const bundel = await stat(path.join(DIST, 'index.html')).catch(() => null)
if (!bundel) {
  throw new Error('dist-demo/ bestaat niet. Draai `npm run build:demo`.')
}
const bron = Math.max(await nieuwste(path.join(ROOT, 'src')), (await stat(path.join(ROOT, 'index.html'))).mtimeMs)
if (bron > bundel.mtimeMs) {
  throw new Error('dist-demo/ is ouder dan src/. Draai `npm run build:demo` in plaats van dit script los.')
}

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
 * De opnames, en waarom ze blijven zoals ze zijn.
 *
 * Ze staan als wav in de bundel en dat is meteen het probleem: samen
 * eenentwintig megabyte, veel te veel voor één document. Er is een ronde
 * geweest waarin ze naar aac gingen — een kwart van het gewicht, en ffmpeg
 * speelde ze moeiteloos af. Op een iPhone kwam er geen geluid uit. De
 * knopgeluidjes wel, want die maakt de app zelf; de opnames niet, want Safari
 * weigerde ze te ontcijferen.
 *
 * Wat er precies aan schortte doet er niet toe, want de gok is het probleem.
 * De browser in deze omgeving heeft geen aac aan boord, dus de enige manier om
 * het te controleren was iemand met een telefoon — en dat is een keer te vaak
 * gebeurd. Wav ontcijfert elke browser, zonder uitzondering en zonder codec.
 *
 * Dus blijven ze wav, en lossen we het gewicht anders op: bij `--map` gaan ze
 * in eigen bestanden van hooguit acht megabyte, die de pagina ophaalt. Bij één
 * los bestand kan dat niet en gaan ze alsnog naar aac — dat bestand is om te
 * versturen, niet om op te vertrouwen.
 */
/**
 * Mét de aanhalingstekens eromheen, want die moeten mee.
 *
 * De opnames staan in de bundel als `"data:audio/wav;base64,..."` of met
 * backticks. Wie alleen de tekst ertussen vervangt door `__K[0]` houdt
 * `"__K[0]"` over: een stukje tekst in plaats van een verwijzing. De app haalt
 * dan een bestand op dat "__K[0]" heet, krijgt de pagina terug en ontcijfert
 * niets. Precies dat is één ronde lang gebeurd.
 */
const WAV = /(["'`])(data:audio\/wav;base64,[A-Za-z0-9+/=]+)\1/g
const KLANKEN = [...new Set([...js.matchAll(WAV)].map((m) => m[2]))]

/** Hoeveel base64 er hooguit in één bestand gaat. */
const PER_BESTAND = 8 * 1024 * 1024

const naarAac = async () => {
  if (!KLANKEN.length) return
  const werk = await mkdtemp(path.join(tmpdir(), 'demo-'))
  let klaar = 0
  const omzetten = async (uri, i) => {
    const wav = path.join(werk, `${i}.wav`)
    const m4a = path.join(werk, `${i}.m4a`)
    await writeFile(wav, Buffer.from(uri.slice('data:audio/wav;base64,'.length), 'base64'))
    await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav,
      '-c:a', 'aac', '-b:a', '48k', '-ac', '1', '-ar', '24000', '-movflags', '+faststart', m4a])
    const uit = `data:audio/mp4;base64,${(await readFile(m4a)).toString('base64')}`
    if (++klaar % 100 === 0) process.stdout.write(`  ${klaar}/${KLANKEN.length} opnames omgezet\n`)
    return [uri, uit]
  }
  const paren = []
  for (let i = 0; i < KLANKEN.length; i += 4) {
    paren.push(...await Promise.all(KLANKEN.slice(i, i + 4).map((u, j) => omzetten(u, i + j))))
  }
  const nieuw = new Map(paren)
  js = js.replace(WAV, (heel, quote, uri) => `${quote}${nieuw.get(uri) ?? uri}${quote}`)
  await rm(werk, { recursive: true, force: true })
}

/**
 * De opnames uit de code halen en in losse bestanden zetten.
 *
 * Elke opname wordt `__K[n]`, en `__K` wordt gevuld door gewone scripts die
 * vóór de app draaien — een module is uitgesteld, dus die volgorde klopt
 * vanzelf.
 */
const losseKlanken = () => {
  const stukken = []
  let huidig = []
  let groot = 0
  KLANKEN.forEach((uri, n) => {
    if (groot + uri.length > PER_BESTAND && huidig.length) {
      stukken.push(huidig)
      huidig = []
      groot = 0
    }
    huidig.push([n, uri])
    groot += uri.length
  })
  if (huidig.length) stukken.push(huidig)

  const index = new Map(KLANKEN.map((uri, n) => [uri, n]))
  let vervangen = 0
  js = js.replace(WAV, (heel, _quote, uri) => { vervangen++; return `__K[${index.get(uri)}]` })

  // Een verwijzing die tussen aanhalingstekens blijft staan is geen verwijzing
  // meer, en dat valt pas op als er geen geluid uit komt. Dus meteen kijken.
  if (!vervangen) throw new Error('geen enkele opname vervangen — staat er wel wav in de bundel?')
  if (/["'`]__K\[/.test(js)) throw new Error('een opname staat nog tussen aanhalingstekens')

  return stukken.map((stuk, i) => [
    `klanken-${i + 1}.js`,
    `window.__K=window.__K||[];${stuk.map(([n, uri]) => `__K[${n}]=${JSON.stringify(uri)}`).join(';')}\n`,
  ])
}

/**
 * `--map <dir>` schrijft een map in plaats van één bestand.
 *
 * Eén bestand is het handigst om te versturen, maar een document van zes
 * megabyte wordt door sommige plekken geweigerd om zijn eigen omvang — en de
 * opnames passen er alleen in als ze worden ingepakt, wat precies het geluid
 * kapotmaakte. Met losse bestanden ernaast hoeft dat niet.
 */
const MAP = (() => {
  const i = process.argv.indexOf('--map')
  return i > 0 ? process.argv[i + 1] : null
})()

/**
 * `--meten` zet een regel onderaan de demo die zegt wat het geluid doet.
 *
 * Alleen voor het uitproberen op een echt toestel. Hier in de omgeving speelt
 * alles, op een iPhone niet, en dan is de vraag welke van de drie stappen
 * misgaat: de opnames binnenhalen, ze ontcijferen, of ze afspelen. Raden
 * daarnaar heeft nu twee rondes gekost, dus laat het apparaat het zeggen.
 */
const METEN = process.argv.includes('--meten')
const meter = METEN ? `<div id="meter" style="position:fixed;inset-inline:0;bottom:0;z-index:99999;background:#131b30;color:#ffd79a;font:12px/1.5 system-ui;padding:6px 10px;text-align:center"></div>
<script>
(function () {
  var el = document.getElementById('meter')
  var geladen = (window.__K || []).filter(Boolean).length
  var regel = function (t) { el.textContent = t }
  regel('opnames geladen: ' + geladen)
  if (!geladen) return
  var ac = null
  try { ac = new (window.AudioContext || window.webkitAudioContext)() } catch (e) { regel('geladen ' + geladen + ' · geen AudioContext: ' + e.name); return }
  var uri = (window.__K || []).filter(Boolean)[0]
  fetch(uri).then(function (r) { return r.arrayBuffer() }).then(function (b) {
    return new Promise(function (ok, nee) {
      var p = ac.decodeAudioData(b, ok, nee)
      if (p && p.then) p.then(ok, nee)
    })
  }).then(function (buf) {
    regel('geladen ' + geladen + ' · ontcijferd ' + buf.duration.toFixed(2) + 's · mixer ' + ac.state)
  }).catch(function (e) {
    regel('geladen ' + geladen + ' · ONTCIJFEREN MISLUKT: ' + (e && (e.name + ' ' + e.message)))
  })
})()
</script>
` : ''

const mb = (n) => (n / 1024 / 1024).toFixed(1)

if (MAP) {
  await mkdir(MAP, { recursive: true })
  const klanken = losseKlanken()
  for (const [naam, inhoud] of klanken) await writeFile(path.join(MAP, naam), inhoud)
  await writeFile(path.join(MAP, 'app.css'), css)
  await writeFile(path.join(MAP, 'app.js'), js)
  await writeFile(path.join(MAP, 'index.html'), `<!doctype html>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Darijaforkids</title>
<meta name="description" content="Marokkaans-Arabisch (Darija) leren voor kinderen en jongeren: korte lessen, echte uitspraak, spelletjes en een leerpad dat zich aanpast." />
<link rel="stylesheet" href="app.css" />
${klanken.map(([naam]) => `<script src="${naam}"></script>`).join('\n')}
${slotEraf}<div id="root"></div>
<script type="module" src="app.js"></script>
${meter}`)
  const totaal = klanken.reduce((n, [, i]) => n + Buffer.byteLength(i), 0)
  console.log(`${MAP}/ — index.html, app.css (${mb(Buffer.byteLength(css))} MB), app.js (${mb(Buffer.byteLength(js))} MB), ${klanken.length}x klanken (${mb(totaal)} MB, wav)${ALLES ? ' — alles open, niet delen' : ''}`)
  process.exit(0)
}

// Eén bestand: dan moeten de opnames wel kleiner, en gaan ze naar aac.
await naarAac()

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
console.log(`${path.relative(ROOT, OUT)} — ${mb(Buffer.byteLength(html))} MB${ALLES ? ' — alles open, niet delen' : ''}`)

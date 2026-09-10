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
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist-demo')
const OUT = process.argv[2] ?? path.join(DIST, 'gedmma-demo.html')

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

const js = await readFile(path.join(DIST, 'assets', jsFiles[0]), 'utf8')

// A literal </script> anywhere in the bundle would close the tag early.
const safe = (code) => code.replaceAll('</script', '<\\/script').replaceAll('<!--', '<\\!--')

// Without this a file:// page falls back to Latin-1 and every Arabic letter,
// emoji and accent turns to mojibake.
const html = `<meta charset="utf-8" />
<title>Gedmma</title>
<meta name="description" content="Marokkaans-Arabisch (Darija) leren voor kinderen en jongeren: korte lessen, echte uitspraak, spelletjes en een leerpad dat zich aanpast." />
<style>
${css}
</style>
<div id="root"></div>
<script type="module">
${safe(js)}
</script>
`

await writeFile(OUT, html)
const kb = (Buffer.byteLength(html) / 1024).toFixed(0)
console.log(`${path.relative(ROOT, OUT)} — ${kb} kB`)

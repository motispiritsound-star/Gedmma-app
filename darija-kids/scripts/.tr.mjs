import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createServer } from 'vite'
const server = await createServer({ configFile: 'vite.config.ts', server: { port: 4398, strictPort: true, hmr: false }, logLevel: 'error' })
await server.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage()
await p.goto('http://127.0.0.1:4398/', { waitUntil: 'networkidle' })
const m = await p.evaluate(async () => {
  const [a, lex, zin] = await Promise.all([
    import('/src/content/alphabet.ts'), import('/src/content/lexicon.ts'), import('/src/content/sentences.ts')])
  const o = {}
  for (const l of a.LETTERS) o[l.id] = `letter ${l.name}`
  for (const w of lex.allWords) if (!(w.id in o)) o[w.id] = `${w.tr} — ${w.nl}`
  for (const z of zin.ALL_SENTENCES) if (!(z.id in o)) o[z.id] = z.tr
  return o
})
await b.close(); await server.close()
const v = JSON.parse(await readFile('store/opnamelijst.json', 'utf8'))
v.ids.slice(Number(process.argv[2]) - 1, Number(process.argv[3])).forEach((id, i) =>
  console.log(String(Number(process.argv[2]) + i).padStart(4), id.padEnd(14), m[id]))

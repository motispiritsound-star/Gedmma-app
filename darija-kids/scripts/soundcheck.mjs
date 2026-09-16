/**
 * Renders every sound the app can make and reports how loud it actually is.
 *
 * "There is no sound" is the one bug that cannot be read off the code, so this
 * plays each one into an offline context and measures the result: a sound that
 * renders to silence is a broken sound, whatever the source says.
 *
 * Run with: node scripts/soundcheck.mjs [baseUrl]
 *
 * It brings up its own dev server, the way the other checks do. Needing a
 * second terminal with `npm run preview` in it meant the check that answers
 * "is there any sound at all" was the one people skipped.
 */
import { chromium } from 'playwright'
import { createServer } from 'vite'

const PORT = 4391
const EIGEN = process.argv[2] === undefined
const BASE = process.argv[2] ?? `http://127.0.0.1:${PORT}`
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const server = EIGEN
  ? await createServer({
      configFile: 'vite.config.ts',
      server: { port: PORT, strictPort: true, hmr: false },
      logLevel: 'error',
    })
  : null
await server?.listen()

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
const problems = []
page.on('pageerror', (e) => problems.push(String(e)))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })

const rows = await page.evaluate(async () => {
  const mod = await import('/src/engine/instruments.ts').catch(() => null)
  const bank = mod ?? window.__instruments
  if (!bank) return null
  const out = []
  for (const [name, voice] of Object.entries(bank.VOICES)) {
    for (const arg of bank.ARGS[name]) {
      const rate = 44100
      const oac = new OfflineAudioContext(1, Math.ceil((bank.LENGTH[name] + 0.3) * rate), rate)
      voice({ ac: oac, out: bank.busFor(oac).bus }, arg)
      const buf = await oac.startRendering()
      const data = buf.getChannelData(0)
      let peak = 0
      let energy = 0
      for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if (a > peak) peak = a; energy += data[i] * data[i] }
      out.push({ name, arg, peak, rms: Math.sqrt(energy / data.length) })
    }
  }
  return out
})

if (!rows) {
  console.error('kon de klankenbank niet laden — draait dit tegen `npm run dev`?')
  process.exit(1)
}

let bad = 0
for (const r of rows) {
  const label = `${r.name}${r.arg ? `(${r.arg})` : ''}`.padEnd(16)
  const ok = r.peak > 0.02 && r.rms > 0.0005
  if (!ok) bad++
  if (r.peak > 1) bad++
  console.log(`${ok ? (r.peak > 1 ? 'CLIP' : ' ok ') : 'STIL'}  ${label} piek ${r.peak.toFixed(3)}  rms ${r.rms.toFixed(4)}`)
}
console.log(problems.length ? 'FOUTEN: ' + problems.join(' | ') : '')
console.log(bad === 0 ? `\nAlle ${rows.length} klanken maken geluid, geen enkele clipt.` : `\n${bad} klanken deugen niet.`)
await server?.close()
process.exit(bad === 0 ? 0 : 1)

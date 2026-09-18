import path from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { naarWav, readWav } from './lib/wav.mjs'
const server = await createServer({ configFile: 'vite.config.ts', server: { port: 4416, strictPort: true, hmr: false }, logLevel: 'error' })
await server.listen()
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await b.newPage()
await p.goto('http://127.0.0.1:4416/', { waitUntil: 'networkidle' })
for (const pad of process.argv.slice(2)) {
  const { rate, samples } = readWav(await naarWav(path.resolve(pad)))
  const tel = []
  for (const pauze of [0.3, 0.25, 0.2, 0.15]) {
    const st = await p.evaluate(async ({ lijst, rate, pauze }) => {
      const { knip } = await import('/src/engine/knip.ts')
      return knip(Float32Array.from(lijst), rate, { pauze })
    }, { lijst: Array.from(samples), rate, pauze })
    tel.push(st.length)
  }
  console.log(path.basename(pad).padEnd(26), '0.3/0.25/0.2/0.15 →', tel.join(' / '))
}
await b.close(); await server.close()

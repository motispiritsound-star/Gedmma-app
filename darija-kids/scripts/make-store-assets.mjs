/**
 * Draws the source images the app stores ask for.
 *
 * `assets/icon.png` and `assets/splash*.png` are what `@capacitor/assets`
 * slices into every size iOS and Android want, and `store/` holds the
 * screenshots a listing needs. Same mark as the web icon: the eight-pointed
 * khatam of Moroccan zellige, pure geometry so it survives being scaled to 48
 * pixels on an old Android.
 *
 * Run with: node scripts/make-store-assets.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const star = (cx, cy, r, fill) => {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`
  })
  return `<polygon points="${points.join(' ')}" fill="${fill}" />`
}

const mark = (size, pad, rounded = true) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#131b30"/><stop offset="100%" stop-color="#080c17"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${rounded ? size * 0.22 : 0}" fill="url(#tile)"/>
  ${star(size / 2, size / 2, (size / 2 - pad) * 0.8, 'url(#gold)')}
  ${star(size / 2, size / 2, (size / 2 - pad) * 0.38, '#0d9488')}
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.055}" fill="#fffaf3"/>
</svg>`

await mkdir(path.join(ROOT, 'assets'), { recursive: true })
const browser = await startChroom()
const page = await browser.newPage({ deviceScaleFactor: 1 })

const shoot = async (name, width, height, html) => {
  await page.setViewportSize({ width, height })
  await page.setContent(`<style>*{margin:0;box-sizing:border-box}body{width:${width}px;height:${height}px;overflow:hidden}</style>${html}`)
  await page.screenshot({ path: path.join(ROOT, name) })
  console.log(name)
}

// The store icon has no transparency and no rounded corners of its own: both
// platforms mask it themselves, and a pre-rounded icon ends up double-rounded.
await shoot('assets/icon.png', 1024, 1024, mark(1024, 40, false))

// The splash is one mark centred on the app's night blue, in the square both
// platforms crop from.
const splash = (dark) => `
  <div style="width:100%;height:100%;display:grid;place-items:center;background:${dark ? '#0d1220' : '#fffaf3'}">
    ${mark(620, 30, true)}
  </div>`
await shoot('assets/splash.png', 2732, 2732, splash(false))
await shoot('assets/splash-dark.png', 2732, 2732, splash(true))

await browser.close()

/**
 * Draws the app icons and the share card.
 *
 * The mark is a khatam — the eight-pointed star of Moroccan zellige — over a
 * night-blue tile. It is pure geometry, so it stays sharp at 32 pixels and
 * needs no font. The share card does use type, and embeds the same two fonts
 * the app ships, so it renders the same on any machine.
 *
 * Run with: node scripts/make-icons.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const dataUri = async (file, type = 'font/woff2') =>
  `data:${type};base64,${(await readFile(path.join(OUT, file))).toString('base64')}`

/** One eight-pointed star, built from two squares. */
const star = (cx, cy, r, fill, extra = '') => {
  const points = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI / 4) * i
    const outer = i % 2 === 0 ? r : r * 0.62
    return `${(cx + Math.cos(a) * outer).toFixed(2)},${(cy + Math.sin(a) * outer).toFixed(2)}`
  })
  const inner = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`
  })
  void points
  return `<polygon points="${inner.join(' ')}" fill="${fill}" ${extra} />`
}

const mark = (size, pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="tile" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#131b30"/><stop offset="100%" stop-color="#080c17"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#tile)"/>
  ${star(size / 2, size / 2, (size / 2 - pad) * 0.8, 'url(#gold)')}
  ${star(size / 2, size / 2, (size / 2 - pad) * 0.38, '#0d9488')}
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.055}" fill="#fffaf3"/>
</svg>`

const card = async () => {
  const arabic = await dataUri('fonts/noto-naskh-arabic-700.woff2')
  const display = await dataUri('fonts/baloo2-800.woff2')
  return `<!doctype html><meta charset="utf-8"><style>
    @font-face { font-family: "ar"; src: url(${arabic}) format("woff2"); }
    @font-face { font-family: "display"; src: url(${display}) format("woff2"); }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; background: #0d1220; color: #fffaf3;
           font-family: display, sans-serif; display: flex; align-items: center; gap: 56px; padding: 72px;
           background-image:
             radial-gradient(circle at 50% 50%, rgba(20,184,166,.22) 0 3px, transparent 4px),
             radial-gradient(circle at 0 0, rgba(245,158,11,.18) 0 3px, transparent 4px);
           background-size: 48px 48px, 48px 48px; background-position: 0 0, 24px 24px; }
    .mark { flex: none; }
    h1 { font-size: 92px; line-height: .98; }
    .ar { font-family: ar, serif; direction: rtl; text-align: left; font-size: 58px; color: #ffd166; margin-bottom: 6px; }
    p { font-size: 30px; color: #9aa3bb; margin-top: 20px; line-height: 1.3; max-width: 780px; }
    .row { margin-top: 30px; display: flex; gap: 14px; font-size: 24px; }
    .row span { border: 2px solid #26314e; border-radius: 999px; padding: 8px 20px; color: #f3f0ea; }
  </style>
  <div class="mark">${mark(300, 18)}</div>
  <div>
    <div class="ar">قدّام</div>
    <h1>Leer Darija,<br>de taal van thuis.</h1>
    <p>Marokkaans-Arabisch voor kinderen en jongeren.</p>
    <div class="row"><span>Gratis</span><span>Offline</span><span>Zonder advertenties</span></div>
  </div>`
}

const browser = await chromium.launch({ executablePath: CHROME })

// The icon, at every size a browser or a home screen asks for.
await writeFile(path.join(OUT, 'icons/icon.svg'), mark(512, 34).trim())
const page = await browser.newPage({ deviceScaleFactor: 1 })
for (const [size, pad, name] of [[192, 12, 'icon-192.png'], [512, 34, 'icon-512.png'], [512, 78, 'icon-maskable.png'], [180, 11, 'apple-touch-icon.png']]) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>*{margin:0}body{width:${size}px;height:${size}px}</style>${mark(size, pad)}`)
  await page.screenshot({ path: path.join(OUT, 'icons', name), omitBackground: true })
  console.log('icons/' + name)
}

// The share card.
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(await card())
await page.screenshot({ path: path.join(OUT, 'og.png') })
console.log('og.png')

await browser.close()

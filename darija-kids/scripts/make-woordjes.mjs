/**
 * Maakt van elk woord een filmpje van acht seconden, klaar om te posten.
 *
 * Een woord verschijnt in het Arabisch, je hoort de Marokkaanse stem het
 * zeggen, en dan schuift de betekenis eronder. Dat is het hele format — en het
 * is precies wat een WhatsApp-kanaal, een Reel, een Short en een TikTok elke
 * dag nodig hebben.
 *
 * De ingrediënten liggen er al: 432 opnames in `src/audio/`, de woorden met
 * hun schrift, klank en betekenis in `src/content/`, en de letters van het
 * merk in `public/fonts/`. Dit script zet ze bij elkaar. Negentig dagen
 * inhoud is hiermee één commando in plaats van negentig keer filmen.
 *
 * Run with:
 *   node scripts/make-woordjes.mjs                       twintig woorden, Nederlands
 *   node scripts/make-woordjes.mjs --aantal 90           een kwartaal vooruit
 *   node scripts/make-woordjes.mjs --onderwerp familie   alleen dat onderwerp
 *   node scripts/make-woordjes.mjs --woord salam,bsslama  deze, in deze volgorde
 *   node scripts/make-woordjes.mjs --taal fr             voor de Franse markt
 */
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ffmpeg from 'ffmpeg-static'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'

const run = promisify(execFile)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store', 'woordjes')

const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}

const TAAL = arg('taal', 'nl')
const AANTAL = Number(arg('aantal', '20'))
const ONDERWERP = arg('onderwerp')
const WOORDEN = arg('woord')

/* ------------------------------------------------------------- de tijdlijn */

// Horen, even niets, en dan pas lezen. Wie de betekenis meteen ziet, luistert
// niet meer -- dat is het hele verschil tussen een woordje leren en een
// plaatje zien.
const EERSTE = 0.7          // wanneer de stem voor het eerst klinkt
const ONTHULLING = 3.4      // wanneer de betekenis in beeld schuift
const TWEEDE = 4.1          // en wanneer hij het nog een keer zegt
const DUUR = 8.0

/* ---------------------------------------------------------------- de kaart */

const KLEUR = { inkt: '#2b1d16', creme: '#fffaf3', nacht: '#131b30', saffraan: '#f59e0b', zellige: '#0d9488' }

/** De achtpuntige khatam, dezelfde als in het icoon. */
const ster = (cx, cy, r, vul) => {
  const punten = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const straal = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * straal).toFixed(2)},${(cy + Math.sin(a) * straal).toFixed(2)}`
  })
  return `<polygon points="${punten.join(' ')}" fill="${vul}" />`
}

const vlag = (b = 64) => `<svg viewBox="0 0 60 40" width="${b}" height="${(b / 60) * 40}">
  <rect width="60" height="40" rx="4" fill="#c1272d"/>
  <g transform="translate(30 20) scale(0.3) translate(-50 -50)">
    <path d="M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z" fill="none" stroke="#006233" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
  </g>
</svg>`

const tegels = (b, h, stap) => {
  const delen = []
  for (let y = -stap; y < h + stap; y += stap) {
    for (let x = -stap; x < b + stap; x += stap) delen.push(ster(x, y, stap * 0.26, 'rgba(255,255,255,.055)'))
  }
  return `<svg width="${b}" height="${h}" style="position:absolute;inset:0">${delen.join('')}</svg>`
}

async function kaart(woord, betekenis, onthul, lettertypen) {
  const [balo800, balo600, naskh] = lettertypen
  return `<!doctype html><meta charset="utf-8">
<style>
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  @font-face{font-family:'Naskh';src:url(data:font/woff2;base64,${naskh}) format('woff2');font-weight:700}
  *{margin:0;box-sizing:border-box}
  body{width:1080px;height:1920px;overflow:hidden;position:relative;
       background:linear-gradient(160deg,#1b2340,#131b30 55%,#0b1020);
       font-family:'Baloo 2',system-ui,sans-serif;color:${KLEUR.creme}}
  .op{position:relative;height:100%;display:flex;flex-direction:column;
      align-items:center;justify-content:center;padding:200px 80px 380px;text-align:center}
  .kop{position:absolute;top:110px;left:0;right:0;display:flex;align-items:center;
       justify-content:center;gap:22px;font-size:40px;font-weight:800;
       letter-spacing:.06em;text-transform:uppercase;opacity:.85}
  .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl;line-height:1.25;
      font-size:${woord.ar.length > 14 ? 150 : woord.ar.length > 8 ? 200 : 260}px}
  .tr{margin-top:36px;font-size:76px;font-weight:800;color:${KLEUR.saffraan}}
  .streep{width:180px;height:8px;border-radius:99px;background:rgba(255,255,255,.18);margin:56px 0}
  .nl{font-size:${betekenis.length > 34 ? 62 : 82}px;font-weight:800;line-height:1.2}
  .note{margin-top:34px;font-size:44px;font-weight:600;opacity:.8;line-height:1.35;max-width:820px}
  .voet{position:absolute;bottom:250px;left:0;right:0;display:flex;align-items:center;
        justify-content:center;gap:20px;font-size:38px;font-weight:800;opacity:.75}
  .verborgen{visibility:hidden}
</style>
${tegels(1080, 1920, 190)}
<div class="op">
  <div class="kop">${vlag(56)} Woord van de dag</div>
  <div class="ar">${woord.ar}</div>
  <div class="tr">${woord.tr}</div>
  <div class="streep ${onthul ? '' : 'verborgen'}"></div>
  <div class="nl ${onthul ? '' : 'verborgen'}">${woord.emoji ? woord.emoji + ' ' : ''}${betekenis}</div>
  ${woord.note ? `<div class="note ${onthul ? '' : 'verborgen'}">${woord.note}</div>` : ''}
  <div class="voet"><span>darijaforkids.eu</span></div>
</div>`
}

/* ------------------------------------------------------------------ laden */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})
const [{ allWords }, { meaningOf }] = await Promise.all([
  server.ssrLoadModule('/src/content/lexicon.ts'),
  server.ssrLoadModule('/src/content/localise.ts'),
])

/** Welke woorden, en in welke volgorde. */
const opname = (w) => path.join(ROOT, 'src', 'audio', w.phrase ? 'zinnen' : 'woorden', `${w.id}.wav`)
let lijst = allWords.filter((w) => existsSync(opname(w)))

if (WOORDEN) {
  const wil = WOORDEN.split(',')
  lijst = wil.map((id) => {
    const gevonden = lijst.find((w) => w.id === id)
    if (!gevonden) throw new Error(`geen woord of geen opname: ${id}`)
    return gevonden
  })
} else {
  if (ONDERWERP) lijst = lijst.filter((w) => w.topic === ONDERWERP)
  // Korte woorden eerst: die zijn het makkelijkst na te zeggen, en de eerste
  // filmpjes zijn de filmpjes waarop iemand besluit of hij blijft kijken.
  lijst = lijst.filter((w) => !w.phrase).sort((a, b) => a.ar.length - b.ar.length).slice(0, AANTAL)
}
if (!lijst.length) {
  console.error('\nNiets te doen — geen woorden gevonden met die keuze.\n')
  process.exit(1)
}

const lettertypen = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'noto-naskh-arabic-700.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

/* -------------------------------------------------------------- en draaien */

const uit = path.join(OUT, TAAL)
await mkdir(uit, { recursive: true })
const tijdelijk = path.join(OUT, '.werk')
await mkdir(tijdelijk, { recursive: true })

const browser = await startChroom()
const blad = await (await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage()

console.log(`\n${lijst.length} woordjes in het ${TAAL}\n`)

for (const [i, w] of lijst.entries()) {
  const betekenis = meaningOf(w, TAAL)
  const beelden = []
  for (const [naam, onthul] of [['a', false], ['b', true]]) {
    const bestand = path.join(tijdelijk, `${w.id}-${naam}.png`)
    await blad.setContent(await kaart(w, betekenis, onthul, lettertypen))
    await blad.evaluate(() => document.fonts.ready)
    await blad.screenshot({ path: bestand })
    beelden.push(bestand)
  }

  // Twee stilstaande kaarten met een trage zoom eroverheen, en de opname er
  // twee keer in: één keer om te horen, één keer om na te zeggen.
  const film = path.join(uit, `${String(i + 1).padStart(2, '0')}-${w.id}.mp4`)
  const geluid = opname(w)
  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y',
    '-loop', '1', '-t', String(ONTHULLING), '-i', beelden[0],
    '-loop', '1', '-t', String(DUUR - ONTHULLING), '-i', beelden[1],
    '-i', geluid, '-i', geluid,
    '-filter_complex',
      `[0:v]fps=30,zoompan=z='min(1+0.00035*in,1.05)':d=1:s=1080x1920:fps=30[v0];` +
      `[1:v]fps=30,zoompan=z='min(1.05+0.00035*in,1.10)':d=1:s=1080x1920:fps=30[v1];` +
      `[v0][v1]concat=n=2:v=1:a=0[v];` +
      `[2:a]adelay=${Math.round(EERSTE * 1000)}|${Math.round(EERSTE * 1000)}[a0];` +
      `[3:a]adelay=${Math.round(TWEEDE * 1000)}|${Math.round(TWEEDE * 1000)}[a1];` +
      `[a0][a1]amix=inputs=2:normalize=0,aresample=48000,apad[a]`,
    '-map', '[v]', '-map', '[a]', '-t', String(DUUR),
    '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', film])

  const { size } = await stat(film)
  console.log(`  ${path.basename(film).padEnd(28)} ${w.tr.padEnd(18)} ${betekenis.slice(0, 32)}  (${(size / 1e6).toFixed(1)} MB)`)
}

await browser.close()
await server.close()
await rm(tijdelijk, { recursive: true, force: true })

console.log(`\nKlaar — ${path.relative(ROOT, uit)}\n`)
console.log('Eén per dag posten: WhatsApp-kanaal, Reels, Shorts en TikTok.')
console.log('Het bijschrift staat in docs/LANCERING.md §15.\n')

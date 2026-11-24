/**
 * Draws the marketing images that are not screenshots.
 *
 * Google Play will not publish a listing without a feature graphic, and a
 * launch without something square to post is a launch nobody sees. All of it
 * is drawn here rather than in a design tool, so it can be redone in five
 * languages the moment a word changes.
 *
 * Run with: node scripts/make-marketing.mjs [--lang nl,fr,de,es,en] [--darija]
 *
 * `--darija` tekent de uitgelichte afbeelding zonder interfacetaal: alleen de
 * Darija die de app leert. Zie de aantekening bij `featureDarija`.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'store', 'marketing')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}

/**
 * The copy, per language: a headline, a line under it, and a call to act.
 *
 * De `cta` zei tot 24 november "Gratis beginnen" en zijn vijf vertalingen, uit
 * de tijd dat de eerste lessen gratis waren. Dat is vervallen -- zie de
 * aantekening boven `magLeren` in src/engine/store.ts -- en wat er nu staat is
 * waar: de app is gratis te downloaden, de cursus is een abonnement. Dezelfde
 * regel als op de slotkaart van de promofilm (`dev/intro-copy.ts`).
 */
const COPY = {
  nl: { head: 'Leer Darija,\nde taal van thuis', sub: 'Marokkaans-Arabisch voor kinderen', cta: 'Gratis downloaden', badge: 'Vanaf 7 jaar' },
  fr: { head: 'Apprends le darija,\nla langue de la maison', sub: 'L’arabe marocain pour les enfants', cta: 'Télécharger gratuitement', badge: 'Dès 7 ans' },
  de: { head: 'Lerne Darija,\ndie Sprache von zu Hause', sub: 'Marokkanisches Arabisch für Kinder', cta: 'Gratis herunterladen', badge: 'Ab 7 Jahren' },
  es: { head: 'Aprende dariya,\nel idioma de casa', sub: 'Árabe marroquí para niños', cta: 'Descargar gratis', badge: 'A partir de 7 años' },
  it: { head: 'Impara il darija,\nla lingua di casa', sub: 'Arabo marocchino per bambini', cta: 'Scarica gratis', badge: 'Dai 7 anni' },
  en: { head: 'Learn Darija,\nthe language of home', sub: 'Moroccan Arabic for children', cta: 'Free to download', badge: 'Ages 7 and up' },
}

/** The eight-pointed khatam of Moroccan zellige, the same mark as the icon. */
const star = (cx, cy, r, fill) => {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`
  })
  return `<polygon points="${points.join(' ')}" fill="${fill}" />`
}

const mark = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#131b30"/>
  ${star(size / 2, size / 2, size * 0.36, 'url(#gold)')}
  ${star(size / 2, size / 2, size * 0.17, '#0d9488')}
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.055}" fill="#fffaf3"/>
</svg>`

/** Fnek, the fennec, the same face as in the app. */
const fnek = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">
  <defs><linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f7c873"/><stop offset="100%" stop-color="#e2984a"/>
  </linearGradient></defs>
  <path d="M30 44C22 22 26 8 34 10c8 2 14 16 16 28z" fill="url(#fur)"/>
  <path d="M34 40c-5-14-3-22 0-21 4 1 8 11 9 20z" fill="#ffd8b1"/>
  <path d="M90 44c8-22 4-36-4-34-8 2-14 16-16 28z" fill="url(#fur)"/>
  <path d="M86 40c5-14 3-22 0-21-4 1-8 11-9 20z" fill="#ffd8b1"/>
  <ellipse cx="60" cy="62" rx="34" ry="31" fill="url(#fur)"/>
  <ellipse cx="60" cy="70" rx="23" ry="19" fill="#fff3e2"/>
  <path d="M39 54c3-5 9-5 12 0" stroke="#2b1d16" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M69 54c3-5 9-5 12 0" stroke="#2b1d16" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="63" rx="5" ry="3.8" fill="#2b1d16"/>
  <path d="M50 69c4 7 16 7 20 0" stroke="#2b1d16" stroke-width="3.2" fill="none" stroke-linecap="round"/>
</svg>`

/** Zellige-ish tiling, kept faint so it never fights the words. */
const tiles = (w, h, step) => {
  const parts = []
  for (let y = -step; y < h + step; y += step) {
    for (let x = -step; x < w + step; x += step) {
      parts.push(star(x, y, step * 0.28, 'rgba(255,255,255,.10)'))
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" style="position:absolute;inset:0">${parts.join('')}</svg>`
}

const shell = (w, h, body, background) => `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${w}px; height: ${h}px; overflow: hidden; position: relative;
    background: ${background};
    font-family: Figtree, 'Segoe UI', system-ui, sans-serif; color: #2b1d16;
  }
  .stack { position: relative; height: 100%; display: flex; }
  b { font-weight: 800 }
</style>${tiles(w, h, Math.round(w / 7))}<div class="stack">${body}</div>`

const WARM = 'linear-gradient(140deg,#ffd79a,#f0915c 55%,#e2603c)'
const NIGHT = 'linear-gradient(150deg,#1b2340,#131b30 60%,#0b1020)'

/** Google Play's feature graphic: wide, short, and read at thumbnail size. */
const feature = (copy) => shell(1024, 500, `
  <div style="flex:1;display:flex;align-items:center;gap:32px;padding:0 44px">
    <div style="flex:0 0 auto">${mark(140)}</div>
    <div style="flex:1 1 auto;min-width:0">
      <!-- Sized for the longest of the five headlines, so no language overflows. -->
      <div style="font-size:38px;font-weight:800;line-height:1.16;letter-spacing:-.02em;white-space:nowrap">
        ${copy.head.split('\n').map((l) => `<div>${l}</div>`).join('')}
      </div>
      <div style="margin-top:12px;font-size:22px;font-weight:600;opacity:.82;white-space:nowrap">${copy.sub}</div>
    </div>
    <div style="flex:0 0 auto;opacity:.95">${fnek(118)}</div>
  </div>`, WARM)

/**
 * Dezelfde uitgelichte afbeelding, maar zonder een woord interfacetaal.
 *
 * Google Play toont de uitgelichte afbeelding bovenaan de winkelbladzijde, en
 * hij is per taal in te stellen -- wat betekent dat hij per taal uit de pas
 * kan lopen. Op 24 november stond op de Franse en de Engelse bladzijde een
 * banner met **LAAT JE KIND DARIJA SPREKEN!** erin gebakken, omdat er maar
 * één banner was en die Nederlands was.
 *
 * Deze versie lost dat op door het probleem weg te nemen in plaats van hem zes
 * keer op te lossen: er staat geen Nederlands, geen Frans en geen Engels op,
 * alleen de Darija die de app leert. Daarmee is hij in elke winkel in elk land
 * waar, en kan hij niet meer verouderen als er een taal bijkomt.
 *
 * Dat werkt hier en bij de schermafbeeldingen niet. Daar verkoopt de kopregel
 * juist -- "L'écriture arabe, lettre par lettre" is de reden dat iemand
 * doorklikt -- en een kind leert geen klank uit een woord dat het niet kent.
 * Een banner is een merkplaatje op duimnagelformaat; daar is een woord Darija
 * sterker dan een zin in een taal die de helft van de kijkers niet leest.
 *
 * De drie woorden zijn met opzet de eerste die de app leert (`words.ts`):
 * salam, shukran, baba. Wie ze niet kent leest drie vriendelijke vormen; wie
 * ze wel kent, herkent zijn eigen taal.
 */
const DARIJA = [
  { ar: '\u0627\u0644\u0633\u0644\u0627\u0645', tr: 'salam' },
  { ar: '\u0634\u0643\u0631\u0627', tr: 'shukran' },
  { ar: '\u0628\u0627\u0628\u0627', tr: 'baba' },
]

const bubbel = (w, groot) => `
  <div style="background:#fffaf3;border-radius:999px;padding:${groot ? '18px 42px' : '14px 34px'};
              box-shadow:0 8px 22px rgba(43,29,22,.16);text-align:center">
    <div lang="ar" dir="rtl" style="font-size:${groot ? 56 : 44}px;font-weight:800;line-height:1.05">${w.ar}</div>
    <div style="font-size:${groot ? 24 : 20}px;font-weight:700;opacity:.6;margin-top:2px">${w.tr}</div>
  </div>`

/*
 * De drie bubbels staan los van elkaar op verschillende hoogtes, als
 * tekstballonnen in een gesprek -- niet in een kolom. Op duimnagelformaat is
 * dat het verschil tussen "drie woorden" en "mensen die praten", en dat
 * laatste is wat deze app verkoopt.
 */
const featureDarija = () => shell(1024, 500, `
  <div style="flex:1;position:relative;display:flex;align-items:center;padding:0 54px">
    <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:12px">
      ${mark(154)}
      <div style="font-size:31px;font-weight:800;letter-spacing:-.02em">Darijaforkids</div>
    </div>
    <div style="position:absolute;left:300px;top:58px">${bubbel(DARIJA[0], true)}</div>
    <div style="position:absolute;left:530px;top:196px">${bubbel(DARIJA[1], false)}</div>
    <div style="position:absolute;left:286px;top:316px">${bubbel(DARIJA[2], false)}</div>
    <div style="position:absolute;right:48px;bottom:34px;opacity:.97">${fnek(188)}</div>
  </div>`, WARM)

/** A square for a feed. */
const square = (copy) => shell(1080, 1080, `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:80px;gap:28px">
    ${mark(200)}
    <div style="font-size:78px;font-weight:800;line-height:1.08;letter-spacing:-.02em">
      ${copy.head.split('\n').map((l) => `<div>${l}</div>`).join('')}
    </div>
    <div style="font-size:38px;font-weight:600;opacity:.82">${copy.sub}</div>
    <div style="margin-top:8px;background:#2b1d16;color:#ffd79a;font-size:34px;font-weight:800;padding:20px 44px;border-radius:999px">
      ${copy.cta}
    </div>
    <div style="position:absolute;right:56px;bottom:40px">${fnek(150)}</div>
  </div>`, WARM)

/** A story or reel cover: tall, and legible over a thumb. */
const story = (copy) => shell(1080, 1920, `
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:110px 80px;gap:38px;color:#fffaf3">
    <div style="background:rgba(255,250,243,.14);border:2px solid rgba(255,250,243,.3);padding:14px 34px;border-radius:999px;font-size:32px;font-weight:700">
      ${copy.badge}
    </div>
    ${mark(240)}
    <div style="font-size:92px;font-weight:800;line-height:1.06;letter-spacing:-.02em">
      ${copy.head.split('\n').map((l) => `<div>${l}</div>`).join('')}
    </div>
    <div style="font-size:42px;font-weight:600;opacity:.85">${copy.sub}</div>
    <div style="margin-top:20px;background:#f59e0b;color:#2b1d16;font-size:40px;font-weight:800;padding:26px 56px;border-radius:999px">
      ${copy.cta}
    </div>
    <div style="margin-top:30px">${fnek(200)}</div>
  </div>`, NIGHT)

const SIZES = [
  ['feature-graphic', 1024, 500, (copy) => (DARIJA_BANNER ? featureDarija() : feature(copy))],
  ['social-vierkant', 1080, 1080, square],
  ['social-verhaal', 1080, 1920, story],
]

await mkdir(OUT, { recursive: true })
const browser = await startChroom()
const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()

/*
 * Met `--darija` krijgt elke taal dezelfde taalloze banner. Niet één bestand
 * buiten de talenmappen, want `make-playpakket.mjs` haalt hem per taal op uit
 * `store/marketing/<taal>/feature-graphic.png` -- zo blijft de rest van de
 * keten ongewijzigd en staat er in elke winkelvermelding dezelfde.
 */
const DARIJA_BANNER = process.argv.includes('--darija')

for (const lang of arg('lang', 'nl,fr,de,es,it,en').split(',')) {
  const copy = COPY[lang]
  if (!copy) throw new Error(`onbekende taal: ${lang}`)
  const dir = path.join(OUT, lang)
  await mkdir(dir, { recursive: true })
  for (const [name, w, h, draw] of SIZES) {
    await page.setViewportSize({ width: w, height: h })
    await page.setContent(draw(copy))
    await page.waitForTimeout(120)
    const file = path.join(dir, `${name}.png`)
    await page.screenshot({ path: file })
    console.log(path.relative(ROOT, file))
  }
}
await browser.close()

await writeFile(
  path.join(OUT, 'README.md'),
  `# Marketingbeelden\n\nGemaakt met \`npm run marketing\`.\n\n` +
    `- \`feature-graphic.png\` — 1024×500, verplicht voor Google Play\n` +
    `- \`social-vierkant.png\` — 1080×1080, voor Instagram en Facebook\n` +
    `- \`social-verhaal.png\` — 1080×1920, voor stories, reels en TikTok\n\n` +
    `Per taal een map. Het app-icoon zelf staat in \`assets/icon.png\`.\n`,
)
console.log('\\nklaar')

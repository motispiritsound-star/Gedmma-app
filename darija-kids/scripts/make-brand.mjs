/**
 * Draws the brand pack: the logo, the profile pictures, the covers and a flyer.
 *
 * Everything a launch needs that is not a screenshot and not the app itself —
 * the things you upload once to Instagram, YouTube and a press mailbox and
 * then never make again. All of it is drawn from the same three ingredients as
 * the app: the eight-pointed khatam, Fnek the fennec, and Baloo 2.
 *
 * Run with:
 *   node scripts/make-brand.mjs
 *   node scripts/make-brand.mjs --url darijakids.com --lang nl,fr
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const OUT = path.join(ROOT, 'brand')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}

const SITE = arg('url', 'darijakids.com')

/* ------------------------------------------------------------- the colours */

const INK = '#2b1d16'
const CREAM = '#fffaf3'
const NIGHT = 'linear-gradient(150deg,#1b2340,#131b30 60%,#0b1020)'
const WARM = 'linear-gradient(140deg,#ffd79a,#f0915c 55%,#e2603c)'

/** The copy, per language. */
const COPY = {
  nl: { pay: 'Marokkaans-Arabisch voor kinderen', cta: 'Gratis beginnen',
    flyer: 'Leer je kind\nDarija', body: 'De taal van thuis — niet het Arabisch uit het schoolboek. Het Arabische alfabet, 304 woorden en 100 zinnen, alles uitgesproken. Vanaf ongeveer 7 jaar.',
    vormen: ['Begin', 'Midden', 'Eind'],
    punten: ['Geen account, geen advertenties', 'Werkt offline', 'In het Nederlands, Frans, Duits, Spaans en Engels'] },
  fr: { pay: 'L’arabe marocain pour les enfants', cta: 'Commencer gratuitement',
    flyer: 'Apprends le\ndarija à ton enfant', body: 'La langue de la maison — pas l’arabe du manuel. L’alphabet arabe, 304 mots et 100 phrases, tout se prononce. Dès 7 ans environ.',
    vormen: ['Début', 'Milieu', 'Fin'],
    punten: ['Sans compte, sans publicité', 'Fonctionne hors ligne', 'En français, néerlandais, allemand, espagnol et anglais'] },
  de: { pay: 'Marokkanisches Arabisch für Kinder', cta: 'Kostenlos starten',
    flyer: 'Bring deinem Kind\nDarija bei', body: 'Die Sprache von zu Hause — nicht das Schulbucharabisch. Das arabische Alphabet, 304 Wörter und 100 Sätze, alles zum Anhören. Ab etwa 7 Jahren.',
    vormen: ['Anfang', 'Mitte', 'Ende'],
    punten: ['Kein Konto, keine Werbung', 'Funktioniert offline', 'Auf Deutsch, Niederländisch, Französisch, Spanisch und Englisch'] },
  es: { pay: 'Árabe marroquí para niños', cta: 'Empezar gratis',
    flyer: 'Enseña dariya\na tus hijos', body: 'El idioma de casa, no el árabe del libro de texto. El alfabeto árabe, 304 palabras y 100 frases, todo pronunciado. A partir de los 7 años.',
    vormen: ['Inicio', 'Medio', 'Final'],
    punten: ['Sin cuenta, sin publicidad', 'Funciona sin conexión', 'En español, neerlandés, francés, alemán e inglés'] },
  en: { pay: 'Moroccan Arabic for children', cta: 'Start free',
    flyer: 'Teach your child\nDarija', body: 'The language of home — not textbook Arabic. The Arabic alphabet, 304 words and 100 sentences, all spoken aloud. From about age 7.',
    vormen: ['Start', 'Middle', 'End'],
    punten: ['No account, no adverts', 'Works offline', 'In English, Dutch, French, German and Spanish'] },
}

/* ------------------------------------------------------------- the drawings */

/** The eight-pointed khatam of Moroccan zellige. */
const star = (cx, cy, r, fill) => {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`
  })
  return `<polygon points="${points.join(' ')}" fill="${fill}" />`
}

const GOLD = `<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
  </linearGradient>`

/** The mark on its own, with nothing behind it. */
const markSvg = (size = 512, mono = null) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>${GOLD}</defs>
  ${star(256, 256, 236, mono ?? 'url(#gold)')}
  ${star(256, 256, 112, mono ?? '#0d9488')}
  <circle cx="256" cy="256" r="36" fill="${mono ?? CREAM}"/>
</svg>`

/** The mark in its rounded tile, which is the app icon. */
const tileSvg = (size = 512) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <defs>${GOLD}</defs>
  <rect width="512" height="512" rx="113" fill="#131b30"/>
  ${star(256, 256, 184, 'url(#gold)')}
  ${star(256, 256, 87, '#0d9488')}
  <circle cx="256" cy="256" r="28" fill="${CREAM}"/>
</svg>`

/** Fnek, the fennec, the same face as in the app. */
const fnekSvg = (size = 240) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="${size}" height="${size}">
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

/** Zellige-ish stars, faint, so they never fight a word. */
const tiles = (w, h, step, alpha = 0.1) => {
  const parts = []
  for (let y = -step; y < h + step; y += step) {
    for (let x = -step; x < w + step; x += step) parts.push(star(x, y, step * 0.28, `rgba(255,255,255,${alpha})`))
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" style="position:absolute;inset:0">${parts.join('')}</svg>`
}

/* ------------------------------------------------------------- the wordmark */

/**
 * The logo: the mark, the name, and — when there is room — the line under it.
 *
 * Drawn as SVG rather than screenshotted, because a logo has to survive being
 * put on a poster, and a PNG does not.
 */
const wordmarkSvg = async (ink, { pay = '', mono = null } = {}) => {
  const font = await readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2'))
  const face = `@font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:800}`
  // Trimmed to the ink: a logo with a strip of nothing under it lines up
  // wrong everywhere it is placed next to something else.
  const h = pay ? 248 : 214
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1240 ${h}" width="1240" height="${h}">
  <defs>${GOLD}</defs>
  <style>${face}</style>
  <g transform="translate(20 ${pay ? 28 : 18})">
    ${star(96, 96, 92, mono ?? 'url(#gold)')}
    ${star(96, 96, 44, mono ?? '#0d9488')}
    <circle cx="96" cy="96" r="14" fill="${mono ?? ink}"/>
  </g>
  <text x="228" y="${pay ? 140 : 148}" font-family="'Baloo 2'" font-weight="800" font-size="132" fill="${ink}">Darija Kids</text>
  ${pay ? `<text x="232" y="212" font-family="'Baloo 2'" font-weight="800" font-size="46" fill="${ink}" opacity=".72">${pay}</text>` : ''}
</svg>`
}

/* ------------------------------------------------------------- the pictures */

const shell = async (w, h, body, background, { pattern = true } = {}) => {
  const font800 = await readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2'))
  const font600 = await readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2'))
  const arabic = await readFile(path.join(ROOT, 'public', 'fonts', 'noto-naskh-arabic-700.woff2'))
  return `<!doctype html><meta charset="utf-8">
<style>
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${font800.toString('base64')}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${font600.toString('base64')}) format('woff2');font-weight:600}
  @font-face{font-family:'Naskh';src:url(data:font/woff2;base64,${arabic.toString('base64')}) format('woff2');font-weight:700}
  .ar{font-family:'Naskh',serif;font-weight:700;direction:rtl}
  *{margin:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;position:relative;background:${background};
       font-family:'Baloo 2',system-ui,sans-serif;font-weight:600;color:${INK}}
  .stack{position:relative;height:100%;display:flex}
  b{font-weight:800}
</style>${pattern ? tiles(w, h, Math.round(w / 8)) : ''}<div class="stack">${body}</div>`
}

/** What gets drawn, at what size. */
const SHEETS = [
  {
    file: 'social/profielfoto.png', w: 1024, h: 1024,
    what: 'Profielfoto voor Instagram, TikTok, YouTube en Facebook',
    draw: () => shell(1024, 1024, `<div style="flex:1;display:grid;place-items:center">${tileSvg(1024)}</div>`, '#131b30', { pattern: false }),
  },
  {
    file: 'social/omslag-facebook.png', w: 1640, h: 856,
    what: 'Omslagfoto van een Facebook-pagina',
    draw: (copy) => shell(1640, 856, `
      <div style="flex:1;display:flex;align-items:center;gap:56px;padding:0 90px;color:${CREAM}">
        <div style="flex:0 0 auto">${markSvg(200)}</div>
        <div style="flex:1 1 auto;min-width:0">
          <div style="font-size:92px;font-weight:800;letter-spacing:-.02em">Darija Kids</div>
          <div style="margin-top:14px;font-size:38px;opacity:.85">${copy.pay}</div>
          <div style="margin-top:26px;display:inline-block;background:#f59e0b;color:${INK};font-size:32px;font-weight:800;padding:16px 36px;border-radius:999px">${SITE}</div>
        </div>
        <div style="flex:0 0 auto;opacity:.95">${fnekSvg(200)}</div>
      </div>`, NIGHT),
  },
  {
    file: 'social/banner-youtube.png', w: 2560, h: 1440,
    what: 'Kanaalbanner van YouTube — alles staat binnen het veilige midden van 1546×423',
    draw: (copy) => shell(2560, 1440, `
      <div style="flex:1;display:grid;place-items:center">
        <div style="width:1546px;height:423px;display:flex;align-items:center;gap:48px;color:${CREAM}">
          <div style="flex:0 0 auto">${markSvg(200)}</div>
          <div style="flex:1 1 auto;min-width:0">
            <div style="font-size:96px;font-weight:800;letter-spacing:-.02em">Darija Kids</div>
            <div style="margin-top:10px;font-size:40px;opacity:.85">${copy.pay}</div>
          </div>
          <div style="flex:0 0 auto;background:#f59e0b;color:${INK};font-size:34px;font-weight:800;padding:18px 40px;border-radius:999px">${SITE}</div>
        </div>
      </div>`, NIGHT),
  },
  {
    file: 'social/header-x.png', w: 1500, h: 500,
    what: 'Header van X of Bluesky',
    draw: (copy) => shell(1500, 500, `
      <div style="flex:1;display:flex;align-items:center;gap:44px;padding:0 70px;color:${CREAM}">
        <div style="flex:0 0 auto">${markSvg(150)}</div>
        <div style="flex:1 1 auto;min-width:0">
          <div style="font-size:74px;font-weight:800;letter-spacing:-.02em">Darija Kids</div>
          <div style="margin-top:8px;font-size:32px;opacity:.85">${copy.pay} · ${SITE}</div>
        </div>
      </div>`, NIGHT),
  },
  {
    file: 'social/omslag-linkedin.png', w: 1584, h: 396,
    what: 'Omslag van een LinkedIn-pagina',
    draw: (copy) => shell(1584, 396, `
      <div style="flex:1;display:flex;align-items:center;gap:40px;padding:0 72px;color:${CREAM}">
        <div style="flex:0 0 auto">${markSvg(130)}</div>
        <div style="flex:1 1 auto;min-width:0">
          <div style="font-size:62px;font-weight:800;letter-spacing:-.02em">Darija Kids</div>
          <div style="margin-top:6px;font-size:28px;opacity:.85">${copy.pay} · ${SITE}</div>
        </div>
      </div>`, NIGHT),
  },
  {
    file: 'print/flyer-a5.png', w: 1748, h: 2480,
    what: 'Flyer op A5, 300 dpi — voor scholen, moskeeën en buurthuizen',
    draw: (copy) => shell(1748, 2480, `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;text-align:center;padding:110px 120px">
        ${markSvg(190)}
        <div style="font-size:124px;font-weight:800;line-height:1.02;letter-spacing:-.02em">
          ${copy.flyer.split('\n').map((l) => `<div>${l}</div>`).join('')}
        </div>
        <div style="font-size:44px;line-height:1.35;opacity:.85">${copy.body}</div>

        <!-- The one idea that explains the whole app in a glance: the same
             letter looks different depending on where it stands in a word. -->
        <div style="width:100%;background:rgba(255,250,243,.82);border-radius:48px;padding:44px 40px">
          <div class="ar" style="font-size:150px;line-height:1">ب ت ث ج ح خ</div>
          <div style="margin-top:26px;display:flex;justify-content:center;gap:26px">
            ${[['بـ', copy.vormen[0]], ['ـبـ', copy.vormen[1]], ['ـب', copy.vormen[2]]].map(([glyph, label]) => `
              <div style="flex:1;background:rgba(43,29,22,.06);border-radius:30px;padding:24px 10px">
                <div class="ar" style="font-size:88px;line-height:1">${glyph}</div>
                <div style="margin-top:12px;font-size:30px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;opacity:.65">${label}</div>
              </div>`).join('')}
          </div>
        </div>

        <ul style="list-style:none;padding:0;font-size:42px;line-height:1.85;text-align:start">
          ${copy.punten.map((p) => `<li>✅ ${p}</li>`).join('')}
        </ul>

        <div style="display:flex;flex-direction:column;align-items:center;gap:22px">
          <div style="background:${INK};color:#ffd79a;font-size:60px;font-weight:800;padding:32px 68px;border-radius:999px">${SITE}</div>
          <div style="font-size:36px;opacity:.75">${copy.cta}</div>
          ${fnekSvg(150)}
        </div>
      </div>`, WARM),
  },
]

/* ------------------------------------------------------------------- do it */

await mkdir(path.join(OUT, 'logo'), { recursive: true })
await mkdir(path.join(OUT, 'social'), { recursive: true })
await mkdir(path.join(OUT, 'print'), { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME })
const page = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()

const save = async (file, html, w, h) => {
  await page.setViewportSize({ width: w, height: h })
  await page.setContent(html)
  // The letters are a data URI inside the page; a screenshot taken before the
  // browser has parsed them comes out in a fallback serif.
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(200)
  await page.screenshot({ path: path.join(OUT, file), omitBackground: file.includes('/logo/') })
  console.log(path.relative(ROOT, path.join(OUT, file)))
}

/** The logo, as vector and as picture, dark and light and flat. */
const LOGOS = [
  ['logo/logo.svg', await wordmarkSvg(INK, { pay: COPY.nl.pay })],
  ['logo/logo-wit.svg', await wordmarkSvg(CREAM, { pay: COPY.nl.pay })],
  ['logo/logo-kort.svg', await wordmarkSvg(INK)],
  ['logo/logo-kort-wit.svg', await wordmarkSvg(CREAM)],
  ['logo/logo-zwart.svg', await wordmarkSvg('#000000', { mono: '#000000' })],
  ['logo/merk.svg', markSvg(512)],
  ['logo/merk-zwart.svg', markSvg(512, '#000000')],
  ['logo/icoon.svg', tileSvg(512)],
  ['logo/fnek.svg', fnekSvg(512)],
]
for (const [file, svg] of LOGOS) {
  await writeFile(path.join(OUT, file), svg)
  console.log(path.relative(ROOT, path.join(OUT, file)))
}

// The same logos as PNG, for everything that will not take an SVG.
const face800 = (await readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2'))).toString('base64')
for (const [file, svg] of LOGOS) {
  const png = file.replace('.svg', '.png')
  const wide = /logo(-|\.)/.test(file)
  const width = wide ? 1240 : 1024
  const box = Number(svg.match(/viewBox="0 0 1240 (\d+)"/)?.[1] ?? 214)
  const height = wide ? Math.round(width * (box / 1240)) : width
  await save(png, `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${face800}) format('woff2');font-weight:800}
    *{margin:0}body{width:${width}px;height:${height}px}svg{width:100%;height:100%;display:block}
  </style>${svg}`, width, height)
}

for (const lang of arg('lang', 'nl,fr,de,es,en').split(',')) {
  const copy = COPY[lang]
  if (!copy) throw new Error(`onbekende taal: ${lang}`)
  for (const sheet of SHEETS) {
    const file = sheet.file.replace('.png', `-${lang}.png`)
    // The profile picture is the same in every language; draw it once.
    if (sheet.file.includes('profielfoto')) {
      if (lang !== 'nl') continue
      await save(sheet.file, await sheet.draw(copy), sheet.w, sheet.h)
      continue
    }
    await save(file, await sheet.draw(copy), sheet.w, sheet.h)
  }
}

await browser.close()

await writeFile(path.join(OUT, 'README.md'),
  `# Merkpakket\n\nGemaakt met \`npm run brand\`. Het adres op de beelden staat op ` +
  `\`${SITE}\` — draai \`node scripts/make-brand.mjs --url jouwdomein.nl\` om dat te wijzigen.\n\n` +
  `## Logo\n\nSVG is het origineel: die blijft scherp op een poster van twee meter. ` +
  `Gebruik PNG alleen waar SVG niet mag.\n\n` +
  `| Bestand | Waarvoor |\n|---|---|\n` +
  `| \`logo/logo.svg\` | het volledige logo op een lichte ondergrond |\n` +
  `| \`logo/logo-wit.svg\` | hetzelfde, op een donkere ondergrond |\n` +
  `| \`logo/logo-kort.svg\` | zonder de regel eronder, voor kleine plekken |\n` +
  `| \`logo/logo-zwart.svg\` | één kleur, voor een stempel, een fax of een krant |\n` +
  `| \`logo/merk.svg\` | alleen de khatam, zonder naam |\n` +
  `| \`logo/icoon.svg\` | het app-icoon, met zijn donkere tegel |\n` +
  `| \`logo/fnek.svg\` | de mascotte, los |\n\n` +
  `## Socials\n\n` + SHEETS.filter((s) => s.file.startsWith('social')).map((s) => `- \`${s.file}\` — ${s.w}×${s.h}, ${s.what}`).join('\n') +
  `\n\n## Print\n\n- \`print/flyer-a5-<taal>.png\` — 1748×2480 op 300 dpi, dus A5 op ware grootte.\n\n` +
  `## Kleuren en letters\n\n` +
  `| | |\n|---|---|\n` +
  `| Saffraan | \`#f59e0b\` — knoppen en accenten |\n` +
  `| Terracotta | \`#e2603c\` — de warme achtergrond |\n` +
  `| Zellige-groen | \`#0d9488\` — het tweede accent |\n` +
  `| Nacht | \`#131b30\` — de donkere achtergrond |\n` +
  `| Inkt | \`#2b1d16\` — tekst op licht |\n` +
  `| Crème | \`#fffaf3\` — tekst op donker |\n\n` +
  `De letter is **Baloo 2** (800 voor koppen, 600 voor tekst), dezelfde als in ` +
  `de app; hij staat in \`public/fonts/\` en is gratis via Google Fonts. Het ` +
  `Arabisch is **Noto Naskh Arabic**.\n\n` +
  `Het beeldmerk is de achtpuntige khatam uit Marokkaanse zellige. De mascotte ` +
  `heet **Fnek** en is een fennek.\n`)
console.log('\nklaar')

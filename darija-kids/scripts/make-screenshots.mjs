/**
 * Photographs the real app in the sizes both stores demand.
 *
 * Not mock-ups: every screenshot is the app itself, running in a browser at
 * the device's own resolution, with a lived-in profile seeded first — a streak
 * going, some gems, a few lessons behind it — because an empty app sells
 * nothing. Each shot is framed with a caption in the language of the listing.
 *
 * Run `npm run preview` first, then:
 *   node scripts/make-screenshots.mjs [baseUrl] [outDir]
 *   node scripts/make-screenshots.mjs --lang nl --device iphone
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { GO_ON, GOT_IT, seeded } from './lib/profile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--') && !process.argv[process.argv.indexOf(a) - 1]?.startsWith('--'))

const BASE = positional[0] ?? 'http://127.0.0.1:4173'
const OUT = positional[1] ?? path.join(ROOT, 'store', 'screenshots')

/**
 * What each store wants, in pixels.
 *
 * Apple asks for one iPhone size and one iPad size and derives the rest;
 * Google wants a phone and, optionally, two tablets. `viewport` is the logical
 * size the app is laid out at, and the shot is scaled up to `w × h` from there.
 */
const DEVICES = {
  iphone: { w: 1290, h: 2796, viewport: { width: 430, height: 932 }, store: 'App Store · iPhone 6.9"' },
  ipad: { w: 2048, h: 2732, viewport: { width: 1024, height: 1366 }, store: 'App Store · iPad 13"' },
  play: { w: 1080, h: 1920, viewport: { width: 432, height: 768 }, store: 'Google Play · telefoon' },
  'play-7': { w: 1200, h: 1920, viewport: { width: 600, height: 960 }, store: 'Google Play · 7-inch tablet' },
  'play-10': { w: 1600, h: 2560, viewport: { width: 800, height: 1280 }, store: 'Google Play · 10-inch tablet' },
}

/** The six screens, and what each one is there to say. */
const SHOTS = [
  {
    id: '1-pad',
    path: '/leren',
    caption: {
      nl: 'Een pad van 17 units,\nvan alfabet tot souq',
      fr: 'Un parcours de 17 unités,\nde l’alphabet au souk',
      de: 'Ein Pfad aus 17 Einheiten,\nvom Alphabet bis zum Souk',
      es: 'Un camino de 17 unidades,\ndel alfabeto al zoco',
      it: 'Un percorso di 17 unità,\ndall\u2019alfabeto al souk',
      en: 'A path of 17 units,\nfrom the alphabet to the souq',
    },
  },
  {
    id: '2-letters',
    path: '/letters',
    caption: {
      nl: 'Het Arabische schrift,\nletter voor letter',
      fr: 'L’écriture arabe,\nlettre par lettre',
      de: 'Die arabische Schrift,\nBuchstabe für Buchstabe',
      es: 'La escritura árabe,\nletra a letra',
      it: 'La scrittura araba,\nlettera per lettera',
      en: 'The Arabic script,\nletter by letter',
    },
  },
  {
    id: '3-les',
    path: '/les/hruf-1',
    lesson: true,
    caption: {
      nl: 'Korte lessen die klinken\nen meteen belonen',
      fr: 'Des leçons courtes,\nsonores et gratifiantes',
      de: 'Kurze Lektionen, die klingen\nund sofort belohnen',
      es: 'Lecciones cortas que suenan\ny recompensan al momento',
      it: 'Lezioni brevi che suonano\ne premiano subito',
      en: 'Short lessons that sound,\nand reward straight away',
    },
  },
  {
    id: '4-woorden',
    path: '/woorden',
    caption: {
      nl: '304 woorden en 100 zinnen,\nelk met uitspraak',
      fr: '304 mots et 100 phrases,\nchacun avec la prononciation',
      de: '304 Wörter und 100 Sätze,\njedes mit Aussprache',
      es: '304 palabras y 100 frases,\ncada una con pronunciación',
      it: '304 parole e 100 frasi,\nognuna pronunciata',
      en: '304 words and 100 sentences,\nevery one spoken',
    },
  },
  {
    id: '5-verhalen',
    path: '/verhalen',
    caption: {
      nl: 'Echte gesprekken,\nzin voor zin te vertalen',
      fr: 'De vraies conversations,\nphrase par phrase',
      de: 'Echte Gespräche,\nSatz für Satz übersetzbar',
      es: 'Conversaciones de verdad,\nfrase a frase',
      it: 'Conversazioni vere,\nfrase per frase',
      en: 'Real conversations,\ntranslated line by line',
    },
  },
  {
    id: '6-jij',
    path: '/profiel',
    caption: {
      nl: 'Beloningen, reeksen\nen een dagdoel',
      fr: 'Récompenses, séries\net un objectif quotidien',
      de: 'Belohnungen, Serien\nund ein Tagesziel',
      es: 'Recompensas, rachas\ny un objetivo diario',
      it: 'Premi, serie\ne un obiettivo giornaliero',
      en: 'Rewards, streaks\nand a daily goal',
    },
  },
  {
    id: '7-spelen',
    path: '/spelen',
    caption: {
      nl: 'Drie spelletjes,\ndezelfde woorden',
      fr: 'Trois jeux,\nles mêmes mots',
      de: 'Drei Spiele,\ndieselben Wörter',
      es: 'Tres juegos,\nlas mismas palabras',
      it: 'Tre giochi,\nle stesse parole',
      en: 'Three games,\nthe same words',
    },
  },
  {
    id: '8-geschiedenis',
    path: '/geschiedenis',
    caption: {
      nl: 'Veertien filmpjes uit\nde geschiedenis van Marokko',
      fr: 'Quatorze courts récits\nde l’histoire du Maroc',
      de: 'Vierzehn kurze Filme\naus der Geschichte Marokkos',
      es: 'Catorce vídeos cortos\nde la historia de Marruecos',
      it: 'Quattordici filmati\ndalla storia del Marocco',
      en: 'Fourteen short films\nfrom the history of Morocco',
    },
  },
  {
    id: '9-herhalen',
    path: '/herhalen',
    caption: {
      nl: 'Een stapel die weet\nwat begint te wankelen',
      fr: 'Une pile qui sait\nce qui commence à vaciller',
      de: 'Ein Stapel, der weiß,\nwas ins Wanken gerät',
      es: 'Un montón que sabe\nqué empieza a flaquear',
      it: 'Un mazzo che sa\ncosa comincia a vacillare',
      en: 'A stack that knows\nwhat is starting to wobble',
    },
  },
  {
    id: '10-aanbod',
    path: '/volledig',
    /** Het abonnementsscherm hoort op slot te staan, anders valt er niets te kopen. */
    locked: true,
    /** De twee keuzeblokken met de prijs staan onder de vouw. */
    scroll: 570,
    hero: true,
    /**
     * Alleen voor de talen waarvan de vermelding in de eurozone staat.
     *
     * De Engelse vermelding is bij beide winkels de terugval voor de hele
     * wereld. Een Amerikaan ziet daar dus euro's op het plaatje, terwijl hij
     * in de app dollars betaalt: het bedrag klopt dan niet, en dat is bij
     * Apple een reden tot afkeuring. Vandaar geen aanbodplaatje in het Engels.
     */
    langs: ['nl', 'fr', 'de', 'es', 'it'],
  },
]

/**
 * De tiende opname is de enige die iets verkoopt in plaats van iets toont, en
 * heeft daarom een eigen lijst: een kop, twee prijsblokken en een voetregel.
 *
 * In het Engels staan er geen bedragen. Die vermelding is bij beide winkels de
 * terugval voor de hele wereld, dus een screenshot met euro's erop klopt dan
 * niet in Amerika of Marokko — en een prijs die niet klopt is een reden tot
 * afkeuring. Daar staat wat overal waar is.
 */
const AANBOD = {
  nl: {
    kicker: 'De taal van thuis',
    titel: 'Eindelijk Darija leren',
    pil1: { groot: '\u20ac 4,99 p/m', klein: 'bij een jaarabonnement' },
    pil2: { groot: '\u20ac 6,99 p/m', klein: 'per maand opzegbaar' },
    voet: '3 dagen gratis \u00b7 \u00e9\u00e9n abonnement voor het hele gezin',
  },
  fr: {
    kicker: 'La langue de la maison',
    titel: 'Enfin apprendre la darija',
    pil1: { groot: '4,99 \u20ac/mois', klein: 'avec l\u2019abonnement annuel' },
    pil2: { groot: '6,99 \u20ac/mois', klein: 'r\u00e9siliable chaque mois' },
    voet: '3 jours gratuits \u00b7 un abonnement pour toute la famille',
  },
  de: {
    kicker: 'Die Sprache von zu Hause',
    titel: 'Endlich Darija lernen',
    pil1: { groot: '4,99 \u20ac/Monat', klein: 'im Jahresabo' },
    pil2: { groot: '6,99 \u20ac/Monat', klein: 'monatlich k\u00fcndbar' },
    voet: '3 Tage gratis \u00b7 ein Abo f\u00fcr die ganze Familie',
  },
  es: {
    kicker: 'La lengua de casa',
    titel: 'Por fin aprender d\u00e1rija',
    pil1: { groot: '4,99 \u20ac/mes', klein: 'con el plan anual' },
    pil2: { groot: '6,99 \u20ac/mes', klein: 'cancelable cada mes' },
    voet: '3 d\u00edas gratis \u00b7 una suscripci\u00f3n para toda la familia',
  },
  it: {
    kicker: 'La lingua di casa',
    titel: 'Finalmente imparare la darija',
    pil1: { groot: '4,99 \u20ac/mese', klein: 'con l\u2019abbonamento annuale' },
    pil2: { groot: '6,99 \u20ac/mese', klein: 'disdicibile ogni mese' },
    voet: '3 giorni gratis \u00b7 un abbonamento per tutta la famiglia',
  },
}

/**
 * De Marokkaanse vlag, getekend in plaats van als emoji.
 *
 * Chromium heeft op deze machine geen lettertype met vlaggen, dus een emoji
 * komt eruit als de letters "MA". Een pentagram van vijf lijnen is zo
 * getekend en is op elk formaat scherp.
 */
const VLAG = (breedte) => {
  const punt = (i) => {
    const hoek = ((-90 + i * 72) * Math.PI) / 180
    return [45 + 14 * Math.cos(hoek), 30 + 14 * Math.sin(hoek)]
  }
  const ster = [0, 2, 4, 1, 3].map(punt).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  return `<svg width="${breedte}" height="${Math.round((breedte * 2) / 3)}" viewBox="0 0 90 60">
    <rect width="90" height="60" rx="4" fill="#C1272D"/>
    <path d="${ster} Z" fill="none" stroke="#006233" stroke-width="2.4" stroke-linejoin="round"/>
  </svg>`
}

/** The frame around the shot: a caption, then the screen itself. */
const frame = (device, capture, caption) => {
  const pad = Math.round(device.w * 0.055)
  const head = Math.round(device.h * 0.155)
  const lines = caption.split('\n')
  return `<!doctype html><meta charset="utf-8">
<style>
  @font-face { font-family: 'Fig'; src: local('Figtree'), local('Arial'); }
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${device.w}px; height: ${device.h}px; overflow: hidden;
    background: linear-gradient(160deg, #ffd79a, #f0915c 55%, #e2603c);
    font-family: Figtree, 'Segoe UI', system-ui, sans-serif;
  }
  .caption {
    height: ${head}px; display: flex; flex-direction: column; justify-content: center;
    align-items: center; text-align: center; padding: 0 ${pad}px;
    color: #2b1d16; font-weight: 800; letter-spacing: -0.01em;
    font-size: ${Math.round(device.w * 0.062)}px; line-height: 1.22;
  }
  .screen {
    margin: 0 ${pad}px; height: ${device.h - head - pad}px;
    border-radius: ${Math.round(device.w * 0.052)}px; overflow: hidden;
    box-shadow: 0 ${Math.round(device.w * 0.02)}px ${Math.round(device.w * 0.06)}px rgba(43,29,22,.32);
    background: #fffaf3;
  }
  .screen img { display: block; width: 100%; }
</style>
<div class="caption">${lines.map((l) => `<div>${l}</div>`).join('')}</div>
<div class="screen"><img src="data:image/png;base64,${capture}"></div>`
}

/**
 * Het frame om de tiende opname: een kop met de vlag, twee prijsblokken en een
 * voetregel, met daaronder een reep van het scherm zelf. Alles in maten die
 * meeschalen, zodat dezelfde opmaak op een telefoon en op een iPad klopt.
 */
const heroFrame = (device, capture, a) => {
  const pad = Math.round(device.w * 0.055)
  const head = Math.round(device.h * 0.33)
  return `<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${device.w}px; height: ${device.h}px; overflow: hidden;
    background: linear-gradient(160deg, #ffd79a, #f0915c 55%, #e2603c);
    font-family: Figtree, 'Segoe UI', system-ui, sans-serif; color: #2b1d16;
  }
  .kop {
    height: ${head}px; padding: ${Math.round(device.h * 0.035)}px ${pad}px 0;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }
  .kicker {
    display: flex; align-items: center; gap: ${Math.round(device.w * 0.022)}px;
    font-size: ${Math.round(device.w * 0.034)}px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .08em; color: #7a3a1e;
  }
  .kicker svg { display: block; box-shadow: 0 2px 6px rgba(43,29,22,.25); border-radius: 4px }
  h1 {
    margin-top: ${Math.round(device.h * 0.016)}px;
    font-size: ${Math.round(device.w * 0.079)}px; font-weight: 900;
    letter-spacing: -0.02em; line-height: 1.1;
  }
  .pillen {
    display: flex; gap: ${Math.round(device.w * 0.028)}px; width: 100%;
    margin-top: ${Math.round(device.h * 0.024)}px;
  }
  .pil {
    flex: 1; background: rgba(255,251,243,.95);
    border-radius: ${Math.round(device.w * 0.042)}px;
    padding: ${Math.round(device.h * 0.014)}px ${Math.round(device.w * 0.02)}px;
    box-shadow: 0 ${Math.round(device.w * 0.008)}px ${Math.round(device.w * 0.028)}px rgba(43,29,22,.22);
  }
  .pil .groot { font-size: ${Math.round(device.w * 0.052)}px; font-weight: 900; letter-spacing: -0.02em }
  .pil .klein { margin-top: ${Math.round(device.h * 0.004)}px; font-size: ${Math.round(device.w * 0.026)}px; color: #6b4a37 }
  .voet {
    margin-top: ${Math.round(device.h * 0.018)}px;
    font-size: ${Math.round(device.w * 0.031)}px; font-weight: 700; color: #7a3a1e;
  }
  .screen {
    margin: 0 ${pad}px; height: ${device.h - head - pad}px;
    border-radius: ${Math.round(device.w * 0.052)}px; overflow: hidden;
    box-shadow: 0 ${Math.round(device.w * 0.02)}px ${Math.round(device.w * 0.06)}px rgba(43,29,22,.32);
    background: #fffaf3;
  }
  .screen img { display: block; width: 100% }
</style>
<div class="kop">
  <div class="kicker">${VLAG(Math.round(device.w * 0.062))}<span>${a.kicker}</span></div>
  <h1>${a.titel}</h1>
  <div class="pillen">
    <div class="pil"><div class="groot">${a.pil1.groot}</div><div class="klein">${a.pil1.klein}</div></div>
    <div class="pil"><div class="groot">${a.pil2.groot}</div><div class="klein">${a.pil2.klein}</div></div>
  </div>
  <div class="voet">${a.voet}</div>
</div>
<div class="screen"><img src="data:image/png;base64,${capture}"></div>`
}

const shoot = async (browser, composer, lang, deviceKey) => {
  const device = DEVICES[deviceKey]
  const dir = path.join(OUT, lang, deviceKey)
  await mkdir(dir, { recursive: true })

  // The app is captured at the device's real pixel count, so it stays sharp
  // when it lands in the frame. The frame itself is drawn at one pixel per
  // pixel — a store rejects a 6.9" screenshot that is three times 6.9".
  const context = await browser.newContext({
    viewport: device.viewport,
    deviceScaleFactor: Math.max(2, device.w / device.viewport.width),
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate((state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)), seeded(lang))

  for (const shot of SHOTS) {
    if (shot.langs && !shot.langs.includes(lang)) continue
    // Het aanbod heeft een gebruiker nodig die nog niets heeft gekocht; alle
    // andere opnames juist een die al een tijdje bezig is.
    if (shot.locked) {
      await page.evaluate((state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)), { ...seeded(lang), unlocked: false, unlockedAt: null })
    }
    await page.goto(`${BASE}${shot.path}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(700)
    if (shot.hero) {
      // In een browser is er geen winkel, dus waar op een toestel de koopknop
      // staat, staat hier een regel die zegt dat kopen in de app gebeurt. Die
      // regel bestaat op een telefoon niet en hoort dus niet op een
      // winkelplaatje van de telefoon.
      await page.addStyleTag({ content: '[data-web-only] { display: none !important }' })
    }
    if (shot.scroll) {
      await page.mouse.move(device.viewport.width / 2, device.viewport.height / 2)
      await page.mouse.wheel(0, shot.scroll)
      await page.waitForTimeout(600)
    }
    if (shot.lesson) {
      // A lesson opens on its tip; step past it to an actual question.
      const tip = page.getByRole('button', { name: GO_ON })
      if (await tip.count()) await tip.first().click()
      await page.waitForTimeout(500)
      for (let i = 0; i < 4; i++) {
        const snap = page.locator('button', { hasText: GOT_IT })
        if (!(await snap.count())) break
        await snap.first().click({ force: true })
        await page.waitForTimeout(350)
      }
      await page.waitForTimeout(400)
    }
    const capture = (await page.screenshot()).toString('base64')
    if (shot.locked) {
      await page.evaluate((state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)), seeded(lang))
    }
    await composer.setViewportSize({ width: device.w, height: device.h })
    await composer.setContent(
      shot.hero ? heroFrame(device, capture, AANBOD[lang]) : frame(device, capture, shot.caption[lang]),
    )
    await composer.waitForTimeout(150)
    const file = path.join(dir, `${shot.id}.png`)
    await composer.screenshot({ path: file })
    console.log(path.relative(ROOT, file))
  }

  await context.close()
}

const langs = (arg('lang', 'nl,fr,de,es,it,en')).split(',')
const devices = (arg('device', Object.keys(DEVICES).join(','))).split(',')

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ executablePath: CHROME })
const frameContext = await browser.newContext({ deviceScaleFactor: 1 })
const composer = await frameContext.newPage()
for (const lang of langs) {
  for (const device of devices) {
    if (!DEVICES[device]) throw new Error(`onbekend formaat: ${device}`)
    await shoot(browser, composer, lang, device)
  }
}
await browser.close()

await writeFile(
  path.join(OUT, 'README.md'),
  `# Schermafbeeldingen\n\nGemaakt met \`npm run screenshots\` uit de echte app — geen mock-ups.\n\n` +
    Object.entries(DEVICES).map(([k, d]) => `- \`${k}/\` — ${d.store} (${d.w}×${d.h})`).join('\n') +
    `\n\nPer taal een map. Upload ze in dezelfde volgorde als de bestandsnamen.\n`,
)
console.log('\\nklaar')

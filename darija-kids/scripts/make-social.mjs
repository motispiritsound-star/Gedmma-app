/**
 * Vijf posts per taal, in vierkant en in staand.
 *
 * `make-marketing.mjs` tekent één vierkant en één verhaal per taal: het beeld
 * waarmee je de app aankondigt. Dat is genoeg voor dag nul en te weinig voor
 * de weken daarna, want een account dat één keer post staat stil.
 *
 * Dit maakt er een reeks van. Elke post zegt één ding en laat het scherm zien
 * waar dat ding gebeurt — geen mock-up, maar de app zoals hij draait, met een
 * profiel dat al een tijdje bezig is. De volgorde is een campagne: eerst het
 * probleem dat de lezer herkent, dan wat de app anders doet, dan het schrift,
 * dan dat beginnen gratis is, en tot slot het stuk dat mensen doorsturen.
 *
 * Draai eerst `npm run preview`, dan:
 *   node scripts/make-social.mjs [baseUrl] [--lang nl,fr]
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { seeded } from './lib/profile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const BASE = process.argv.slice(2).find((a) => a.startsWith('http')) ?? 'http://127.0.0.1:4173'
const UIT = path.join(ROOT, 'brand', 'social', 'posts')

/**
 * Het lettertype van de app, als data in de pagina.
 *
 * Ophalen bij de preview-server werkt niet: een pagina die met `setContent`
 * is gezet heeft `about:blank` als herkomst, en een woff2 van een andere
 * herkomst wordt zonder CORS-kop geweigerd. Dan valt de kop stil terug op een
 * systeemletter en staat er boven de opname iets anders dan erin.
 */
const letter = async (gewicht) => {
  const bytes = await readFile(path.join(ROOT, 'public', 'fonts', `baloo2-${gewicht}.woff2`))
  return `@font-face { font-family: 'Baloo 2'; font-weight: ${gewicht}; src: url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2') }`
}
const LETTERS = (await Promise.all([600, 800].map(letter))).join('\n  ')

/** Het scherm waar elke post over gaat. */
const POSTS = [
  { id: '1-oma', pad: '/leren' },
  { id: '2-stem', pad: '/woorden' },
  { id: '3-schrift', pad: '/letters' },
  { id: '4-gratis', pad: '/verhalen' },
  { id: '5-geschiedenis', pad: '/geschiedenis' },
]

/**
 * Wat er op elke post staat, per taal.
 *
 * De kop is kort genoeg om over een duim gelezen te worden en de onderregel
 * doet de rest. Geen getallen in de kop, op één na: 432 opnames is het enige
 * cijfer dat niemand kan naschrijven zonder het opnieuw op te nemen.
 */
const TEKST = {
  nl: {
    '1-oma': { kop: 'Je kind verstaat oma wel.', sub: 'Antwoorden lukt alleen niet.' },
    '2-stem': { kop: '432 opnames, geen computerstem.', sub: 'Elk woord gezegd door iemand die Darija spreekt.' },
    '3-schrift': { kop: 'Het Arabische schrift,\nletter voor letter.', sub: 'Alle 28, met hun drie vormen.' },
    '4-gratis': { kop: 'De eerste zes units zijn gratis.', sub: 'Geen account, geen advertenties, werkt offline.' },
    '5-geschiedenis': { kop: 'Veertien filmpjes uit\nde geschiedenis van Marokko.', sub: 'Na elke toets eentje, in je eigen taal.' },
    cta: 'darijaforkids.eu',
  },
  fr: {
    '1-oma': { kop: 'Ton enfant comprend mamie.', sub: 'C’est répondre qui ne vient pas.' },
    '2-stem': { kop: '432 enregistrements, aucune voix de synthèse.', sub: 'Chaque mot dit par quelqu’un qui parle darija.' },
    '3-schrift': { kop: 'L’écriture arabe,\nlettre par lettre.', sub: 'Les 28, avec leurs trois formes.' },
    '4-gratis': { kop: 'Les six premières unités sont gratuites.', sub: 'Sans compte, sans publicité, hors ligne.' },
    '5-geschiedenis': { kop: 'Quatorze courts récits\nde l’histoire du Maroc.', sub: 'Un après chaque test, dans ta langue.' },
    cta: 'darijaforkids.eu',
  },
  de: {
    '1-oma': { kop: 'Dein Kind versteht Oma.', sub: 'Nur antworten klappt nicht.' },
    '2-stem': { kop: '432 Aufnahmen, keine Computerstimme.', sub: 'Jedes Wort von jemandem, der Darija spricht.' },
    '3-schrift': { kop: 'Die arabische Schrift,\nBuchstabe für Buchstabe.', sub: 'Alle 28, mit ihren drei Formen.' },
    '4-gratis': { kop: 'Die ersten sechs Einheiten sind gratis.', sub: 'Kein Konto, keine Werbung, offline.' },
    '5-geschiedenis': { kop: 'Vierzehn kurze Filme\naus der Geschichte Marokkos.', sub: 'Nach jedem Test einer, in deiner Sprache.' },
    cta: 'darijaforkids.eu',
  },
  es: {
    '1-oma': { kop: 'Tu hijo entiende a la abuela.', sub: 'Lo que no sale es responder.' },
    '2-stem': { kop: '432 grabaciones, ninguna voz artificial.', sub: 'Cada palabra dicha por alguien que habla dariya.' },
    '3-schrift': { kop: 'La escritura árabe,\nletra a letra.', sub: 'Las 28, con sus tres formas.' },
    '4-gratis': { kop: 'Las seis primeras unidades son gratis.', sub: 'Sin cuenta, sin anuncios, sin conexión.' },
    '5-geschiedenis': { kop: 'Catorce vídeos cortos\nde la historia de Marruecos.', sub: 'Uno después de cada test, en tu idioma.' },
    cta: 'darijaforkids.eu',
  },
  it: {
    '1-oma': { kop: 'Tuo figlio capisce la nonna.', sub: 'È rispondere che non gli viene.' },
    '2-stem': { kop: '432 registrazioni, nessuna voce sintetica.', sub: 'Ogni parola detta da chi parla darija.' },
    '3-schrift': { kop: 'La scrittura araba,\nlettera per lettera.', sub: 'Tutte e 28, con le loro tre forme.' },
    '4-gratis': { kop: 'Le prime sei unità sono gratis.', sub: 'Senza account, senza pubblicità, offline.' },
    '5-geschiedenis': { kop: 'Quattordici filmati\ndalla storia del Marocco.', sub: 'Uno dopo ogni test, nella tua lingua.' },
    cta: 'darijaforkids.eu',
  },
  en: {
    '1-oma': { kop: 'Your child understands grandma.', sub: 'It is answering that does not come.' },
    '2-stem': { kop: '432 recordings, no computer voice.', sub: 'Every word said by someone who speaks Darija.' },
    '3-schrift': { kop: 'The Arabic script,\nletter by letter.', sub: 'All 28, with their three forms.' },
    '4-gratis': { kop: 'The first six units are free.', sub: 'No account, no adverts, works offline.' },
    '5-geschiedenis': { kop: 'Fourteen short films\nfrom the history of Morocco.', sub: 'One after every test, in your own language.' },
    cta: 'darijaforkids.eu',
  },
}

/** De achtpuntige khatam uit het icoon, zodat elke post dezelfde afzender heeft. */
const ster = (cx, cy, r, vul) => {
  const punten = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const straal = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * straal).toFixed(2)},${(cy + Math.sin(a) * straal).toFixed(2)}`
  })
  return `<polygon points="${punten.join(' ')}" fill="${vul}" />`
}

const merk = (maat) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maat} ${maat}" width="${maat}" height="${maat}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
  </linearGradient></defs>
  <rect width="${maat}" height="${maat}" rx="${maat * 0.22}" fill="#131b30"/>
  ${ster(maat / 2, maat / 2, maat * 0.36, 'url(#g)')}
  ${ster(maat / 2, maat / 2, maat * 0.17, '#0d9488')}
  <circle cx="${maat / 2}" cy="${maat / 2}" r="${maat * 0.055}" fill="#fffaf3"/>
</svg>`

const WARM = 'linear-gradient(150deg,#ffd79a,#f0915c 58%,#e2603c)'

/**
 * Het frame: kop boven, scherm eronder, half uit beeld.
 *
 * Het scherm loopt met opzet onderaan door. Een telefoon die niet helemaal
 * past leest als iets dat doorgaat, en het scheelt de vraag waar de opname
 * moet ophouden.
 */
const post = (w, h, kopHoogte, tekst, cta, beeld) => {
  const rand = Math.round(w * 0.075)
  const kop = tekst.kop.split('\n')
  return `<!doctype html><meta charset="utf-8">
<style>
  /* Het lettertype van de app zelf, opgehaald bij dezelfde server die het
     scherm serveert — anders staat er boven de opname een ander lettertype
     dan erin. */
  ${LETTERS}
  * { margin: 0; box-sizing: border-box }
  body {
    width: ${w}px; height: ${h}px; overflow: hidden;
    display: flex; flex-direction: column;
    background: ${WARM}; color: #2b1d16;
    font-family: 'Baloo 2', 'Trebuchet MS', 'Segoe UI', system-ui, sans-serif;
  }
  .kop {
    flex: 0 0 auto; min-height: ${kopHoogte}px;
    padding: ${Math.round(h * 0.04)}px ${rand}px ${Math.round(h * 0.03)}px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
  }
  .afzender {
    margin-bottom: ${Math.round(h * 0.022)}px;
    display: flex; align-items: center; gap: ${Math.round(w * 0.018)}px;
    font-size: ${Math.round(w * 0.031)}px; font-weight: 800;
    letter-spacing: .06em; text-transform: uppercase; color: #7a3a1e;
  }
  h1 {
    font-size: ${Math.round(w * 0.072)}px; font-weight: 900;
    line-height: 1.08; letter-spacing: -0.02em;
  }
  .sub {
    margin-top: ${Math.round(h * 0.016)}px;
    font-size: ${Math.round(w * 0.036)}px; font-weight: 600; opacity: .82;
    max-width: ${Math.round(w * 0.86)}px;
  }
  .cta {
    margin-top: ${Math.round(h * 0.03)}px;
    background: #2b1d16; color: #ffd79a; border-radius: 999px;
    font-size: ${Math.round(w * 0.032)}px; font-weight: 800;
    padding: ${Math.round(w * 0.016)}px ${Math.round(w * 0.045)}px;
  }
  .scherm {
    flex: 1 1 auto; min-height: 0; margin: 0 ${rand}px;
    border-radius: ${Math.round(w * 0.05)}px ${Math.round(w * 0.05)}px 0 0;
    overflow: hidden; background: #fffaf3;
    box-shadow: 0 ${Math.round(w * 0.016)}px ${Math.round(w * 0.05)}px rgba(43,29,22,.34);
  }
  .scherm img { display: block; width: 100% }
</style>
<div class="kop">
  <div class="afzender">${merk(Math.round(w * 0.06))}<span>Darijaforkids</span></div>
  <h1>${kop.map((r) => `<div>${r}</div>`).join('')}</h1>
  <div class="sub">${tekst.sub}</div>
  <div class="cta">${cta}</div>
</div>
<div class="scherm"><img src="data:image/png;base64,${beeld}"></div>`
}

const FORMATEN = [
  { naam: 'vierkant', w: 1080, h: 1080, kop: 0.46 },
  { naam: 'verhaal', w: 1080, h: 1920, kop: 0.34 },
]

const browser = await chromium.launch({ executablePath: CHROME })
const app = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, reducedMotion: 'reduce' })
const appPagina = await app.newPage()
const opmaak = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()

for (const lang of arg('lang', 'nl,fr,de,es,it,en').split(',')) {
  const tekst = TEKST[lang]
  if (!tekst) throw new Error(`onbekende taal: ${lang}`)
  const map = path.join(UIT, lang)
  await mkdir(map, { recursive: true })

  await appPagina.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await appPagina.evaluate((staat) => localStorage.setItem('darijakids.v1', JSON.stringify(staat)), seeded(lang))

  for (const p of POSTS) {
    await appPagina.goto(`${BASE}${p.pad}`, { waitUntil: 'networkidle' })
    await appPagina.waitForTimeout(700)
    const beeld = (await appPagina.screenshot()).toString('base64')

    for (const f of FORMATEN) {
      await opmaak.setViewportSize({ width: f.w, height: f.h })
      await opmaak.setContent(post(f.w, f.h, Math.round(f.h * f.kop), tekst[p.id], tekst.cta, beeld))
      await opmaak.evaluate(() => document.fonts.ready)
      await opmaak.waitForTimeout(200)
      const bestand = path.join(map, `${p.id}-${f.naam}.png`)
      await opmaak.screenshot({ path: bestand })
      console.log(path.relative(ROOT, bestand))
    }
  }
}

await browser.close()

await writeFile(
  path.join(UIT, 'README.md'),
  `# Posts\n\nGemaakt met \`npm run social\`, uit de echte app.\n\n` +
    `Per taal een map met tien bestanden: vijf berichten, elk in vierkant\n` +
    `(1080×1080, voor de feed) en staand (1080×1920, voor stories, reels en\n` +
    `TikTok).\n\n` +
    POSTS.map((p, i) => `${i + 1}. \`${p.id}\` — ${TEKST.nl[p.id].kop.replace(/\n/g, ' ')}`).join('\n') +
    `\n\nDe bijschriften staan in [store/social.md](../../../store/social.md).\n` +
    `Eén post per keer, twee per week; de volgorde hierboven is de campagne.\n`,
)
console.log('\nklaar')

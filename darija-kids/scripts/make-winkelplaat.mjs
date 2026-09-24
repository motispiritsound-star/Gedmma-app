/**
 * De omslagplaat en het duimnagelbeeld voor de winkel.
 *
 * Een betaalpartner toont bij elk product een liggende plaat van minstens
 * 1280 × 720 en een vierkante duimnagel. Zonder die twee ziet een productpagina
 * eruit als een bestandsdeling, en dan maakt de tekst eronder niet meer uit.
 *
 * De plaat kleedt zich als de boeken zelf: nachtblauw, goud, de zellige-band
 * en de sleutel met de achtpuntige ster. Rechts staan drie omslagen uit de
 * reeks, met hun échte titels erop, zodat een ouder in één blik ziet wat hij
 * koopt in plaats van een logo.
 *
 * Run with:
 *   node scripts/make-winkelplaat.mjs --product sleutels
 *   node scripts/make-winkelplaat.mjs --product sba
 *   node scripts/make-winkelplaat.mjs --product ebook
 *   node scripts/make-winkelplaat.mjs            # alle drie
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { H, khatam, sleutel, zellige } from './lib/historie.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'winkel')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const arg = (naam, terugval = null) => {
  const gelijk = process.argv.find((a) => a.startsWith(`--${naam}=`))
  if (gelijk) return gelijk.slice(naam.length + 3)
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ REEKS }, { DELEN: PRENTEN }, { PRIJS }] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/site/shop.ts'),
])
await server.close()

const [balo800, balo600] = await Promise.all([
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2')),
  readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-600.woff2')),
]).then((b) => b.map((x) => x.toString('base64')))

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Een geschilderde plaat als achtergrond, als die er is.
 *
 * Sba heeft er twaalf: de poort van Fes, de souq, de bergen. Daar valt met een
 * getekende sleutel niet tegenop, en een ouder die de leeuw ziet staan weet
 * meteen voor welke leeftijd dit is. De sleutels van Marokko heeft ze niet —
 * dat is een leesboek en de omslag doet daar het werk.
 */
const SOORT = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }
const plaat = async (bestand) => {
  if (!bestand || !existsSync(bestand)) return null
  const soort = SOORT[path.extname(bestand).toLowerCase()]
  if (!soort) throw new Error(`Onbekend beeldformaat: ${bestand}`)
  return `data:${soort};base64,${(await readFile(bestand)).toString('base64')}`
}

/** Drie delen uit een reeks: het begin, het midden en het eind. */
const drie = (delen) => [delen[0], delen[Math.floor(delen.length / 2)], delen[delen.length - 1]]

const PRODUCTEN = {
  sleutels: {
    reeks: 'De sleutels van Marokko',
    onder: `Alle vijftien delen, in zes talen`,
    regel: 'Vijftien boeken · 202 hoofdstukken · van het jaar 200 tot nu',
    prijs: PRIJS.sleutelsReeks,
    omslagen: [],
    kop: 'De vijftien delen',
    motief: 'sleutel',
    titels: REEKS.map((d) => ({ nummer: d.nummer, titel: d.titel, bij: d.jaar })),
    achtergrond: path.join(ROOT, 'site-assets', 'boeken', 'sleutel-plaat.webp'),
    /** De sleutel ligt dwars door het midden; daar past geen tekst naast. */
    tekstplek: 'onder',
    /** Vierkant valt het midden weg, en daar ligt juist de sleutel. */
    duimplek: '31% center',
  },
  sba: {
    reeks: 'Sba de Atlasleeuw',
    onder: 'Alle twaalf delen, in zes talen',
    regel: 'Twaalf voorleesboeken · 144 woorden Darija · vanaf 2 jaar',
    prijs: PRIJS.sbaReeks,
    omslagen: [],
    kop: 'De twaalf delen',
    /** De ondertitel is bij elk deel dezelfde regel; `waar` zegt wél iets. */
    titels: PRENTEN.map((d, i) => ({ nummer: d.nummer ?? i + 1, titel: d.titel, bij: d.waar })),
    achtergrond: path.join(ROOT, 'store', 'prentenboek', 'platen', '1', 'achtergrond.jpg'),
  },
  ebook: {
    reeks: 'Darijaforkids',
    onder: 'Het e-boek, in zes talen',
    regel: '17 units · 304 woorden · 100 zinnen · 28 letters',
    prijs: PRIJS.ebook,
    omslagen: [],
  },
}

/** Een omslag in het klein, met dezelfde opbouw als de gedrukte kaft. */
const mini = (o, i) => `
  <div class="mini" style="--i:${i}">
    <svg class="band boven" viewBox="0 0 120 8" preserveAspectRatio="none">${zellige(0, 0, 120, 8, H.goud)}</svg>
    <svg class="band onder" viewBox="0 0 120 8" preserveAspectRatio="none">${zellige(0, 0, 120, 8, H.goud)}</svg>
    <div class="nr">${o.nummer}</div>
    <div class="mt">${esc(o.titel)}</div>
    <svg class="mk" viewBox="-62 -158 124 256">${sleutel(0, 0, 1, H.goud)}</svg>
    <div class="mj">${esc(o.jaar)}</div>
  </div>`

const blad = (p, vierkant, achtergrond) => {
  const onder = !vierkant && p.tekstplek === 'onder'
  return `<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  *{margin:0;box-sizing:border-box}
  body{width:${vierkant ? 600 : 1600}px;height:${vierkant ? 600 : 900}px;background:${H.nacht};
       color:${H.perkament};font-family:'Baloo 2',system-ui,sans-serif;overflow:hidden;position:relative;
       display:flex;align-items:${onder ? 'flex-start' : 'center'};gap:${vierkant ? 0 : 70}px;
       padding:${vierkant ? '60px' : onder ? '0 80px 86px' : '0 80px'};
       flex-direction:${vierkant || onder ? 'column' : 'row'};
       justify-content:${onder ? 'flex-end' : achtergrond && !vierkant ? 'flex-start' : 'center'};
       text-align:${vierkant ? 'center' : 'left'}}
  body::before{content:'';position:absolute;inset:0;
    ${achtergrond
      ? `background-image:url(${achtergrond});background-size:cover;
         background-position:${vierkant ? p.duimplek ?? '74% center' : 'right center'}`
      : `background:radial-gradient(120% 90% at 30% 20%, #2b3a63 0%, ${H.nacht} 62%)`}}
  ${achtergrond ? `body::after{content:'';position:absolute;inset:0;background:linear-gradient(
      ${vierkant
        ? '180deg, #0d142466 0%, #0d1424cc 34%, #0d1424f2 62%, #0d1424 100%'
        : onder
          ? '0deg, #0d1424fa 0%, #0d1424e8 22%, #0d142488 44%, #0d142400 66%'
          : '90deg, #0d1424f2 0%, #0d1424e0 34%, #0d142455 58%, #0d142400 76%'})}
    .links,.band.rand{z-index:2}` : ''}
  .band.rand{position:absolute;left:0;width:100%;height:${vierkant ? 14 : 18}px;opacity:.9}
  .band.rand.b{top:${vierkant ? 22 : 30}px}.band.rand.o{bottom:${vierkant ? 22 : 30}px}
  .links{position:relative;flex:none;display:flex;flex-direction:column;
         align-items:${vierkant ? 'center' : 'flex-start'};gap:${vierkant ? 18 : 10}px;
         max-width:${vierkant ? 480 : onder ? 1000 : 660}px}
  .sl{width:${vierkant ? 96 : 120}px;flex:none;margin-bottom:${vierkant ? 4 : 10}px}
  .merk{font-weight:800;font-size:${vierkant ? 15 : 18}px;letter-spacing:.34em;text-transform:uppercase;
        color:${H.lichtGoud}}
  h1{font-weight:800;font-size:${vierkant ? 52 : 78}px;line-height:1.02;letter-spacing:-.01em}
  .onder{font-weight:600;font-size:${vierkant ? 22 : 31}px;color:${H.zand}}
  .regel{font-weight:600;font-size:${vierkant ? 15 : 19}px;color:#b5a68c}
  .prijs{margin-top:${vierkant ? 10 : 16}px;display:inline-block;background:${H.goud};color:${H.inkt};
         font-weight:800;font-size:${vierkant ? 22 : 28}px;padding:${vierkant ? '6px 16px' : '9px 22px'};
         border-radius:999px}
  .rechts{position:relative;flex:1;display:flex;justify-content:center;align-items:center;height:560px}
  .mini{position:absolute;width:250px;height:355px;background:${H.nacht};border:1px solid #c8952f44;
        border-radius:5px;box-shadow:0 22px 44px #00000066;overflow:hidden;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        padding:34px 22px;text-align:center;
        transform:translateX(calc((var(--i) - 1) * 210px)) rotate(calc((var(--i) - 1) * 6deg));
        z-index:calc(3 - var(--i))}
  .mini .band{position:absolute;left:0;width:100%;height:8px;opacity:.85}
  .mini .band.boven{top:18px}.mini .band.onder{bottom:18px}
  .mini .nr{position:absolute;top:32px;right:20px;font-weight:800;font-size:13px;color:#e6bb6299}
  .mini .mt{font-weight:800;font-size:21px;line-height:1.1;color:${H.perkament}}
  .mini .mk{width:44px;margin:14px 0 10px}
  .mini .mj{font-weight:600;font-size:13px;letter-spacing:.08em;color:${H.lichtGoud}}
</style>
<svg class="band rand b" viewBox="0 0 400 18" preserveAspectRatio="none">${zellige(0, 0, 400, 18, H.goud)}</svg>
<svg class="band rand o" viewBox="0 0 400 18" preserveAspectRatio="none">${zellige(0, 0, 400, 18, H.goud)}</svg>
<div class="links">
  ${achtergrond ? '' : `<svg class="sl" viewBox="-62 -158 124 256">${sleutel(0, 0, 1, H.goud)}</svg>`}
  <div class="merk">Darijaforkids</div>
  <h1>${esc(p.reeks)}</h1>
  <div class="onder">${esc(p.onder)}</div>
  <div class="regel">${esc(p.regel)}</div>
  <div class="prijs">${esc(p.prijs)}</div>
</div>
${vierkant || !p.omslagen.length ? '' : `<div class="rechts">${p.omslagen.map(mini).join('')}</div>`}`
}

/**
 * Alle delen op één plaat.
 *
 * Een omslag verkoopt het gevoel; deze plaat beantwoordt de vraag die daarna
 * komt — wat zit erin? Vijftien regels met een nummer, een titel en het jaar,
 * zoals de inhoudsopgave van een boek. Dat is te lezen op een telefoon en het
 * scheelt een ouder het uitklappen van een beschrijving.
 */
const inhoudsblad = (p) => `<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo800}) format('woff2');font-weight:800}
  @font-face{font-family:'Baloo 2';src:url(data:font/woff2;base64,${balo600}) format('woff2');font-weight:600}
  *{margin:0;box-sizing:border-box}
  body{width:1600px;height:900px;background:${H.nacht};color:${H.perkament};overflow:hidden;
       font-family:'Baloo 2',system-ui,sans-serif;padding:74px 90px;position:relative}
  body::before{content:'';position:absolute;inset:0;
    background:radial-gradient(130% 100% at 18% 0%, #2b3a63 0%, ${H.nacht} 66%)}
  .band{position:absolute;left:0;width:100%;height:16px;opacity:.9}
  .band.b{top:26px}.band.o{bottom:26px}
  .kopregel{position:relative;display:flex;align-items:flex-end;gap:22px;margin-bottom:34px}
  .kopregel svg.sl{width:54px;flex:none}
  .merk{font-weight:800;font-size:15px;letter-spacing:.32em;text-transform:uppercase;color:${H.lichtGoud}}
  h1{font-weight:800;font-size:44px;line-height:1}
  .telling{margin-left:auto;font-weight:600;font-size:18px;color:#b5a68c;padding-bottom:6px}
  ul{position:relative;list-style:none;padding:0;display:grid;grid-template-columns:1fr 1fr;
     gap:6px 56px;grid-auto-flow:column;grid-template-rows:repeat(8,1fr);height:620px}
  li{display:flex;align-items:baseline;gap:16px;border-bottom:1px solid #ffffff14;padding-bottom:7px}
  .n{font-weight:800;font-size:19px;color:${H.goud};width:32px;flex:none;
     font-variant-numeric:tabular-nums}
  .t{font-weight:800;font-size:23px;line-height:1.15;min-width:0}
  .j{margin-left:auto;font-weight:600;font-size:15px;color:#9d8f78;white-space:nowrap;padding-left:14px}
</style>
<svg class="band b" viewBox="0 0 400 16" preserveAspectRatio="none">${zellige(0, 0, 400, 16, H.goud)}</svg>
<svg class="band o" viewBox="0 0 400 16" preserveAspectRatio="none">${zellige(0, 0, 400, 16, H.goud)}</svg>
<div class="kopregel">
  ${p.motief === 'sleutel' ? `<svg class="sl" viewBox="-62 -158 124 256">${sleutel(0, 0, 1, H.goud)}</svg>` : ''}
  <div><div class="merk">${esc(p.reeks)}</div><h1>${esc(p.kop)}</h1></div>
  <div class="telling">${esc(p.onder)}</div>
</div>
<ul>${p.titels.map((t) => `<li>
  <span class="n">${String(t.nummer).padStart(2, '0')}</span>
  <span class="t">${esc(t.titel)}</span>
  <span class="j">${esc(t.bij)}</span></li>`).join('')}</ul>`

await mkdir(UIT, { recursive: true })
const browser = await chromium.launch({ executablePath: CHROME })
const welke = arg('product') ? [arg('product')] : Object.keys(PRODUCTEN)

for (const naam of welke) {
  const p = PRODUCTEN[naam]
  if (!p) throw new Error(`Onbekend product "${naam}". Kies uit: ${Object.keys(PRODUCTEN).join(', ')}`)
  if (p.titels?.length) {
    const pagina = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 })
    await pagina.setContent(inhoudsblad(p), { waitUntil: 'load' })
    await pagina.evaluate(() => document.fonts.ready)
    const bestand = path.join(UIT, `${naam}-titels.png`)
    await pagina.screenshot({ path: bestand })
    await pagina.close()
    console.log(`  ${path.relative(ROOT, bestand)}  1600 × 900`)
  }
  for (const [soort, vierkant, breed, hoog] of [['omslag', false, 1600, 900], ['duim', true, 600, 600]]) {
    const pagina = await browser.newPage({ viewport: { width: breed, height: hoog }, deviceScaleFactor: 1 })
    await pagina.setContent(blad(p, vierkant, await plaat(p.achtergrond)), { waitUntil: 'load' })
    await pagina.evaluate(() => document.fonts.ready)
    const bestand = path.join(UIT, `${naam}-${soort}.png`)
    await pagina.screenshot({ path: bestand })
    await pagina.close()
    console.log(`  ${path.relative(ROOT, bestand)}  ${breed} × ${hoog}`)
  }
}

await browser.close()

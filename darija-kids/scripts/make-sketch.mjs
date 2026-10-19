/**
 * Een plaat bij een sketch: twee stemmen, en een clou van iemand die meeluistert.
 *
 * Dit is de broer van `make-weetje.mjs`. Dat maakt een plaat bij een weetje;
 * dit maakt er een bij een gesprek. De aanleiding is dezelfde: in een
 * Facebookgroep scrolt tekst voorbij, en een grap die pas na "meer weergeven"
 * landt, landt niet. Staat het gesprek in de plaat, dan is de clou te lezen
 * voordat er iets geklikt hoeft te worden.
 *
 * Draaien:
 *   node scripts/make-sketch.mjs --scene "Zaterdagavond. De kinderen zitten twee meter verderop." \
 *     --zeg "Ik|nqulu lihom ghadi nmshiw?|Zullen we ze zeggen dat we weggaan?" \
 *     --zeg "Zij|la, daba ghadi ytlbu.|Nee, dan beginnen ze meteen te zeuren." \
 *     --clou "Onze zoon, zonder op te kijken|Ik wil wel een ijsje." \
 *     --naam ijsje
 *
 * Een `--zeg` is drie stukken met een rechte streep ertussen: wie het zegt,
 * de Darija, en wat het betekent. De spreker wisselt vanzelf van kant, dus je
 * hoeft niet te zeggen welke kant op. `--clou` is twee stukken en staat altijd
 * onderaan, over de volle breedte -- dat is de regel waar het om gaat.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'weetjes')

const args = process.argv.slice(2)
/* `>= 0` en niet `> 0`: de vlag die je als eerste typt staat op plek nul.
   Dezelfde fout zat in make-weetje.mjs en kostte daar een halve avond. */
const arg = (naam, terug = '') => {
  const i = args.indexOf(`--${naam}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : terug
}
const alle = (naam) => args.flatMap((a, i) => (a === `--${naam}` && args[i + 1] !== undefined ? [args[i + 1]] : []))

const scene = arg('scene')
const naam = arg('naam', 'sketch')
const merkregel = arg('merk', 'Darijaforkids')

/** "Ik|darija|vertaling" wordt drie velden. Ontbrekende velden zijn leeg. */
const deel = (regel, hoeveel) => {
  const stukken = regel.split('|').map((s) => s.trim())
  return Array.from({ length: hoeveel }, (_, i) => stukken[i] ?? '')
}

const beurten = alle('zeg').map((r) => deel(r, 3))
const clou = arg('clou') ? deel(arg('clou'), 2) : null

if (!beurten.length) {
  console.error('\nEr is niets te zeggen: geef minstens één --zeg mee.')
  console.error('Vorm: --zeg "Ik|de darija|wat het betekent"\n')
  process.exit(1)
}

const letter = async (bestand) =>
  `data:font/woff2;base64,${(await readFile(path.join(ROOT, 'public', 'fonts', bestand))).toString('base64')}`

const baloo = await letter('baloo2-800.woff2')
const naskh = await letter('noto-naskh-arabic-700.woff2')

/* Dezelfde kleuren als de app en als make-weetje.mjs. Een plaat die niet op
   de app lijkt is reclame voor iets anders. */
const NACHT = '#0d1220'
const SAFFRAAN = '#f59e0b'
const ZELLIGE = '#0f766e'

/* Eén doorgaande lijn, geen vulling -- zie Khatim.tsx: een zegel, geen sticker. */
const STER = 'M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/* De beurten wisselen van kant. Twee ouders aan één tafel lezen alleen als
   gesprek als ze tegenover elkaar staan; onder elkaar is het een lijstje. */
const bubbels = beurten.map(([wie, darija, vertaling], i) => `
  <div class="beurt ${i % 2 ? 'rechts' : 'links'}">
    ${wie ? `<div class="wie">${esc(wie)}</div>` : ''}
    <div class="bubbel">
      <div class="darija">${esc(darija)}</div>
      ${vertaling ? `<div class="vertaling">${esc(vertaling)}</div>` : ''}
    </div>
  </div>`).join('')

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: Baloo; src: url(${baloo}) format('woff2'); font-weight: 800 }
  @font-face { font-family: Naskh; src: url(${naskh}) format('woff2'); font-weight: 700 }
  * { margin: 0; padding: 0; box-sizing: border-box }
  body {
    width: 1080px; height: 1350px; background: ${NACHT};
    font-family: Baloo, sans-serif; color: #fff; overflow: hidden;
    display: flex; flex-direction: column; justify-content: center;
    padding: 80px 80px 196px; position: relative;
  }
  .veld { position: absolute; inset: 0; opacity: .12 }
  .scene {
    font-size: 31px; line-height: 1.35; color: #cbd5e1; font-weight: 600;
    margin-bottom: 34px; text-align: center;
  }
  .beurt { display: flex; flex-direction: column; margin-bottom: 22px; max-width: 76% }
  .beurt.rechts { align-self: flex-end; align-items: flex-end; text-align: end }
  .wie { font-size: 26px; color: ${SAFFRAAN}; margin-bottom: 8px; letter-spacing: .5px }
  .bubbel {
    background: rgba(255,255,255,.07); border: 2px solid rgba(255,255,255,.12);
    border-radius: 26px; padding: 20px 26px;
  }
  .darija { font-size: 40px; line-height: 1.2 }
  .vertaling { font-size: 28px; line-height: 1.3; color: #94a3b8; font-weight: 600; margin-top: 9px }
  /* De clou krijgt de kleur van de app en de volle breedte: hij hoort niet
     in de rij mee te lezen, hij hoort hem te onderbreken. */
  .clou {
    margin-top: 30px; border-radius: 26px; padding: 26px 32px;
    background: ${ZELLIGE}; border: 2px solid rgba(255,255,255,.2);
  }
  .clou .wie { color: #ccfbf1; margin-bottom: 10px }
  .clou .wat { font-size: 44px; line-height: 1.22 }
  .merk {
    position: absolute; left: 80px; right: 80px; bottom: 64px;
    display: flex; align-items: center; gap: 18px; font-size: 32px; color: ${SAFFRAAN};
  }
</style>
<svg class="veld" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs><pattern id="p" width="180" height="180" patternUnits="userSpaceOnUse">
    <path d="${STER}" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round" transform="translate(40 40)"/>
  </pattern></defs>
  <rect width="1080" height="1350" fill="url(#p)"/>
</svg>
${scene ? `<div class="scene">${esc(scene)}</div>` : ''}
${bubbels}
${clou ? `<div class="clou">${clou[0] ? `<div class="wie">${esc(clou[0])}</div>` : ''}<div class="wat">${esc(clou[1])}</div></div>` : ''}
<div class="merk">
  <svg width="38" height="38" viewBox="0 0 100 100"><path d="${STER}" fill="none" stroke="${SAFFRAAN}" stroke-width="7" stroke-linejoin="round"/></svg>
  <span>${esc(merkregel)}</span>
  <span style="margin-inline-start:auto;color:${ZELLIGE};font-family:Naskh">دارجة</span>
</div>
`

const browser = await startChroom()
const page = await browser.newPage()
await page.setViewportSize({ width: 1080, height: 1350 })
await page.setContent(html, { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await mkdir(UIT, { recursive: true })
const uit = path.join(UIT, `${naam}.png`)
await page.screenshot({ path: uit })
await browser.close()

console.log(`\n${path.relative(ROOT, uit)}\n`)

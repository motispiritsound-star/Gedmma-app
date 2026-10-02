import { chromium } from 'playwright'

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const BASE = 'http://localhost:5347'

const KEY = 'darijakids.v1'

// Een gevorderde abonnee: 300 woorden ontmoet, allemaal al eens goed.
function gevorderd(nWords = 300, dueFrac = 0.25) {
  const nu = Date.now()
  const cards = {}
  return { nWords, dueFrac, nu, cards }
}

const browser = await chromium.launch({ executablePath: EXE })

async function page(w, h, seed) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  const p = await ctx.newPage()
  await p.goto(BASE + '/leren', { waitUntil: 'domcontentloaded' })
  if (seed) await p.evaluate(([k, s]) => localStorage.setItem(k, s), [KEY, JSON.stringify(seed)])
  return { ctx, p }
}

// ---------------------------------------------------------- 1. woordenboek
{
  const { ctx, p } = await page(320, 568, { settings: { lang: 'nl' }, unlocked: true })
  const cdp = await ctx.newCDPSession(p)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 })
  const t0 = Date.now()
  await p.goto(BASE + '/woorden', { waitUntil: 'commit' })
  await p.waitForSelector('input[type=search]')
  const tVeld = Date.now() - t0
  await p.waitForFunction(() => document.querySelectorAll('li .ar').length > 0, null, { timeout: 30000 })
  const tEerste = Date.now() - t0
  const info = await p.evaluate(() => ({
    kaarten: document.querySelectorAll('ul.space-y-2 > li').length,
    knopen: document.querySelectorAll('*').length,
    hoogte: document.documentElement.scrollHeight,
    tekst: document.querySelector('p.mt-4')?.textContent,
  }))
  console.log(`[woorden 320px, cpu 6x] zoekveld na ${tVeld}ms, eerste woord na ${tEerste}ms`)
  console.log(`[woorden] ${JSON.stringify(info)}`)

  // toetsaanslagen
  const veld = p.locator('input[type=search]')
  await veld.click()
  const woord = 'school'
  const tijden = []
  for (const ch of woord) {
    const a = Date.now()
    await veld.press(ch)
    await p.waitForFunction(() => true)
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    tijden.push(Date.now() - a)
  }
  console.log(`[woorden] toetsaanslagen "school" (cpu 6x): ${tijden.join('ms, ')}ms`)

  // scrollgedrag: ver naar beneden, dan typen
  await veld.fill('')
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(r)))
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  for (let i = 0; i < 6; i++) {
    await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await p.waitForTimeout(400)
  }
  const voor = await p.evaluate(() => ({ y: Math.round(scrollY), h: document.documentElement.scrollHeight, kaarten: document.querySelectorAll('ul.space-y-2 > li').length }))
  await veld.press('s')
  await p.waitForTimeout(600)
  const na = await p.evaluate(() => {
    const eerste = document.querySelector('ul.space-y-2 > li')
    const r = eerste?.getBoundingClientRect()
    return {
      y: Math.round(scrollY), h: document.documentElement.scrollHeight,
      kaarten: document.querySelectorAll('ul.space-y-2 > li').length,
      eersteTop: r ? Math.round(r.top) : null,
      eersteInBeeld: r ? r.top >= 0 && r.top < innerHeight : null,
      zichtbaar: [...document.querySelectorAll('ul.space-y-2 > li')].filter((li) => { const b = li.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight }).length,
    }
  })
  console.log(`[woorden] ver gescrold: ${JSON.stringify(voor)}`)
  console.log(`[woorden] na 1 toetsaanslag: ${JSON.stringify(na)}`)

  // zoekveld plakt?
  const plak = await p.evaluate(() => {
    const el = document.querySelector('input[type=search]')?.parentElement
    const r = el.getBoundingClientRect()
    return { top: Math.round(r.top), kopHoogte: getComputedStyle(document.documentElement).getPropertyValue('--kop-hoogte').trim() }
  })
  console.log(`[woorden] zoekveld tijdens scrollen op y=${plak.top}, --kop-hoogte=${plak.kopHoogte}`)
  await ctx.close()
}

// ------------------------------------------------------------- 2. letters
{
  const { ctx, p } = await page(320, 568, { settings: { lang: 'nl' }, unlocked: true })
  await p.goto(BASE + '/letters', { waitUntil: 'load' })
  await p.waitForSelector('button.ar')
  const g = await p.evaluate(() => {
    const knoppen = [...document.querySelectorAll('div.grid button.ar')]
    const maten = knoppen.map((b) => { const r = b.getBoundingClientRect(); return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } })
    return { n: knoppen.length, eerste: maten[0], kleinste: maten.reduce((a, b) => (b.w < a.w ? b : a), maten[0]), onder44: maten.filter((m) => m.w < 44 || m.h < 44).length }
  })
  console.log(`[letters 320px] ${JSON.stringify(g)}`)
  const g390 = await (async () => {
    await p.setViewportSize({ width: 390, height: 844 })
    await p.waitForTimeout(200)
    return p.evaluate(() => { const r = document.querySelector('div.grid button.ar').getBoundingClientRect(); return { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 } })
  })()
  console.log(`[letters 390px] tegel ${JSON.stringify(g390)}`)
  await ctx.close()
}

await browser.close()

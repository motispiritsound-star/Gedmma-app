/**
 * Builds darijaforkids.eu — the website, which is not the app.
 *
 * The app is downloaded from the App Store and Google Play. What stands on
 * the website is a shop window: what it is, who it is for, what it sounds
 * like, what it costs, and the three pages the stores insist a buyer can read
 * before they buy — privacy, terms, and the page for parents.
 *
 * Plain HTML, one stylesheet, no JavaScript. Four pages in six languages is
 * twenty-four files that never change between two visitors, so there is
 * nothing for a framework to do. It also means the whole site is a few
 * hundred kilobytes and works on a phone in Morocco.
 *
 * Nearly all the words come out of the app's own modules — the reasons, the
 * path, the questions, the privacy statement, the terms — because they are
 * already written and already translated into six languages, and a website
 * that drifts from the app it advertises is worse than no website. Only what
 * the app has no words for lives in src/site/copy.ts.
 *
 * Run with: node scripts/make-site.mjs [--out site]
 */
import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}
const OUT = path.resolve(ROOT, arg('out', 'site'))

/* ------------------------------------------------------------------ laden */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})

const load = (id) => server.ssrLoadModule(id)

const [
  { LANGS, localeOf },
  { SITE },
  { STORE, SITE_URL, PATHS },
  { NAMEN },
  { PRIVACY },
  { TERMS },
  { OPERATOR, traderKnown },
  { UNITS },
  { HISTORY },
  { unitSubtitle, lessonTitle, historyOf },
  ...packs
] = await Promise.all([
  load('/src/i18n/languages.ts'),
  load('/src/site/copy.ts'),
  load('/src/site/links.ts'),
  load('/src/site/namen.ts'),
  load('/src/i18n/privacy.ts'),
  load('/src/i18n/terms.ts'),
  load('/src/content/operator.ts'),
  load('/src/content/curriculum.ts'),
  load('/src/content/history.ts'),
  load('/src/content/localise.ts'),
  load('/src/i18n/nl.ts'),
  load('/src/i18n/fr.ts'),
  load('/src/i18n/de.ts'),
  load('/src/i18n/es.ts'),
  load('/src/i18n/it.ts'),
  load('/src/i18n/en.ts'),
])

const STRINGS = {
  nl: packs[0].nl, fr: packs[1].fr, de: packs[2].de,
  es: packs[3].es, it: packs[4].it, en: packs[5].en,
}

await server.close()

/* ------------------------------------------------------------ gereedschap */

const esc = (value) => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** An empty string, null or undefined drops out; everything else is joined. */
const join = (parts) => parts.filter(Boolean).join('\n')

const paragraphs = (lines) => lines.map((line) => `<p>${esc(line)}</p>`).join('\n')

const mailto = `mailto:${OPERATOR.email}`

/* ----------------------------------------------------------------- casco */

const langRow = (lang, page) => LANGS.map((other) => {
  const href = PATHS[other.code][page]
  const here = other.code === lang
  return `<li><a href="${href}"${here ? ' aria-current="page"' : ''} hreflang="${other.code}">${esc(other.badge)} ${esc(other.name)}</a></li>`
}).join('')

const header = (lang, page) => {
  const c = SITE[lang]
  const here = LANGS.find((l) => l.code === lang)
  const home = PATHS[lang].home
  const nav = page === 'home'
    ? `<nav aria-label="${esc(c.menu.waarom)}">
        <a href="#waarom">${esc(c.menu.waarom)}</a>
        <a href="#stem">${esc(c.menu.stem)}</a>
        <a href="#pad">${esc(c.menu.pad)}</a>
        <a href="#vragen">${esc(c.menu.vragen)}</a>
        <a href="${PATHS[lang].parents}">${esc(c.menu.ouders)}</a>
        <a href="#contact">${esc(c.menu.contact)}</a>
      </nav>`
    : `<nav aria-label="${esc(c.menu.contact)}"><a href="${home}">${esc(c.terugNaarHome)}</a></nav>`

  return `<header class="top">
  <div class="wrap">
    <a class="brand" href="${home}"><img src="/icons/icon.svg" alt="" width="32" height="32"><span>Darijaforkids</span><img class="vlag" src="/icons/vlag-ma.svg" alt="${esc(c.marokko)}" width="27" height="18"></a>
    ${nav}
    <details class="langpick">
      <summary><span aria-hidden="true">${esc(here.badge)}</span> <span class="sr-name">${esc(here.name)}</span></summary>
      <ul>${langRow(lang, page)}</ul>
    </details>
  </div>
</header>`
}

const footer = (lang) => {
  const c = SITE[lang]
  const p = PATHS[lang]
  return `<footer>
  <div class="wrap">
    <div class="cols">
      <div>
        <h3>Darijaforkids</h3>
        <p>${esc(c.voetnoot)}</p>
      </div>
      <div>
        <h3>${esc(c.juridisch)}</h3>
        <ul>
          <li><a href="${p.privacy}">${esc(c.privacyLink)}</a></li>
          <li><a href="${p.terms}">${esc(c.voorwaardenLink)}</a></li>
          <li><a href="${p.parents}">${esc(c.oudersLink)}</a></li>
        </ul>
      </div>
      <div>
        <h3>${esc(c.contactTitel)}</h3>
        <ul>
          <li><a href="${mailto}">${esc(OPERATOR.email)}</a></li>
        </ul>
      </div>
      <div>
        <h3>${esc(c.taal)}</h3>
        <ul>${langRow(lang, 'home')}</ul>
      </div>
    </div>
    <div class="bottom">
      <span>© ${new Date().getFullYear()} ${esc(OPERATOR.name)}</span>
      <span>${esc(OPERATOR.country)}</span>
      <span>KvK ${esc(OPERATOR.registration)}</span>
    </div>
  </div>
</footer>`
}

/**
 * The page around the content.
 *
 * The inline script is the only JavaScript on the site and it is there to
 * undo something: the app used to be served from this domain and installed a
 * service worker, which would happily keep handing the old app to anybody who
 * had visited before. It unregisters itself and empties the caches.
 */
const layout = ({ lang, page, title, description, body, ogImage = '/og.png' }) => {
  const canonical = SITE_URL + PATHS[lang][page === 'home' ? 'home' : page]
  const alternates = LANGS.map((l) =>
    `<link rel="alternate" hreflang="${l.code}" href="${SITE_URL}${PATHS[l.code][page === 'home' ? 'home' : page]}">`).join('\n  ')

  return `<!doctype html>
<html lang="${localeOf(lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#0d1220">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <link rel="alternate" hreflang="x-default" href="${SITE_URL}${PATHS.en[page === 'home' ? 'home' : page]}">
  <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
  <link rel="stylesheet" href="/site.css">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Darijaforkids">
  <meta property="og:locale" content="${localeOf(lang).replace('-', '_')}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
<a class="skip" href="#main">${esc(SITE[lang].naarInhoud)}</a>
${header(lang, page)}
<main id="main">
${body}
</main>
${footer(lang)}
<script>
// De app stond hier vroeger en liet een service worker achter die hem uit de
// cache blijft serveren. Weg ermee, anders ziet een eerdere bezoeker nooit
// deze site.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister() }) })
  if (window.caches) caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k) }) })
}

// De pijlen van de collage. Vegen werkt zonder dit; de knoppen zijn erbij voor
// wie een muis heeft, en staan daarom verstopt tot ze echt iets kunnen doen.
Array.prototype.forEach.call(document.querySelectorAll('.collage'), function (collage) {
  var track = collage.querySelector('.track')
  var prev = collage.querySelector('.prev')
  var next = collage.querySelector('.next')
  if (!track || !prev || !next) return
  prev.hidden = false
  next.hidden = false

  function stap(richting) {
    var eerste = track.querySelector('img')
    var breedte = eerste ? eerste.getBoundingClientRect().width + 16 : track.clientWidth
    track.scrollBy({ left: richting * breedte, behavior: 'smooth' })
  }
  prev.addEventListener('click', function () { stap(-1) })
  next.addEventListener('click', function () { stap(1) })

  function bij() {
    var eind = track.scrollWidth - track.clientWidth
    prev.disabled = track.scrollLeft < 8
    next.disabled = track.scrollLeft > eind - 8
  }
  track.addEventListener('scroll', bij, { passive: true })
  window.addEventListener('resize', bij)
  bij()
})
</script>
</body>
</html>
`
}

/* ------------------------------------------------------------- startpagina */

/** Zolang geen van beide winkels een adres heeft, is de app nog niet te krijgen. */
const LIVE = Boolean(STORE.apple || STORE.google)

const storeButton = (label, sub, href) => href
  ? `<a class="store" href="${href}" rel="noopener"><span><span class="small">${esc(sub)}</span><span class="big">${esc(label)}</span></span></a>`
  : `<span class="store" aria-disabled="true"><span><span class="small">${esc(sub)}</span><span class="big">${esc(label)}</span></span></span>`

const downloadBlock = (lang) => {
  const c = SITE[lang]
  const live = LIVE
  return `<div class="buttons">
      ${storeButton(c.appStore, STORE.apple ? c.downloadOp : c.binnenkort, STORE.apple)}
      ${storeButton(c.playStore, STORE.google ? c.verkrijgbaarOp : c.binnenkort, STORE.google)}
    </div>
    <p class="trust">${esc(c.trustLine)}</p>
    ${live ? '' : `<p class="soon">${esc(c.binnenkortBody)}</p>
    <a class="mailbtn" href="${mailto}?subject=${encodeURIComponent(c.houMeOpDeHoogte)}&body=${encodeURIComponent(c.houMeOpDeHoogteMail)}">${esc(c.houMeOpDeHoogte)}</a>`}`
}

const unitList = (lang) => {
  const c = SITE[lang]
  const byLevel = { A0: [], A1: [], A2: [] }
  UNITS.forEach((unit, i) => byLevel[unit.level].push([i + 1, unit]))

  return ['A0', 'A1', 'A2'].map((level) => `<p class="level">${esc(c.padNiveau[level])} · ${level}</p>
    <div class="units">
      ${byLevel[level].map(([no, unit]) => `<div class="unit">
        <span class="no">${no}</span>
        <span>
          <span class="name">${esc(unit.title)}</span> <span class="ar">${esc(unit.ar)}</span>
          <span class="sub">${esc(unitSubtitle(unit, lang))} · ${esc(c.padLessen(unit.lessons.length))}</span>
        </span>
      </div>`).join('\n')}
    </div>`).join('\n')
}

/**
 * De schermen als collage, met pijlen en met vegen.
 *
 * Eén rij die horizontaal schuift, met scroll-snap zodat een veeg op een
 * telefoon netjes op het volgende scherm uitkomt. De pijlen zijn knoppen die
 * pas verschijnen als er JavaScript is: zonder JavaScript kun je nog steeds
 * vegen en met de pijltjestoetsen door de rij lopen, en dan staan er geen
 * knoppen die niets doen.
 */
const shotGallery = (lang, shots) => {
  const c = SITE[lang]
  const slides = shots.map((file, i) =>
    `<img src="/shots/${lang}/${file}" alt="${esc(c.beeldAlt[i] ?? c.beeldTitel)}" width="430" height="932"` +
    (i === 0 ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">'
  ).join('\n')

  return `<div class="collage">
      <button class="arrow prev" type="button" aria-label="${esc(c.vorige)}" hidden>&#8249;</button>
      <div class="track" tabindex="0" role="group" aria-label="${esc(c.beeldTitel)}">
        ${slides}
      </div>
      <button class="arrow next" type="button" aria-label="${esc(c.volgende)}" hidden>&#8250;</button>
      <p class="tel">${esc(c.beeldBody(shots.length))}</p>
    </div>`
}

const homePage = (lang, media) => {
  const c = SITE[lang]
  const t = STRINGS[lang]
  const p = PATHS[lang]

  const body = join([
    `<section class="hero">
  <div class="wrap">
    <div>
      ${LIVE ? '' : `<p class="badge"><span class="stip" aria-hidden="true"></span>${esc(c.binnenkortBadge)}</p>`}
      <span class="kicker">${esc(c.heroKicker)}</span>
      <h1>${esc(c.heroTitel1)}<span class="accent">${esc(c.heroAccent)}</span>${esc(c.heroTitel2)}</h1>
      <p class="lead">${esc(c.heroLead)}</p>
      ${downloadBlock(lang)}
      <p class="proof">${esc(c.heroBewijs)}</p>
    </div>
    ${media.shots.length ? shotGallery(lang, media.shots) : ''}
  </div>
</section>`,

    `<section class="band">
  <div class="wrap">
    <ul>${c.slogans.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
  </div>
</section>`,

    media.film ? `<section class="tint">
  <div class="wrap">
    <h2>${esc(c.videoTitel)}</h2>
    <p class="subtitle">${esc(c.videoBody)}</p>
    <video class="film" controls preload="none" playsinline poster="/film/${lang}/poster.webp" width="1280" height="720">
      <source src="/film/${lang}/intro.mp4" type="video/mp4">
      ${esc(c.videoGeen)}
    </video>
  </div>
</section>` : '',

    `<section id="waarom">
  <div class="wrap">
    <h2>${esc(t.landing.waaromTitel)}</h2>
    <div class="cards">
      ${t.landing.waarom.map(([emoji, titel, body]) => `<div class="card">
        <span class="emoji" aria-hidden="true">${esc(emoji)}</span>
        <h3>${esc(titel)}</h3>
        <p>${esc(body)}</p>
      </div>`).join('\n')}
    </div>
  </div>
</section>`,

    `<section id="stem" class="tint">
  <div class="wrap voice">
    <div>
      <h2>${esc(c.stemTitel)}</h2>
      <p class="lead">${esc(c.stemBody)}</p>
    </div>
    <div class="counts">
      ${c.stemPunten.map(([getal, wat]) => `<div class="count"><b>${esc(getal)}</b><span>${esc(wat)}</span></div>`).join('\n')}
    </div>
  </div>
</section>`,

    `<section id="pad">
  <div class="wrap">
    <h2>${esc(t.landing.padTitel)}</h2>
    <p class="subtitle">${esc(t.landing.padUitleg(UNITS.length))}</p>
    ${unitList(lang)}
  </div>
</section>`,

    `<section>
  <div class="wrap">
    <h2>${esc(t.landing.oudersTitel)}</h2>
    <div class="cards">
      ${t.landing.oudersPunten.map(([emoji, titel, body]) => `<div class="card">
        <span class="emoji" aria-hidden="true">${esc(emoji)}</span>
        <h3>${esc(titel)}</h3>
        <p>${esc(body)}</p>
      </div>`).join('\n')}
    </div>
    <p style="margin-top:1.5rem"><a class="mailbtn" href="${p.parents}">${esc(c.oudersLees)}</a></p>
  </div>
</section>`,

    `<section class="tint">
  <div class="wrap">
    <div class="quote">
      <p class="big ar">${esc(t.landing.citaat)}</p>
      <p>${esc(t.landing.citaatBody)}</p>
    </div>
  </div>
</section>`,

    `<section id="vragen">
  <div class="wrap" style="max-width:52rem">
    <h2>${esc(t.landing.vragenTitel)}</h2>
    ${t.landing.faq.map(([vraag, antwoord]) => `<details class="q">
      <summary>${esc(vraag)}</summary>
      <p>${esc(antwoord)}</p>
    </details>`).join('\n')}
  </div>
</section>`,

    `<section class="tint" id="download">
  <div class="wrap">
    <h2>${esc(c.downloadTitel)}</h2>
    <p class="subtitle">${esc(c.downloadBody)}</p>
    ${downloadBlock(lang)}
  </div>
</section>`,

    `<section id="contact">
  <div class="wrap two">
    <div>
      <h2>${esc(c.contactTitel)}</h2>
      <p class="subtitle">${esc(c.contactBody)}</p>
      <a class="mailbtn" href="${mailto}">${esc(c.mailKnop)}</a>
    </div>
    ${traderTable(lang)}
  </div>
</section>`,
  ])

  return layout({
    lang, page: 'home',
    body: `${body}
<div class="sticky">
  <span>${esc(c.heroKicker)}</span>
  <a href="#download">${esc(LIVE ? c.stickyKnop : c.houMeOpDeHoogte)}</a>
</div>`,
    title: c.metaTitle,
    description: c.metaDescription,
  })
}

/* -------------------------------------------------------------- handelaar */

/**
 * Who sells the app — the public half of it.
 *
 * The app shows more than this page does: the Digital Services Act makes a
 * trader's address and phone number visible to a buyer, and Apple and Google
 * both publish them on the listing where the buying actually happens. The
 * website sells nothing. It is a shop window on the open internet, where a
 * home address and a mobile number are an invitation to everybody with a
 * scraper, so it carries the name, the e-mail and the register numbers and
 * leaves the rest to the stores and to src/ui/Operator.tsx.
 */
function traderTable(lang) {
  if (!traderKnown()) return ''
  const t = STRINGS[lang]
  const rows = [
    [t.operator.naam, esc(OPERATOR.name)],
    [t.operator.email, `<a href="${mailto}">${esc(OPERATOR.email)}</a>`],
    [t.operator.kvk, esc(OPERATOR.registration)],
    ...(OPERATOR.vat ? [[t.operator.btw, esc(OPERATOR.vat)]] : []),
  ]
  return `<div>
      <h2>${esc(t.operator.titel)}</h2>
      <table class="trader">
        ${rows.map(([label, value]) => `<tr><th scope="row">${esc(label)}</th><td>${value}</td></tr>`).join('\n')}
      </table>
    </div>`
}

/* ----------------------------------------------------------- tekstpagina's */

const docPage = (lang, page, text, extra = '') => {
  const c = SITE[lang]
  const body = `<div class="wrap doc">
  <h1>${esc(text.title)}</h1>
  <p class="updated">${esc(text.updated)}</p>
  <p class="intro">${esc(text.intro)}</p>
  ${text.sections.map((section) => `<h2>${esc(section.title)}</h2>${paragraphs(section.body)}`).join('\n')}
  ${text.contact ? `<p>${esc(text.contact)} <a href="${mailto}"><b>${esc(OPERATOR.email)}</b></a> — ${esc(OPERATOR.name)}, ${esc(OPERATOR.country)}</p>` : ''}
  ${extra}
  <div class="two" style="margin-top:2.5rem">${traderTable(lang)}</div>
  <p style="margin-top:2rem"><a class="mailbtn" href="${PATHS[lang].home}">${esc(c.terugNaarHome)}</a></p>
</div>`

  return layout({
    lang, page,
    body,
    title: `${text.title} — Darijaforkids`,
    description: text.intro.slice(0, 180),
  })
}

/**
 * De naam van je kind in Arabisch schrift.
 *
 * De enige pagina met JavaScript, en met opzet: de naam moet in de browser
 * blijven. Er gaat niets naar een server, er wordt niets opgeslagen en er is
 * niets in te loggen -- dezelfde afspraak als in de app, ook hier.
 *
 * De lijst is met de hand nagekeken (`src/site/namen.ts`). Automatisch
 * omzetten van Latijn naar Arabisch gaat juist mis bij Mohamed, Aicha en
 * Chaimae, en de naam van iemands kind verkeerd spellen is erger dan hem
 * niet hebben.
 */
const naamPage = (lang) => {
  const c = SITE[lang]
  const body = `<div class="wrap doc naam">
  <h1>${esc(c.naamTitel)}</h1>
  <p class="intro">${esc(c.naamLead)}</p>

  <form id="naamform" autocomplete="off">
    <label for="naamveld">${esc(c.naamLabel)}</label>
    <div class="naamrij">
      <input id="naamveld" name="naam" type="text" maxlength="24" placeholder="${esc(c.naamPlaceholder)}" spellcheck="false">
      <button type="submit">${esc(c.naamKnop)}</button>
    </div>
  </form>

  <p id="naamfout" class="soon" hidden>${esc(c.naamOnbekend)}
    <a id="naamvraag" href="${mailto}?subject=${encodeURIComponent('Naam: ')}">${esc(c.naamAanvragen)}</a>
  </p>

  <div id="naamuit" hidden>
    <canvas id="naamdoek" width="1080" height="1350" role="img"></canvas>
    <a id="naamdownload" class="mailbtn" download="darijaforkids.png">${esc(c.naamOpslaan)}</a>
  </div>

  <p class="klein">${esc(c.naamUitleg)}</p>
</div>

<script>
var NAMEN = ${JSON.stringify(NAMEN)};
var WOORD = ${JSON.stringify({ merk: 'darijaforkids.eu' })};
function schoon(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}
function hoofd(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() }
function teken(doek, latijn, arabisch) {
  var x = doek.getContext('2d')
  var B = doek.width, H = doek.height
  var lucht = x.createLinearGradient(0, 0, B, H)
  lucht.addColorStop(0, '#1b2340'); lucht.addColorStop(0.55, '#131b30'); lucht.addColorStop(1, '#0b1020')
  x.fillStyle = lucht; x.fillRect(0, 0, B, H)

  // De achtpuntige khatam, flauw, als behang.
  x.fillStyle = 'rgba(255,255,255,.05)'
  for (var gy = 0; gy < H + 200; gy += 200) {
    for (var gx = 0; gx < B + 200; gx += 200) {
      x.beginPath()
      for (var i = 0; i < 16; i++) {
        var a = (Math.PI / 8) * i - Math.PI / 8
        var r = (i % 2 === 0) ? 52 : 22
        var px = gx + Math.cos(a) * r, py = gy + Math.sin(a) * r
        if (i === 0) x.moveTo(px, py); else x.lineTo(px, py)
      }
      x.closePath(); x.fill()
    }
  }

  x.textAlign = 'center'
  x.fillStyle = '#fffaf3'
  var groot = arabisch.length > 10 ? 150 : arabisch.length > 6 ? 200 : 260
  x.font = '700 ' + groot + 'px "Noto Naskh Arabic", serif'
  // Niet op rtl zetten: met textAlign center schuift de tekst dan uit het
  // midden. De letters worden hoe dan ook goed aan elkaar geschreven -- dat
  // doet het lettertype, niet de richting.
  x.fillText(arabisch, B / 2, H / 2 + 40)

  x.fillStyle = '#f59e0b'
  x.font = '800 92px "Baloo 2", system-ui, sans-serif'
  x.fillText(latijn, B / 2, H / 2 + 190)

  x.fillStyle = 'rgba(255,250,243,.6)'
  x.font = '800 40px "Baloo 2", system-ui, sans-serif'
  x.fillText(WOORD.merk, B / 2, H - 110)

  // De vlag, klein, boven de naam.
  var fx = B / 2 - 45, fy = 150
  x.fillStyle = '#c1272d'; x.fillRect(fx, fy, 90, 60)
  x.strokeStyle = '#006233'; x.lineWidth = 5.5; x.lineJoin = 'round'; x.lineCap = 'round'
  var cx = fx + 45, cy = fy + 30, R = 22
  x.beginPath()
  for (var k = 0; k <= 5; k++) {
    var ang = -Math.PI / 2 + (k * 4 * Math.PI) / 5
    var qx = cx + Math.cos(ang) * R, qy = cy + Math.sin(ang) * R
    if (k === 0) x.moveTo(qx, qy); else x.lineTo(qx, qy)
  }
  x.closePath(); x.stroke()
}
document.getElementById('naamform').addEventListener('submit', function (e) {
  e.preventDefault()
  var ruw = document.getElementById('naamveld').value.trim()
  var ar = NAMEN[schoon(ruw)]
  var fout = document.getElementById('naamfout')
  var uit = document.getElementById('naamuit')
  if (!ar) {
    uit.hidden = true
    fout.hidden = false
    document.getElementById('naamvraag').href = ${JSON.stringify(mailto)} + '?subject=' + encodeURIComponent('Naam: ' + ruw)
    return
  }
  fout.hidden = true
  var doek = document.getElementById('naamdoek')
  var klaar = document.fonts ? document.fonts.load('700 200px "Noto Naskh Arabic"').then(function () {
    return document.fonts.load('800 92px "Baloo 2"')
  }) : Promise.resolve()
  klaar.then(function () {
    teken(doek, hoofd(ruw), ar)
    uit.hidden = false
    doek.setAttribute('aria-label', hoofd(ruw) + ' — ' + ar)
    document.getElementById('naamdownload').href = doek.toDataURL('image/png')
    document.getElementById('naamdownload').download = schoon(ruw) + '-darijaforkids.png'
  })
})
</script>`

  return layout({
    lang, page: 'name',
    body,
    title: `${c.naamTitel} — Darijaforkids`,
    description: c.naamLead,
  })
}

/**
 * De geschiedenis van Marokko, veertien keer kort.
 *
 * Dezelfde veertien kaarten die de app na elke toets uitdeelt, op één
 * bladzijde en voor iedereen te lezen. Dat is met opzet weggegeven: wie
 * zoekt op "geschiedenis van Marokko voor kinderen" vindt vrijwel niets
 * fatsoenlijks, en dit is precies de ouder die de app zoekt zonder het te
 * weten.
 */
const historyPage = (lang) => {
  const c = SITE[lang]
  const kaarten = HISTORY.map((kaart) => historyOf(kaart, lang))

  const body = `<div class="wrap doc">
  <h1>${esc(c.gesTitel)}</h1>
  <p class="intro">${esc(c.gesLead)}</p>

  <ol class="tijdlijn">
    ${kaarten.map((k) => `<li>
      <div class="jaar">${esc(k.jaar)}</div>
      <div class="kaart">
        <h2>${esc(k.titel)}</h2>
        <p>${esc(k.body)}</p>
        <p class="wist"><b>${esc(c.gesWist)}</b> ${esc(k.wist)}</p>
      </div>
    </li>`).join('\n')}
  </ol>

  <p class="soon">${esc(c.gesSlot)}</p>
  ${downloadBlock(lang)}
</div>`

  return layout({
    lang, page: 'history', body,
    title: `${c.gesTitel} — Darijaforkids`,
    description: c.gesLead,
  })
}

const parentsPage = (lang) => {
  const c = SITE[lang]
  const t = STRINGS[lang]
  const p = t.parents

  const body = `<div class="wrap doc">
  <h1>${esc(p.titel)}</h1>
  <p class="intro">${esc(p.uitleg)}</p>

  <h2>${esc(p.hoeGeleerd)}</h2>
  <div class="cards">
    ${p.methode.map((m) => `<div class="card">
      <span class="emoji" aria-hidden="true">${esc(m.emoji)}</span>
      <h3>${esc(m.titel)}</h3>
      <p>${esc(m.body)}</p>
    </div>`).join('\n')}
  </div>

  <h2>${esc(p.privacyTitel)}</h2>
  <ul>${p.privacy.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
  <p>${esc(p.privacyInstellingen)}</p>

  <h2>${esc(p.thuisTitel)}</h2>
  <ul>${p.thuis.map(([kop, body]) => `<li><b>${esc(kop)}</b> ${esc(body)}</li>`).join('')}</ul>

  <h2>${esc(p.klasTitel)}</h2>
  <p>${esc(p.klas(304, UNITS.length))}</p>

  <h2>${esc(p.eerlijkTitel)}</h2>
  <p>${esc(p.eerlijk)}</p>

  <h2>${esc(c.downloadTitel)}</h2>
  <p>${esc(c.downloadBody)}</p>
  ${downloadBlock(lang)}

  <div class="two" style="margin-top:2.5rem">${traderTable(lang)}</div>
  <p style="margin-top:2rem"><a class="mailbtn" href="${PATHS[lang].home}">${esc(c.terugNaarHome)}</a></p>
</div>`

  return layout({
    lang, page: 'parents', body,
    title: `${p.titel} — Darijaforkids`,
    description: p.uitleg,
  })
}

const notFoundPage = () => layout({
  lang: 'nl', page: 'home',
  title: '404 — Darijaforkids',
  description: SITE.nl.metaDescription,
  body: `<div class="wrap doc">
  <h1>404</h1>
  <p class="intro">Deze pagina bestaat niet (meer).</p>
  <p><a class="mailbtn" href="/">${esc(SITE.nl.terugNaarHome)}</a></p>
</div>`,
})

/* -------------------------------------------------------------- schrijven */

/**
 * Wat er ontbreekt, verzameld in plaats van meteen geroepen.
 *
 * Een etalage zonder schermen en zonder film is geen etalage, maar hij bouwt
 * wel: dat is precies hoe zo'n site een keer de lucht in ging met lege vakken
 * waar de telefoons hadden moeten staan. Vandaar dat dit script er aan het
 * eind op stukloopt in plaats van een waarschuwing te laten langsscrollen.
 */
const missing = []

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

/** Everything in public/ that the website needs; the app's own files stay put. */
for (const entry of ['icons', 'fonts', 'og.png']) {
  await cp(path.join(ROOT, 'public', entry), path.join(OUT, entry), { recursive: true })
}
await cp(path.join(ROOT, 'src', 'site', 'site.css'), path.join(OUT, 'site.css'))

const assets = path.join(ROOT, 'site-assets')
for (const entry of ['shots', 'film']) {
  await cp(path.join(assets, entry), path.join(OUT, entry), { recursive: true }).catch(() => {
    missing.push(`site-assets/${entry}`)
  })
}

const write = async (urlPath, html) => {
  const file = urlPath === '/'
    ? path.join(OUT, 'index.html')
    : path.join(OUT, urlPath.replace(/^\//, ''), 'index.html')
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, html)
}

let pages = 0
for (const { code: lang } of LANGS) {
  const shots = (await readdir(path.join(assets, 'shots', lang)).catch(() => [])).sort()
  const film = (await readdir(path.join(assets, 'film', lang)).catch(() => [])).includes('intro.mp4')

  await write(PATHS[lang].home, homePage(lang, { shots, film }))
  await write(PATHS[lang].privacy, docPage(lang, 'privacy', PRIVACY[lang]))
  await write(PATHS[lang].terms, docPage(lang, 'terms', TERMS[lang]))
  await write(PATHS[lang].parents, parentsPage(lang))
  await write(PATHS[lang].name, naamPage(lang))
  await write(PATHS[lang].history, historyPage(lang))
  pages += 6
  if (!shots.length) missing.push(`de schermen voor ${lang}`)
  if (!film) missing.push(`de film voor ${lang}`)
}

await writeFile(path.join(OUT, '404.html'), notFoundPage())

/**
 * The old service worker, replaced by one that takes itself out.
 *
 * A browser that visited this domain when the app lived here checks /sw.js
 * again on its next visit. It gets this, which empties the caches and
 * unregisters — and only then does that visitor see the website.
 */
await writeFile(path.join(OUT, 'sw.js'), `// Deze site heeft geen service worker meer.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key)
    await self.registration.unregister()
    for (const client of await self.clients.matchAll({ type: 'window' })) client.navigate(client.url)
  })())
})
`)

const urls = LANGS.flatMap(({ code }) =>
  ['home', 'privacy', 'terms', 'parents', 'name', 'history'].map((page) => SITE_URL + PATHS[code][page]))

await writeFile(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>
`)

await writeFile(path.join(OUT, 'robots.txt'), `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`)

if (missing.length) {
  console.error(`\nDit ontbreekt:\n  ${[...new Set(missing)].join('\n  ')}\n`)
  console.error('site-assets/ hoort in de repo te staan. Draai `npm run siteassets` en commit wat eruit komt.')
  process.exit(1)
}

console.log(`${pages} pagina's in ${LANGS.length} talen → ${path.relative(ROOT, OUT)}/`)

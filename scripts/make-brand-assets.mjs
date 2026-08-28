/**
 * Draws the images a link needs when somebody shares it: the Open Graph card
 * that appears on LinkedIn, WhatsApp and Facebook, plus the icons a browser
 * and a phone home screen ask for.
 *
 * They are rendered with the same font and the same palette the site uses, in
 * a headless browser, and written into apps/web/public/ where the build copies
 * them. That is deliberately a script and not a build step: the images change
 * when the wording changes, which is rare, and nobody should need Chromium
 * installed to build the website.
 *
 * Run with: node scripts/make-brand-assets.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const WEB = path.join(ROOT, 'apps/web');
const OUT = path.join(WEB, 'public');

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const font = await readFile(path.join(WEB, 'public/fonts/inter-latin.woff2'));
const fontUri = `data:font/woff2;base64,${font.toString('base64')}`;

const MARK =
  'm14 6 4 4M3 21l7-7M12.5 4.5 19 11l2-2-6.5-6.5-2 2ZM10.5 9.5 5 15l4 4 5.5-5.5';

const PALETTE = {
  green900: '#06342B',
  green700: '#0B5546',
  green600: '#0F6F5C',
  green100: '#DCEFEA',
  saffron: '#E2A33C',
  white: '#FFFFFF',
};

/**
 * One card. The headline is the promise, the line under it is the proof, and
 * the strip at the bottom carries the domain — which is the part that survives
 * being scaled down to a WhatsApp thumbnail.
 */
function card({ eyebrow, title, subtitle, footnote }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face {
    font-family: "Inter";
    font-style: normal;
    font-weight: 100 900;
    src: url("${fontUri}") format("woff2");
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px;
    height: 630px;
    font-family: "Inter", system-ui, sans-serif;
    color: ${PALETTE.white};
    background:
      radial-gradient(900px 520px at 88% -12%, ${PALETTE.green600} 0%, transparent 62%),
      linear-gradient(155deg, ${PALETTE.green900} 0%, ${PALETTE.green700} 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 68px 76px 60px;
    position: relative;
    overflow: hidden;
  }
  /* A single quiet mark rather than a pattern: it reads at thumbnail size and
     does not fight the words, which are the only thing that has to survive. */
  .ghost {
    position: absolute;
    right: -70px;
    bottom: -110px;
    opacity: 0.07;
    color: ${PALETTE.white};
  }
  .brand { display: flex; align-items: center; gap: 18px; }
  .brand__mark {
    width: 62px; height: 62px;
    border-radius: 18px;
    background: ${PALETTE.white};
    color: ${PALETTE.green700};
    display: grid; place-items: center;
  }
  .brand__name { font-size: 38px; font-weight: 800; letter-spacing: -0.02em; }
  .eyebrow {
    display: inline-flex;
    align-self: flex-start;
    padding: 9px 20px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.16);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.01em;
    margin-bottom: 24px;
  }
  h1 {
    font-size: 68px;
    line-height: 1.06;
    font-weight: 800;
    letter-spacing: -0.03em;
    max-width: 15ch;
    text-wrap: balance;
  }
  p {
    font-size: 27px;
    line-height: 1.42;
    color: ${PALETTE.green100};
    max-width: 30ch;
    margin-top: 22px;
  }
  .foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 23px;
    color: ${PALETTE.green100};
    border-top: 1px solid rgba(255, 255, 255, 0.18);
    padding-top: 26px;
  }
  .foot strong { color: ${PALETTE.white}; font-weight: 700; }
  .dot { color: ${PALETTE.saffron}; }
</style></head>
<body>
  <svg class="ghost" width="460" height="460" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="${MARK}"/></svg>

  <div class="brand">
    <span class="brand__mark">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${MARK}"/></svg>
    </span>
    <span class="brand__name">Buurklus</span>
  </div>

  <div>
    <span class="eyebrow">${eyebrow}</span>
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>

  <div class="foot">
    <span><strong>buurklus.nl</strong></span>
    <span>${footnote}</span>
  </div>
</body></html>`;
}

/** The square mark, for a browser tab and a home screen. */
function icon(size) {
  const radius = Math.round(size * 0.22);
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${size}px; height: ${size}px; }
  .tile {
    width: ${size}px; height: ${size}px;
    border-radius: ${radius}px;
    background: linear-gradient(150deg, ${PALETTE.green600} 0%, ${PALETTE.green900} 100%);
    color: ${PALETTE.white};
    display: grid; place-items: center;
  }
</style></head>
<body><div class="tile">
  <svg width="${Math.round(size * 0.56)}" height="${Math.round(size * 0.56)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${MARK}"/></svg>
</div></body></html>`;
}

const CARDS = {
  'og-nl-home': {
    eyebrow: 'Gratis voor particulieren',
    title: 'Vind een vakman bij je in de buurt',
    subtitle:
      'Beschrijf je klus één keer en ontvang tot 6 offertes van bedrijven met een gecontroleerd KvK-nummer.',
    footnote: 'Nu gratis · Zonder betaalgegevens',
  },
  'og-nl-pro': {
    eyebrow: 'Voor vakmensen en bedrijven',
    title: 'Vul je agenda zonder achter werk aan te bellen',
    subtitle:
      'Klussen uit jouw vakgebied en jouw gemeente. Geen commissie over je omzet.',
    footnote: 'Nu gratis · 20 offertes per maand',
  },
  'og-nl-join': {
    eyebrow: 'Meld je aan',
    title: 'Buurklus opent bij jou in de buurt',
    subtitle:
      'Laat weten wie je bent en waar je zit, dan krijg je bericht zodra we opengaan.',
    footnote: 'Gratis · Geen betaalgegevens',
  },
  'og-en-home': {
    eyebrow: 'Free for households',
    title: 'Find a trusted tradesperson near you',
    subtitle:
      'Describe your job once and receive up to 6 quotes from businesses with a verified registration.',
    footnote: 'Free right now · No payment details',
  },
  'og-en-pro': {
    eyebrow: 'For tradespeople and companies',
    title: 'Fill your diary without chasing work',
    subtitle: 'Jobs in your trade and your municipality. No commission on your turnover.',
    footnote: 'Free right now · 20 quotes a month',
  },
  'og-en-join': {
    eyebrow: 'Join us',
    title: 'Buurklus is opening near you',
    subtitle: 'Tell us who you are and where you are, and we will let you know when we open.',
    footnote: 'Free · No payment details',
  },
};

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

await mkdir(path.join(OUT, 'og'), { recursive: true });
await mkdir(path.join(OUT, 'icons'), { recursive: true });

const written = [];

async function shoot(html, { width, height }, file) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot({ type: 'png', omitBackground: false });
  await writeFile(file, buffer);
  written.push({ file: path.relative(OUT, file), bytes: buffer.length });
  await context.close();
}

for (const [name, copy] of Object.entries(CARDS)) {
  await shoot(card(copy), { width: 1200, height: 630 }, path.join(OUT, 'og', `${name}.png`));
}

for (const size of [180, 192, 512]) {
  await shoot(icon(size), { width: size, height: size }, path.join(OUT, 'icons', `icon-${size}.png`));
}

// The SVG favicon is written rather than screenshotted: a browser tab wants
// something that stays sharp at 16px, and a scaled-down PNG does not.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${PALETTE.green600}"/>
  <path d="${MARK}" transform="translate(8 8) scale(2)" fill="none" stroke="${PALETTE.white}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
await writeFile(path.join(OUT, 'favicon.svg'), favicon, 'utf8');
written.push({ file: 'favicon.svg', bytes: Buffer.byteLength(favicon) });

for (const item of written) {
  console.log(`  ${item.file.padEnd(28)} ${(item.bytes / 1024).toFixed(0)} kB`);
}
console.log(`\n${written.length} files -> apps/web/public`);

await browser.close();

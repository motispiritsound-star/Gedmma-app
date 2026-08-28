// Bouwt van de web-export één zelfstandig HTML-bestand: alle JavaScript en
// plaatjes zitten erin, zodat je het bestand gewoon kunt openen of ergens
// kunt neerzetten zonder server.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(wortel, 'dist');
const uit = join(wortel, 'demo', 'slimvos-demo.html');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('Geen export gevonden. Draai eerst:\n  npx expo export --platform web --output-dir dist');
  process.exit(1);
}

function alleBestanden(map) {
  const uit = [];
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) uit.push(...alleBestanden(pad));
    else uit.push(pad);
  }
  return uit;
}


const SCHIL_MARKUP = `<div class="werkblad">
      <div class="toestel"><div id="root"></div></div>
      <p class="onderschrift">Slimvos &mdash; klik erop zoals je op een telefoon zou tikken. Je voortgang blijft in deze browser bewaard.</p>
    </div>`;

const SCHIL_STIJL = `<style id="slimvos-schil">
      :root {
        --werkblad: #EDE7DA;
        --werkblad-tekst: #6B6152;
        --rand: #D8CFBD;
        --schaduw: rgba(63, 54, 38, 0.22);
        --scherm: #FFFDF7;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-theme="light"]) {
          --werkblad: #1C1915;
          --werkblad-tekst: #A79E8D;
          --rand: #35302A;
          --schaduw: rgba(0, 0, 0, 0.6);
        }
      }
      :root[data-theme="dark"] {
        --werkblad: #1C1915;
        --werkblad-tekst: #A79E8D;
        --rand: #35302A;
        --schaduw: rgba(0, 0, 0, 0.6);
      }
      body {
        background: var(--werkblad);
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .werkblad {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 24px 16px;
        box-sizing: border-box;
      }
      .toestel {
        width: min(420px, 100%);
        height: min(880px, 100%);
        background: var(--scherm);
        border: 1px solid var(--rand);
        border-radius: 28px;
        overflow: hidden;
        box-shadow: 0 18px 48px var(--schaduw);
        display: flex;
      }
      .toestel #root { flex: 1; height: 100%; }
      .onderschrift {
        margin: 0;
        max-width: 46ch;
        text-align: center;
        font-size: 13px;
        line-height: 1.5;
        color: var(--werkblad-tekst);
      }
      /* Op een telefoon is een nagebootste telefoon onzin: dan schermvullend. */
      @media (max-width: 520px), (max-height: 560px) {
        .werkblad { padding: 0; gap: 0; }
        .toestel { width: 100%; height: 100%; border: 0; border-radius: 0; box-shadow: none; }
        .onderschrift { display: none; }
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    </style>`;

const mimes = { '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff', '.woff2': 'font/woff2' };

let html = readFileSync(join(dist, 'index.html'), 'utf8');

// 1. JavaScript inline zetten.
const scriptMatch = html.match(/<script src="([^"]+)"[^>]*><\/script>/);
if (!scriptMatch) throw new Error('Geen script-tag gevonden in index.html');
let js = readFileSync(join(dist, scriptMatch[1].replace(/^\//, '')), 'utf8');

// 2. Alle plaatjes en fonts als data-URI in de bundel zetten.
let vervangen = 0;
const assetMap = join(dist, 'assets');
if (existsSync(assetMap)) {
  for (const pad of alleBestanden(assetMap)) {
    const ext = extname(pad).toLowerCase();
    const mime = mimes[ext];
    if (!mime) continue;
    const webPad = '/' + pad.slice(dist.length + 1).split('\\').join('/');
    if (!js.includes(webPad)) continue;
    const dataUri = `data:${mime};base64,${readFileSync(pad).toString('base64')}`;
    js = js.split(webPad).join(dataUri);
    vervangen++;
  }
}

// 3. Favicon inline.
const favicon = join(dist, 'favicon.ico');
if (existsSync(favicon)) {
  const uri = `data:image/x-icon;base64,${readFileSync(favicon).toString('base64')}`;
  html = html.replace(/<link rel="icon" href="[^"]*"\s*\/?>/, `<link rel="icon" href="${uri}"/>`);
}

// 4. Een toestelframe eromheen, zodat de app op een breed scherm niet
//    uitrekt maar eruitziet zoals hij op een telefoon staat.
html = html.replace('<div id="root"></div>', SCHIL_MARKUP).replace('</head>', `${SCHIL_STIJL}</head>`);

// Let op: een replacer-functie, geen string. In een vervangstring worden
// `$&`, `` $` `` en `$'` uitgevouwen, en die tekens komen volop voor in
// geminificeerde JavaScript — dat dupliceert de halve pagina.
html = html.replace(scriptMatch[0], () => `<script>\n${js}\n</script>`);
writeFileSync(uit, html);

const mb = (Buffer.byteLength(html) / 1048576).toFixed(2);
console.log(`Geschreven: demo/slimvos-demo.html (${mb} MB, ${vervangen} plaatjes ingesloten)`);

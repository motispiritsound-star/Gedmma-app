// Router en schil. De app is één pagina; het adres achter # bepaalt het scherm.

import { el, leeg, zet, avatarRing, meervoud } from './ui.js';
import { icoon } from './iconen.js';
import {
  actiefProfiel, alleProfielen, opAndering, telTijd, tikDagreeks, voortgang,
} from './opslag.js';
import { niveauVan, samenvatting, geefXp, XP } from './punten.js';

import * as start from './schermen/start.js';
import * as thuis from './schermen/thuis.js';
import * as letters from './schermen/letters.js';
import * as qaida from './schermen/qaida.js';
import * as koran from './schermen/koran.js';
import * as woorden from './schermen/woorden.js';
import * as voortgangScherm from './schermen/voortgang.js';
import * as ouders from './schermen/ouders.js';
import * as studio from './schermen/studio.js';
import * as over from './schermen/over.js';

import { ga, huidigPad } from './route.js';

const inhoud = document.getElementById('inhoud');
const kopbalk = document.getElementById('kopbalk');
const navigatie = document.getElementById('navigatie');

const ROUTES = [
  [/^\/start$/, () => start.toon(inhoud)],
  [/^\/thuis$/, () => thuis.toon(inhoud)],
  [/^\/letters$/, () => letters.toon(inhoud)],
  [/^\/letters\/([\w-]+)$/, (id) => letters.toonLetter(inhoud, id)],
  [/^\/qaida$/, () => qaida.toon(inhoud)],
  [/^\/qaida\/([\w-]+)$/, (id) => qaida.toonLes(inhoud, id)],
  [/^\/koran$/, () => koran.toon(inhoud)],
  [/^\/koran\/([\w-]+)$/, (id) => koran.toonSoera(inhoud, id)],
  [/^\/woorden$/, () => woorden.toon(inhoud)],
  [/^\/woorden\/([\w-]+)$/, (id) => woorden.toonThema(inhoud, id)],
  [/^\/voortgang$/, () => voortgangScherm.toon(inhoud)],
  [/^\/ouders$/, () => ouders.toon(inhoud)],
  [/^\/studio$/, () => studio.toon(inhoud)],
  [/^\/studio\/([\w-]+)$/, (id) => studio.toonGroep(inhoud, id)],
  [/^\/over$/, () => over.toon(inhoud)],
];

const NAV = [
  { pad: '/thuis', naam: 'Thuis', teken: 'thuis' },
  { pad: '/letters', naam: 'Letters', teken: 'ster8' },
  { pad: '/qaida', naam: 'Lezen', teken: 'boek' },
  { pad: '/koran', naam: 'Koran', teken: 'koran' },
  { pad: '/woorden', naam: 'Woorden', teken: 'praatwolk' },
];

function tekenKopbalk() {
  const p = actiefProfiel();
  leeg(kopbalk);
  if (!p) return kopbalk.classList.add('verborgen');
  kopbalk.classList.remove('verborgen');

  const v = voortgang();
  const n = niveauVan(v.xp);
  const s = samenvatting(v);

  kopbalk.append(
    el('button', {
      class: 'profielknop',
      'aria-label': `Wissel van profiel. Nu: ${p.naam}, niveau ${n.nr}`,
      opclick: () => ga('/start'),
    },
      avatarRing(p, n.deel, { niveauNr: n.nr }),
      el('span', { class: 'profieltekst' },
        el('span', { class: 'profielnaam', tekst: p.naam }),
        el('span', { class: 'niveaunaam', tekst: n.naam }))),

    el('a', {
      class: `vlam ${s.huidigeReeks > 0 ? 'aan' : ''}`.trim(),
      href: '#/voortgang',
      'aria-label': `${meervoud(s.huidigeReeks, 'dag', 'dagen')} op rij geoefend. Bekijk je sterren.`,
    }, icoon('vlam', { maat: 16 }), el('b', { tekst: String(s.huidigeReeks) })),

    el('button', { class: 'oudersknop icoonknop', 'aria-label': 'Voor ouders',
      opclick: () => ga('/ouders') }, icoon('instellingen', { maat: 21 })),
  );
}

function tekenNavigatie(huidig) {
  leeg(navigatie);
  if (!actiefProfiel()) return navigatie.classList.add('verborgen');
  navigatie.classList.remove('verborgen');
  for (const item of NAV) {
    navigatie.append(el('a', {
      href: `#${item.pad}`,
      class: `navknop ${huidig.startsWith(item.pad) ? 'actief' : ''}`.trim(),
      'aria-current': huidig.startsWith(item.pad) ? 'page' : null,
    }, icoon(item.teken, { maat: 23, klasse: 'nav-icoon' }), el('span', { tekst: item.naam })));
  }
}

function pasLeeftijdToe() {
  const p = actiefProfiel();
  document.body.classList.remove('leeftijd-klein', 'leeftijd-midden', 'leeftijd-groot');
  if (!p) return;
  document.body.classList.add(
    p.leeftijd <= 7 ? 'leeftijd-klein' : p.leeftijd <= 10 ? 'leeftijd-midden' : 'leeftijd-groot');
}

function router() {
  const pad = huidigPad();
  if (!actiefProfiel() && pad !== '/start') return ga('/start');
  if (!alleProfielen().length && pad !== '/start') return ga('/start');

  pasLeeftijdToe();
  tekenKopbalk();
  tekenNavigatie(pad);

  for (const [patroon, teken] of ROUTES) {
    const treffer = pad.match(patroon);
    if (!treffer) continue;
    try {
      teken(...treffer.slice(1));
    } catch (fout) {
      toonStoring(fout);
    }
    window.scrollTo(0, 0);
    return;
  }
  zet(inhoud, el('div', { class: 'kaart leeg' },
    el('h2', { tekst: 'Hier is niets' }),
    el('a', { class: 'knop', href: '#/thuis', tekst: 'Terug naar huis' })));
}

// Oefentijd bijhouden: alleen tellen als het scherm echt aan staat.
let laatsteTik = Date.now();
setInterval(() => {
  const nu = Date.now();
  const verstreken = Math.round((nu - laatsteTik) / 1000);
  laatsteTik = nu;
  if (document.visibilityState === 'visible' && actiefProfiel() && verstreken < 60) {
    telTijd(verstreken);
  }
}, 30000);
document.addEventListener('visibilitychange', () => { laatsteTik = Date.now(); });

/**
 * Wat er ook stukgaat: een kind hoort geen wit scherm te zien. Dit vangt alles
 * wat nergens anders is opgevangen en zet er iets neer waar je uit komt.
 * De voortgang staat in de opslag, dus opnieuw beginnen kost niets.
 */
function toonStoring(fout) {
  console.error('Noer liep vast:', fout);
  if (document.querySelector('.storing')) return;   // niet stapelen
  zet(inhoud, el('section', { class: 'kaart storing' },
    el('h2', { tekst: 'Er ging iets mis' }),
    el('p', { tekst: 'Sorry, hier liep iets vast. Je voortgang is bewaard — die ben je niet kwijt.' }),
    el('div', { class: 'knoprij' },
      el('button', { class: 'knop', tekst: 'Probeer opnieuw',
        opclick: () => { ga('/thuis'); router(); } }),
      el('button', { class: 'knop stil', tekst: 'Pagina verversen',
        opclick: () => window.location.reload() })),
    el('p', { class: 'klein foutregel', tekst: String(fout?.message || fout || '').slice(0, 200) })));
  kopbalk.classList.remove('verborgen');
}

window.addEventListener('error', (e) => toonStoring(e.error || e.message));
window.addEventListener('unhandledrejection', (e) => toonStoring(e.reason));

window.addEventListener('hashchange', router);
opAndering(() => { if (actiefProfiel()) tekenKopbalk(); });

if (actiefProfiel() && tikDagreeks()) geefXp(XP.nieuweDag);
router();

// #bundel-weg — een los HTML-bestand heeft geen service worker.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
// #bundel-eind

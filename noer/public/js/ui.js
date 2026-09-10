// Kleine DOM-hulpjes. Geen framework: de app is klein genoeg om het zonder te doen.

export function el(tag, props = {}, ...kinderen) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'tekst') node.textContent = v;
    else if (k === 'stijl') {
      // Eigen variabelen (--naam) moeten via setProperty; Object.assign slikt ze stil.
      for (const [eigenschap, waarde] of Object.entries(v)) {
        if (eigenschap.startsWith('--')) node.style.setProperty(eigenschap, waarde);
        else node.style[eigenschap] = waarde;
      }
    }
    else if (k.startsWith('op')) node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kind of kinderen.flat()) {
    if (kind === null || kind === undefined || kind === false) continue;
    node.append(kind instanceof Node ? kind : document.createTextNode(String(kind)));
  }
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Zelfde idee als el(), maar voor SVG — daar werkt createElement niet. */
export function svg(tag, props = {}, ...kinderen) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    node.setAttribute(k, v === true ? '' : String(v));
  }
  node.append(...kinderen.flat().filter(Boolean));
  return node;
}

/**
 * De avatar van een kind met een ring eromheen die laat zien hoe ver het is
 * naar het volgende niveau, en het niveaunummer als klein muntje.
 */
export function avatarRing(profiel, deel = 0, { groot = false, niveauNr = null } = {}) {
  const straal = 20;
  const omtrek = 2 * Math.PI * straal;
  return el('span', { class: `avatarring ${groot ? 'groot' : ''}`.trim() },
    svg('svg', { viewBox: '0 0 44 44', 'aria-hidden': 'true' },
      svg('circle', { class: 'spoor', cx: 22, cy: 22, r: straal, fill: 'none', 'stroke-width': 3 }),
      svg('circle', { class: 'voortgang', cx: 22, cy: 22, r: straal, fill: 'none', 'stroke-width': 3,
        'stroke-dasharray': `${(omtrek * Math.min(1, Math.max(0, deel))).toFixed(1)} ${omtrek.toFixed(1)}` })),
    el('span', { class: 'avatar', stijl: { background: profiel.kleur }, tekst: profiel.avatar }),
    niveauNr ? el('span', { class: 'niveaubadge', tekst: String(niveauNr) }) : null);
}

export const leeg = (node) => { while (node.firstChild) node.firstChild.remove(); return node; };

/**
 * Leegt een element en zet er nieuwe kinderen in. Anders dan het kale
 * node.append() slaat dit null en false over — dat scheelt een letterlijke
 * "null" in beeld bij een regel als `voorwaarde ? el(...) : null`.
 */
export function zet(node, ...kinderen) {
  leeg(node);
  for (const kind of kinderen.flat()) {
    if (kind === null || kind === undefined || kind === false) continue;
    node.append(kind instanceof Node ? kind : document.createTextNode(String(kind)));
  }
  return node;
}

export const husselen = (lijst) => {
  const kopie = [...lijst];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
};

/** "1 dag" / "3 dagen" — scheelt losse telfouten door de hele app heen. */
export const meervoud = (aantal, enkel, meer) => `${aantal} ${aantal === 1 ? enkel : meer}`;

export const kies = (lijst) => lijst[Math.floor(Math.random() * lijst.length)];

/** Rij sterren, gevuld tot `aantal`. */
export const sterren = (aantal, van = 3) =>
  el('span', { class: 'sterren', 'aria-label': `${aantal} van ${van} sterren` },
    ...Array.from({ length: van }, (_, i) =>
      el('span', { class: i < aantal ? 'ster vol' : 'ster', 'aria-hidden': 'true', tekst: '★' })));

/** Arabische tekst, altijd met de juiste leesrichting en het Koranlettertype. */
export const ar = (tekst, klasse = '') =>
  el('span', { class: `ar ${klasse}`.trim(), dir: 'rtl', lang: 'ar', tekst });

let toastTimer;
export function toast(bericht, soort = 'info') {
  let bak = document.getElementById('toast');
  if (!bak) {
    bak = el('div', { id: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(bak);
  }
  bak.className = `toast toast-${soort} zichtbaar`;
  bak.textContent = bericht;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => bak.classList.remove('zichtbaar'), 2600);
}

/** Feestje bij een goede afloop: gekleurde snippers die naar beneden vallen. */
export function confetti(aantal = 40) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bak = el('div', { class: 'confetti', 'aria-hidden': 'true' });
  const kleuren = ['#f6c453', '#5fb99a', '#7c9cf5', '#e0776a', '#c58bd8'];
  for (let i = 0; i < aantal; i++) {
    bak.append(el('i', { stijl: {
      left: `${Math.random() * 100}%`,
      background: kleuren[i % kleuren.length],
      animationDelay: `${Math.random() * 0.5}s`,
      animationDuration: `${1.6 + Math.random()}s`,
      transform: `rotate(${Math.random() * 360}deg)`,
    } }));
  }
  document.body.append(bak);
  setTimeout(() => bak.remove(), 3200);
}

/** Eenvoudig ja/nee-venster. */
export function bevestig(vraag, uitleg = '') {
  return new Promise((klaar) => {
    const sluit = (antwoord) => { laag.remove(); klaar(antwoord); };
    const laag = el('div', { class: 'overlay', opclick: (e) => { if (e.target === laag) sluit(false); } },
      el('div', { class: 'venster', role: 'dialog', 'aria-modal': 'true' },
        el('h2', { tekst: vraag }),
        uitleg && el('p', { tekst: uitleg }),
        el('div', { class: 'knoprij' },
          el('button', { class: 'knop stil', tekst: 'Nee, laat maar', opclick: () => sluit(false) }),
          el('button', { class: 'knop gevaar', tekst: 'Ja, doe maar', opclick: () => sluit(true) }))));
    document.body.append(laag);
  });
}

/** Voortgangsbalk van 0 tot 1. */
export const balk = (deel, label = '') =>
  el('div', { class: 'balk', role: 'progressbar', 'aria-valuenow': Math.round(deel * 100),
    'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label },
    el('i', { stijl: { width: `${Math.min(100, Math.max(0, deel * 100))}%` } }));

export const tijdKort = (seconden) => {
  const m = Math.round(seconden / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} u ${m % 60} min`;
};

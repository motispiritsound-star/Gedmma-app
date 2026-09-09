// Wat mag dit apparaat zien?
//
// De app werkt zonder server — offline, als los bestand, op een tablet in het
// vliegtuig. Daarom is dit geen poortwachter maar een stand die de app
// ophaalt als hij erbij kan, en anders onthoudt van de vorige keer.
//
// Eerlijk gezegd: een slot in de browser houdt niemand tegen die weet wat een
// ontwikkelaarsvenster is. Dat is bewust. De app hoort niet stuk te gaan
// zonder internet, en een kind hoort geen inlogscherm te zien. Wie het slot
// openbreekt, kan dat; wie ervoor betaalt, koopt geen bestand maar het geheel
// — de app, de opnames, de updates. Zie BETALEN.md.

const SLEUTEL = 'noer.toegang.v1';

// Wat er altijd bij hoort, ook zonder abonnement. De server zegt hetzelfde;
// dit is wat de app aanhoudt als hij er niet bij kan.
export const GRATIS = {
  lessen: ['losse-letters', 'verbonden-letters'],
  soeras: ['al-fatiha', 'an-nas', 'al-ikhlas'],
  themas: ['groeten'],
};

let stand = lees();

function lees() {
  try {
    const rauw = localStorage.getItem(SLEUTEL);
    if (!rauw) return { actief: false, gratis: GRATIS, opgehaald: null };
    const uit = JSON.parse(rauw);
    // Een bewaarde stand vervalt zodra de betaalde periode voorbij is; anders
    // blijft iemand die opzegt eeuwig binnen omdat hij offline blijft.
    if (uit.tot && Date.parse(uit.tot) < Date.now()) uit.actief = false;
    return { gratis: GRATIS, ...uit };
  } catch {
    return { actief: false, gratis: GRATIS, opgehaald: null };
  }
}

function bewaar(nieuw) {
  stand = { gratis: GRATIS, ...nieuw };
  try { localStorage.setItem(SLEUTEL, JSON.stringify(stand)); } catch { /* privévenster */ }
  for (const fn of luisteraars) fn(stand);
}

const luisteraars = new Set();
export const opToegang = (fn) => { luisteraars.add(fn); return () => luisteraars.delete(fn); };

/** De stand zoals de app hem nu kent. Nooit null, altijd meteen bruikbaar. */
export const toegang = () => stand;
export const magAlles = () => Boolean(stand.actief);

/**
 * Bij de server navragen. Lukt dat niet — geen netwerk, los bestand, geen
 * server — dan blijft staan wat er stond. Dat is met opzet: de app hoort in de
 * bus te werken.
 */
export async function verversToegang() {
  // Als los bestand is er geen server om iets aan te vragen. Dan niet naar
  // buiten reiken: dat levert alleen een foutmelding op in de console van
  // iemand die de app op een usb-stick heeft gekregen.
  if (!window.location.protocol.startsWith('http')) return stand;
  try {
    const antwoord = await fetch(nieuweUrl('/api/toegang'), {
      headers: { accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (!antwoord.ok) return stand;
    const uit = await antwoord.json();
    if (typeof uit?.actief !== 'boolean') return stand;
    bewaar({ ...uit, gratis: uit.gratis || GRATIS, opgehaald: new Date().toISOString() });
  } catch {
    // Offline of geen server: houden wat we hebben.
  }
  return stand;
}

/**
 * De app kan op /app/ staan, op /, of in een submap. De site staat één niveau
 * boven de app, op dezelfde host.
 *
 * Draait de app als los bestand, dan is er geen host en geen site. Dan geeft
 * dit het adres van de website terug, want daar moet de ouder toch heen — een
 * relatief pad wijst daar naar een map op de usb-stick.
 */
const WEBSITE = 'https://noer.nl';

function nieuweUrl(pad) {
  try {
    const hier = new URL('.', window.location.href);
    if (hier.protocol !== 'http:' && hier.protocol !== 'https:') {
      return new URL(pad.replace(/^\//, ''), `${WEBSITE}/`).href;
    }
    // /app/ -> /   |   / -> /   |   /noer/app/ -> /noer/
    const wortel = hier.pathname.replace(/app\/$/, '');
    return new URL(pad.replace(/^\//, ''), `${hier.origin}${wortel}`).href;
  } catch {
    return `${WEBSITE}/${pad.replace(/^\//, '')}`;
  }
}

export const siteUrl = (pagina) => nieuweUrl(`/${pagina}`);

// --- De vragen die de schermen stellen -----------------------------------

const gratisLijst = (soort) => stand.gratis?.[soort] || GRATIS[soort] || [];

export const magLes = (id) => magAlles() || gratisLijst('lessen').includes(id);
export const magSoera = (id) => magAlles() || gratisLijst('soeras').includes(id);
export const magThema = (id) => magAlles() || gratisLijst('themas').includes(id);

/** Het ouderscherm blijft open; alleen het overzicht en de studio zitten erin. */
export const magOuderdeel = () => magAlles();

/** Hoeveel er nog achter het slot zit — voor de tekst op het slotkaartje. */
export function watErNogIs({ lessen = 0, soeras = 0, themas = 0 }) {
  return {
    lessen: Math.max(0, lessen - gratisLijst('lessen').length),
    soeras: Math.max(0, soeras - gratisLijst('soeras').length),
    themas: Math.max(0, themas - gratisLijst('themas').length),
  };
}

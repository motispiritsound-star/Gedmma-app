// Eigen opnames, bewaard in IndexedDB op het apparaat zelf.
//
// Waarom niet in localStorage: dat is voor tekst en zit rond de 5 MB vast.
// Geluid gaat in blobs, en daar is IndexedDB voor gemaakt.
//
// Sleutels zijn stabiel en leesbaar, zodat een export dezelfde indeling
// oplevert als de map public/audio/:
//   letter:ba            -> audio/letters/ba
//   woord:kleuren:0      -> audio/woorden/kleuren/0
//   aya:114:1            -> audio/koran/114/1

const DB = 'noer-audio';
const WINKEL = 'opnames';

let verbinding = null;

function open() {
  if (verbinding) return verbinding;
  verbinding = new Promise((klaar, mis) => {
    if (!window.indexedDB) return mis(new Error('Dit apparaat heeft geen IndexedDB'));
    const verzoek = window.indexedDB.open(DB, 1);
    verzoek.onupgradeneeded = () => {
      verzoek.result.createObjectStore(WINKEL, { keyPath: 'sleutel' });
    };
    verzoek.onsuccess = () => klaar(verzoek.result);
    verzoek.onerror = () => mis(verzoek.error);
  }).catch((fout) => { verbinding = null; throw fout; });
  return verbinding;
}

function doe(modus, werk) {
  return open().then((db) => new Promise((klaar, mis) => {
    const t = db.transaction(WINKEL, modus);
    const verzoek = werk(t.objectStore(WINKEL));
    verzoek.onsuccess = () => klaar(verzoek.result);
    verzoek.onerror = () => mis(verzoek.error);
  }));
}

/** Sleutels opbouwen — één plek, zodat opnemen en afspelen niet uit elkaar lopen. */
export const sleutels = {
  letter: (id) => `letter:${id}`,
  woord: (thema, index) => `woord:${thema}:${index}`,
  aya: (soera, aya) => `aya:${soera}:${aya}`,
};

/** Waar deze opname terechtkomt als je hem exporteert. */
export function padVan(sleutel, extensie) {
  const [soort, ...rest] = sleutel.split(':');
  if (soort === 'letter') return `audio/letters/${rest[0]}.${extensie}`;
  if (soort === 'woord') return `audio/woorden/${rest[0]}/${rest[1]}.${extensie}`;
  if (soort === 'aya') return `audio/koran/${rest[0]}/${rest[1]}.${extensie}`;
  return `audio/overig/${rest.join('-')}.${extensie}`;
}

const urls = new Map();

export async function bewaarOpname(sleutel, blob) {
  await doe('readwrite', (winkel) =>
    winkel.put({ sleutel, blob, type: blob.type, gemaakt: new Date().toISOString() }));
  vergeetUrl(sleutel);
}

export async function haalOpname(sleutel) {
  try {
    return (await doe('readonly', (winkel) => winkel.get(sleutel))) || null;
  } catch {
    return null;
  }
}

/** Een blob-url die blijft bestaan tot de opname verandert of verdwijnt. */
export async function urlVan(sleutel) {
  if (urls.has(sleutel)) return urls.get(sleutel);
  const rij = await haalOpname(sleutel);
  if (!rij) return null;
  const url = URL.createObjectURL(rij.blob);
  urls.set(sleutel, url);
  return url;
}

function vergeetUrl(sleutel) {
  const url = urls.get(sleutel);
  if (url) { URL.revokeObjectURL(url); urls.delete(sleutel); }
}

export async function wisOpname(sleutel) {
  await doe('readwrite', (winkel) => winkel.delete(sleutel));
  vergeetUrl(sleutel);
}

export async function alleOpnames() {
  try {
    return (await doe('readonly', (winkel) => winkel.getAll())) || [];
  } catch {
    return [];
  }
}

/** Alleen de sleutels, als Set — genoeg om af te vinken wat er al is. */
export async function opgenomenSleutels() {
  try {
    return new Set((await doe('readonly', (winkel) => winkel.getAllKeys())) || []);
  } catch {
    return new Set();
  }
}

export async function wisAlleOpnames() {
  await doe('readwrite', (winkel) => winkel.clear());
  for (const sleutel of [...urls.keys()]) vergeetUrl(sleutel);
}

/** Hoeveel ruimte de opnames innemen, in bytes. */
export async function ruimteInGebruik() {
  return (await alleOpnames()).reduce((n, r) => n + (r.blob?.size || 0), 0);
}

export const EXTENSIES = {
  'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3', 'audio/wav': 'wav',
};

export const extensieVan = (type = '') =>
  EXTENSIES[type.split(';')[0].trim()] || 'webm';

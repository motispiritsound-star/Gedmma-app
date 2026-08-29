// Service worker: de app blijft werken zonder internet.
//
// Twee caches, met opzet gescheiden:
//   APP    is versiegebonden en wordt bij een nieuwe uitgave leeggegooid.
//   MEDIA  heeft een vaste naam en blijft staan. Daar zit gedownloade
//          recitatie in — soms tientallen megabytes die iemand met de hand
//          heeft opgehaald. Die weggooien bij elke uitgave zou wreed zijn.
//
// Bij elke uitgave het versienummer van APP ophogen.

const APP = 'noer-app-v4';
const MEDIA = 'noer-media';
const IS_MEDIA = (pad) => pad.includes('/audio/');

const KERN = [
  './', 'index.html', 'manifest.webmanifest', 'icoon.svg',
  'stijl/basis.css', 'stijl/leren.css',
  'js/app.js', 'js/ui.js', 'js/opslag.js', 'js/geluid.js', 'js/punten.js', 'js/iconen.js',
  'js/route.js', 'js/opnames.js', 'js/zip.js',
  'js/schermen/start.js', 'js/schermen/thuis.js', 'js/schermen/letters.js',
  'js/schermen/qaida.js', 'js/schermen/koran.js', 'js/schermen/woorden.js',
  'js/schermen/voortgang.js', 'js/schermen/ouders.js', 'js/schermen/studio.js',
  'js/spellen/basis.js', 'js/spellen/klankjacht.js', 'js/spellen/vormenpuzzel.js',
  'js/spellen/leesladder.js', 'js/spellen/koppelen.js', 'js/spellen/geheugen.js',
  'js/spellen/ayapuzzel.js',
  'data/letters.js', 'data/harakat.js', 'data/qaida.js', 'data/koran.js',
  'data/woorden.js', 'data/badges.js', 'data/bronnen.js', 'data/hulp.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(KERN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((namen) => Promise.all(
      namen.filter((n) => n !== APP && n !== MEDIA).map((n) => caches.delete(n)))) 
    .then(() => self.clients.claim()));
});

/** Bewaart een antwoord, maar alleen als het compleet is. */
async function bewaar(naam, verzoek, antwoord) {
  // 206 (Partial Content) mag niet in een cache; put() gooit daarop. Hosts die
  // Range-verzoeken honoreren geven dat bij audio standaard terug.
  if (antwoord.status !== 200 || antwoord.type === 'opaque') return;
  try {
    const c = await caches.open(naam);
    await c.put(verzoek, antwoord);
  } catch {
    // Cache vol of geweigerd: jammer, maar het afspelen gaat gewoon door.
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // De app kijkt met HEAD of een geluidsbestand bestaat. Zonder dit antwoordt
  // dat offline altijd "nee", ook als het bestand gewoon in de cache staat —
  // en dan blijft recitatie offline stil terwijl hij er wel is.
  if (e.request.method === 'HEAD') {
    e.respondWith(caches.match(e.request, { ignoreMethod: true })
      .then((gevonden) => gevonden
        ? new Response(null, { status: 200, headers: gevonden.headers })
        : fetch(e.request)));
    return;
  }

  if (e.request.method !== 'GET') return;

  const naam = IS_MEDIA(url.pathname) ? MEDIA : APP;

  e.respondWith(
    caches.match(e.request).then((gevonden) => {
      if (gevonden) return gevonden;
      return fetch(e.request).then((antwoord) => {
        bewaar(naam, e.request, antwoord.clone());
        return antwoord;
      }).catch(() => {
        // Offline en niet in de cache. Voor een pagina de app teruggeven, voor
        // een bestand eerlijk zeggen dat het er niet is.
        if (e.request.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    }),
  );
});

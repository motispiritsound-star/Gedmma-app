// Service worker: de app blijft werken zonder internet.
// Bij elke uitgave het versienummer ophogen, dan wordt de cache ververst.

const VERSIE = 'noer-v2';

const KERN = [
  './', 'index.html', 'manifest.webmanifest', 'icoon.svg',
  'stijl/basis.css', 'stijl/leren.css',
  'js/app.js', 'js/ui.js', 'js/opslag.js', 'js/geluid.js', 'js/punten.js', 'js/iconen.js',
  'js/schermen/start.js', 'js/schermen/thuis.js', 'js/schermen/letters.js',
  'js/schermen/qaida.js', 'js/schermen/koran.js', 'js/schermen/woorden.js',
  'js/schermen/voortgang.js', 'js/schermen/ouders.js',
  'js/spellen/basis.js', 'js/spellen/klankjacht.js', 'js/spellen/vormenpuzzel.js',
  'js/spellen/leesladder.js', 'js/spellen/koppelen.js', 'js/spellen/geheugen.js',
  'js/spellen/ayapuzzel.js',
  'data/letters.js', 'data/harakat.js', 'data/qaida.js', 'data/koran.js',
  'data/woorden.js', 'data/badges.js', 'data/bronnen.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIE).then((c) => c.addAll(KERN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((namen) => Promise.all(namen.filter((n) => n !== VERSIE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Audio wordt niet in de cache gezet: dat zijn de grootste bestanden en ze
  // zijn niet nodig om de app te laten werken.
  if (url.pathname.includes('/audio/')) return;

  e.respondWith(
    caches.match(e.request).then((gevonden) =>
      gevonden || fetch(e.request).then((antwoord) => {
        if (antwoord.ok) {
          const kopie = antwoord.clone();
          caches.open(VERSIE).then((c) => c.put(e.request, kopie));
        }
        return antwoord;
      }).catch(() => caches.match('index.html'))),
  );
});

/*
 * WonderBox service worker.
 *
 * Its whole job is to make a chapter survive a dead router. Three rules:
 *
 *   1. Narration audio (signed storage links) is cache-first and kept, because
 *      that is what a child is actually listening to.
 *   2. The chapter API is network-first with a cached fallback, so a device
 *      that goes offline mid-chapter still has the dialogue graph.
 *   3. Everything that touches money, addresses or progress is never cached.
 *      A stale order page would be worse than no order page.
 */
const SHELL_CACHE = 'wonderbox-shell-v1';
const AUDIO_CACHE = 'wonderbox-audio-v1';
const DATA_CACHE = 'wonderbox-data-v1';

const SHELL = ['/', '/play', '/manifest.webmanifest', '/icon.svg'];

const NEVER_CACHE = [
  '/api/companion/progress',
  '/api/checkout',
  '/api/webhooks',
  '/api/auth',
  '/api/privacy',
  '/account',
  '/ops',
  '/studio',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, AUDIO_CACHE, DATA_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => !keep.has(name)).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix))) return;

  if (url.pathname.startsWith('/api/storage') || url.pathname.startsWith('/api/audio')) {
    event.respondWith(cacheFirst(request, AUDIO_CACHE));
    return;
  }

  if (url.pathname.startsWith('/api/companion/chapter')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreSearch: false });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const hit = await cache.match(request);
    if (hit) return hit;
    throw error;
  }
}

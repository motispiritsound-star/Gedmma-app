/*
 * Questly service worker.
 *
 * Scope is deliberately narrow. It caches the application shell and the pages a
 * family has already opened, so an adventure stays readable when the signal
 * drops halfway up a hill. It never caches:
 *   - anything under /api (including private family media);
 *   - any non-GET request;
 *   - authenticated responses it did not already receive.
 *
 * Everything here is a progressive enhancement: with the worker removed, the
 * application behaves exactly the same online.
 */

const VERSION = 'questly-v1'
const SHELL_CACHE = `${VERSION}-shell`
const PAGE_CACHE = `${VERSION}-pages`

const SHELL_ASSETS = ['/offline', '/manifest.webmanifest', '/icons/icon-192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

function isCacheableRequest(request) {
  if (request.method !== 'GET') return false
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/')) return false
  return true
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (!isCacheableRequest(request)) return

  // Network first: a family should always see the current state when online,
  // and fall back to the last copy they saw when they cannot reach us.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined)
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        if (request.mode === 'navigate') {
          const offline = await caches.match('/offline')
          if (offline) return offline
        }
        return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      }),
  )
})

/*
 * Questly service worker.
 *
 * Scope is deliberately narrow. Quests are read once and then used away from
 * the screen, so the only thing worth caching is the shell plus quest pages the
 * family has already opened. Anything private - media, exports, API responses -
 * is never cached.
 */
const VERSION = "questly-v1";
const SHELL = ["/offline", "/manifest.webmanifest", "/icons/questly.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isCacheable(url) {
  if (url.pathname.startsWith("/api/")) return false;
  if (url.pathname.startsWith("/settings")) return false;
  if (url.pathname.startsWith("/admin")) return false;
  return url.pathname === "/" || url.pathname.startsWith("/quests") || url.pathname.startsWith("/adventure");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (isCacheable(url) && response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/offline"))),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});

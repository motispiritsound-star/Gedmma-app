'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker on the child-facing surfaces only. There is no
 * reason to install a worker for someone who is browsing the catalogue, and
 * fewer moving parts is the point.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // A failed registration only costs offline support, never playback.
    });
  }, []);
  return null;
}

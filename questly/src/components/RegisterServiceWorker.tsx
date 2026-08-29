'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker that keeps an active adventure readable when the
 * connection drops. Failure is silent by design: nothing in Questly depends on
 * the worker being installed.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline support is a progressive enhancement */
      })
    }
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
  }, [])

  return null
}

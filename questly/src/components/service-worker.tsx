"use client";

import { useEffect } from "react";

/** Registers the service worker. Failure is non-fatal: the app works without it. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    const handle = window.setTimeout(() => {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(handle);
  }, []);

  return null;
}

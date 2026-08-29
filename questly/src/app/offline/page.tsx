import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main id="main" className="q-container flex min-h-dvh flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">
        📴
      </p>
      <h1 className="text-3xl">Geen verbinding · No connection</h1>
      <p className="max-w-md text-[var(--color-ink-soft)]">
        Je bent offline. Een gestart avontuur blijft leesbaar op het apparaat waarop je het opende.
      </p>
      <p className="max-w-md text-[var(--color-ink-soft)]">
        You are offline. An adventure you already started stays readable on the device where you opened it.
      </p>
    </main>
  );
}

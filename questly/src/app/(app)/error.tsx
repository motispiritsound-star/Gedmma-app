"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surfaced in the browser console only; the server already logged the cause.
    console.error(error);
  }, [error]);

  return (
    <div className="q-container py-16">
      <div className="q-card mx-auto max-w-lg p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="mt-2 text-2xl">Er ging iets mis / Something went wrong</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Probeer het opnieuw. Blijft het misgaan, ga dan terug naar de startpagina.
        </p>
        <button type="button" onClick={reset} className="q-btn q-btn--primary mt-5">
          Opnieuw proberen / Try again
        </button>
      </div>
    </div>
  );
}

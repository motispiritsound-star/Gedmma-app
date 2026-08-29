'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

/**
 * Route-level error boundary. The message is deliberately generic: the details
 * belong in the server log, not on a family's screen.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('route.error', { digest: error.digest, message: error.message })
  }, [error])

  return (
    <main
      id="main"
      className="q-topo flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="q-prose text-ink-soft">
        Try again. If it keeps happening, sign out and back in.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/"
          className="rounded-full border border-line-strong px-6 py-3 font-semibold no-underline"
        >
          Back to home
        </Link>
      </div>
      {error.digest ? <p className="text-xs text-ink-muted">Reference: {error.digest}</p> : null}
    </main>
  )
}

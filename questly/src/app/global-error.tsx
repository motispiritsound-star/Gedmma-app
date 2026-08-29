'use client'

/** Last-resort boundary: replaces the whole document, so it ships its own html. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          background: '#fbf7f1',
          color: '#1b2a24',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#46564e' }}>Reload the page to continue.</p>
          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              borderRadius: '999px',
              border: 0,
              background: '#175a4a',
              color: 'white',
              padding: '0.75rem 1.5rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#667a70' }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  )
}

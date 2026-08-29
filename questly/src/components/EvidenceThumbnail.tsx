'use client'

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'

/**
 * Private family photograph. The `src` is a short-lived signed URL; the API
 * route behind it re-checks family ownership on every request, so an expired or
 * copied link is worthless.
 */
export function EvidenceThumbnail({ src, caption }: { src: string; caption: string | null }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span className="flex size-24 items-center justify-center rounded-xl bg-paper text-xs text-ink-muted">
        —
      </span>
    )
  }

  return (
    <figure className="m-0">
      <img
        src={src}
        alt={caption ?? ''}
        width={96}
        height={96}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="size-24 rounded-xl object-cover"
      />
      {caption ? <figcaption className="mt-1 max-w-24 text-xs text-ink-muted">{caption}</figcaption> : null}
    </figure>
  )
}

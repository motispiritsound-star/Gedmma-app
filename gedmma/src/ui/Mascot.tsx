/**
 * Fnek, the fennec fox who guides the app. Drawn as SVG so he scales to any
 * size, changes mood without loading anything, and costs nothing offline.
 */
export type Mood = 'blij' | 'denk' | 'juich' | 'oeps' | 'slaap'

export function Mascot({ mood = 'blij', size = 96, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const eyes =
    mood === 'slaap' ? (
      <>
        <path d="M40 52c3-3 8-3 11 0" stroke="#2b1d16" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M69 52c3-3 8-3 11 0" stroke="#2b1d16" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      </>
    ) : mood === 'juich' ? (
      <>
        <path d="M39 54c3-5 9-5 12 0" stroke="#2b1d16" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M69 54c3-5 9-5 12 0" stroke="#2b1d16" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="45.5" cy="53" r="5.4" fill="#2b1d16" />
        <circle cx="74.5" cy="53" r="5.4" fill="#2b1d16" />
        <circle cx="47.4" cy="51" r="1.9" fill="#fff" />
        <circle cx="76.4" cy="51" r="1.9" fill="#fff" />
      </>
    )

  const mouth =
    mood === 'oeps' ? (
      <ellipse cx="60" cy="72" rx="6" ry="7" fill="#2b1d16" opacity=".85" />
    ) : mood === 'denk' ? (
      <path d="M52 72h16" stroke="#2b1d16" strokeWidth="3" strokeLinecap="round" />
    ) : (
      <path d="M50 69c4 7 16 7 20 0" stroke="#2b1d16" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    )

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label={`Fnek, ${mood}`}>
      <defs>
        <linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7c873" />
          <stop offset="100%" stopColor="#e2984a" />
        </linearGradient>
      </defs>
      {/* ears — a fennec is mostly ears */}
      <path d="M30 44C22 22 26 8 34 10c8 2 14 16 16 28z" fill="url(#fur)" />
      <path d="M34 40c-5-14-3-22 0-21 4 1 8 11 9 20z" fill="#ffd8b1" />
      <path d="M90 44c8-22 4-36-4-34-8 2-14 16-16 28z" fill="url(#fur)" />
      <path d="M86 40c5-14 3-22 0-21-4 1-8 11-9 20z" fill="#ffd8b1" />
      {/* head */}
      <ellipse cx="60" cy="62" rx="34" ry="31" fill="url(#fur)" />
      <ellipse cx="60" cy="70" rx="23" ry="19" fill="#fff3e2" />
      {eyes}
      <ellipse cx="60" cy="63" rx="5" ry="3.8" fill="#2b1d16" />
      {mouth}
      {mood === 'juich' && (
        <g fill="#f59e0b">
          <path d="M14 26l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
          <path d="M104 34l2.4 5.6 5.6 2.4-5.6 2.4-2.4 5.6-2.4-5.6-5.6-2.4 5.6-2.4z" />
        </g>
      )}
      {mood === 'slaap' && <text x="92" y="34" fontSize="16" fill="#9aa3bb">z</text>}
    </svg>
  )
}

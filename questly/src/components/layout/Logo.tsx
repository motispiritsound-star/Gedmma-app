/** The Questly mark: a compass rose inside a rounded shield. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="9" fill="#175A4A" />
      <circle cx="16" cy="16" r="9" stroke="#A9D3C2" strokeWidth="1.6" />
      <path d="M20.5 11.5 18 18l-6.5 2.5L14 14z" fill="#F0A765" />
      <circle cx="16" cy="16" r="1.5" fill="#FBF7F1" />
    </svg>
  )
}

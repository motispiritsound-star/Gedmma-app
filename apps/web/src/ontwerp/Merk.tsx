/**
 * Het merk: het woordmerk van Mizen.
 *
 * De SVG staat hier inline en niet in een `<img>`, en dat is met opzet: alleen
 * inline erft hij `currentColor`, waardoor de letters meekleuren met het thema
 * waarin ze staan. De twee bogen houden altijd het merkgroen, zodat het merk in
 * de lichte en de donkere modus hetzelfde blijft.
 *
 * Het bestand in `public/merk/` is dezelfde tekening, voor plekken buiten de
 * webapp: het app-icoon, de factuur-PDF en de e-mails.
 */
export function Merk({ hoogte = 32, titel = 'Mizen' }: { hoogte?: number; titel?: string }) {
  return (
    <svg
      viewBox="0 0 300 134"
      height={hoogte}
      role="img"
      aria-label={titel}
      style={{ display: 'block', width: 'auto' }}
    >
      <g fill="none" stroke="var(--kleur-merk-limoen)" strokeWidth="9" strokeLinecap="round">
        <path d="M112 14 Q150 40 188 14" />
        <path d="M112 120 Q150 94 188 120" />
      </g>
      <text
        x="150"
        y="90"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="'Century Gothic', 'URW Gothic', 'Futura', 'Avenir Next', system-ui, sans-serif"
        fontSize="62"
        letterSpacing="1"
      >
        mizen
      </text>
    </svg>
  );
}

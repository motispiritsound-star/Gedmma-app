import { MERK } from './merk'

/**
 * Het merkteken van Dilimiz: een tijdelijke plaatshouder.
 *
 * Een İznik-tulp -- de vorm uit de Turkse keramiek, blauw op wit -- met de
 * eerste letter van de naam erin. Netjes, schaalbaar, leesbaar op 48 pixels,
 * en bedoeld om vervangen te worden zodra er een echt logo getekend is. Zie
 * docs/mvp-backlog.md #27.
 *
 * Geen vlag, geen halve maan, geen staatssymboliek. De reden staat in
 * docs/brand-brief.md §Waarom geen vlag, en het is geen esthetische: de
 * doelgroep is niet één groep, en een pictogram hoort geen standpunt te zijn
 * op een Duits schoolplein.
 *
 * Eigen tekening. Niets hiervan komt uit de app waar de techniek van komt --
 * geen zegel, geen tegelmotief, geen leeuw.
 */
export function Merkteken({ grootte = 40, titel }: { grootte?: number; titel?: string }) {
  const letter = MERK.naam.slice(0, 1)
  return (
    <svg
      width={grootte}
      height={grootte}
      viewBox="0 0 48 48"
      role="img"
      aria-label={titel ?? MERK.naam}
      focusable="false"
    >
      {titel ? <title>{titel}</title> : null}
      {/* De tulp: twee zijbladen en een punt in het midden. */}
      <path
        d="M24 4c3.4 4.2 5.2 8.1 5.2 12.3 0 2.3-.6 4.4-1.7 6.2 2.6-1.1 4.6-3.2 6-6.3 1.6 3.6 2.1 6.9 1.4 9.9-1.4 6.3-6.3 11-10.9 15.9-4.6-4.9-9.5-9.6-10.9-15.9-.7-3-.2-6.3 1.4-9.9 1.4 3.1 3.4 5.2 6 6.3a12.4 12.4 0 0 1-1.7-6.2C18.8 12.1 20.6 8.2 24 4Z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M24 4c3.4 4.2 5.2 8.1 5.2 12.3 0 2.3-.6 4.4-1.7 6.2 2.6-1.1 4.6-3.2 6-6.3 1.6 3.6 2.1 6.9 1.4 9.9-1.4 6.3-6.3 11-10.9 15.9-4.6-4.9-9.5-9.6-10.9-15.9-.7-3-.2-6.3 1.4-9.9 1.4 3.1 3.4 5.2 6 6.3a12.4 12.4 0 0 1-1.7-6.2C18.8 12.1 20.6 8.2 24 4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/*
        De letter staat er los in en wordt niet met text-transform gemaakt.
        Dat is geen detail: `text-transform: uppercase` maakt van een Turkse
        `i` een `I` en niet een `İ`. Zie engine/turks.ts.
      */}
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fill="currentColor"
        fontFamily="Nunito, system-ui, sans-serif"
      >
        {letter}
      </text>
    </svg>
  )
}

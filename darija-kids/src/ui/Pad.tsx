/**
 * De weg waar het leerpad op loopt.
 *
 * Het pad was een rij losse rondjes die om en om naar links en naar rechts
 * schoven. Dat was bedoeld als weg, maar er stond niets tússen de rondjes --
 * en wat je dan ziet is een lijst die scheef staat. Nagemeten op 390 pixels:
 * tussen twee schijven zat vijfenvijftig pixels waarin niets getekend werd,
 * met de titel van de vorige knoop erin. Nu is dat vierendertig pixels en
 * staat er weg in.
 *
 * Hier staat de weg zelf. Hij is opgebouwd uit twee soorten stukken, en ze
 * sluiten op elkaar aan omdat de maten vastliggen in plaats van uit de tekst
 * te volgen:
 *
 * - `GAT` is de afstand tussen de onderkant van de ene knoop en de bovenkant
 *   van de volgende. Vast, in pixels, niet in rem: bij een wortelletter van 24
 *   zou `pt-9` 54 pixels worden terwijl de schuine streep op 34 gerekend is,
 *   en dan hangt de weg los van de knoop.
 * - De titel staat naast de knoop en niet eronder. Dat is de reden dat dit
 *   werkt: een titel onder de knoop maakt de rijhoogte afhankelijk van hoe
 *   lang hij in het Duits is, en dan valt er geen weg te tekenen die
 *   aansluit. Naast de knoop staat hij absoluut, dus hij telt niet mee voor de
 *   hoogte en kan niet over de volgende knoop heen schuiven.
 *
 * Alles hier is `aria-hidden`: de weg is de vorm van het pad, de knopen dragen
 * de betekenis.
 */
import { Khatim } from './Khatim'

/** De afstand tussen twee knopen, waar de weg doorheen loopt. */
export const GAT = 34

/** De doorsnede van een knoop. Staat hier omdat de weg erop aansluit. */
export const KNOOP = 68

/**
 * Hoe ver een knoop opzij staat, per plek in de unit.
 *
 * Het was [0, 46, 68, 46, 0, -46, -68, -46]. Twee dingen klopten daar niet
 * meer zodra de titel naast de knoop kwam: bij een verspringing van nul ligt
 * de knoop in het midden en houdt de titel aan weerszijden 100 pixels over --
 * te weinig voor "Marokkanische Gerichte" op een scherm van 320. En 68 opzij
 * duwde diezelfde titel aan de andere kant tegen de rand.
 *
 * Deze reeks komt nooit op nul uit en nooit boven de 40. Nagemeten op 320
 * pixels (288 binnenwerk): de titel houdt 122 tot 140 pixels over. De langste
 * Duitse lestitel is "Fragen, die du wirklich brauchst" en vraagt 255 pixels
 * op één regel, dus die valt naar drie regels van twintig: zestig pixels, in
 * een rij van 34 + 68 = 102. Hij kan de knoop eronder dus niet raken, en dat
 * is precies waarom de titel absoluut staat en niet in de stroom.
 */
export const VERSPRING = [22, 40, 22, -22, -40, -22]

export const verspring = (i: number): number => VERSPRING[i % VERSPRING.length]!

/**
 * De kleur van de weg.
 *
 * Gelopen is zellige, dezelfde kleur als de voortgangsbalk op de kop van de
 * unit erboven -- het is hetzelfde feit, dus het hoort dezelfde kleur te zijn.
 *
 * Eén vaste tint lukte niet. Gemeten: `zellige-600` haalt 5,27 op 1 op het
 * papier (#fffaf3) en 3,41 op de nachtgrond (#0d1220). Die 3,41 haalt de norm
 * van drie voor iets wat geen tekst is, maar een donkerblauwgroene streep op
 * bijna-zwart is wel wat je nog net ziet en niet wat je volgt. `zellige-400`
 * haalt daar 10,03, en dat is een weg.
 *
 * Wat nog komt is `--line`: 1,30 op het papier en 1,45 in het donker, en dat
 * mag, want hij draagt geen informatie. Welke les open is zegt de knoop; deze
 * streep zegt alleen dat de weg doorloopt.
 */
const GELOPEN = 'bg-zellige-600 dark:bg-zellige-400'
const TEGOED = 'bg-[var(--line)]'

/**
 * Een stuk weg van de ene knoop naar de volgende.
 *
 * Een gedraaide balk en geen SVG, en dat is geen smaak maar rekenwerk: een SVG
 * die zich over een onbekende breedte moet uitrekken vervormt zijn eigen
 * lijndikte mee. Hier staan begin en eind allebei vast ten opzichte van het
 * midden, dus de hoek en de lengte zijn uit te rekenen en de balk houdt overal
 * dezelfde dikte.
 */
export function Weg({ van, naar, gelopen, hoogte = GAT }: {
  van: number
  naar: number
  gelopen: boolean
  hoogte?: number
}) {
  const dx = naar - van
  const lengte = Math.sqrt(dx * dx + hoogte * hoogte)
  // Rechtsom draaien laat het onderste eind naar rechts zwaaien, dus een
  // positieve dx hoort bij een positieve hoek.
  const hoek = (Math.atan2(dx, hoogte) * 180) / Math.PI
  return (
    <span
      aria-hidden="true"
      className={`absolute top-0 block w-2.5 origin-top rounded-full ${gelopen ? GELOPEN : TEGOED}`}
      style={{
        left: `calc(50% + ${van}px)`,
        marginLeft: -5,
        height: Math.round(lengte),
        transform: `rotate(${hoek.toFixed(2)}deg)`,
      }}
    />
  )
}

/**
 * De zellige-rozet, als watermerk.
 *
 * Twee vierkanten van 45 graden over elkaar: de eenvoudigste rozet die er is,
 * en dezelfde die `Medaillon` in Motief.tsx al tekent. Daar staat hij gevuld
 * achter een tekening; hier in lijn, want op de kop van een unit moet hij
 * ritme geven en geen plaatje zijn.
 */
export function Rozet({ size = 150, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="12" y="12" width="76" height="76" rx="10" />
        <rect x="12" y="12" width="76" height="76" rx="10" transform="rotate(45 50 50)" />
        <circle cx="50" cy="50" r="25" />
      </g>
    </svg>
  )
}

/**
 * Waar de weg begint.
 *
 * `Einde` beantwoordde "en dan?", maar niets beantwoordde "waar komt dit
 * vandaan". Nagemeten op 390 pixels bij een kind dat de eerste unit af heeft:
 * het eerste stuk weg op de bladzijde stond op 1 209 pixels, en dat was de
 * overgang tússen unit 1 en unit 2. Unit 1 stond er dus vóór het pad in plaats
 * van erop. Nu begint de weg op 1 025, vier-en-veertig pixels boven de eerste
 * unit, en staat elke unit op dezelfde weg.
 *
 * Geen merkteken erop, en dat is met opzet. De weg heeft er al twee die iets
 * zeggen: het dier van het kind zegt waar je bent, de khatim zegt waar het
 * ophoudt. Een derde schijfje aan het begin zou een halte beloven waar niets
 * te doen is. Wat er staat is het ronde eind van de weg zelf -- `Weg` is
 * `rounded-full`, dus hij begint hier, en verder niets.
 *
 * Kost vier-en-veertig pixels op een bladzijde van 4 715, en geen enkele
 * berekening: het is dezelfde balk als tussen twee knopen.
 *
 * `gelopen` moet erbij, en dat was eerst niet zo. Dit stuk stond hard op groen,
 * en groen is in dit pad de kleur van wat achter je ligt. Op dag één -- leeg
 * profiel, nog niets af -- was dit groene stompje boven unit 1 dan het enige
 * groen op de hele bladzijde: het eerste wat een nieuw kind ziet is een stuk
 * weg dat zegt dat het er al geweest is. Eén onwaar woord in een taal die
 * verder klopt, en dan klopt de taal niet meer.
 */
export function Begin({ gelopen }: { gelopen: boolean }) {
  return (
    <div className="relative" style={{ height: 44 }} aria-hidden="true">
      <Weg van={0} naar={0} gelopen={gelopen} hoogte={44} />
    </div>
  )
}

/**
 * Het stuk weg tussen twee units, met een tegel erop.
 *
 * Hier doet het motief werk: het zegt "hier houdt een hoofdstuk op" zonder er
 * een streep met een kopje van te maken. De tegel staat op de weg zoals een
 * zellige-ruit in een vloer ligt -- hij onderbreekt hem niet.
 */
export function Overgang({ gelopen, hoogte = 56 }: { gelopen: boolean; hoogte?: number }) {
  return (
    <div className="relative" style={{ height: hoogte }} aria-hidden="true">
      <Weg van={0} naar={0} gelopen={gelopen} hoogte={hoogte} />
      <span
        className={`absolute left-1/2 top-1/2 block h-5 w-5 rotate-45 rounded-[4px] border-[3px] bg-[var(--surface)] ${
          gelopen ? 'border-zellige-600 dark:border-zellige-400' : 'border-[var(--line)]'
        }`}
        style={{ marginLeft: -10, marginTop: -10 }}
      />
    </div>
  )
}

/**
 * Waar de weg ophoudt: de khatim op het rood van de vlag.
 *
 * Een pad dat nergens heen gaat is een lijst. Dit is het antwoord op "en dan?"
 * dat je ziet zonder te lezen, en het staat er al voordat je er bent.
 */
export function Einde({ gelopen }: { gelopen: boolean }) {
  return (
    <div className="relative h-24" aria-hidden="true">
      <Weg van={0} naar={0} gelopen={gelopen} hoogte={44} />
      {/*
        De schaduw via de variabele en niet via `btn3d`. Die klasse hoort bij
        iets dat je indrukt, en hier valt niets in te drukken -- maar de rand
        eronder is dezelfde, zodat deze schijf in dezelfde wereld staat als de
        knopen erboven.
      */}
      <span
        className={`absolute left-1/2 grid h-12 w-12 place-items-center rounded-full border-4 ${
          gelopen
            ? 'border-white/60 bg-gradient-to-br from-alam-500 to-alam-600 text-white'
            : 'border-[var(--line)] bg-[var(--surface-raised)] text-[var(--ink-soft)]'
        }`}
        style={{ marginLeft: -24, top: 44, boxShadow: 'var(--shadow-press)' }}
      >
        <Khatim size={24} />
      </span>
    </div>
  )
}

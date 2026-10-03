/**
 * De vijf tekens van de navigatie, getekend en niet als emoji.
 *
 * Hier stonden 🧭 🔁 📚 🎮 🦊, en dat is dezelfde fout die in de kopbalk al
 * rechtgezet was -- zie `Teken` in TopBar.tsx, waar hij met reden en al staat.
 * Elk toestel tekent zijn eigen emoji, dus deze balk was op elk toestel anders:
 * een oranje blokje naast een rode boekenstapel naast een grijze controller,
 * vijf plaatjes uit vijf tekenstijlen, onderaan elk scherm van de app. In de
 * donkere stand was het het ergst -- vijf volle kleuren op een bijna zwarte
 * balk, terwijl de tellers erboven netjes de inkt van de app volgen.
 *
 * Eén lijn, één dikte, één kleur, en ze volgen de inkt.
 *
 * De maat is 18 en niet de 15 van de kopbalk: daar staat een teken náást een
 * getal dat het uitlegt, hier staat het erbóven en moet het zelf het verschil
 * maken tussen twee tabbladen. De lijndikte is daarom ook meegerekend en niet
 * overgenomen: 15 met 2.2 op een viewBox van 24 is 1,375 css-pixel, en om
 * diezelfde lijn op 18 te houden is het 1.83. Met de 2.1 die er eerst stond
 * was deze rij 15 procent dikker dan de tellers erboven, en dan is het geen
 * stelsel maar twee handen.
 */
export const Teken = ({ children }: { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
    fill="none" stroke="currentColor" strokeWidth="1.83"
    strokeLinecap="round" strokeLinejoin="round" className="relative"
  >
    {children}
  </svg>
)

/** Leren: een kompas. Het pad is de weg, en dit is wat je op een weg bij je hebt. */
export const Kompas = () => (
  <Teken>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M15.6 8.4 13.5 13.5 8.4 15.6 10.5 10.5z" />
  </Teken>
)

/** Herhalen: twee bogen die in elkaar overgaan. */
export const Rond = () => (
  <Teken>
    <path d="M4.6 10.6a7.6 7.6 0 0 1 12.9-3.8l2.3 2.2" />
    <path d="M19.8 4.6v4.4h-4.4" />
    <path d="M19.4 13.4a7.6 7.6 0 0 1-12.9 3.8l-2.3-2.2" />
    <path d="M4.2 19.4V15h4.4" />
  </Teken>
)

/** Woorden: een opengeslagen boek. */
export const BoekTeken = () => (
  <Teken>
    <path d="M12 6.6v12.8" />
    <path d="M12 6.6C9.8 4.8 6.7 4.6 3.7 5.6v12c3-1 6.1-.8 8.3 1" />
    <path d="M12 6.6c2.2-1.8 5.3-2 8.3-1v12c-3-1-6.1-.8-8.3 1" />
  </Teken>
)

/** Spelen: een dobbelsteen. De ogen zijn gevuld, want een leeg rondje is geen oog. */
export const Steen = () => (
  <Teken>
    <rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4.2" />
    <circle cx="8.6" cy="8.6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15.4" cy="15.4" r="1.3" fill="currentColor" stroke="none" />
  </Teken>
)

/** Jij: een hoofd met schouders. */
export const Jij = () => (
  <Teken>
    <circle cx="12" cy="8.4" r="3.9" />
    <path d="M4.9 20.3a7.1 7.1 0 0 1 14.2 0" />
  </Teken>
)


/**
 * En ze staan hier en niet in `App.tsx`, want de tabbalk was niet de enige
 * plek met een emoji voor een bestemming. Op het pad stond "🎮 Spelen" op een
 * knop en aan het eind van een ronde "🔁 Herhalen" -- dezelfde twee
 * bestemmingen, in een andere tekenstijl dan de balk eronder. Dat was precies
 * het bezwaar waarmee deze verbouwing begon, dus die twee lezen nu uit
 * dezelfde hand.
 */

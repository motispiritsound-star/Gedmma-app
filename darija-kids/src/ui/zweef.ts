/**
 * Hoe iets boven het papier hangt. Eén schaduw voor de hele app.
 *
 * `Card` uit kit.tsx draagt `shadow-sm`: één laag grijs. Deze app staat niet op
 * wit maar op #fffaf3, en een grijze schaduw op een warm vlak leest koel -- je
 * ziet een lijn langs de rand in plaats van ruimte eronder. Dat is precies het
 * verschil tussen een kaart die erop geplakt zit en een die erboven hangt.
 *
 * Drie lagen in de kleur van het papier zelf, want dat is wat één lichtbron
 * doet: een contactrandje van één pixel dat zegt wáár de kaart het vlak raakt,
 * een korte kernschaduw eronder, en een brede zachte die de kaart laat zweven.
 * Weglaten van de eerste maakt hem zwevend zonder plek; weglaten van de derde
 * maakt hem plat.
 *
 * In de donkere stand werkt het omgekeerd: op #0d1220 valt er met nóg meer
 * zwart langs de rand niets te winnen, dus daar zijn de lagen dieper en
 * strakker. Dezelfde drie lagen, andere sterkte -- geen tweede systeem.
 *
 * En dáárom staat hij hier. Hij stond in `exercises.tsx`, en toen bouwden twee
 * ontwerpers er los van elkaar hun eigen versie naast: eentje met
 * `rgba(120,82,36)` op twee lagen voor het startscherm, eentje met
 * `rgba(94,62,27)` op twee lagen voor het leerpad. Drie warme schaduwen die net
 * verschillen, op drie schermen die een kind achter elkaar ziet. Niemand kan
 * dat aanwijzen en iedereen ziet het: dan hangt de app niet in één wereld.
 *
 * `rgba(84,56,24)` is het bruin dat er het langst staat en dat ook
 * `Round.tsx` gebruikt voor de rand van zijn onderbalk. Dat is de kleur, en er
 * is er één.
 *
 * De waarde zelf staat in `index.css` als `--schaduw-hoog`, met `--schaduw-laag`
 * ernaast voor iets dat lager hangt. Dat is nodig omdat een CSS-variabele ook
 * rechtstreeks in een `box-shadow` of in `--shadow-press` past, en een
 * Tailwind-klasse niet; de profielbladzijde doet allebei. Deze klasse en die
 * variabele zijn dus hetzelfde ding, met hetzelfde getal, op één plek
 * opgeschreven.
 *
 * De donkere stand zit in de variabele en niet in een `dark:`-variant: een
 * variabele die per stand iets anders betekent is precies waarvoor hij bestaat.
 *
 * `rgba()` met komma's en niet `rgb(84 56 24 / .05)`: die tweede schrijfwijze
 * kent een WebView van Android 7 niet, en de bouw mikt op es2015 juist voor dat
 * toestel. Een schaduw die daar stilletjes niets doet is precies het soort
 * verschil dat je op je eigen scherm nooit ziet.
 *
 * `.btn3d` en `--shadow-press` blijven waar ze zijn: die gaan over indrukken,
 * dit gaat over zweven. Een element dat allebei doet draagt ze allebei -- maar
 * let op: `.btn3d` staat in index.css buiten elke laag en wint van elke
 * `shadow-`-klasse, dus op zoiets doet deze niets.
 *
 * En let op bij `Card`: die draagt zelf `shadow-sm`, en Tailwind zet zijn eigen
 * trede ná een `shadow-[...]` in het stijlblad -- nagemeten in de bouw, een
 * paar honderd tekens verderop. Deze klasse op een `Card` plakken doet dus
 * niets. Zet hem op een omhulsel eromheen.
 */
export const ZWEEF = 'shadow-[var(--schaduw-hoog)]'

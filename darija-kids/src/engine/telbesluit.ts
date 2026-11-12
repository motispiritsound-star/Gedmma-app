/**
 * Of de app zijn trechter telt. Eén regel, en met opzet een eigen bestand.
 *
 * Twee plekken moeten dit weten en ze mogen niet uit de pas lopen:
 * `engine/tellen.ts`, dat de tellers verstuurt, en `i18n/privacy.ts`, dat aan
 * de lezer vertelt wat er gebeurt. Door ze allebei dit ene bestand te laten
 * lezen, kán de verklaring niet iets anders beloven dan de code doet — ook
 * niet de andere kant op, waarin de app zegt te meten terwijl hij dat niet
 * doet.
 *
 * Een eigen bestand en niet een regel in `tellen.ts`, omdat `privacy.ts`
 * anders de hele telmodule binnentrekt en daarmee `store.ts`, het curriculum
 * en de woordenlijst — in de website-bouw, voor één booleaan. Dit bestand
 * importeert niets, dus er is ook geen kans op een kringetje.
 *
 * ## Voordat je dit op `true` zet
 *
 * Dit is geen technische schakelaar. Hij verandert wat de app over zichzelf
 * verklaart, op vier plaatsen buiten deze repository:
 *
 * 1. **Apple App Privacy** staat gepubliceerd als *Data Not Collected*
 *    (`docs/LAUNCH.md`). Dat wordt *Usage Data → Product Interaction*, met
 *    *Linked to the user: nee* en *Used for tracking: nee*.
 * 2. **Google Data Safety** staat op "verzamelt geen gegevens"
 *    (`docs/PLAY.md`). Dat wordt *verzamelt: ja, deelt: nee*, type
 *    *App activity → App interactions*. Let op de vraag of het optioneel is:
 *    zolang de trechter altijd loopt is het eerlijke antwoord **vereist**, en
 *    dat is op een app onder het Families-beleid een zichtbaar label.
 * 3. **De vier antwoorden aan App Review** in `docs/APPLE-1.3.md`. Vraag 1
 *    (analytics van derden) blijft *nee* — er komt geen SDK bij — maar de
 *    tekst eronder zegt nu dat we niets tellen, en dat wordt onjuist.
 * 4. **Het veld `updated`** in `i18n/privacy.ts`, zes keer: de verklaring
 *    verandert, dus de datum hoort mee.
 *
 * Een onjuiste privacyverklaring is bij Apple een afwijzingsgrond op zichzelf,
 * en zwaarder dan deze meting ooit waard is. Dus eerst die vier, dan deze
 * regel.
 */
export const TELLEN = false

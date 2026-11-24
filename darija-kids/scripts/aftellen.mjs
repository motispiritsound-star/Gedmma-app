/**
 * Hoeveel weken zijn het nog tot de zomervakantie?
 *
 * De campagne van november 2026 draait op een aftelling: *leer je kind Darija
 * vóór de volgende zomervakantie.* Dat getal staat in de teksten als de
 * markering `[WEKEN]`, en niet als cijfer — met opzet.
 *
 * Een cijfer in een kant-en-klare tekst is een cijfer dat stil veroudert. Die
 * teksten zijn in zes talen geschreven, staan op vier kanalen, en worden over
 * een aantal weken geplaatst. Wie er "nog 32 weken" in zet, plaatst in januari
 * een bericht dat 32 zegt terwijl het er 24 zijn. Dus rekent dit script het
 * uit op de dag dat je plakt, en zoek je in de teksten op `[WEKEN]`.
 *
 *   npm run aftellen                       naar 1 juli van het eerstvolgende jaar
 *   npm run aftellen -- --tot 2027-07-10   naar een datum die je zelf kiest
 *
 * ## Welke datum
 *
 * Er is geen "de" zomervakantie, en dat is precies waarom dit script er een
 * vraagt in plaats van er een te verzinnen:
 *
 *   - **Frankrijk** — begin juli, in het hele land tegelijk.
 *   - **Nederland** — juli, maar per regio: noord, midden en zuid beginnen
 *     elk op een andere datum, ruim twee weken uit elkaar.
 *   - **Duitsland** — per Bundesland, van eind juni tot eind juli.
 *
 * De campagne loopt op Franse, Nederlandse en Duitse pagina's. Eén datum voor
 * alle drie bestaat niet, dus kies de vroegste van de landen waar je post:
 * dan klopt het getal overal, of het is er hooguit een paar te weinig. Een
 * aftelling die te vroeg afloopt is erger dan een die een week overhoudt.
 *
 * De terugval is 1 juli, en die staat er omdat een commando zonder argumenten
 * moet werken. Hij wordt altijd afgedrukt, zodat je ziet waar het getal
 * vandaan komt.
 */
const arg = (naam, terugval = null) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : terugval
}

const nu = new Date()
nu.setHours(0, 0, 0, 0)

const gegeven = arg('tot')

/**
 * De eerste juli die nog komt.
 *
 * `nu.getMonth()` is nul-gebaseerd, dus 6 is juli. Staan we in januari tot en
 * met juni, dan is het de eerste juli van dit jaar; daarna die van volgend
 * jaar. Zonder die wacht zou het script in augustus een datum teruggeven die
 * al voorbij is, en dan telt hij af naar gisteren.
 */
const eerstvolgendeJuli = () => {
  const jaar = nu.getMonth() < 6 ? nu.getFullYear() : nu.getFullYear() + 1
  return new Date(jaar, 6, 1)
}

let doel
if (gegeven) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(gegeven)) {
    console.error(`\nDe datum moet als jjjj-mm-dd: --tot 2027-07-10`)
    console.error(`Gekregen: ${gegeven}\n`)
    process.exit(1)
  }
  const [j, m, d] = gegeven.split('-').map(Number)
  doel = new Date(j, m - 1, d)
  if (Number.isNaN(doel.getTime()) || doel.getMonth() !== m - 1) {
    console.error(`\n${gegeven} bestaat niet als datum.\n`)
    process.exit(1)
  }
} else {
  doel = eerstvolgendeJuli()
}
doel.setHours(0, 0, 0, 0)

const dagen = Math.round((doel - nu) / 864e5)

if (dagen <= 0) {
  console.log(`\nDie datum is geweest (${dagen === 0 ? 'vandaag' : `${-dagen} dagen geleden`}).`)
  console.log('Kies een datum die nog komt: npm run aftellen -- --tot 2027-07-10\n')
  process.exit(1)
}

const weken = Math.floor(dagen / 7)
const maanden = Math.round(dagen / 30.44)
const datum = doel.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })

console.log(`\nTot ${datum}${gegeven ? '' : '  (terugval: de eerstvolgende 1 juli — kies zelf met --tot)'}`)
console.log(`\n  ${weken} weken`)
console.log(`  ${dagen} dagen`)
console.log(`  een maand of ${maanden}\n`)
console.log(`Zoek in store/lancering/ op [WEKEN] en vul ${weken} in.`)
/*
 * En de waarschuwing erbij, want dit is het soort getal dat je één keer
 * invult en daarna vergeet. De teksten staan in zes talen op vier kanalen;
 * wie ze over drie weken opnieuw plaatst, plaatst een verouderd getal.
 */
console.log(`Plaats je later opnieuw, draai dit dan opnieuw: het getal loopt mee.\n`)

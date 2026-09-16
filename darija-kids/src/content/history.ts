/**
 * Fourteen cards out of Morocco's own history.
 *
 * One of these arrives after every checkpoint, in place of the little film:
 * the reward for finishing a test is a piece of where the language comes
 * from. They run in order, from the Roman town in the hills to the alphabet
 * that became official in 2011, so a child who works through the course walks
 * through two thousand years on the way.
 *
 * Rules the text keeps to, because these are children and this is somebody's
 * country: only what is well established, nothing contested, no politics of
 * today, no flattery. Where a story is a story rather than a fact, it says so.
 *
 * Dutch is the source; the other five languages live in the content packs.
 */

/** The backdrop the fragment plays in front of. Six, reused across fourteen. */
export type Tafereel = 'heuvels' | 'zee' | 'stad' | 'binnenhof' | 'bergen' | 'woestijn'

export type Motief =
  | 'zuilen' | 'rots' | 'poort' | 'boek' | 'minaret' | 'khamsa' | 'kaart'
  | 'voetstappen' | 'veer' | 'fontein' | 'schip' | 'leeuw' | 'vlag' | 'steen'

export interface HistoryCard {
  /** Stable id: the learner's collection keys on it. */
  id: string
  /** Printed on the card as it stands — a year, a century, a span. */
  jaar: string
  /**
   * The year the card sorts on. `jaar` is for reading ("11e eeuw", "± 1070")
   * and cannot be parsed back into a number, so the order says so itself.
   */
  vanaf: number
  motief: Motief
  tafereel: Tafereel
  titel: string
  /** Two or three sentences. Read aloud in about fifteen seconds. */
  body: string
  /** The one line a child repeats at the dinner table. */
  wist: string
}

export const HISTORY: HistoryCard[] = [
  {
    id: 'walili',
    jaar: '± 200',
    vanaf: 200,
    motief: 'zuilen',
    tafereel: 'heuvels',
    titel: 'Walili, de stad van mozaïek',
    body: 'Bij Meknès liggen de resten van Volubilis — in het Arabisch Walili. Tweeduizend jaar geleden woonden hier duizenden mensen, met badhuizen, olijfpersen en straten van steen. De vloeren lagen vol mozaïek, en een deel ervan ligt er nog steeds.',
    wist: 'De olijfpersen van Walili werken volgens hetzelfde idee als de olijfpersen die in Marokko nu nog gebruikt worden.',
  },
  {
    id: 'tariq',
    jaar: '711',
    vanaf: 711,
    motief: 'rots',
    tafereel: 'zee',
    titel: 'Tariq ibn Ziyad',
    body: 'Tariq ibn Ziyad was een Amazigh-legerleider uit Noord-Afrika. In 711 stak hij met zijn leger de zeestraat over naar het zuiden van Spanje, bij de grote rots die daar uit zee omhoogkomt.',
    wist: 'Die rots heet nog altijd naar hem: Jabal Tariq, "de berg van Tariq" — verbasterd tot Gibraltar.',
  },
  {
    id: 'fes',
    jaar: '789 – 808',
    vanaf: 789,
    motief: 'poort',
    tafereel: 'stad',
    titel: 'Fes wordt een stad',
    body: 'Idris I stichtte rond 789 een klein dorp aan de rivier; zijn zoon Idris II maakte er een echte stad van. Families uit Kairouan en uit Córdoba kwamen er wonen, elk in hun eigen wijk.',
    wist: 'De oude binnenstad van Fes is een van de grootste gebieden ter wereld waar geen auto mag komen — alles gaat te voet of met een ezel.',
  },
  {
    id: 'fatima',
    jaar: '859',
    vanaf: 859,
    motief: 'boek',
    tafereel: 'binnenhof',
    titel: 'Fatima al-Fihri',
    body: 'Fatima al-Fihri erfde geld van haar vader en gaf het allemaal uit aan één ding: een moskee met een school eraan vast, de Qarawiyyin in Fes. Daar werd les gegeven in rekenen, geneeskunde, taal en sterrenkunde.',
    wist: 'UNESCO noemt de Qarawiyyin de oudste universiteit ter wereld die nooit gesloten is geweest — ruim elfhonderd jaar les, zonder pauze.',
  },
  {
    id: 'marrakech',
    jaar: '± 1070',
    vanaf: 1070,
    motief: 'minaret',
    tafereel: 'bergen',
    titel: 'Marrakech en de naam van het land',
    body: 'De Almoraviden bouwden Marrakech op in de vlakte onder de Atlas, en Yusuf ibn Tashfin maakte het zijn hoofdstad. Om de stad te laten leven groeven ze kilometers ondergrondse waterkanalen, khettara genoemd.',
    wist: 'De namen Maroc, Marruecos en Marokko komen allemaal van Marrakech: Europa noemde het hele land naar die ene stad.',
  },
  {
    id: 'zaynab',
    jaar: '11e eeuw',
    vanaf: 1080,
    motief: 'khamsa',
    tafereel: 'stad',
    titel: 'Zaynab an-Nafzawiyya',
    body: 'Zaynab was een Amazigh-vrouw uit een handelsfamilie, en ze trouwde met Yusuf ibn Tashfin. De kroniekschrijvers uit die tijd beschrijven haar als zijn raadgever: ze kende de handel, ze kende het geld en ze wist met wie je beter geen ruzie kon krijgen.',
    wist: 'In een tijd waarin over vrouwen bijna nooit iets werd opgeschreven, staat zij met naam en toenaam in de boeken.',
  },
  {
    id: 'idrisi',
    jaar: '1154',
    vanaf: 1154,
    motief: 'kaart',
    tafereel: 'zee',
    titel: 'Al-Idrisi tekent de wereld',
    body: 'Al-Idrisi werd geboren in Ceuta en reisde als jongen al door Noord-Afrika en Spanje. Aan het hof van koning Roger op Sicilië maakte hij een wereldkaart uit alles wat zeelieden en reizigers hem hadden verteld.',
    wist: 'Op zijn kaart ligt het zuiden bovenaan. Dat er een "goede" kant boven zou zijn, is gewoon een afspraak — en die afspraak is later omgedraaid.',
  },
  {
    id: 'battuta',
    jaar: '1325 – 1354',
    vanaf: 1325,
    motief: 'voetstappen',
    tafereel: 'woestijn',
    titel: 'Ibn Battuta',
    body: 'Ibn Battuta vertrok op zijn eenentwintigste uit Tanger, in zijn eentje, en kwam pas na bijna dertig jaar terug. Hij zag Mali, Egypte, Perzië, India en China, en liet zijn verhaal daarna opschrijven.',
    wist: 'Hij legde ongeveer 120.000 kilometer af — drie keer de aarde rond, te voet, te paard en per boot.',
  },
  {
    id: 'wazzan',
    jaar: '± 1520',
    vanaf: 1520,
    motief: 'veer',
    tafereel: 'zee',
    titel: 'Hassan al-Wazzan',
    body: 'Hassan al-Wazzan groeide op in Fes en reisde als diplomaat door Afrika. Onderweg werd hij door piraten gevangengenomen en in Italië beland, waar hij een boek schreef over alles wat hij gezien had.',
    wist: 'Europa las driehonderd jaar lang vooral zijn boek als het iets over Afrika wilde weten — geschreven door een jongen uit Fes.',
  },
  {
    id: 'mansour',
    jaar: '1578 – 1603',
    vanaf: 1578,
    motief: 'fontein',
    tafereel: 'binnenhof',
    titel: 'Het Badi-paleis',
    body: 'Sultan Ahmed al-Mansour liet in Marrakech het Badi-paleis bouwen, met binnenhoven, waterbekkens en marmer uit Italië. Badi betekent "het wonderbaarlijke", en zo werd het ook bedoeld.',
    wist: 'Er wordt verteld dat het marmer betaald werd met Marokkaanse suiker, kilo voor kilo — suiker was toen kostbaarder dan steen.',
  },
  {
    id: 'amerika',
    jaar: '1777',
    vanaf: 1777,
    motief: 'schip',
    tafereel: 'zee',
    titel: 'Het eerste land dat ja zei',
    body: 'De Verenigde Staten waren net een nieuw land en bijna niemand wilde er iets mee te maken hebben. Sultan Sidi Mohammed ben Abdallah zette als eerste zijn havens open voor Amerikaanse schepen.',
    wist: 'Het vriendschapsverdrag dat daarna werd getekend, loopt nog steeds — het oudste verdrag dat de Verenigde Staten nooit hebben verbroken.',
  },
  {
    id: 'leeuw',
    jaar: '19e eeuw',
    vanaf: 1850,
    motief: 'leeuw',
    tafereel: 'bergen',
    titel: 'De leeuw van de Atlas',
    body: 'In de bergen van de Atlas leefde een leeuw met een donkere, zware manen. Hij was groter dan de meeste leeuwen en hij leefde als enige leeuwensoort niet op de savanne maar in de bergen.',
    wist: 'In het wild is hij verdwenen, maar nakomelingen leven nog in de dierentuin van Rabat — en het nationale elftal heet naar hem: de Atlasleeuwen.',
  },
  {
    id: 'istiqlal',
    jaar: '1956',
    vanaf: 1956,
    motief: 'vlag',
    tafereel: 'stad',
    titel: 'Onafhankelijk',
    body: 'Vanaf 1912 stond Marokko onder Frans en Spaans bestuur. Na jaren van verzet, stakingen en onderhandelen werd het land in 1956 weer onafhankelijk, met Mohammed V als koning.',
    wist: 'De ster in de vlag wordt met één doorlopende lijn getekend die zichzelf vijf keer kruist — hij heet de khatim, het zegel.',
  },
  {
    id: 'tifinagh',
    jaar: '2011',
    vanaf: 2011,
    motief: 'steen',
    tafereel: 'woestijn',
    titel: 'Tamazight, zwart op wit',
    body: 'Het Amazigh — Tamazight — wordt in Noord-Afrika al duizenden jaren gesproken en heeft een eigen alfabet: Tifinagh. In 2011 werd het in de grondwet een officiële taal van Marokko, naast het Arabisch.',
    wist: 'De letter die je overal in Marokko ziet staan heet yaz. Amazigh betekent "vrij mens".',
  },
]

export const historyById = (id: string): HistoryCard | undefined => HISTORY.find((c) => c.id === id)

/**
 * Which card a learner has earned at their n-th checkpoint.
 *
 * There are more checkpoints than cards, so the last stretch of the course
 * hands out cards that were already seen. That is deliberate: a card read a
 * second time is worth more than a blank screen, and the collection page says
 * plainly how many of the fourteen are in.
 */
export const cardForCheckpoint = (n: number): HistoryCard => HISTORY[n % HISTORY.length]!

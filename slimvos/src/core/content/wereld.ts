import type { Vraag } from '../types';
import { kies, kiesUniek, type Rng } from '../rng';
import { keuzeVraag } from './helpers';

type Gen = (niveau: number, rng: Rng) => Vraag;

/** [provincie, hoofdstad] */
const PROVINCIES: Array<[string, string]> = [
  ['Groningen', 'Groningen'],
  ['Friesland', 'Leeuwarden'],
  ['Drenthe', 'Assen'],
  ['Overijssel', 'Zwolle'],
  ['Flevoland', 'Lelystad'],
  ['Gelderland', 'Arnhem'],
  ['Utrecht', 'Utrecht'],
  ['Noord-Holland', 'Haarlem'],
  ['Zuid-Holland', 'Den Haag'],
  ['Zeeland', 'Middelburg'],
  ['Noord-Brabant', "'s-Hertogenbosch"],
  ['Limburg', 'Maastricht'],
];

/** [land, hoofdstad] */
const EUROPA: Array<[string, string]> = [
  ['België', 'Brussel'], ['Duitsland', 'Berlijn'], ['Frankrijk', 'Parijs'],
  ['Spanje', 'Madrid'], ['Italië', 'Rome'], ['Portugal', 'Lissabon'],
  ['Oostenrijk', 'Wenen'], ['Zwitserland', 'Bern'], ['Polen', 'Warschau'],
  ['Tsjechië', 'Praag'], ['Denemarken', 'Kopenhagen'], ['Zweden', 'Stockholm'],
  ['Noorwegen', 'Oslo'], ['Finland', 'Helsinki'], ['Griekenland', 'Athene'],
  ['Ierland', 'Dublin'], ['Hongarije', 'Boedapest'], ['Roemenië', 'Boekarest'],
];

/** [vraag, antwoord] over ligging, rivieren en gebergten */
const AARDRIJKSKUNDE: Array<[string, string]> = [
  ['Welke rivier stroomt door Rotterdam?', 'de Nieuwe Maas'],
  ['Welke zee ligt ten noorden van Nederland?', 'de Noordzee'],
  ['Hoe heet het grootste meer van Nederland?', 'het IJsselmeer'],
  ['Welk gebergte scheidt Frankrijk en Spanje?', 'de Pyreneeën'],
  ['Wat is de langste rivier van Europa?', 'de Wolga'],
  ['Welke zee ligt tussen Italië en Griekenland?', 'de Middellandse Zee'],
];

export const topografie: Gen = (niveau, rng) => {
  const id = 'wereld.topografie';
  if (niveau <= 2) {
    const [provincie, hoofdstad] = kies(rng, PROVINCIES);
    const vraagNaarHoofdstad = niveau === 2 || rng() < 0.5;
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: vraagNaarHoofdstad
        ? `Wat is de hoofdstad van de provincie ${provincie}?`
        : `Van welke provincie is ${hoofdstad} de hoofdstad?`,
      antwoord: vraagNaarHoofdstad ? hoofdstad : provincie,
      afleiders: kiesUniek(rng, PROVINCIES.filter((p) => p[0] !== provincie), 3).map((p) =>
        vraagNaarHoofdstad ? p[1] : p[0],
      ),
      uitleg: `${hoofdstad} is de hoofdstad van ${provincie}.`,
    });
  }
  if (niveau <= 4) {
    const [land, hoofdstad] = kies(rng, EUROPA);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Wat is de hoofdstad van ${land}?`,
      antwoord: hoofdstad,
      afleiders: kiesUniek(rng, EUROPA.filter((l) => l[0] !== land), 3).map((l) => l[1]),
      uitleg: `De hoofdstad van ${land} is ${hoofdstad}.`,
    });
  }
  const [vraag, antwoord] = kies(rng, AARDRIJKSKUNDE);
  return keuzeVraag(rng, {
    onderwerpId: id,
    niveau,
    stam: vraag,
    antwoord,
    afleiders: kiesUniek(rng, AARDRIJKSKUNDE.filter((a) => a[1] !== antwoord), 3).map((a) => a[1]),
    uitleg: `${vraag} ${antwoord.charAt(0).toUpperCase()}${antwoord.slice(1)}.`,
  });
};

/** [vraag, antwoord, afleiders, uitleg] */
const GESCHIEDENIS: Record<number, Array<[string, string, string[], string]>> = {
  1: [
    ['Wie bouwden de hunebedden?', 'boeren uit de steentijd', ['de Romeinen', 'de Vikingen', 'ridders'], 'Hunebedden zijn zo’n 5000 jaar oud en gebouwd door boeren uit het stenen tijdperk.'],
    ['Waar woonden ridders in?', 'een kasteel', ['een hunebed', 'een grachtenpand', 'een villa'], 'Ridders woonden in kastelen, vaak met een gracht eromheen.'],
    ['Wat gebruikten de Romeinen om water te vervoeren?', 'aquaducten', ['windmolens', 'sluizen', 'stoommachines'], 'Aquaducten waren lange waterleidingen op bogen.'],
  ],
  2: [
    ['In welke eeuw begon de Tachtigjarige Oorlog?', 'de 16e eeuw', ['de 14e eeuw', 'de 18e eeuw', 'de 19e eeuw'], 'De opstand begon in 1568, dus in de 16e eeuw.'],
    ['Hoe heette het schip waarmee de VOC voer?', 'een fluitschip', ['een drakenschip', 'een galei', 'een stoomboot'], 'De VOC gebruikte onder andere fluitschepen en retourschepen.'],
    ['Wie was Willem van Oranje?', 'de leider van de opstand tegen Spanje', ['een Romeinse keizer', 'een Vikingkoning', 'een uitvinder'], 'Willem van Oranje wordt de Vader des Vaderlands genoemd.'],
  ],
  3: [
    ['Wat was de Gouden Eeuw?', 'de bloeitijd van Nederland in de 17e eeuw', ['de tijd van de hunebedden', 'de Tweede Wereldoorlog', 'de Franse tijd'], 'In de 17e eeuw was Nederland rijk door handel, kunst en wetenschap.'],
    ['Wie schilderde De Nachtwacht?', 'Rembrandt van Rijn', ['Vincent van Gogh', 'Johannes Vermeer', 'Piet Mondriaan'], 'Rembrandt schilderde De Nachtwacht in 1642.'],
    ['Wat deed de VOC?', 'handel drijven met Azië', ['kastelen bouwen', 'dijken aanleggen', 'treinen maken'], 'De VOC was een handelscompagnie die vooral op Azië voer.'],
  ],
  4: [
    ['In welk jaar begon de Tweede Wereldoorlog in Nederland?', '1940', ['1914', '1939', '1945'], 'Duitsland viel Nederland binnen op 10 mei 1940.'],
    ['Wat was de Industriële Revolutie?', 'de overgang naar machines en fabrieken', ['een oorlog tussen boeren', 'de ontdekking van Amerika', 'de bouw van kastelen'], 'Vanaf ongeveer 1800 nam machinewerk het handwerk over.'],
    ['Wie schreef een beroemd dagboek in de onderduik?', 'Anne Frank', ['Rembrandt', 'Michiel de Ruyter', 'Aletta Jacobs'], 'Anne Frank schreef haar dagboek in het Achterhuis in Amsterdam.'],
  ],
  5: [
    ['Wanneer kregen vrouwen in Nederland actief kiesrecht?', '1919', ['1848', '1900', '1945'], 'In 1919 kregen vrouwen het actief kiesrecht; in 1922 stemden ze voor het eerst.'],
    ['Wat gebeurde er in 1953 in Zeeland?', 'de Watersnoodramp', ['de bevrijding', 'de bouw van de Afsluitdijk', 'de eerste trein reed'], 'In de nacht van 31 januari op 1 februari 1953 braken de dijken door.'],
    ['Waarvoor stonden de Deltawerken?', 'bescherming tegen overstromingen', ['handel met Azië', 'meer landbouwgrond', 'sneller reizen'], 'Na 1953 zijn de Deltawerken gebouwd om Nederland te beschermen.'],
  ],
};

export const geschiedenis: Gen = (niveau, rng) => {
  const lijst = GESCHIEDENIS[Math.min(5, Math.max(1, niveau))];
  const [vraag, antwoord, afleiders, uitleg] = kies(rng, lijst);
  return keuzeVraag(rng, {
    onderwerpId: 'wereld.geschiedenis',
    niveau,
    stam: vraag,
    antwoord,
    afleiders,
    uitleg,
  });
};

const NATUUR: Record<number, Array<[string, string, string[], string]>> = {
  1: [
    ['Hoeveel poten heeft een insect?', '6', ['4', '8', '10'], 'Alle insecten hebben zes poten. Spinnen hebben er acht.'],
    ['Wat hebben planten nodig om te groeien?', 'licht, water en voeding', ['alleen water', 'alleen licht', 'alleen aarde'], 'Planten maken met licht, water en CO₂ hun eigen voedsel.'],
    ['Welk dier legt eieren?', 'de kip', ['de koe', 'de hond', 'het paard'], 'Vogels leggen eieren; zoogdieren krijgen levende jongen.'],
  ],
  2: [
    ['Hoe heet het proces waarbij water verdampt en weer als regen valt?', 'de waterkringloop', ['fotosynthese', 'de zwaartekracht', 'erosie'], 'Water verdampt, wordt een wolk en valt als neerslag terug.'],
    ['Welk orgaan pompt het bloed rond?', 'het hart', ['de longen', 'de lever', 'de maag'], 'Het hart is een spier die het bloed rondpompt.'],
    ['Wat eet een herbivoor?', 'planten', ['vlees', 'planten en vlees', 'insecten'], 'Herbi- komt van "kruid": een herbivoor is een planteneter.'],
  ],
  3: [
    ['Hoe heet het maken van suiker door planten met licht?', 'fotosynthese', ['verbranding', 'condensatie', 'vertering'], 'Bij fotosynthese maken bladeren met licht suiker en zuurstof.'],
    ['Welk gas ademen wij in om te leven?', 'zuurstof', ['koolstofdioxide', 'stikstof', 'waterstof'], 'Wij ademen zuurstof in en koolstofdioxide uit.'],
    ['Wat is een geleider van elektriciteit?', 'koper', ['rubber', 'hout', 'glas'], 'Metalen zoals koper geleiden stroom goed; rubber juist niet.'],
  ],
  4: [
    ['Wat gebeurt er bij condensatie?', 'gas wordt vloeistof', ['vloeistof wordt gas', 'vast wordt vloeibaar', 'vloeibaar wordt vast'], 'Waterdamp koelt af en wordt weer vloeibaar water, zoals op een koud raam.'],
    ['Hoe heet de kracht die alles naar de aarde trekt?', 'zwaartekracht', ['wrijving', 'magnetisme', 'veerkracht'], 'De zwaartekracht trekt massa naar het middelpunt van de aarde.'],
    ['Waarom heeft een fiets remblokken van rubber?', 'voor veel wrijving', ['voor minder gewicht', 'om stroom te geleiden', 'om water af te stoten'], 'Rubber geeft veel wrijving en remt daardoor goed.'],
  ],
  5: [
    ['Wat is een voedselketen?', 'wie eet wie in een gebied', ['de weg van water', 'een soort landkaart', 'de weersverwachting'], 'Een voedselketen laat zien hoe energie van plant naar dier gaat.'],
    ['Welk deel van de cel bevat het DNA?', 'de celkern', ['het celmembraan', 'het cytoplasma', 'de mitochondriën'], 'Het DNA ligt opgeslagen in de kern van de cel.'],
    ['Waardoor ontstaat eb en vloed?', 'de aantrekkingskracht van de maan', ['de wind', 'de stroming van rivieren', 'de warmte van de zon'], 'Vooral de maan (en deels de zon) trekt aan het zeewater.'],
  ],
};

export const natuur: Gen = (niveau, rng) => {
  const lijst = NATUUR[Math.min(5, Math.max(1, niveau))];
  const [vraag, antwoord, afleiders, uitleg] = kies(rng, lijst);
  return keuzeVraag(rng, {
    onderwerpId: 'wereld.natuur',
    niveau,
    stam: vraag,
    antwoord,
    afleiders,
    uitleg,
  });
};

const _WERELD_BASIS: Record<string, Gen> = {
  'wereld.topografie': topografie,
  'wereld.geschiedenis': geschiedenis,
  'wereld.natuur': natuur,
};

/** [land of gebied, hoofdstad of werelddeel] */
const WERELDDELEN: Array<[string, string]> = [
  ['Brazilië', 'Zuid-Amerika'],
  ['Japan', 'Azië'],
  ['Egypte', 'Afrika'],
  ['Canada', 'Noord-Amerika'],
  ['Australië', 'Oceanië'],
  ['India', 'Azië'],
  ['Nigeria', 'Afrika'],
  ['Mexico', 'Noord-Amerika'],
  ['Argentinië', 'Zuid-Amerika'],
  ['China', 'Azië'],
];

const WERELDHOOFDSTEDEN: Array<[string, string]> = [
  ['Japan', 'Tokio'], ['Brazilië', 'Brasilia'], ['Egypte', 'Caïro'],
  ['Canada', 'Ottawa'], ['Australië', 'Canberra'], ['India', 'New Delhi'],
  ['China', 'Peking'], ['Mexico', 'Mexico-Stad'], ['Zuid-Afrika', 'Pretoria'],
  ['Verenigde Staten', 'Washington D.C.'],
];

const WERELDFEITEN: Array<[string, string, string[]]> = [
  ['Wat is de grootste oceaan?', 'de Grote Oceaan', ['de Atlantische Oceaan', 'de Indische Oceaan', 'de Noordelijke IJszee']],
  ['Door welk werelddeel loopt de evenaar het langst?', 'Afrika', ['Europa', 'Noord-Amerika', 'Oceanië']],
  ['Wat is de hoogste berg ter wereld?', 'de Mount Everest', ['de Mont Blanc', 'de Kilimanjaro', 'de Matterhorn']],
  ['Welke rivier is de langste van Afrika?', 'de Nijl', ['de Congo', 'de Zambezi', 'de Niger']],
  ['Welk werelddeel heeft geen vaste inwoners?', 'Antarctica', ['Oceanië', 'Zuid-Amerika', 'Azië']],
];

export const wereldtopo: Gen = (niveau, rng) => {
  const id = 'wereld.wereldtopo';
  if (niveau <= 2) {
    const [land, deel] = kies(rng, WERELDDELEN);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `In welk werelddeel ligt ${land}?`,
      antwoord: deel,
      afleiders: kiesUniek(rng, [...new Set(WERELDDELEN.map((w) => w[1]))].filter((d) => d !== deel), 3),
      uitleg: `${land} ligt in ${deel}.`,
    });
  }
  if (niveau <= 4) {
    const [land, stad] = kies(rng, WERELDHOOFDSTEDEN);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Wat is de hoofdstad van ${land}?`,
      antwoord: stad,
      afleiders: kiesUniek(rng, WERELDHOOFDSTEDEN.filter((l) => l[0] !== land), 3).map((l) => l[1]),
      uitleg: `De hoofdstad van ${land} is ${stad}.`,
    });
  }
  const [vraag, antwoord, afleiders] = kies(rng, WERELDFEITEN);
  return keuzeVraag(rng, {
    onderwerpId: id,
    niveau,
    stam: vraag,
    antwoord,
    afleiders,
    uitleg: `${vraag} ${antwoord.charAt(0).toUpperCase()}${antwoord.slice(1)}.`,
  });
};

const BURGERSCHAP: Record<number, Array<[string, string, string[], string]>> = {
  1: [
    ['Wie mag er in Nederland stemmen bij de verkiezingen?', 'iedereen van 18 jaar en ouder', ['alleen mensen met werk', 'alleen mensen boven de 30', 'iedereen vanaf 12 jaar'], 'Vanaf je achttiende mag je stemmen. Dat heet kiesrecht.'],
    ['Waarom zijn er regels op school?', 'zodat iedereen veilig kan leren', ['om kinderen te straffen', 'omdat de juf dat leuk vindt', 'om tijd te vullen'], 'Regels zijn er om samen goed te kunnen werken en spelen.'],
    ['Wat is een recht dat elk kind heeft?', 'naar school mogen', ['een eigen telefoon', 'elke dag snoep', 'nooit hoeven opruimen'], 'In het Kinderrechtenverdrag staat dat elk kind recht op onderwijs heeft.'],
  ],
  2: [
    ['Wat doet de gemeenteraad?', 'beslissen over zaken in je eigen gemeente', ['wetten maken voor heel Nederland', 'rechtszaken behandelen', 'het leger aansturen'], 'De gemeenteraad gaat over je eigen stad of dorp: wegen, sportvelden, afval.'],
    ['Wat betekent democratie?', 'het volk beslist, via gekozen vertegenwoordigers', ['één persoon beslist alles', 'de rijkste beslist', 'niemand beslist'], 'Demos is Grieks voor volk, kratos voor macht.'],
    ['Wat is discriminatie?', 'mensen ongelijk behandelen om wie ze zijn', ['iemand niet aardig vinden', 'een andere mening hebben', 'ergens niet goed in zijn'], 'Discriminatie is verboden; dat staat in artikel 1 van de Grondwet.'],
  ],
  3: [
    ['Wie controleert of de regering haar werk goed doet?', 'de Tweede Kamer', ['de koning', 'de burgemeester', 'de politie'], 'De Tweede Kamer controleert de regering en maakt samen met haar de wetten.'],
    ['Wat staat er in de Grondwet?', 'de belangrijkste regels en rechten van Nederland', ['de regels van je school', 'de prijzen in de winkel', 'de dienstregeling van de trein'], 'De Grondwet is de basis waar alle andere wetten op moeten passen.'],
    ['Wat is vrijheid van meningsuiting?', 'je mag zeggen wat je denkt, binnen de wet', ['je mag alles zeggen zonder grenzen', 'alleen volwassenen mogen iets zeggen', 'je mag niets over de regering zeggen'], 'Je mag je mening geven, maar niet oproepen tot haat of geweld.'],
  ],
  4: [
    ['Wat is het verschil tussen de Eerste en Tweede Kamer?', 'de Eerste Kamer kijkt of een wet goed in elkaar zit', ['de Eerste Kamer maakt alle wetten', 'de Eerste Kamer is voor jongeren', 'er is geen verschil'], 'De Tweede Kamer maakt en wijzigt wetten; de Eerste Kamer keurt ze alleen goed of af.'],
    ['Wat doet een rechter?', 'oordelen of iemand de wet heeft overtreden', ['wetten maken', 'de politie aansturen', 'belasting innen'], 'De rechtspraak staat los van de regering; dat heet scheiding der machten.'],
    ['Waarom betalen mensen belasting?', 'om samen wegen, scholen en zorg te betalen', ['omdat de koning dat wil', 'als straf voor werken', 'om de winkels te helpen'], 'Van belastinggeld worden voorzieningen betaald die we samen gebruiken.'],
  ],
  5: [
    ['Wat betekent "scheiding der machten"?', 'wetten maken, uitvoeren en beoordelen liggen bij verschillende instanties', ['iedereen mag zijn eigen wet maken', 'de koning beslist alleen', 'de gemeente staat los van het land'], 'Zo kan geen enkele macht ongecontroleerd zijn gang gaan.'],
    ['Wat is een coalitie?', 'partijen die samen een meerderheid vormen en gaan regeren', ['de grootste partij alleen', 'de oppositie', 'alle partijen samen'], 'Omdat geen partij in Nederland de meerderheid haalt, wordt er samengewerkt.'],
    ['Wat doet de Europese Unie?', 'afspraken maken tussen Europese landen over handel en regels', ['de wereld besturen', 'alleen geld drukken', 'oorlogen voeren'], 'De EU is een samenwerkingsverband van Europese landen.'],
  ],
};

export const burgerschap: Gen = (niveau, rng) => {
  const lijst = BURGERSCHAP[Math.min(5, Math.max(1, niveau))];
  const [vraag, antwoord, afleiders, uitleg] = kies(rng, lijst);
  return keuzeVraag(rng, { onderwerpId: 'wereld.burgerschap', niveau, stam: vraag, antwoord, afleiders, uitleg });
};

export const WERELD_GENERATOREN: Record<string, Gen> = {
  ..._WERELD_BASIS,
  'wereld.wereldtopo': wereldtopo,
  'wereld.burgerschap': burgerschap,
};

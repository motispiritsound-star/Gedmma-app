import type { Vraag } from '../types';
import { heelGetal, kies, kiesUniek, type Rng } from '../rng';
import { keuzeVraag, invulVraag } from './helpers';

type Gen = (niveau: number, rng: Rng) => Vraag;

const DAGEN = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];
const ONDERWERPJES = [
  { naam: 'boeken geleend', eenheid: 'boeken' },
  { naam: 'flessen water verkocht', eenheid: 'flessen' },
  { naam: 'bezoekers in het zwembad', eenheid: 'bezoekers' },
  { naam: 'kilometers gefietst', eenheid: 'km' },
];

/**
 * Grafieken en tabellen worden als tekst gepresenteerd. Dat leest ook goed
 * voor met VoiceOver, en het dwingt het kind om de cijfers echt te vergelijken
 * in plaats van naar de hoogste balk te wijzen.
 */
export const grafieken: Gen = (niveau, rng) => {
  const id = 'studie.grafieken';
  const thema = kies(rng, ONDERWERPJES);
  const spreiding = niveau <= 2 ? 20 : niveau === 3 ? 90 : 400;
  const waarden = DAGEN.map(() => heelGetal(rng, 2, spreiding));
  const tabel = DAGEN.map((d, i) => `${d}: ${waarden[i]}`).join('\n');
  const context = `Aantal ${thema.naam} per dag\n${tabel}`;

  const hoogste = Math.max(...waarden);
  const laagste = Math.min(...waarden);
  const totaal = waarden.reduce((a, b) => a + b, 0);

  if (niveau <= 1) {
    const dag = DAGEN[waarden.indexOf(hoogste)];
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      context,
      stam: 'Op welke dag was het aantal het hoogst?',
      antwoord: dag,
      afleiders: kiesUniek(rng, DAGEN.filter((d) => d !== dag), 3),
      uitleg: `Het hoogste getal in de tabel is ${hoogste}, en dat staat bij ${dag}.`,
    });
  }
  if (niveau === 2) {
    const dag = DAGEN[waarden.indexOf(laagste)];
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      context,
      stam: 'Op welke dag was het aantal het laagst?',
      antwoord: dag,
      afleiders: kiesUniek(rng, DAGEN.filter((d) => d !== dag), 3),
      uitleg: `Het laagste getal is ${laagste}, en dat hoort bij ${dag}.`,
    });
  }
  if (niveau === 3) {
    return invulVraag({
      onderwerpId: id,
      niveau,
      context,
      stam: 'Hoeveel is het samen over de hele week?',
      antwoord: String(totaal),
      uitleg: `Tel alle vijf de getallen op: ${waarden.join(' + ')} = ${totaal}.`,
    });
  }
  if (niveau === 4) {
    return invulVraag({
      onderwerpId: id,
      niveau,
      context,
      stam: 'Wat is het verschil tussen de hoogste en de laagste dag?',
      antwoord: String(hoogste - laagste),
      uitleg: `De hoogste is ${hoogste}, de laagste ${laagste}. ${hoogste} − ${laagste} = ${hoogste - laagste}.`,
    });
  }
  const gemiddelde = Math.round(totaal / DAGEN.length);
  return invulVraag({
    onderwerpId: id,
    niveau,
    context,
    stam: 'Wat is het gemiddelde per dag? Rond af op een heel getal.',
    antwoord: String(gemiddelde),
    uitleg: `Tel alles op (${totaal}) en deel door het aantal dagen (5): ${totaal} : 5 ≈ ${gemiddelde}.`,
  });
};

const WINDRICHTINGEN = ['noorden', 'oosten', 'zuiden', 'westen'];
const TEGENOVER: Record<string, string> = {
  noorden: 'zuiden',
  zuiden: 'noorden',
  oosten: 'westen',
  westen: 'oosten',
};

const LEGENDA: Array<[string, string]> = [
  ['een blauwe lijn', 'een rivier'],
  ['een groen vlak', 'een bos'],
  ['een rode lijn', 'een grote weg'],
  ['een zwarte stippellijn', 'een wandelpad'],
  ['een bruin vlak', 'een heuvel of berg'],
  ['een grijs blokje', 'een gebouw'],
];

export const kaartlezen: Gen = (niveau, rng) => {
  const id = 'studie.kaartlezen';
  if (niveau <= 1) {
    const richting = kies(rng, WINDRICHTINGEN);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Je loopt naar het ${richting}. Welke kant is precies de andere kant op?`,
      antwoord: `het ${TEGENOVER[richting]}`,
      afleiders: WINDRICHTINGEN.filter((r) => r !== TEGENOVER[richting]).map((r) => `het ${r}`),
      uitleg: `Op een kaart ligt het noorden boven. Tegenover het ${richting} ligt het ${TEGENOVER[richting]}.`,
    });
  }
  if (niveau === 2) {
    const [teken, betekenis] = kies(rng, LEGENDA);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `In de legenda staat ${teken}. Wat betekent dat meestal?`,
      antwoord: betekenis,
      afleiders: kiesUniek(rng, LEGENDA.filter((l) => l[1] !== betekenis), 3).map((l) => l[1]),
      uitleg: `De legenda vertelt wat de kleuren en lijnen betekenen. ${teken.charAt(0).toUpperCase()}${teken.slice(1)} staat voor ${betekenis}.`,
    });
  }
  if (niveau === 3) {
    const schaal = kies(rng, [10000, 25000, 50000]);
    const cm = heelGetal(rng, 2, 12);
    const km = (cm * schaal) / 100000;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `Op een kaart met schaal 1 : ${schaal.toLocaleString('nl-NL')} meet je ${cm} cm. Hoeveel kilometer is dat?`,
      antwoord: String(km),
      eenheid: 'km',
      uitleg: `1 cm is ${schaal} cm echt, dat is ${schaal / 100000} km. ${cm} × ${schaal / 100000} = ${km} km.`,
    });
  }
  if (niveau === 4) {
    const start = kies(rng, WINDRICHTINGEN);
    const index = WINDRICHTINGEN.indexOf(start);
    const rechtsaf = WINDRICHTINGEN[(index + 1) % 4];
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Je loopt naar het ${start} en slaat rechtsaf. Welke kant loop je dan op?`,
      antwoord: `het ${rechtsaf}`,
      afleiders: WINDRICHTINGEN.filter((r) => r !== rechtsaf).map((r) => `het ${r}`),
      uitleg: `In de volgorde noord, oost, zuid, west gaat rechtsaf steeds één stap verder. Vanaf het ${start} kom je bij het ${rechtsaf}.`,
    });
  }
  const hoogteA = heelGetal(rng, 2, 12) * 10;
  const hoogteB = hoogteA + heelGetal(rng, 2, 9) * 10;
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `Punt A ligt op ${hoogteA} meter hoogte, punt B op ${hoogteB} meter. Hoeveel meter klim je van A naar B?`,
    antwoord: String(hoogteB - hoogteA),
    eenheid: 'm',
    uitleg: `Trek de hoogtes van elkaar af: ${hoogteB} − ${hoogteA} = ${hoogteB - hoogteA} meter.`,
  });
};

/** Echte woorden, zodat alfabetiseren met taal geoefend wordt en niet met letterbrij. */
const ZOEKWOORDEN = [
  'aardbei', 'ballon', 'citroen', 'dolfijn', 'egel', 'fiets', 'giraf', 'hamer',
  'iglo', 'jas', 'kikker', 'lamp', 'muts', 'noot', 'olifant', 'paraplu',
  'raket', 'schaar', 'tijger', 'uil', 'vlinder', 'wolk', 'zebra', 'ezel',
  'appel', 'boom', 'brood', 'bloem', 'kaas', 'kast', 'kers', 'koe',
];

const INFORMATIE: Record<number, Array<[string, string, string[], string]>> = {
  1: [
    ['Waar kijk je als je wilt weten op welke bladzijde een hoofdstuk begint?', 'de inhoudsopgave', ['het register', 'de titelpagina', 'het voorwoord'], 'De inhoudsopgave staat voorin en geeft per hoofdstuk het paginanummer.'],
    ['Waar zoek je op wat een woord betekent?', 'in een woordenboek', ['in een atlas', 'in een telefoonboek', 'in een agenda'], 'Een woordenboek geeft betekenissen; een atlas geeft kaarten.'],
    ['Waar vind je kaarten van landen?', 'in een atlas', ['in een woordenboek', 'in een roman', 'in een kookboek'], 'Een atlas is een boek met kaarten.'],
  ],
  2: [
    ['Wat staat er achterin een boek, met daarin trefwoorden op alfabet?', 'het register', ['de inhoudsopgave', 'het voorwoord', 'de samenvatting'], 'Het register verwijst per trefwoord naar de bladzijden waar het voorkomt.'],
    ['Wat is een bron?', 'de plek waar de informatie vandaan komt', ['de titel van een boek', 'de schrijver van een tekst', 'het onderwerp'], 'Je noemt een bron zodat een ander kan controleren waar iets vandaan komt.'],
    ['Wat is een trefwoord?', 'het belangrijkste woord waarop je zoekt', ['het langste woord', 'een moeilijk woord', 'het eerste woord van een zin'], 'Met een goed trefwoord vind je sneller wat je zoekt.'],
  ],
  3: [
    ['Welke website is meestal het meest betrouwbaar voor een spreekbeurt?', 'een site van een museum of universiteit', ['een blog van iemand die je niet kent', 'een webshop', 'een reclamepagina'], 'Organisaties zonder verkoopbelang hebben minder reden om iets mooier te maken dan het is.'],
    ['Waar let je op om te zien of informatie nog klopt?', 'de datum van publicatie', ['de kleur van de site', 'het aantal plaatjes', 'de lengte van de tekst'], 'Verouderde cijfers kunnen jaren later helemaal niet meer kloppen.'],
    ['Wat doe je als twee bronnen elkaar tegenspreken?', 'een derde bron zoeken en vergelijken', ['de eerste geloven', 'de kortste geloven', 'allebei overschrijven'], 'Met een derde bron kun je zien welke kant het meeste steun heeft.'],
  ],
  4: [
    ['Wat is het verschil tussen een feit en een mening?', 'een feit kun je controleren, een mening niet', ['een feit is langer', 'een mening staat altijd in de krant', 'er is geen verschil'], '"Utrecht heeft 370.000 inwoners" is te controleren; "Utrecht is de mooiste stad" niet.'],
    ['Wat betekent het als een tekst "gesponsord" is?', 'iemand heeft betaald om die tekst te laten verschijnen', ['de tekst is gratis', 'de tekst is door een leraar geschreven', 'de tekst is heel oud'], 'Een gesponsorde tekst kan gekleurd zijn door wie ervoor betaalde.'],
    ['Waarom noem je je bronnen bij een werkstuk?', 'zodat een ander kan nakijken waar je het vandaan hebt', ['om het werkstuk langer te maken', 'omdat het moet van de computer', 'om plaatjes te mogen gebruiken'], 'Bronvermelding maakt je werk controleerbaar en voorkomt dat je iets van een ander als eigen werk presenteert.'],
  ],
  5: [
    ['Wat is een primaire bron?', 'materiaal uit de tijd zelf, zoals een dagboek of foto', ['een schoolboek', 'een samenvatting', 'een encyclopedie'], 'Primaire bronnen komen rechtstreeks uit de periode die je onderzoekt.'],
    ['Wat is het risico van alleen zoeken op één zoekterm?', 'je krijgt maar één kant van het verhaal te zien', ['je krijgt te veel resultaten', 'de computer wordt traag', 'je vindt niets'], 'Andere woorden leveren andere bronnen op; probeer meerdere zoektermen.'],
    ['Wat betekent "bronkritiek"?', 'nagaan wie iets zegt, wanneer, en met welk belang', ['een bron afkeuren', 'kritiek geven op een schrijver', 'een bron samenvatten'], 'Bronkritiek gaat over de betrouwbaarheid van de informatie, niet over de schrijver als persoon.'],
  ],
};

export const informatie: Gen = (niveau, rng) => {
  const n = Math.min(5, Math.max(1, niveau));
  // Op de laagste niveaus af en toe een alfabetvraag, want opzoeken begint daar.
  if (n <= 2 && rng() < 0.35) {
    const woorden = kiesUniek(rng, ZOEKWOORDEN, 4);
    const eerste = [...woorden].sort((a, b) => a.localeCompare(b, 'nl'))[0];
    return keuzeVraag(rng, {
      onderwerpId: 'studie.informatie',
      niveau: n,
      stam: 'Welk woord staat het eerst in het woordenboek?',
      antwoord: eerste,
      afleiders: woorden.filter((w) => w !== eerste),
      uitleg: `In een woordenboek staan woorden op alfabet. Van ${woorden.join(', ')} komt "${eerste}" het eerst.`,
    });
  }
  const lijst = INFORMATIE[n];
  const [vraag, antwoord, afleiders, uitleg] = kies(rng, lijst);
  return keuzeVraag(rng, { onderwerpId: 'studie.informatie', niveau: n, stam: vraag, antwoord, afleiders, uitleg });
};

export const STUDIE_GENERATOREN: Record<string, Gen> = {
  'studie.grafieken': grafieken,
  'studie.kaartlezen': kaartlezen,
  'studie.informatie': informatie,
};

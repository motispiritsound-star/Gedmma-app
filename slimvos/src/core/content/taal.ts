import type { Vraag } from '../types';
import { kies, kiesUniek, type Rng } from '../rng';
import { keuzeVraag, invulVraag } from './helpers';

type Gen = (niveau: number, rng: Rng) => Vraag;

/** [goede schrijfwijze, veelgemaakte fout, uitleg] */
type SpellingItem = [string, string, string];

const SPELLING: Record<number, SpellingItem[]> = {
  1: [
    ['school', 'sgool', 'Na de s hoort hier "ch": school.'],
    ['boom', 'bom', 'Je hoort een lange oo, dus twee o’s: boom.'],
    ['vis', 'vies', '"Vis" is het dier, "vies" betekent vuil.'],
    ['maan', 'man', 'Lange aa-klank: maan. Met één a is het "man".'],
    ['huis', 'hijs', 'De klank ui schrijf je met u en i: huis.'],
    ['deur', 'dur', 'De eu-klank schrijf je met e en u: deur.'],
    ['kat', 'kad', 'Aan het eind hoor je een t en schrijf je ook een t: kat.'],
    ['bed', 'bet', 'Denk aan "bedden": daar hoor je een d, dus bed.'],
  ],
  2: [
    ['hond', 'hont', 'Denk aan "honden": daar hoor je een d, dus hond.'],
    ['paard', 'paart', 'Denk aan "paarden": met een d, dus paard.'],
    ['blij', 'blei', 'Dit woord hoort bij de korte ij-groep: blij.'],
    ['trein', 'trijn', 'Trein schrijf je met ei.'],
    ['vrouw', 'vrou', 'Aan het eind van een woord schrijf je ouw: vrouw.'],
    ['bang', 'bank', 'De ng-klank: bang. Een bank is iets anders.'],
    ['licht', 'ligt', 'Licht (schijnsel) met cht; "ligt" komt van liggen.'],
    ['nacht', 'nagt', 'Na een korte klank schrijf je cht: nacht.'],
  ],
  3: [
    ['bijna', 'beina', 'Bijna schrijf je met ij.'],
    ['eigenlijk', 'eigelijk', 'Er zit een n in: ei-gen-lijk.'],
    ['gebeurd', 'gebeurt', 'Voltooid deelwoord: het is gebeurd (met d).'],
    ['word', 'wordt', 'Bij "ik" nooit dt: ik word.'],
    ['wordt', 'word', 'Bij "hij/zij" komt er een t bij: hij wordt.'],
    ['antwoord', 'antwoort', 'Denk aan "antwoorden": met een d.'],
    ['moeilijk', 'moeijlijk', 'Moei-lijk: één ij, in de uitgang -lijk.'],
    ['tenminste', 'tenminsten', 'Tenminste eindigt op -ste.'],
  ],
  4: [
    ['gebeurtenis', 'gebeurdenis', 'Van "gebeuren": gebeur + tenis, met een t.'],
    ['ingenieur', 'ingenjeur', 'Frans leenwoord: in-ge-ni-eur.'],
    ['organisatie', 'organizatie', 'In het Nederlands met een s: organisatie.'],
    ['cadeau', 'kado', 'Frans leenwoord: cadeau.'],
    ['restaurant', 'restourant', 'Frans leenwoord: restaurant, met au.'],
    ['geüpdatet', 'ge-update', 'Engels werkwoord, Nederlandse regel: geüpdatet.'],
    ['succes', 'sukses', 'Succes schrijf je met twee c\u2019s.'],
    ['medaille', 'medalje', 'Frans leenwoord: medaille.'],
  ],
  5: [
    ['realiseren', 'realizeren', 'Werkwoorden op -iseren schrijf je met een s.'],
    ['allebei', 'alle bei', 'Allebei is één woord.'],
    ['nauwelijks', 'nauwlijks', 'Er zit een e tussen: nau-we-lijks.'],
    ['drieëntwintig', 'drieentwintig', 'Trema op de e: drieëntwintig.'],
    ['geëvalueerd', 'geevalueerd', 'Trema voorkomt dat je "gee" leest: geëvalueerd.'],
    ['coëfficiënt', 'coefficient', 'Twee trema\u2019s: coëfficiënt.'],
    ['reageerde', 'reageerdde', 'Stam "reageer" + de = reageerde.'],
    ['collega\u2019s', 'collegas', 'Meervoud van een woord op -a krijgt een apostrof.'],
  ],
};

export const spelling: Gen = (niveau, rng) => {
  const lijst = SPELLING[Math.min(5, Math.max(1, niveau))];
  const [goed, fout, uitleg] = kies(rng, lijst);
  const extra = kiesUniek(rng, lijst.filter((i) => i[0] !== goed), 2).map((i) => i[1]);
  return keuzeVraag(rng, {
    onderwerpId: 'taal.spelling',
    niveau,
    stam: 'Welk woord is goed geschreven?',
    antwoord: goed,
    afleiders: [fout, ...extra],
    uitleg,
  });
};

/** Werkwoorden: [stam, hele werkwoord, klinkt de laatste letter van de stam in 't kofschip?] */
const WERKWOORDEN: Array<[string, string, boolean]> = [
  ['werk', 'werken', true],
  ['maak', 'maken', true],
  ['praat', 'praten', true],
  ['fiets', 'fietsen', true],
  ['hoop', 'hopen', true],
  ['blaf', 'blaffen', true],
  ['lach', 'lachen', true],
  ['speel', 'spelen', false],
  ['leer', 'leren', false],
  ['bel', 'bellen', false],
  ['reis', 'reizen', false],
  ['leef', 'leven', false],
  ['bouw', 'bouwen', false],
  ['deel', 'delen', false],
];

const PERSONEN = ['ik', 'jij', 'hij', 'zij', 'wij'];

export const werkwoorden: Gen = (niveau, rng) => {
  const id = 'taal.werkwoorden';
  const [stam, heel, kofschip] = kies(rng, WERKWOORDEN);
  if (niveau <= 1) {
    const persoon = kies(rng, ['hij', 'zij']);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Wat is goed? "${persoon} ___ elke dag" (${heel})`,
      antwoord: `${persoon} ${stam}t`,
      afleiders: [`${persoon} ${stam}`, `${persoon} ${stam}dt`, `${persoon} ${stam}d`],
      uitleg: `Tegenwoordige tijd bij hij/zij: stam + t. De stam is "${stam}", dus "${stam}t".`,
    });
  }
  if (niveau === 2) {
    const persoon = kies(rng, PERSONEN);
    const vorm = persoon === 'ik' ? stam : persoon === 'wij' ? heel : `${stam}t`;
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Vul in: "${persoon} ___ vandaag" (${heel})`,
      antwoord: `${persoon} ${vorm}`,
      afleiders: [`${persoon} ${stam}`, `${persoon} ${stam}t`, `${persoon} ${stam}dt`].filter((a) => a !== `${persoon} ${vorm}`),
      uitleg:
        persoon === 'ik'
          ? 'Bij "ik" gebruik je alleen de stam, nooit een t erachter.'
          : persoon === 'wij'
            ? 'Bij "wij" gebruik je het hele werkwoord.'
            : 'Bij jij/hij/zij (na het werkwoord geen omdraaiing) is het stam + t.',
    });
  }
  if (niveau === 3) {
    const uitgang = kofschip ? 'te' : 'de';
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Verleden tijd van "${heel}" bij "hij": hij ___`,
      antwoord: `${stam}${uitgang}`,
      afleiders: [`${stam}${kofschip ? 'de' : 'te'}`, `${stam}t`, `ge${stam}${uitgang.slice(0, 1)}`],
      uitleg: `'t Kofschip: de laatste letter van de stam "${stam}" ${kofschip ? 'zit' : 'zit niet'} in 't kofschip, dus je krijgt -${uitgang}.`,
    });
  }
  if (niveau === 4) {
    const letter = kofschip ? 't' : 'd';
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Voltooid deelwoord van "${heel}": hij heeft ge___`,
      antwoord: `ge${stam}${letter}`,
      afleiders: [`ge${stam}${kofschip ? 'd' : 't'}`, `ge${stam}`, `ge${stam}dt`],
      uitleg: `Voltooid deelwoord = ge + stam + ${letter}, want "${stam}" eindigt op een letter die ${kofschip ? 'wél' : 'niet'} in 't kofschip staat.`,
    });
  }
  const uitgang5 = kofschip ? 't' : 'd';
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `Vul de goede vorm in: "Het pakketje is gisteren al ge___." (${heel})`,
    antwoord: `ge${stam}${uitgang5}`,
    uitleg: `Het is een voltooid deelwoord: ge + ${stam} + ${uitgang5}. Let op: bij "is/heeft" nooit -dt.`,
  });
};

/** [woord, betekenis] */
const WOORDENSCHAT: Record<number, Array<[string, string]>> = {
  1: [
    ['blij', 'vrolijk'],
    ['moe', 'slaperig'],
    ['snel', 'hard, in korte tijd'],
    ['stil', 'zonder geluid'],
    ['groot', 'niet klein'],
    ['boos', 'kwaad'],
  ],
  2: [
    ['dapper', 'niet bang, moedig'],
    ['zuinig', 'voorzichtig met geld'],
    ['nieuwsgierig', 'graag alles willen weten'],
    ['eerlijk', 'de waarheid vertellen'],
    ['geduldig', 'rustig kunnen wachten'],
    ['verlegen', 'schuchter tegenover anderen'],
  ],
  3: [
    ['gastvrij', 'gasten graag ontvangen'],
    ['betrouwbaar', 'je kunt erop rekenen'],
    ['verbaasd', 'heel erg verrast'],
    ['hardnekkig', 'niet snel weg te krijgen'],
    ['gierig', 'niets willen weggeven'],
    ['schaars', 'er is maar weinig van'],
  ],
  4: [
    ['ambitieus', 'veel willen bereiken'],
    ['tolerant', 'anderen in hun waarde laten'],
    ['efficiënt', 'zonder verspilling van tijd of moeite'],
    ['sceptisch', 'twijfelend, niet snel overtuigd'],
    ['nauwkeurig', 'heel precies'],
    ['solidair', 'opkomen voor elkaar'],
  ],
  5: [
    ['pragmatisch', 'kiezen voor wat praktisch werkt'],
    ['cynisch', 'spottend, weinig vertrouwen in mensen'],
    ['integer', 'eerlijk en betrouwbaar in je werk'],
    ['ambivalent', 'twee tegenstrijdige gevoelens tegelijk'],
    ['obsoleet', 'verouderd, niet meer gebruikt'],
    ['discreet', 'niet doorvertellen, bescheiden'],
  ],
};

export const woordenschat: Gen = (niveau, rng) => {
  const lijst = WOORDENSCHAT[Math.min(5, Math.max(1, niveau))];
  const [woord, betekenis] = kies(rng, lijst);
  const afleiders = kiesUniek(rng, lijst.filter((i) => i[0] !== woord), 3).map((i) => i[1]);
  return keuzeVraag(rng, {
    onderwerpId: 'taal.woordenschat',
    niveau,
    stam: `Wat betekent "${woord}"?`,
    antwoord: betekenis,
    afleiders,
    uitleg: `"${woord}" betekent: ${betekenis}.`,
  });
};

/** [zin, persoonsvorm, onderwerp, lijdend voorwerp of ''] */
const ZINNEN: Array<[string, string, string, string]> = [
  ['De hond blaft naar de postbode.', 'blaft', 'De hond', ''],
  ['Sem eet een appel.', 'eet', 'Sem', 'een appel'],
  ['Wij fietsen naar school.', 'fietsen', 'Wij', ''],
  ['De juf leest een spannend verhaal voor.', 'leest', 'De juf', 'een spannend verhaal'],
  ['Morgen komt mijn oma op bezoek.', 'komt', 'mijn oma', ''],
  ['De kinderen bouwen een grote hut.', 'bouwen', 'De kinderen', 'een grote hut'],
  ['In de tuin groeit een oude appelboom.', 'groeit', 'een oude appelboom', ''],
  ['Yara heeft haar tas vergeten.', 'heeft', 'Yara', 'haar tas'],
];

export const ontleden: Gen = (niveau, rng) => {
  const id = 'taal.ontleden';
  const [zin, pv, onderwerp, lv] = kies(rng, ZINNEN);
  const woorden = zin.replace(/[.!?]/g, '').split(' ');
  if (niveau <= 2) {
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      context: zin,
      stam: 'Wat is de persoonsvorm in deze zin?',
      antwoord: pv,
      afleiders: kiesUniek(rng, woorden.filter((w) => w.toLowerCase() !== pv.toLowerCase()), 3),
      uitleg: `Maak er een vraagzin van: "${pv} ...?" Het werkwoord dat dan vooraan springt is de persoonsvorm: "${pv}".`,
    });
  }
  if (niveau === 3) {
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      context: zin,
      stam: 'Wat is het onderwerp van deze zin?',
      antwoord: onderwerp,
      afleiders: kiesUniek(rng, ZINNEN.filter((z) => z[2] !== onderwerp).map((z) => z[2]), 3),
      uitleg: `Vraag: wie of wat ${pv}? Antwoord: ${onderwerp}. Dat is het onderwerp.`,
    });
  }
  if (niveau === 4 && lv) {
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      context: zin,
      stam: 'Wat is het lijdend voorwerp?',
      antwoord: lv,
      afleiders: kiesUniek(rng, ZINNEN.filter((z) => z[3] && z[3] !== lv).map((z) => z[3]), 3),
      uitleg: `Vraag: wie of wat ${pv} ${onderwerp.toLowerCase()}? Antwoord: ${lv}.`,
    });
  }
  const woordsoorten: Array<[string, string]> = [
    ['de', 'lidwoord'],
    ['het', 'lidwoord'],
    ['snel', 'bijvoeglijk naamwoord'],
    ['hond', 'zelfstandig naamwoord'],
    ['lopen', 'werkwoord'],
    ['zij', 'persoonlijk voornaamwoord'],
    ['onder', 'voorzetsel'],
    ['maar', 'voegwoord'],
  ];
  const [w, soort] = kies(rng, woordsoorten);
  return keuzeVraag(rng, {
    onderwerpId: id,
    niveau,
    stam: `Welke woordsoort is "${w}"?`,
    antwoord: soort,
    afleiders: kiesUniek(rng, woordsoorten.filter((x) => x[1] !== soort).map((x) => x[1]), 3),
    uitleg: `"${w}" is een ${soort}.`,
  });
};

export const TAAL_GENERATOREN: Record<string, Gen> = {
  'taal.spelling': spelling,
  'taal.werkwoorden': werkwoorden,
  'taal.woordenschat': woordenschat,
  'taal.ontleden': ontleden,
};

/** Helper voor tests en de contentteller in de app. */
export const TAAL_BANK_OMVANG =
  Object.values(SPELLING).reduce((n, l) => n + l.length, 0) +
  Object.values(WOORDENSCHAT).reduce((n, l) => n + l.length, 0) +
  WERKWOORDEN.length +
  ZINNEN.length;

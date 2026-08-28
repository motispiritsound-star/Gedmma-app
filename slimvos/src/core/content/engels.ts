import type { Vraag } from '../types';
import { kies, kiesUniek, type Rng } from '../rng';
import { keuzeVraag } from './helpers';

type Gen = (niveau: number, rng: Rng) => Vraag;

/** [engels, nederlands] */
const WOORDEN: Record<number, Array<[string, string]>> = {
  1: [
    ['dog', 'hond'], ['cat', 'kat'], ['house', 'huis'], ['tree', 'boom'],
    ['red', 'rood'], ['blue', 'blauw'], ['water', 'water'], ['bread', 'brood'],
    ['school', 'school'], ['friend', 'vriend'], ['book', 'boek'], ['table', 'tafel'],
  ],
  2: [
    ['bicycle', 'fiets'], ['kitchen', 'keuken'], ['weather', 'weer'], ['shoes', 'schoenen'],
    ['bird', 'vogel'], ['horse', 'paard'], ['window', 'raam'], ['garden', 'tuin'],
    ['morning', 'ochtend'], ['evening', 'avond'], ['bridge', 'brug'], ['spoon', 'lepel'],
  ],
  3: [
    ['neighbour', 'buurman of buurvrouw'], ['journey', 'reis'], ['expensive', 'duur'],
    ['careful', 'voorzichtig'], ['borrow', 'lenen'], ['crowded', 'druk, vol mensen'],
    ['village', 'dorp'], ['knowledge', 'kennis'], ['strange', 'vreemd'], ['answer', 'antwoord'],
  ],
  4: [
    ['achieve', 'bereiken'], ['reliable', 'betrouwbaar'], ['increase', 'toenemen'],
    ['although', 'hoewel'], ['environment', 'milieu, omgeving'], ['opportunity', 'kans'],
    ['decrease', 'afnemen'], ['audience', 'publiek'], ['average', 'gemiddelde'], ['whether', 'of'],
  ],
  5: [
    ['reluctant', 'aarzelend, niet graag'], ['sufficient', 'voldoende'], ['acknowledge', 'erkennen'],
    ['nevertheless', 'toch, desondanks'], ['thorough', 'grondig'], ['sustainable', 'duurzaam'],
    ['deliberate', 'opzettelijk'], ['inevitable', 'onvermijdelijk'], ['convince', 'overtuigen'],
    ['approximately', 'ongeveer'],
  ],
};

export const engelsWoorden: Gen = (niveau, rng) => {
  const lijst = WOORDEN[Math.min(5, Math.max(1, niveau))];
  const [en, nl] = kies(rng, lijst);
  const naarNederlands = rng() < 0.5;
  const anderen = kiesUniek(rng, lijst.filter((i) => i[0] !== en), 3);
  return keuzeVraag(rng, {
    onderwerpId: 'engels.woorden',
    niveau,
    stam: naarNederlands ? `Wat betekent "${en}"?` : `Hoe zeg je "${nl}" in het Engels?`,
    antwoord: naarNederlands ? nl : en,
    afleiders: anderen.map((i) => (naarNederlands ? i[1] : i[0])),
    uitleg: `"${en}" betekent "${nl}".`,
  });
};

/** [zin met ___, goed antwoord, afleiders, uitleg] */
const ZINNEN: Record<number, Array<[string, string, string[], string]>> = {
  1: [
    ['I ___ a student.', 'am', ['is', 'are', 'be'], 'Bij "I" hoort altijd "am".'],
    ['She ___ from Spain.', 'is', ['am', 'are', 'be'], 'Bij he/she/it hoort "is".'],
    ['They ___ my friends.', 'are', ['is', 'am', 'be'], 'Bij we/you/they hoort "are".'],
    ['How ___ you?', 'are', ['is', 'am', 'be'], '"How are you?" is de vaste vraag.'],
  ],
  2: [
    ['He ___ football every Saturday.', 'plays', ['play', 'playing', 'played'], 'Bij he/she/it komt er een -s achter het werkwoord.'],
    ['We ___ to school by bike.', 'go', ['goes', 'going', 'gone'], 'Bij we blijft het werkwoord in de basisvorm.'],
    ['I ___ my homework yesterday.', 'did', ['do', 'does', 'doing'], '"Yesterday" wijst op verleden tijd: did.'],
    ['There ___ two cats in the garden.', 'are', ['is', 'am', 'be'], 'Meervoud (two cats) krijgt "are".'],
  ],
  3: [
    ['I have ___ my keys.', 'lost', ['lose', 'losing', 'loses'], 'Na "have" komt het voltooid deelwoord: lost.'],
    ['She is ___ than her brother.', 'taller', ['tall', 'tallest', 'more tall'], 'Vergelijken met -er: taller than.'],
    ['This is the ___ film of the year.', 'best', ['good', 'better', 'goodest'], 'Overtreffende trap van good is best.'],
    ['If it rains, we ___ stay inside.', 'will', ['would', 'were', 'are'], 'Toekomst na een if-zin: will.'],
  ],
  4: [
    ['I have been waiting ___ two hours.', 'for', ['since', 'from', 'during'], '"For" bij een tijdsduur, "since" bij een startmoment.'],
    ['He said he ___ come tomorrow.', 'would', ['will', 'shall', 'can'], 'In indirecte rede wordt will → would.'],
    ['The book ___ by many students.', 'is read', ['reads', 'reading', 'has read'], 'Lijdende vorm: is + voltooid deelwoord.'],
    ['She is used to ___ early.', 'getting up', ['get up', 'got up', 'gets up'], 'Na "used to" (gewend zijn) komt -ing.'],
  ],
  5: [
    ['If I ___ more time, I would travel.', 'had', ['have', 'would have', 'has'], 'Onwerkelijke voorwaarde: if + verleden tijd.'],
    ['Hardly ___ he arrived when the phone rang.', 'had', ['has', 'did', 'was'], 'Na "hardly" vooraan volgt inversie: had he.'],
    ['I wish I ___ speak Chinese.', 'could', ['can', 'will', 'would have'], 'Na "I wish" gebruik je de verleden vorm: could.'],
    ['The report needs ___ before Friday.', 'to be finished', ['finishing to', 'finish', 'be finish'], 'Passieve infinitief: to be finished.'],
  ],
};

export const engelsZinnen: Gen = (niveau, rng) => {
  const lijst = ZINNEN[Math.min(5, Math.max(1, niveau))];
  const [zin, goed, fout, uitleg] = kies(rng, lijst);
  return keuzeVraag(rng, {
    onderwerpId: 'engels.zinnen',
    niveau,
    context: zin,
    stam: 'Welk woord hoort op de open plek?',
    antwoord: goed,
    afleiders: fout,
    uitleg,
  });
};

const _ENGELS_BASIS: Record<string, Gen> = {
  'engels.woorden': engelsWoorden,
  'engels.zinnen': engelsZinnen,
};

/** [hele werkwoord, verleden tijd, voltooid deelwoord, betekenis] */
const WERKWOORDEN: Record<number, Array<[string, string, string, string]>> = {
  1: [
    ['go', 'went', 'gone', 'gaan'],
    ['see', 'saw', 'seen', 'zien'],
    ['eat', 'ate', 'eaten', 'eten'],
    ['make', 'made', 'made', 'maken'],
    ['take', 'took', 'taken', 'nemen'],
  ],
  2: [
    ['buy', 'bought', 'bought', 'kopen'],
    ['bring', 'brought', 'brought', 'brengen'],
    ['think', 'thought', 'thought', 'denken'],
    ['write', 'wrote', 'written', 'schrijven'],
    ['drink', 'drank', 'drunk', 'drinken'],
  ],
  3: [
    ['choose', 'chose', 'chosen', 'kiezen'],
    ['break', 'broke', 'broken', 'breken'],
    ['speak', 'spoke', 'spoken', 'spreken'],
    ['forget', 'forgot', 'forgotten', 'vergeten'],
    ['begin', 'began', 'begun', 'beginnen'],
  ],
  4: [
    ['catch', 'caught', 'caught', 'vangen'],
    ['teach', 'taught', 'taught', 'onderwijzen'],
    ['lie', 'lay', 'lain', 'liggen'],
    ['rise', 'rose', 'risen', 'stijgen'],
    ['hide', 'hid', 'hidden', 'verbergen'],
  ],
  5: [
    ['bear', 'bore', 'borne', 'dragen, verdragen'],
    ['seek', 'sought', 'sought', 'zoeken'],
    ['weave', 'wove', 'woven', 'weven'],
    ['strike', 'struck', 'struck', 'slaan, treffen'],
    ['bind', 'bound', 'bound', 'binden'],
  ],
};

export const engelsWerkwoorden: Gen = (niveau, rng) => {
  const lijst = WERKWOORDEN[Math.min(5, Math.max(1, niveau))];
  const [heel, verleden, voltooid, betekenis] = kies(rng, lijst);
  const anderen = kiesUniek(rng, lijst.filter((w) => w[0] !== heel), 3);
  const vraagVerleden = rng() < 0.6;
  return keuzeVraag(rng, {
    onderwerpId: 'engels.werkwoorden',
    niveau,
    stam: vraagVerleden
      ? `Wat is de verleden tijd van "${heel}" (${betekenis})?`
      : `Wat is het voltooid deelwoord van "${heel}" (${betekenis})? I have ___`,
    antwoord: vraagVerleden ? verleden : voltooid,
    afleiders: anderen.map((w) => (vraagVerleden ? w[1] : w[2])),
    uitleg: `${heel} — ${verleden} — ${voltooid}. Dit is een onregelmatig werkwoord, dus je moet de rijtjes uit je hoofd leren.`,
  });
};

export const ENGELS_GENERATOREN: Record<string, Gen> = {
  ..._ENGELS_BASIS,
  'engels.werkwoorden': engelsWerkwoorden,
};

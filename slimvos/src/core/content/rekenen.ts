import type { Vraag } from '../types';
import { heelGetal, kies, type Rng } from '../rng';
import { getalAfleiders, invulVraag, keuzeVraag, komma } from './helpers';

const NAMEN = ['Sem', 'Noa', 'Liam', 'Yara', 'Fenna', 'Mees', 'Zoë', 'Daan', 'Amir', 'Sara', 'Luuk', 'Eva'];

/** Alle rekengeneratoren krijgen dit binnen. */
type Gen = (niveau: number, rng: Rng) => Vraag;


export const optellen: Gen = (niveau, rng) => {
  const id = 'rekenen.optellen';
  if (niveau >= 5) {
    const a = heelGetal(rng, 11, 99) / 10;
    const b = heelGetal(rng, 11, 99) / 10;
    const som = Math.round((a + b) * 10) / 10;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${komma(a, 1)} + ${komma(b, 1)} = ?`,
      antwoord: komma(som, 1),
      uitleg: `Tel eerst de hele getallen op (${Math.floor(a)} + ${Math.floor(b)}) en daarna de cijfers achter de komma. Samen is dat ${komma(som, 1)}.`,
    });
  }

  // Per niveau een eigen bereik, zodat niveau 2 echt over de tien heen gaat en
  // niveau 4 niet toevallig een som van twee kleine getallen wordt.
  let a: number;
  let b: number;
  if (niveau <= 1) {
    a = heelGetal(rng, 1, 8);
    b = heelGetal(rng, 1, 9 - a);
  } else if (niveau === 2) {
    const som = heelGetal(rng, 11, 20);
    a = heelGetal(rng, Math.max(2, som - 9), 9);
    b = som - a;
  } else if (niveau === 3) {
    a = heelGetal(rng, 12, 88);
    b = heelGetal(rng, 12, Math.max(12, 99 - a));
  } else {
    a = heelGetal(rng, 120, 880);
    b = heelGetal(rng, 120, 880);
  }
  const som = a + b;

  if (niveau <= 2) {
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `${a} + ${b} = ?`,
      antwoord: String(som),
      afleiders: getalAfleiders(rng, som, niveau === 1 ? 3 : 5),
      uitleg:
        som > 10 && a < 10
          ? `Maak eerst tien vol: ${a} + ${10 - a} = 10, en dan nog ${b - (10 - a)} erbij is ${som}.`
          : `Begin bij ${a} en tel er ${b} bij op. Je komt uit op ${som}.`,
    });
  }
  const tientallen = Math.floor(b / 10) * 10;
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `${a} + ${b} = ?`,
    antwoord: String(som),
    uitleg: `Splits ${b} in ${tientallen} en ${b - tientallen}: ${a} + ${tientallen} = ${a + tientallen}, en daar nog ${b - tientallen} bij is ${som}.`,
  });
};

export const aftrekken: Gen = (niveau, rng) => {
  const id = 'rekenen.aftrekken';
  if (niveau >= 5) {
    const a = heelGetal(rng, 100, 999) / 10;
    const b = heelGetal(rng, 10, 999) / 10;
    const groot = Math.max(a, b);
    const klein = Math.min(a, b);
    const uitkomst = Math.round((groot - klein) * 10) / 10;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${komma(groot, 1)} − ${komma(klein, 1)} = ?`,
      antwoord: komma(uitkomst, 1),
      uitleg: `Zet de komma's onder elkaar en trek af: ${komma(groot, 1)} − ${komma(klein, 1)} = ${komma(uitkomst, 1)}.`,
    });
  }

  let a: number;
  let b: number;
  if (niveau <= 1) {
    a = heelGetal(rng, 3, 10);
    b = heelGetal(rng, 1, a - 1);
  } else if (niveau === 2) {
    // Over de tien heen: het antwoord blijft onder de 10, dus je moet lenen.
    a = heelGetal(rng, 11, 18);
    b = heelGetal(rng, a - 9, 9);
  } else if (niveau === 3) {
    a = heelGetal(rng, 30, 99);
    b = heelGetal(rng, 12, a - 10);
  } else {
    a = heelGetal(rng, 300, 999);
    b = heelGetal(rng, 110, a - 100);
  }
  const rest = a - b;

  if (niveau <= 2) {
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `${a} − ${b} = ?`,
      antwoord: String(rest),
      afleiders: getalAfleiders(rng, rest, niveau === 1 ? 3 : 5),
      uitleg:
        a > 10
          ? `Ga eerst terug naar tien: ${a} − ${a - 10} = 10, en dan nog ${b - (a - 10)} eraf is ${rest}.`
          : `Tel vanaf ${b} door naar ${a}: dat zijn ${rest} stappen.`,
    });
  }
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `${a} − ${b} = ?`,
    antwoord: String(rest),
    uitleg: `Reken andersom om te controleren: ${b} + ${rest} = ${a}. Dus het antwoord is ${rest}.`,
  });
};

const TAFELS_PER_NIVEAU: Record<number, number[]> = {
  1: [1, 2, 5, 10],
  2: [3, 4, 2, 5],
  3: [6, 7, 8, 9],
  4: [11, 12, 7, 8, 9],
  5: [3, 4, 6, 7, 8, 9, 11, 12],
};

export const tafels: Gen = (niveau, rng) => {
  const id = 'rekenen.tafels';
  const tafel = kies(rng, TAFELS_PER_NIVEAU[niveau] ?? TAFELS_PER_NIVEAU[3]);
  const factor = heelGetal(rng, 2, niveau >= 4 ? 12 : 10);
  const product = tafel * factor;
  if (niveau >= 5) {
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${tafel} × ? = ${product}`,
      antwoord: String(factor),
      uitleg: `Deel het antwoord door ${tafel}: ${product} : ${tafel} = ${factor}.`,
    });
  }
  return keuzeVraag(rng, {
    onderwerpId: id,
    niveau,
    stam: `${tafel} × ${factor} = ?`,
    antwoord: String(product),
    afleiders: [String(product + tafel), String(Math.max(1, product - tafel)), String(product + factor)],
    uitleg: `${tafel} × ${factor} betekent ${factor} keer ${tafel} bij elkaar. Dat is ${product}.`,
  });
};

export const delen: Gen = (niveau, rng) => {
  const id = 'rekenen.delen';
  if (niveau <= 2) {
    const deler = heelGetal(rng, 2, niveau === 1 ? 5 : 10);
    const uitkomst = heelGetal(rng, 2, 10);
    const totaal = deler * uitkomst;
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `${totaal} : ${deler} = ?`,
      antwoord: String(uitkomst),
      afleiders: getalAfleiders(rng, uitkomst, 4),
      uitleg: `Hoe vaak past ${deler} in ${totaal}? ${deler} × ${uitkomst} = ${totaal}, dus ${uitkomst} keer.`,
    });
  }
  if (niveau === 3) {
    const deler = heelGetal(rng, 3, 9);
    const uitkomst = heelGetal(rng, 3, 12);
    const rest = heelGetal(rng, 1, deler - 1);
    const totaal = deler * uitkomst + rest;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${totaal} : ${deler} = ? (geef alleen het hele getal, zonder de rest)`,
      antwoord: String(uitkomst),
      uitleg: `${deler} × ${uitkomst} = ${deler * uitkomst}, en er blijft ${rest} over. Het hele antwoord is ${uitkomst} rest ${rest}.`,
    });
  }
  const deler = niveau === 4 ? heelGetal(rng, 3, 9) : heelGetal(rng, 11, 25);
  const uitkomst = niveau === 4 ? heelGetal(rng, 20, 120) : heelGetal(rng, 20, 90);
  const totaal = deler * uitkomst;
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `${totaal} : ${deler} = ?`,
    antwoord: String(uitkomst),
    uitleg: `Doe het in stappen: ${deler} × 10 = ${deler * 10}, ${deler} × ${uitkomst} = ${totaal}. Het antwoord is ${uitkomst}.`,
  });
};

const TIJDWOORD = (u: number, m: number): string => {
  const uur12 = ((u + 11) % 12) + 1;
  const volgend = ((u % 12) + 1 === 13 ? 1 : (u % 12) + 1);
  if (m === 0) return `${uur12} uur`;
  if (m === 15) return `kwart over ${uur12}`;
  if (m === 30) return `half ${volgend}`;
  if (m === 45) return `kwart voor ${volgend}`;
  if (m < 30) return `${m} over ${uur12}`;
  return `${60 - m} voor ${volgend}`;
};

export const klokkijken: Gen = (niveau, rng) => {
  const id = 'rekenen.klokkijken';
  if (niveau >= 5) {
    const startU = heelGetal(rng, 8, 18);
    const startM = kies(rng, [0, 15, 30, 45]);
    const duur = kies(rng, [45, 75, 90, 105, 135]);
    const eind = startU * 60 + startM + duur;
    const eindU = Math.floor(eind / 60) % 24;
    const eindM = eind % 60;
    const tekst = `${String(eindU).padStart(2, '0')}:${String(eindM).padStart(2, '0')}`;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `Een film begint om ${String(startU).padStart(2, '0')}:${String(startM).padStart(2, '0')} en duurt ${duur} minuten. Hoe laat is de film afgelopen? (bijv. 14:35)`,
      antwoord: tekst,
      uitleg: `${duur} minuten is ${Math.floor(duur / 60)} uur en ${duur % 60} minuten. Vanaf ${String(startU).padStart(2, '0')}:${String(startM).padStart(2, '0')} kom je uit op ${tekst}.`,
    });
  }
  const minutenSet = niveau === 1 ? [0] : niveau === 2 ? [0, 30] : niveau === 3 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const u = heelGetal(rng, 1, 12);
  const m = kies(rng, minutenSet);
  const digitaal = `${String(u).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const goed = TIJDWOORD(u, m);
  const afleiders = [TIJDWOORD(u === 12 ? 1 : u + 1, m), TIJDWOORD(u, m === 0 ? 30 : 0), TIJDWOORD(u === 1 ? 12 : u - 1, m)].filter((t) => t !== goed);
  return keuzeVraag(rng, {
    onderwerpId: id,
    niveau,
    stam: `Op de klok staat ${digitaal}. Hoe zeg je dat?`,
    antwoord: goed,
    afleiders,
    uitleg: `${digitaal} spreek je uit als "${goed}".`,
  });
};

export const geld: Gen = (niveau, rng) => {
  const id = 'rekenen.geld';
  const naam = kies(rng, NAMEN);
  if (niveau <= 2) {
    const a = heelGetal(rng, 1, niveau === 1 ? 5 : 12);
    const b = heelGetal(rng, 1, niveau === 1 ? 5 : 12);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `${naam} heeft €${a} en krijgt er €${b} bij. Hoeveel heeft ${naam} nu?`,
      antwoord: `€${a + b}`,
      afleiders: getalAfleiders(rng, a + b, 4).map((x) => `€${x}`),
      uitleg: `€${a} + €${b} = €${a + b}.`,
    });
  }
  if (niveau === 3) {
    const prijs = heelGetal(rng, 150, 950) / 100;
    const wissel = Math.round((10 - prijs) * 100) / 100;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${naam} betaalt met een briefje van €10 voor iets van €${komma(prijs)}. Hoeveel wisselgeld krijgt ${naam} terug?`,
      antwoord: komma(wissel),
      eenheid: '€',
      uitleg: `10,00 − ${komma(prijs)} = ${komma(wissel)}. Tel maar door vanaf ${komma(prijs)} naar 10,00.`,
    });
  }
  if (niveau === 4) {
    const stuks = heelGetal(rng, 3, 7);
    const prijs = heelGetal(rng, 125, 675) / 100;
    const totaal = Math.round(stuks * prijs * 100) / 100;
    const wissel = Math.round((50 - totaal) * 100) / 100;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${naam} koopt ${stuks} boeken van €${komma(prijs)} en betaalt met €50. Hoeveel krijgt ${naam} terug?`,
      antwoord: komma(wissel),
      eenheid: '€',
      uitleg: `${stuks} × €${komma(prijs)} = €${komma(totaal)}. Dan 50,00 − ${komma(totaal)} = ${komma(wissel)}.`,
    });
  }
  const stuksA = heelGetal(rng, 3, 6);
  const prijsA = heelGetal(rng, 200, 600) / 100;
  const stuksB = stuksA + heelGetal(rng, 2, 4);
  const prijsB = Math.round(prijsA * stuksB * (heelGetal(rng, 85, 115) / 100) * 100) / 100 / stuksB;
  const perA = prijsA;
  const perB = Math.round(prijsB * 100) / 100;
  const goedkoopste = perA <= perB ? 'A' : 'B';
  return keuzeVraag(rng, {
    onderwerpId: id,
    niveau,
    stam: `Pak A: ${stuksA} stuks voor €${komma(perA * stuksA)}. Pak B: ${stuksB} stuks voor €${komma(perB * stuksB)}. Welk pak is per stuk goedkoper?`,
    antwoord: `Pak ${goedkoopste}`,
    afleiders: ['Pak A', 'Pak B', 'Ze zijn even duur'],
    uitleg: `Reken de stukprijs uit: A is €${komma(perA)} per stuk, B is €${komma(perB)} per stuk. Pak ${goedkoopste} is voordeliger.`,
  });
};

const MAAT_NIVEAUS: Record<number, Array<[string, string, number]>> = {
  1: [['m', 'cm', 100], ['cm', 'mm', 10]],
  2: [['m', 'cm', 100], ['cm', 'mm', 10], ['km', 'm', 1000]],
  3: [['km', 'm', 1000], ['kg', 'g', 1000], ['l', 'ml', 1000]],
  4: [['kg', 'g', 1000], ['l', 'ml', 1000], ['l', 'cl', 100], ['m', 'mm', 1000]],
  5: [['km', 'cm', 100000], ['kg', 'mg', 1000000], ['m3', 'l', 1000]],
};

export const meten: Gen = (niveau, rng) => {
  const id = 'rekenen.meten';
  const [groot, klein, factor] = kies(rng, MAAT_NIVEAUS[niveau] ?? MAAT_NIVEAUS[3]);
  const waarde = heelGetal(rng, 2, 9) * (niveau >= 3 ? heelGetal(rng, 1, 9) : 1);
  const uitkomst = waarde * factor;
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `${waarde} ${groot} = ? ${klein}`,
    antwoord: String(uitkomst),
    eenheid: klein,
    uitleg: `1 ${groot} is ${factor} ${klein}. Dus ${waarde} × ${factor} = ${uitkomst} ${klein}.`,
  });
};

const ggd = (a: number, b: number): number => (b === 0 ? a : ggd(b, a % b));

export const breuken: Gen = (niveau, rng) => {
  const id = 'rekenen.breuken';
  if (niveau === 1) {
    const noemer = kies(rng, [2, 3, 4, 5, 6, 8]);
    const teller = heelGetal(rng, 1, noemer - 1);
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Een pizza is in ${noemer} gelijke stukken gesneden. Je eet er ${teller} op. Welk deel heb je gegeten?`,
      antwoord: `${teller}/${noemer}`,
      afleiders: [`${noemer}/${teller}`, `${teller}/${noemer + 1}`, `${teller + 1}/${noemer}`],
      uitleg: `Onder de streep staat in hoeveel stukken het verdeeld is (${noemer}), boven de streep hoeveel je hebt (${teller}). Dus ${teller}/${noemer}.`,
    });
  }
  if (niveau === 2) {
    const n = kies(rng, [4, 6, 8, 10, 12]);
    const a = heelGetal(rng, 1, n - 1);
    const b = heelGetal(rng, 1, n - 1);
    if (a === b) return breuken(niveau, rng);
    const groter = a > b ? `${a}/${n}` : `${b}/${n}`;
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Welke breuk is groter: ${a}/${n} of ${b}/${n}?`,
      antwoord: groter,
      afleiders: [`${a}/${n}`, `${b}/${n}`, 'Ze zijn even groot'],
      uitleg: `De noemers zijn gelijk (${n}), dus je kijkt naar de teller. ${Math.max(a, b)} is meer dan ${Math.min(a, b)}, dus ${groter} is groter.`,
    });
  }
  if (niveau === 3) {
    const deel = heelGetal(rng, 2, 6);
    const t = heelGetal(rng, 1, 5) * deel;
    const n = (heelGetal(rng, 6, 11)) * deel;
    const d = ggd(t, n);
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `Vereenvoudig de breuk ${t}/${n} zo ver mogelijk. (schrijf als bijv. 3/4)`,
      antwoord: `${t / d}/${n / d}`,
      uitleg: `Deel teller en noemer allebei door ${d}: ${t}:${d} = ${t / d} en ${n}:${d} = ${n / d}. Dat wordt ${t / d}/${n / d}.`,
    });
  }
  if (niveau === 4) {
    const n = kies(rng, [5, 6, 8, 10, 12]);
    const a = heelGetal(rng, 1, n - 2);
    const b = heelGetal(rng, 1, n - a - 1);
    const som = a + b;
    const d = ggd(som, n);
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${a}/${n} + ${b}/${n} = ? (zo eenvoudig mogelijk)`,
      antwoord: `${som / d}/${n / d}`,
      uitleg: `Bij gelijke noemers tel je alleen de tellers op: ${a} + ${b} = ${som}, dus ${som}/${n}${d > 1 ? ` = ${som / d}/${n / d}` : ''}.`,
    });
  }
  const noemer = kies(rng, [2, 3, 4, 5, 8]);
  const teller = heelGetal(rng, 1, noemer - 1);
  const totaal = noemer * heelGetal(rng, 4, 25);
  const uitkomst = (totaal / noemer) * teller;
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `Hoeveel is ${teller}/${noemer} van ${totaal}?`,
    antwoord: String(uitkomst),
    uitleg: `Eerst 1/${noemer} van ${totaal}: dat is ${totaal / noemer}. Dan × ${teller} = ${uitkomst}.`,
  });
};

export const procenten: Gen = (niveau, rng) => {
  const id = 'rekenen.procenten';
  if (niveau <= 2) {
    const pct = kies(rng, niveau === 1 ? [10, 25, 50] : [10, 20, 25, 50, 75]);
    const basis = heelGetal(rng, 1, 20) * 20;
    const uitkomst = (basis * pct) / 100;
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `Hoeveel is ${pct}% van ${basis}?`,
      antwoord: String(uitkomst),
      afleiders: getalAfleiders(rng, uitkomst, Math.max(2, Math.round(uitkomst / 2))),
      uitleg: `${pct}% betekent ${pct} van elke 100. ${basis} : 100 = ${basis / 100}, en ${basis / 100} × ${pct} = ${uitkomst}.`,
    });
  }
  if (niveau === 3) {
    const prijs = heelGetal(rng, 4, 40) * 5;
    const korting = kies(rng, [10, 15, 20, 25, 30, 40]);
    const nieuw = Math.round(prijs * (1 - korting / 100) * 100) / 100;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `Een jas van €${prijs} is ${korting}% afgeprijsd. Wat kost de jas nu?`,
      antwoord: komma(nieuw),
      eenheid: '€',
      uitleg: `De korting is ${korting}% van €${prijs} = €${komma((prijs * korting) / 100)}. €${prijs} − €${komma((prijs * korting) / 100)} = €${komma(nieuw)}.`,
    });
  }
  if (niveau === 4) {
    const basis = heelGetal(rng, 4, 40) * 25;
    const stijging = kies(rng, [5, 8, 12, 15, 20]);
    const nieuw = Math.round(basis * (1 + stijging / 100) * 100) / 100;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `Een prijs van €${basis} gaat ${stijging}% omhoog. Wat is de nieuwe prijs?`,
      antwoord: komma(nieuw),
      eenheid: '€',
      uitleg: `${stijging}% van €${basis} is €${komma((basis * stijging) / 100)}. Erbij op: €${komma(nieuw)}.`,
    });
  }
  const geheel = heelGetal(rng, 4, 25) * 20;
  const pct = kies(rng, [5, 10, 15, 20, 25, 40, 60]);
  const deel = (geheel * pct) / 100;
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `${deel} van de ${geheel} leerlingen doet mee. Hoeveel procent is dat?`,
    antwoord: String(pct),
    eenheid: '%',
    uitleg: `${deel} : ${geheel} = ${komma(deel / geheel, 2)}. Keer 100 is ${pct}%.`,
  });
};

export const verhaaltjes: Gen = (niveau, rng) => {
  const id = 'rekenen.verhaaltjes';
  const naam = kies(rng, NAMEN);
  const naam2 = kies(rng, NAMEN.filter((n) => n !== naam));
  if (niveau <= 2) {
    const a = heelGetal(rng, 4, niveau === 1 ? 12 : 40);
    const b = heelGetal(rng, 2, Math.max(2, a - 1));
    return keuzeVraag(rng, {
      onderwerpId: id,
      niveau,
      stam: `${naam} heeft ${a} knikkers en geeft er ${b} aan ${naam2}. Hoeveel knikkers houdt ${naam} over?`,
      antwoord: String(a - b),
      afleiders: [String(a + b), String(a - b + 1), String(Math.max(0, a - b - 2))],
      uitleg: `"Geeft weg" betekent aftrekken: ${a} − ${b} = ${a - b}.`,
    });
  }
  if (niveau === 3) {
    const dozen = heelGetal(rng, 3, 9);
    const per = heelGetal(rng, 4, 12);
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `${naam} stapelt ${dozen} dozen met elk ${per} appels. Hoeveel appels zijn dat samen?`,
      antwoord: String(dozen * per),
      uitleg: `"Elk" wijst op keersommen: ${dozen} × ${per} = ${dozen * per}.`,
    });
  }
  if (niveau === 4) {
    const kinderen = heelGetal(rng, 4, 12);
    const per = heelGetal(rng, 3, 9);
    const extra = heelGetal(rng, 1, per - 1);
    const totaal = kinderen * per + extra;
    return invulVraag({
      onderwerpId: id,
      niveau,
      stam: `Er zijn ${totaal} snoepjes en ${kinderen} kinderen. Iedereen krijgt er evenveel. Hoeveel snoepjes krijgt elk kind?`,
      antwoord: String(per),
      uitleg: `${totaal} : ${kinderen} = ${per}, met ${extra} snoepjes over. Elk kind krijgt er ${per}.`,
    });
  }
  const prijs = heelGetal(rng, 3, 12);
  const stuks = heelGetal(rng, 4, 12);
  const korting = kies(rng, [10, 20, 25]);
  const totaal = prijs * stuks;
  const eind = Math.round(totaal * (1 - korting / 100) * 100) / 100;
  return invulVraag({
    onderwerpId: id,
    niveau,
    stam: `${naam} koopt ${stuks} pennen van €${prijs} per stuk en krijgt ${korting}% korting op het totaal. Hoeveel betaalt ${naam}?`,
    antwoord: komma(eind),
    eenheid: '€',
    uitleg: `Totaal zonder korting: ${stuks} × €${prijs} = €${totaal}. Korting: ${korting}% = €${komma((totaal * korting) / 100)}. Te betalen: €${komma(eind)}.`,
  });
};

export const REKENEN_GENERATOREN: Record<string, Gen> = {
  'rekenen.optellen': optellen,
  'rekenen.aftrekken': aftrekken,
  'rekenen.tafels': tafels,
  'rekenen.delen': delen,
  'rekenen.klokkijken': klokkijken,
  'rekenen.geld': geld,
  'rekenen.meten': meten,
  'rekenen.breuken': breuken,
  'rekenen.procenten': procenten,
  'rekenen.verhaaltjes': verhaaltjes,
};

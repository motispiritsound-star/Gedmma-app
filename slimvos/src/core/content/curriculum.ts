import type { Groep, Onderwerp, Vak, VakId } from '../types';
import { MAX_NIVEAU } from '../types';

export const VAKKEN: Vak[] = [
  {
    id: 'rekenen',
    naam: 'Rekenen',
    emoji: '🔢',
    kleur: '#3B82F6',
    omschrijving: 'Sommen, tafels, breuken, klok en geld',
  },
  {
    id: 'taal',
    naam: 'Taal & spelling',
    emoji: '✏️',
    kleur: '#EC4899',
    omschrijving: 'Spelling, werkwoorden en woordenschat',
  },
  {
    id: 'lezen',
    naam: 'Begrijpend lezen',
    emoji: '📖',
    kleur: '#F59E0B',
    omschrijving: 'Teksten lezen en vragen beantwoorden',
  },
  {
    id: 'engels',
    naam: 'Engels',
    emoji: '🇬🇧',
    kleur: '#10B981',
    omschrijving: 'Woorden en zinnen in het Engels',
  },
  {
    id: 'wereld',
    naam: 'Wereldoriëntatie',
    emoji: '🌍',
    kleur: '#7C5CD6',
    omschrijving: 'Topografie, geschiedenis en natuur',
  },
  {
    id: 'studie',
    naam: 'Studievaardigheden',
    emoji: '📊',
    kleur: '#C2410C',
    omschrijving: 'Grafieken, kaarten en informatie opzoeken',
  },
];

export const ONDERWERPEN: Onderwerp[] = [
  // ---- Rekenen ----
  { id: 'rekenen.optellen', vak: 'rekenen', naam: 'Optellen', emoji: '➕', groepen: [3, 4, 5, 6, 7, 8], doel: 'Getallen bij elkaar optellen, van t/m 10 tot kommagetallen.' },
  { id: 'rekenen.aftrekken', vak: 'rekenen', naam: 'Aftrekken', emoji: '➖', groepen: [3, 4, 5, 6, 7, 8], doel: 'Getallen van elkaar afhalen, met en zonder lenen.' },
  { id: 'rekenen.tafels', vak: 'rekenen', naam: 'Tafels', emoji: '✖️', groepen: [4, 5, 6, 7, 8], doel: 'De tafels van 1 t/m 12 uit je hoofd kennen.' },
  { id: 'rekenen.delen', vak: 'rekenen', naam: 'Delen', emoji: '➗', groepen: [5, 6, 7, 8], doel: 'Delen met en zonder rest, en staartdelingen.' },
  { id: 'rekenen.klokkijken', vak: 'rekenen', naam: 'Klokkijken', emoji: '🕒', groepen: [3, 4, 5, 6], doel: 'Analoge en digitale tijd lezen en omrekenen.' },
  { id: 'rekenen.geld', vak: 'rekenen', naam: 'Geld', emoji: '💶', groepen: [3, 4, 5, 6], doel: 'Bedragen optellen en wisselgeld uitrekenen.' },
  { id: 'rekenen.meten', vak: 'rekenen', naam: 'Meten & maten', emoji: '📏', groepen: [5, 6, 7, 8], doel: 'Omrekenen tussen mm, cm, m, km, gram en liter.' },
  { id: 'rekenen.breuken', vak: 'rekenen', naam: 'Breuken', emoji: '🍕', groepen: [6, 7, 8], doel: 'Breuken vergelijken, vereenvoudigen en optellen.' },
  { id: 'rekenen.procenten', vak: 'rekenen', naam: 'Procenten', emoji: '％', groepen: [7, 8], doel: 'Percentages van een getal en kortingen berekenen.' },
  { id: 'rekenen.verhaaltjes', vak: 'rekenen', naam: 'Verhaaltjessommen', emoji: '🧩', groepen: [4, 5, 6, 7, 8], doel: 'Uit een verhaaltje halen welke som je moet maken.' },
  { id: 'rekenen.getalbegrip', vak: 'rekenen', naam: 'Getalbegrip', emoji: '🔟', groepen: [3, 4, 5, 6, 7, 8], doel: 'Plaatswaarde, afronden, vergelijken en negatieve getallen.' },
  { id: 'rekenen.oppervlakte', vak: 'rekenen', naam: 'Omtrek & oppervlakte', emoji: '⬛', groepen: [6, 7, 8], doel: 'Omtrek, oppervlakte en inhoud van eenvoudige figuren.' },
  { id: 'rekenen.verhoudingen', vak: 'rekenen', naam: 'Verhoudingen', emoji: '⚖️', groepen: [6, 7, 8], doel: 'Verhoudingstabellen, schaal en recepten omrekenen.' },

  // ---- Taal ----
  { id: 'taal.spelling', vak: 'taal', naam: 'Spelling', emoji: '🔤', groepen: [3, 4, 5, 6, 7, 8], doel: 'Woorden goed schrijven: ei/ij, au/ou, d/t en meer.' },
  { id: 'taal.werkwoorden', vak: 'taal', naam: 'Werkwoordspelling', emoji: '🏃', groepen: [6, 7, 8], doel: "'t Kofschip, tegenwoordige en verleden tijd." },
  { id: 'taal.woordenschat', vak: 'taal', naam: 'Woordenschat', emoji: '💬', groepen: [3, 4, 5, 6, 7, 8], doel: 'Wat betekent dit woord? Steeds moeilijkere woorden.' },
  { id: 'taal.ontleden', vak: 'taal', naam: 'Ontleden', emoji: '🔍', groepen: [6, 7, 8], doel: 'Onderwerp, persoonsvorm en woordsoorten herkennen.' },
  { id: 'taal.leestekens', vak: 'taal', naam: 'Leestekens', emoji: '❓', groepen: [5, 6, 7, 8], doel: 'Hoofdletters, punten, komma\u2019s en aanhalingstekens.' },
  { id: 'taal.figuurlijk', vak: 'taal', naam: 'Spreekwoorden', emoji: '🗯️', groepen: [6, 7, 8], doel: 'Wat betekenen spreekwoorden en uitdrukkingen?' },

  // ---- Begrijpend lezen ----
  { id: 'lezen.begrijpend', vak: 'lezen', naam: 'Teksten begrijpen', emoji: '📄', groepen: [3, 4, 5, 6, 7, 8], doel: 'Een tekst lezen en er vragen over beantwoorden.' },

  // ---- Engels ----
  { id: 'engels.woorden', vak: 'engels', naam: 'Woorden', emoji: '🔡', groepen: [5, 6, 7, 8], doel: 'Engelse woorden vertalen naar het Nederlands en terug.' },
  { id: 'engels.zinnen', vak: 'engels', naam: 'Zinnen', emoji: '🗣️', groepen: [6, 7, 8], doel: 'Korte Engelse zinnen begrijpen en aanvullen.' },
  { id: 'engels.werkwoorden', vak: 'engels', naam: 'Werkwoorden', emoji: '🏃', groepen: [6, 7, 8], doel: 'De belangrijkste Engelse werkwoordsvormen.' },

  // ---- Wereldoriëntatie ----
  { id: 'wereld.topografie', vak: 'wereld', naam: 'Topografie', emoji: '🗺️', groepen: [5, 6, 7, 8], doel: 'Provincies, hoofdsteden en landen van Europa.' },
  { id: 'wereld.geschiedenis', vak: 'wereld', naam: 'Geschiedenis', emoji: '🏰', groepen: [5, 6, 7, 8], doel: 'De tien tijdvakken van hunebed tot heden.' },
  { id: 'wereld.natuur', vak: 'wereld', naam: 'Natuur & techniek', emoji: '🌱', groepen: [3, 4, 5, 6, 7, 8], doel: 'Dieren, planten, je lichaam en hoe dingen werken.' },
  { id: 'wereld.wereldtopo', vak: 'wereld', naam: 'De wereld', emoji: '🌏', groepen: [7, 8], doel: 'Werelddelen, oceanen en landen buiten Europa.' },
  { id: 'wereld.burgerschap', vak: 'wereld', naam: 'Samenleven', emoji: '🤝', groepen: [6, 7, 8], doel: 'Democratie, regels, rechten en samen beslissen.' },

  // ---- Studievaardigheden ----
  { id: 'studie.grafieken', vak: 'studie', naam: 'Tabellen & grafieken', emoji: '📊', groepen: [5, 6, 7, 8], doel: 'Aflezen wat een tabel of grafiek je vertelt.' },
  { id: 'studie.kaartlezen', vak: 'studie', naam: 'Kaartlezen', emoji: '🧭', groepen: [5, 6, 7, 8], doel: 'Legenda, schaal en windrichtingen gebruiken.' },
  { id: 'studie.informatie', vak: 'studie', naam: 'Informatie zoeken', emoji: '🔎', groepen: [6, 7, 8], doel: 'Woordenboek, inhoudsopgave en betrouwbare bronnen.' },
];

const OP_ID = new Map(ONDERWERPEN.map((o) => [o.id, o]));

export function vindOnderwerp(id: string): Onderwerp | undefined {
  return OP_ID.get(id);
}

export function vindVak(id: VakId): Vak | undefined {
  return VAKKEN.find((v) => v.id === id);
}

export function onderwerpenVoorGroep(groep: Groep): Onderwerp[] {
  return ONDERWERPEN.filter((o) => o.groepen.includes(groep));
}

export function onderwerpenVoorVak(vak: VakId, groep: Groep): Onderwerp[] {
  return onderwerpenVoorGroep(groep).filter((o) => o.vak === vak);
}

export function vakkenVoorGroep(groep: Groep): Vak[] {
  const beschikbaar = new Set(onderwerpenVoorGroep(groep).map((o) => o.vak));
  return VAKKEN.filter((v) => beschikbaar.has(v.id));
}

/**
 * Het niveau waarop een kind uit een bepaalde groep begint.
 * De positie van de groep binnen `onderwerp.groepen` bepaalt het startniveau,
 * zodat een groep-8'er bij optellen niet met sommen t/m 10 begint.
 */
export function startNiveau(onderwerp: Onderwerp, groep: Groep): number {
  const index = onderwerp.groepen.indexOf(groep);
  if (index < 0) {
    // Onderwerp hoort niet bij deze groep: kies het dichtstbijzijnde uiteinde.
    return groep < onderwerp.groepen[0] ? 1 : MAX_NIVEAU;
  }
  return Math.min(index + 1, MAX_NIVEAU);
}
